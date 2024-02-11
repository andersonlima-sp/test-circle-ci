import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'build',
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
    SageCICommands.InstallLerna.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Test',
      command: `lerna run test --scope << parameters.package_name >> --stream`
    }),
    new CircleCI.commands.Run({
      name: 'Build',
      command: `STAGE=<< parameters.stage >> lerna run build --scope << parameters.package_name >> --stream`
    }),
    new CircleCI.commands.Run({
      name: 'Zip Build Artifact',
      command: `
cd ./packages/<< parameters.package_path >>
if [[ -d "./.build" || -d "./.sst" ]]; then
  sudo apt install zip
  zip -r build.zip ./.build ./.sst ./.env.local ./.next ./out
fi
`
    }),
    new CircleCI.commands.Run({
      name: 'Upload Build Artifact to S3',
      command: `
cd ./packages/<< parameters.package_path >>
if [[ -d "./.build" || -d "./.sst" ]]; then
  PACKAGE_VERSION=$(PACKAGE_PATH=~/project/packages/<< parameters.package_path >> node ~/project/scripts/printPackageVersion)
  AWS_PROFILE=tooling aws s3 sync . "s3://vysta-devops/artifacts/$CIRCLE_SHA1/<< parameters.package_path >>/$PACKAGE_VERSION" --exclude='*' --include='*build.zip'
fi
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
