import {parseBudgetSetupAction} from '../aiBudgetActionParser';

describe('parseBudgetSetupAction', () => {
  it('parses Vietnamese category and million amount', () => {
    expect(parseBudgetSetupAction('Đặt ngân sách ăn uống 2 triệu')).toEqual({
      status: 'ready',
      categoryId: 'food',
      categoryLabel: 'Ăn uống',
      amount: 2000000,
    });
  });

  it('parses English budget keyword and compact amount', () => {
    expect(parseBudgetSetupAction('set budget cafe 500k')).toEqual({
      status: 'ready',
      categoryId: 'cafe',
      categoryLabel: 'Cà phê',
      amount: 500000,
    });
  });

  it('does not create action when amount is missing', () => {
    expect(parseBudgetSetupAction('Đặt ngân sách ăn uống')).toEqual({
      status: 'missing_amount',
      categoryId: 'food',
      categoryLabel: 'Ăn uống',
    });
  });

  it('does not create action when category is missing', () => {
    expect(parseBudgetSetupAction('Đặt ngân sách 2 triệu')).toEqual({
      status: 'missing_category',
      amount: 2000000,
    });
  });

  it('matches custom category names', () => {
    expect(parseBudgetSetupAction('Đặt ngân sách thú cưng 800 nghìn', {
      customCategories: {
        pets: {
          name: 'Thú cưng',
          keywords: ['pet'],
        },
      },
    })).toEqual({
      status: 'ready',
      categoryId: 'pets',
      categoryLabel: 'Thú cưng',
      amount: 800000,
    });
  });
});
