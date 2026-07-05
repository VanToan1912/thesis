# RideWithMe

RideWithMe là một ứng dụng đặt xe mobile-first lấy cảm hứng từ Uber, được xây dựng bằng React Native cho cả Android và iPhone, backend tRPC, cơ sở dữ liệu PostgreSQL và dashboard quản trị web.

Project được thiết kế theo hướng end-to-end, bao gồm:

- Ứng dụng mobile cho người dùng đặt xe
- Backend API tập trung
- Cơ sở dữ liệu quan hệ
- Trang admin để quản trị hệ thống
- Luồng thanh toán VNPay
- Kiến trúc domain bám theo sơ đồ lớp đã cung cấp

## Tổng Quan

Mục tiêu của dự án là xây dựng một nền tảng đặt xe gọn gàng, hiện đại và có thể mở rộng, với trải nghiệm ưu tiên cho thiết bị di động. Ứng dụng hỗ trợ:

- Đăng ký và đăng nhập bằng email/mật khẩu
- Đăng nhập bằng Google
- Xác thực và phân quyền theo vai trò
- Hiển thị vị trí hiện tại theo thời gian thực trên bản đồ
- Tìm kiếm điểm đón và điểm đến với gợi ý địa điểm
- Hiển thị xe gần người dùng
- Màn hình xác nhận chuyến đi với lộ trình, thời gian ước tính và giá cước
- Thanh toán an toàn bằng VNPay
- Chỉ tạo chuyến đi sau khi thanh toán thành công
- Hồ sơ cá nhân
- Chuyến đi gần đây
- Lịch sử chuyến đi
- Dashboard admin để quản lý users, trips, drivers và doanh thu

## Tính Năng

### Mobile App

- Onboarding trực quan và có bố cục theo hướng mobile-first
- Đăng ký tài khoản bằng email/mật khẩu
- Đăng nhập bằng email/mật khẩu
- Đăng nhập bằng Google
- Lưu token đăng nhập an toàn bằng `expo-secure-store`
- Lấy vị trí thiết bị bằng `expo-location`
- Bản đồ và marker xe gần bạn bằng `react-native-maps`
- Tìm kiếm địa điểm và autocomplete
- Xem xe gần khu vực hiện tại
- Ước tính giá, quãng đường và thời gian chuyến đi
- Mở luồng thanh toán VNPay trong browser session
- Xử lý deep link sau thanh toán
- Trang Profile
- Trang Recent Rides
- Trang Ride History

### Backend

- API type-safe với tRPC
- Xác thực JWT
- Phân quyền theo vai trò `RIDER`, `DRIVER`, `ADMIN`
- Xử lý đăng ký, đăng nhập, Google login
- API autocomplete và resolve địa điểm
- API tính giá và ước tính chuyến đi
- API tạo payment order VNPay
- API xác nhận thanh toán từ return URL
- API IPN cho VNPay
- API admin để thống kê và quản lý dữ liệu

### Admin Dashboard

- Đăng nhập admin
- Xem thống kê:
  - tổng user
  - tổng chuyến đi
  - tổng tài xế
  - doanh thu
- Danh sách user
- Danh sách trip
- Danh sách driver
- Thay đổi trạng thái tài xế trực tiếp

## Tech Stack

### Mobile

- React Native
- Expo
- Expo Router
- TanStack Query
- tRPC Client
- Zustand
- react-native-maps
- expo-location
- expo-secure-store
- expo-auth-session

### Backend

- Node.js
- Express
- tRPC
- PostgreSQL
- Prisma
- JWT
- bcryptjs
- VNPay payment gateway

### Admin

- Next.js
- React
- tRPC Client
- TanStack Query

### DevOps

- pnpm workspaces
- Docker
- Docker Compose

## Cấu Trúc Dự Án

```text
apps/
  mobile/   # Ứng dụng React Native / Expo
  admin/    # Admin dashboard web
  server/   # Backend tRPC + Express
packages/
  db/       # Prisma schema, seed, client
  domain/   # Domain model theo sơ đồ lớp
  shared/   # Shared types và Zod schemas
```

## Domain Model

Phần `packages/domain` được xây dựng để bám theo sơ đồ lớp bạn cung cấp, gồm:

- `RideSharingService`
- `DriverMatchingStrategy`
- `NearestDriverMatchingStrategy`
- `PricingStrategy`
- `FlatRatePricingStrategy`
- `VehicleBasedPricingStrategy`
- `Location`
- `Vehicle`
- `Trip`
- `Driver`
- `Rider`
- `TripState`
- `RequestedState`
- `AssignedState`
- `InProgressState`
- `CompletedState`
- `TripObserver`
- `RideSharingServiceDemo`

## Database Schema

PostgreSQL được quản lý qua Prisma. Các thực thể chính:

- `User`
- `Rider`
- `Driver`
- `Vehicle`
- `Trip`
- `Payment`
- `AdminAuditLog`

### Vai trò người dùng

- `RIDER`: người đặt xe
- `DRIVER`: tài xế
- `ADMIN`: quản trị viên

## Luồng Thanh Toán

RideWithMe dùng **VNPay** cho thanh toán trong ứng dụng.

Luồng xử lý:

1. Người dùng chọn điểm đón, điểm đến và loại xe.
2. Backend tính quãng đường, thời gian và giá cước.
3. Backend tạo payment order VNPay.
4. Mobile mở payment URL trong browser session.
5. VNPay trả về app qua deep link.
6. Backend xác minh checksum và số tiền thanh toán.
7. Chỉ khi thanh toán thành công, hệ thống mới tạo `Trip`.

## Tài Khoản Demo

Dữ liệu seed tạo sẵn một số tài khoản demo:

- Admin: `admin@ridewithme.app`
- Rider: `rider@ridewithme.app`
- Driver: `driver@ridewithme.app`

Mật khẩu demo:

- `Password123!`

## Yêu Cầu Hệ Thống

- Node.js 22+
- pnpm 9+
- PostgreSQL 16+
- Docker và Docker Compose nếu muốn chạy bằng container

## Biến Môi Trường

Tạo file `.env` từ `.env.example`.

### Biến chính

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_URL`
- `VNPAY_RETURN_URL`
- `VNPAY_IPN_URL`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_API_URL`

## Cài Đặt

```bash
pnpm install
```

Sau đó tạo database schema:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

Nếu bạn muốn migrate theo lịch sử migrations, có thể dùng:

```bash
pnpm db:migrate
```

## Chạy Dự Án

### Chạy local

```bash
pnpm dev
```

Hoặc chạy từng phần:

```bash
pnpm server
pnpm admin
pnpm mobile
```

### Chạy bằng Docker

```bash
docker compose up --build
```

Khi chạy bằng Docker:

- Backend: `http://localhost:4000`
- Admin: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

Mobile Expo vẫn chạy ngoài Docker bằng:

```bash
pnpm mobile
```

## Scripts

### Root

- `pnpm dev`: chạy toàn bộ workspace ở chế độ dev
- `pnpm build`: build toàn bộ workspace
- `pnpm typecheck`: kiểm tra type toàn bộ workspace
- `pnpm db:generate`: generate Prisma client
- `pnpm db:migrate`: migrate database
- `pnpm db:push`: push schema vào database
- `pnpm db:seed`: nạp dữ liệu demo
- `pnpm docker:up`: `docker compose up --build`
- `pnpm docker:down`: dừng containers và xóa volumes

### Mobile

- `pnpm mobile`
- `pnpm --filter @ridewithme/mobile android`
- `pnpm --filter @ridewithme/mobile ios`

### Admin

- `pnpm admin`

### Server

- `pnpm server`

## API / Luồng Chức Năng Chính

### Authentication

- `auth.register`
- `auth.login`
- `auth.googleLogin`
- `auth.me`
- `auth.completeOnboarding`
- `auth.updateProfile`

### Maps

- `map.autocomplete`
- `map.resolvePlace`
- `map.nearbyDrivers`

### Ride / Payment

- `rides.estimate`
- `rides.createCheckout`
- `rides.confirmPayment`
- `rides.recent`
- `rides.history`

### Admin

- `admin.stats`
- `admin.users`
- `admin.trips`
- `admin.drivers`
- `admin.setDriverStatus`

## Thiết Kế Giao Diện

Ứng dụng mobile được thiết kế với ưu tiên:

- Gọn gàng
- Hiện đại
- Tối giản thao tác
- Ưu tiên màn hình nhỏ
- Tông màu tối, nổi khối rõ ràng

## Lưu Ý Khi Tích Hợp Thực Tế

- Google Sign-In cần cấu hình đúng client ID cho từng nền tảng
- Google Maps cần API key hợp lệ để resolve place và hiển thị map production
- VNPay cần bộ thông tin merchant thật:
  - `TmnCode`
  - `HashSecret`
  - Return URL
  - IPN URL
- Mobile deep link scheme hiện dùng `ridewithme://`

## Docker

Docker Compose hiện bao gồm:

- PostgreSQL
- Backend server
- Admin dashboard

Các file liên quan:

- [docker-compose.yml](/E:/Workspace/thesis/docker-compose.yml)
- [Dockerfile.server](/E:/Workspace/thesis/Dockerfile.server)
- [Dockerfile.admin](/E:/Workspace/thesis/Dockerfile.admin)

## Roadmap Gợi Ý

- Tách driver app riêng nếu muốn vận hành thực tế
- Bổ sung bản đồ route polyline thực
- Thêm push notification
- Thêm chat giữa rider và driver
- Thêm payment history chi tiết
- Thêm quản lý khuyến mãi và mã giảm giá

## Ghi Chú

Project hiện được scaffold đầy đủ để phát triển tiếp theo hướng production. Một số tích hợp bên ngoài như Google Sign-In, Google Maps và VNPay cần bạn cung cấp thông tin thật để chạy end-to-end ngoài môi trường demo.
