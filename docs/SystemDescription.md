# **ĐẶC TẢ KIẾN TRÚC & TỔNG QUAN KỸ THUẬT HỆ THỐNG QUẢN LÝ ĐÀO TẠO VÀ ĐĂNG KÝ HỌC PHẦN** 

_(HỆ QUẢN TRỊ TRƯỜNG ĐẠI HỌC — TÀI LIỆU CHUẨN THI CÔNG BACKEND & DATA CONTRACT)_ 

# **I. TỔNG QUAN HỆ THỐNG & NỀN TẢNG KỸ THUẬT** 

# **1. PHÂN QUYỀN VÀ ĐIỀU HƯỚNG TRUY CẬP (ROUTING & ACCESS CONTROL)** 

**Hệ thống phân tách luồng đăng nhập thành hai cổng truy cập độc lập nhằm đảm bảo an ninh mạng và ranh giới nghiệp vụ:** 

# **1.1. Cổng người học (Student Entry Point)** 

- **Đường dẫn truy cập: Đường dẫn gốc của hệ thống (/ hoặc /login).** 

- **Đối tượng tiếp nhận: Toàn bộ Sinh viên chính quy đang theo học.** 

- **Cơ chế xác thực: Sử dụng tài khoản email sinh viên (Domain trường) và mật khẩu cá nhân. Hệ thống xác thực danh tính qua bảng người dùng và hồ sơ sinh viên, cấp phát JWT Access Token mang quyền hạn SINHVIEN.** 

- **Điều hướng sau đăng nhập: Chuyển hướng trực tiếp vào màn hình Trang chủ Cổng thông tin Sinh viên.** 

# **1.2. Cổng cán bộ / Quản trị viên (Staff & Administrator Entry Point)** 

- **Đường dẫn truy cập: Phải bổ sung hậu tố quản trị sau đường dẫn gốc: /admin (hoặc /admin/login).** 

- **Đối tượng tiếp nhận: Giảng viên (GIANGVIEN), Trợ lý đào tạo (TROLY), Trưởng phòng đào tạo (TRUONGPHONG).** 

- **Cơ chế xác thực: Yêu cầu email cán bộ và mật khẩu bảo mật. Bộ lọc RoleFilter sẽ thẩm định vai trò nội bộ:** 

   - **Từ chối các tài khoản thuộc nhóm sinh viên (Trả về 403 Forbidden).** 

   - **Dựa vào thuộc tính vai trò (Role claim) trong cơ sở dữ liệu để tự động điều hướng cán bộ về đúng không gian làm việc tương ứng (Workspace của Giảng viên, Trợ lý hay Trưởng phòng).** 

# **2. PHÂN HỆ SINH VIÊN (SINHVIEN)** 

# **2.1. Thanh điều hướng toàn cục (Header Bar) & Tiện ích chung** 

- **Trang chủ học vụ:** 

   - **Màn hình đầu tiên xuất hiện ngay sau khi đăng nhập thành công.** 

   - **Hiển thị bảng tin danh sách các thông báo học vụ mới nhất được phát hành từ Trợ lý đào tạo hoặc Trưởng phòng đào tạo theo thứ tự thời gian giảm dần.** 

- 

   - **Trung tâm thông báo (Notification Bell):** 

      - **Biểu tượng chuông thông báo nằm ở góc trên bên phải.** 

      - **Hiển thị số lượng thông báo chưa đọc (Badge counter).** 

      - **Khi bấm vào, xổ ra danh sách tóm tắt các thông báo khẩn, thông báo học vụ chung toàn trường hoặc thông báo riêng liên quan đến các lớp học phần sinh viên đang theo học từ Giảng viên/Trợ lý đào tạo.** 

- 

      - **Menu người dùng (User Profile Dropdown):** 

         - **Nằm ở góc trên cùng bên phải, hiển thị ảnh thẻ chân dung và họ tên đầy đủ của sinh viên.** 

         - **Khi nhấp chuột vào ảnh thẻ/tên, mở ra danh mục tùy chọn:** 

            **1. Đổi mật khẩu: Mở popup nổi (Modal dialog) yêu cầu nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới. Kiểm tra độ phức tạp mật khẩu trước khi băm và lưu trữ bằng BCrypt.** 

            **2. Hồ sơ của tôi: Chuyển hướng đến màn hình chi tiết thông tin cá nhân sinh viên.** 

            **3. Đăng xuất: Gọi lệnh hủy phiên làm việc, xóa Refresh Token trong HttpOnly Cookie, vô hiệu hóa Access Token và chuyển hướng người dùng về trang đăng nhập sinh viên gốc (/).** 

- **2.2. Trang thông tin cá nhân (Profile)** 

   - **Hiển thị lý lịch học viên: Mã số sinh viên (MSSV), Họ và tên, Ngày sinh, Giới tính, Lớp sinh hoạt, Khoa/Viện đào tạo, Tình trạng học tập, Email, Số điện thoại.** 

   - **Chỉ số học vụ tích lũy: Hiển thị trực quan Tổng số tín chỉ đã tích lũy thành công tính đến thời điểm hiện tại và điểm trung bình tích lũy toàn khóa (GPA).** 

- **2.3. Trang Xem điểm (Academic Transcript)** 

   - **Thông số tổng quan (Header Section): Đặt nổi bật ở vị trí trên cùng trang:** 

         - **Điểm trung bình tích lũy toàn khóa (GPA hệ 4 và hệ 10).** 

   - **Xếp loại học lực toàn khóa tạm thời (Xuất sắc, Giỏi, Khá, Trung bình, Yếu).** 

   - **Tổng số tín chỉ đã tích lũy.** 

- **Danh sách bảng điểm theo học kỳ:** 

   - **Phân tách thành từng khối bảng riêng biệt cho từng học kỳ (đã học, đang học và các môn mới đăng ký).** 

   - **Cấu trúc mỗi bảng gồm các cột: Mã môn học, Tên học phần, Số tín chỉ, Điểm đánh giá quá trình (thường xuyên/giữa kỳ), Điểm thi kết thúc học phần, Điểm tổng kết học phần và Kết quả đạt/không đạt.** 

   - **Chân bảng mỗi học kỳ (Footer Summary): Hiển thị điểm trung bình học kỳ đó, số tín chỉ đạt trong kỳ và xếp loại học lực của riêng học kỳ đó.** 

# **2.4. Trang Thời khóa biểu (Student Timetable)** 

- **Bộ lọc thời gian thực:** 

   - **Cho phép chọn học kỳ muốn tra cứu.** 

   - **Hộp chọn (Dropdown) danh sách tuần học thực tế: hiển thị ngày bắt đầu và kết thúc của từng tuần theo lịch năm học chuẩn, ràng buộc trong phạm vi từ ngày bắt đầu đến ngày kết thúc của học kỳ đó.** 

- **Ma trận hiển thị (Grid Matrix Layout):** 

   - **Thiết kế trực quan dạng lưới gồm 3 hàng và 7 cột:** 

      - **7 Cột: Đại diện từ Thứ 2 đến Chủ Nhật.** 

      - **Hàng 1: Tiêu đề các thứ trong tuần kèm ngày tháng tương ứng của tuần được chọn.** 

      - **Hàng 2 (Buổi Sáng): Bao gồm dải tiết từ Tiết 1 đến Tiết 6.** 

      - **Hàng 3 (Buổi Chiều): Bao gồm dải tiết từ Tiết 7 đến Tiết 12.** 

   - **Các ô có lịch học sẽ hiển thị thẻ thông tin (Card): Tên môn học, Mã lớp học phần, Tiết học cụ thể, Phòng học vật lý và Tên giảng viên phụ trách.** 

# **2.5. Trang Đăng ký học phần (Course Registration)** 

**Giao diện phân vùng chia thành hai khu vực trên/dưới đồng bộ:** 

- **Khu vực 1: Danh sách lớp học phần đang mở đăng ký (Nửa trên):** 

   - **Thanh tìm kiếm nhanh hỗ trợ lọc theo Mã lớp học phần, Mã môn học hoặc Tên môn học.** 

   - **Bảng hiển thị thông tin chi tiết: Mã lớp học phần, Tên môn, Số tín chỉ, Giảng viên giảng dạy, Thứ, Tiết học, Phòng học, Sĩ số hiện tại / Sĩ số tối đa, Thời gian đóng cổng đăng ký.** 

   - **Mỗi dòng có nút "Đăng ký": khi bấm, hệ thống tức thời kiểm tra  và quét xung đột thời khóa biểu với các môn đã chọn trước khi xác nhận ghi danh.** 

   - **Nút "Gửi yêu cầu mở lớp": Bố trí ở góc trên thanh công cụ. Khi bấm sẽ hiển thị Popup Modal:** 

      - **Cho phép sinh viên chọn Học phần cần mở (Mã HP, Tên HP), nhập lý do cần mở thêm lớp (trùng lịch, nợ môn trả nợ tốt nghiệp).** 

      - **Sau khi gửi, phiếu chuyển sang trạng thái chờ xử lý gửi đến Trợ lý đào tạo.** 

- **Khu vực 2: Danh sách lớp học phần đã đăng ký thành công (Nửa dưới):** 

   - **Liệt kê các lớp sinh viên đã ghi danh hợp lệ trong đợt đăng ký này.** 

   - **Hiển thị tổng số tín chỉ đã đăng ký trong học kỳ.** 

   - **Mỗi dòng có nút "Hủy": Cho phép sinh viên hủy môn học đã đăng ký nếu vẫn còn nằm trong khoảng thời gian mở cổng đăng ký cho phép.** 

# **2.6. Trang Danh sách lớp học phần (My Classes)** 

- **Màn hình tra cứu tổng thể toàn bộ quá trình học tập của sinh viên.** 

- **Cho phép lọc theo 3 trạng thái:** 

   - **Danh sách lớp học phần đã đăng ký (chuẩn bị học).** 

   - **Danh sách lớp học phần đang học (trong học kỳ hiện tại).** 

   - **Danh sách lớp học phần đã học (các kỳ trước đã có điểm tổng kết hoàn chỉnh).** 

# **3. PHÂN HỆ GIẢNG VIÊN (GIANGVIEN)** 

# **3.1. Trang chủ & Tiện ích cá nhân** 

- **Đăng nhập thông qua cổng quản trị /admin.** 

- **Giao diện trang chủ dùng chung khung layout với sinh viên: hiển thị thông báo học vụ toàn trường, chuông nhận thông báo, ảnh đại diện góc trên cùng bên phải.** 

- **Menu người dùng hỗ trợ: Đổi mật khẩu cá nhân qua popup, Xem hồ sơ cá nhân giảng viên (Mã GV, Học hàm/Học vị, Khoa/Viện trực thuộc, Email, SĐT) và Đăng xuất khỏi hệ thống.** 

# **3.2. Trang Nhập điểm (Grade Management)** 

- **Hiển thị bảng danh sách các lớp học phần giảng viên đang được phân công phụ trách giảng dạy trong học kỳ.** 

- **Thông tin mỗi lớp: Mã lớp học phần, Tên môn học, Sĩ số sinh viên, Trạng thái sổ điểm (Đang nhập / Đã khóa điểm).** 

- **Hành động thao tác:** 

   - **Mỗi lớp có nút "Nhập điểm": khi nhấp vào sẽ kích hoạt một Popup Modal kích thước lớn (Fullscreen/Large modal):** 

      - **Hiển thị toàn bộ danh sách sinh viên ghi danh trong lớp (STT, MSSV, Họ và tên).** 

      - **Cột nhập liệu số: Điểm quá trình và Điểm cuối kỳ (Ràng buộc thang điểm từ 0.0 đến 10.0).** 

      - **Cột tính tự động: Điểm tổng kết và Đánh giá Đạt/Không đạt.** 

      - **Nút "Lưu tạm / Cập nhật" để lưu điểm vào hệ thống.** 

   - **Nút xuất file:** 

      - **Cung cấp nút "Xuất file Excel" riêng biệt tại mỗi dòng lớp học phần để tải bảng điểm của riêng lớp đó.** 

      - **Cung cấp nút "Xuất toàn bộ bảng điểm" ở đầu trang để kết xuất toàn bộ danh sách sinh viên kèm điểm của tất cả các lớp đang phụ trách ra file Excel .xlsx tổng hợp.** 

# **3.3. Trang Lịch giảng dạy & Điểm danh (Teaching Schedule & Attendance)** 

- **Hiển thị thời khóa biểu giảng dạy theo tuần tương tự định dạng ma trận của sinh viên (3 hàng** _×_ **7 cột, sáng: tiết 1-6, chiều: tiết 7-12, có lọc theo tuần thực tế của học kỳ).** 

- **Cơ chế Điểm danh theo buổi học:** 

- **Trên mỗi khối (Card) lịch học của từng ngày/ca dạy, tích hợp nút chức năng "Điểm danh".** 

- **Khi bấm vào nút "Điểm danh": Hệ thống mở popup danh sách sinh viên của buổi học đó:** 

   - **Cột đánh dấu chuyên cần (Checkbox / Toggle switch): Mặc định là Có mặt.** 

   - **Giảng viên thực hiện đánh dấu những sinh viên Vắng mặt (có phép hoặc không phép) và nhập ghi chú nếu có.** 

   - **Nút "Lưu điểm danh" để ghi nhận dữ liệu chuyên cần vào cơ sở dữ liệu phục vụ thống kê điều kiện dự thi cuối kỳ.** 

# **4. PHÂN HỆ TRỢ LÝ ĐÀO TẠO (TROLY)** 

# **4.1. Không gian làm việc chung & Quản lý thông báo** 

- **Đăng nhập thông qua cổng quản trị /admin.** 

- **Hỗ trợ đầy đủ các thao tác cá nhân: Đổi mật khẩu, xem hồ sơ trợ lý khoa, đăng xuất.** 

- **Quản trị Thông báo học vụ (Toàn quyền CRUD tại Trang chủ):** 

   - **Trợ lý đào tạo có quyền Thêm mới, Chỉnh sửa và Xóa các bản tin thông báo học vụ.** 

   - **Khi tạo thông báo mới, nội dung thông báo sẽ đồng thời xuất hiện trên bảng tin Trang chủ và phát tín hiệu đến chuông thông báo của toàn thể sinh viên trong hệ thống.** 

# **4.2. Trang Quản lý lớp học phần (Class Management)** 

- **Quản lý danh mục Học kỳ:** 

   - **Hiển thị danh sách các học kỳ trong hệ thống kèm trạng thái hiệu lực.** 

   - **Quy tắc phân quyền thời gian:** 

      - **Chỉ những học kỳ đang trong thời gian thực hoặc sắp diễn ra mới được phép thao tác Thêm, Sửa, Xóa các lớp học phần bên trong.** 

      - **Các học kỳ cũ (đã kết thúc trong quá khứ) bị khóa tự động, chuyển sang chế độ Chỉ xem (Read-only).** 

- **Thao tác trong học kỳ hiện tại/sắp tới:** 

      - **Nhấp vào học kỳ để xem toàn bộ danh sách lớp học phần .** 

      - **Cho phép Thêm mới, Chỉnh sửa thông tin (sĩ số tối đa, tên lớp) và Xóa lớp .** 

      - **Phân công giảng viên: Lớp học phần khi mới khởi tạo chưa bắt buộc phải có giảng viên ngay, nhưng bắt buộc phải hoàn tất phân công giảng viên trước khi hệ thống cho phép kích hoạt mở đăng ký.** 

   - **Cấu hình thời gian mở đăng ký học phần:** 

      - **Hỗ trợ chọn linh hoạt: Chọn Tất cả các lớp hoặc tích chọn Một/vài lớp học phần cụ thể (áp dụng cho trường hợp mở lớp bổ sung sau đợt đăng ký chính).** 

      - **Bấm nút "Cài đặt đợt đăng ký" để thiết lập thời gian bắt đầu (thoiGianBDDK) và thời gian kết thúc (thoiGianKTDK).** 

      - **Ràng buộc nghiệp vụ nghiêm ngặt: Đảm bảo mỗi lớp học phần chỉ được cấu hình mở đăng ký trong đúng 1 đợt duy nhất; hệ thống ngăn chặn việc mở đè hoặc mở lại khi không có phê duyệt đặc biệt.** 

   - **Tra cứu và Xuất danh sách sinh viên lớp:** 

      - **Tích hợp tính năng xem trực tiếp danh sách sinh viên đã ghi danh của từng lớp học phần.** 

      - **Cung cấp nút In danh sách (Print view) và nút Xuất file Excel (.xlsx) phục vụ công tác giám thị và điểm danh giấy.** 

- **4.3. Quản lý Lịch học chi tiết (Schedule Generation & Management)** 

   - **Cơ chế tự động sinh lịch học (Auto-generation):** 

      - **Ngay khi Trợ lý đào tạo tạo một lớp học phần thành công, hệ thống dựa vào thứ trong tuần được khai báo, số tiết và khoảng thời gian thực tế của học kỳ (từ ngày bắt đầu đến kết thúc) để tự động tính toán và sinh ra toàn bộ danh sách các buổi học chi tiết theo từng ngày thực tế.** 

      - **Về phòng học: Hệ thống tự động phân bổ ngẫu nhiên một phòng trống trong danh mục phòng học vật lý của trường không bị trùng tiết (thuật toán mô phỏng xếp phòng tự động).** 

   - **Màn hình Quản lý lịch học:** 

      - **Hiển thị danh mục các lớp học phần hiện tại và sắp học.** 

- **Nhấp nút "Xem lịch học" tại mỗi lớp để mở bảng toàn bộ các buổi học chi tiết trong kỳ:** 

   - **Cho phép Trợ lý đào tạo can thiệp thủ công: Thêm buổi học bù, Sửa đổi phòng học, Dời ngày học/tiết học, hoặc Xóa bỏ buổi học khi có lịch nghỉ lễ/đột xuất (có kiểm tra chống trùng phòng).** 

# **4.4. Duyệt yêu cầu mở lớp từ sinh viên (Open Requests Management)** 

- **Màn hình tổng hợp toàn bộ các phiếu kiến nghị mở thêm lớp do sinh viên gửi lên từ trang Đăng ký học phần.** 

- **Hiển thị chi tiết: Mã học phần, Tên môn, Số lượng sinh viên cùng đề xuất môn học đó, Lý do sinh viên trình bày, Ngày gửi đơn, Trạng thái (Chờ xét duyệt, Đã duyệt, Từ chối).** 

- **Hành động nghiệp vụ:** 

   - **Trợ lý đào tạo tiếp nhận đơn, đánh giá nhu cầu (nếu đủ số lượng sinh viên tối thiểu để mở lớp).** 

   - **Bấm "Duyệt" (tiến hành sang màn hình tạo lớp bổ sung) hoặc "Từ chối" kèm nhập nội dung phản hồi giải thích lý do cho sinh viên.** 

# **5. PHÂN HỆ TRƯỞNG PHÒNG ĐÀO TẠO (TRUONGPHONG)** 

# **5.1. Không gian làm việc chung & Thông báo cấp trường** 

- **Đăng nhập thông qua cổng quản trị /admin.** 

- **Quản lý thông tin tài khoản cá nhân: Đổi mật khẩu, xem hồ sơ trưởng phòng, đăng xuất.** 

- **Toàn quyền Thêm, Xóa, Sửa các thông báo học vụ cấp trường trên Trang chủ; thông báo tự động đồng bộ lên chuông thông báo của sinh viên và cán bộ giảng viên toàn trường.** 

# **5.2. Quản lý Danh mục Học phần gốc (Master Course Catalog)** 

- **Quản lý danh mục chương trình khung và toàn bộ môn học gốc của trường đại học.** 

- **Chức năng: Xem danh sách học phần, Thêm mới môn học, Chỉnh sửa thông tin (Tên môn, Số tín chỉ, Khoa quản lý), Xóa môn học (khi môn học chưa được đưa vào kế hoạch mở lớp của bất kỳ học kỳ nào).** 

# **5.3. Giám sát Lớp học phần & Tạo mới Học kỳ (University-wide Classes & Semesters)** 

- **Quản trị Học kỳ: Trưởng phòng đào tạo có thẩm quyền Tạo mới học kỳ ngay tại màn hình này (Khai báo Mã học kỳ, Tên học kỳ, Ngày bắt đầu và Ngày kết thúc học kỳ).** 

- **Giám sát lớp học phần toàn trường:** 

   - **Xem toàn diện danh sách lớp học phần của tất cả các khoa theo từng học kỳ.** 

   - **Truy cập xem danh sách sinh viên ghi danh và bảng điểm tổng kết chi tiết của từng lớp học phần.** 

   - **Cung cấp công cụ Xuất file Excel và In ấn tài liệu phục vụ công tác thanh tra, kiểm định chất lượng đào tạo.** 

# **5.4. Quản lý Đội ngũ Giảng viên (Lecturers Directory)** 

- **Tra cứu danh sách toàn bộ cán bộ giảng viên thuộc tất cả các khoa trong trường.** 

- **Hiển thị chi tiết: Mã giảng viên, Họ và tên, Học hàm/Học vị, Khoa công tác, Email, SĐT, Số lượng lớp học phần đang được phân công đảm nhiệm trong học kỳ.** 

- **Hỗ trợ xuất file danh sách phục vụ thống kê nhân sự đào tạo.** 

# **5.5. Quản lý Danh sách Sinh viên toàn trường (Students Directory)** 

- **Màn hình tra cứu tổng thể cơ sở dữ liệu sinh viên toàn trường.** 

- **Bộ lọc nâng cao: Hỗ trợ lọc đa điều kiện theo Niên khóa tuyển sinh, theo Khoa/Viện đào tạo, hoặc tìm kiếm tức thời theo Mã số sinh viên / Họ tên.** 

- **Hiển thị chi tiết: MSSV, Họ tên, Giới tính, Lớp sinh hoạt, Khoa, Tình trạng học tập (Đang học, Bảo lưu, Đã tốt nghiệp, Thôi học).** 

- **Cung cấp chức năng In ấn trực tiếp và Xuất file Excel toàn bộ hoặc theo bộ lọc danh sách sinh viên.** 

# **II. Nền tảng công nghệ lõi (Core Tech Stack)** 

- **Ngôn ngữ thực thi** : Java 17 LTS. 

- **Nền tảng dịch vụ** : Jakarta EE 10 (chạy trên môi trường Apache Tomcat 10.1+ hoặc Eclipse GlassFish). 

- **Giao thức API** : RESTful API sử dụng chuẩn **Jakarta RESTful Web Services (JAX-RS 3.1 / GlassFish Jersey)** kết hợp bộ tuần tự hóa JSON **Jackson** thay cho Jakarta Servlet truyền thống. 

- **Cơ chế truyền dữ liệu & Phản hồi** : Toàn bộ dữ liệu phản hồi trả về qua cấu trúc thống nhất **Standard JSON Response Envelope** : 

JSON 

{ 

"status": 200, 

"message": "Mô tả kết quả thực hiện", 

"data": { ... } 

} 

_(Khi có lỗi xảy ra, trường data trả về null và status phản ánh chính xác mã HTTP Status)_ . 

- **Tầng lưu trữ & ORM** : PostgreSQL (triển khai trên Neon Serverless Postgres), quản lý truy cập qua JPA/Hibernate (hoặc EclipseLink) không sử dụng dấu ngoặc kép phân biệt hoa thường ở tên bảng/cột. 

- **Bảo mật & Phân quyền** : Stateless JWT Token (JJWT 0.12.x) kết hợp mã hóa một chiều mật khẩu bằng **BCrypt** . Truyền Access Token qua header Authorization: Bearer <token> và lưu Refresh Token qua HttpOnly Cookie. 

- **Thư viện phụ trợ** : Apache POI (xuất báo cáo và danh sách ra file Excel .xlsx). 

# **III. QUY TRÌNH & THỜI ĐIỂM KIỂM TRA XUNG ĐỘT LỊCH (CONFLICT DETECTION)** 

Hệ thống có 3 bài toán kiểm tra xung đột thời gian. Xung đột được xác định bằng điều kiện toán học: hai khoảng thời gian [ _A start , A end_ ] và [ _B start ,Bend_ ] bị chồng lấn khi và chỉ khi: 

_max_ ( _A start ,B start_ ) _≤min_ ( _A end ,Bend_ ) 

Trong hệ đào tạo đại học, khoảng này được tính bằng bộ ba: **(Ngày học** _D_ **, Tiết bắt đầu** _t_ 1 **, Số tiết** _k_ **)** . Tiết kết thúc là _t_ 2= _t_ 1 + _k_ -1. Hai buổi học cùng ngày _D_ trùng tiết nhau nếu: 

_max_ ( _t_ 1 _A ,t_ 1 _B_ ) _≤min_ ( _t_ 2 _A ,t_ 2 _B_ ) 

# **1. Xung đột lịch học của Sinh viên (Student Schedule Conflict)** 

- **Thời điểm kiểm tra** : Bắt buộc kiểm tra tại thời điểm sinh viên gửi yêu cầu **POST /student/registration/enroll** . Quá trình kiểm tra diễn ra trong **Transaction CSDL cấp độ Isolation Serializable hoặc sử dụng Pessimistic Write Lock trên dòng Lớp học phần** để chống race condition. 

- **Các bước thẩm định** : 

1. **Kiểm tra thời gian mở** : Kiểm tra thời gian hệ thống thực tế _T now_ có nằm trong khoảng [ _thoiGianBDDK ,thoiGianKTDK_ ] của Lớp học phần đăng ký hay không. 

2. **Kiểm tra sĩ số** : Đảm bảo _siSoHienTai_ < _siSoToiDa_ . 

3. **Kiểm tra trùng môn học** : Sinh viên chưa từng ghi danh thành công vào một lớp học phần khác của cùng môn học _maHP_ trong cùng kỳ. 

4. **Kiểm tra xung đột thời khóa biểu (Core)** : 

   - Lấy toàn bộ các buổi học ( _ngayHoc ,tietBD ,soTiet_ ) của lớp học phần dự định đăng ký mới ( _LH Pnew_ ). 

   - Lấy toàn bộ các buổi học của tất cả các lớp học phần mà sinh viên này **đã ghi danh thành công** trong học kỳ đó ( _LH Penrolled_ ). 

   - Nếu tồn tại bất kỳ cặp buổi học nào có cùng ngayHoc và giao nhau về dải tiết học: 

_max_ ( _LH Pnew .tietBD , LH Penrolled .tietBD_ ) _≤min_ ( _LH Pnew .tietKT , LH Penrolled .tietKT_ ) 

_→_ **Từ chối ngay lập tức** , rollback transaction và trả về lỗi HTTP 409 Conflict kèm thông điệp: _"Trùng lịch học với lớp [Tên LHP trùng] vào [Ngày/Tiết]!"_ . 

**2. Xung đột phòng học khi Trợ lý xếp lịch (Classroom Conflict)** 

   - **Thời điểm kiểm tra** : Thực hiện tại thời điểm Trợ lý đào tạo thêm/sửa lịch: 

      - **POST /assistant/semesters/{maHocKy}/classes** 

      - **PUT /assistant/schedules/{maLHP}** 

   - 

- **Ràng buộc kiểm tra** : 

   - Một phòng học vật lý (phongHoc) tại một ngayHoc không thể chứa hai lớp khác nhau trong cùng một dải tiết. 

   - CSDL đã có ràng buộc cấp vật lý: 

SQL 

CONSTRAINT uq_lich_phong_tiet UNIQUE (ngayHoc, phongHoc, tietBD) 

- Tầng Service phải quét thêm xung đột dải tiết đa khung (ví dụ: một lớp bắt đầu từ tiết 1 học 4 tiết thì các lớp khác không được chọn tiết 2 hoặc 3 tại phòng đó). Nếu có phòng trùng, trả về HTTP 409 Conflict: _"Phòng [Tên phòng] đã có lớp khác sử dụng vào thời gian này!"_ . 

# **3. Xung đột lịch dạy khi Phân công Giảng viên (Lecturer Schedule Conflict)** 

- **Thời điểm kiểm tra** : Thực hiện tại thời điểm Trợ lý đào tạo gọi API **PATCH /assistant/classes/{maLHP}/assign-lecturer** . 

- **Ràng buộc kiểm tra** : 

   - Một giảng viên (maGV) không thể cùng lúc đứng lớp ở 2 nơi trong cùng một thời điểm. 

   - Tầng Service truy vấn toàn bộ lịch dạy hiện tại của giảng viên trong kỳ. 

   - So sánh toàn bộ mốc ( _ngayHoc ,tietBD ,soTiet_ ) của lớp mới với danh sách buổi giảng dạy đã có. Nếu có sự chồng lấn thời gian, trả về HTTP 409 Conflict: _"Giảng viên [Tên GV] đã bận lịch giảng dạy tại lớp khác trong cùng khung giờ!"_ . 

