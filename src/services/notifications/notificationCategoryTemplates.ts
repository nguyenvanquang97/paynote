import type {NotificationPersona, NotificationTemplate, NotificationTrigger, NotificationSeverity} from './notificationTypes';

interface CategoryPersonaPool {
  context: NotificationTemplate['context'];
  trigger: NotificationTrigger;
  severity: NotificationSeverity;
  byPersona: Record<NotificationPersona, string[]>;
}

const tierByLineIndex = (i: number): 1 | 2 | 3 | 4 => {
  if (i === 0) {return 1;}
  if (i === 1 || i === 2) {return 2;}
  if (i === 3) {return 3;}
  return 4;
};

const CATEGORY_POOLS: CategoryPersonaPool[] = [
  {
    context: 'rent',
    trigger: 'budget_100',
    severity: 'high',
    byPersona: {
      advisor: [
        'Nhà ở đã chạm ngưỡng rồi. Mình siết các khoản còn lại nhé.',
        'Khoản trọ đủ nặng rồi, phần linh hoạt nên giảm ngay.',
        'Tiền nhà đã full ngân sách. Từ giờ ưu tiên khoản bắt buộc.',
        'Mục rent đang kéo cả tháng căng lên. Mình giữ nhịp lại nhé.',
        'Xử lý rent xong rồi, giờ cần phòng thủ phần còn lại.',
      ],
      wallet_pet: [
        'Tiền trọ chạm nóc rồi, ví bé xin thở nhẹ xíu.',
        'Khoản rent này làm ví bé đứng hình mất 3 giây.',
        'Ví bé hiểu khoản này bắt buộc, nhưng vẫn hơi rén á.',
        'Nhà thì cần, ví bé cũng cần được bảo toàn nữa nha.',
        'Xong tiền trọ rồi, ví bé xin đừng chốt thêm linh tinh.',
      ],
      toxic_friend: [
        'Rent chạm trần rồi. Tháng này không còn chỗ cho tùy hứng.',
        'Tiền nhà đã xử đẹp ngân sách. Phần còn lại đi nhẹ chân thôi.',
        'Khoản bắt buộc đã nặng rồi, đừng cộng thêm drama mua sắm.',
        'Rent đã full, quỹ linh hoạt giờ mỏng như niềm tin cuối tháng.',
        'Bạn vừa đóng tiền nhà xong, giờ đừng đóng thêm vai liều.',
      ],
      vietnamese_parent: [
        'Tiền nhà đã tới ngưỡng rồi, bớt khoản linh tinh ngay.',
        'Khoản trọ nặng rồi đấy. Từ giờ tiêu phải có nghĩ.',
        'Nhà cửa là bắt buộc, nên mấy khoản vui dừng lại.',
        'Mục rent đã kín ngân sách. Đừng tiêu thêm theo hứng.',
        'Xong tiền nhà rồi thì giữ ví cẩn thận phần còn lại.',
      ],
    },
  },
  {
    context: 'entertainment',
    trigger: 'repeat_category_week',
    severity: 'medium',
    byPersona: {
      advisor: [
        'Tuần này giải trí hơi dày rồi, mình giảm một nhịp nhé.',
        'Khoản vui đang tăng đều, cân lại để không lệch ngân sách.',
        'Giải trí là cần, nhưng tần suất tuần này hơi cao.',
        'Nếu chưa thật cần, mình dời một buổi sang tuần sau nhé.',
        'Giữ vui vừa đủ thì ví sẽ đỡ áp lực cuối tháng.',
      ],
      wallet_pet: [
        'Tuần này ví bé đi giải trí hơi nhiều rồi đó nha.',
        'Ví bé vẫn muốn vui, nhưng xin bớt một vé hôm nay.',
        'Playlist vui nhưng ví bé bắt đầu rén nhẹ rồi á.',
        'Thêm một buổi nữa là ví bé tụt pin luôn đó.',
        'Giải trí xinh thôi, đừng để ví bé phải khóc 🥹',
      ],
      toxic_friend: [
        'Tuần này mood vui thì ổn, ví thì không ổn lắm.',
        'Giải trí đang lên lịch dày hơn lịch họp của bạn.',
        'Một buổi nữa thôi nghe quen quá, và khá đắt.',
        'Bạn đang đầu tư vào dopamine, lãi suất là áp lực.',
        'Vui tiếp cũng được, miễn đừng sốc khi cuối tháng tới.',
      ],
      vietnamese_parent: [
        'Tuần này đi chơi hơi nhiều rồi đấy.',
        'Giải trí vừa thôi, tiền đâu mà theo mãi.',
        'Bớt một buổi lại cho ví đỡ mệt.',
        'Đừng tiêu kiểu “thích là đi” nữa.',
        'Vui cũng phải có giới hạn, nhớ chưa.',
      ],
    },
  },
  {
    context: 'health',
    trigger: 'large_transaction',
    severity: 'high',
    byPersona: {
      advisor: [
        'Khoản sức khỏe này khá lớn. Mình cân lại các mục khác nhé.',
        'Chi cho sức khỏe là cần, chỉ cần giữ phần còn lại ổn định.',
        'Giao dịch y tế vừa nặng ví, ưu tiên phòng thủ phần linh hoạt.',
        'Khoản này quan trọng, nhưng mình vẫn cần giữ tổng ngân sách.',
        'Xong khoản health lớn rồi, phần còn lại đi chậm một nhịp nhé.',
      ],
      wallet_pet: [
        'Khoản sức khỏe này làm ví bé hơi choáng.',
        'Ví bé hiểu là cần thiết, nhưng cần nghỉ xíu nha.',
        'Giao dịch này nặng thật, ví bé tụt pin nhẹ rồi.',
        'Sức khỏe quan trọng, ví bé chỉ xin bạn giữ nhịp sau đó.',
        'Ví bé vừa chi mạnh vì health, giờ xin đừng bấm thêm.',
      ],
      toxic_friend: [
        'Khoản health này nặng thật, tháng này bớt tiêu cho vui đi.',
        'Tiền cho sức khỏe đã khá to, đừng cộng thêm chi cảm xúc.',
        'Giao dịch này bắt buộc, mấy giao dịch sau đừng tự nguyện đau.',
        'Ví vừa gánh một khoản lớn, đừng bắt nó tăng ca tiếp.',
        'Cứu sức khỏe là đúng, cứu luôn ngân sách phần còn lại nhé.',
      ],
      vietnamese_parent: [
        'Khoản y tế lớn rồi, mấy khoản linh tinh dừng lại.',
        'Chi sức khỏe là đúng, nhưng phần khác phải bớt.',
        'Vừa chi mạnh tay rồi, giờ tiêu phải kỹ.',
        'Ưu tiên sức khỏe xong thì giữ ví cho chặt.',
        'Khoản này cần thiết, nên đừng tiêu thêm bừa bãi.',
      ],
    },
  },
  {
    context: 'education',
    trigger: 'large_transaction',
    severity: 'medium',
    byPersona: {
      advisor: [
        'Khoản học này đáng đầu tư, mình cân lại mục khác nhé.',
        'Chi cho học tập ổn, miễn phần còn lại đi có kế hoạch.',
        'Giao dịch giáo dục vừa khá lớn, tạm giảm khoản tùy hứng.',
        'Đầu tư cho kiến thức là tốt, ngân sách vẫn cần cân bằng.',
        'Xong khoản học rồi, mình giữ nhịp chi phần còn lại nhé.',
      ],
      wallet_pet: [
        'Ví bé ủng hộ học tập, nhưng cũng hơi rén số tiền này á.',
        'Khoản course này nặng nhẹ vừa đủ làm ví bé thở dài.',
        'Đầu tư cho bản thân là xịn, ví bé xin bạn tiêu chậm lại.',
        'Ví bé vừa đóng học phí, xin nghỉ mua sắm vài hôm nha.',
        'Học là tốt, ví bé chỉ xin kế hoạch đi kèm thôi.',
      ],
      toxic_friend: [
        'Khoản học này ổn, miễn đừng thêm combo mua hứng sau đó.',
        'Đầu tư kiến thức nghe đẹp, nhớ đừng phá ví ở mục khác.',
        'Bạn vừa chi cho tương lai, đừng tiêu tiếp kiểu quên tương lai.',
        'Course đã mua rồi, bài tập đầu tiên là giữ ngân sách.',
        'Chi cho học có lý do, chi theo mood thì không.',
      ],
      vietnamese_parent: [
        'Tiền học thì đáng, nên khoản khác phải bớt.',
        'Đã đóng học phí rồi, đừng tiêu thêm linh tinh.',
        'Học hành nghiêm túc thì chi tiêu cũng phải nghiêm túc.',
        'Khoản giáo dục xong rồi, giữ ví phần còn lại.',
        'Chi cho học được, nhưng đừng vin cớ tiêu bậy.',
      ],
    },
  },
];

export const NOTIFICATION_CATEGORY_TEMPLATES: NotificationTemplate[] = CATEGORY_POOLS.flatMap(seed =>
  (Object.entries(seed.byPersona) as Array<[NotificationPersona, string[]]>).flatMap(([persona, lines]) =>
    lines.slice(0, 5).map((body, index) => {
      const tier = tierByLineIndex(index);
      const template: NotificationTemplate = {
        id: `${seed.context}_${seed.trigger}_${persona}_${index + 1}`,
        trigger: seed.trigger,
        persona,
        severity: seed.severity,
        tier,
        context: seed.context,
        body,
        tags: [`context_${seed.context}`, `tier_${tier}`],
        origin: 'generated',
      };
      return template;
    }),
  ),
);
