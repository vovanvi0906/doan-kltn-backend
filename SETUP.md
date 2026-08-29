# Doan KLTN Backend - On-Demand Home Service

Dự án Backend cung cấp API cho hệ thống đặt lịch dịch vụ gia đình (Home Service), được xây dựng trên nền tảng kiến trúc Client-Server.

## 🛠 Tech Stack
- **Framework:** NestJS
- **Database:** PostgreSQL (tích hợp PostGIS cho dữ liệu tọa độ không gian)
- **Caching:** Redis
- **ORM:** Prisma
- **Infrastructure:** Docker & Docker Compose

---

## 🚀 Hướng Dẫn Khởi Chạy (Dành cho Developer & AI Agents)

Để tự động hóa quá trình thiết lập, dự án đã được tích hợp sẵn kịch bản khởi động (Batch script) cho môi trường Windows.

### Yêu cầu hệ thống (Prerequisites)
1. Cài đặt **Node.js** (Khuyên dùng v18+).
2. Cài đặt **Docker Desktop** (Đảm bảo Docker đang chạy ngầm).
3. Đảm bảo file `.env` đã được thiết lập đúng với cấu hình database (Liên hệ Backend Lead để lấy file `.env` vì file này không được push lên Git).

### Khởi động với 1-Click (Dành cho Windows)
Chỉ cần mở Terminal tại thư mục gốc của dự án và chạy lệnh:

```cmd
.\start-dev.bat