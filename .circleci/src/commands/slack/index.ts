import * as NotifyCustom from './slack-notify-custom';
import * as NotifyFail from './slack-notify-fail';

export { NotifyCustom, NotifyFail };

export const all = [NotifyCustom.definition, NotifyFail.definition];
