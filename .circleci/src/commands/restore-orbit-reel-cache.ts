import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'restore-orbit-reel-cache',
  [
    new CircleCI.commands.Run({
      name: 'Get Packages Dependencies JSON',
      command: `
python3 ./scripts/getPackagesDependenciesForCi.py
`
    }),
    new CircleCI.commands.cache.Restore({
      keys: [
        'or-bundle-{{ checksum "<< parameters.bundle_path >>/manifest-ios.json" }}'
      ]
    })
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('bundle_path', 'string')
  ]),
  'Restore orbit reel cache from previous build, if any'
);

export function reuseCommand(params: {
  bundle_path: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
