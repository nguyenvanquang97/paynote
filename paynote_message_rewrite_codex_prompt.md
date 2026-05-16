# PayNote Notification Message Rewrite - Codex Instruction

## Mục tiêu

Sửa riêng phần **message notification** của PayNote.

Hiện tại engine, persona, memory, cooldown đã có hướng đúng. Vấn đề chính là **copywriting message vẫn chưa đạt**:

- Nhiều câu còn giống app tài chính nghiêm túc.
- `toxic_friend` chưa đủ cà khịa.
- `wallet_pet` chưa đủ dễ thương/meme.
- `vietnamese_parent` có chỗ quá gắt hoặc quá dài.
- Một số message đang được auto-generate từ câu generic bằng prefix/tail, nên cấu trúc bị lặp.
- Mục tiêu là làm message giống tinh thần Rolly: ngắn, đời, dễ screenshot, có nhân vật, ít trùng lặp.

Không copy câu của Rolly. Chỉ học phong cách: cá tính, vui, mắng yêu, cà khịa hành vi chi tiêu.

---

## File cần tập trung sửa

Ưu tiên sửa các file này:

```txt
src/services/notifications/notificationPlanTemplates.ts
src/services/notifications/notificationCategoryTemplates.ts
src/services/notifications/notificationTemplates.ts
android/app/src/main/java/com/paynote/app/PeriodicPlanFallbackTemplates.kt
android/app/src/main/java/com/paynote/app/PeriodicFallbackTemplates.kt
```

Nếu `notificationPlanTemplates.ts` đang auto-generated thì sửa generator hoặc source markdown, không sửa tay file generated rồi để bị ghi đè.

Tìm file generator:

```txt
scripts/generate-notification-plan-templates.js
paynote_notification_refactor_plan.md
```

---

## Nguyên tắc bắt buộc

### 1. Không auto-generate persona bằng cách thêm prefix/tail

Không làm kiểu này:

```ts
const toPet = line => `Ví bé nhắc nhẹ: ${line}`;
const toToxic = line => `${line} Sao kê sẽ nhớ rất rõ câu chuyện này.`;
const toParent = line => `${line} Giữ ví cho tử tế.`;
```

Lý do: câu bị giống nhau, không có cá tính thật.

Phải viết tay message riêng cho từng persona.

---

### 2. Mỗi persona phải có giọng riêng

#### advisor - Cố vấn tử tế

Giọng:
- Nhẹ nhàng.
- Ngắn.
- Tỉnh táo.
- Không quá văn mẫu.
- Không cà khịa.

Ví dụ đúng:

```txt
"Khoản này hơi căng rồi. Chậm lại một nhịp nhé."
"Ví chưa sao, nhưng đang cần được nghỉ."
"Tháng còn dài, đừng để hôm nay phá mood cuối tháng."
```

Ví dụ sai:

```txt
"Bạn nên cân nhắc kỹ lưỡng các khoản chi tiêu để đảm bảo cân bằng tài chính cá nhân."
```

#### wallet_pet - Ví bé biết khóc

Giọng:
- Có nhân vật "ví bé".
- Dễ thương.
- Meme nhẹ.
- Mỗi câu tối đa 1 emoji.
- Không quá sến.

Ví dụ đúng:

```txt
"Ví bé rén ngang 🥹"
"Ví bé xin nghỉ phép sau giao dịch này."
"Tiền vừa đi du lịch một chiều rồi á."
"Ví bé vừa tụt pin vì {amountText}."
```

Ví dụ sai:

```txt
"Ví bé nhắc nhẹ: danh mục này đang tăng nhanh, bạn nên cân nhắc lại."
```

#### toxic_friend - Bạn thân toxic

Giọng:
- Cà khịa.
- Châm biếm.
- Đời thường.
- Ngắn, có punchline.
- Không chửi tục.
- Cà khịa hành vi, không xúc phạm con người.

Ví dụ đúng:

```txt
"Kế hoạch tiết kiệm vừa bị trà sữa đánh bại."
"Bạn không mua đồ, bạn đang mua áp lực cuối tháng."
"Sale 50% nhưng tiền mất vẫn là tiền thật."
"Ví bạn đang tài trợ full cho caffeine."
```

Ví dụ sai:

```txt
"Đà chi tiêu này khá đẹp, đẹp cho một cái kết cuối tháng nhiều suy ngẫm."
```

#### vietnamese_parent - Mẹ Việt Nam

Giọng:
- Mắng yêu kiểu phụ huynh Việt Nam.
- Ngắn.
- Đời.
- Có thể gắt nhưng không tục.
- Không lạm dụng "tao/mày" trong template default.
- Template có "mày/tao" phải tag `strong_language`.

Ví dụ đúng:

```txt
"Tiền mọc trên cây à?"
"Không cần thì đừng mua."
"Tháng trước vừa than hết tiền xong."
"Bếp ở nhà để trưng à?"
```

Ví dụ sai:

```txt
"Tao nói thẳng luôn, mày dừng kiểu tiêu theo hứng ngay bây giờ nếu không muốn cuối tháng ngộp thở."
```

Câu trên quá dài và quá nặng. Nếu giữ thì phải tag `strong_language`, nhưng vẫn nên rút ngắn.

---

## Độ dài message

Bắt buộc:

```txt
- Ưu tiên 30-90 ký tự.
- Tối đa 120 ký tự.
- Không viết 2 câu dài liên tiếp.
- Không dùng văn nghị luận.
- Không dùng nhiều mệnh đề phụ.
```

---

## Trigger cần có message viết tay

Phải đảm bảo các trigger sau có đủ message cho 4 persona:

```txt
budget_50
budget_80
budget_100
budget_120
large_transaction
repeat_category_today
repeat_category_week
late_night_spending
salary_received
income_received
no_spend_day
saving_streak
duplicate_transaction
missed_transaction
end_of_day_summary
end_of_month_warning
bank_transaction_detected
```

Tối thiểu:

```txt
17 trigger x 4 persona x 5 message = 340 message
```

---

## Category context cần có message viết tay

Phải có category-specific message cho:

```txt
food
cafe
shopping
transport
rent
bill
entertainment
health
education
```

Tối thiểu:

```txt
9 context x 4 persona x 5 message = 180 message
```

Tổng mục tiêu:

```txt
340 generic trigger messages
+ 180 category messages
= 520 message
```

Không nhất thiết phải hoàn thành hết trong một commit nếu quá lớn, nhưng ít nhất phải đạt:

```txt
- 300 message viết tay thật
- Không dùng auto-transform prefix/tail để tạo persona
```

---

# Bộ message seed chuẩn

## budget_50

### advisor
```ts
[
  "Mới nửa đường thôi. Giữ nhịp là vẫn đẹp.",
  "{categoryLabel} đã {percent}%. Từ giờ chậm lại chút nhé.",
  "Nửa ngân sách đi rồi. Mình tiêu có chủ đích hơn nhé.",
  "Vẫn ổn, miễn là đừng để cảm xúc cầm ví.",
  "Phanh nhẹ từ bây giờ thì cuối tháng dễ thở hơn."
]
```

### wallet_pet
```ts
[
  "Ví bé thấy {categoryLabel} lên {percent}% rồi nha 🥹",
  "Nửa chặng rồi đó, ví bé xin mình ngoan tay xíu.",
  "Ví bé chưa khóc, nhưng bắt đầu nhìn bạn rồi á.",
  "{categoryLabel} nóng nhẹ rồi, ví bé cần quạt.",
  "Mình giữ nhịp xinh xinh từ đây nha."
]
```

### toxic_friend
```ts
[
  "Nửa ngân sách đi rồi. Kế hoạch vẫn còn sống, tạm thời.",
  "{categoryLabel} mới nửa chặng mà đã có vibe căng.",
  "Mốc {percent}% tới hơi nhanh. Ví bắt đầu nghi ngờ rồi.",
  "Chưa toang, nhưng đà này có tiềm năng toang.",
  "Nửa đường thôi mà ví đã muốn họp khẩn."
]
```

### vietnamese_parent
```ts
[
  "{categoryLabel} đã {percent}% rồi, liệu mà giữ tay.",
  "Mới nửa ngân sách đã thế này rồi đấy.",
  "Từ giờ bớt khoản không cần lại.",
  "Đừng để cuối tháng lại kêu.",
  "Tiêu thì nhìn ngân sách một chút."
]
```

---

## budget_80

### advisor
```ts
[
  "{categoryLabel} hơi nóng rồi. Chậm lại là vẫn cứu được.",
  "Ví đang nhắc nhẹ: sắp tới vùng nguy hiểm rồi.",
  "{spentText}/{limitText} rồi. Từ giờ ưu tiên khoản cần nhé.",
  "Mốc {percent}% tới rồi. Phanh sớm thì đỡ đau.",
  "Tháng còn dài, đừng để hôm nay phá mood cuối tháng."
]
```

### wallet_pet
```ts
[
  "Ví bé rén rồi, {categoryLabel} đã {percent}% á 🥹",
  "{categoryLabel} nóng quá, ví bé cần quạt.",
  "Cảnh báo xinh: sắp vượt mood an toàn rồi.",
  "Ví bé xin bạn đừng bấm thêm nữa nha.",
  "{categoryLabel} làm ví bé tụt pin rồi."
]
```

### toxic_friend
```ts
[
  "{categoryLabel} đã {percent}%. Kế hoạch chắc để trưng.",
  "Tốc độ này mà gọi là kiểm soát thì cũng lạc quan đấy.",
  "Đẹp lắm. Đẹp theo kiểu báo động tài chính.",
  "Câu 'mua nốt' bắt đầu có mùi đắt đỏ rồi.",
  "Ví không yếu. Ví chỉ gặp chủ hơi liều."
]
```

### vietnamese_parent
```ts
[
  "{categoryLabel} đã {percent}% rồi. Bớt tiêu theo hứng ngay.",
  "Nhìn lại đi, mục này đang cháy ngân sách đấy.",
  "Từ giờ khoản nào không cần thì cắt.",
  "{spentText}/{limitText} rồi. Đừng có chủ quan.",
  "Tiền mọc trên cây à mà cứ thoải mái thế?"
]
```

---

## budget_100

### advisor
```ts
[
  "{categoryLabel} chạm giới hạn rồi. Từ giờ chỉ ưu tiên khoản cần.",
  "Ngân sách mục này đã hết. Đừng tự làm khó cuối tháng.",
  "Dừng đúng lúc vẫn hơn sửa sai muộn.",
  "{categoryLabel} đủ rồi. Mình tạm khóa khoản không cần nhé.",
  "Không sao, nhưng từ giờ phải phòng thủ hơn."
]
```

### wallet_pet
```ts
[
  "Ví bé đứng hình. {categoryLabel} full ngân sách rồi.",
  "{categoryLabel} chạm nóc rồi á, cho ví nghỉ nha.",
  "Hết slot cho {categoryLabel}. Ví bé xin đóng cửa.",
  "Ví bé vừa thở dài rất sâu.",
  "{categoryLabel} full cây năng lượng xấu rồi 🥲"
]
```

### toxic_friend
```ts
[
  "{categoryLabel} 100%. Chúc mừng, ngân sách đã bị xử đẹp.",
  "Hết ngân sách rồi. Phần còn lại sống bằng niềm tin.",
  "Câu 'mua nốt' đúng là câu đắt nhất tháng.",
  "Ngân sách vừa rời khỏi cuộc trò chuyện.",
  "100% rồi. Ví đang nhìn bạn bằng ánh mắt rất khác."
]
```

### vietnamese_parent
```ts
[
  "{categoryLabel} hết ngân sách rồi. Dừng.",
  "100% rồi mà còn tiêu nữa thì cuối tháng tự chịu.",
  "Đừng viện cớ nữa. Mục này hết tiền rồi.",
  "Từ giờ không có 'nốt lần này'.",
  "Hết là hết. Không thương lượng."
]
```

---

## budget_120

### advisor
```ts
[
  "Vượt hơi xa rồi. Dừng ngay thì vẫn kéo lại được.",
  "{categoryLabel} đang vượt kế hoạch. Hôm nay nên phòng thủ.",
  "Không sao, nhưng từ giờ mình cần nghiêm túc hơn.",
  "{categoryLabel} vượt {percent}%. Tạm giảm khoản linh hoạt nhé.",
  "Đây là lúc ưu tiên kiểm soát, không ưu tiên thoải mái."
]
```

### wallet_pet
```ts
[
  "Ví bé không khóc, ví bé chỉ tuyệt vọng nhẹ thôi 🥲",
  "{categoryLabel} vượt xa rồi, cứu ví với.",
  "Tình hình hơi căng xinh rồi đó.",
  "Ví bé muốn được ôm sau con số {percent}%.",
  "{categoryLabel} làm ví bé mất ngủ rồi á."
]
```

### toxic_friend
```ts
[
  "{categoryLabel} vượt {percent}%. Đây là biểu diễn rồi.",
  "Ngân sách đã ngã xuống, còn bạn vẫn chạy tiếp.",
  "Vượt thế này cuối tháng khỏi bất ngờ.",
  "Bạn đang biến ngân sách thành nội dung giải trí.",
  "Ví đã đầu hàng. Bạn thì chưa."
]
```

### vietnamese_parent
```ts
[
  "Vượt {percent}% rồi. Dừng ngay.",
  "{categoryLabel} vượt quá xa rồi, tự phá kế hoạch đấy.",
  "Khóa chi linh tinh ngay. Không thương lượng.",
  "Đừng tiêu kiểu này nữa, cuối tháng khổ là tự chịu.",
  "Mục này phải phanh lại ngay."
]
```

---

## large_transaction

### advisor
```ts
[
  "{amountText} là khoản khá lớn. Nghĩ kỹ là tốt.",
  "Khoản này nặng ví đấy, cuối tháng nên soi lại.",
  "Chi lớn rồi, phần còn lại hôm nay đi chậm thôi.",
  "Một khoản lớn vừa đi qua. Mình kiểm tra lại ngân sách nhé.",
  "Nếu khoản này cần thiết thì ổn. Nếu không, nhớ rút kinh nghiệm."
]
```

### wallet_pet
```ts
[
  "{amountText} bay màu. Ví bé vừa tụt mood.",
  "Ví bé hỏi nhỏ: mình chắc chưa á?",
  "Khoản này làm ví bé hơi chóng mặt.",
  "Ví bé vừa mất một miếng linh hồn.",
  "Giao dịch này làm ví bé đứng hình 5 giây."
]
```

### toxic_friend
```ts
[
  "{amountText} bay màu. Một pha biến tiền thành kỷ niệm.",
  "Ví vừa im lặng theo cách rất đáng lo.",
  "Khoản này xong chắc ngân sách cần trị liệu.",
  "Một cú quẹt rất có trọng lượng.",
  "Tiền vừa rời đi không ngoảnh lại."
]
```

### vietnamese_parent
```ts
[
  "{amountText} không nhỏ đâu. Nghĩ kỹ chưa?",
  "Chi mạnh tay thế, cuối tháng đừng than.",
  "Khoản này không cần thiết thì tự biết phải làm gì rồi đấy.",
  "Tiền có phải lá mít đâu mà vung vậy.",
  "Mua gì thì mua, nhớ nhìn lại số dư."
]
```

---

## repeat_category_today

### advisor
```ts
[
  "Hôm nay {categoryLabel} xuất hiện hơi nhiều rồi.",
  "Mình đã chi {categoryLabel} {count} lần hôm nay. Tạm dừng chút nhé.",
  "Thêm một lần nữa có thể làm ngân sách lệch nhịp.",
  "Nếu chưa thật cần, để khoản này sang hôm khác nhé.",
  "Hôm nay {categoryLabel} đủ rồi, phần còn lại nên giữ."
]
```

### wallet_pet
```ts
[
  "Lại {categoryLabel} nữa hả? Ví bé nhận ra pattern rồi nha.",
  "Hôm nay {categoryLabel} được cưng hơi quá rồi đó.",
  "Ví bé hỏi nhỏ: mình có thật sự cần thêm lần nữa không?",
  "Ví bé thấy {categoryLabel} xuất hiện hơi nhiều rồi á.",
  "Thêm một lần nữa là ví bé dỗi đó nha."
]
```

### toxic_friend
```ts
[
  "Lại {categoryLabel}. Bạn rất chung thủy, tiếc là với việc tiêu tiền.",
  "{categoryLabel} hôm nay lên sóng hơi nhiều rồi.",
  "Một lần nữa cho {categoryLabel}. Logic đã tạm nghỉ.",
  "{categoryLabel} xuất hiện nhiều hơn cả deadline.",
  "Bạn với {categoryLabel} đúng là mối quan hệ tốn kém."
]
```

### vietnamese_parent
```ts
[
  "Lại {categoryLabel}? Tiền mọc trên cây à?",
  "Hôm nay chi {categoryLabel} hơi nhiều rồi đấy.",
  "Dừng cái kiểu thích là mua lại ngay.",
  "{categoryLabel} đủ rồi. Đừng thêm nữa.",
  "Cả ngày cứ {categoryLabel}, ví nào chịu nổi."
]
```

---

## late_night_spending

### advisor
```ts
[
  "Đêm rồi. Quyết định mua sắm nên để sáng mai.",
  "Khoản này có thể chờ tới sáng. Ví sẽ cảm ơn mình.",
  "Nếu không gấp, mình ngủ trước rồi quyết sau.",
  "Ban đêm không phải lúc tốt nhất để ví ra quyết định.",
  "Chi tiêu khuya dễ bốc đồng hơn. Chậm lại nhé."
]
```

### wallet_pet
```ts
[
  "Đêm rồi mà ví bé vẫn phải làm việc á 🥹",
  "Ví bé buồn ngủ rồi, đừng bắt ví thanh toán nữa.",
  "Giao dịch đêm khuya làm ví bé giật mình.",
  "Ví bé xin đi ngủ trước khi bạn chốt thêm.",
  "Đêm rồi, ví bé cần chăn chứ không cần hóa đơn."
]
```

### toxic_friend
```ts
[
  "Mua đồ lúc đêm: quyết định rất tỉnh táo, chắc vậy.",
  "Đêm khuya là lúc lý trí ngủ, còn ví chịu trận.",
  "Giao dịch này có mùi bốc đồng lúc 2 giờ sáng.",
  "Sáng mai bạn sẽ hiểu vì sao ví im lặng.",
  "Một cú chi rất hợp vibe mất kiểm soát."
]
```

### vietnamese_parent
```ts
[
  "Đêm hôm còn tiêu tiền. Đi ngủ đi.",
  "Giờ này mà còn mua với bán gì nữa?",
  "Để sáng mai tỉnh táo rồi tính.",
  "Đừng có thức khuya rồi tiêu linh tinh.",
  "Ngủ đi, ví cũng cần nghỉ."
]
```

---

## salary_received / income_received

### advisor
```ts
[
  "Lương về rồi. Chia tiền trước là đẹp nhất.",
  "Đây là lúc tốt nhất để giữ kỷ luật tài chính.",
  "Tiền vừa về, ưu tiên quỹ cần thiết trước nhé.",
  "Một kế hoạch nhỏ hôm nay sẽ cứu cả tháng.",
  "Lương về là để phân bổ, không phải xả hết."
]
```

### wallet_pet
```ts
[
  "Lương về rồi, ví bé xin được bảo vệ.",
  "Ví bé vui rồi, giờ mình chia tiền thật ngoan nha.",
  "Tiền vừa về nhà, đừng để đi du lịch quá nhanh nha.",
  "Ví bé vừa hồi máu, đừng đánh boss liền.",
  "Lương về làm ví bé cười, giữ nụ cười đó nha."
]
```

### toxic_friend
```ts
[
  "Lương về rồi. Đừng biến nó thành lịch sử giao dịch trong 3 ngày.",
  "Tiền vừa vào tài khoản. App mua sắm chắc đang mỉm cười.",
  "Lương về không có nghĩa là ví bất tử.",
  "Khoảnh khắc nguy hiểm nhất tháng: vừa có tiền.",
  "Đừng để tiền vào như khách, ra như chủ nhà."
]
```

### vietnamese_parent
```ts
[
  "Lương về thì chia tiền trước, đừng tiêu trước tính sau.",
  "Có tiền không có nghĩa là được phá ngân sách.",
  "Giữ tiền từ đầu tháng, đừng vài ngày sau lại kêu nghèo.",
  "Trả khoản cần trả trước, mua sắm để sau.",
  "Đừng để lương vừa về đã bay sạch."
]
```

---

## no_spend_day

### advisor
```ts
[
  "Hôm nay chưa tiêu linh tinh, giữ nhịp này nhé.",
  "Một ngày yên bình cho ví. Rất đáng khen.",
  "Không chi không cần thiết là một chiến thắng nhỏ.",
  "Ví hôm nay khỏe hơn hẳn.",
  "Một ngày kiểm soát tốt. Cứ thế tiếp tục."
]
```

### wallet_pet
```ts
[
  "Không chi linh tinh nè, ví bé thả tim.",
  "Hôm nay ví bé được nghỉ phép.",
  "Ví bé ngủ ngon vì bạn không tiêu bậy.",
  "Một ngày rất ngoan với tiền luôn á.",
  "Ví bé đang cười rất hiền."
]
```

### toxic_friend
```ts
[
  "Hôm nay chưa tiêu linh tinh. Lạ nhưng đáng khen.",
  "Ví còn sống khỏe. Một diễn biến hiếm gặp.",
  "Không chi bậy hôm nay, cuối cùng lý trí cũng online.",
  "Một ngày không làm ví tổn thương. Tiến bộ đấy.",
  "Hôm nay ngân sách không bị drama. Khá hiếm."
]
```

### vietnamese_parent
```ts
[
  "Hôm nay không tiêu linh tinh, thế mới giống người biết nghĩ.",
  "Giữ được như hôm nay thì ví mới sống nổi.",
  "Tốt. Mai cũng đừng phá.",
  "Không tiêu bậy là đúng, đừng chủ quan.",
  "Hôm nay ổn. Cứ thế mà làm."
]
```

---

## food context

### advisor
```ts
[
  "Ăn ngon được, nhưng ví cũng cần sống.",
  "Bữa này ổn, nhưng đừng để thành thói quen đắt đỏ.",
  "Hôm nay ăn ngoài rồi, bữa sau cân lại nhé.",
  "Giảm một bữa gọi món là ngân sách nhẹ hơn nhiều.",
  "Ăn uống vui, nhưng nên có trần cho mỗi ngày."
]
```

### wallet_pet
```ts
[
  "Bụng vui rồi, giờ cho ví vui với nha.",
  "Đồ ăn ngon đó, nhưng ví bé hơi rén.",
  "Ví bé xin một bữa cơm nhà.",
  "Bụng no, ví bé hơi rỗng.",
  "Món này ngon, nhưng ví bé muốn ăn cơm nhà."
]
```

### toxic_friend
```ts
[
  "Ăn ngoài nữa à? Bếp ở nhà chắc để làm cảnh.",
  "Bạn đang đầu tư mạnh vào niềm vui ngắn hạn.",
  "Gọi món nhanh hơn cả lúc hứa tiết kiệm.",
  "Ăn ngon hôm nay, cuối tháng ăn năn.",
  "Đồ ăn tới nhanh, số dư đi cũng nhanh."
]
```

### vietnamese_parent
```ts
[
  "Bếp ở nhà để trưng à?",
  "Đừng lấy lý do stress để đốt tiền ăn uống.",
  "Ăn ngoài ít thôi. Ví không chịu nổi đâu.",
  "Cơm nhà không có tội.",
  "Ăn uống kiểu này thì tiền nào cho đủ."
]
```

---

## cafe context

### advisor
```ts
[
  "Một ly thì vui, nhiều ly thì ngân sách buồn.",
  "Cafe hôm nay đủ rồi, ví cần tỉnh theo.",
  "Giảm một ly thôi là cuối tháng khác hẳn.",
  "Thói quen nhỏ đang cộng thành khoản lớn.",
  "Tự pha vài hôm cũng là cách giữ ví khỏe."
]
```

### wallet_pet
```ts
[
  "Cafe ngon nhưng ví bé run rồi nha.",
  "Thêm topping nữa là ví bé xỉu á.",
  "Một ly nữa thôi là câu nói nguy hiểm nhất hôm nay.",
  "Ví bé xin bạn bỏ topping hôm nay.",
  "Ly này thơm, hóa đơn thì hơi đau."
]
```

### toxic_friend
```ts
[
  "Ví bạn đang tài trợ full cho caffeine.",
  "Tỉnh thì có tỉnh, ngân sách thì ngủm.",
  "Trà sữa không đắt. Đắt là cái thói 'ly cuối'.",
  "Một ly nhỏ, một vấn đề cộng dồn lớn.",
  "Caffeine cứu bạn, nhưng ai cứu ví?"
]
```

### vietnamese_parent
```ts
[
  "Cắt bớt cafe ngoài quán ngay.",
  "Đừng có 'ly cuối', câu đấy nghe nhiều rồi.",
  "Uống ít lại. Tiền không tự mọc lại đâu.",
  "Tự pha ở nhà đi.",
  "Ngày nào cũng cafe thì ví nào chịu."
]
```

---

## shopping context

### advisor
```ts
[
  "Món này có thể thích thật, nhưng cần chưa?",
  "Cho vào giỏ được, thanh toán thì nghĩ thêm.",
  "Chờ 24 tiếng rồi mua cũng chưa muộn.",
  "Nếu vẫn muốn sau một ngày, lúc đó hãy mua.",
  "Mua ít hơn một món hôm nay là nhẹ hơn cuối tháng."
]
```

### wallet_pet
```ts
[
  "Món này xinh, nhưng số dư cũng cần được yêu thương.",
  "Chốt đơn vui đó, ví bé hơi buồn.",
  "Ví bé xin bạn thoát app mua sắm.",
  "Giỏ hàng vui, ví bé áp lực.",
  "Ví bé thấy nút thanh toán hơi đáng sợ."
]
```

### toxic_friend
```ts
[
  "Kế hoạch tiết kiệm vừa bị freeship đánh bại.",
  "Sale 50% nhưng tiền mất vẫn là tiền thật.",
  "Bạn không mua đồ, bạn đang mua áp lực cuối tháng.",
  "Freeship không miễn phí cho tương lai của ví.",
  "Chốt đơn nhanh hơn chốt kế hoạch tài chính."
]
```

### vietnamese_parent
```ts
[
  "Không cần thì đừng mua.",
  "Sale không phải giấy phép đốt tiền.",
  "Bỏ ngay kiểu thấy rẻ là chốt.",
  "Tủ còn đồ không mà mua nữa?",
  "Đừng để chữ sale dắt mũi."
]
```

---

# Prompt chính xác cho Codex

Copy toàn bộ prompt này cho Codex:

```txt
You are working in the PayNote React Native repository.

Task: Rewrite the notification message copy so it actually feels like persona-based Rolly-style notifications.

Current status:
- The notification engine, persona model, memory, cooldown and category detection mostly exist.
- The problem is the message copy is still too generic, too formal, and some personas are generated by transforming generic messages.
- Do not focus on architecture unless needed. Focus on message quality and making sure existing engine uses better hand-written messages.

Hard requirements:
1. Do NOT copy Rolly messages.
2. Do NOT auto-generate persona messages by adding prefix/tail to generic lines.
3. Remove or stop using helper transforms like:
   - toPet(line)
   - toToxic(line)
   - toParent(line)
   if they produce active notification templates.
4. Each persona must have hand-written templates:
   - advisor: calm, short, supportive
   - wallet_pet: cute wallet character, meme-light, max 1 emoji
   - toxic_friend: sarcastic, punchy, screenshot-friendly
   - vietnamese_parent: Vietnamese parent scolding style, short, no profanity
5. Every message should be short:
   - target 30-90 chars
   - hard max 120 chars
6. Replace active generic/generated message pools with hand-written pools.
7. Keep existing types and engine behavior:
   - NotificationPersona
   - NotificationTrigger
   - NotificationSeverity
   - NotificationCategoryContext
   - NotificationMemory
8. Preserve backward compatibility:
   - gentle -> advisor
   - cute -> wallet_pet
   - sarcastic_strong -> toxic_friend
   - angry/strict -> vietnamese_parent
9. Use the message seed from this markdown as the source of truth.
10. Ensure category templates are written by persona, not generic transformed.
11. Strong parent messages using "mày/tao" must be tagged strong_language and excluded unless allowStrongLanguage is true.
12. Update Android native fallback templates too, especially:
   - PeriodicPlanFallbackTemplates.kt
   - PeriodicFallbackTemplates.kt
   so the tone names and content match the new personas.
13. If notificationPlanTemplates.ts is generated, update the generator source rather than editing generated output only.
14. Keep Gemini out of normal notification message generation. Template should be the default path.

Files to inspect and update:
- src/services/notifications/notificationTemplates.ts
- src/services/notifications/notificationPlanTemplates.ts
- src/services/notifications/notificationCategoryTemplates.ts
- src/services/notifications/notificationPersona.ts
- src/services/notifications/pickNotificationTemplate.ts
- src/services/notifications/notificationEngine.ts
- src/services/roastFallbackTemplates.ts
- src/services/budgetAlerts.ts
- android/app/src/main/java/com/paynote/app/PeriodicPlanFallbackTemplates.kt
- android/app/src/main/java/com/paynote/app/PeriodicFallbackTemplates.kt
- scripts/generate-notification-plan-templates.js
- paynote_notification_refactor_plan.md

Acceptance criteria:
- No active notification template is produced by simple prefix/tail transformation of a generic line.
- At least 300 active templates are hand-written.
- The following triggers have 4 personas x at least 5 messages:
  budget_50, budget_80, budget_100, budget_120,
  large_transaction, repeat_category_today, late_night_spending,
  salary_received, no_spend_day, duplicate_transaction,
  missed_transaction, end_of_day_summary, end_of_month_warning.
- The following contexts have 4 personas x at least 5 messages:
  food, cafe, shopping.
- toxic_friend should be significantly more punchy than current messages.
- wallet_pet should feel like a character, not a prefixed financial reminder.
- vietnamese_parent should be short and funny, not long aggressive paragraphs.
- App compiles.
- Existing anti-duplication logic still works.
- Existing persona settings still work.
```

---

## Quality checklist sau khi Codex làm

Sau khi Codex sửa, kiểm tra bằng search:

```txt
toPet(
toToxic(
toParent(
"Ví bé nhắc nhẹ:"
"Đà chi tiêu này khá đẹp"
"giữ ví cho tử tế"
"Tao nói thẳng luôn"
```

Nếu còn xuất hiện trong active template path thì chưa đạt.

Kiểm tra message bằng mắt:

```txt
- Có ngắn không?
- Có đúng persona không?
- Có câu nào giống văn mẫu app tài chính không?
- Có câu nào dài quá 120 ký tự không?
- Toxic có punchline không?
- Ví bé có thật sự là nhân vật không?
- Mẹ Việt Nam có đời không?
```
