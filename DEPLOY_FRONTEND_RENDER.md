# HƯỚNG DẪN DEPLOY FRONTEND LÊN RENDER (BẢO MẬT URL QUA .ENV)

Dự án Frontend được xây dựng bằng kiến trúc HTML/CSS/Vanilla JS và được điều hướng, phục vụ bởi máy chủ **Node.js (`server.js`)**.

Toàn bộ URL kết nối tới Backend đã được trừu tượng hóa và bảo mật hoàn toàn thông qua biến môi trường **`API_BASE_URL`** trong file `.env` (được đưa vào `.gitignore` để không bị lộ trên GitHub).

---

## 1. CƠ CHẾ HOẠT ĐỘNG CỦA BIẾN MÔI TRƯỜNG (.ENV)

1. **Khi chạy trên máy tính cục bộ (Localhost):**
   - File `frontend_cnpm/.env` chứa:
     ```properties
     API_BASE_URL=http://localhost:8080/api
     PORT=3000
     ```
   - Khi chạy `npm start` (hoặc `node server.js`), server tự động đọc file `.env` này và truyền giá trị `API_BASE_URL` xuống trình duyệt mà không cần can thiệp code.

2. **Khi triển khai lên Render:**
   - File `.env` không bị push lên GitHub nhờ `.gitignore`.
   - Trên Render Dashboard, bạn chỉ cần điền biến môi trường `API_BASE_URL`:
     ```
     API_BASE_URL = https://<ten-backend-cua-ban>.onrender.com/api
     ```
   - Khi server khởi động trên Render, nó sẽ tự động lấy giá trị này cấp phát cho toàn bộ giao diện sinh viên, giáo vụ, đào tạo và giảng viên.

---

## 2. CÁC TẬP TIN CẤU HÌNH ĐÃ THIẾT LẬP

| Tên file | Mô tả |
| :--- | :--- |
| `.env` | Chứa cấu hình URL cục bộ `API_BASE_URL=http://localhost:8080/api` (Được ẩn khỏi Git). |
| `.env.example` | File mẫu để tham khảo và hướng dẫn người khác cấu hình môi trường. |
| `.gitignore` | Đã bổ sung `.env` và `.env.local` để bảo vệ bảo mật mã nguồn. |
| `build-config.js` | Kịch bản tự động cập nhật `js/config.js` từ biến môi trường `API_BASE_URL` khi chạy lệnh `npm run build`. |
| `server.js` | Bổ sung hàm `loadEnv()` nạp `.env` và endpoint động `/js/config.js` theo `process.env.API_BASE_URL`. |
| `Dockerfile` | Image Node.js 20 Alpine nhẹ, chạy trực tiếp trên Render Docker runtime. |
| `render.yaml` | Bản thiết kế tự động hoá deploy dịch vụ Frontend lên Render. |

---

## 3. CÁC BƯỚC TRIỂN KHAI LÊN RENDER

### CÁCH 1: TẠO WEB SERVICE TRỰC TIẾP TRÊN RENDER (NODE.JS)

1. **Đẩy code lên GitHub:**
   ```bash
   git add .
   git commit -m "Configure frontend environment and deployment for Render"
   git push origin main
   ```

2. **Tạo Web Service trên Render:**
   - Vào [dashboard.render.com](https://dashboard.render.com) -> **New +** -> **Web Service**.
   - Chọn Repository của bạn.
   - **Name:** `quanlydaotao-frontend` (hoặc tên tùy chọn).
   - **Region:** `Singapore` (để cùng khu vực với backend, tối ưu tốc độ).
   - **Root Directory:** Điền `frontend_cnpm` (nếu repo chứa cả project).
   - **Runtime:** `Node`.
   - **Build Command:** `npm run build`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`.

3. **Cấu hình Environment Variables:**
   - Thêm biến sau trong phần **Environment Variables**:
     - **Key:** `API_BASE_URL`
     - **Value:** `https://<ten-backend-cua-ban>.onrender.com/api` (URL backend Render bạn đã deploy).

4. Nhấn **Create Web Service**. Render sẽ cài đặt, build và khởi chạy frontend.

---

### CÁCH 2: DÙNG DOCKER WEB SERVICE

Nếu bạn muốn deploy bằng Docker:
1. Tạo Web Service -> Chọn **Runtime: Docker**.
2. **Root Directory:** `frontend_cnpm`.
3. Thêm biến môi trường `API_BASE_URL = https://<ten-backend-cua-ban>.onrender.com/api`.
4. Nhấn **Create Web Service**.

---

### CÁCH 3: DÙNG BLUEPRINT FULLSTACK (`render.yaml`)

Nếu repository của bạn chứa cả thư mục `quanlydaotaobackend` và `frontend_cnpm`:
- File [render.yaml](file:///d:/CNPM/project/render.yaml) ở thư mục gốc đã được cấu hình gồm cả 2 dịch vụ (`quanlydaotaobackend` và `quanlydaotao-frontend`).
- Chỉ cần vào Render -> **New +** -> **Blueprint** -> Chọn Repo.
- Render sẽ tự động tạo cả 2 dịch vụ cùng lúc.
