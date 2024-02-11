import * as Slack from './slack';
import * as Windows from './win';

export { Slack, Windows };

export const all = [Slack.definition, Windows.definition];
