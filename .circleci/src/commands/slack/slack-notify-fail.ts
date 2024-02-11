import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCIOrbs from '../../orbs';
import { MENTIONS } from './_constants';

export const definition = new CircleCI.reusable.ReusableCommand(
  'slack-notify-fail',
  [
    new CircleCI.reusable.ReusedCommand(
      SageCIOrbs.Slack.definition.commands.notify,
      {
        event: 'fail',
        mentions: MENTIONS.join(' '),
        template: 'basic_fail_1'
      }
    )
  ],
  undefined,
  `Slack Notify Fail`
);

export function reuseCommand(): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition);
}
