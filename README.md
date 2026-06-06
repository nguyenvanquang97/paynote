# PayNote

Ứng dụng quản lý chi tiêu cá nhân trên mobile, tập trung vào tốc độ nhập liệu, theo dõi ngân sách theo danh mục và cảnh báo chi tiêu theo ngữ cảnh.

## Mục tiêu sản phẩm

- Ghi nhận giao dịch nhanh, ít thao tác.
- Theo dõi sức khỏe tài chính theo tháng.
- Cảnh báo khi chi tiêu vượt ngưỡng ngân sách.
- Hỗ trợ nhắc nhở định kỳ và thông báo trong ứng dụng.

## Tính năng chính

- Quản lý giao dịch thu/chi.
- Dashboard tổng quan thu nhập, chi tiêu và phân bổ danh mục.
- Biểu đồ thống kê theo danh mục và thời gian.
- Cài đặt ngân sách theo danh mục theo tháng.
- Cảnh báo ngân sách theo ngưỡng (`50/80/100/120%`).
- Trung tâm thông báo trong app (đánh dấu đã đọc/chưa đọc, xoá, chọn nhiều).
- Nhắc nhở định kỳ qua native notification.
- Tuỳ chọn AI budget alerts (dùng Gemini API key).
- Tuỳ chỉnh theme và thông tin hồ sơ cá nhân.

## Công nghệ sử dụng

- Yarn workspaces monorepo
- React Native `0.85.3` (CLI)
- React `19.2.3`
- TypeScript
- NestJS API
- Supabase Auth + Postgres
- Render deployment
- Zustand (state management)
- MMKV (local key-value storage)
- SQLite (`react-native-sqlite-storage`)
- React Navigation (stack + bottom tabs)
- Reanimated + Gesture Handler + Bottom Sheet

## Yêu cầu môi trường

- Node.js `>= 22.11.0`
- Yarn `3.6.4` (khuyến nghị, theo `packageManager`)
- Android Studio + Android SDK (để chạy Android)
- Xcode + CocoaPods (để chạy iOS trên macOS)

## Cài đặt

```bash
yarn install
```

## Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Ghi chú:

- App hỗ trợ cả `GEMINI_API_KEY` và `GOOGLE_API_KEY`.
- Script `scripts/with-env.js` sẽ tự generate `src/config/runtimeEnv.generated.ts` khi chạy app.

## Chạy dự án

### 1) Khởi động Metro

```bash
yarn mobile:start
```

### 2) Chạy Android

```bash
yarn mobile:android
```

### 3) Chạy iOS

Cài pods (lần đầu hoặc khi thay đổi native dependencies):

```bash
bundle install
bundle exec pod install
```

Sau đó chạy:

```bash
yarn mobile:ios
```

### 4) Chạy API

```bash
yarn api:dev
```

## Scripts hữu ích

- `yarn mobile:start`: chạy Metro bundler.
- `yarn mobile:android`: build + chạy app Android.
- `yarn mobile:ios`: build + chạy app iOS.
- `yarn api:dev`: chạy NestJS API.
- `yarn api:build`: build NestJS API.
- `yarn lint`: chạy ESLint.
- `yarn test`: chạy Jest tests.

## Cấu trúc thư mục

```text
apps/
  mobile/            # React Native app, bắt đăng nhập Supabase Email OTP
  api/               # NestJS API deploy Render
packages/
  shared/            # DTO/types/helper dùng chung FE/BE
supabase/
  migrations/        # schema Postgres
```

## Kiến trúc ngắn gọn

- `App.tsx` khởi tạo dữ liệu từ local storage, thiết lập navigation và background services.
- Giao dịch mới (đặc biệt từ bank notification parser) sẽ kích hoạt:
  - cập nhật store,
  - tính lại thống kê,
  - kiểm tra ngưỡng ngân sách,
  - tạo thông báo in-app.
- Native layer Android hỗ trợ nhận/chạy thông báo định kỳ và bridge sang JS.

## Kiểm thử và chất lượng

```bash
yarn lint
yarn test
```

Khuyến nghị chạy cả lint và test trước khi mở PR.

## Troubleshooting nhanh

- Không chạy được Android: kiểm tra `ANDROID_HOME`, emulator/device và cấp quyền notification.
- iOS lỗi pods: chạy lại `bundle exec pod install` trong thư mục `ios/`.
- AI alert không hoạt động: kiểm tra `.env` và giá trị API key hợp lệ.

## Lưu ý bảo mật

- Không commit file `.env` hoặc API key thật.
- File `src/config/runtimeEnv.generated.ts` được generate tự động từ local env.

## Đóng góp

1. Tạo branch mới từ `main`.
2. Commit theo từng thay đổi nhỏ, rõ ràng.
3. Chạy `yarn lint` và `yarn test`.
4. Mở Pull Request với mô tả mục tiêu và phạm vi thay đổi.

## License

Chưa khai báo license chính thức trong repository này.
