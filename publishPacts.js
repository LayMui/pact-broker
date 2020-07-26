
let publisher = require("@pact-foundation/pact-node")
let path = require("path")
//const { exec } = require("child_process");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

if (process.env.CI !== "true") {
  console.log("skipping Pact publish as not on CI...")
  process.exit(0)
}


//const gitSha = exec("git rev-parse HEAD")
//const branch = exec("git rev-parse --abbrev-ref HEAD")

async function getGitSha() {
  const { stdout, stderr } = await exec('git rev-parse HEAD');
  console.log('stdout:', stdout);
  console.error('stderr:', stderr);
  return stdout;
}

const gitsha = getGitSha();
console.log('GITSHA: ' + gitsha);

let opts = {
  providerBaseUrl: "http://localhost:8082",
  pactFilesOrDirs: [path.resolve(process.cwd(), "pacts")],
  pactBroker: process.env.PACT_BROKER_URL,
  pactBrokerUrl: process.env.PACT_BROKER_TOKEN,
  check_for_potential_duplicate_pacticipant_names: "false",
  consumerVersion:  "2.0.0",
 // consumerVersion: gitSha,
  //tags: [branch],
}

publisher.publishPacts(opts)

