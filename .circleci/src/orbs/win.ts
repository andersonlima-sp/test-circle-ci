import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.orb.OrbImport(
  'win',
  'circleci',
  'windows',
  '4.1.1'
);
