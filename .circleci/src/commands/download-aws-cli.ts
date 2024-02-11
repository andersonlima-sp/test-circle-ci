import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'download-aws-cli',
  [
    new CircleCI.commands.Run({
      name: 'Download AWS CLI',
      command: `
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip";
unzip awscliv2.zip;
sudo ./aws/install;
aws --version;
`
    })
  ],
  undefined,
  'Download AWS CLI'
);

export function reuseCommand(): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition);
}
