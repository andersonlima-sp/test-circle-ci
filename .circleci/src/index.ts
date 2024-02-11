import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from './commands';
import { SageCIPackageConfig } from './config';
import * as SageCIExecutors from './executors';
import * as SageCIJobs from './jobs';
import * as SageCIOrbs from './orbs';
import * as SageParameters from './parameters';
import * as Utils from './utils';

const config = new CircleCI.Config();
Utils.defineParameters(config, [...SageParameters.all]);
Utils.importOrbs(config, ...SageCIOrbs.all);
Utils.addReusableExecutors(config, ...SageCIExecutors.all);
Utils.addReusableCommands(config, ...SageCICommands.all);
Utils.addJob(config, ...SageCIJobs.all);

const workflow = new CircleCI.Workflow('sage-ci');
workflow.addJob(SageCIJobs.Bootstrap.definition, {
  name: 'bootstrap'
});
workflow.addJobApproval('allow-prod-release');

Utils.listPackages().forEach((pkg) => {
  const packageConfig = new SageCIPackageConfig(pkg);
  packageConfig.addPackageToWorkflow(workflow);
});

config.addWorkflow(workflow);
config.writeFile(Utils.resolvePath('.circleci/generated_config.yml'));
