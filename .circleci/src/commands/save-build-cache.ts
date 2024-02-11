import * as CircleCI from '@circleci/circleci-config-sdk';
import * as Utils from '../utils';

export const definition = new CircleCI.reusable.ReusableCommand(
  'save-build-cache',
  [
    new CircleCI.commands.Run({
      name: 'Get Packages Dependencies JSON',
      command: `
python3 ./scripts/getPackagesDependenciesForCi.py
`
    }),
    new CircleCI.commands.cache.Save({
      key: 'deps-{{ checksum ".dependencies.json" }}-{{ checksum "yarn.lock" }}<< parameters.suffix >>',
      paths: [
        'node_modules',
        ...Utils.listPackages().map((pkg) => `packages/${pkg}/node_modules`)
      ]
    })
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('suffix', 'string', '-v4')
  ]),
  'Save cache from this build'
);

export function reuseCommand(params: {
  suffix?: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
