import * as CleanupPackage from './cleanup-package';
import * as ConfigureAws from './configure-aws';
import * as DownloadAwsCli from './download-aws-cli';
import * as InstallLerna from './install-lerna';
import * as NpmAuth from './npm-auth';
import * as RestoreBuildCache from './restore-build-cache';
import * as RestoreOrbitReelCache from './restore-orbit-reel-cache';
import * as SaveBuildCache from './save-build-cache';
import * as SaveOrbitReelCache from './save-orbit-reel-cache';
import * as slack from './slack';

export {
  CleanupPackage,
  ConfigureAws,
  DownloadAwsCli,
  InstallLerna,
  NpmAuth,
  RestoreBuildCache,
  RestoreOrbitReelCache,
  SaveBuildCache,
  SaveOrbitReelCache,
  slack
};

export const all = [
  CleanupPackage.definition,
  ConfigureAws.definition,
  DownloadAwsCli.definition,
  InstallLerna.definition,
  NpmAuth.definition,
  RestoreBuildCache.definition,
  RestoreOrbitReelCache.definition,
  SaveBuildCache.definition,
  SaveOrbitReelCache.definition,
  ...slack.all
];
