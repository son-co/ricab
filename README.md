# Đi cùng bạn — Ứng dụng đặt dịch vụ di chuyển & giao nhận

App React Native (Expo SDK 58, TypeScript, Expo Router) theo mô hình **trung gian giữa khách hàng và đại lý**: khách nhập yêu cầu → hệ thống báo đại lý → đại lý tìm xe và gửi báo giá → khách chấp nhận/từ chối → đại lý xác nhận chuyến.

## Chạy dự án

```bash
npm install
npx expo start          # quét QR bằng Expo Go
npm run typecheck       # kiểm tra kiểu
npx eslint .            # kiểm tra lint
```

## Cấu trúc

```
src/
  app/                  # Expo Router — mỗi file là một màn hình
    (tabs)/             # Trang chủ, Khám phá, Lịch sử, Tài khoản
    booking.tsx         # Form đặt xe 4 bước
    request/[id].tsx    # Chi tiết yêu cầu + báo giá (khách)
    agency/             # Khu vực đại lý: danh sách + chi tiết/gửi báo giá
    notifications.tsx   # Thông báo theo vai trò
  components/           # UI dùng chung, bộ chọn địa điểm, card yêu cầu
  store/               # RequestsContext: reducer + lưu AsyncStorage
  data/mock.ts         # Dịch vụ, địa điểm (Nghệ An), dữ liệu mẫu
  utils/               # Tính khoảng cách, ước tính giá, định dạng
  theme.ts, types.ts
```

## Nghiệm thu (MVP giai đoạn 1)

- Chọn dịch vụ trước khi đặt; thiếu dịch vụ/không hợp lệ → không gửi được yêu cầu.
- Không gửi được khi thiếu điểm đón, điểm đến, ngày/giờ đi hoặc liên hệ sai SĐT.
- Bắt buộc chọn số lượng khách; bao xe phải chọn loại xe 5/7/16 chỗ.
- Bắt buộc chọn 1 trong 3 phương án giờ đi (đón ngay / sớm nhất / khung giờ).
- Sau xác nhận: yêu cầu được tạo, đại lý nhận thông báo mới, trạng thái "Đang tìm xe".
- Đại lý gửi báo giá (giá, loại xe, đi riêng/ghép, thời gian đón) → khách thấy báo giá trước khi chấp nhận.
- Chấp nhận báo giá → chuyển sang "Đang chờ đại lý phản hồi".
- Mọi trạng thái hiển thị rõ bằng badge + lịch sử trạng thái (timeline) trên mobile.

## Giai đoạn sau (chưa làm trong MVP)

- Bản đồ thật & định vị (hiện tại: gợi ý địa điểm + tính khoảng cách toạ độ).
- Tích hợp Zalo OA / push notification (hiện tại: thông báo in-app).
- Thanh toán trực tuyến, đánh giá, theo dõi chuyến realtime, báo cáo đại lý.
