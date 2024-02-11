import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'deploy-server',
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
      name: 'Deploy',
      no_output_timeout: '60m',
      command: `
cd ./packages/<< parameters.package_path >>
STAGE=<< parameters.stage >> BRANCH=$CIRCLE_BRANCH yarn deploy
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
