import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'deploy-ios',
  SageCIExecutors.MacOS.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('package_name', 'string'),
    new CircleCI.parameters.CustomParameter('package_path', 'string'),
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging'),
    new CircleCI.parameters.CustomParameter('xcodeproj_name', 'string'),
    new CircleCI.parameters.CustomParameter('keychain_name', 'string'),
    new CircleCI.parameters.CustomParameter(
      'orbit_reel_bundle_id',
      'string',
      ''
    )
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    new CircleCI.commands.Run({
      name: 'Create Provisioning Profiles Directory',
      command: `mkdir -pv ~/Library/MobileDevice/Provisioning\\ Profiles/`
    }),
    new CircleCI.commands.Run({
      name: 'Install Certificates',
      command: `
security create-keychain -p default << parameters.keychain_name >>.keychain
security set-keychain-settings << parameters.keychain_name >>.keychain
security unlock-keychain -p default << parameters.keychain_name >>.keychain
security import ~/project/provisioningprofiles/<< parameters.package_path >>/cert.p12 -x -t agg -k << parameters.keychain_name >>.keychain -A -P ""
security import ~/project/provisioningprofiles/<< parameters.package_path >>/certDev.p12 -x -t agg -k << parameters.keychain_name >>.keychain -A -P ""
security set-keychain-settings -lut 7200 << parameters.keychain_name >>.keychain
security list-keychains -d user -s << parameters.keychain_name >>.keychain $(security list-keychains -d user | sed s/\\"//g)
security list-keychains
security default-keychain -s << parameters.keychain_name >>.keychain
security find-identity -v -p codesigning
`,
      context: 'org-global'
    }),
    new CircleCI.commands.Run({
      name: 'Install Provisioning Profiles',
      command: `
cp ~/project/provisioningprofiles/<< parameters.package_path >>/* ~/Library/MobileDevice/Provisioning\\ Profiles/
chown distiller:staff ~/Library/MobileDevice/Provisioning\\ Profiles/*
`,
      context: 'org-global'
    }),
    new CircleCI.commands.Run({
      name: 'Sign the Keychain',
      command: `
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k default /Users/distiller/Library/Keychains/<< parameters.keychain_name >>.keychain-db
`,
      context: 'org-global'
    }),
    new CircleCI.commands.Run({
      name: 'Install Python 3.10',
      command: `
pyenv install 3.10
pyenv global 3.10
`
    }),
    new CircleCI.commands.Run({
      name: 'Download NVM',
      command: `
set +e
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"
echo 'export NVM_DIR="$HOME/.nvm"' >> $BASH_ENV
echo '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"' >> $BASH_ENV
`
    }),
    new CircleCI.commands.Run({
      name: 'Install Node 16.16',
      command: `
nvm install 16.16.0
nvm use 16.16.0
nvm alias default 16.16.0
node -v
`
    }),
    SageCICommands.NpmAuth.reuseCommand(),
    SageCICommands.RestoreBuildCache.reuseCommand({ suffix: '-mac-v3' }),
    new CircleCI.commands.Run({
      name: 'Install AWS CLI',
      command: `
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle-1.27.101.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
`
    }),
    SageCICommands.ConfigureAws.reuseCommand({
      stage: '<< parameters.stage >>'
    }),
    SageCICommands.InstallLerna.reuseCommand(),
    new CircleCI.commands.Run({
      name: 'Install Dependencies',
      command: `
if [ -d "./node_modules" ]; then
  echo 'Dependencies cached. Skipping.'
else
  lerna bootstrap -- --pure-lockfile
fi
`
    }),
    new CircleCI.commands.Run({
      name: 'Build Dependencies',
      command: `lerna run buildAsDependency --stream`
    }),
    SageCICommands.SaveBuildCache.reuseCommand({ suffix: '-mac-v3' }),
    new CircleCI.commands.Run({
      name: 'Download current Orbit Reel Assets',
      command: `
if [ ! -z "<< parameters.orbit_reel_bundle_id >>" ]; then
  mkdir -p ./packages/<< parameters.package_path >>/bundle
  curl "http://orbitreelstore.s3.amazonaws.com/bundles/<< parameters.orbit_reel_bundle_id >>/manifest-ios.json" -o "./packages/<< parameters.package_path >>/bundle/manifest-ios.json"
else
  echo No Orbit Reel bundle id. Skipping...
fi
`
    }),
    SageCICommands.RestoreOrbitReelCache.reuseCommand({
      bundle_path: 'packages/<< parameters.package_path >>/bundle'
    }),
    new CircleCI.commands.Run({
      name: 'Get XCode Version',
      command: `xcodebuild -version`
    }),
    new CircleCI.commands.Run({
      name: 'Configure Cordova',
      command: `
cd ./packages/<< parameters.package_path >>
mkdir -p www
yarn copyCordovaPlugins
STAGE=<< parameters.stage >> yarn preBuildIOS
PLATFORM=ipad yarn buildTemplateNative
yarn build:externals
STAGE=<< parameters.stage >> yarn getSecrets && ./node_modules/.bin/cordova platform add ios --verbose;
cd ../../..
`,
      no_output_timeout: '60m'
    }),
    new CircleCI.commands.Run({
      name: 'Build iOS',
      command: `
cd ./packages/<< parameters.package_path >>
STAGE=<< parameters.stage >> yarn build:ipad
cd ../../..
`
    }),
    SageCICommands.SaveOrbitReelCache.reuseCommand({
      bundle_path: 'packages/<< parameters.package_path >>/bundle'
    }),
    new CircleCI.commands.Run({
      name: 'Dump Build Artifact on S3',
      command: `
cd ./packages/<< parameters.package_path >>
AWS_PROFILE=tooling aws s3 sync ./platforms/ios/build/device/ "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>iOS" --exclude='*' --include='*.ipa' || echo 'Deployed';
AWS_PROFILE=tooling aws s3 sync ./ "s3://vysta-devops/artifacts/<< parameters.stage >>/<< parameters.package_path >>iOS" --exclude='*' --include='latest.json' || echo 'Deployed version metadata';
cd ../../..
`
    }),
    new CircleCI.commands.Run({
      name: 'Prepare FastLane',
      command: `
cd ./packages/<< parameters.package_path >>
ruby --version
bundle update
cd ../../..
`
    }),
    new CircleCI.commands.Run({
      name: 'Release with FastLane',
      command: `
cd ./packages/<< parameters.package_path >>
GYM_PROJECT='./platforms/ios/<< parameters.xcodeproj_name >>.xcodeproj' bundle exec fastlane release
xcrun altool --validate-app -f './<< parameters.xcodeproj_name >>.ipa' -t ios -u "$FASTLANE_APPLE_EMAIL" -p "$FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD" --output-format xml
xcrun altool --upload-app -f './<< parameters.xcodeproj_name >>.ipa' -t ios -u "$FASTLANE_APPLE_EMAIL" -p "$FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD" --output-format xml
cd ../../..
`
    }),
    SageCICommands.slack.NotifyFail.reuseCommand()
  ],
  {
    working_directory: '~/project'
  }
);
