import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.orb.OrbImport(
  'slack',
  'circleci',
  'slack',
  '4.12.5',
  undefined,
  {
    commands: {
      notify: new CircleCI.parameters.CustomParametersList([
        new CircleCI.parameters.CustomParameter('event', 'string'),
        new CircleCI.parameters.CustomParameter('mentions', 'string'),
        new CircleCI.parameters.CustomParameter('template', 'string'),
        new CircleCI.parameters.CustomParameter('branch_pattern', 'string')
      ])
    },
    executors: {},
    jobs: {}
  }
);
