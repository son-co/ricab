# Đi cùng bạn — Ứng dụng đặt dịch vụ di chuyển & giao nhận

App React Native (Expo SDK 57, TypeScript, Expo Router) theo mô hình **trung gian giữa khách hàng và đại lý**: khách nhập yêu cầu → hệ thống báo đại lý → đại lý tìm xe và gửi báo giá → khách chấp nhận/từ chối → đại lý xác nhận chuyến.

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
    map-pick.tsx        # Chọn điểm đón/đến trên bản đồ (Leaflet/OSM)
    request/[id].tsx    # Chi tiết yêu cầu + báo giá (khách)
    agency/             # Khu vực đại lý: danh sách + chi tiết/gửi báo giá
    notifications.tsx   # Thông báo theo vai trò
  components/           # UI dùng chung, bộ chọn địa điểm, LeafletMap, card yêu cầu
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

## Chọn điểm trên bản đồ

Bước "Hành trình" của form đặt xe cho phép chọn điểm đón/đến bằng 2 cách: danh sách gợi ý (offline) hoặc **ghim trên bản đồ thật**:

- **Leaflet + OpenStreetMap** chạy trong WebView (`react-native-webview`, có sẵn trong Expo Go) — không cần API key, hoạt động cả trong Expo Go lẫn bản build store.
  > Lý do không dùng `react-native-maps`/Google Maps: từ SDK 53, **Expo Go đã gỡ key Google Maps** nên tile tải về toàn màu đen (chỉ còn logo) — xem [react-native-maps#5888](https://github.com/react-native-maps/react-native-maps/issues/5888). Muốn quay lại Google Maps phải tạo development build riêng + API key.
- Ô tìm kiếm địa danh dùng **Photon (Komoot)** làm chính (kết quả tiếng Việt đúng nghĩa hơn), tự chuyển sang **Nominatim (OpenStreetMap)** khi Photon lỗi/rỗng; tra ngược toạ độ → địa chỉ thì Nominatim trước, Photon dự phòng — cả hai đều không cần API key, tự throttle ~1 req/giây và timeout 8s mỗi lần thử, cần mạng.
- Di chuyển bản đồ để ghim toạ độ → tự tra địa chỉ → dùng cho tính khoảng cách & giá dự kiến.

## Giai đoạn sau (chưa làm trong MVP)

- Định vị GPS tự động của thiết bị (bản đồ đã có, chưa đọc vị trí hiện tại).
- Tích hợp Zalo OA / push notification (hiện tại: thông báo in-app).
- Thanh toán trực tuyến, đánh giá, theo dõi chuyến realtime, báo cáo đại lý.
