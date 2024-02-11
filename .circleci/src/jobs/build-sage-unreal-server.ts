import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'build-sage-unreal-server',
  SageCIExecutors.Windows.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    new CircleCI.commands.Run({
      name: 'Install wget',
      command: `choco install wget -y`
    }),
    new CircleCI.commands.Run({
      name: 'Download Node 16.13',
      command: `
wget https://nodejs.org/dist/v16.13.0/node-v16.13.0-x86.msi -P C:\\\\Users\\\\circleci\\\\Downloads\\\\
`,
      shell: 'cmd.exe'
    }),
    new CircleCI.commands.Run({
      name: 'Configure Python 3',
      command: `
        Add-Content -Path $profile -Value 'Set-Alias -Name python3 -Value python'
`
    }),
    new CircleCI.commands.Run({
      name: 'Run Node installer',
      command: `
MsiExec.exe /i C:\\\\Users\\\\circleci\\\\Downloads\\\\node-v16.13.0-x86.msi /qn
`
    }),
    new CircleCI.commands.Run({
      name: 'Install Node 16.13',
      command: `
Start-Process powershell -verb runAs -Args "-start GeneralProfile"
nvm install 16.13.0
nvm use 16.13.0
`
    }),
    new CircleCI.commands.Run({
      name: 'Install Yarn',
      command: `npm install yarn -g`
    }),
    new CircleCI.commands.Run({
      name: 'NPM Auth',
      command: `
npm config set "//registry.npmjs.org/:_authToken" "$env:NPM_TOKEN"
`
    }),
    SageCICommands.RestoreBuildCache.reuseCommand({ suffix: '-win' }),
    new CircleCI.commands.Run({
      name: 'Install AWS CLI',
      command: `choco install awscli -y`
    }),
    new CircleCI.commands.Run({
      name: 'Configure AWS',
      command: `
  aws configure --profile tooling set aws_access_key_id "$env:DEV_AWS_ACCESS_KEY_ID"
  aws configure --profile tooling set aws_secret_access_key "$env:DEV_AWS_SECRET_ACCESS_KEY"

  if ( "<< parameters.stage >>" -eq "production" ) {
    aws configure --profile default set aws_access_key_id "$env:PROD_AWS_ACCESS_KEY_ID"
    aws configure --profile default set aws_secret_access_key "$env:PROD_AWS_SECRET_ACCESS_KEY"
  } elseif ( "<< parameters.stage >>" -eq "staging" ) {
    aws configure --profile default set aws_access_key_id "$env:STAGING_AWS_ACCESS_KEY_ID"
    aws configure --profile default set aws_secret_access_key "$env:STAGING_AWS_SECRET_ACCESS_KEY"
  } else {
    aws configure --profile default set aws_access_key_id "$env:DEV_AWS_ACCESS_KEY_ID"
    aws configure --profile default set aws_secret_access_key "$env:DEV_AWS_SECRET_ACCESS_KEY"
  }

  aws configure --profile default set region "$env:REGION"
`
    }),
    SageCICommands.InstallLerna.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Install Dependencies',
      command: `
if (Test-Path '.\\\\node_modules' -PathType Container) {
  echo 'Dependencies cached. Skipping.'
} else {
  yarn install --pure-lockfile;
  lerna bootstrap;
}
`,
      no_output_timeout: '60m'
    }),
    new CircleCI.commands.Run({
      name: 'Build Dependencies',
      command: `lerna run buildAsDependency --stream`
    }),
    SageCICommands.SaveBuildCache.reuseCommand({ suffix: '-win' }),
    new CircleCI.commands.Run({
      name: 'Build Electron App',
      command: `
cd .\\\\packages\\\\shared\\\\sage-unreal-server
$env:STAGE = '<< parameters.stage >>'; yarn build:gui
cd ..\\\\..\\\\..
`
    }),
    new CircleCI.commands.Run({
      name: 'Dump Build Artifact on S3',
      command: `
cd .\\\\packages\\\\shared\\\\sage-unreal-server
$env:AWS_PROFILE = 'tooling'; aws s3 sync .\\\\dist\\\\ "s3://vysta-devops/artifacts/<< parameters.stage >>/shared/sage-unreal-server/release" --include='*.exe';
cd ..\\\\..\\\\..
`
    })
  ],
  {
    working_directory: '~/project'
  }
);
