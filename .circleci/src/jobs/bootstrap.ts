import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';
import * as Utils from '../utils';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'bootstrap',
  SageCIExecutors.Node.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('pass', 'boolean', true)
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    new CircleCI.commands.Run({
      name: 'Install native dependencies',
      command: `
sudo apt update
sudo apt install -y libxtst-dev libpng++-dev
`
    }),
    SageCICommands.NpmAuth.reuseCommand(),
    SageCICommands.RestoreBuildCache.reuseCommand({}),
    SageCICommands.InstallLerna.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Install Dependencies',
      no_output_timeout: '60m',
      command: `
if [ -d "./node_modules" ]; then
  echo 'Dependencies cached. Skipping.'
else
  lerna bootstrap -- --pure-lockfile
fi
`
    }),
    new CircleCI.commands.Run({
      name: 'Build Dependencies',
      command: `
lerna run buildAsDependency --stream
`
    }),
    SageCICommands.SaveBuildCache.reuseCommand({}),
    new CircleCI.commands.workspace.Persist({
      root: '~/project',
      paths: [
        ...Utils.listPackages()
          .filter((pkg) => pkg.startsWith('shared/'))
          .map((pkg) => `packages/${pkg}/.build`),
        'yarn.lock'
      ]
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
