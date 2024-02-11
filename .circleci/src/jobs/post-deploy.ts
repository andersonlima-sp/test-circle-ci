import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCICommands from '../commands';
import * as SageCIExecutors from '../executors';

export const definition = new CircleCI.reusable.ParameterizedJob(
  'post-deploy',
  SageCIExecutors.Node.reuseExecutor({}),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  [
    new CircleCI.commands.Checkout({ path: '~/project' }),
    SageCICommands.DownloadAwsCli.reuseCommand(),
    SageCICommands.ConfigureAws.reuseCommand({
      stage: '<< parameters.stage >>'
    }),
    new CircleCI.commands.workspace.Attach({ at: '~/project' }),
    SageCICommands.RestoreBuildCache.reuseCommand({}),
    new CircleCI.commands.Run({
      name: 'Deploy Public Config',
      command: `
cd ./packages/platform/infrastructure;
STAGE=<< parameters.stage >> yarn getSecrets;
yarn deployConfig;
export STAGE=<< parameters.stage >>;
AWS_PROFILE=tooling aws s3 sync . "s3://vysta-devops/config/\${STAGE}" --exclude='*' --include='.deployConfig.*' --acl=public-read;
`
    }),
    SageCICommands.slack.NotifyCustom.reuseCommand({
      custom_message: JSON.stringify({
        text: 'CircleCI job succeeded!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Deployment Successful! :tada:',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Project*: $CIRCLE_PROJECT_REPONAME'
              },
              {
                type: 'mrkdwn',
                text: "*When*: $(date +'%m/%d/%Y %T')"
              },
              {
                type: 'mrkdwn',
                text: '*Environment*: << parameters.stage >>'
              },
              {
                type: 'mrkdwn',
                text: '*Dev*: $CIRCLE_USERNAME'
              }
            ],
            accessory: {
              type: 'image',
              image_url:
                'https://assets.brandfolder.com/otz5mn-bw4j2w-6jzqo8/original/circle-logo-badge-black.png',
              alt_text: 'CircleCI logo'
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Job'
                },
                url: '${CIRCLE_BUILD_URL}'
              }
            ]
          }
        ]
      })
    })
  ],
  {
    working_directory: '~/project'
  }
);
