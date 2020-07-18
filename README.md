# Pact test API automation

```

# Start the Pact Broker 
git clone https://github.com/pact-foundation/pact-broker-docker
Run to start the pact broker running at localhost:9292
```
docker-compose up
```

To run in local environment with dependencies setup
    npm i 

To run the consumer pact test which will generate the pact file to ./pacts/iconsumer-iprovider.json

    npm run test:pact

To publish the pact file to the pact broker 

    npm run publish:pact

To run the provider pact test to verify the pact file

    npm run verify:pact

User API
The APIs are described below, including a bunch of cURL statements to invoke them.
```
curl --location --request POST 'https://xxxx/api/admin/users?username=mike&firstName=mike&lastName=tan&password=CukeStudio)123&email=mike@amazon.com&organizations=e290e5c2-bd43-11ea-882a-cd26553a22fa&role=ROLE_KCP_DUMMY' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx' \
--data-raw ''
```
Structure:

```bash
├── package.json
├── README.md
├── pactSetup.js
├── pactTestWrapper.js
├── publishPacts.js
├── verifyPacts.js
└── pacts
    ├── iConsumer-iProvider.json (generated by pact)
└── __pact-tests__
        ├── user_api.test.pact.js
        ├── ...
    
```


The nodejs test framework used is jest 

The testsuites are found in the __pact-tests__ folder

The Pact server is defined at pactSetup.js:
    1. The mock server is 127.0.0.1:8991

    2. While we are writing a consumer test, do not be mis-led by the provider variable.
    This is where we define the pact server which mocks our provider and will respond to API requests we make to it.

    3. Pact will start a service listening on port 8891 writing logs to a logs/ directory
    where the test are executed from and will create the actual pact contract file in the pacts/ directory.

    4. Pact will use the latest specification version  (spec: 2)

Test Setup:

    provider.setup())

    Before our tests can actually run, we need to start the Pact service and provide it with 
    our expected interactions. 

    Example: authentication_api.test.pact.js

        ```const interaction = {
        state: 'Authenticate with valid clientId',
        uponReceiving: 'access_token, token_type and refresh_token',

     
          headers: {
            'Content-Type': 'application/json',
            'X-Active-Organization': Matchers.like('42cd1c1f-112d-11ea-8153-0242ac120002'),
            'Authorization': Matchers.like('Basic cHVibGljQ2xpZW50SWQ6'),
          },
        withRequest: {
            method: 'POST',
            path: urlpath,
            param: {
                "grant-type": Matchers.like("password"),
                "password": Matchers.like("pass"),
                "username": Matchers.like("kcp-admin-taiger"),
          },
        },
        willRespondWith: {
            status: 200,
            headers: {
            'Content-Type': 'application/json;charset=UTF-8'
            },
            body: like(EXPECTED_BODY),
        },
        };
        return provider.addInteraction(interaction);
        ```

        1. This is where we define our expectations. Any mis-match between expected interactions will cause the test to throw an error when being asserted

        2. withRequest and willRespondWith define the expected interaction between API consumer and provider

        3. withRequest part is defining what the consumer API is expected to send and we use the capability from the pact library known as Matchers to allow some flexibility on the provider implementation of the contract


Consumer Test:

        ```
        // add expectations
        it('returns a successfully body',() => {
        return axios.request({
            method: 'POST',
            baseURL: getApiEndpoint(),
            url: urlpath,
            headers: {
                Accept: '*/*',
                'content-type': 'application/json',
            },
            data: BODY,
            }) 
            .then((response) => {
                expect(response.headers['content-type']).toEqual('application/json;charset=UTF-8');
                expect(response.data).toEqual(EXPECTED_BODY);
                expect(response.status).toEqual(200);
            })
            .then(() => provider.verify())
        })
        ```

        1. This is our actual consumer test where we use the axios.request to make HTTP requests to the mocked API service that the pact library created for us.

        This is the actual expected usage in real world where fire a API call to the provider
        curl --location --request POST 'https://xxxx.io/api/admin/users?username=mike&firstName=mike&lastName=tan&password=CukeStudio)123&email=mike@amazon.com&organizations=e290e5c2-bd43-11ea-882a-cd26553a22fa&role=ROLE_KCP_DUMMY' \
        --header 'Content-Type: application/json' \
        --header 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxx' \
        --data-raw ''           

        2. We assert with provider.verify()) that all expected interactions have been fulfilled by making sure it doesn't throw an error and conclude the test.


Test Teardown:

    provider.finalize())

    After running the test, you have a pact file in the pacts/ directory that you can collaborate with your provider.


reference: 
https://github.com/DiUS/pact-workshop-js
https://github.com/pact-foundation/pact-js/tree/master/examples/jest


Issue:
``` FAIL  provider/verify.pact.js
  Pact Verification
    ✕ should validate the expectations of our consumer (833ms)

  ● Pact Verification › should validate the expectations of our consumer
  Verifying a pact between iConsumer and iProvider

      Given Create a new user
        uuid and username
          with POST /api/uaa/admin/users
            returns a response which

              has status code 201 (FAILED - 1)

              has a matching body (FAILED - 2)
              includes headers

                "Content-Type" which equals "application/json" (FAILED - 3)

                "Authorization" which is an instance of String (FAILED - 4)


    Failures:

      1) Verifying a pact between iConsumer and iProvider Given Create a new user uuid and username with POST /api/uaa/admin/users returns a response which has status code 201
         Failure/Error: set_up_provider_states interaction.provider_states, options[:consumer]

         Pact::ProviderVerifier::SetUpProviderStateError:
           Error setting up provider state 'Create a new user' for consumer 'iConsumer' at http://localhost:51899/_pactSetup. response status=500 response body=<!DOCTYPE html>
           <html lang="en">
           <head>
           <meta charset="utf-8">
           <title>Error</title>
           </head>
           <body>
           <pre>ReferenceError: token is not defined<br> &nbsp; &nbsp;at requestFilter (/Users/laymui/dev/taiger/kcp-pact-consumer-test-js/provider/verify
           Jest did not exit one second after the test run has completed.

            This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.
```
