import * as CircleCI from '@circleci/circleci-config-sdk';
import * as Bootstrap from './bootstrap';
import * as Build from './build';
import * as BuildMac from './build-mac';
import * as BuildMacV2 from './build-mac-v2';
import * as BuildMessagingServer from './build-messaging-server';
import * as BuildSageUnrealServer from './build-sage-unreal-server';
import * as BuildWindows from './build-windows';
import * as BuildWindowsV2 from './build-windows-v2';
import * as Deploy from './deploy';
import * as DeployServer from './deploy-server';
import * as DeployIos from './deploy-ios';
import * as DeployMac from './deploy-mac';
import * as DeployWindows from './deploy-windows';
import * as PostDeploy from './post-deploy';
import * as ReleaseIos from './release-ios';

export {
  Bootstrap,
  Build,
  BuildMac,
  BuildMacV2,
  BuildMessagingServer,
  BuildSageUnrealServer,
  BuildWindows,
  BuildWindowsV2,
  Deploy,
  DeployServer,
  DeployIos,
  DeployMac,
  DeployWindows,
  PostDeploy,
  ReleaseIos
};

export const all = [
  Bootstrap.definition,
  Build.definition,
  BuildMac.definition,
  BuildMacV2.definition,
  BuildMessagingServer.definition,
  BuildSageUnrealServer.definition,
  BuildWindows.definition,
  BuildWindowsV2.definition,
  Deploy.definition,
  DeployServer.definition,
  DeployIos.definition,
  DeployMac.definition,
  DeployWindows.definition,
  PostDeploy.definition,
  ReleaseIos.definition
];

export function getParams<
  Input extends Output,
  Output extends Record<string, unknown>
>(job: CircleCI.reusable.ParameterizedJob, params: Input): Output {
  const acceptedParams: Array<keyof Output> = job.parameters.parameters.map(
    (param) => param.name
  );
  const requiredParams: Array<keyof Output> = job.parameters.parameters
    .filter((param) => param.defaultValue === undefined)
    .map((param) => param.name);

  const result: Partial<Output> = { ...params };

  for (const param in params) {
    if (!acceptedParams.includes(param)) {
      delete result[param];
    }
  }

  if (
    requiredParams.length &&
    !requiredParams.find((param) => result[param] !== undefined)
  ) {
    throw new Error(
      `Job ${job.name} is missing required parameters. Provided [${Object.keys(
        params
      ).join(', ')}], expected [${requiredParams.join(', ')}]`
    );
  }

  return result as Output;
}
