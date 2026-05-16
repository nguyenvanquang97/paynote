import {NOTIFICATION_CATEGORY_TEMPLATES} from './notificationCategoryTemplates';
import {PLAN_NOTIFICATION_TEMPLATES} from './notificationPlanTemplates';
import type {
  NotificationPersona,
  NotificationSeverity,
  NotificationTemplate,
  NotificationTrigger,
} from './notificationTypes';

const PERSONAS: NotificationPersona[] = ['advisor', 'wallet_pet', 'toxic_friend', 'vietnamese_parent'];

const SEVERITY_BY_TRIGGER: Record<NotificationTrigger, NotificationSeverity> = {
  budget_50: 'low',
  budget_80: 'medium',
  budget_100: 'high',
  budget_120: 'critical',
  large_transaction: 'high',
  repeat_category_today: 'medium',
  repeat_category_week: 'medium',
  late_night_spending: 'high',
  bank_transaction_detected: 'medium',
  salary_received: 'low',
  income_received: 'low',
  no_spend_day: 'low',
  saving_streak: 'medium',
  duplicate_transaction: 'low',
  missed_transaction: 'high',
  end_of_day_summary: 'medium',
  end_of_month_warning: 'high',
};

const TIER_BY_INDEX = [1, 1, 2, 3, 4] as const;

const CORE_BY_TRIGGER: Record<NotificationTrigger, string[]> = {
  budget_50: [
    '{categoryLabel} đã chạm {percent}%, vẫn còn đẹp nếu mình giữ ga đều.',
    'Nửa ngân sách đã đi, từ giao dịch sau nên ưu tiên khoản cần trước.',
    'Mốc này chưa nguy hiểm, nhưng chi cảm tính thêm là bắt đầu mệt.',
    'Giữ nhịp từ giờ thì cuối tháng vẫn còn khoảng thở.',
    'Đây là lúc kỷ luật nhẹ để khỏi phải sửa sai mạnh về sau.',
  ],
  budget_80: [
    '{categoryLabel} lên {percent}% rồi, phanh sớm thì vẫn cứu được tháng này.',
    'Đà chi hiện tại hơi nóng, thêm vài món linh tinh là vượt kiểm soát.',
    'Bạn đang ở vùng cảnh báo, nên bớt quyết định theo mood ngay lúc này.',
    '{spentText}/{limitText} là tín hiệu rõ, giờ cần chọn lọc hơn.',
    'Nếu còn tăng ga, cuối tháng sẽ trả giá bằng áp lực tài chính.',
  ],
  budget_100: [
    '{categoryLabel} đã chạm trần ngân sách, từ giờ chỉ nên giữ khoản bắt buộc.',
    'Ngân sách vừa hết, mọi chi thêm lúc này đều là mượn của ngày cuối tháng.',
    'Mốc 100% đã tới, càng chậm phanh thì hậu quả càng rõ.',
    '{spentText} trên giới hạn {limitText}, giờ cần dứt khoát cắt khoản phụ.',
    'Đã tới ngưỡng phải kỷ luật thật, không còn hợp lý cho tiêu cảm tính.',
  ],
  budget_120: [
    '{categoryLabel} đã vượt {percent}%, đây là cảnh báo đỏ cần dừng ngay.',
    'Bạn đang chi quá hạn mức rõ ràng, nếu không phanh bây giờ sẽ càng đau ví.',
    'Mốc vượt trần đã quá xa, ưu tiên duy nhất lúc này là giảm chi.',
    'Với {spentText}/{limitText}, tháng này cần chế độ sinh tồn tài chính.',
    'Không còn vùng đệm nữa, quyết định tiếp theo phải thật chặt tay.',
  ],
  large_transaction: [
    '{amountText} là khoản lớn, nên soi lại toàn bộ ngân sách trước giao dịch kế tiếp.',
    'Một giao dịch lớn vừa xảy ra, phần còn lại của tháng cần đi cẩn thận hơn.',
    'Khoản này đủ nặng để đổi nhịp chi tiêu, đừng để nó kéo theo chuỗi phát sinh.',
    'Tiền đã đi một cục đáng kể, bây giờ ưu tiên giữ cân bằng.',
    'Nếu coi đây là bình thường, cuối tháng sẽ không bình thường nữa.',
  ],
  repeat_category_today: [
    'Hôm nay {categoryLabel} đã lặp {count} lần, pattern này cần giảm nhịp ngay.',
    'Cùng một danh mục đang xuất hiện dày, chi thêm nữa là thành thói quen xấu.',
    'Bạn đang lặp chi trong ngày khá rõ, dừng một nhịp sẽ đỡ trượt sâu.',
    'Tần suất {categoryLabel} hôm nay cao hơn cần thiết, nên tạm khóa mua thêm.',
    'Lặp lại quá nhanh thường kéo theo regret cuối ngày.',
  ],
  repeat_category_week: [
    'Tuần này {categoryLabel} xuất hiện dày, cần giảm tần suất trước khi thành quỹ đạo xấu.',
    'Nhịp chi theo tuần đang lệch, cùng danh mục này nên hạ nhiệt.',
    'Bạn đang chi lặp cả tuần ở {categoryLabel}, dấu hiệu này không nên bỏ qua.',
    'Tần suất tuần cao nghĩa là ngân sách tuần tới sẽ chịu áp lực lớn hơn.',
    'Nếu giữ pattern này thêm vài ngày, phần còn lại của tháng sẽ rất căng.',
  ],
  late_night_spending: [
    'Giờ khuya dễ mua theo cảm xúc, tạm dừng để mai nhìn lại vẫn chưa muộn.',
    'Chi tiêu ban đêm đang tăng rủi ro, đặc biệt với quyết định chốt nhanh.',
    'Khung giờ này thường làm kỷ luật yếu đi, bạn nên đặt phanh ngay.',
    'Mua lúc khuya hiếm khi là quyết định tài chính tốt của tháng.',
    'Đêm càng muộn, giá của một cú bấm thanh toán càng đắt.',
  ],
  bank_transaction_detected: [
    'Có giao dịch mới, check nhanh 10 giây để tránh trôi kế hoạch cả ngày.',
    'Tài khoản vừa nhúc nhích, mình chốt nhịp sớm thì đỡ sửa sai về sau.',
    'Một dòng mới vừa lên sao kê, đọc ngay lúc này luôn dễ nhất.',
    'Tiền vừa dịch chuyển, đừng để quán tính quyết định phần còn lại của hôm nay.',
    'Mỗi giao dịch là một tín hiệu nhỏ, bắt đúng sớm thì tháng đi rất mượt.',
  ],
  salary_received: [
    'Lương về rồi, chia quỹ ngay lúc này là nước đi khôn nhất của tháng.',
    'Khoản chính vừa vào, cất trước một phần để khỏi bay theo mood cuối tuần.',
    '48 giờ đầu sau ngày lương quyết định luôn tháng này nhẹ hay nặng.',
    'Tiền vừa về đẹp, ưu tiên mục tiêu trước rồi mới mở phần vui.',
    'Lương là cơ hội reset tài chính, chốt kỷ luật sớm thì cả tháng đỡ drama.',
  ],
  income_received: [
    'Tiền mới vừa vào, cất trước một phần rồi tiêu sau sẽ đỡ tiếc.',
    'Thu nhập tăng là tin vui, miễn đừng để lifestyle tăng nhanh hơn.',
    'Khoản này vào đẹp, gán mục tiêu trước khi nó bay theo cảm xúc.',
    'Chia quỹ ngay lúc còn tỉnh là nước đi ít hối hận nhất.',
    'Tiền mới mà đi nhanh thì vui ngắn, stress dài.',
  ],
  no_spend_day: [
    'Hôm nay không tốn đồng nào, ví vừa có một ngày thở sâu rất đáng tiền.',
    'Một ngày sạch giao dịch nghe nhỏ, nhưng cộng dồn lại thì cực mạnh.',
    'Không tiêu hôm nay là cú gỡ nhịp đẹp cho cả tuần này.',
    'Bạn vừa tự mua thêm khoảng thở cho những ngày dễ trượt tay.',
    'Ngày không chi này nhìn bình thường, nhưng cuối tháng sẽ thấy khác rõ.',
  ],
  saving_streak: [
    'Chuỗi {count} ngày kỷ luật đang rất đẹp, duy trì thêm là khác biệt rõ.',
    'Bạn giữ nhịp tốt liên tục {count} ngày, quỹ dự phòng sẽ cảm ơn điều này.',
    'Streak tiết chế đang lên, cố giữ để biến thành thói quen bền.',
    '{count} ngày liền ổn định là thành tích tài chính đáng giá.',
    'Nhịp này càng dài thì cuối tháng càng bớt drama.',
  ],
  duplicate_transaction: [
    'App vừa chặn cú trùng tay, ví chưa kịp đau thì đã được cứu.',
    'Một giao dịch lặp vừa bị bắt bài, số liệu vẫn sạch đẹp.',
    'Cú ghi trùng đã khóa kịp, bạn không cần dọn hậu quả.',
    'Thoát một pha cộng dư rồi, báo cáo tháng vẫn thẳng hàng.',
    'May mà hệ thống giữ lại đúng lúc, không thì ví đau oan.',
  ],
  missed_transaction: [
    'Có dấu hiệu hụt giao dịch, bạn kiểm tra lại để báo cáo không bị lệch.',
    'Hệ thống nghi ngờ thiếu bản ghi, nên xác nhận sớm để giữ dữ liệu chuẩn.',
    'Một khoản có thể đã bị bỏ sót, xử lý ngay sẽ đỡ rối cuối tháng.',
    'Nếu giao dịch này bị lỡ, thống kê tài chính sẽ sai đáng kể.',
    'Cần rà lại lịch sử gần đây vì có tín hiệu thiếu transaction.',
  ],
  end_of_day_summary: [
    'Chốt ngày: {amountText}. Mai giữ nhẹ tay một nhịp là đẹp.',
    'Hôm nay đi {amountText}, ngày mai đừng để quán tính cầm lái nữa.',
    'Tổng chi đã rõ: {amountText}. Bản đẹp của ngày mai bắt đầu từ giao dịch đầu tiên.',
    'Con số hôm nay nói đủ rồi, phần còn lại là cách bạn vào ngày mai.',
    'Xem summary xong là tới phần hành động, không phải phần quên luôn.',
  ],
  end_of_month_warning: [
    'Cuối tháng rồi, mọi khoản cảm tính lúc này đều rất đắt.',
    'Đây là đoạn nước rút, giữ chặt chi linh tinh để không hụt nhịp.',
    'Những ngày cuối tháng cần mode phòng thủ tài chính rõ ràng.',
    'Nếu tăng ga ở tuần cuối, đầu tháng sau sẽ trả giá ngay.',
    'Chốt hạ tháng đẹp hay căng nằm ở vài quyết định ngay lúc này.',
  ],
};

const toPet = (line: string, index: number): string => {
  const emoji = ['🥹', '🥲', '✨', '', '🥹'][index] || '';
  const lower = line.toLowerCase();
  const withVoice = lower.includes('ví bé') ? line : `Ví bé nhắc nhẹ: ${line}`;
  return `${withVoice}${emoji ? ` ${emoji}` : ''}`;
};

const toToxic = (line: string, index: number): string => {
  const tails = [
    '',
    'Đừng để kịch bản cũ lặp lại.',
    'Sao kê sẽ nhớ rất rõ câu chuyện này.',
    'Dừng đúng lúc luôn rẻ hơn sửa sai.',
    'Nói vui vậy thôi nhưng cảnh báo là thật.',
  ];
  return tails[index] ? `${line} ${tails[index]}` : line;
};

const toParent = (line: string, index: number): string => {
  const tails = [
    '',
    'Từ giao dịch kế tiếp thì giữ tay lại.',
    'Kỷ luật lúc này là bắt buộc.',
    'Bớt theo hứng đi.',
    'Giữ ví cho tử tế.',
  ];
  return tails[index] ? `${line} ${tails[index]}` : line;
};

const toAdvisor = (line: string): string => line;

const renderBody = (persona: NotificationPersona, line: string, index: number): string => {
  const fit = (value: string): string => (value.length <= 120 ? value : `${value.slice(0, 118).trim()}…`);
  switch (persona) {
    case 'wallet_pet': return fit(toPet(line, index));
    case 'toxic_friend': return fit(toToxic(line, index));
    case 'vietnamese_parent': return fit(toParent(line, index));
    default: return fit(toAdvisor(line));
  }
};

const buildGenericTemplates = (): NotificationTemplate[] => {
  const templates: NotificationTemplate[] = [];

  (Object.entries(CORE_BY_TRIGGER) as Array<[NotificationTrigger, string[]]>).forEach(([trigger, lines]) => {
    PERSONAS.forEach(persona => {
      lines.slice(0, 5).forEach((line, index) => {
        const body = renderBody(persona, line, index);
        templates.push({
          id: `${trigger}_${persona}_${index + 1}`,
          trigger,
          persona,
          severity: SEVERITY_BY_TRIGGER[trigger],
          tier: TIER_BY_INDEX[index],
          context: 'any',
          body,
          tags: [`tier_${TIER_BY_INDEX[index]}`, 'generic'],
          origin: 'generated',
        });
      });
    });
  });

  return templates;
};

const GENERIC_NOTIFICATION_TEMPLATES = buildGenericTemplates();

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  ...PLAN_NOTIFICATION_TEMPLATES,
  ...GENERIC_NOTIFICATION_TEMPLATES,
  ...NOTIFICATION_CATEGORY_TEMPLATES,
];
