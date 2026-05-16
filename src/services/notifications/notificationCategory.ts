import type {NotificationCategoryContext} from './notificationTypes';

const CATEGORY_PATTERNS: Record<Exclude<NotificationCategoryContext, 'generic' | 'salary' | 'saving'>, RegExp[]> = {
  food: [/ăn/u, /uống/u, /đồ ăn/u, /ăn vặt/u, /food/i, /meal/i, /lunch/i, /dinner/i],
  cafe: [/cà phê/u, /cafe/i, /coffee/i, /trà sữa/u, /matcha/i, /đồ uống/u],
  shopping: [/mua sắm/u, /shopping/i, /quần áo/u, /shopee/i, /lazada/i, /tiki/i, /thời trang/u],
  transport: [/xăng/u, /xe/u, /grab/i, /be/i, /taxi/i, /di chuyển/u],
  rent: [/trọ/u, /tiền nhà/u, /thuê nhà/u, /rent/i, /apartment/i],
  bill: [/điện/u, /nước/u, /internet/i, /wifi/i, /hóa đơn/u, /bill/i],
  entertainment: [/phim/u, /game/i, /netflix/i, /spotify/i, /giải trí/u],
  health: [/thuốc/u, /khám/u, /bệnh viện/u, /y tế/u, /health/i],
  education: [/học/u, /sách/u, /course/i, /khóa học/u],
};

export const detectCategoryContext = (label?: string): NotificationCategoryContext => {
  const text = (label || '').trim();
  if (!text) {return 'generic';}
  for (const [context, patterns] of Object.entries(CATEGORY_PATTERNS) as Array<[
    Exclude<NotificationCategoryContext, 'generic' | 'salary' | 'saving'>,
    RegExp[],
  ]>) {
    if (patterns.some(pattern => pattern.test(text))) {
      return context;
    }
  }
  return 'generic';
};
