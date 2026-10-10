# BÁO CÁO PHÂN TÍCH VÀ ĐỀ XUẤT THAY ĐỔI: DATABASE & BACKEND
*(Đã cập nhật theo yêu cầu thiết kế Real-time Tracking, thuộc tính isEditable thay thế khóa điểm, State Machine tự động theo dòng thời gian, và Cơ chế Quản lý Thời gian Mở cổng Đăng ký)*

Tài liệu này trình bày chi tiết nguyên nhân gốc rễ (Root Cause Analysis), kiến trúc giải pháp mới (Realtime Lifecycle Engine), danh sách cụ thể **các bảng có thay đổi ở Database** và **các file có thay đổi ở Backend**, giải quyết triệt để các phản ánh trong `bao_loi.md`.

---

## MỤC LỤC TỔNG HỢP NHANH (QUICK NOTE)

### 📌 1. Các bảng có thay đổi ở Database (Neon PostgreSQL)
1. **`HocKy` (`hocky`)**: Thêm `is_current`, `manual_override`, `updated_by_tro_ly`, `updated_at`, kèm Unique Partial Index `uq_current_semester`.
2. **`LopHocPhan` (`lophocphan`)**: Thêm cột `is_editable` (khai tử vai trò của `khoa_diem`), thêm ràng buộc `CHECK (si_so_hien_tai <= si_so_toi_da)`, thêm ràng buộc `CHECK (thoiGianBDDK < thoiGianKTDK)`, chuẩn hóa enum trạng thái (`CHUA_MO`, `MODANGKY`, `DANGHOC`, `KETTHUC`).
3. **`LichHoc` (`lichhoc`)**: Thêm cột `is_editable` để khóa bất biến phòng học, ngày học của kỳ quá khứ.
4. **`HoSoHocPhan` (`hosohocphan`)**: Thêm cột `is_editable` để khóa bất biến điểm số khi hết hạn học kỳ (thay thế hoàn toàn việc khóa điểm cục bộ).

### 📌 2. Các file có thay đổi / thêm mới ở Backend (Java / Jakarta EE 10)
1. **Tầng Model / Entity:**
   - [`HocKy.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/HocKy.java): Bổ sung `isCurrent`, `manualOverride`, helper methods kiểm tra hết hạn.
   - [`LopHocPhan.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/LopHocPhan.java): Bổ sung `isEditable`, deprecate `khoaDiem`, thêm logic tự động xác định trạng thái theo thời gian.
   - [`LichHoc.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/LichHoc.java): Bổ sung `isEditable`.
   - [`HoSoHocPhan.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/HoSoHocPhan.java): Bổ sung `isEditable`.
   - [`TrangThaiLop.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/enums/TrangThaiLop.java): Bổ sung trạng thái `CHUA_MO`.
2. **Tầng Core / Engine Realtime Tracking:**
   - [`AppContextListener.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/config/AppContextListener.java): Khởi tạo và giải phóng Scheduled Heartbeat Worker ngầm khi Tomcat start/stop.
   - [`SemesterLifecycleScheduler.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/scheduler/SemesterLifecycleScheduler.java) *(File mới)*: Worker định kỳ quét DB theo thời gian thực để chuyển đổi trạng thái học kỳ, trạng thái lớp và cập nhật `isEditable`.
   - [`SemesterService.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/common/SemesterService.java) *(File mới/cập nhật)*: Single Source of Truth cho học kỳ hiện hành, hỗ trợ Trợ lý đào tạo switch kỳ và tự động transition on-demand.
   - [`CommonController.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/common/CommonController.java): Endpoint REST `/api/common/current-semester`.
3. **Tầng Nghiệp vụ (Modules / Services):**
   - [`StudentServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/student/StudentServiceImpl.java): Thêm chặn hủy môn quá hạn, thêm kiểm tra trùng lịch học, concurrency safe.
   - [`AssistantServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/assistant/AssistantServiceImpl.java): Chặn gán GV/sửa lớp khi `isEditable == false`, bổ sung `tenHP` và `tenLHP` trong meta, hỗ trợ API switch học kỳ cho Trợ lý đào tạo, validate thời gian mở đăng ký `<= hocKy.thoiGianBD`.
   - [`LecturerServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/lecturer/LecturerServiceImpl.java): Chặn nhập/sửa điểm khi `isEditable == false` (thay thế kiểm tra `khoaDiem`).
   - [`HeadOfficeController.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/headoffice/HeadOfficeController.java) & [`HeadOfficeServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/headoffice/HeadOfficeServiceImpl.java): Thêm tìm kiếm sinh viên `keyword` và đồng bộ DTO dashboard.

---

## PHẦN 1: THIẾT KẾ CƠ CHẾ THEO DÕI THỜI GIAN THỰC (REAL-TIME TRACKING) HỌC KỲ HIỆN HÀNH

### 1. Phân tích bài toán
- **Thực tế nghiệp vụ:** Một học kỳ được xem là hiện hành vừa chịu sự **chủ động điều phối của Trợ lý đào tạo** (ví dụ: mở sớm kỳ mới để lên kế hoạch đào tạo hoặc dời ngày bắt đầu/kết thúc), vừa phải **tự động chuyển tiếp theo dòng thời gian thực** (khi hết kỳ cũ, hệ thống tự kích hoạt kỳ mới mà không bắt buộc trợ lý phải thức lúc nửa đêm để bấm nút).
- **Kiến trúc giải pháp: Hybrid Real-time Engine** kết hợp 2 cơ chế:
  1. **Event-driven (Sự kiện từ Trợ lý đào tạo):** Khi Trợ lý đào tạo chọn học kỳ và bấm *"Thiết lập làm học kỳ hiện hành"*, backend thực hiện Transaction cập nhật `is_current = true`, ghi nhận cờ `manual_override = true`, `updated_by_tro_ly`.
  2. **Heartbeat Scheduler + On-Demand Check (Tự động theo thời gian thực):**
     - Background Thread (`ScheduledExecutorService`) chạy mỗi 15-30 phút quét kiểm tra ngày kết thúc học kỳ.
     - On-Demand check trong `SemesterService.getCurrentSemester()`: Mỗi khi có request, nếu kỳ hiện tại đã qua `thoiGianKT`, tự động chạy luồng transition kỳ mới và cập nhật DB ngay tại thời điểm đó (Zero Latency).

```
[ Trợ lý đào tạo Switch Kỳ ] ──────┐
                                   │
                                   ▼
 [ Database: hocky ] ◄─── [ SemesterService ] ◄─── [ On-demand Check mỗi Request ]
   (is_current = true)             ▲
                                   │
                 [ Scheduled Heartbeat Worker (mỗi 15-30p) ]
```

---

## PHẦN 2: THIẾT KẾ THUỘC TÍNH `isEditable` THAY THẾ HOÀN TOÀN `khoaDiem`

### 1. Lý do loại bỏ `khoaDiem` và chuyển sang `isEditable`
Trước đây, hệ thống chỉ có cờ `khoaDiem` ở bảng `LopHocPhan`, chỉ giải quyết được việc cấm sửa điểm cục bộ. Tuy nhiên, nó để lại nhiều lỗ hổng lớn:
- Giáo vụ vẫn sửa được lớp, đổi phòng, đổi giảng viên của kỳ đã kết thúc nhiều năm trước ("thay đổi quá khứ").
- Lịch học của kỳ cũ vẫn có thể bị chỉnh sửa.
- Sinh viên có thể bị thao túng đăng ký/hủy môn ngoài ý muốn.

**Quy chuẩn mới với `isEditable`:**
Khi một học kỳ kết thúc (`LocalDate.now().isAfter(hocKy.getThoiGianKT())`), toàn bộ dữ liệu thuộc học kỳ đó chuyển sang trạng thái **Bất biến (Immutable / Read-only)**. Thuộc tính `isEditable` được áp dụng đồng bộ cho cả 3 bảng:

| Tên Bảng | Cột Mới | Ý nghĩa & Quyền hạn khi `isEditable = false` |
| :--- | :--- | :--- |
| **`lophocphan`** | `is_editable BOOLEAN DEFAULT TRUE` | **Thay thế hoàn toàn `khoaDiem`:**<br>• Giảng viên: Không thể nhập, sửa điểm (chốt sổ vĩnh viễn).<br>• Giáo vụ: Không thể sửa sĩ số, thời khóa biểu, không thể phân công lại GV.<br>• Sinh viên: Không thể đăng ký hoặc hủy môn. |
| **`lichhoc`** | `is_editable BOOLEAN DEFAULT TRUE` | Khóa cứng phòng học, ngày học, ca học; ngăn chặn dời lịch học của các kỳ quá khứ. |
| **`hosohocphan`** | `is_editable BOOLEAN DEFAULT TRUE` | Khóa điểm quá trình, điểm thi, điểm tổng kết; ngăn chặn bất kỳ thao tác UPDATE điểm trực tiếp nào. |

### 2. Cơ chế tự động khóa `isEditable` theo thời gian
Khi thời gian thực tế vượt qua ngày kết thúc của học kỳ (`CURRENT_DATE > thoigiankt`):
1. **Ở mức Database:**
   ```sql
   -- Tự động đánh dấu kết thúc và khóa editable cho toàn bộ lớp học phần quá hạn
   UPDATE lophocphan 
   SET is_editable = false, trang_thai = 'KETTHUC' 
   WHERE mahocky IN (SELECT mahocky FROM hocky WHERE thoigiankt < CURRENT_DATE)
     AND is_editable = true;

   -- Khóa lịch học
   UPDATE lichhoc 
   SET is_editable = false 
   WHERE malhp IN (SELECT malhp FROM lophocphan WHERE is_editable = false)
     AND is_editable = true;

   -- Khóa hồ sơ điểm
   UPDATE hosohocphan 
   SET is_editable = false 
   WHERE malhp IN (SELECT malhp FROM lophocphan WHERE is_editable = false)
     AND is_editable = true;
   ```

2. **Ở mức Entity Java (Self-defense logic):**
   Trong entity `LopHocPhan.java`, `HoSoHocPhan.java`:
   ```java
   public boolean isEditable() {
       // Nếu đã bị set false vật lý thì return false
       if (Boolean.FALSE.equals(this.isEditable)) return false;
       // Nếu học kỳ của lớp đã qua ngày kết thúc thì tự động coi như không editable
       if (this.hocKy != null && this.hocKy.getThoiGianKT() != null) {
           return !LocalDate.now().isAfter(this.hocKy.getThoiGianKT());
       }
       return true;
   }
   ```
   *Nhờ kiểm tra 2 lớp (Database + Java logic), ngay cả khi background worker chưa kịp chạy, mọi API cố tình cập nhật dữ liệu của kỳ cũ đều bị chặn ngay lập tức.*

---

## PHẦN 3: THIẾT KẾ CƠ CHẾ THỜI GIAN MỞ CỔNG ĐĂNG KÝ HỌC PHẦN

### 1. Dòng thời gian và State Machine của Lớp học phần
Trạng thái lớp học phần (`TrangThaiLop`) được chuyển đổi tự động theo 3 mốc thời gian thực tế:
$$\mathbf{thoiGianBDDK} \quad \longrightarrow \quad \mathbf{thoiGianKTDK} \quad \longrightarrow \quad \mathbf{thoiGianKT \text{ (Học kỳ)}}$$

```
          thoiGianBDDK                  thoiGianKTDK              thoiGianKT (Học kỳ)
---------------|-----------------------------|---------------------------|---------------->
  [ CHƯA MỞ ]            [ MỞ ĐĂNG KÝ ]               [ ĐANG HỌC ]                [ KẾT THÚC ]
  (CHUA_MO)                (MODANGKY)                 (DANGHOC)                   (KETTHUC)
Sinh viên chưa           Sinh viên ĐĂNG KÝ          Đóng cổng đăng ký           Học kỳ kết thúc
được đăng ký             & HỦY học phần             Sinh viên HỌC               isEditable = false
isEditable = true        isEditable = true          isEditable = true           Khóa toàn bộ
```

### 2. Quy tắc nghiệp vụ cho Đợt đăng ký:
1. **Ràng buộc thời gian thiết lập:**
   $$\mathbf{thoiGianBDDK} < \mathbf{thoiGianKTDK} \le \mathbf{HocKy.thoiGianBD}$$
   * Thời gian kết thúc đăng ký (`thoiGianKTDK`) **bắt buộc phải trước hoặc bằng ngày học kỳ chính thức bắt đầu** (`thoiGianBD`).
   * Hệ thống sẽ báo lỗi từ chối nếu Trợ lý đào tạo chọn ngày kết thúc đăng ký rơi vào giữa kỳ học (khi sinh viên đã lên lớp).
   * **Cho phép cập nhật / gia hạn:** Xóa bỏ lỗi cứng *"A class can only have one registration period"*, cho phép Trợ lý đào tạo điều chỉnh lại đợt nếu kỳ học chưa bắt đầu.

2. **Ràng buộc khi Sinh viên Đăng ký (`enrollCourse`):**
   * Chỉ cho phép ghi danh khi: `thoiGianBDDK <= OffsetDateTime.now() <= thoiGianKTDK`.
   * Trước giờ mở: Báo lỗi *"Cổng đăng ký chưa mở (Dự kiến mở lúc: dd/MM/yyyy HH:mm)"*.
   * Sau giờ đóng: Báo lỗi *"Cổng đăng ký đã đóng (Hạn chót: dd/MM/yyyy HH:mm)"*.

3. **Ràng buộc khi Sinh viên HỦY học phần (`cancelEnrollment`) — (Khắc phục phản ánh thời khóa biểu có tiết nhưng vẫn hủy được):**
   * Hủy học phần chỉ được phép diễn ra trong thời gian mở cổng đăng ký (`now <= thoiGianKTDK`).
   * **Khi bước sang giai đoạn `DANGHOC` (sau `thoiGianKTDK` hoặc ngày học kỳ đã bắt đầu):**
     * Danh sách lớp đã chốt với Giảng viên để điểm danh.
     * Cổng đăng ký đóng $\rightarrow$ **Nút HỦY môn trên giao diện sinh viên bị VÔ HIỆU HÓA hoàn toàn (disabled)** kèm badge *"Đã chốt danh sách"*.
     * Backend chặn đứng mọi request hủy môn nếu quá hạn:
       ```java
       if (lhp.getThoiGianKTDK() != null && now.isAfter(lhp.getThoiGianKTDK())) {
           throw new BusinessException("Đã hết thời hạn điều chỉnh/hủy học phần. Lớp học phần đã chốt danh sách giảng dạy.");
       }
       if (semester.getThoiGianBD() != null && LocalDate.now().isAfter(semester.getThoiGianBD())) {
           throw new BusinessException("Học kỳ đã bắt đầu giảng dạy, sinh viên không thể tự ý hủy học phần.");
       }
       ```

---

## PHẦN 4: CHI TIẾT CÁC BẢNG CÓ THAY ĐỔI Ở DATABASE

### 1. Bảng `hocky`
```sql
-- Thêm các cột quản lý trạng thái hiện hành và theo dõi điều chỉnh
ALTER TABLE hocky ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT FALSE;
ALTER TABLE hocky ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;
ALTER TABLE hocky ADD COLUMN IF NOT EXISTS updated_by_tro_ly VARCHAR(50);
ALTER TABLE hocky ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Ràng buộc duy nhất: Chỉ có tối đa 1 học kỳ là is_current = TRUE
DROP INDEX IF EXISTS uq_current_semester;
CREATE UNIQUE INDEX uq_current_semester ON hocky (is_current) WHERE is_current = TRUE;

-- Thiết lập học kỳ hiện hành chuẩn mực (HK1 2026-2027)
UPDATE hocky SET is_current = FALSE WHERE is_current = TRUE;
UPDATE hocky SET is_current = TRUE WHERE mahocky = '2026_2027_HK1';
```

### 2. Bảng `lophocphan`
```sql
-- Thêm cột is_editable
ALTER TABLE lophocphan ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE;

-- Khai tử vai trò của khoaDiem (sao chép giá trị cũ sang is_editable nếu cần)
UPDATE lophocphan SET is_editable = false WHERE khoadiem = true;

-- Thêm ràng buộc toàn vẹn chống vượt sĩ số tối đa (Race condition protection)
ALTER TABLE lophocphan DROP CONSTRAINT IF EXISTS chk_lophocphan_siso;
ALTER TABLE lophocphan ADD CONSTRAINT chk_lophocphan_siso CHECK (sisohientai <= sisotoida);

-- Thêm ràng buộc thời gian mở đăng ký phải trước thời gian kết thúc đăng ký
ALTER TABLE lophocphan DROP CONSTRAINT IF EXISTS chk_lophocphan_thoigiandk;
ALTER TABLE lophocphan ADD CONSTRAINT chk_lophocphan_thoigiandk 
CHECK (thoigianbddk IS NULL OR thoigianktdk IS NULL OR thoigianbddk < thoigianktdk);

-- Cập nhật trạng thái các lớp thuộc học kỳ cũ
UPDATE lophocphan 
SET is_editable = false, trangthai = 'KETTHUC' 
WHERE mahocky IN (SELECT mahocky FROM hocky WHERE thoigiankt < CURRENT_DATE);
```

### 3. Bảng `lichhoc`
```sql
-- Thêm cột is_editable
ALTER TABLE lichhoc ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE;

-- Đồng bộ is_editable theo lớp học phần
UPDATE lichhoc 
SET is_editable = false 
WHERE malhp IN (SELECT malhp FROM lophocphan WHERE is_editable = false);
```

### 4. Bảng `hosohocphan`
```sql
-- Thêm cột is_editable
ALTER TABLE hosohocphan ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE;

-- Đồng bộ is_editable theo lớp học phần
UPDATE hosohocphan 
SET is_editable = false 
WHERE malhp IN (SELECT malhp FROM lophocphan WHERE is_editable = false);
```

---

## PHẦN 5: CHI TIẾT CÁC FILE CÓ THAY ĐỔI / THÊM MỚI Ở BACKEND

### 1. File Model & Entity (`com.university.core.model`)
* [`HocKy.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/HocKy.java):
  * Thêm thuộc tính: `private Boolean isCurrent = false;`, `private Boolean manualOverride = false;`, `private String updatedByTroLy;`.
  * Thêm phương thức: `public boolean isExpired() { return thoiGianKT != null && LocalDate.now().isAfter(thoiGianKT); }`.
* [`LopHocPhan.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/LopHocPhan.java):
  * Thêm thuộc tính: `private Boolean isEditable = true;`.
  * Deprecate trường `khoaDiem`: Getter `isKhoaDiem()` trả về `!isEditable()`.
  * Phương thức tính trạng thái tự động theo thời gian:
    ```java
    public TrangThaiLop getAutoTrangThai() {
        OffsetDateTime now = OffsetDateTime.now();
        if (hocKy != null && hocKy.isExpired()) return TrangThaiLop.KETTHUC;
        if (thoiGianKTDK != null && now.isAfter(thoiGianKTDK)) return TrangThaiLop.DANGHOC;
        if (thoiGianBDDK != null && now.isBefore(thoiGianBDDK)) return TrangThaiLop.CHUA_MO;
        return TrangThaiLop.MODANGKY;
    }
    ```
* [`LichHoc.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/LichHoc.java):
  * Thêm thuộc tính: `private Boolean isEditable = true;`.
* [`HoSoHocPhan.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/HoSoHocPhan.java):
  * Thêm thuộc tính: `private Boolean isEditable = true;`.
* [`TrangThaiLop.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/model/enums/TrangThaiLop.java):
  * Bổ sung giá trị enum: `CHUA_MO`, `MODANGKY`, `DANGHOC`, `KETTHUC`.

### 2. File Core Scheduler & Lifecycle Engine
* [`SemesterLifecycleScheduler.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/scheduler/SemesterLifecycleScheduler.java) *(File mới)*:
  * Khởi tạo Singleton `ScheduledExecutorService` chạy lặp định kỳ (ví dụ mỗi 30 phút).
  * Chạy job:
    1. Kiểm tra học kỳ hiện hành: Nếu hết hạn và không có `manual_override`, tìm kỳ kế tiếp và chuyển `is_current`.
    2. Quét các lớp học phần có `thoiGianKTDK < now` mà trạng thái còn `MODANGKY` $\rightarrow$ tự động chuyển sang `DANGHOC`.
    3. Quét các lớp có học kỳ đã hết hạn $\rightarrow$ chuyển `trang_thai = KETTHUC`, `is_editable = false`.
* [`AppContextListener.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/core/config/AppContextListener.java):
  * Trong `contextInitialized`: Gọi `SemesterLifecycleScheduler.start()`.
  * Trong `contextDestroyed`: Gọi `SemesterLifecycleScheduler.stop()` giải phóng thread pool an toàn.

### 3. File Quản lý Học kỳ tập trung (`com.university.modules.common`)
* [`SemesterService.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/common/SemesterService.java) *(File mới/cập nhật)*:
  * Phương thức `getCurrentSemester()`: Đọc `is_current = true`, kèm logic on-demand auto-transition nếu kỳ hết hạn.
  * Phương thức `switchCurrentSemesterByAssistant(String maHocKy, String maNVTroLy)`: Dành riêng cho Trợ lý đào tạo chủ động chọn kỳ hiện hành.
* [`CommonController.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/common/CommonController.java):
  * API `GET /api/common/current-semester`: Trả về thông tin học kỳ hiện hành chính thức cho toàn bộ Frontend dùng chung.
  * API `GET /api/common/semesters`: Trả về danh sách học kỳ.

### 4. File Nghiệp vụ Sinh viên (`com.university.modules.student`)
* [`StudentServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/student/StudentServiceImpl.java):
  * `cancelEnrollment`:
    * Kiểm tra `lhp.isEditable()`: Nếu `false` ném lỗi *"Học kỳ đã kết thúc, không thể hủy học phần"*.
    * Kiểm tra `lhp.getThoiGianKTDK()`: Nếu `now.isAfter(thoiGianKTDK)` ném lỗi *"Đã hết thời hạn hủy học phần. Lớp học phần đã chốt danh sách giảng dạy."*.
    * Kiểm tra `semester.getThoiGianBD()`: Nếu học kỳ đã bắt đầu, ném lỗi *"Học kỳ đã bắt đầu, không thể tự ý hủy học phần"*.
  * `enrollCourse`:
    * Kiểm tra `lhp.getAutoTrangThai() != MODANGKY` $\rightarrow$ Chặn đăng ký khi chưa mở hoặc đã đóng cổng.
    * Kiểm tra trùng lịch học (`thu`, `tietBD`, `soTiet`) với toàn bộ các môn sinh viên đã đăng ký trong cùng kỳ.
    * Sử dụng atomic update `UPDATE LopHocPhan SET siSoHienTai = siSoHienTai + 1 WHERE maLHP = :id AND siSoHienTai < siSoToiDa` để loại trừ hoàn toàn race condition.

### 5. File Nghiệp vụ Giáo vụ / Trợ lý đào tạo (`com.university.modules.assistant`)
* [`AssistantServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/assistant/AssistantServiceImpl.java):
  * `assignLecturer` và `updateClass`: Kiểm tra `lhp.isEditable()`. Nếu `false`, ném `BusinessException("Lớp học phần thuộc học kỳ đã kết thúc (Read-only). Không được phép chỉnh sửa.")`.
  * `getClassStudents`: Bổ sung `tenHP` và `tenLHP` trong DTO trả về (xóa bỏ lỗi hiển thị `"-"`).
  * `openRegistrationPeriod`: Nhận thời gian mở/đóng đăng ký, validate `thoiGianBDDK < thoiGianKTDK` và `thoiGianKTDK <= semester.getThoiGianBD()`, cập nhật trạng thái lớp sang `MODANGKY`. Cho phép cập nhật lại đợt nếu kỳ chưa bắt đầu.
  * `switchSemester`: Cho phép Trợ lý đào tạo chủ động set kỳ hiện hành.

### 6. File Nghiệp vụ Giảng viên (`com.university.modules.lecturer`)
* [`LecturerServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/lecturer/LecturerServiceImpl.java):
  * `enterGrades` / `updateGrade`:
    * Kiểm tra `lhp.isEditable()` và `hoSoHocPhan.isEditable()`.
    * Nếu `false`, ném lỗi *"Lớp học phần hoặc học kỳ đã kết thúc. Điểm đã được khóa sổ lưu trữ vĩnh viễn, không thể chỉnh sửa."* (Thay thế hoàn toàn cờ `khoaDiem` cũ).

### 7. File Nghiệp vụ Trưởng phòng Đào tạo (`com.university.modules.headoffice`)
* [`HeadOfficeController.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/headoffice/HeadOfficeController.java):
  * Bổ sung `@QueryParam("keyword")` cho API `/api/headoffice/students`.
* [`HeadOfficeServiceImpl.java`](file:///D:/KTPM/quanlyhocvu/feature-student/src/main/java/com/university/modules/headoffice/HeadOfficeServiceImpl.java):
  * Lọc sinh viên theo `keyword` (tìm theo mã SV hoặc họ tên).
  * Khớp DTO Dashboard: Đảm bảo trả cả `tongSinhVien` và `tongSinhVienToanTruong`.

---

## TỔNG HỢP MA TRẬN BẢNG DỮ LIỆU & FILE MÃ NGUỒN CẦN CHỈNH SỬA

| STT | Thành phần | Tên Bảng / Tên File | Loại thay đổi | Trách nhiệm giải quyết |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Database** | `HocKy` | Thêm cột & Index | Quản lý kỳ hiện hành, hỗ trợ Trợ lý đào tạo override |
| **2** | **Database** | `LopHocPhan` | Thêm cột & Constraint | Thêm `is_editable`, chặn vượt sĩ số, ràng buộc `thoiGianBDDK < thoiGianKTDK` |
| **3** | **Database** | `LichHoc` | Thêm cột | Khóa bất biến lịch học kỳ cũ (`is_editable = false`) |
| **4** | **Database** | `HoSoHocPhan` | Thêm cột | Khóa điểm sổ vĩnh viễn (`is_editable = false`) |
| **5** | **Backend Model** | `HocKy.java` | Sửa Model | Thêm field `isCurrent`, `manualOverride`, helper methods |
| **6** | **Backend Model** | `LopHocPhan.java` | Sửa Model | Thêm `isEditable`, auto calculate trạng thái |
| **7** | **Backend Model** | `LichHoc.java` | Sửa Model | Thêm `isEditable` |
| **8** | **Backend Model** | `HoSoHocPhan.java` | Sửa Model | Thêm `isEditable` |
| **9** | **Backend Core** | `AppContextListener.java` | Sửa Core | Quản lý vòng đời Scheduled Thread Pool |
| **10** | **Backend Core** | `SemesterLifecycleScheduler.java` | **Tạo Mới** | Heartbeat Worker tự động chuyển trạng thái theo giờ thực |
| **11** | **Backend Service**| `SemesterService.java` | Sửa / Tạo Mới | Single Source of Truth cho học kỳ hiện hành |
| **12** | **Backend Service**| `StudentServiceImpl.java` | Sửa Logic | Chặn hủy quá hạn, check trùng lịch, chống race condition |
| **13** | **Backend Service**| `AssistantServiceImpl.java` | Sửa Logic | Chặn sửa kỳ cũ khi `isEditable=false`, nạp `tenHP`/`tenLHP`, validate đợt ĐK |
| **14** | **Backend Service**| `LecturerServiceImpl.java` | Sửa Logic | Chặn nhập điểm khi `isEditable=false` (bỏ `khoaDiem`) |
| **15** | **Backend Controller**| `HeadOfficeController.java` | Sửa API | Bổ sung query param `keyword` tìm kiếm SV |
