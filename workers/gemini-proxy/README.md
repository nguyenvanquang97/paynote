# PayNote Gemini Proxy

Worker này dùng làm backend proxy cho Gemini. App mobile gọi Worker thay vì gọi trực tiếp Gemini, nên `GEMINI_API_KEY` không bị đóng gói vào app.

## 1. Yêu cầu

- Có tài khoản Cloudflare.
- Có Gemini API key.
- Chạy lệnh từ repo PayNote.
- Không commit file `.env` hoặc secret thật.

## 2. Đăng nhập Cloudflare

```bash
cd workers/gemini-proxy
npx wrangler login
```

Trình duyệt sẽ mở trang Cloudflare để cấp quyền cho Wrangler.

## 3. Cấu hình Gemini key trên Cloudflare

Lưu Gemini key dưới dạng secret của Worker:

```bash
npx wrangler secret put GEMINI_API_KEY
```

Dán Gemini API key khi terminal hỏi giá trị. Key này chỉ nằm trên Cloudflare, không nằm trong app mobile.

## 4. Deploy Worker

```bash
npx wrangler deploy
```

Sau khi deploy thành công, Wrangler sẽ in ra URL dạng:

```text
https://paynote-gemini-proxy.<your-subdomain>.workers.dev
```

Endpoint app cần dùng là URL đó cộng thêm `/chat`:

```text
https://paynote-gemini-proxy.<your-subdomain>.workers.dev/chat
```

## 5. Cấu hình app PayNote

Tạo hoặc sửa file `.env` ở root repo PayNote:

```bash
PAYNOTE_AI_PROVIDER=gemini
PAYNOTE_AI_PROXY_URL=https://paynote-gemini-proxy.<your-subdomain>.workers.dev/chat
PAYNOTE_AI_PROXY_TOKEN=
GEMINI_API_KEY=
PAYNOTE_AI_API_KEY=
PAYNOTE_AI_MODEL=gemini-2.5-flash
PAYNOTE_AI_TIMEOUT_MS=15000
```

Điểm quan trọng:

- `PAYNOTE_AI_PROXY_URL` có giá trị thì app sẽ gọi Worker.
- `GEMINI_API_KEY` để trống để không ship key vào app.
- `PAYNOTE_AI_API_KEY` cũng để trống.
- `PAYNOTE_AI_PROVIDER=gemini` là rõ ràng nhất; nếu bỏ trống, app vẫn tự chọn Gemini khi có proxy URL.

Chạy app qua script hiện có để `.env` được generate vào runtime config:

```bash
yarn android
```

Hoặc:

```bash
yarn ios
```

## 6. Test nhanh Worker

Nếu chưa bật token bảo vệ, test bằng:

```bash
curl -X POST "https://paynote-gemini-proxy.<your-subdomain>.workers.dev/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {"role": "user", "content": "Trả lời ngắn: PayNote là gì?"}
    ]
  }'
```

Response hợp lệ sẽ có dạng:

```json
{"content":"...","provider":"gemini"}
```

## 7. Bật token bảo vệ endpoint

Worker URL vẫn là endpoint public. Để chặn người lạ gọi quá dễ, có thể bật token đơn giản:

```bash
npx wrangler secret put PAYNOTE_CLIENT_TOKEN
```

Nhập một chuỗi token tự tạo, ví dụ chuỗi random dài. Sau đó set cùng token trong `.env` app:

```bash
PAYNOTE_AI_PROXY_TOKEN=<same-token>
```

Khi bật token, test Worker bằng:

```bash
curl -X POST "https://paynote-gemini-proxy.<your-subdomain>.workers.dev/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <same-token>" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {"role": "user", "content": "Trả lời ngắn: PayNote là gì?"}
    ]
  }'
```

Lưu ý: token này không thay thế authentication thật theo user, vì mobile app vẫn có thể bị reverse-engineer. Nó chỉ giúp tránh endpoint bị gọi công khai quá dễ.

## 8. Guardrails hiện có

Worker hiện đang có các giới hạn cơ bản:

- Chỉ cho phép các model trong allowlist: `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`.
- Giới hạn tối đa 12 messages mỗi request.
- Giới hạn tổng prompt khoảng 12,000 ký tự.
- Không cache response.
- Không bao giờ trả `GEMINI_API_KEY` về client.

## 9. Khi cần đổi model

Sửa `.env` app:

```bash
PAYNOTE_AI_MODEL=gemini-2.5-flash-lite
```

Model phải nằm trong allowlist ở `workers/gemini-proxy/src/index.ts`. Nếu muốn thêm model mới, sửa `ALLOWED_MODELS`, rồi deploy lại:

```bash
cd workers/gemini-proxy
npx wrangler deploy
```

## 10. Troubleshooting

Nếu app trả lời bằng fallback local:

- Kiểm tra `.env` có `PAYNOTE_AI_PROXY_URL` đúng endpoint `/chat` chưa.
- Chạy app bằng `yarn android` hoặc `yarn ios`, không chạy lệnh bỏ qua `scripts/with-env.js`.
- Kiểm tra Worker có secret `GEMINI_API_KEY` chưa: chạy lại `npx wrangler secret put GEMINI_API_KEY` nếu cần.
- Nếu đã bật `PAYNOTE_CLIENT_TOKEN`, đảm bảo `.env` app có `PAYNOTE_AI_PROXY_TOKEN` trùng giá trị.
- Xem log Worker:

```bash
cd workers/gemini-proxy
npx wrangler tail
```
