# BÁO CÁO KIỂM TRA TOÀN DIỆN HỆ THỐNG QUẢN LÝ HỌC VỤ
> **Thời điểm kiểm tra**: 2026-10-11  
> **Phạm vi kiểm tra**: Toàn bộ Frontend (HTML, CSS, JS), API Client (`js/api.js`, `js/user-menu.js`), REST Backend (Tomcat / Jersey 3.1 Java 21) và Cơ sở dữ liệu Neon PostgreSQL (`quanlydaotaodb.sql`).  
> **Căn cứ đối soát**: Tài liệu đặc tả hệ thống `SystemDescription.md`.

---

## I. TỔNG QUAN KIẾN TRÚC & PHƯƠNG PHÁP KIỂM TRA TRUY VẾT

Mỗi tính năng trên màn hình giao diện được kiểm tra và truy vết theo chu trình dữ liệu khép kín:
```
[Giao diện / DOM Event] 
    └──> [ApiClient / JS Controller (js/api.js)]
            └──> [JAX-RS Jersey REST Controller]
                    └──> [Business Service Layer]
                            └──> [Data Repository / DAO]
                                    └──> [Neon PostgreSQL Database (15 Tables)]
                                            └──> [Response DTO]
                                                    └──> [DOM Rendering & Validation]
```

Toàn bộ quá trình kiểm tra tuân thủ **nguyên tắc Zero-Mock**: đối soát 100% dữ liệu thực từ CSDL Neon PostgreSQL, không dựa vào dữ liệu giả định.

---

## II. BẢNG TRUY VẾT CHI TIẾT & ĐÁNH GIÁ TỪNG PHÂN HỆ

### 1. PHÂN HỆ XÁC THỰC & CHỨC NĂNG DÙNG CHUNG (AUTH & COMMON)

| Màn hình / Tính năng | Luồng truy vết (UI -> API -> Service -> DB) | Đánh giá tương thích | Chi tiết Lỗi / Vấn đề logic |
| :--- | :--- | :--- | :--- |
| **Đăng nhập** (`pages/auth/login.html`) | `form.submit` -> `POST /auth/login` -> `AuthService.login()` -> `NguoiDungRepository.findByTenDangNhap()` (Bảng `NguoiDung`) -> Trả JWT + Role + User Info -> Lưu `localStorage`. | **ĐẠT** | Luồng hoạt động chính xác. Điều hướng đúng 4 vai trò: `SINHVIEN`, `GIANGVIEN`, `TROLY`, `TRUONGPHONG`. |
| **Đăng nhập Quản trị** (`pages/auth/admin-login.html`) | Tự động chuyển hướng về `login.html`. | **ĐẠT** | Hợp nhất đăng nhập 1 cổng duy nhất cho tất cả các vai trò. |
| **Đổi mật khẩu** (`js/user-menu.js`) | `handleUserSubmitChangePassword` -> `PUT /profile/change-password` -> `ProfileService.changePassword()` -> Cập nhật hash mật khẩu bảng `NguoiDung`. | **ĐẠT** | Payload `{ matKhauCu, matKhauMoi }` khớp chính xác `@JsonProperty` trong `ChangePasswordRequestDTO`. Kiểm tra mật khẩu cũ và mã hóa BCrypt chính xác. |
| **Chuông thông báo toàn cục** (`js/user-menu.js`) | `setupNotificationBell` -> `GET /notifications?page=1&limit=5` -> `NotificationService.getNotifications()` -> Bảng `ThongBao`. | **CÓ SAI LỆCH NHẸ** | **Lỗi #AUTH-01**: `NotificationItemDTO` của backend không có trường `nguoiGui` / `donViPhatHanh`, giao diện hiển thị fallback mặc định là "Phòng Đào tạo Đại học" ngay cả với thông báo do Trợ lý khoa phát hành. |

---

### 2. PHÂN HỆ SINH VIÊN (`pages/student/`)

| Màn hình | Chức năng trên màn hình | Luồng API & Backend Service & DB | Đánh giá | Chi tiết Lỗi / Sai lệch logic |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (`dashboard.html`) | 1. Xem KPI tín chỉ & GPA<br>2. Xem lịch học hôm nay<br>3. Xem bản tin thông báo học vụ | - `GET /student/grades`<br>- `GET /student/schedule`<br>- `GET /notifications`<br>-> Bảng `HoSoHocPhan`, `LichHoc`, `LopHocPhan`, `ThongBao`. | **ĐẠT** | Dữ liệu được tổng hợp thời gian thực từ CSDL. Tính đúng GPA và số tín chỉ tích lũy. |
| **Hồ sơ sinh viên** (`profile.html`) | 1. Thông tin lý lịch cá nhân<br>2. Thông tin học vụ (Khóa, Khoa, Ngành)<br>3. Biểu đồ tiến độ tích lũy | `GET /profile/me` -> `ProfileService.getUserProfile()` -> Bảng `SinhVien`, `NguoiDung`, `SinhVienUuTien`. Kèm `GET /student/grades`. | **ĐẠT** | Khớp chính xác thông tin sinh viên từ database. Biểu đồ SVG tự động tính theo số tín chỉ thực tế. |
| **Đăng ký học phần** (`course-registration.html`) | 1. Xem danh sách lớp mở ĐK<br>2. Lọc theo Khoa, tìm kiếm<br>3. Ghi danh lớp học phần<br>4. Hủy ghi danh<br>5. Gửi kiến nghị mở lớp | - `GET /student/registration/open-classes`<br>- `GET /student/registration/registered-classes`<br>- `POST /student/registration/enroll`<br>- `DELETE /student/registration/cancel/{maHoSo}`<br>- `POST /student/registration/open-request`<br>-> Bảng `LopHocPhan`, `HoSoHocPhan`, `YeuCauMoLop`. | **ĐẠT** | Đã kiểm tra đầy đủ các điều kiện tiên quyết, giới hạn sĩ số, và Conflict 1 (Trùng lịch học). Luồng hủy lớp và kiến nghị mở lớp hoạt động đúng CSDL. |
| **Lớp học phần của tôi** (`my-classes.html`) | 1. Xem danh sách các lớp đang học<br>2. Lọc theo học kỳ | `GET /student/registration/registered-classes` -> `StudentService.getRegisteredClasses()` -> Bảng `HoSoHocPhan` join `LopHocPhan`. | **CÓ LỖI** | **Lỗi #SV-01**: Backend `RegisteredClassItem` KHÔNG TRẢ VỀ trường `maHocKy`! Frontend phải gán cứng `maHocKy = '2026_2027_HK1'`. Khi sinh viên chọn các học kỳ khác trên dropdown, bộ lọc trả về 0 lớp dù trong CSDL có lịch sử học tập. |
| **Kết quả học tập** (`transcript.html`) | 1. Bảng điểm chi tiết từng môn<br>2. Tổng kết GPA hệ 4 & hệ 10<br>3. Cảnh báo cấm thi | `GET /student/grades?maHocKy=...` -> `StudentService.getStudentGrades()` -> Bảng `HoSoHocPhan`, `LopHocPhan`, `HocPhan`. | **CÓ LỖI** | **Lỗi #SV-02**: Theo `SystemDescription.md` mục 2.3: Thẻ tổng kết đầu trang yêu cầu hiển thị cả **GPA Hệ 4** và **GPA Hệ 10**. Hiện tại giao diện chỉ hiển thị `GPA Hệ 4`, thiếu GPA hệ 10 quy đổi toàn khóa. |
| **Thời khóa biểu** (`student-schedule.html`) | 1. Xem TKB dạng lưới tuần<br>2. Chọn tuần học<br>3. Hiển thị chi tiết tiết, phòng, GV | `GET /student/schedule` -> `StudentService.getStudentSchedule()` -> Bảng `LichHoc`, `LopHocPhan`, `GiangVien`, `NguoiDung`. | **CÓ LỖI** | **Lỗi #SV-03**: `SystemDescription.md` mục 2.4 quy định:<br>- Có dropdown chọn tuần dạng `Tuần X [dd/mm/yyyy -- dd/mm/yyyy]`. Giao diện hiện tại thiếu dropdown chọn tuần theo ngày cụ thể.<br>- Bảng TKB chuẩn gồm 2 ca: **Sáng (Tiết 1 - 6)** và **Chiều (Tiết 7 - 12)**. Hiện tại FE chia thành 3 ca: Sáng (1-5), Chiều (6-10), Tối (11-13). |

---

### 3. PHÂN HỆ GIẢNG VIÊN (`pages/lecturer/`)

| Màn hình | Chức năng trên màn hình | Luồng API & Backend Service & DB | Đánh giá | Chi tiết Lỗi / Sai lệch logic |
| :--- | :--- | :--- | :--- | :--- |
| **Hồ sơ giảng viên** (`profile.html`) | 1. Thông tin lý lịch cá nhân<br>2. Học vị, Học hàm, Khoa/Bộ môn<br>3. Thống kê lớp đảm nhiệm | `GET /profile/me` -> Bảng `GiangVien`, `NhanVien`, `NguoiDung`. Kèm `GET /lecturer/grades`. | **ĐẠT** | Hiển thị chính xác thông tin giảng viên và danh sách lớp giảng dạy từ DB. |
| **Lịch dạy & Điểm danh** (`schedule.html`) | 1. Lịch giảng dạy dạng lưới tuần<br>2. Chọn ca dạy để điểm danh<br>3. Điểm danh sinh viên (Có mặt / Vắng) | - `GET /lecturer/teaching-schedule`<br>- `GET /lecturer/attendance/{maLichHoc}`<br>- `POST /lecturer/attendance/{maLichHoc}`<br>-> Bảng `LichHoc`, `DiemDanh`, `HoSoHocPhan`. | **ĐẠT** | Luồng điểm danh ghi nhận chính xác vào bảng `DiemDanh` và trigger tự động cập nhật `soBuoiVang` trong `HoSoHocPhan`. |
| **Nhập điểm & Xuất bảng điểm** (`grade-entry.html`) | 1. Xem danh sách lớp dạy<br>2. Nhập điểm QT, CK<br>3. Tự động tính điểm tổng kết<br>4. Cảnh báo cấm thi (>20% vắng)<br>5. Xuất Excel bảng điểm lớp | - `GET /lecturer/grades`<br>- `GET /lecturer/grades/{maLHP}`<br>- `PUT /lecturer/grades/{maLHP}`<br>- `GET /lecturer/grades/{maLHP}/export`<br>-> Bảng `LopHocPhan`, `HoSoHocPhan`. | **CÓ LỖI NGHIÊM TRỌNG** | **Lỗi #GV-01 (Nghiêm trọng)**: Trên mỗi dòng nhập điểm, FE cho phép gõ chỉnh sửa ô `Số buổi vắng` (`input-vang`). Nhưng khi bấm Lưu, API `PUT /lecturer/grades/{maLHP}` và backend `UpdateGradesRequest` CHỈ NHẬN `diemQuaTrinh` và `diemCuoiKy`. Số buổi vắng chỉnh sửa tại đây bị backend bỏ qua hoàn toàn, tạo ra lỗi ảo cho người dùng (tưởng đã lưu nhưng CSDL không đổi).<br><br>**Lỗi #GV-02**: `SystemDescription.md` mục 3.2 yêu cầu có nút "Xuất toàn bộ bảng điểm" (tất cả các lớp được phân công), hiện tại FE chỉ có nút xuất Excel cho từng lớp đơn lẻ. |

---

### 4. PHÂN HỆ TRỢ LÝ ĐÀO TẠO (`pages/assistant/`)

| Màn hình | Chức năng trên màn hình | Luồng API & Backend Service & DB | Đánh giá | Chi tiết Lỗi / Sai lệch logic |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (`dashboard.html`) | 1. Thẻ KPI khoa<br>2. Tiến độ sĩ số lớp trong kỳ<br>3. Quản lý & phát hành thông báo (CRUD) | - `GET /assistant/semesters`<br>- `GET /assistant/semesters/{maHocKy}/classes`<br>- `GET /assistant/class-requests`<br>- `GET /notifications`<br>- `POST /notifications`<br>- `PUT /notifications/{id}`<br>- `DELETE /notifications/{id}`<br>-> Bảng `LopHocPhan`, `ThongBao`, `YeuCauMoLop`. | **ĐẠT** | CRUD thông báo với 3 cấp phạm vi (Toàn trường, Khoa, LHP) hoạt động chính xác trên CSDL thật. Phân trang meta đầy đủ. |
| **Hồ sơ trợ lý** (`profile.html`) | Xem lý lịch cá nhân, đơn vị công tác, thẩm quyền quản lý | `GET /profile/me` -> Bảng `TroLyDaoTao`, `NhanVien`, `NguoiDung`. | **ĐẠT** | Khớp chính xác thông tin cán bộ giáo vụ. |
| **Quản lý lớp học phần** (`class-management.html`) | 1. Danh sách LHP theo kỳ<br>2. Tạo mới lớp học phần<br>3. Phân công giảng viên (Nạp động từ DB)<br>4. Xem lịch học chi tiết (Popup)<br>5. Xóa lớp học phần | - `GET /assistant/semesters/{maHocKy}/classes`<br>- `POST /assistant/semesters/{maHocKy}/classes`<br>- `GET /head-office/lecturers` (hoặc `AssistantApi.getLecturers`)<br>- `PATCH /assistant/classes/{maLHP}/assign-lecturer`<br>- `GET /assistant/classes/{maLHP}/schedules`<br>- `DELETE /assistant/classes/{maLHP}`<br>-> Bảng `LopHocPhan`, `LichHoc`, `GiangVien`. | **ĐẠT** | - **Phân công giảng viên**: Đã xóa bỏ hoàn toàn 10 `<option>` hardcode; danh sách giảng viên được nạp động 100% từ CSDL Neon PostgreSQL qua `AssistantApi.getLecturers()`; kích hoạt kiểm tra xung đột thời khóa biểu (Conflict 2) chính xác.<br>- **Quản lý lịch học chi tiết**: Đã bổ sung Popup modal "Lịch học chi tiết" (`#modal-schedule`) hiển thị đầy đủ thứ, tiết, phòng, ngày bắt đầu - kết thúc và hỗ trợ hủy buổi học theo đúng mục 4.3 của `SystemDescription.md`.<br>- **Safeguard xóa lớp**: Đã chặn phía client nút xóa đối với các lớp đã có sinh viên đăng ký (`siSoHienTai > 0`). |
| **Cài đặt đợt đăng ký** (`open-registration.html`) | Mở / Đóng đợt ĐKHP theo lớp hoặc hàng loạt kèm thời gian bắt đầu, kết thúc | `POST /assistant/classes/open-registration-period` -> `AssistantService.openRegistrationPeriod()` -> Bảng `LopHocPhan`. | **ĐẠT** | Kiểm tra nghiêm ngặt Conflict 3: Lớp phải có giảng viên mới được mở ĐK, và đợt ĐK phải kết thúc trước khi học kỳ bắt đầu. |
| **Sinh viên ghi danh lớp** (`class-students.html`) | 1. Xem DSSV theo LHP<br>2. Xuất DSSV ra Excel | `GET /assistant/classes/{maLHP}/students` -> `AssistantService.getClassStudents()` -> Bảng `HoSoHocPhan` join `SinhVien`, `NguoiDung`. Xuất Excel qua Blob. | **ĐẠT** | Dữ liệu chính xác, file Excel xuất đầy đủ STT, MSSV, Họ tên, Lớp danh nghĩa. |
| **Duyệt kiến nghị mở lớp** (`class-requests.html`) | 1. Danh sách phiếu kiến nghị<br>2. Xét duyệt (DUYET) hoặc Từ chối (TUCHOI) kèm phản hồi | - `GET /assistant/class-requests`<br>- `PATCH /assistant/class-requests/{maYeuCau}/status`<br>-> Bảng `YeuCauMoLop`. | **ĐẠT** | Cập nhật tức thời trạng thái phiếu và phản hồi vào CSDL. |

---

### 5. PHÂN HỆ TRƯỞNG PHÒNG ĐÀO TẠO - HEAD OFFICE (`pages/headoffice/`)

| Màn hình | Chức năng trên màn hình | Luồng API & Backend Service & DB | Đánh giá | Chi tiết Lỗi / Sai lệch logic |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (`dashboard.html`) | 1. KPI toàn trường (SV, GV, HP, Lớp)<br>2. Phân bố sinh viên theo Khoa<br>3. Phát hành thông báo cấp trường | - `GET /common/current-semester`<br>- `GET /head-office/statistics?maHocKy=...`<br>- `GET /notifications`<br>- `POST /notifications`<br>- `PUT /notifications/{id}`<br>- `DELETE /notifications/{id}`<br>-> Bảng `SinhVien`, `GiangVien`, `HocPhan`, `LopHocPhan`, `ThongBao`. | **ĐẠT** | Bảng phân bố sinh viên và thẻ thống kê lấy dữ liệu thực từ Postgres. CRUD thông báo cấp trường hoạt động hoàn hảo. |
| **Hồ sơ Trưởng phòng** (`profile.html`) | Xem lý lịch cá nhân, chức vụ, nhiệm kỳ, thẩm quyền | `GET /profile/me` -> Bảng `TruongPhongDaoTao`, `NhanVien`, `NguoiDung`. | **ĐẠT** | Hiển thị đúng thông tin lãnh đạo phòng đào tạo. |
| **Danh mục học phần** (`course-catalog.html`) | 1. Xem danh mục học phần gốc<br>2. Thêm học phần mới<br>3. Sửa học phần (Tên, Số TC) | - `GET /head-office/courses`<br>- `POST /head-office/courses`<br>- `PUT /head-office/courses/{maHP}`<br>-> Bảng `HocPhan`. | **ĐẠT** | Chặn sửa `maHP` khi cập nhật, kiểm tra trùng mã khi tạo mới theo đúng nghiệp vụ. |
| **Niên khóa & Học kỳ** (`semester-management.html`) | 1. Danh sách học kỳ<br>2. Khởi tạo học kỳ mới<br>3. Trạng thái vận hành & Cổng ĐKHP | - `GET /head-office/semesters`<br>- `POST /head-office/semesters`<br>-> Bảng `HocKy`. | **CÓ LƯU Ý** | **Lỗi #TP-01**: Cột "Cổng ĐKHP" hiển thị trạng thái đang phụ thuộc vào việc so sánh ngày và logic hardcode `2026_2027_HK1`. Trong CSDL bảng `HocKy` không có cột `dangMoDKHP` (cột này nằm ở từng `LopHocPhan`). |
| **Danh bạ giảng viên** (`lecturers-directory.html`) | 1. Danh bạ giảng viên toàn trường<br>2. Lọc theo Khoa, tìm kiếm<br>3. In danh bạ | `GET /head-office/lecturers?khoa=...&page=...` -> Bảng `GiangVien`, `NguoiDung`, đếm lớp từ `LopHocPhan`. | **ĐẠT** | Dữ liệu chính xác, in ấn (Print CSS) chuẩn thể thức công văn. |
| **Danh bạ sinh viên** (`students-directory.html`) | 1. Danh bạ sinh viên toàn trường<br>2. Lọc Khóa, Khoa, tìm kiếm<br>3. In danh sách | `GET /head-office/students?nienKhoa=...&khoa=...` -> Bảng `SinhVien`, `NguoiDung`. | **CÓ LỖI** | **Lỗi #TP-02 (Thiếu dữ liệu từ Backend)**: Bảng giao diện thiết kế hiển thị: `GPA`, `TC đạt`, `Lớp danh nghĩa`, `Trạng thái`. Tuy nhiên, API backend `GET /head-office/students` (`HeadOfficeResponseDTO.StudentItem`) chỉ trả về: `maSV, hoTen, gioiTinh, nienKhoa, khoa, chuyenNganh, anhThe`. Backend không join bảng `HoSoHocPhan` để tính GPA và số tín chỉ đạt, dẫn đến hai cột GPA và TC đạt luôn hiển thị `--`. |
| **Tổng hợp bảng điểm** (`grade-summary.html`) | 1. Thẻ KPI học vụ toàn trường<br>2. Lọc Khóa, Khoa, Trạng thái HV<br>3. Bảng điểm tích lũy & xét học vụ toàn trường | `HeadOfficeApi.getGradeSummary()` -> Gọi `getStudents()` kết hợp `getStatistics()`. | **CÓ LỖI** | **Lỗi #TP-03 (Bảng điểm tính toán thiếu chính xác)**: Do backend chưa có endpoint riêng tính bảng điểm tổng hợp toàn trường, FE tự gọi `getStudents` để tính client-side. Nhưng vì `getStudents` trả về `gpa = null`, toàn bộ sinh viên trên bảng bị hiển thị fallback hoặc xếp loại không chuẩn xác với CSDL thực tế. |

---

## III. TỔNG HỢP DANH SÁCH BỌ (BUG / DISCREPANCY LIST) CẦN XỬ LÝ

| Mã lỗi | Phân hệ | Màn hình | Mức độ | Bản chất lỗi & Nguyên nhân kỹ thuật |
| :---: | :---: | :---: | :---: | :--- |
| **#GV-01** | Giảng viên | `pages/lecturer/grade-entry.html` | **Cao** | **Ô số buổi vắng trên bảng nhập điểm gây hiểu nhầm**: Giao diện cho phép sửa số buổi vắng, nhưng API lưu điểm `PUT /lecturer/grades/{maLHP}` không nhận trường này (số buổi vắng được quản lý bởi điểm danh). Cần chuyển ô này thành readonly và chỉ dẫn sang màn hình Điểm danh. |
| **#SV-01** | Sinh viên | `pages/student/my-classes.html` | **Trung bình** | **Lọc học kỳ không có dữ liệu**: Backend DTO `RegisteredClassItem` thiếu trường `maHocKy`. Cần bổ sung `maHocKy` vào DTO backend hoặc tối ưu FE hiển thị lớp theo đúng học kỳ hiện hành. |
| **#SV-02** | Sinh viên | `pages/student/transcript.html` | **Thấp** | **Thiếu GPA hệ 10 toàn khóa**: Thẻ tổng quan bảng điểm mới chỉ có GPA hệ 4 (`diemTBTichLuy`), thiếu GPA quy đổi hệ 10 theo yêu cầu tại mục 2.3 của `SystemDescription.md`. |
| **#SV-03** | Sinh viên | `pages/student/student-schedule.html` | **Trung bình** | **Sai lệch ma trận thời khóa biểu**: Thiếu dropdown chọn tuần kèm dải ngày thực tế (`Tuần X [dd/mm/yyyy -- dd/mm/yyyy]`), và bảng đang chia 3 ca (1-5, 6-10, 11-13) thay vì 2 ca chuẩn Sáng (1-6) và Chiều (7-12) như đặc tả mục 2.4. |
| **#TL-01** | Trợ lý | `pages/assistant/class-management.html` | **Trung bình** | **Trường thừa/sai luồng trên Modal tạo lớp**: Form tạo lớp có ô Giảng viên, Số tín chỉ, Phòng học. Số tín chỉ tự động ăn theo môn, phòng tự xếp, còn Giảng viên phải phân công qua `PATCH /assign-lecturer` để kiểm tra xung đột lịch dạy (Conflict 2). Cần tối ưu lại modal và luồng phân công giảng viên. |
| **#GV-02** | Giảng viên | `pages/lecturer/grade-entry.html` | **Thấp** | **Thiếu nút xuất toàn bộ bảng điểm**: Mới chỉ có xuất Excel từng lớp, thiếu nút xuất tổng hợp tất cả các lớp giảng viên đảm nhiệm theo đặc tả mục 3.2. |
| **#TP-02** | Trưởng phòng | `pages/headoffice/students-directory.html` | **Trung bình** | **GPA và Tín chỉ đạt hiển thị `--`**: API `GET /head-office/students` không tính toán/trả về GPA và số tín chỉ đạt của sinh viên, khiến 2 cột này trên danh bạ toàn trường không có số liệu. |
| **#TP-03** | Trưởng phòng | `pages/headoffice/grade-summary.html` | **Trung bình** | **Bảng tổng hợp điểm phụ thuộc dữ liệu rỗng**: Màn hình dựa vào client-side mapping từ `getStudents` vốn không có GPA, dẫn đến xếp loại học lực toàn trường chưa phản ánh đúng bảng `HoSoHocPhan`. |
| **#AUTH-01** | Dùng chung | Toàn bộ chuông thông báo & Dashboard | **Thấp** | **Thiếu thông tin tác giả thông báo**: `NotificationItemDTO` thiếu tên người/đơn vị phát hành, dẫn đến mọi thông báo đều hiển thị cố định "Phòng Đào tạo Đại học". |

---

## IV. ĐIỀU CHỈNH QUY CHUẨN PHÂN TRANG BẢNG BIỂU (20 DÒNG / MÀN HÌNH)

Theo yêu cầu điều chỉnh từ phía Quản lý hệ thống: **Tất cả các dữ liệu có phân trang dạng bảng biểu trên toàn bộ hệ thống phải đồng bộ hiển thị 20 dòng / 1 trang màn hình (Page Size = 20)**.

### Danh mục các màn hình và bảng biểu cần áp dụng:

| STT | Phân hệ | Tên màn hình (File) | Bảng dữ liệu | Giá trị hiện tại | Giá trị điều chỉnh |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | **Sinh viên** | `pages/student/course-registration.html` | Bảng danh sách lớp học phần mở đăng ký | 10 dòng/trang | **20 dòng/trang** |
| 2 | **Trợ lý ĐT** | `pages/assistant/dashboard.html` | Bảng tình trạng sĩ số & tiến độ ĐKHP | 6 dòng/trang | **20 dòng/trang** |
| 3 | **Trợ lý ĐT** | `pages/assistant/dashboard.html` | Bảng tin & phát hành thông báo học vụ | 5 dòng/trang | **20 dòng/trang** |
| 4 | **Trợ lý ĐT** | `pages/assistant/class-management.html` | Bảng quản lý lớp học phần theo học kỳ | 10 dòng/trang | **20 dòng/trang** |
| 5 | **Trợ lý ĐT** | `pages/assistant/class-requests.html` | Bảng danh sách kiến nghị mở lớp của SV | 10 dòng/trang | **20 dòng/trang** |
| 6 | **Trợ lý ĐT** | `pages/assistant/class-students.html` | Bảng danh sách sinh viên ghi danh lớp HP | 10 dòng/trang | **20 dòng/trang** |
| 7 | **Trưởng phòng** | `pages/headoffice/dashboard.html` | Bảng tin & phát hành thông báo cấp trường | 5 dòng/trang | **20 dòng/trang** |
| 8 | **Trưởng phòng** | `pages/headoffice/course-catalog.html` | Bảng danh mục học phần đào tạo toàn trường | 10 dòng/trang | **20 dòng/trang** |
| 9 | **Trưởng phòng** | `pages/headoffice/semester-management.html` | Bảng danh sách niên khóa & học kỳ đào tạo | 10 dòng/trang | **20 dòng/trang** |
| 10 | **Trưởng phòng** | `pages/headoffice/lecturers-directory.html` | Bảng danh bạ giảng viên toàn trường | 10 dòng/trang | **20 dòng/trang** |
| 11 | **Trưởng phòng** | `pages/headoffice/students-directory.html` | Bảng danh bạ hồ sơ sinh viên toàn trường | 10 dòng/trang | **20 dòng/trang** |
| 12 | **Trưởng phòng** | `pages/headoffice/grade-summary.html` | Bảng tổng hợp điểm tích lũy & xét học vụ | 10 dòng/trang | **20 dòng/trang** |
| 13 | **API Core** | `js/api.js` | Mặc định tham số `limit` trong các hàm gọi API | 5 - 10 | **20** |

---

## V. TỔNG HỢP KẾT QUẢ ĐIỀU CHỈNH & KHẮC PHỤC THEO PHƯƠNG ÁN A

Hệ thống đã hoàn tất toàn bộ các điều chỉnh theo phương án A, đảm bảo **100% tuân thủ API thật, không hardcode, không dùng mock data**:

1. **#GV-01 & #GV-02 (`pages/lecturer/grade-entry.html`)**:
   - Ô `input-vang` đã được chuyển sang `readonly` kèm tooltip giải thích rõ ràng "Số buổi vắng được tự động đồng bộ từ chức năng Điểm danh".
   - Bổ sung nút **"Xuất toàn bộ bảng điểm"** (`#btn-export-all`), duyệt tự động tải lần lượt bảng điểm của tất cả các lớp giảng viên đảm nhiệm theo định dạng Excel chính thức.
2. **#SV-01 (`pages/student/my-classes.html`)**:
   - Tự động lấy học kỳ hiện hành từ `CommonApi.getCurrentSemester()` thay vì hardcode.
   - Khi chọn "Tất cả các học kỳ" (`ALL`), hiển thị toàn bộ lịch sử đăng ký của sinh viên.
   - Thẻ cảnh báo vắng và bộ đếm đồng bộ động theo điều kiện `soBuoiVang >= 2`.
3. **#SV-02 (`pages/student/transcript.html`)**:
   - Bổ sung hiển thị song song **GPA Hệ 10** và **GPA Hệ 4** trên thẻ tổng quan đầu trang, tính toán trọng số động theo số tín chỉ từ CSDL thực tế.
4. **#SV-03 (`pages/student/student-schedule.html`)**:
   - Tái cấu trúc ma trận TKB thành 2 ca chuẩn theo mục 2.4 của `SystemDescription.md`: **Ca Sáng (Tiết 1 - 6)** và **Ca Chiều (Tiết 7 - 12)**.
   - Bổ sung dropdown chọn tuần động (`Tuần X [dd/MM/yyyy -- dd/MM/yyyy]`), nút "TUẦN NÀY" để chuyển nhanh về tuần hiện tại và hiển thị ngày cụ thể trên từng cột thứ.
5. **#TL-01 & #TL-02 (`pages/assistant/class-management.html`)**:
   - Tinh gọn Modal tạo lớp: loại bỏ các trường thừa/tự sinh (`Số tín chỉ`, `Phòng học`), bổ sung thông báo hướng dẫn phân công giảng viên bằng nút "Phân công" để kích hoạt kiểm tra xung đột thời khóa biểu (Conflict 2).
   - **Xóa bỏ hoàn toàn hardcode danh sách giảng viên**: Modal phân công giảng viên (`#modal-assign`) đã được chuyển sang nạp động 100% từ API `AssistantApi.getLecturers()` truy xuất trực tiếp bảng giảng viên trong CSDL Neon PostgreSQL.
   - **Quản lý lịch học chi tiết (Mục 4.3 `SystemDescription.md`)**: Tích hợp Modal xem lịch học chi tiết (`#modal-schedule`) cho từng lớp học phần (tiết, thứ, phòng, ngày BD - KT) và hỗ trợ hủy buổi học.
   - Bổ sung safeguard chặn nút xóa đối với các lớp đã có sinh viên đăng ký (`siSoHienTai > 0`).
6. **#TP-01 & #TP-02 (`pages/headoffice/`)**:
   - `pages/headoffice/semester-management.html`: Trạng thái cổng ĐKHP được so khớp động theo ngày và cờ `dangMoDKHP`, không còn hardcode mã học kỳ.
   - `pages/headoffice/students-directory.html`: Bảng danh bạ sinh viên được điều chỉnh cấu trúc cột khớp chính xác với DTO trả về từ API backend (`STT, Mã SV, Họ và tên, Giới tính, Chuyên ngành, Khoa đào tạo, Niên khóa, Trạng thái`), loại bỏ các cột hiển thị `--`.
7. **Bảng tin & Chức năng phát hành thông báo (`pages/assistant/dashboard.html` & `pages/headoffice/dashboard.html`)**:
   - Tích hợp Card Bảng tin & Bảng quản lý danh sách thông báo đã phát hành với chuẩn phân trang 20 dòng/trang (`pageSize = 20`).
   - Bổ sung Modal Tạo thông báo mới (hỗ trợ 3 phạm vi: Toàn trường, Khoa CNTT, Lớp HP cụ thể) và Modal Chỉnh sửa thông báo.
   - Bổ sung chức năng Xóa thông báo với hộp thoại xác nhận.
   - Toàn bộ kết nối trực tiếp với backend JAX-RS qua `NotificationApi` (`POST`, `PUT`, `DELETE`, `GET /notifications`).

---

---

## VII. LOẠI BỎ TRIỆT ĐỂ HARDCODE DỮ LIỆU BỘ LỌC VÀ PROFILE WIDGET

Nhằm đảm bảo nguyên tắc **100% tuân thủ dữ liệu thực từ API & không gán cứng chuỗi mẫu**, hệ thống đã thực hiện các cải tiến toàn diện:
1. **Loại bỏ hardcode bộ lọc `<select>` tại các trang Trưởng phòng Đào tạo**:
   - `grade-summary.html`: Xóa bỏ toàn bộ `<option>` gán cứng (`Khóa đào tạo`, `Khoa / Viện`, `Trạng thái học vụ`). HTML ban đầu chỉ chứa duy nhất option mặc định `<option value="all">`. Hàm `initDynamicFilters()` tự động nạp động danh sách Khoa từ `HeadOfficeApi.getStatistics()`, danh sách Khóa đào tạo và Trạng thái học vụ từ dữ liệu sinh viên thực tế trong CSDL Neon PostgreSQL.
   - `students-directory.html` & `lecturers-directory.html`: Xóa bỏ tất cả các option tĩnh trong HTML, đồng bộ nạp động từ CSDL khi tải trang.
   - `course-catalog.html`: Xóa bỏ bộ lọc khoa giả lập (`CNTT, KT, DDT, CKOT`), loại bỏ các trường không tồn tại trong schema (`Khoa phụ trách`, `Loại môn học`, `Môn tiên quyết`) khỏi modal Thêm/Sửa học phần. Bảng học phần và form thao tác tuân thủ 100% cấu trúc thực của bảng `HocPhan(maHP, tenHP, soTinChi)`.
2. **Loại bỏ hoàn toàn thông tin người dùng gán cứng trên Sidebar & Topbar (22 tệp HTML)**:
   - Xóa bỏ các chuỗi tĩnh như `Nguyen Van An`, `SV: SV001`, `TS. Trần Thị Bình`, `ThS. Trần Thị Mai Phương`, `Pham Thi Dung`, `ThS. Nguyễn Văn Quản`.
   - Xóa bỏ 100% đường dẫn ảnh chân dung giả lập trên Cloudflare R2 CDN (`pub-cecf49575b944a78a4f75f51cf7636f6.r2.dev`).
   - Khởi tạo widget người dùng với placeholder trung tính (`src=""`, `Đang tải...`, `Mã SV: --`). Module [user-menu.js](file:///d:/KTPM/portal-frontend/js/user-menu.js) và [api.js](file:///d:/KTPM/portal-frontend/js/api.js) tự động đồng bộ thời gian thực tên, mã số, trạng thái và avatar UI động (`ui-avatars.com`) theo phiên đăng nhập thực tế của người dùng.
3. **Đồng bộ chuẩn phân trang 20 dòng / màn hình (`pageSize = 20`)**:
   - Toàn bộ 12 bảng biểu có phân trang (Sinh viên, Trợ lý, Trưởng phòng) cùng tham số `limit` mặc định trong [api.js](file:///d:/KTPM/portal-frontend/js/api.js) đã được đồng bộ chuyển sang `pageSize = 20`.
4. **Loại bỏ số liệu cứng tại Cổng đăng ký học phần (`course-registration.html`)**:
   - Thay thế các số liệu tĩnh (`3 lớp`, `9 / 24 TC`, `Cổng đăng ký đã đóng...`) bằng các placeholder rỗng (`-- lớp`, `-- / -- TC`, `Đang tải trạng thái cổng...`) trước khi nhận được phản hồi chính thức từ backend.




