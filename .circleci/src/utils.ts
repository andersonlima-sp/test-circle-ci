import * as CircleCI from '@circleci/circleci-config-sdk';
import fs from 'fs-extra';
import path from 'path';
import { ParameterParams } from './types';

export function kebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function resolvePath(p: string): string {
  return path.resolve(__dirname, '../../', p);
}

export function listPackages(): string[] {
  // integrations, platform, sage, shared...
  const packageTypes = fs
    .readdirSync(resolvePath('packages'))
    .map((pkg) =>
      fs.statSync(resolvePath(`packages/${pkg}`)).isDirectory() ? pkg : null
    )
    .filter((pkg) => pkg !== null) as string[];

  // integrations/builderCMS, platform/propertiesService, sage/online...
  const packages: string[] = [];

  for (const packageType of packageTypes) {
    const packageNames = fs
      .readdirSync(resolvePath(`packages/${packageType}`))
      .map((pkg) =>
        fs.statSync(resolvePath(`packages/${packageType}/${pkg}`)).isDirectory()
          ? pkg
          : null
      )
      .filter((pkg) => pkg !== null) as string[];

    for (const packageName of packageNames) {
      packages.push(`${packageType}/${packageName}`);
    }
  }

  return packages;
}

export function getPackageJson(pkg: string): Record<string, unknown> | null {
  try {
    return fs.readJSONSync(resolvePath(`packages/${pkg}/package.json`));
  } catch (e) {
    console.error(`Could not parse package.json for ${pkg}`);
    return null;
  }
}

export function importOrbs<
  T extends CircleCI.orb.OrbImport | Record<string, T>
>(config: CircleCI.Config, ...orbs: T[]) {
  for (const orb of orbs) {
    if (orb instanceof CircleCI.orb.OrbImport) {
      config.importOrb(orb);
    } else {
      importOrbs(config, ...Object.values(orb));
    }
  }
}

export function addReusableExecutors<
  T extends CircleCI.reusable.ReusableExecutor | Record<string, T>
>(config: CircleCI.Config, ...executors: T[]) {
  for (const executor of executors) {
    if (executor instanceof CircleCI.reusable.ReusableExecutor) {
      config.addReusableExecutor(executor);
    } else {
      addReusableExecutors(config, ...Object.values(executor));
    }
  }
}

export function addReusableCommands<
  T extends CircleCI.reusable.ReusableCommand | Record<string, T>
>(config: CircleCI.Config, ...commands: T[]) {
  for (const command of commands) {
    if (command instanceof CircleCI.reusable.ReusableCommand) {
      config.addReusableCommand(command);
    } else {
      addReusableCommands(config, ...Object.values(command));
    }
  }
}

export function addJob<T extends CircleCI.Job | Record<string, T>>(
  config: CircleCI.Config,
  ...jobs: T[]
) {
  for (const job of jobs) {
    if (job instanceof CircleCI.Job) {
      config.addJob(job);
    } else {
      addJob(config, ...Object.values(job));
    }
  }
}

export function defineParameters(
  config: CircleCI.Config,
  parameters: ParameterParams[]
) {
  for (const {
    name,
    parameter,
    defaultValue,
    description,
    enumValues
  } of parameters) {
    config.defineParameter(
      name,
      parameter,
      defaultValue,
      description,
      enumValues
    );
  }
}
