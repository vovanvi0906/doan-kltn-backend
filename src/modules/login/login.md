LOGIN MODULE

1. Mục tiêu

Tài liệu này mô tả chức năng Đăng nhập (Login) cho Backend của đề tài:

“Xây dựng hệ thống phần mềm kết nối dịch vụ gia đình theo mô hình On-Demand tích hợp xử lý ảnh và AI.”

Chức năng Login được sử dụng chung cho ba nhóm người dùng:

Customer

Worker

Admin

Backend hiện được tổ chức theo hướng Feature-Based Modular Monolith và sử dụng NestJS + JavaScript.

2. Mục tiêu chức năng

Login phải đảm bảo:

Người dùng đăng nhập bằng thông tin hợp lệ.

Mật khẩu được kiểm tra bằng bcrypt.

Tài khoản bị khóa không được đăng nhập.

Backend xác định đúng role.

Backend tạo JWT Access Token.

Có thể mở rộng Refresh Token sau.

Không trả passwordHash về Client.

Có thể dùng chung cho Customer App, Worker App và Web Admin.

3. Actor

Actor

Quyền đăng nhập

Customer

Có

Worker

Có

Admin

Có

3.1. Customer

Customer có thể đăng nhập khi:

Tài khoản tồn tại.

Thông tin đăng nhập hợp lệ.

Tài khoản đang ở trạng thái ACTIVE.

Sau khi đăng nhập, Customer được phép:

Quản lý hồ sơ cá nhân.

Quản lý địa chỉ.

Xem danh mục và chi tiết dịch vụ.

Upload ảnh sự cố.

Nhận gợi ý dịch vụ từ AI.

Tạo Order.

Xem và theo dõi Order của chính mình.

Theo dõi vị trí Worker được gán trong thời gian nghiệp vụ cho phép.

Xem ảnh Before/After.

Xác nhận hoàn thành công việc.

Thanh toán.

Đánh giá Worker.

Xem lịch sử Order.

Customer không được:

Xem Order của Customer khác.

Truy cập API dành riêng cho Worker.

Truy cập API quản trị dành cho Admin.

Tự gán Worker cho Order.

Tự thay đổi Payment, Wallet hoặc Commission.

Tự thay đổi trạng thái Order ngoài các thao tác nghiệp vụ được Backend cho phép.

3.2. Worker

Worker có thể đăng nhập khi:

Tài khoản tồn tại.

Thông tin đăng nhập hợp lệ.

Tài khoản đang ở trạng thái ACTIVE.

Worker có thể đăng nhập ngay cả khi chưa được Admin duyệt.

Nếu approvalStatus chưa phải APPROVED, Worker vẫn được phép:

Xem và cập nhật Worker Profile.

Đăng ký kỹ năng/dịch vụ.

Gửi hồ sơ xét duyệt.

Xem trạng thái xét duyệt.

Tuy nhiên Worker chưa được duyệt:

Không được bật trạng thái sẵn sàng nhận việc.

Không được nhận Order Offer.

Không được Accept Order.

Không được thực hiện nghiệp vụ của Order chưa được gán cho mình.

Sau khi được Admin duyệt, Worker mới có thể:

Bật/tắt trạng thái sẵn sàng.

Cập nhật vị trí GPS.

Nhận hoặc từ chối Order.

Di chuyển và xác nhận đã đến.

Thực hiện Face Verification.

Upload ảnh Before/After.

Bắt đầu và hoàn thành công việc.

Xem thu nhập và Wallet.

3.3. Admin

Admin có thể đăng nhập khi:

Tài khoản Admin tồn tại.

Thông tin đăng nhập hợp lệ.

Tài khoản đang ở trạng thái ACTIVE.

Role của tài khoản là ADMIN.

Sau khi đăng nhập, Admin được phép:

Quản lý Customer.

Quản lý Worker.

Duyệt hoặc từ chối hồ sơ Worker.

Khóa/mở tài khoản.

Quản lý Service Category.

Quản lý Service.

Tra cứu và quản lý Order theo phạm vi nghiệp vụ được cho phép.

Theo dõi Payment.

Theo dõi Wallet Transaction.

Cấu hình Commission.

Xem thống kê hệ thống.

Xử lý Withdrawal nếu chức năng này được đưa vào phạm vi triển khai.

Xử lý Dispute cơ bản nếu chức năng này được đưa vào phạm vi triển khai.

Admin không được:

Bỏ qua cơ chế xác thực và phân quyền.

Sử dụng quyền Admin để giả lập Customer/Worker nhằm bỏ qua business rule.

Sửa trực tiếp dữ liệu tài chính không thông qua nghiệp vụ hợp lệ.

Tự ý thay đổi Order.status nếu transition đó không được hệ thống cho phép.

3.4. Nguyên tắc phân quyền sau Login

Login chỉ xác thực người dùng là ai. Quyền sử dụng chức năng được quyết định tiếp bởi:

Login thành công
      ↓
JWT
{
  sub: userId,
  role: "CUSTOMER | WORKER | ADMIN"
}
      ↓
JwtAuthGuard
      ↓
RolesGuard
      ↓
Business Rules

Riêng Worker có thêm điều kiện xét duyệt:

role = WORKER
      ↓
approvalStatus = APPROVED ?
      ├── Có    → cho phép nhận việc
      └── Không → chỉ cho phép quản lý hồ sơ/xét duyệt

Customer và Admin không sử dụng WorkerApprovalStatus.

4. API

Endpoint

POST /api/auth/login

Request Body

{
  "email": "user@example.com",
  "password": "123456"
}

Nếu hệ thống sau này sử dụng số điện thoại làm thông tin đăng nhập thì có thể mở rộng thêm phone.

5. Validation

Email

Bắt buộc.

Đúng định dạng email.

Trim khoảng trắng.

Chuyển về lowercase trước khi tìm trong Database.

Password

Bắt buộc.

Không được rỗng.

Không cần kiểm tra độ mạnh mật khẩu tại Login vì độ mạnh mật khẩu thuộc chức năng Register/Change Password.

6. Response thành công

HTTP Status:

200 OK

Ví dụ:

{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "status": "ACTIVE"
    }
  }
}

Không được trả:

password
passwordHash
refreshTokenHash

hoặc dữ liệu nhạy cảm khác.

7. Response lỗi

Sai email hoặc mật khẩu

401 Unauthorized

{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác"
}

Không nên trả:

Email không tồn tại

hoặc:

Sai mật khẩu

riêng biệt vì có thể làm lộ thông tin tài khoản.

Tài khoản bị khóa

403 Forbidden

{
  "success": false,
  "message": "Tài khoản đã bị khóa"
}

Input không hợp lệ

400 Bad Request

8. Luồng xử lý

User
  ↓
POST /api/auth/login
  ↓
AuthController
  ↓
AuthService
  ↓
UsersRepository
  ↓
PostgreSQL
  ↓
Tìm User theo email
  ↓
User tồn tại?
  ├── Không → 401
  └── Có
       ↓
Kiểm tra account status
       ↓
ACTIVE?
  ├── Không → 403
  └── Có
       ↓
bcrypt.compare(password, passwordHash)
       ↓
Password đúng?
  ├── Không → 401
  └── Có
       ↓
Generate JWT
       ↓
Return Access Token + User

9. Cấu trúc thư mục

Module Login nằm trong:

src/
└── modules/
    └── auth/
        ├── auth.module.js
        ├── auth.controller.js
        ├── auth.service.js
        │
        ├── dto/
        │   └── login.dto.js
        │
        ├── guards/
        │   ├── jwt-auth.guard.js
        │   └── roles.guard.js
        │
        ├── strategies/
        │   └── jwt.strategy.js
        │
        └── decorators/
            ├── current-user.decorator.js
            └── roles.decorator.js

User query nằm trong module:

src/modules/users/
├── users.module.js
├── users.service.js
└── users.repository.js

10. Trách nhiệm từng file

auth.controller.js

Chỉ chịu trách nhiệm:

HTTP Request
→ Login DTO
→ AuthService
→ HTTP Response

Không viết logic kiểm tra mật khẩu trực tiếp trong Controller.

login.dto.js

Chịu trách nhiệm validation dữ liệu Login.

Dữ liệu:

email
password

auth.service.js

Chịu trách nhiệm business logic:

login()
validateUser()
generateAccessToken()

Không nên để Prisma query rải rác trong AuthService nếu đã có UsersRepository.

users.repository.js

Chịu trách nhiệm truy vấn Database.

Ví dụ:

findByEmail()
findById()

jwt.strategy.js

Chịu trách nhiệm:

Đọc Bearer Token.

Verify JWT.

Lấy payload.

Gắn user vào request.

jwt-auth.guard.js

Dùng để bảo vệ API yêu cầu đăng nhập.

Ví dụ:

GET /api/customers/me
GET /api/workers/me
GET /api/orders

roles.guard.js

Kiểm tra quyền dựa trên role:

CUSTOMER
WORKER
ADMIN

11. JWT Payload

JWT không nên chứa quá nhiều dữ liệu.

Đề xuất:

{
  "sub": "user-uuid",
  "role": "CUSTOMER"
}

Trong đó:

sub: User ID.

role: Role hiện tại.

Không đưa:

password.

địa chỉ.

số dư ví.

thông tin hồ sơ đầy đủ.

dữ liệu cá nhân không cần thiết.

12. Environment Variables

Dự kiến sử dụng:

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=15m

Nếu triển khai Refresh Token:

JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

Không hard-code JWT secret trong source code.

13. Password

Password phải được hash khi Register bằng:

bcrypt

Login sử dụng:

bcrypt.compare()

Không:

Lưu password dạng plain text.

Log password.

Trả passwordHash về Client.

14. Quy tắc Role

CUSTOMER

Sau Login, Customer được phép sử dụng các API thuộc phạm vi Customer như:

Profile.

Address.

Service.

Order của chính mình.

Tracking Worker của Order được phép theo dõi.

Payment.

Review.

Order History.

Customer không được truy cập API dành riêng cho Worker hoặc Admin.

WORKER

Sau Login, Worker được phép:

Quản lý Worker Profile.

Đăng ký Skill/Service.

Gửi hồ sơ xét duyệt.

Xem trạng thái xét duyệt.

Worker chỉ được thực hiện nghiệp vụ nhận việc khi:

User.status = ACTIVE
AND
Worker.approvalStatus = APPROVED

Khi đủ điều kiện, Worker có thể:

Bật availability.

Cập nhật GPS.

Nhận/từ chối Order.

Thực hiện Face Verification.

Upload Before/After.

Bắt đầu và hoàn thành công việc.

Xem Wallet/Earnings.

ADMIN

Sau Login, Admin được truy cập các API quản trị khi JWT có:

role = ADMIN

Ví dụ:

/api/admin/customers
/api/admin/workers
/api/admin/services
/api/admin/orders
/api/admin/payments
/api/admin/configurations

Admin vẫn phải tuân theo business rule của hệ thống, đặc biệt đối với Order, Payment, Commission và Wallet.

15. Quy tắc trạng thái tài khoản

Ví dụ UserStatus:

ACTIVE
BLOCKED

Login:

ACTIVE  → cho phép
BLOCKED → từ chối

Worker approval status không phải User status.

Ví dụ:

User.status = ACTIVE
Worker.approvalStatus = PENDING

Worker vẫn có thể Login nhưng chưa được nhận Order.

16. Security Basic

Login cần tối thiểu:

Hash password bằng bcrypt.

JWT secret lấy từ environment.

Không trả passwordHash.

Generic error cho sai thông tin đăng nhập.

Validate input.

Kiểm tra account status.

Có thể bổ sung rate limit sau.

Không log password/token.

HTTPS khi deploy production.

17. Test Case

TC-AUTH-001 — Login thành công Customer

Given

Customer tồn tại.

Account ACTIVE.

Password đúng.

When

POST /api/auth/login

Then

HTTP 200.

Có accessToken.

Role = CUSTOMER.

Không chứa passwordHash.

TC-AUTH-002 — Login thành công Worker

Expected:

HTTP 200.

Role = WORKER.

Worker chưa approved vẫn Login được.

TC-AUTH-003 — Login Admin

Expected:

HTTP 200.

Role = ADMIN.

TC-AUTH-004 — Sai password

Expected:

401 Unauthorized

TC-AUTH-005 — Email không tồn tại

Expected:

401 Unauthorized

Message nên giống trường hợp sai password.

TC-AUTH-006 — Account bị BLOCKED

Expected:

403 Forbidden

TC-AUTH-007 — Email sai định dạng

Expected:

400 Bad Request

TC-AUTH-008 — Password trống

Expected:

400 Bad Request

TC-AUTH-009 — Token hợp lệ truy cập Protected API

Expected:

200 OK

TC-AUTH-010 — Không có Token truy cập Protected API

Expected:

401 Unauthorized

TC-AUTH-011 — Customer truy cập Admin API

Expected:

403 Forbidden

TC-AUTH-012 — Token hết hạn

Expected:

401 Unauthorized

18. Acceptance Criteria

Chức năng Login được xem là hoàn thành khi:

POST /api/auth/login hoạt động.

Customer đăng nhập được.

Worker đăng nhập được.

Admin đăng nhập được.

Password được verify bằng bcrypt.

Sai credential trả 401.

Account BLOCKED không đăng nhập được.

JWT Access Token được tạo đúng.

JWT Strategy hoạt động.

Protected API yêu cầu token.

Role Guard hoạt động.

Không trả passwordHash.

Không log password/token.

Test API bằng Postman thành công.

Test case Login cơ bản PASS.

19. Chưa làm trong bước Login cơ bản

Không triển khai chung vào task Login nếu chưa được yêu cầu:

Forgot Password.

Reset Password.

OTP.

Social Login.

Google Login.

Facebook Login.

Two-Factor Authentication.

Device Management.

Session Management phức tạp.

Rate Limit nâng cao.

Các chức năng này có thể bổ sung sau.

20. Luồng tổng quát

Customer / Worker / Admin
          ↓
       Login API
          ↓
       Auth Module
          ↓
       User Module
          ↓
      PostgreSQL
          ↓
       bcrypt
          ↓
         JWT
          ↓
Authenticated Request
          ↓
  JWT Guard + Roles Guard
          ↓
 Business Modules

21. Definition of Done

Task Login chỉ được đánh dấu DONE khi:

Application boot           PASS
Database connection        PASS
POST /api/auth/login       PASS
Correct password           PASS
Wrong password             PASS
Blocked account            PASS
JWT generation             PASS
JWT authentication         PASS
Role authorization         PASS
Postman test               PASS

Không mở rộng sang chức năng khác trước khi Login đạt các điều kiện trên.