package com.paynote.app

import kotlin.random.Random

object PeriodicFallbackTemplates {
    private val gentle = listOf(
        "Mình nhắc nhẹ thôi, hôm nay tiêu chậm một nhịp thì cuối tháng sẽ dễ thở hơn nhiều.",
        "Bạn vẫn đang kiểm soát được, chỉ cần bớt vài khoản cảm xúc để ví ổn định lại.",
        "Giảm nhẹ tốc độ chi tiêu từ bây giờ sẽ giúp bạn tránh áp lực dồn vào cuối tháng.",
        "Nhịp chi hôm nay hơi cao, mình ưu tiên việc cần trước để giữ cân bằng nhé.",
        "Một điều chỉnh nhỏ lúc này có thể cứu cả phần còn lại của tháng.",
        "Ví đang ổn nhưng cần bạn điềm tĩnh hơn một chút ở những khoản không cần thiết.",
        "Mình chọn chi có kế hoạch ngay hôm nay thì tương lai gần sẽ nhẹ đầu hơn.",
        "Chi tiêu tỉnh táo thêm một nhịp là bạn sẽ thấy khác biệt rất rõ vào cuối tháng.",
        "Nếu bây giờ bạn chậm lại một chút, áp lực tài chính sẽ giảm đáng kể.",
        "Giữ đều tay từ hôm nay là cách dễ nhất để không phải sửa sai vào cuối tháng.",
        "Mình không cần hoàn hảo, chỉ cần kỷ luật vừa đủ để ví luôn trong vùng an toàn.",
        "Bớt một khoản linh tinh hôm nay là thêm một khoảng thở cho những ngày tới.",
        "Bạn đang làm tốt, chỉ cần thêm chút chọn lọc trước khi bấm thanh toán.",
        "Mình ưu tiên nhu cầu thật sự trước, mọi thứ còn lại cho vào danh sách chờ.",
        "Đi chậm một chút trong chi tiêu luôn rẻ hơn là xử lý hậu quả sau đó.",
        "Kế hoạch tài chính sẽ hoạt động tốt nếu bạn cho nó thêm một chút kỷ luật hôm nay.",
        "Từ lúc này mình tiêu theo mục tiêu, không tiêu theo cảm xúc thoáng qua nữa.",
        "Nhắc khẽ thôi: giữ ví khỏe bắt đầu bằng vài quyết định nhỏ nhưng đều đặn.",
        "Bạn còn nhiều cơ hội kéo lại nhịp chi, bắt đầu ngay ở giao dịch kế tiếp.",
        "Mình dừng trước một bước để không phải dừng gấp khi đã quá trễ.",
        "Chậm lại không phải thiệt thòi, đó là cách bảo vệ sự thoải mái của chính bạn.",
        "Một ngày chi tiêu tỉnh táo sẽ đổi lại nhiều ngày bớt lo phía sau.",
        "Đừng để những món nhỏ kéo bạn xa khỏi kế hoạch lớn của tháng này.",
        "Hôm nay tiết chế một chút thì ngày mai bạn cảm ơn chính mình.",
        "Nhịp chi này cần được hạ nhiệt nhẹ để phần còn lại của tháng đi mượt hơn.",
        "Bạn chỉ cần giảm ga vừa phải, không cần ép bản thân quá mức.",
        "Giữ kỷ luật mềm nhưng đều là cách bền nhất để không hụt hơi.",
        "Mình chọn an toàn tài chính ngay từ bây giờ thay vì chờ cảnh báo lớn.",
        "Bỏ qua một món chưa cần là thêm một bước gần hơn tới sự an tâm.",
        "Nhắc lần này đủ rồi, tiêu chậm lại từ hôm nay để cuối tháng thật nhẹ nhàng."
    )

    private val cute = listOf(
        "Ví đang nháy đèn ét o ét rồi nè, mình dịu tay một chút để ví đỡ hoảng nha.",
        "Nhắc xinh một tiếng thôi, hôm nay mình mua món cần trước để ví còn cười nè.",
        "Mood mua sắm đáng yêu đó, nhưng mình giữ ví đáng yêu hơn nha.",
        "Ví bé đang đứng hình 5 giây, cứu ví bằng một quyết định tỉnh táo nào.",
        "Cảnh báo dễ thương: bớt một món linh tinh hôm nay là tương lai sáng hơn liền.",
        "Bạn ơi, tiêu nhẹ tay xíu nha để cuối tháng vẫn chill như kế hoạch.",
        "Nhắc yêu thôi nè, đừng chốt đơn theo cảm xúc liên tục nữa nhé.",
        "Ví đang ôm tim rồi đó, mình đổi mode sang “cần mới mua” nha.",
        "Mình vẫn tận hưởng được mà, chỉ cần bớt ga ở những món không cấp thiết.",
        "Một cú phanh xinh lúc này sẽ cứu cả tháng khỏi cảnh hụt hơi đó nha.",
        "Đừng “quá là tr quá là tr” với mua sắm nữa, ví đang cầu cứu nè.",
        "Hôm nay làm phiên bản tiêu tiền ngoan ngoãn thôi, mai ví cảm ơn liền.",
        "Bớt một lần mua theo mood là thêm một lần ngủ ngon không lo số dư.",
        "Nhắc kiểu đáng yêu nhưng nghiêm túc: mình chậm lại ngay từ giao dịch tiếp theo nhé.",
        "Ví bé muốn sống bình yên, nên mình ưu tiên thứ quan trọng trước nha.",
        "Một chút tiết chế hôm nay sẽ đổi lại nhiều niềm vui thật sự cuối tháng.",
        "Tiêu thông minh cũng rất xinh, mình thử ngay trong hôm nay đi nè.",
        "Bạn vẫn có thể vui mà không quá tay, chọn lọc một chút là được rồi.",
        "Cứu ví nhẹ nhàng bằng cách bỏ qua món chưa thật sự cần nha.",
        "Ví gửi tim tím: đừng mua vì hứng, mua vì cần thôi nè.",
        "Mình dừng đúng lúc thì chẳng mất gì, chỉ được thêm cảm giác an tâm thôi.",
        "Một bước lùi trong mua sắm là một bước tiến cho kế hoạch tài chính đó nha.",
        "Nhắc nhẹ nè, đừng để vài phút phấn khích đổi lấy cả tuần áp lực.",
        "Bạn tiêu có gu rồi, giờ thêm tiêu có kế hoạch nữa là đỉnh luôn.",
        "Bớt tay một chút thôi, ví sẽ từ “hết cứu” thành “cứu được” liền.",
        "Hôm nay mình chọn tỉnh táo, để cuối tháng còn tiền cho niềm vui quan trọng.",
        "Đừng để ví phải khóc thầm nữa nha, mình phanh nhẹ là đẹp.",
        "Chốt đơn ít lại một nhịp, an tâm tài chính tăng một bậc nè.",
        "Nhắc yêu lần nữa thôi: tiêu vừa phải để ví còn thở đều nhé.",
        "Mình ngoan tay từ bây giờ thì cuối tháng vẫn vui mà không căng."
    )

    private val sarcastic = listOf(
        "Một giờ nữa trôi qua và bạn vẫn tiêu nhanh hơn tốc độ giữ tiền, khá ổn theo hướng đáng lo.",
        "Bạn có thể tiếp tục mua nốt, chỉ là cuối tháng đừng hỏi vì sao số dư biến mất.",
        "Ngân sách đã cảnh báo rõ rồi, phần còn lại là bạn có chịu phanh hay không.",
        "Bạn đang đổi sự vui tay vài phút lấy áp lực tài chính kéo dài cả tháng.",
        "Ví không yếu, chỉ là bạn đang tập chơi chế độ hard với chi tiêu cá nhân.",
        "Kế hoạch tiết kiệm nghe rất hay, tiếc là hành vi mua sắm đang phát biểu ngược lại.",
        "Đà chi tiêu này khá đẹp, đẹp cho một cái kết cuối tháng nhiều suy ngẫm.",
        "Mua vì cảm xúc thì nhanh, xử lý hậu quả tài chính thì không nhanh như vậy.",
        "Bạn đang thắng ngân sách theo nghĩa xấu một cách rất ổn định.",
        "Đừng lo, tiền không tự mất đâu, nó đi theo từng lần “mua nốt cái này”.",
        "Nếu cứ giữ nhịp hiện tại, bất ngờ lớn nhất cuối tháng chỉ là bạn vẫn bất ngờ.",
        "Cảnh báo đã lên đèn, nhưng có vẻ cảm xúc mua sắm đang cầm vô lăng.",
        "Bạn chi tiêu quyết đoán thật, tiếc là quyết đoán sai thời điểm.",
        "Thói quen “mai tính” thường mở đầu cho một chuỗi ngày căng ví rất đẹp.",
        "Có thể bỏ qua thông báo này, nhưng bảng sao kê thì không biết nói dối.",
        "Bạn đang luyện kỹ năng biến tiền thành lịch sử giao dịch với tốc độ ấn tượng.",
        "Mỗi lần “kệ đi” là một lần mục tiêu tài chính lùi thêm một bước.",
        "Nhìn chung mọi thứ vẫn ổn, nếu tiêu chí ổn là không kiểm soát được nhịp chi.",
        "Một pha đứng hình 5 giây cho ví, rồi bạn lại bấm thanh toán như chưa có gì xảy ra.",
        "Bạn không thiếu kế hoạch, bạn chỉ thiếu vài lần dừng đúng lúc.",
        "Tiếp tục nhịp này thì cuối tháng sẽ có plot twist rất đời thường.",
        "Bạn đang mượn sự thoải mái hiện tại từ chính sự khó chịu của tương lai.",
        "Đây không còn là trượt tay, đây là thói quen được lặp lại khá chuyên nghiệp.",
        "Nếu vẫn tăng ga, đừng trách ngân sách phản ứng theo đúng vật lý.",
        "Bạn có quyền tận hưởng, nhưng hiện tại đang tận hưởng quá hạn mức rồi.",
        "Một tiếng nhắc nữa: logic đang ngồi ghế dự bị, cảm xúc đang đá chính.",
        "Chi tiêu kiểu này thì cụm từ “hết cứu” không còn là meme nữa đâu.",
        "Bớt một giao dịch vô nghĩa sẽ rẻ hơn rất nhiều so với một tháng sửa sai.",
        "Đây là lời nhắc văn minh cuối cùng trước khi ví nói chuyện bằng số âm.",
        "Chốt lại: tiếp tục tiêu cảm tính thì áp lực tài chính sẽ đến đúng hẹn."
    )

    private val angry = listOf(
        "Tao nói thẳng luôn, mày dừng kiểu tiêu theo hứng ngay bây giờ nếu không muốn cuối tháng ngộp thở.",
        "Mày nhìn lại lịch sử chi tiêu đi, mỗi lần “mua nốt” là tự đẩy mình gần hơn tới cảnh hụt tiền.",
        "Không có chuyện thương lượng nữa, khoản nào không thiết yếu thì cắt ngay cho tao.",
        "Mày cứ bình thản chi tiếp thì đừng than nữa, vì hậu quả mày tự ký từng giao dịch rồi.",
        "Tao không cần lời hứa, tao cần mày phanh ngay ở lần thanh toán tiếp theo.",
        "Đừng tự lừa là còn kiểm soát được, nhịp chi của mày đang trượt rõ ràng rồi.",
        "Mày muốn yên ổn thì hành động liền, không phải đọc xong rồi để đó như khẩu hiệu.",
        "Từ giờ tao chốt một câu: không cần thì không mua, đừng cãi.",
        "Mày đang tự biến ví thành nạn nhân mà vẫn coi như bình thường, tỉnh lại đi.",
        "Khoản phát sinh nào không có lý do rõ ràng thì bỏ thẳng tay, làm ngay.",
        "Tao nhắc gắt vì mày đang đi sai hướng, không phanh bây giờ thì lát nữa chỉ có trả giá.",
        "Mày cứ tiêu như này thì kế hoạch tài chính chỉ còn để đọc cho vui thôi.",
        "Nghe kỹ này, đừng viện cớ bận nữa, chuyện cần làm là siết chi tiêu ngay hôm nay.",
        "Mày không thiếu tiền, mày thiếu kỷ luật, và đây là lúc sửa thẳng vào gốc.",
        "Một giao dịch vô nghĩa nữa là tự đào hố sâu hơn, mày hiểu vấn đề chưa.",
        "Tao không chấp nhận kiểu “lần cuối”, vì mày đã nói câu đó quá nhiều lần rồi.",
        "Đừng ngồi chờ phép màu, ngân sách chỉ khá lên khi mày biết dừng đúng lúc.",
        "Mày muốn đỡ stress cuối tháng thì cắt ngay mấy khoản cho vui không cần thiết.",
        "Tao nói như người thật luôn: mày đang tự bóp cổ ví của mình từng ngày.",
        "Nếu không khóa chi cảm tính ngay, mày sẽ phải cắt đau hơn trong vài ngày tới.",
        "Mày đọc cảnh báo này thì làm liền đi, đừng để mọi thứ trượt thêm rồi mới hối hận.",
        "Kỷ luật tài chính không tự xuất hiện, mày phải ép mình làm ngay bây giờ.",
        "Tao nhắc lần này rất rõ: chi bắt buộc thì giữ, chi vì hứng thì dẹp.",
        "Mày đang đốt năng lượng cho những món không quan trọng, rồi tối lại lo số dư.",
        "Đừng tỏ ra bất ngờ nữa, nhịp chi kiểu này thì hụt tiền là kết quả mặc định.",
        "Tao cần một việc duy nhất: từ giờ mày dừng mua thứ không thật sự cần.",
        "Mày không phanh hôm nay thì mai mày trả học phí bằng áp lực tài chính cao hơn.",
        "Nói ngắn mà gắt: bỏ ngay thói quen tiêu để xả stress, vì nó đang phá cả tháng của mày.",
        "Mày còn quyền chọn, hoặc dừng ngay bây giờ hoặc tiếp tục và tự gánh hậu quả.",
        "Tao chốt hạ: mày muốn ổn thì phải kỷ luật, không có con đường tắt nào hết."
    )

    fun pick(toneMode: String): String {
        val pool = when (toneMode) {
            "gentle" -> gentle
            "cute" -> cute
            "angry", "strict" -> angry
            else -> sarcastic
        }
        return pool[Random.nextInt(pool.size)]
    }
}
