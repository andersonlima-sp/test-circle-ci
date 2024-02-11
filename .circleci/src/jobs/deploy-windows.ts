import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'deploy-windows',
  SageCIExecutors.Node.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('package_name', 'string'),
    new CircleCI.parameters.CustomParameter('package_path', 'string'),
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    SageCICommands.DownloadAwsCli.reuseCommand(),
    SageCICommands.ConfigureAws.reuseCommand({
      stage: '<< parameters.stage >>'
    }),
    new CircleCI.commands.Run({
      name: 'Dump Build Artifact on S3',
      command: `
cd ./packages/<< parameters.package_path >>
AWS_PROFILE=tooling aws s3 sync "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>/windows-prerelease" "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>/windows" --include='*.exe';
cd ../../..
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
