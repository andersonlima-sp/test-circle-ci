import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'build-messaging-server',
  SageCIExecutors.Node.reuseExecutor({}),
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
    SageCICommands.InstallLerna.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Build Messaging Server',
      command: `
STAGE=<< parameters.stage >> lerna run build --scope << parameters.package_name >> --stream;
`
    }),
    new CircleCI.commands.Run({
      name: 'Zip Build Artifact',
      command: `
cd ./packages/<< parameters.package_path >>/..
if [ -d "./messaging" ]; then
  sudo apt install zip
  zip -r messaging.zip messaging
fi
`
    }),
    new CircleCI.commands.Run({
      name: 'Upload Build Artifact to S3',
      command: `
cd ./packages/<< parameters.package_path >>/..
if [ -f "./messaging.zip" ]; then
  AWS_PROFILE=tooling aws s3 sync . "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>/" --exclude='*' --include='*messaging.zip';
  rm messaging.zip;
fi
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
