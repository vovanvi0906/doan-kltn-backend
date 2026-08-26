Backend hệ thống Dịch vụ Gia đình On-Demand tích hợp AI

Backend cho đề tài khóa luận tốt nghiệp:

Xây dựng hệ thống phần mềm kết nối dịch vụ gia đình theo mô hình On-Demand tích hợp xử lý ảnh và AI

Hệ thống đóng vai trò nền tảng trung gian kết nối Customer có nhu cầu sử dụng dịch vụ gia đình với Worker/Thợ kỹ thuật phù hợp theo vị trí và kỹ năng. Backend chịu trách nhiệm xử lý nghiệp vụ đặt dịch vụ, phân bổ đơn, theo dõi thời gian thực, tích hợp AI/xử lý ảnh, thanh toán, hoa hồng, ví người lao động và các chức năng quản trị.

1. Trạng thái hiện tại

Project hiện đang ở giai đoạn khởi tạo Backend JavaScript.

Khởi tạo NestJS Backend.

Chuyển source khởi động sang JavaScript.

Sử dụng Babel để chạy NestJS với JavaScript.

Sử dụng Nodemon cho môi trường development.

Tổ chức khung thư mục theo hướng Feature-Based Modular Monolith.

Backend boot thành công.

Health Check hoạt động tại GET /api/health.

Kết nối Prisma + PostgreSQL/PostGIS.

Kết nối Redis.

Authentication / Authorization.

Customer / Worker / Service.

Order State Machine.

Matching Worker bằng PostGIS.

Socket.IO / GPS Tracking.

Upload ảnh / Object Storage.

Tích hợp FastAPI AI Service.

Payment / Commission / Wallet.

Review / Admin.

Testing / Docker / Deploy.

Lưu ý: các module nghiệp vụ trong src/modules/ hiện chủ yếu là khung kiến trúc. Không nên hiểu danh sách module là các chức năng đã hoàn thiện.

2. Mục tiêu hệ thống

Backend hướng tới hỗ trợ luồng nghiệp vụ chính:

Customer chọn dịch vụ
        ↓
Tạo Order
        ↓
Hệ thống tìm Worker phù hợp gần nhất
        ↓
Phát Order cho Worker
        ↓
Worker Accept
        ↓
Worker di chuyển đến địa điểm
        ↓
Face Verification
        ↓
Upload ảnh Before
        ↓
Bắt đầu công việc
        ↓
Upload ảnh After
        ↓
AI hỗ trợ phân tích Before / After
        ↓
Customer nghiệm thu
        ↓
Thanh toán
        ↓
Tính Commission
        ↓
Ghi nhận thu nhập vào Wallet Worker
        ↓
Customer đánh giá Worker

Ba nhóm người dùng chính:

Customer: tìm và đặt dịch vụ, theo dõi Worker, thanh toán, nghiệm thu, đánh giá.

Worker: đăng ký hồ sơ/kỹ năng, nhận hoặc từ chối Order, cập nhật vị trí, thực hiện công việc, quản lý thu nhập.

Admin: duyệt Worker, quản lý người dùng, dịch vụ, Order, giao dịch, hoa hồng và thống kê hệ thống.

3. Kiến trúc tổng thể

Backend được định hướng theo Modular Monolith. Các nghiệp vụ là module trong cùng một NestJS application, không tách thành nhiều network microservice riêng.

FastAPI AI Service được tách độc lập vì sử dụng Python và các thư viện AI/xử lý ảnh.

flowchart TB
    C[Customer Mobile App]
    W[Worker Mobile App]
    A[Web Admin]

    N[Nginx]
    B[NestJS Backend - JavaScript]
    S[Socket.IO Gateway]

    DB[(PostgreSQL + PostGIS)]
    R[(Redis)]
    ST[Object Storage / AWS S3]
    P[Payment Gateway / Sandbox]

    AI[FastAPI AI Service]
    Y[YOLOv8]
    D[DeepFace]
    O[OpenCV]

    C --> N
    W --> N
    A --> N

    N --> B
    N --> S

    B --> DB
    B --> R
    S --> R
    S --> B

    B --> ST
    B --> P
    B --> AI

    AI --> ST
    AI --> Y
    AI --> D
    AI --> O

4. Công nghệ sử dụng

Backend Core

Công nghệ

Vai trò

Node.js

JavaScript runtime

NestJS

Backend framework

JavaScript

Ngôn ngữ chính của Backend

Babel

Hỗ trợ chạy NestJS JavaScript/decorator

Nodemon

Tự động restart server khi development

Prisma

ORM truy cập database

Database & Cache

Công nghệ

Vai trò

PostgreSQL

Database chính

PostGIS

Tính khoảng cách GPS và tìm Worker gần nhất

Redis

Cache, vị trí realtime, Socket mapping, dispatch context, queue

Authentication

Công nghệ

Vai trò

Passport.js

Xác thực

JWT

Access token / authentication

bcrypt

Băm mật khẩu

Real-time

Công nghệ

Vai trò

Socket.IO

Order notification, GPS tracking, realtime status, chat cơ bản

AI / Xử lý ảnh

Công nghệ

Vai trò

Python

Ngôn ngữ cho AI Service

FastAPI

API cho AI Service

YOLOv8

Phân tích/phân loại ảnh sự cố

DeepFace

Face Verification

OpenCV

Tiền xử lý ảnh và hỗ trợ Before/After analysis

Pillow

Xử lý ảnh cơ bản

AI Service được định hướng tự host. Kết quả AI là dữ liệu hỗ trợ nghiệp vụ, không mặc định là quyết định nghiệp vụ cuối cùng.

Storage / Queue / External Integration

Công nghệ

Vai trò

AWS S3 / Object Storage

Lưu ảnh sự cố, ảnh khuôn mặt, Before/After

Multer

Nhận file upload

Axios / NestJS HttpModule

NestJS gọi FastAPI

BullMQ

Job queue xử lý AI bất đồng bộ

VNPay / Momo / VietQR sandbox

Thanh toán thử nghiệm, tùy lựa chọn cuối cùng

Testing / Documentation / Deployment

Công nghệ

Vai trò

Jest

Unit/Integration Test

Postman

API testing thủ công

Swagger

API documentation

Docker

Container hóa ứng dụng

Docker Compose

Môi trường development

AWS EC2

Deployment server dự kiến

Nginx

Reverse proxy

PM2

Quản lý Node.js process nếu sử dụng trong production

5. Cấu trúc thư mục

Project được tổ chức theo Feature-Based Modular Monolith.

src/
├── main.js
├── app.module.js
│
├── health/
│   ├── health.module.js
│   └── health.controller.js
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── customers/
│   ├── workers/
│   ├── services/
│   ├── orders/
│   ├── matching/
│   ├── locations/
│   ├── realtime/
│   ├── images/
│   ├── ai/
│   ├── payments/
│   ├── wallets/
│   ├── reviews/
│   ├── admin/
│   └── configurations/
│
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── storage/
│   └── external/
│       ├── ai/
│       └── payment/
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   ├── exceptions/
│   ├── constants/
│   └── utils/
│
└── config/

Khi Prisma được hoàn thiện, database schema/migration được đặt ở root project:

prisma/
├── schema.prisma
├── migrations/
└── seed.js

Quy ước module

Khi triển khai một chức năng, code liên quan được đặt gần nhau trong cùng module.

Ví dụ:

src/modules/orders/
├── orders.module.js
├── orders.controller.js
├── orders.service.js
├── orders.repository.js
├── order-workflow.service.js
├── dto/
├── constants/
└── validators/

Vai trò chính:

Controller
    ↓
Nhận HTTP Request / gọi Service

Service
    ↓
Xử lý business logic

Repository
    ↓
Truy cập Prisma / Database

DTO / Validator
    ↓
Kiểm tra dữ liệu đầu vào

6. Nguyên tắc kiến trúc

modules/

Chứa nghiệp vụ của hệ thống:

Auth

User

Customer

Worker

Service

Order

Matching

Location

Realtime

Image

AI Integration

Payment

Wallet

Review

Admin

infrastructure/

Chứa các thành phần kỹ thuật bên dưới nghiệp vụ:

Prisma

Redis

Object Storage

FastAPI HTTP client

Payment Gateway client

common/

Chỉ chứa code thật sự dùng chung:

Guards

Decorators

Exception Filters

Interceptors

Pipes

Constants

Utilities

Không đưa business logic của Order, Worker, Payment hoặc AI vào common/.

config/

Tập trung cấu hình môi trường, hạn chế sử dụng process.env rải rác trong source code.

7. Order là nghiệp vụ trung tâm

Order là aggregate trung tâm của hệ thống. Các nghiệp vụ sau đều liên quan đến Order:

Matching Worker.

Assignment.

GPS Tracking.

Face Verification.

Before/After Image.

Payment.

Commission.

Wallet.

Review.

Order State Machine dự kiến:

CREATED
   ↓
SEARCHING
   ↓
ASSIGNED
   ↓
WORKER_ARRIVING
   ↓
ARRIVED
   ↓
[Face Verification]
   ↓
IN_PROGRESS
   ↓
AWAITING_CONFIRMATION
   ↓
AWAITING_PAYMENT
   ↓
COMPLETED

CANCELLED là trạng thái kết thúc phụ thuộc chính sách hủy được chốt sau.

Face Verification không phải Order State mà là điều kiện kiểm tra trước transition:

ARRIVED → IN_PROGRESS

Khi triển khai, các transition trạng thái cần được kiểm tra ở Backend; client không được tự gửi một status tùy ý để thay đổi trạng thái Order.

8. Luồng AI dự kiến

Phân tích ảnh sự cố

Customer Image
    ↓
NestJS Backend
    ↓
Object Storage
    ↓
FastAPI AI Service
    ↓
YOLOv8 / OpenCV
    ↓
Prediction
    ↓
Service Suggestion

Face Verification

Worker Camera
     +
Reference Face
     ↓
FastAPI
     ↓
DeepFace
     ↓
Verification Result
     ↓
NestJS
     ↓
Cho phép / từ chối Start Work

Before / After Analysis

Before Image + After Image
           ↓
       AI Service
           ↓
 Difference / Similarity Result
           ↓
 Hỗ trợ Customer nghiệm thu

AI chỉ hỗ trợ đưa ra thông tin; quyết định nghiệp vụ cuối cùng vẫn do Backend và người dùng thực hiện theo quy trình hệ thống.

9. Cài đặt project hiện tại

Yêu cầu

Node.js

npm

Project hiện đã được kiểm tra chạy thành công với Node.js v24.19.0 trên môi trường development hiện tại.

Cài dependencies

npm install

Chạy Development Server

npm run start:dev

Script development hiện tại sử dụng Nodemon + Babel:

nodemon --watch src --exec babel-node src/main.js

Khi chạy thành công:

Nest application successfully started
Application is running on: http://localhost:3000/api

10. Health Check

Endpoint hiện đã hoạt động:

GET /api/health

URL local:

http://localhost:3000/api/health

Response mong đợi:

{
  "status": "ok"
}

Test bằng CMD/PowerShell:

curl.exe http://localhost:3000/api/health

11. Xử lý lỗi Port 3000 đang được sử dụng

Nếu gặp:

Error: listen EADDRINUSE: address already in use :::3000

Kiểm tra process đang giữ port:

netstat -ano | findstr :3000

Kiểm tra PID:

tasklist | findstr <PID>

Nếu đó là Node server cũ, có thể tắt bằng:

taskkill /PID <PID> /F

Sau đó chạy lại:

npm run start:dev

12. Environment Variables

Ở giai đoạn Health Check hiện tại, project chưa cần toàn bộ external service.

Khi triển khai các module tiếp theo, cấu hình dự kiến sẽ được quản lý qua .env, ví dụ:

PORT=3000

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# AI Service
AI_SERVICE_URL=

# Object Storage
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Payment
PAYMENT_PROVIDER=

Tên biến môi trường có thể được điều chỉnh khi từng module được triển khai. Không commit secret thật lên Git.

13. Roadmap Backend

Thứ tự triển khai được ưu tiên theo dependency:

Project bootstrap ✅

Environment / Config

Prisma + PostgreSQL

PostGIS

Redis

Authentication + RBAC

User / Customer / Worker

Service Catalog

Order + State Machine

Matching Worker bằng PostGIS

Socket.IO + GPS Tracking

Image Upload + Object Storage

FastAPI AI Integration

Face Verification

Before / After Analysis

Payment Sandbox

Commission + Wallet

Review / Admin

Testing

Docker + Deploy

14. Các nguyên tắc nghiệp vụ quan trọng

PostgreSQL là Source of Truth

PostgreSQL lưu dữ liệu nghiệp vụ lâu dài như:

User.

Worker.

Order.

Payment.

Wallet.

Review.

AI result cần lưu.

Transaction history.

Redis phù hợp với dữ liệu ngắn hạn như:

Latest Worker location.

Socket mapping.

Dispatch candidate context.

Cache.

BullMQ jobs.

Worker Accept phải atomic

Khi nhiều Worker cùng Accept một Order, Backend phải bảo đảm chỉ một Worker được gán thành công.

Wallet phải có Transaction Ledger

Không chỉ cập nhật wallet.balance. Mỗi lần cộng/trừ tiền cần có WalletTransaction để audit và chống xử lý trùng.

Commission cần lưu snapshot

Khi Payment thành công, tỷ lệ commission áp dụng cho giao dịch cần được lưu lại để Order cũ không bị thay đổi khi Admin chỉnh commission trong tương lai.

Payment Callback phải Idempotent

Một callback/webhook được gửi nhiều lần không được tạo nhiều WalletTransaction hoặc cộng tiền Worker nhiều lần.

15. Testing dự kiến

Các nhóm test chính:

Unit Test.

Integration Test.

API Test.

E2E Test.

Realtime / Socket Test.

Database Test.

AI Integration Test.

Basic Security Test.

Deployment Smoke Test.

Các case quan trọng cần ưu tiên:

Hai Worker Accept cùng một Order.

Payment webhook gửi lặp.

Customer truy cập Order của Customer khác.

Worker thao tác Order không được assign.

Worker chưa được duyệt nhưng cố nhận Order.

State transition không hợp lệ.

FastAPI AI Service unavailable.

Redis reconnect / Socket reconnect.

16. Deployment dự kiến

Customer / Worker / Admin
          ↓
        Nginx
          ↓
    NestJS Backend
     ├── PostgreSQL + PostGIS
     ├── Redis
     ├── FastAPI AI Service
     ├── Object Storage
     └── Payment Sandbox

Development dự kiến sử dụng Docker Compose. Production dự kiến triển khai trên AWS EC2 qua Nginx; database có thể chạy container hoặc dịch vụ managed tùy ngân sách và phương án triển khai cuối cùng.

17. Tài liệu của đề tài

Các tài liệu thiết kế liên quan gồm:

Tài liệu xác định đề tài.

Tài liệu yêu cầu phần mềm.

Tài liệu phân tích và thiết kế hệ thống.

Tài liệu thiết kế Backend.

Tài liệu AI/Xử lý ảnh.

Tài liệu kiểm thử.

Tài liệu Deploy.

18. Ghi chú phát triển

Project đang được xây dựng theo nguyên tắc:

Một task
   ↓
Một phạm vi rõ ràng
   ↓
Code
   ↓
Run
   ↓
Test
   ↓
PASS
   ↓
Mới chuyển sang task tiếp theo

Không triển khai hàng loạt module cùng lúc khi nền tảng phụ thuộc phía dưới chưa hoạt động ổn định.

License

Đây là project phục vụ đồ án khóa luận tốt nghiệp. Thông tin license/phạm vi sử dụng sẽ được cập nhật sau.