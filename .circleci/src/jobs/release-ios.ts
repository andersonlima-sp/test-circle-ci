import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'release-ios',
  SageCIExecutors.MacOS.reuseExecutor({ resource_class: 'medium' }),
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
      name: 'Update Release Version File',
      command: `
cd ./packages/sage/online
AWS_PROFILE=tooling aws s3 sync "s3://vysta-devops/artifacts/master/<< parameters.package_path >>iOS/latest-prerelease.json" "s3://vysta-devops/artifacts/master/<< parameters.package_path >>iOS/latest.json";
cd ../../..
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
