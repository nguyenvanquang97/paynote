export const AI_QUICK_PROMPTS = [
  'Tháng này tôi tiêu bao nhiêu?',
  'Tôi tiêu nhiều nhất vào gì?',
  'So sánh tháng này với tháng trước',
  'Có giao dịch nào bất thường không?',
  'Tôi có bị duplicate giao dịch không?',
  'Tóm tắt chi tiêu hôm nay',
] as const;

export const AI_QUICK_PROMPT_CHIPS = [
  {label: 'Tiêu tháng này', prompt: 'Tháng này tôi tiêu bao nhiêu?'},
  {label: 'Tiêu nhiều nhất', prompt: 'Tôi tiêu nhiều nhất vào gì?'},
  {label: 'So sánh 2 tháng', prompt: 'So sánh tháng này với tháng trước'},
  {label: 'Chi tiêu bất thường', prompt: 'Có giao dịch nào bất thường không?'},
  {label: 'Kiểm tra trùng', prompt: 'Tôi có bị duplicate giao dịch không?'},
  {label: 'Tóm tắt hôm nay', prompt: 'Tóm tắt chi tiêu hôm nay'},
] as const;
