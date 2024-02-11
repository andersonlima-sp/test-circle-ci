import * as CircleCI from '@circleci/circleci-config-sdk';

const LERNA_VERSION = '6.4.1';

export const definition = new CircleCI.reusable.ReusableCommand(
  'install-lerna',
  [
    new CircleCI.commands.Run({
      name: `Install Lerna ${LERNA_VERSION}`,
      command: `npm i lerna@${LERNA_VERSION} -g`
    })
  ],
  undefined,
  `Install Lerna ${LERNA_VERSION}`
);

export function reuseCommand(): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition);
}
