import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'deploy',
  SageCIExecutors.Node.reuseExecutor({ resource_class: 'large' }),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('package_name', 'string'),
    new CircleCI.parameters.CustomParameter('package_path', 'string'),
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    SageCICommands.NpmAuth.reuseCommand(),
    SageCICommands.DownloadAwsCli.reuseCommand(),
    SageCICommands.ConfigureAws.reuseCommand({
      stage: '<< parameters.stage >>'
    }),
    new CircleCI.commands.workspace.Attach({ at: '~/project' }),
    SageCICommands.RestoreBuildCache.reuseCommand({}),
    new CircleCI.commands.Run({
      name: 'Download Artifact',
      command: `
cd ./packages/<< parameters.package_path >>

PACKAGE_VERSION=$(PACKAGE_PATH=~/project/packages/<< parameters.package_path >> node ~/project/scripts/printPackageVersion)

echo "Getting state"

export ARTIFACT_PATH="s3://vysta-devops/artifacts/$CIRCLE_SHA1/<< parameters.package_path >>/$PACKAGE_VERSION";

echo "Artifact Path:"
echo "$ARTIFACT_PATH"
AWS_PROFILE=tooling aws s3 sync $ARTIFACT_PATH .      
`
    }),
    new CircleCI.commands.Run({
      name: 'Unzip Artifact',
      command: `
cd ./packages/<< parameters.package_path >>
if [[ -d "./.build" || -d "./.sst" ]]; then
  echo "Artifact already unzipped"
else
  unzip build.zip
fi
`
    }),
    new CircleCI.commands.Run({
      name: 'Deploy',
      command: `
cd ./packages/<< parameters.package_path >>
STAGE=<< parameters.stage >> BRANCH=$CIRCLE_BRANCH yarn deploy
`,
      no_output_timeout: '60m'
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
