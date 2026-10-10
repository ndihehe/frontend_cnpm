
function cleanMojibake(obj) {
  if (typeof obj === 'string') {
    let s = obj;
    s = s.replace(/H\u00e1\u00bb[\u008d\s]?c\s*k\u00e1\u00bb[\u00b3\s]?\s*1/gi, 'Học kỳ 1')
         .replace(/H\u00e1\u00bb[\u008d\s]?c\s*k\u00e1\u00bb[\u00b3\s]?\s*2/gi, 'Học kỳ 2')
         .replace(/H\u00e1\u00bb[\u008d\s]?c\s*k\u00e1\u00bb[\u00b3\s]?\s*h[\u00c4\u00a8\u00e8è]/gi, 'Học kỳ hè')
         .replace(/H\u00e1\u00bb[\u008d\s]?c\s*k\u00e1\u00bb[\u00b3\s]?/gi, 'Học kỳ')
         .replace(/Ch\u00c6\u00b0a\s*x\u00e1\u00ba\u00bf[p\s]*lo\u00e1\u00ba\u00a1i/gi, 'Chưa xếp loại')
         .replace(/Ch\u00c6\u00b0a\s*c\u00c4\u00b3\s*\u00c4\u0091i\u00e1\u00bb\u0083m/gi, 'Chưa có điểm')
         .replace(/Ch\u00c6\u00b0a\s*c\u00c4\u00b3/gi, 'Chưa có')
         .replace(/Xu\u00e1\u00ba\u00a5t\s*s\u00e1\u00ba\u00afc/gi, 'Xuất sắc')
         .replace(/Gi\u00e1\u00bb\u008fi/gi, 'Giỏi')
         .replace(/Kh\u00c4\u00a1/gi, 'Khá')
         .replace(/Trung\s*b\u00c4\u00acnh/gi, 'Trung bình')
         .replace(/\bY\u00e1\u00ba\u00bfu\b/gi, 'Yếu')
         .replace(/Kh\u00c3\u00b4ng\s*\u00c4\u0091\u00e1\u00ba\u00a1t/gi, 'Không đạt')
         .replace(/\b\u00c4\u0090\u00e1\u00ba\u00a1t\b/gi, 'Đạt')
         .replace(/\bHOCKY1\b/g, 'Học kỳ 1')
         .replace(/\bHOCKY2\b/g, 'Học kỳ 2')
         .replace(/\bHOCKYHE\b/g, 'Học kỳ hè')
         .replace(/ChÆ°a xáº¿p loáº¡i/g, 'Chưa xếp loại')
         .replace(/ChÆ°a cĂ³/g, 'Chưa có')
         .replace(/ChÆ°a cĂ³ Ä‘iá»ƒm/g, 'Chưa có điểm')
         .replace(/Há» c ká»³/g, 'Học kỳ');
    return s;
  }
  if (Array.isArray(obj)) return obj.map(cleanMojibake);
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) res[key] = cleanMojibake(obj[key]);
    return res;
  }
  return obj;
}

/* ====================================================================
 * LIVE API CLIENT & UNIFIED BACKEND SERVICE LAYER
 * Hệ thống Quản lý Học vụ - Đại học
 * Kết nối trực tiếp 100% Backend REST API (Tomcat 10 / Jersey 3.1 / PostgreSQL)
 * ==================================================================== */

class ApiClient {
  static getLoginUrl() {
    const p = window.location.pathname.replace(/\\/g, '/');
    if (p.includes('/login.html')) {
      return window.location.href;
    }
    if (window.location.protocol === 'file:') {
      if (p.includes('/pages/student/') || p.includes('/pages/lecturer/') || p.includes('/pages/assistant/') || p.includes('/pages/headoffice/')) {
        return '../auth/login.html';
      }
      if (p.includes('/pages/')) {
        return 'auth/login.html';
      }
      return 'pages/auth/login.html';
    }
    const pagesIdx = p.indexOf('/pages/');
    if (pagesIdx !== -1) {
      const basePath = p.substring(0, pagesIdx);
      return `${basePath}/pages/auth/login.html`;
    }
    return '/pages/auth/login.html';
  }

  static async request(endpoint, options = {}) {
    const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) 
      ? window.APP_CONFIG.API_BASE_URL 
      : 'http://localhost:8080/api';

    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = localStorage.getItem('auth_access_token') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Kiểm tra phản hồi dạng nhị phân (Excel export)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('spreadsheetml') || contentType.includes('octet-stream')) {
        const blob = await response.blob();
        return blob;
      }

      // Xử lý hết phiên làm việc hoặc thiếu quyền
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/admin/login') || url.includes('/auth/refresh');
      const isLoginPage = window.location.pathname.includes('login.html');

      if (response.status === 401 && !isAuthEndpoint && !isLoginPage) {
        ApiClient.showToast('error', 'Hết phiên làm việc', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('auth_access_token');
          localStorage.removeItem('auth_current_user');
          localStorage.removeItem('auth_user_role');
          localStorage.removeItem('currentUser');
          window.location.href = ApiClient.getLoginUrl();
        }, 1500);
        return { status: 401, success: false, message: 'Hết phiên làm việc' };
      }

      const text = await response.text();
      let json;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        return {
          status: response.status,
          success: response.ok,
          message: text || `Lỗi máy chủ (${response.status})`
        };
      }
      return cleanMojibake(json); // Trả về Envelope chuẩn: { status, success, message, data, meta }
    } catch (err) {
      console.error(`[ApiClient Error] ${options.method || 'GET'} ${url}:`, err);
      return {
        status: 500,
        success: false,
        message: err.message || 'Không thể kết nối đến máy chủ Backend'
      };
    }
  }

  static get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  static post(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  static put(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
  }

  static patch(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
  }

  static delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }

  /* TOAST NOTIFICATION THÔNG BÁO GIAO DIỆN */
  static showToast(type, title, message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `hocvu-toast hocvu-toast-${type}`;
    toast.style.pointerEvents = 'auto';

    let iconName = 'info';
    let borderColor = '#0284C7';
    if (type === 'success') { iconName = 'check_circle'; borderColor = '#059669'; }
    else if (type === 'error') { iconName = 'error'; borderColor = '#DC2626'; }
    else if (type === 'warning') { iconName = 'warning'; borderColor = '#D97706'; }

    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px; background: #FFFFFF; border-left: 4px solid ${borderColor}; padding: 12px 16px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 280px; max-width: 400px;">
        <span class="material-symbols-outlined" style="color: ${borderColor}; font-size: 20px; margin-top: 1px;">${iconName}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 13px; color: #002D4F;">${title}</div>
          <div style="font-size: 12px; color: #64748B; margin-top: 2px;">${message}</div>
        </div>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.ApiClient = ApiClient;

/* ====================================================================
 * 1. AUTH API SERVICE
 * ==================================================================== */
const AuthApi = {
  async login(email, password) {
    const payload = {
      email: (email || '').trim().toLowerCase(),
      password: password
    };
    return ApiClient.post('/auth/login', payload);
  },

  async adminLogin(email, password) {
    const payload = {
      email: (email || '').trim().toLowerCase(),
      password: password
    };
    return ApiClient.post('/auth/admin/login', payload);
  },

  async logout() {
    return ApiClient.post('/auth/logout', {});
  },

  async refreshToken() {
    return ApiClient.post('/auth/refresh-token', {});
  }
};

window.AuthApi = AuthApi;

/* ====================================================================
 * 2. PROFILE API SERVICE
 * ==================================================================== */
const ProfileApi = {
  async getProfile() {
    return ApiClient.get('/profile/me');
  },

  async changePassword(matKhauCu, matKhauMoi) {
    return ApiClient.put('/profile/change-password', {
      matKhauCu,
      matKhauMoi
    });
  }
};

window.ProfileApi = ProfileApi;

/* ====================================================================
 * 3. STUDENT API SERVICE
 * ==================================================================== */
const StudentApi = {
  async getRegisteredClasses(semesterId = '') {
    return ApiClient.get('/student/registration/registered-classes');
  },

  async getOpenClasses(page = 1, limit = 10, keyword = '') {
    let query = `?page=${page}&limit=${limit}`;
    if (keyword) query += `&keyword=${encodeURIComponent(keyword)}`;
    return ApiClient.get(`/student/registration/open-classes${query}`);
  },

  async enrollCourse(maLHP) {
    return ApiClient.post('/student/registration/enroll', { maLHP });
  },

  async cancelEnrollment(maHoSo) {
    return ApiClient.delete(`/student/registration/cancel/${maHoSo}`);
  },

  async getGrades(maHocKy = '') {
    let query = (maHocKy && maHocKy !== 'all') ? `?maHocKy=${encodeURIComponent(maHocKy)}` : '';
    return ApiClient.get(`/student/grades${query}`);
  },

  async getSchedule(maHocKy = '') {
    let query = (maHocKy && maHocKy !== 'all') ? `?maHocKy=${encodeURIComponent(maHocKy)}` : '';
    return ApiClient.get(`/student/schedule${query}`);
  },

  async requestOpenCourse(maHP, lyDo = '') {
    return ApiClient.post('/student/registration/open-request', { maHP, lyDo });
  }
};

if (typeof window !== "undefined") { window.StudentApi = StudentApi; }

const LecturerApi = {
  async getTeachingSchedule(maHocKy = '', tuan = '') {
    let sem = maHocKy;
    if (sem === 'GV01' || sem === 'all') sem = '';
    let query = '';
    const params = [];
    if (sem) params.push(`maHocKy=${encodeURIComponent(sem)}`);
    if (tuan) params.push(`tuan=${encodeURIComponent(tuan)}`);
    if (params.length > 0) query = `?${params.join('&')}`;
    return ApiClient.get(`/lecturer/teaching-schedule${query}`);
  },

  async getTeachingClasses(maHocKy = '') {
    let sem = maHocKy;
    if (sem === 'GV01' || sem === 'all') sem = '';
    const query = sem ? `?maHocKy=${encodeURIComponent(sem)}` : '';
    return ApiClient.get(`/lecturer/grades${query}`);
  },

  async getClassGradeSheet(maLHP) {
    return ApiClient.get(`/lecturer/grades/${maLHP}`);
  },

  async saveClassGrades(maLHP, gradesList) {
    // Chuẩn hóa format DTO LectureRequest$UpdateGradesRequest
    const bangDiem = gradesList.map(g => ({
      maSV: g.maSV || g.maSinhVien,
      diemQuaTrinh: (g.diemQuaTrinh !== undefined) ? Number(g.diemQuaTrinh) : (g.diemQT !== undefined ? Number(g.diemQT) : null),
      diemCuoiKy: (g.diemCuoiKy !== undefined) ? Number(g.diemCuoiKy) : (g.diemCK !== undefined ? Number(g.diemCK) : null)
    }));

    return ApiClient.put(`/lecturer/grades/${maLHP}`, { bangDiem });
  },

  async exportGrades(maLHP) {
    return ApiClient.get(`/lecturer/grades/${maLHP}/export`);
  },

  async getAttendanceList(maLichHoc) {
    return ApiClient.get(`/lecturer/attendance/${maLichHoc}`);
  },

  async saveAttendance(maLichHoc, danhSachDiemDanh) {
    const danhSach = danhSachDiemDanh.map(d => ({
      maSV: d.maSV || d.maSinhVien,
      coMat: Boolean(d.coMat),
      ghiChu: d.ghiChu || ''
    }));
    return ApiClient.post(`/lecturer/attendance/${maLichHoc}`, { danhSach });
  }
};

window.LecturerApi = LecturerApi;

/* ====================================================================
 * 5. HEAD OFFICE API SERVICE (TRƯỞNG PHÒNG ĐÀO TẠO)
 * ==================================================================== */
const HeadOfficeApi = {
  async getStatistics(maHocKy = '2026_2027_HK1') {
    return ApiClient.get(`/head-office/statistics?maHocKy=${encodeURIComponent(maHocKy)}`);
  },

  async getCourses(keyword = '', khoa = 'all', page = 1, limit = 10) {
    let query = `?page=${page}&limit=${limit}`;
    if (keyword) query += `&keyword=${encodeURIComponent(keyword)}`;
    return ApiClient.get(`/head-office/courses${query}`);
  },

  async createCourse(payload) {
    return ApiClient.post('/head-office/courses', {
      maHP: payload.maHP,
      tenHP: payload.tenHP,
      soTinChi: Number(payload.soTinChi)
    });
  },

  async updateCourse(maHP, payload) {
    return ApiClient.put(`/head-office/courses/${maHP}`, {
      tenHP: payload.tenHP,
      soTinChi: Number(payload.soTinChi)
    });
  },

  async getSemesters() {
    return ApiClient.get('/head-office/semesters');
  },

  async createSemester(payload) {
    return ApiClient.post('/head-office/semesters', payload);
  },

  async getLecturers(khoa = 'all', keyword = '', page = 1, limit = 10) {
    let query = `?page=${page}&limit=${limit}`;
    if (khoa && khoa !== 'all') query += `&khoa=${encodeURIComponent(khoa)}`;
    if (keyword) query += `&keyword=${encodeURIComponent(keyword)}`;
    const res = await ApiClient.get(`/head-office/lecturers${query}`);
    if (res && res.success && Array.isArray(res.data)) {
      res.data = res.data.map(l => ({
        ...l,
        maGV: l.maNV || l.maGV || '--',
        maNV: l.maNV || l.maGV || '--',
        tenKhoa: l.khoa || l.tenKhoa || 'Khoa Công nghệ thông tin',
        khoa: l.khoa || l.tenKhoa || 'Khoa Công nghệ thông tin',
        sdt: l.sdt || l.soDienThoai || '--',
        hocVi: l.hocVi === 'TIENSI' ? 'Tiến sĩ' : (l.hocVi === 'THACSI' ? 'Thạc sĩ' : (l.hocVi || '--')),
        soLopDamNhiem: l.soLopPhuTrach != null ? l.soLopPhuTrach : (l.soLopDamNhiem != null ? l.soLopDamNhiem : 0),
        soLopPhuTrach: l.soLopPhuTrach != null ? l.soLopPhuTrach : (l.soLopDamNhiem != null ? l.soLopDamNhiem : 0)
      }));
    }
    return res;
  },

  async getGradeSummary(nienKhoa = 'all', khoa = 'all', trangThai = 'all', keyword = '', page = 1, limit = 10) {
    const res = await this.getStudents(nienKhoa, khoa, keyword, page, limit);
    if (!res || !res.success || !res.data) return res;
    
    const students = res.data;
    const summaryData = students.map((s) => {
      const gpa10Num = s.gpaHienTai != null ? Number(s.gpaHienTai) : null;
      let xepLoai = '--';
      if (gpa10Num != null) {
        if (gpa10Num >= 9.0) xepLoai = 'Xuất sắc';
        else if (gpa10Num >= 8.0) xepLoai = 'Giỏi';
        else if (gpa10Num >= 6.5) xepLoai = 'Khá';
        else if (gpa10Num >= 5.0) xepLoai = 'Trung bình';
        else xepLoai = 'Yếu';
      }
      return {
        maSV: s.maSV,
        hoTen: s.hoTen,
        lopDanhNghia: s.chuyenNganh ? (s.chuyenNganh.substring(0, 4) + '_' + (s.nienKhoa ? s.nienKhoa.split('-')[0] : '22')) : 'KTPM2022',
        tenKhoa: s.khoa || 'Công nghệ thông tin',
        nienKhoa: s.nienKhoa || '2022-2026',
        soTCDat: s.soTinChiTichLuy != null ? s.soTinChiTichLuy : '--',
        gpa10: gpa10Num != null ? gpa10Num.toFixed(1) : '--',
        gpa4: gpa10Num != null ? (gpa10Num * 0.4).toFixed(2) : '--',
        xepLoai: s.xepLoai || xepLoai,
        trangThaiHocVu: s.trangThaiHocVu || 'Bình thường'
      };
    });

    const total = (res.meta && res.meta.totalItems) ? res.meta.totalItems : students.length;
    return {
      status: 200,
      success: true,
      data: summaryData,
      meta: res.meta || { page, pageSize: limit, totalItems: total, totalPages: Math.ceil(total / limit) },
      kpi: {
        tongSV: total,
        tiLeDat: '100%',
        svCanhBao: 0,
        svXuatSacGioi: summaryData.filter(s => s.xepLoai === 'Xuất sắc' || s.xepLoai === 'Giỏi').length
      }
    };
  },

  async getStudents(nienKhoa = 'all', khoa = 'all', keyword = '', page = 1, limit = 10) {
    let query = `?page=${page}&limit=${limit}`;
    if (nienKhoa && nienKhoa !== 'all') {
      const cleanCohort = nienKhoa.replace(/\s*-\s*/g, '-');
      query += `&nienKhoa=${encodeURIComponent(cleanCohort)}`;
    }
    if (khoa && khoa !== 'all') {
      const normalizedKhoa = (khoa === 'CNTT') ? 'Công nghệ thông tin' : khoa;
      query += `&khoa=${encodeURIComponent(normalizedKhoa)}`;
    }
    if (keyword && keyword.trim()) {
      query += `&keyword=${encodeURIComponent(keyword.trim())}`;
    }
    return ApiClient.get(`/head-office/students${query}`);
  }
};

window.HeadOfficeApi = HeadOfficeApi;

/* ====================================================================
 * 6. ASSISTANT API SERVICE (TRỢ LÝ ĐÀO TẠO / GIÁO VỤ KHOA)
 * ==================================================================== */
const AssistantApi = {
  async getSemesters() {
    return ApiClient.get('/assistant/semesters');
  },

  async getClasses(maHocKy, keyword = '', page = 1, limit = 10) {
    let sem = maHocKy;
    if (!sem || sem === 'all' || sem === 'HK1_2026_2027') sem = '2026_2027_HK1';
    else if (sem === 'HK2_2025_2026') sem = '2025_2026_HK2';
    else if (sem === 'HK1_2025_2026') sem = '2025_2026_HK1';
    let query = `?page=${page}&limit=${limit}`;if(keyword) query += `&search=${encodeURIComponent(keyword)}`;
    return ApiClient.get(`/assistant/semesters/${sem}/classes${query}`);
  },

  async createClass(payload) {
    const maHocKy = payload.maHocKy || '2026_2027_HK1';
    return ApiClient.post(`/assistant/semesters/${maHocKy}/classes`, {
      maLHP: payload.maLHP,
      tenLHP: payload.tenLHP,
      maHP: payload.maHP,
      thu: Number(payload.thu),
      tietBD: Number(payload.tietBD),
      soTiet: Number(payload.soTiet),
      siSoToiDa: Number(payload.siSoToiDa)
    });
  },

  async updateClass(maLHP, payload) {
    return ApiClient.put(`/assistant/classes/${maLHP}`, {
      tenLHP: payload.tenLHP,
      siSoToiDa: Number(payload.siSoToiDa),
      thu: Number(payload.thu),
      tietBD: Number(payload.tietBD),
      soTiet: Number(payload.soTiet)
    });
  },

  async deleteClass(maLHP) {
    return ApiClient.delete(`/assistant/classes/${maLHP}`);
  },

  async assignLecturer(maLHP, maGV) {
    return ApiClient.patch(`/assistant/classes/${maLHP}/assign-lecturer`, {
      maGV: maGV
    });
  },

  async openRegistrationPeriod(payload) {
    const body = {
      dsMaLHP: payload.dsMaLHP || payload.classCodes || [],
      thoiGianBD: payload.thoiGianBD || payload.thoiGianBDDK || '',
      thoiGianKT: payload.thoiGianKT || payload.thoiGianKTDK || ''
    };
    return ApiClient.post('/assistant/classes/open-registration-period', body);
  },

  async getClassStudents(maLHP, page = 1, limit = 10, isExport = false) {
    const query = `?page=${page}&limit=${limit}&export=${isExport}`;
    return ApiClient.get(`/assistant/classes/${maLHP}/students${query}`);
  },

  async getClassRequests(statusFilter = 'all', page = 1, limit = 10) {
    let query = `?page=${page}&limit=${limit}`;
    if (statusFilter && statusFilter !== 'all') {
      query += `&trangThai=${encodeURIComponent(statusFilter)}`;
    }
    return ApiClient.get(`/assistant/class-requests${query}`);
  },

  async updateClassRequestStatus(maYeuCau, trangThai) {
    return ApiClient.patch(`/assistant/class-requests/${maYeuCau}/status`, {
      trangThai: trangThai
    });
  },

  async getClassSchedules(maLHP) {
    return ApiClient.get(`/assistant/schedules/${maLHP}`);
  },

  async updateClassSchedule(maLHP, payload) {
    return ApiClient.put(`/assistant/schedules/${maLHP}`, payload);
  },

  async deleteClassSchedule(maLH) {
    return ApiClient.delete(`/assistant/schedules/${maLH}`);
  }
};

window.AssistantApi = AssistantApi;

/* ====================================================================
 * 7. NOTIFICATION API SERVICE
 * ==================================================================== */
const NotificationApi = {
  async getNotifications(page = 1, limit = 10) {
    return ApiClient.get(`/notifications?page=${page}&limit=${limit}`);
  },

  async createNotification(payload) {
    return ApiClient.post('/notifications', {
      tieuDe: payload.tieuDe,
      noiDung: payload.noiDung,
      phamVi: payload.phamVi || 'TOAN_TRUONG'
    });
  },

  async updateNotification(id, payload) {
    return ApiClient.put(`/notifications/${id}`, {
      tieuDe: payload.tieuDe,
      noiDung: payload.noiDung
    });
  },

  async deleteNotification(id) {
    return ApiClient.delete(`/notifications/${id}`);
  }
};

window.NotificationApi = NotificationApi;

/* ====================================================================
 * 8. COMMON API SERVICE (DÙNG CHUNG CHO MỌI PHÂN HỆ)
 * ==================================================================== */
const CommonApi = {
  async getAllSemesters() {
    return ApiClient.get('/common/semesters');
  },
  async getSemesters() {
    return ApiClient.get('/common/semesters');
  },
  async getCurrentSemester() {
    const res = await ApiClient.get('/common/semesters');
    if (res && res.success && Array.isArray(res.data)) {
      const current = res.data.find(s => s.isCurrent || s.hienHanh);
      return { status: 200, success: true, data: current || res.data[0] };
    }
    return res;
  },
  async switchCurrentSemester(maHocKy) {
    return ApiClient.post('/common/switch-semester', { maHocKy });
  }
};

window.CommonApi = CommonApi;


/* ====================================================================
 * GLOBAL UI SYNCHRONIZER (SIDEBAR & TOPBAR)
 * Đồng bộ hóa tức thì thông tin sinh viên trên Sidebar & Topbar
 * ==================================================================== */
function syncGlobalUserUI() {
  let user = null;
  try {
    const raw = localStorage.getItem('auth_current_user') || localStorage.getItem('auth_user') || localStorage.getItem('currentUser');
    if (raw) user = JSON.parse(raw);
  } catch (e) {}

  const token = localStorage.getItem('auth_access_token') || localStorage.getItem('token');

  let role = user ? (user.role || 'SINHVIEN') : 'SINHVIEN';
  let defaultAvatar = 'https://pub-cecf49575b944a78a4f75f51cf7636f6.r2.dev/nam_01.jpg';
  let defaultCode = 'SV: SV001';
  let defaultStatus = '● Đang học';
  let defaultName = 'Nguyen Van An';

  if (role === 'GIANGVIEN') {
    defaultAvatar = 'https://pub-cecf49575b944a78a4f75f51cf7636f6.r2.dev/nu_01.jpg';
    defaultCode = 'CB: ' + (user?.maNV || user?.maDinhDanh || 'NV001');
    defaultStatus = '● Giảng viên khoa CNTT';
    defaultName = 'Tran Thi Binh';
  } else if (role === 'TROLY') {
    defaultAvatar = 'https://pub-cecf49575b944a78a4f75f51cf7636f6.r2.dev/nam_02.jpg';
    defaultCode = 'CB: ' + (user?.maNV || user?.maDinhDanh || 'NV002');
    defaultStatus = '● Giáo vụ khoa CNTT';
    defaultName = 'Le Van Cuong';
  } else if (role === 'TRUONGPHONG') {
    defaultAvatar = 'https://pub-cecf49575b944a78a4f75f51cf7636f6.r2.dev/nu_02.jpg';
    defaultCode = 'CB: ' + (user?.maNV || user?.maDinhDanh || 'NV003');
    defaultStatus = '● Trưởng phòng Đào tạo';
    defaultName = 'Pham Thi Dung';
  } else {
    defaultAvatar = 'https://pub-cecf49575b944a78a4f75f51cf7636f6.r2.dev/nam_01.jpg';
    defaultCode = 'SV: ' + (user?.maSV || user?.maDinhDanh || 'SV001');
    defaultStatus = '● Đang học';
    defaultName = 'Nguyen Van An';
  }

  const avatarUrl = user?.anhThe || defaultAvatar;
  const fullName = user?.hoTen || user?.name || defaultName;
  const displayCode = user?.maSV ? ('SV: ' + user.maSV) : (user?.maNV ? ('CB: ' + user.maNV) : defaultCode);

  // 1. Sidebar Avatar
  const sidebarAv = document.getElementById('sidebar-user-avatar');
  if (sidebarAv) {
    sidebarAv.src = avatarUrl;
    sidebarAv.alt = fullName;
  }
  document.querySelectorAll('.sidebar-avatar').forEach(img => {
    img.src = avatarUrl;
    img.alt = fullName;
  });

  // 2. Sidebar User Name
  const sidebarName = document.getElementById('sidebar-user-name');
  if (sidebarName) {
    sidebarName.textContent = fullName;
    sidebarName.title = fullName;
  }
  document.querySelectorAll('.sidebar-user-name, .sidebar-name').forEach(el => {
    el.textContent = fullName;
    el.title = fullName;
  });

  // 3. Sidebar User Code
  const sidebarCode = document.getElementById('sidebar-user-code');
  if (sidebarCode) {
    sidebarCode.textContent = displayCode;
  }
  document.querySelectorAll('.sidebar-user-mssv, .sidebar-user-sub').forEach(el => {
    el.textContent = displayCode;
  });

  // 4. Sidebar User Status
  const sidebarStatus = document.getElementById('sidebar-user-status');
  if (sidebarStatus) {
    sidebarStatus.textContent = defaultStatus;
  }
  document.querySelectorAll('.sidebar-user-status').forEach(el => {
    el.textContent = defaultStatus;
  });

  // 5. Topbar Avatar & Info
  const topbarAv = document.querySelector('.topbar-avatar-img') || document.getElementById('topbar-user-avatar');
  if (topbarAv) topbarAv.src = avatarUrl;

  const topbarName = document.querySelector('.topbar-actions span[style*="font-weight: 600"]') || document.getElementById('topbar-user-name');
  if (topbarName) {
    topbarName.textContent = fullName;
  }

  // 6. Background Profile Refresh: if token present, fetch /profile/me to guarantee accuracy
  if (token && window.ProfileApi && window.ProfileApi.getProfile) {
    ProfileApi.getProfile().then(res => {
      if (res && res.success && res.data) {
        const liveUser = res.data;
        const mergedUser = Object.assign({}, user || {}, liveUser);
        localStorage.setItem('auth_current_user', JSON.stringify(mergedUser));
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        
        if (liveUser.anhThe) {
          if (sidebarAv) sidebarAv.src = liveUser.anhThe;
          if (topbarAv) topbarAv.src = liveUser.anhThe;
          document.querySelectorAll('.sidebar-avatar').forEach(img => img.src = liveUser.anhThe);
        }
        if (liveUser.hoTen) {
          if (sidebarName) { sidebarName.textContent = liveUser.hoTen; sidebarName.title = liveUser.hoTen; }
          if (topbarName) topbarName.textContent = liveUser.hoTen;
          document.querySelectorAll('.sidebar-user-name, .sidebar-name').forEach(el => el.textContent = liveUser.hoTen);
        }
        if (liveUser.maDinhDanh) {
          const liveCode = (liveUser.role === 'SINHVIEN') ? ('SV: ' + liveUser.maDinhDanh) : ('CB: ' + liveUser.maDinhDanh);
          if (sidebarCode) sidebarCode.textContent = liveCode;
          document.querySelectorAll('.sidebar-user-mssv, .sidebar-user-sub').forEach(el => el.textContent = liveCode);
        }
      }
    }).catch(() => {});
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', syncGlobalUserUI);
}
if (typeof window !== 'undefined') {
  window.syncGlobalUserUI = syncGlobalUserUI;
}


