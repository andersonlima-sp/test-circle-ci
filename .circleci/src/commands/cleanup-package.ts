import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'cleanup-package',
  [
    new CircleCI.commands.Run({
      name: 'Cleanup Package',
      command: `
BUILD_NUMBER="$CIRCLE_SHA1" STAGE="<< parameters.stage >>" node ~/project/scripts/cleanPackageForCi
`
    })
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  'Cleanup Package'
);

export function reuseCommand(params: {
  stage?: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
