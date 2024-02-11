import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'restore-build-cache',
  [
    new CircleCI.commands.Run({
      name: 'Get Packages Dependencies JSON',
      command: `
python3 ./scripts/getPackagesDependenciesForCi.py
`
    }),
    new CircleCI.commands.cache.Restore({
      keys: [
        'deps-{{ checksum ".dependencies.json" }}-{{ checksum "yarn.lock" }}<< parameters.suffix >>'
      ]
    })
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('suffix', 'string', '-v4')
  ]),
  'Restore cache from previous build, if any'
);

export function reuseCommand(params: {
  suffix?: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
