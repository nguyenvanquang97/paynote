type AiToneMode = 'gentle' | 'cute' | 'sarcastic_strong' | 'angry';
type Threshold = 80 | 100 | 120;
type RoastContextKey = 'generic' | 'food' | 'cafe' | 'rent';

export interface RoastFallbackContext {
  categoryLabel: string;
  percent: number;
  spentText: string;
  limitText: string;
  threshold: Threshold;
}

const TEMPLATES: Record<AiToneMode, string[]> = {
  gentle: [
    'Mình nhắc nhẹ thôi: {categoryLabel} đã lên {percent}%, mình giảm nhịp từ hôm nay để cuối tháng đỡ áp lực nhé.',
    '{categoryLabel} đang ở {percent}%, bạn đi chậm lại một chút là tài chính sẽ cân bằng hơn hẳn.',
    'Ví vẫn ổn, nhưng {categoryLabel} đã {percent}% rồi, giữ kỷ luật sớm sẽ dễ thở hơn nhiều.',
    'Mốc {percent}% ở {categoryLabel} tới rồi, mình ưu tiên khoản cần trước để tránh trượt khỏi kế hoạch.',
    'Mình thấy {categoryLabel} đang tăng khá nhanh ({percent}%), bớt vài khoản cảm xúc là đẹp ngay.',
    '{categoryLabel} đã dùng {spentText} trên {limitText} ({percent}%), chỉnh nhẹ từ bây giờ là kịp.',
    'Bạn đang làm khá tốt, chỉ cần siết nhẹ ở {categoryLabel} vì mức {percent}% đã hơi cao rồi.',
    'Nhịp chi {categoryLabel} đã chạm {percent}%, giữ tay thêm một chút là cuối tháng rất khác.',
    'Nếu hôm nay bạn chậm lại ở {categoryLabel} ({percent}%), phần còn lại của tháng sẽ dễ chịu hơn nhiều.',
    '{categoryLabel} đã tới {percent}%, mình tiêu có chủ đích hơn một nhịp để giữ sự an tâm nhé.',
    'Đã {percent}% cho {categoryLabel}, đây là lúc mình chọn nhu cầu thật sự thay vì mua theo hứng.',
    'Mình báo sớm để bạn đỡ căng: {categoryLabel} đang {percent}%, chỉ cần điều chỉnh nhỏ thôi.',
    '{categoryLabel} tăng tới {percent}% rồi, giảm vài khoản linh tinh là ngân sách về lại quỹ đạo.',
    'Con số {percent}% ở {categoryLabel} là tín hiệu tốt để mình chậm lại trước khi phải sửa sai.',
    'Bạn hoàn toàn kéo lại được, bắt đầu bằng việc hạ tốc độ chi cho {categoryLabel} từ mức {percent}%.',
    '{categoryLabel} đạt {percent}% rồi, mình giữ nhịp đều tay để không bị dồn áp lực cuối tháng.',
    'Đây là lời nhắc thân thiện: {categoryLabel} {percent}% và vẫn còn nhiều ngày phía trước.',
    'Chi {categoryLabel} đã lên {percent}%, mình khóa bớt khoản không cần để bảo toàn phần còn lại.',
    'Từ mốc {percent}% của {categoryLabel}, mỗi quyết định chi tiêu có kế hoạch sẽ giúp bạn nhẹ đầu hơn.',
    '{categoryLabel} đang nóng dần ({percent}%), đi chậm một chút bây giờ sẽ tiết kiệm nhiều lo lắng.',
    'Mức {percent}% ở {categoryLabel} chưa muộn, mình xoay nhẹ thói quen hôm nay là đủ khác biệt.',
    'Ví đang nhắc rất lịch sự: {categoryLabel} đã {percent}%, ưu tiên điều quan trọng trước nhé.',
    'Bạn còn dư thời gian để tối ưu, chỉ cần bớt ga ở {categoryLabel} khi đang ở {percent}%.',
    '{categoryLabel} đã vượt nửa chặng khá xa ({percent}%), cân lại sớm để không chạm trần quá nhanh.',
    'Mình tin bạn làm được, bắt đầu từ việc tiêu chậm ở {categoryLabel} vì mức {percent}% đã cảnh báo rồi.',
    'Hôm nay bớt một khoản nhỏ ở {categoryLabel} ({percent}%) sẽ đổi lấy sự thoải mái cả cuối tháng.',
    'Ngân sách thích người điềm tĩnh, và {categoryLabel} ở {percent}% đang cần đúng sự điềm tĩnh đó.',
    'Mình không cấm bạn chi tiêu, chỉ nhắc rằng {categoryLabel} đã {percent}% nên cần chọn lọc kỹ hơn.',
    '{categoryLabel} đã lên {percent}% với {spentText}/{limitText}, dừng đúng lúc sẽ luôn rẻ hơn sửa muộn.',
    'Nhắc khẽ lần này thôi: {categoryLabel} {percent}% rồi, ưu tiên kỷ luật nhẹ để giữ ví khỏe.',
  ],
  cute: [
    'Ví gửi tín hiệu ét o ét: {categoryLabel} đã {percent}% rồi nè, mình ngoan tay lại xíu nha.',
    'Cảnh báo siêu xinh: {categoryLabel} đang {percent}%, bớt chốt đơn cảm xúc để ví còn cười nha.',
    '{categoryLabel} lên {percent}% rồi á, mình tiêu thông minh một nhịp là mọi thứ vẫn ổn nè.',
    'Bạn ơi, {categoryLabel} {percent}% rùi, cho ví nghỉ giải lao một chút được không nào.',
    'Mốc {percent}% ở {categoryLabel} tới nhanh ghê, mình dịu tay thôi là cuối tháng vẫn chill.',
    'Ví đang “đứng hình 5 giây” vì {categoryLabel} {percent}%, cứu ví bằng vài quyết định tỉnh táo nha.',
    '{categoryLabel} đã dùng {spentText}/{limitText} ({percent}%), mình ưu tiên món cần trước nhen.',
    'Nhắc yêu nhẹ cái nè: {categoryLabel} chạm {percent}% rồi, mình bớt mua theo mood nha.',
    'Mood mua sắm dễ thương, nhưng {categoryLabel} {percent}% rồi nên mình chậm lại một xíu nhé.',
    'Ví bé nói nhỏ: {categoryLabel} đã {percent}% rồi đó, thương ví thì giữ kỷ luật nha.',
    '{categoryLabel} đang khá nóng ở mức {percent}%, mình đổi sang mode “cần mới mua” đi nè.',
    'Mình vẫn có thể vui mà không quá tay: {categoryLabel} {percent}% nên chọn lọc chút nha.',
    'Trời ơi, {categoryLabel} {percent}% luôn rồi, quay xe nhẹ nhàng trước khi ví khóc to nha.',
    'Cảnh báo đáng yêu nhưng nghiêm túc: {categoryLabel} đã lên {percent}% và cần bạn giảm ga rồi đó.',
    '{categoryLabel} đang tăng nhanh ({percent}%), hôm nay mình làm phiên bản tiêu tiền thật tỉnh nè.',
    'Đến mốc {percent}% ở {categoryLabel} rùi, bớt một món linh tinh là ví vui liền á.',
    'Ví thả tim nếu bạn hạ tốc ở {categoryLabel}, vì mức {percent}% đang hơi căng rồi nè.',
    '{categoryLabel} {percent}% rồi nha, mình giữ tiền cho thứ quan trọng để tương lai cảm ơn mình.',
    'Bạn ơi đừng “quá là tr quá là tr” với mua sắm nữa, {categoryLabel} đã {percent}% rồi đó.',
    'Nhắc xinh lần nữa: {categoryLabel} đã {percent}% nên mình tiêu có kế hoạch cho đúng vibe nha.',
    '{categoryLabel} {percent}% cùng {spentText}/{limitText} rồi, chậm lại là ví lại đáng yêu ngay.',
    'Ví cần bạn cứu viện nhẹ: {categoryLabel} chạm {percent}% và vẫn còn cả quãng cuối tháng nè.',
    'Mình không cản bạn tận hưởng, chỉ nhắc {categoryLabel} {percent}% thì nên tận hưởng có giới hạn nha.',
    'Nếu bây giờ bạn bớt tay ở {categoryLabel} ({percent}%), cuối tháng vẫn xinh mà không lo.',
    'Tình hình {categoryLabel} đang báo đỏ nhẹ ({percent}%), mình đổi mode sang chi tiêu ngoan nhé.',
    'Hôm nay làm người tiêu dùng dễ thương có kế hoạch nha, vì {categoryLabel} đã {percent}% rồi.',
    '{categoryLabel} tăng tới {percent}% nhanh quá, ví kêu “hết cứu” nếu mình không phanh ngay đó.',
    'Mình khóa tạm các món mua cho vui nhé, vì {categoryLabel} đang ở {percent}% rồi nè.',
    '{categoryLabel} {percent}% không phải thảm họa, miễn là từ giờ mình chi thật có chủ đích nha.',
    'Chốt nhẹ nè: {categoryLabel} {percent}% rồi, thương ví thì giảm nhịp từ hôm nay nha.',
  ],
  sarcastic_strong: [
    '{categoryLabel} đã {percent}% rồi, tốc độ này mà nói “ổn” thì đúng là tinh thần lạc quan cấp quốc gia.',
    'Mới vậy mà {categoryLabel} lên {percent}%, bạn đang đầu tư mạnh vào cảm xúc ngắn hạn.',
    '{categoryLabel} dùng {spentText}/{limitText} ({percent}%), kế hoạch tài chính chắc chỉ để trang trí.',
    'Mốc {percent}% ở {categoryLabel} tới sớm ghê, cuối tháng đừng ngạc nhiên khi ví im lặng hoàn toàn.',
    'Bạn tiêu {categoryLabel} nhanh hơn cả lúc hứa tiết kiệm, thành tích này khá nhất quán.',
    '{categoryLabel} đã {percent}%, ví không yếu đâu, chỉ là bạn đang chơi chế độ hard với tiền của mình.',
    'Đến {percent}% cho {categoryLabel} rồi, mua thì đã tay, phần xử lý hậu quả mới là game chính.',
    '{categoryLabel} tăng lên {percent}% với tốc độ đẹp, đẹp theo nghĩa báo động tài chính.',
    'Bạn vừa đẩy {categoryLabel} lên {percent}%, còn ngân sách thì đang ngồi nhìn trong bất lực.',
    'Chi {categoryLabel} đã chạm {percent}%, cảm xúc mua sắm thắng liên tiếp, logic tạm nghỉ.',
    '{categoryLabel} đạt {percent}% rồi, nếu vẫn giữ nhịp này thì cuối tháng sẽ có plot twist rất đời.',
    'Ví đang phát tín hiệu ét o ét vì {categoryLabel} {percent}%, còn bạn thì vẫn bình thản đáng nể.',
    'Con số {percent}% ở {categoryLabel} nói rõ một điều: “mua nốt” là câu đắt nhất tháng này.',
    'Tới mức {percent}% ở {categoryLabel}, nếu còn tăng ga thì đừng trách số dư phản ứng tiêu cực.',
    '{categoryLabel} đã leo tới {percent}% rồi, bạn đang đi đúng lộ trình… của áp lực cuối tháng.',
    '{categoryLabel} {percent}%: tiêu thì nhanh, hối tiếc thì thường tới đúng lịch.',
    'Bạn có quyền phớt lờ cảnh báo, nhưng {categoryLabel} {percent}% sẽ không tự biến mất đâu.',
    'Mốc {percent}% đã bật ở {categoryLabel}, đây là lúc dùng não trước khi dùng ví.',
    '{categoryLabel} đang ở {percent}%, và câu “mai tính” thường là mở màn cho một tháng khó thở.',
    'Thành tựu mới: {categoryLabel} {percent}% quá sớm, ngân sách đứng hình 5 giây.',
    'Nếu tiếp tục nhịp này, {categoryLabel} không chỉ vượt trần mà còn kéo theo chuỗi haha cuối tháng.',
    '{categoryLabel} {percent}% rồi, có vẻ bạn đang luyện kỹ năng biến tiền thành lịch sử giao dịch.',
    'Mức {percent}% ở {categoryLabel} cho thấy bạn rất kiên định, tiếc là kiên định sai hướng.',
    '{categoryLabel} dùng tới {percent}% ngân sách, một pha “quá là tr quá là tr” với chi tiêu.',
    'Từ {percent}% của {categoryLabel} trở đi, mỗi lần “mua nhanh” là một lần vay áp lực từ tương lai.',
    '{categoryLabel} đã {percent}% và vẫn còn nhiều ngày, đúng chuẩn mở đầu phim căng thẳng.',
    'Ngân sách cảnh báo rõ rồi: {categoryLabel} {percent}%, phần còn lại là bạn có chịu phanh hay không.',
    'Đà chi của bạn rất ổn định, ổn định theo hướng khiến ví mỏng đi đều.',
    '{categoryLabel} {percent}% với {spentText}/{limitText}, nếu không chỉnh nhịp thì cuối tháng tự hiểu.',
    'Chốt ngắn: {categoryLabel} đã {percent}%, tiếp tục tiêu cảm tính thì đừng hỏi vì sao hụt tiền.',
  ],
  angry: [
    'Tao nói thẳng luôn: {categoryLabel} đã {percent}% rồi mà mày còn tiêu theo hứng thì cuối tháng tự ôm áp lực lấy.',
    'Mày nhìn cho kỹ, {categoryLabel} đang {percent}% với {spentText}/{limitText}, dừng bốc đồng ngay cho tao.',
    'Đến mốc {percent}% ở {categoryLabel} mà vẫn tăng ga thì mày đang tự phá kế hoạch của chính mày.',
    'Tao nhắc một lần thôi: từ giờ khoản nào không thiết yếu thì cắt, vì {categoryLabel} đã {percent}% rồi.',
    '{categoryLabel} đã lên {percent}% rồi đó, mày bớt cái kiểu “mua nốt” đi trước khi ví cạn sạch.',
    'Mức chi {categoryLabel} đang nóng {percent}%, còn mày cứ bình thản thì chỉ có nước trả giá cuối tháng.',
    'Mày tiêu như không có ngày mai, nên {categoryLabel} mới nhảy lên {percent}% nhanh vậy đó.',
    '{categoryLabel} đã đạt {percent}% mà mày còn chủ quan thì tao nói thật là tự làm khổ mình thôi.',
    'Tao cần hành động chứ không cần lời hứa, phanh ngay ở {categoryLabel} khi nó đã {percent}%.',
    'Đừng ngồi đó thương lượng với con số, {categoryLabel} {percent}% rồi thì mày phải siết ví ngay lập tức.',
    'Nghe rõ này: {categoryLabel} {percent}% không phải chuyện nhỏ, từ giờ chỉ chi thứ bắt buộc.',
    'Mày cứ đẩy thêm một giao dịch là tự đào hố sâu hơn, vì {categoryLabel} đã {percent}% rồi.',
    'Tao không đùa đâu, {categoryLabel} đang {percent}% mà còn mua theo cảm xúc là tự bẻ gãy ngân sách.',
    'Con số {percent}% ở {categoryLabel} là cảnh cáo cuối, mày không phanh thì đừng than vãn nữa.',
    'Mày muốn đỡ mệt cuối tháng thì làm ngay: dừng chi linh tinh vì {categoryLabel} đã {percent}%.',
    '{categoryLabel} đã {percent}% rồi, bỏ ngay thói quen “thích là mua”, không có ngoại lệ.',
    'Tao nói thật gắt: mày đang tự biến ví thành nạn nhân khi để {categoryLabel} leo tới {percent}%.',
    'Đừng viện cớ nữa, {categoryLabel} {percent}% là dữ kiện rõ ràng và mày phải chỉnh nhịp ngay bây giờ.',
    'Nếu còn thêm khoản vô nghĩa nào nữa thì {categoryLabel} sẽ kéo cả tháng này xuống dốc, hiểu chưa.',
    'Mày đang chơi trò rủi ro với tiền của mình, bằng chứng là {categoryLabel} đã {percent}% rồi đó.',
    '{categoryLabel} {percent}% mà vẫn tiêu kiểu cũ thì đúng là tự đẩy mình vào thế bí.',
    'Tao không cần mày xin lỗi, tao cần mày dừng chi không cần thiết khi {categoryLabel} đã {percent}%.',
    'Mốc {percent}% ở {categoryLabel} là tiếng chuông rất to rồi, mày còn lờ đi thì chịu.',
    'Hôm nay mày không phanh thì mai mày sẽ phải cắt đau hơn, vì {categoryLabel} đã quá nóng {percent}%.',
    'Tao nhắc kiểu con người luôn: bớt ga ngay, vì {categoryLabel} đã {percent}% và ngân sách không chịu nổi nữa.',
    'Mày đừng tự dối mình là còn kiểm soát được, nhìn {categoryLabel} {percent}% thì biết là đang trượt rồi.',
    '{categoryLabel} {percent}% cùng tốc độ chi hiện tại là công thức chuẩn cho một cuối tháng ngộp thở.',
    'Nghe cho kỹ, từ giờ không có chuyện “nốt lần này”, vì {categoryLabel} đã {percent}% quá rõ rồi.',
    'Tao chốt ngắn mà gắt: khóa chi cảm tính ngay, vì {categoryLabel} đã leo tới {percent}% rồi.',
    'Mày muốn yên ổn thì hành động ngay phút này, chứ để {categoryLabel} {percent}% rồi mới lo là muộn.',
  ],
};

const CONTEXT_PATTERNS: Record<Exclude<RoastContextKey, 'generic'>, RegExp[]> = {
  food: [/ăn/u, /uống/u, /ăn uống/u, /ăn vặt/u, /đồ ăn/u, /thực phẩm/u, /meal|food|lunch|dinner/i],
  cafe: [/cà phê/u, /cafe/i, /coffee/i, /trà sữa/u, /đồ uống/u, /matcha/i],
  rent: [/trọ/u, /tiền nhà/u, /thuê nhà/u, /nhà ở/u, /rent|apartment|room/i],
};

const CONTEXT_TEMPLATES: Record<
  Exclude<RoastContextKey, 'generic'>,
  Record<AiToneMode, string[]>
> = {
  food: {
    gentle: [
      'Ăn uống đang tới {percent}% rồi, mình lên thực đơn đơn giản vài ngày để giữ ví khỏe nhé.',
      '{categoryLabel} đã dùng {spentText}/{limitText}, nếu tự nấu thêm chút thì ngân sách sẽ nhẹ đi nhiều.',
      'Mốc {percent}% cho ăn uống là tín hiệu tốt để mình giảm các bữa ăn theo cảm hứng.',
      'Bạn thử đặt trần mỗi bữa một chút, vì {categoryLabel} đang khá nóng ở {percent}%.',
      'Ăn ngon vẫn được, chỉ cần bớt tần suất gọi món vì {categoryLabel} đã {percent}% rồi.',
    ],
    cute: [
      'Đồ ăn thì vui thiệt, nhưng {categoryLabel} {percent}% rồi nè, mình cho ví ăn kiêng nhẹ nha.',
      'Ví kêu ét o ét vì ăn uống đã {percent}%, hôm nay nấu đơn giản là xinh luôn.',
      '{categoryLabel} dùng {spentText}/{limitText} rồi, bớt một lần “ăn sang” là ví cười liền.',
      'Mình ăn ngon có kế hoạch nha, vì ăn uống đang {percent}% rồi á.',
      'Bụng vui rồi, giờ tới lượt ví vui: hạ nhịp chi ăn uống từ mức {percent}% nhen.',
    ],
    sarcastic_strong: [
      'Ăn uống đã {percent}% rồi, tốc độ này thì cuối tháng chắc ăn mì bằng trải nghiệm.',
      '{categoryLabel} {percent}% với {spentText}/{limitText}: gọi món nhanh hơn cả lúc lập ngân sách.',
      'Nhìn con số ăn uống {percent}% là biết bạn đang đầu tư mạnh vào niềm vui ngắn hạn.',
      'Nếu tiếp tục nhịp này, phần “ăn ngon” sẽ chuyển thành “lo số dư” rất đúng lịch.',
      'Ăn uống tới {percent}% quá sớm, ngân sách đứng hình 5 giây là đúng quy trình.',
    ],
    angry: [
      'Ăn uống đã {percent}% rồi mà mày còn gọi món vô tội vạ thì tự chịu áp lực cuối tháng.',
      'Mày dừng ngay kiểu ăn theo mood đi, vì {categoryLabel} đã đốt tới {spentText}/{limitText}.',
      'Tao nói thẳng: từ giờ bữa nào không cần thì cắt, vì ăn uống đã lên {percent}% quá rõ.',
      'Đừng viện cớ “ăn cho đỡ stress”, {categoryLabel} {percent}% là đủ thấy mày đang mất kiểm soát.',
      'Muốn ổn thì hành động ngay: giảm đơn đồ ăn từ phút này vì ăn uống đã {percent}%.',
    ],
  },
  cafe: {
    gentle: [
      'Cà phê đang ở {percent}%, mình giảm tần suất một chút để ngân sách tháng đỡ căng nhé.',
      '{categoryLabel} đã dùng {spentText}/{limitText}, thử chuyển vài ly sang tự pha để nhẹ ví hơn.',
      'Mức {percent}% cho cà phê tới hơi nhanh, mình giữ nhịp vừa phải từ hôm nay nhé.',
      'Một vài ly “cho tỉnh” đang cộng dồn khá mạnh, vì {categoryLabel} đã {percent}% rồi.',
      'Mình vẫn uống cà phê bình thường, chỉ cần có giới hạn vì {categoryLabel} đang nóng {percent}%.',
    ],
    cute: [
      'Cafe vui đó nhưng {categoryLabel} {percent}% rồi nè, ví xin bạn bớt một ly mỗi ngày nha.',
      'Ly này ngon thật, mà {categoryLabel} đã {percent}% rồi, mình chuyển qua mode tiết chế xinh nhen.',
      'Ví bảo: “đừng thêm topping nữa”, vì cà phê đã dùng {spentText}/{limitText} rùi.',
      'Cảnh báo đáng yêu: cà phê đang nóng {percent}%, tự pha vài hôm cho ví thở nha.',
      'Mình vẫn chill được mà, chỉ cần giảm nhịp cafe vì {categoryLabel} đã {percent}% rồi á.',
    ],
    sarcastic_strong: [
      'Cà phê đã {percent}% rồi, có vẻ ví bạn đang tài trợ full cho caffeine.',
      '{categoryLabel} dùng {spentText}/{limitText}: tỉnh táo thì có, còn ngân sách thì đang ngủm.',
      'Mỗi ly nhỏ cộng lại thành con số to, bằng chứng là cà phê đã {percent}% quá sớm.',
      'Nếu cứ “thêm một ly nữa”, cuối tháng bạn sẽ tỉnh theo cách không ai muốn.',
      'Cà phê {percent}% rồi, thói quen nhỏ đang tạo hóa đơn rất có tiếng nói.',
    ],
    angry: [
      'Cà phê đã {percent}% rồi mà mày còn uống theo hứng thì tự làm mỏng ví của mày thôi.',
      'Tao nhắc rõ: giảm ly ngoài quán ngay, vì {categoryLabel} đã ngốn {spentText}/{limitText}.',
      'Đừng tự bào chữa nữa, cà phê {percent}% là mày đang chi quá tay rồi.',
      'Muốn giữ tiền thì cắt bớt cafe từ hôm nay, không có chuyện “ly cuối” nữa.',
      'Mày còn tăng ga ở cà phê thì cuối tháng tự gánh, vì {categoryLabel} đã {percent}% quá rõ.',
    ],
  },
  rent: {
    gentle: [
      'Tiền trọ đang ở {percent}%, mình tạm siết các khoản khác để cân lại tổng ngân sách tháng nhé.',
      '{categoryLabel} đã dùng {spentText}/{limitText}, mình ưu tiên quỹ cố định để tránh áp lực dây chuyền.',
      'Vì tiền trọ chiếm tỷ trọng lớn, mức {percent}% này là tín hiệu cần giữ kỷ luật sớm.',
      'Mốc {percent}% ở tiền trọ tới rồi, mình phòng thủ nhẹ ở các danh mục linh hoạt nhé.',
      'Tiền nhà đã lên {percent}%, từ giờ mỗi khoản phụ nên cân nhắc kỹ hơn một nhịp.',
    ],
    cute: [
      'Tiền trọ đã {percent}% rồi nè, mình ôm ví chặt hơn xíu để phần còn lại vẫn ổn nha.',
      '{categoryLabel} dùng {spentText}/{limitText} rùi, mình bớt chi linh tinh để không bị đuối nha.',
      'Cảnh báo xinh nhưng nghiêm túc: tiền nhà {percent}% nên cần tiết chế mấy khoản phụ liền nè.',
      'Nhắc yêu nhẹ nè, trọ đang nóng {percent}%, mình giữ ví ngoan để cuối tháng đỡ lo nha.',
      'Tiền trọ lên nhanh rồi á, mình chuyển mode “chi có kế hoạch” để ví không hoảng nhen.',
    ],
    sarcastic_strong: [
      'Tiền trọ đã {percent}% rồi, sai một nhịp nhỏ ở khoản khác là tháng này rất dễ căng.',
      '{categoryLabel} {percent}% với {spentText}/{limitText}: khoản cố định đã nặng, còn tiêu linh tinh nữa thì toang.',
      'Tiền nhà vốn không đùa, mà bạn vẫn định tiêu như chưa có gì xảy ra.',
      'Trọ đã lên {percent}%, nếu không phanh ở phần còn lại thì áp lực tới đúng hẹn.',
      'Khoản nặng nhất tháng đã chiếm {percent}%, đây không phải lúc mua theo cảm xúc.',
    ],
    angry: [
      'Tiền trọ đã {percent}% rồi, mày còn tiêu bừa ở khoản khác thì tự dồn mình vào thế bí.',
      'Nhìn {spentText}/{limitText} của tiền nhà đi, rồi dừng ngay chi linh tinh cho tao.',
      'Khoản trọ đã nặng thế này mà mày còn chủ quan thì cuối tháng chỉ có tự chịu.',
      'Tao chốt luôn: tiền trọ {percent}% rồi, từ giờ mọi khoản không cần thiết phải cắt.',
      'Mày không siết ngay phần còn lại thì tiền nhà sẽ kéo cả tháng này xuống, rõ chưa.',
    ],
  },
};

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const detectContextKey = (categoryLabel: string): RoastContextKey => {
  const normalized = categoryLabel.trim();
  if (!normalized) {
    return 'generic';
  }
  const entries = Object.entries(CONTEXT_PATTERNS) as Array<
    [Exclude<RoastContextKey, 'generic'>, RegExp[]]
  >;
  for (const [key, patterns] of entries) {
    if (patterns.some(pattern => pattern.test(normalized))) {
      return key;
    }
  }
  return 'generic';
};

export const buildFallbackRoastMessage = (
  tone: AiToneMode,
  context: RoastFallbackContext,
): string => {
  const contextKey = detectContextKey(context.categoryLabel);
  const contextBucket =
    contextKey === 'generic' ? [] : CONTEXT_TEMPLATES[contextKey][tone];
  const bucket = contextBucket.length > 0 ? contextBucket : TEMPLATES[tone];
  const seed = `${context.categoryLabel}|${context.percent}|${context.threshold}|${Date.now() >> 12}`;
  const idx = hashString(seed) % bucket.length;
  return bucket[idx]
    .replaceAll('{categoryLabel}', context.categoryLabel)
    .replaceAll('{percent}', String(context.percent))
    .replaceAll('{spentText}', context.spentText)
    .replaceAll('{limitText}', context.limitText);
};
