import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableExecutor(
  'macos',
  new CircleCI.executors.MacOSExecutor('14.2.0', 'macos.x86.medium.gen2'),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter(
      'resource_class',
      'string',
      'macos.x86.medium.gen2'
    )
  ])
);

export function reuseExecutor(params: {
  resource_class?: string;
}): CircleCI.reusable.ReusedExecutor {
  return new CircleCI.reusable.ReusedExecutor(definition, params);
}
