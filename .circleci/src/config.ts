import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCIJobs from './jobs';
import * as Utils from './utils';

const STAGES = ['staging', 'production'];
const APPLICATION_TYPES = ['app', 'companion'];

const WORKFLOW_GLOBAL_APPROVAL = {
  bootstrap: 'bootstrap',
  allowProdRelease: 'allow-prod-release'
};

type JobMapType = {
  [key: string]: CircleCI.reusable.ParameterizedJob;
};

export class SageCIPackageConfig {
  name: string;
  packageName: string;
  packagePath: string;

  // the properties below are read from the package.json
  active: boolean;
  ios: boolean;
  windows: boolean;
  mac: boolean;
  windowsV2: boolean;
  macV2: boolean;
  customParameters: Record<string, string | number | boolean>;

  constructor(packagePath: string) {
    const packageJson = Utils.getPackageJson(packagePath);

    const sageCIConfig = (packageJson?.sageCi || {}) as Record<string, unknown>;

    this.name = Utils.kebabCase(packagePath.replace('/', '-'));
    this.packagePath = packagePath;
    this.packageName = `${packageJson?.name}`;
    this.active = !!sageCIConfig.active;
    this.ios = !!sageCIConfig.ios;
    this.windows = !!sageCIConfig.windows;
    this.mac = !!sageCIConfig.mac;
    this.windowsV2 = !!sageCIConfig.windowsV2;
    this.macV2 = !!sageCIConfig.macV2;
    this.customParameters = (sageCIConfig.customParameters || {}) as Record<
      string,
      string | number | boolean
    >;
  }

  private getJobName(job: string) {
    return `run-${this.name}-${job}`;
  }
  private getApprovalName() {
    return `release-${this.name}`;
  }
  private getBuildName() {
    return `${this.getJobName('build')}`;
  }
  private getBuildWindowsName(stage: string, suffix?: string) {
    if (suffix) {
      return `${this.getJobName(`build-windows-${suffix}`)}-${stage}`;
    }
    return `${this.getJobName(`build-windows`)}-${stage}`;
  }
  private getBuildMacName(stage: string, suffix?: string) {
    if (suffix) {
      return `${this.getJobName(`build-mac-${suffix}`)}-${stage}`;
    }
    return `${this.getJobName(`build-mac`)}-${stage}`;
  }

  public addPackageToWorkflow(workflow: CircleCI.Workflow) {
    if (!this.active) return;

    const services = (process.env.SERVICES as string)?.split(',');
    if (!services?.includes(this.packagePath)) {
      return;
    }

    workflow.addJobApproval(this.getApprovalName());

    const buildMap: JobMapType = {
      'sage-messaging': SageCIJobs.BuildMessagingServer.definition,
      'sage-unreal-server': SageCIJobs.BuildSageUnrealServer.definition,
      default: SageCIJobs.Build.definition
    };

    const buildJob = buildMap[this.name] || buildMap.default;
    workflow.addJob(buildJob, {
      name: this.getBuildName(),
      requires: [WORKFLOW_GLOBAL_APPROVAL.bootstrap, this.getApprovalName()],
      ...SageCIJobs.getParams(buildJob, {
        package_name: this.packageName,
        package_path: this.packagePath,
        stage: 'staging'
      })
    });

    const deployMap: JobMapType = {
      'sage-messaging': SageCIJobs.DeployServer.definition,
      'sage-unreal-server': SageCIJobs.DeployServer.definition,
      default: SageCIJobs.Deploy.definition
    };

    const deployJob = deployMap[this.name] || deployMap.default;
    this.addDeployJobToWorkflow(
      workflow,
      deployJob,
      (stage) => `${this.getJobName(`deploy`)}-${stage}`
    );

    if (this.ios) {
      this.addDeployJobToWorkflow(
        workflow,
        SageCIJobs.DeployIos.definition,
        (stage) => `${this.getJobName(`deploy-ios`)}-${stage}`
      );
    }

    if (this.windows) {
      this.addDeployJobToWorkflow(
        workflow,
        SageCIJobs.BuildWindows.definition,
        (stage) => this.getBuildWindowsName(stage)
      );
    }

    if (this.windowsV2) {
      APPLICATION_TYPES.forEach((application_type) =>
        this.addDeployJobToWorkflow(
          workflow,
          SageCIJobs.BuildWindowsV2.definition,
          (stage) => this.getBuildWindowsName(stage, application_type),
          { application_type }
        )
      );
    }

    if (this.mac) {
      this.addDeployJobToWorkflow(
        workflow,
        SageCIJobs.BuildMac.definition,
        (stage) => this.getBuildMacName(stage)
      );
    }

    if (this.macV2) {
      APPLICATION_TYPES.forEach((application_type) =>
        this.addDeployJobToWorkflow(
          workflow,
          SageCIJobs.BuildMacV2.definition,
          (stage) => this.getBuildMacName(stage, application_type),
          { application_type }
        )
      );
    }
  }

  private addDeployJobToWorkflow(
    workflow: CircleCI.Workflow,
    jobDefinition: CircleCI.reusable.ParameterizedJob,
    jobNameGetter: (stage: string) => string,
    customParams: Record<string, string | number | boolean> = {}
  ) {
    for (const stage of STAGES) {
      const requires = [this.getBuildName()];
      if (stage === 'production') {
        requires.push(WORKFLOW_GLOBAL_APPROVAL.allowProdRelease);
      }

      workflow.addJob(jobDefinition, {
        name: jobNameGetter(stage),
        requires,
        ...SageCIJobs.getParams(jobDefinition, {
          package_name: this.packageName,
          package_path: this.packagePath,
          stage,
          ...this.customParameters,
          ...customParams
        })
      });
    }
  }
}
