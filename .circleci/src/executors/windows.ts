import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableExecutor(
  'windows',
  new CircleCI.executors.WindowsExecutor('large'),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('resource_class', 'string', 'large')
  ])
);

export function reuseExecutor(params: {
  resource_class?: string;
}): CircleCI.reusable.ReusedExecutor {
  return new CircleCI.reusable.ReusedExecutor(definition, params);
}
