package com.paynote.app

import kotlin.random.Random

object PeriodicFallbackTemplates {
    private fun poolByTier(base: List<String>, tier: Int): List<String> {
        if (base.isEmpty()) return base
        val size = base.size
        val chunk = (size / 4).coerceAtLeast(3)
        return when {
            tier >= 4 -> base.takeLast(chunk).ifEmpty { base }
            tier == 3 -> base.drop((chunk * 2) / 3).take(chunk).ifEmpty { base }
            tier == 2 -> base.drop(chunk / 2).take(chunk).ifEmpty { base }
            else -> base.take(chunk).ifEmpty { base }
        }
    }

    private val advisor = listOf(
        "Mốc 80% rồi. Chậm lại một nhịp là vẫn cứu được.",
        "Ngân sách đang nóng nhẹ, ưu tiên khoản cần trước nhé.",
        "Tháng còn dài, đừng để một ngày phá cả nhịp.",
        "Đã chạm 100%. Từ giờ chỉ giữ khoản bắt buộc thôi.",
        "Hết ngân sách rồi, dừng đúng lúc sẽ đỡ đau hơn.",
        "Khoản này đã full, tạm khóa chi linh hoạt nhé.",
        "Vượt quá 120% rồi, mình cần phòng thủ ngay.",
        "Mốc này hơi căng, càng sớm phanh càng nhẹ ví.",
        "Dừng ngay bây giờ thì vẫn kéo lại được.",
        "Đêm rồi, quyết định mua sắm để sáng mai vẫn chưa muộn.",
        "Chi khuya dễ bốc đồng. Ngủ trước rồi quyết sau nhé.",
        "Giờ này ví cần nghỉ, mình cho nó nghỉ một đêm nhé.",
        "Chốt ngày rồi: tiền đã đi, mai mình đi tỉnh táo hơn.",
        "Tổng kết hôm nay xong, phần quan trọng là nhịp ngày mai.",
        "Một ngày khép lại, giữ tay nhẹ hơn từ giao dịch đầu tiên mai nhé."
    )

    private val walletPet = listOf(
        "Ví bé rén rồi, ngân sách lên 80% á 🥹",
        "Mốc này nóng rồi, ví bé xin bạn ngoan tay xíu.",
        "Ví bé chưa khóc, nhưng đang nhìn bạn đó.",
        "100% rồi á, ví bé xin đóng cửa tạm thời.",
        "Khoản này full ngân sách rồi, cho ví bé thở nha.",
        "Ví bé đứng hình vì cú chạm trần này.",
        "Vượt 120% luôn rồi, ví bé hơi tuyệt vọng 🥲",
        "Cứu ví bé với, mốc này căng thiệt á.",
        "Ví bé tụt pin mạnh rồi, đừng bấm thêm nữa nha.",
        "Đêm rồi mà ví bé vẫn phải làm việc á 🥹",
        "Ví bé buồn ngủ rồi, để mai mua tiếp nha.",
        "Giờ này chốt đơn là ví bé giật mình đó.",
        "Kết ngày xong, ví bé xin sạc pin một đêm.",
        "Hôm nay ví bé đi nhiều quá, mai nhẹ tay giúp bé nha.",
        "Ví bé chúc ngủ ngon, đừng mơ thấy hóa đơn nữa."
    )

    private val toxicFriend = listOf(
        "80% rồi. Kế hoạch tiết kiệm chắc để trưng.",
        "Mốc này tới hơi nhanh. Ví bắt đầu nghi ngờ bạn rồi.",
        "Bạn đang tăng ga theo đúng lộ trình áp lực.",
        "100% luôn. Ngân sách vừa rời khỏi cuộc trò chuyện.",
        "Hết ngân sách rồi, phần còn lại sống bằng niềm tin.",
        "Câu 'mua nốt' lại thắng thêm một ván.",
        "120% rồi. Đây không còn là chi tiêu, đây là biểu diễn.",
        "Ngân sách đã ngã xuống, còn bạn vẫn chạy tiếp.",
        "Vượt kiểu này cuối tháng khỏi bất ngờ.",
        "Mua lúc đêm: quyết định rất tỉnh táo, chắc vậy.",
        "Đêm khuya là lúc lý trí ngủ, ví thì chịu trận.",
        "Sáng mai đọc sao kê sẽ hiểu ngay vấn đề.",
        "Chốt ngày: tiền đi nhanh, bài học đi chậm.",
        "Hôm nay ví không nói gì, lịch sử giao dịch nói hết.",
        "Summary xong rồi, mong mai bạn đỡ liều hơn."
    )

    private val vietnameseParentSoft = listOf(
        "80% rồi, bớt tiêu theo hứng lại.",
        "Mốc này phải giữ tay, đừng chủ quan.",
        "Tháng còn dài, tiêu có nghĩ một chút.",
        "100% rồi, dừng ngay.",
        "Hết ngân sách rồi, không có 'nốt lần này'.",
        "Mục này chạm trần rồi, bớt khoản linh tinh đi.",
        "Vượt 120% rồi, phanh lại ngay.",
        "Chi kiểu này nữa là cuối tháng tự khổ.",
        "Khóa chi không cần thiết từ bây giờ.",
        "Đêm hôm còn tiêu tiền, đi ngủ đi.",
        "Giờ này mua bán gì nữa, để sáng mai tính.",
        "Ngủ đi, ví cũng cần nghỉ.",
        "Cuối ngày rồi, nhìn lại tiền đi đâu.",
        "Hôm nay vậy là đủ, mai đừng phá nhịp.",
        "Giữ đều như hôm nay thì ví mới sống nổi."
    )

    private val vietnameseParentStrong = vietnameseParentSoft + listOf(
        "Mày dừng kiểu tiêu theo hứng ngay.",
        "Tao nhắc lần này: không cần thì không mua.",
        "Mày phanh lại cho tao, đừng để quá tay nữa."
    )

    fun pick(toneMode: String, allowStrongLanguage: Boolean, tier: Int): String {
        val basePool = when (toneMode) {
            "gentle", "advisor" -> advisor
            "cute", "wallet_pet" -> walletPet
            "sarcastic_strong", "toxic_friend" -> toxicFriend
            "angry", "strict", "vietnamese_parent" -> if (allowStrongLanguage) vietnameseParentStrong else vietnameseParentSoft
            else -> advisor
        }
        val pool = poolByTier(basePool, tier)
        return pool[Random.nextInt(pool.size)]
    }
}
