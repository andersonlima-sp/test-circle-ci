import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'deploy-mac',
  SageCIExecutors.MacOS.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('package_name', 'string'),
    new CircleCI.parameters.CustomParameter('package_path', 'string'),
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
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
    new CircleCI.commands.Run({
      name: 'Dump Build Artifact on S3',
      command: `
cd ./packages/<< parameters.package_path >>
AWS_PROFILE=tooling aws s3 sync "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>/mac-prerelease" "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>/mac" --include='*.dmg';
cd ../../..
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
