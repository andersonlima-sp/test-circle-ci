import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'npm-auth',
  [
    new CircleCI.commands.Run({
      name: 'NPM Auth',
      command: `
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc
`
    })
  ],
  undefined,
  'Authenticate with NPM'
);

export function reuseCommand(): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition);
}
