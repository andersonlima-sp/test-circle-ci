import * as CircleCI from '@circleci/circleci-config-sdk';
import * as SageCIOrbs from '../../orbs';

export const definition = new CircleCI.reusable.ReusableCommand(
  'slack-notify-custom',
  [
    new CircleCI.reusable.ReusedCommand(
      SageCIOrbs.Slack.definition.commands.notify,
      {
        event: '<< parameters.event >>',
        custom: '<< parameters.custom_message >>'
      }
    )
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('event', 'string', 'pass'),
    new CircleCI.parameters.CustomParameter('custom_message', 'string')
  ]),
  `Slack Notify Custom`
);

export function reuseCommand(params: {
  event?: string;
  custom_message: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
