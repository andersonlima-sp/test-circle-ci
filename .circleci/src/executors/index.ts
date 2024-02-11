import * as MacOS from './macos';
import * as Node from './node';
import * as Windows from './windows';

export { MacOS, Node, Windows };

export const all = [MacOS.definition, Node.definition, Windows.definition];
