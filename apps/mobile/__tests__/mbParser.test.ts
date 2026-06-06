import {parseMBNotification} from '../src/modules/banking/parsers';

describe('parseMBNotification', () => {
  it('parses MB Bank balance notification with pipe-delimited GD/SD/DEN/ND fields', () => {
    const text =
      'TK 03xxx133|GD: -25,000VND 14/05/26 12:18 |SD: 75,125VND|DEN: HO KINH DOANH PHAM THI HA 93 - V3GSTPB10012340|ND: NGUYEN VAN QUANG chuyen tien';

    const transaction = parseMBNotification(text);

    expect(transaction).toEqual({
      amount: 25000,
      balanceAfter: 75125,
      description: 'NGUYEN VAN QUANG chuyen tien',
      transactionType: 'expense',
      timestamp: new Date(2026, 4, 14, 12, 18, 0, 0).getTime(),
      rawText: text,
    });
  });

  it('keeps supporting older MB Bank notifications', () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date(2026, 4, 14, 12, 30, 0, 0));

    const transaction = parseMBNotification(
      'TK 0381xxx: +500,000 VND lúc 13:00 12/05. SD: 5,000,000 VND. ND: TRANSFER FROM A',
    );

    expect(transaction).toMatchObject({
      amount: 500000,
      balanceAfter: 5000000,
      description: 'TRANSFER FROM A',
      transactionType: 'income',
      timestamp: new Date(2026, 4, 12, 13, 0, 0, 0).getTime(),
    });

    jest.useRealTimers();
  });
});
