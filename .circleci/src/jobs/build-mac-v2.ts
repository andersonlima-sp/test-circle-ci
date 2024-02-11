import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'build-mac-v2',
  SageCIExecutors.MacOS.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('package_name', 'string'),
    new CircleCI.parameters.CustomParameter('package_path', 'string'),
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging'),
    new CircleCI.parameters.CustomParameter('application_type', 'string')
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    new CircleCI.commands.Run({
      name: 'Install Python 3.10',
      command: `
pyenv install 3.10
pyenv global 3.10
`
    }),
    new CircleCI.commands.Run({
      name: 'Download NVM',
      command: `
set +e
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"
echo 'export NVM_DIR="$HOME/.nvm"' >> $BASH_ENV
echo '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"' >> $BASH_ENV
`
    }),
    new CircleCI.commands.Run({
      name: 'Install Node 16.13',
      command: `
nvm install 16.13.0
nvm use 16.13.0
nvm alias default 16.13.0
node -v
`
    }),
    SageCICommands.NpmAuth.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Install AWS CLI',
      command: `
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle-1.27.101.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
`
    }),
    SageCICommands.ConfigureAws.reuseCommand({
      stage: '<< parameters.stage >>'
    }),
    SageCICommands.InstallLerna.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Install Dependencies',
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
      command: `lerna run buildAsDependency --stream`
    }),
    new CircleCI.commands.Run({
      name: 'Build Electron App',
      command: `
cd ./packages/<< parameters.package_path >>
STAGE=<< parameters.stage >> yarn build:<< parameters.application_type >>:mac
cd ../../..
`
    }),
    new CircleCI.commands.Run({
      name: 'Dump Build Artifact on S3',
      command: `
cd ./packages/<< parameters.package_path >>
AWS_PROFILE=tooling aws s3 sync ./dist/ "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>/mac-<< parameters.application_type >>" --include='*.dmg';
cd ../../..
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
