import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'save-orbit-reel-cache',
  [
    new CircleCI.commands.Run({
      name: 'Get Packages Dependencies JSON',
      command: `
python3 ./scripts/getPackagesDependenciesForCi.py
`
    }),
    new CircleCI.commands.cache.Save({
      key: 'or-bundle-{{ checksum "<< parameters.bundle_path >>/manifest-ios.json" }}',
      paths: ['<< parameters.bundle_path >>']
    })
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('bundle_path', 'string')
  ]),
  'Save cache from the orbit reel'
);

export function reuseCommand(params: {
  bundle_path: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
