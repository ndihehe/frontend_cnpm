# Cổng Thông Tin Đào Tạo & Quản Lý Học Vụ (Portal Frontend)

Hệ thống giao diện cổng thông tin học vụ dành cho các phân hệ: Sinh viên, Giảng viên, Giáo vụ khoa và Trưởng phòng đào tạo. Giao diện được tối ưu hóa theo phong cách thiết kế hiện đại, tinh gọn, tương thích hoàn toàn với Live Backend API và cơ sở dữ liệu PostgreSQL / Neon DB.

---

## 1. Cấu Trúc Thư Mục Chuẩn Hóa

```text
portal-frontend/
├── assets/                  # Tài nguyên tĩnh (hình ảnh, avatar)
│   └── images/
│       └── avatars/
├── css/                     # Hệ thống định kiểu Design System
│   ├── components.css       # Các component dùng chung (HocVu Table, Modal, Card, Button, Badge)
│   ├── layout.css           # Cấu trúc bố cục (Sidebar, Topbar, Content Body, Responsive)
│   └── variables.css        # Bảng biến CSS Tokens (Màu sắc, Typography, Spacing, Border)
├── docs/                    # Tài liệu kỹ thuật, đề cương & báo cáo
│   ├── bug-reports/         # Hình ảnh và ghi nhận phản hồi giao diện
│   ├── dev-notes/           # Nhật ký cập nhật và sửa lỗi hệ thống
│   └── specifications/      # Tài liệu đặc tả và file mẫu
├── js/                      # Tầng xử lý logic & kết nối API
│   ├── api.js               # ApiClient tập trung kết nối Live Backend API
│   ├── config.js            # Cấu hình môi trường & endpoint API
│   └── user-menu.js         # Quản lý phiên làm việc, menu tài khoản & đồng bộ UI
├── pages/                   # Phân hệ giao diện theo vai trò (Role-based)
│   ├── assistant/           # Phân hệ Giáo vụ khoa
│   │   ├── class-management.html      # Quản trị lớp học phần (CRUD)
│   │   ├── class-requests.html        # Xử lý kiến nghị mở lớp
│   │   ├── class-students.html        # Danh sách sinh viên theo lớp
│   │   ├── dashboard.html             # Tổng quan giáo vụ
│   │   ├── open-registration.html     # Cấu hình đợt đăng ký học phần
│   │   └── profile.html               # Thông tin cán bộ giáo vụ
│   ├── auth/                # Phân hệ Xác thực
│   │   └── login.html                 # Đăng nhập đa vai trò
│   ├── headoffice/          # Phân hệ Trưởng phòng đào tạo
│   │   ├── course-catalog.html        # Khung chương trình đào tạo
│   │   ├── dashboard.html             # Bảng tin tổng quan
│   │   ├── grade-summary.html         # Tổng hợp bảng điểm toàn trường
│   │   ├── lecturers-directory.html   # Danh bạ giảng viên
│   │   ├── profile.html               # Hồ sơ trưởng phòng
│   │   ├── semester-management.html   # Quản trị học kỳ
│   │   └── students-directory.html    # Danh bạ sinh viên
│   ├── lecturer/            # Phân hệ Giảng viên
│   │   ├── grade-entry.html           # Nhập & quản lý điểm LHP
│   │   ├── profile.html               # Lý lịch khoa học & hồ sơ
│   │   └── schedule.html              # Lịch giảng dạy tuần
│   └── student/             # Phân hệ Sinh viên
│       ├── course-registration.html   # Đăng ký học phần
│       ├── dashboard.html             # Bảng tin sinh viên
│       ├── my-classes.html            # Lớp học phần đã ghi danh
│       ├── profile.html               # Thông tin sinh viên & tiến độ tích lũy
│       ├── student-schedule.html      # Thời khóa biểu tuần
│       └── transcript.html            # Xem bảng điểm học phần
├── .gitignore               # Cấu hình loại trừ file rác / file tạm
├── index.html               # Trang điều hướng gốc (chuyển tiếp tới trang đăng nhập)
├── package.json             # Cấu hình gói dự án
├── README.md                # Tài liệu hướng dẫn dự án
└── server.js                # Máy chủ HTTP phục vụ Frontend cục bộ (Node.js)
```

---

## 2. Tài Khoản Thử Nghiệm

Hệ thống kết nối trực tiếp với Backend Tomcat / Neon DB với các tài khoản kiểm thử mặc định:

| Vai trò | Email đăng nhập | Mật khẩu | Trang mặc định |
| :--- | :--- | :--- | :--- |
| **Sinh viên** | `an.nguyen@example.com` | `123456` | `pages/student/student-schedule.html` |
| **Giảng viên** | `binh.tran@example.com` | `123456` | `pages/lecturer/schedule.html` |
| **Giáo vụ khoa** | `cuong.le@example.com` | `123456` | `pages/assistant/class-management.html` |
| **Trưởng phòng ĐT** | `dung.pham@example.com` | `123456` | `pages/headoffice/course-catalog.html` |

---

## 3. Hướng Dẫn Khởi Chạy

### Yêu cầu môi trường
* Node.js v18+ trở lên.
* Backend API hoạt động tại `http://localhost:8080/api` (hoặc cấu hình lại trong [js/config.js](js/config.js)).

### Khởi động Frontend
Chạy lệnh khởi động máy chủ phục vụ tĩnh:
```bash
node server.js
```
Mặc định dịch vụ sẽ lắng nghe tại: **`http://localhost:3000/`**

---

## 4. Đặc Điểm Kỹ Thuật

1. **Thuần JavaScript & CSS hiện đại:** Không phụ thuộc thư viện nặng, thời gian tải trang nhanh, chuẩn BEM.
2. **Khung bảng chuẩn mực (HocVu Table):** Đầy đủ viền khung 4 cạnh (`border: 1px solid`), tương phản cao, định dạng rõ ràng các ô số liệu và thao tác.
3. **Đồng bộ học kỳ động (Live Semesters):** 100% dropdown học kỳ kết nối qua `CommonApi.getAllSemesters()`, không sử dụng option hardcode, hỗ trợ đầy đủ các kỳ từ 2024 đến 2027.
4. **Bảo mật phiên (Session Security):** Quản lý Bearer Token qua `localStorage`, tự động xử lý hết hạn phiên (HTTP 401) và điều hướng đăng nhập an toàn.
