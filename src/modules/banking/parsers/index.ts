import type {ParsedTransaction} from '../../../shared/types';
import type {BankId} from '../../../shared/constants';
import {parseMBNotification} from './mbParser';
import {parseTCBNotification} from './tcbParser';
import {parseVCBNotification} from './vcbParser';

type BankParser = (text: string) => ParsedTransaction | null;

const parserMap: Record<string, BankParser> = {
  mbbank: parseMBNotification,
  techcombank: parseTCBNotification,
  vietcombank: parseVCBNotification,
};

export const parseNotification = (
  bank: BankId | 'unknown',
  text: string,
): ParsedTransaction | null => {
  if (bank === 'unknown') {
    return null;
  }

  const parser = parserMap[bank];

  if (!parser) {
    return null;
  }

  return parser(text);
};

export {parseMBNotification} from './mbParser';
export {parseTCBNotification} from './tcbParser';
export {parseVCBNotification} from './vcbParser';
