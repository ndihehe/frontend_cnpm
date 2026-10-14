/**
 * USER MENU & GLOBAL PROFILE SYNC COMPONENT
 * Đảm bảo 100% hiển thị danh tính thật từ Backend PostgreSQL / Cloudflare R2
 * Tự động đồng bộ Topbar, Sidebar, Dropdown Menu và kiểm soát phiên đăng nhập
 */
(function() {
  function injectDropdownStyles() {
    if (document.getElementById('hocvu-user-dropdown-styles')) return;
    const style = document.createElement('style');
    style.id = 'hocvu-user-dropdown-styles';
    style.textContent = `
      .user-dropdown-container {
        position: relative !important;
        display: inline-block !important;
        user-select: none !important;
        font-family: inherit !important;
      }
      .user-dropdown-trigger {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        cursor: pointer !important;
        padding: 5px 10px !important;
        border-radius: 6px !important;
        background: #FFFFFF !important;
        border: 1px solid #CBD5E1 !important;
        outline: none !important;
        transition: all 0.15s ease !important;
      }
      .user-dropdown-trigger:hover,
      .user-dropdown-trigger.active {
        background: #F1F5F9 !important;
        border-color: #0284C7 !important;
        box-shadow: 0 2px 5px rgba(2, 132, 199, 0.15) !important;
      }
      .user-dropdown-menu {
        display: none !important;
        position: absolute !important;
        top: calc(100% + 6px) !important;
        right: 0 !important;
        width: 250px !important;
        background: #FFFFFF !important;
        border: 1px solid #CBD5E1 !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08) !important;
        padding: 6px 0 !important;
        z-index: 999999 !important;
      }
      .user-dropdown-menu.show {
        display: block !important;
        animation: hocvuDropdownShow 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      @keyframes hocvuDropdownShow {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .user-dropdown-header {
        padding: 10px 14px !important;
        background: #F8FAFC !important;
        border-bottom: 1px solid #E2E8F0 !important;
        margin-bottom: 4px !important;
      }
      .user-dropdown-name {
        font-size: 13px !important;
        font-weight: 700 !important;
        color: #002D4F !important;
        line-height: 1.3 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .user-dropdown-role {
        font-size: 11.5px !important;
        font-weight: 600 !important;
        color: #0284C7 !important;
        margin-top: 2px !important;
      }
      .user-dropdown-divider {
        height: 1px !important;
        background: #E2E8F0 !important;
        margin: 4px 0 !important;
      }
      .user-dropdown-item {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 9px 14px !important;
        font-size: 12.5px !important;
        font-weight: 500 !important;
        color: #1E293B !important;
        text-decoration: none !important;
        cursor: pointer !important;
        background: transparent !important;
        border: none !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: left !important;
        transition: background 0.15s ease, color 0.15s ease !important;
      }
      .user-dropdown-item:hover {
        background: #F0F9FF !important;
        color: #0284C7 !important;
        text-decoration: none !important;
      }
      .user-dropdown-item .material-symbols-outlined {
        font-size: 18px !important;
        color: #64748B !important;
      }
      .user-dropdown-item:hover .material-symbols-outlined {
        color: #0284C7 !important;
      }
      .user-dropdown-item.danger {
        color: #DC2626 !important;
      }
      .user-dropdown-item.danger .material-symbols-outlined {
        color: #DC2626 !important;
      }
      .user-dropdown-item.danger:hover {
        background: #FEF2F2 !important;
        color: #B91C1C !important;
      }
      .user-dropdown-caret {
        transition: transform 0.2s ease !important;
        font-size: 16px !important;
        color: #64748B !important;
      }
      .user-dropdown-trigger.active .user-dropdown-caret {
        transform: rotate(180deg) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getStoredUser() {
    try {
      const uStr = localStorage.getItem('auth_current_user') || localStorage.getItem('currentUser');
      if (uStr) return JSON.parse(uStr);
    } catch (e) {}
    return null;
  }

  function getRoleLabel(role) {
    if (role === 'SINHVIEN') return 'Sinh viên chính quy';
    if (role === 'GIANGVIEN') return 'Giảng viên bộ môn';
    if (role === 'TROLY') return 'Trợ lý đào tạo';
    if (role === 'TRUONGPHONG') return 'Trưởng phòng Đào tạo';
    return 'Người dùng hệ thống';
  }

  function getLoginUrl() {
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

  function getProfileUrl() {
    const p = window.location.pathname.replace(/\\/g, '/');
    if (p.includes('/pages/student/')) return 'profile.html';
    if (p.includes('/pages/lecturer/')) return 'profile.html';
    if (p.includes('/pages/assistant/')) return 'profile.html';
    if (p.includes('/pages/headoffice/')) return 'profile.html';
    return 'profile.html';
  }

  function syncUserDisplay() {
    injectDropdownStyles();

    const user = getStoredUser();
    const token = localStorage.getItem('auth_access_token') || localStorage.getItem('token');
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!token && !isLoginPage) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!user) return;

    const userFullName = user.hoTen || 'Người dùng';
    const userRoleText = getRoleLabel(user.role);
    const userCode = user.maSV ? ('SV: ' + user.maSV) : (user.maNV ? ('CB: ' + user.maNV) : (user.maDinhDanh ? (user.role === 'SINHVIEN' ? 'SV: ' : 'CB: ') + user.maDinhDanh : ''));
    const userAvatar = user.anhThe || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(userFullName) + '&background=0284C7&color=fff&size=80');

    let statusText = '● Đang học';
    if (user.role === 'GIANGVIEN') statusText = '● Giảng viên khoa CNTT';
    else if (user.role === 'TROLY') statusText = '● Giáo vụ khoa CNTT';
    else if (user.role === 'TRUONGPHONG') statusText = '● Trưởng phòng Đào tạo';

    // 1. Cập nhật Sidebar
    document.querySelectorAll('.sidebar-avatar').forEach(img => {
      img.src = userAvatar;
      img.alt = userFullName;
    });
    document.querySelectorAll('.sidebar-user-name, .sidebar-name').forEach(el => {
      el.textContent = userFullName;
      el.title = userFullName;
    });
    document.querySelectorAll('.sidebar-user-mssv, .sidebar-user-sub').forEach(el => {
      if (userCode) el.textContent = userCode;
    });
    document.querySelectorAll('.sidebar-user-status').forEach(el => {
      el.textContent = statusText;
    });

    // 2. Cập nhật Topbar
    const topbarActions = document.querySelector('.topbar-actions');
    if (!topbarActions) return;

    let existingContainer = topbarActions.querySelector('.user-dropdown-container');
    if (existingContainer) return;

    let oldTrigger = topbarActions.querySelector('a[href*="profile.html"], div[style*="cursor: pointer"], #user-dropdown-root');
    if (!oldTrigger) {
      oldTrigger = topbarActions.querySelector('.topbar-avatar-img')?.parentElement;
    }
    if (!oldTrigger) return;

    const container = document.createElement('div');
    container.className = 'user-dropdown-container';
    container.id = 'user-dropdown-root';

    container.innerHTML = `
      <button type="button" class="user-dropdown-trigger" id="user-menu-trigger" title="Tài khoản: ${userFullName}">
        <img src="${userAvatar}" alt="Avatar" class="topbar-avatar-img" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid #CBD5E1;" />
        <span style="font-size: 12.5px; font-weight: 600; color: #002D4F; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${userFullName}
        </span>
        <span class="material-symbols-outlined user-dropdown-caret">expand_more</span>
      </button>

      <div class="user-dropdown-menu" id="user-menu-dropdown">
        <div class="user-dropdown-header">
          <div class="user-dropdown-name" title="${userFullName}">${userFullName}</div>
          <div class="user-dropdown-role">${userRoleText} ${userCode ? '(' + userCode + ')' : ''}</div>
        </div>
        
        <a href="${getProfileUrl()}" class="user-dropdown-item">
          <span class="material-symbols-outlined">person</span>
          <span>Thông tin tài khoản</span>
        </a>

        <button type="button" class="user-dropdown-item" id="menu-btn-change-pwd">
          <span class="material-symbols-outlined">lock_reset</span>
          <span>Đổi mật khẩu</span>
        </button>

        <div class="user-dropdown-divider"></div>

        <button type="button" class="user-dropdown-item danger" id="menu-btn-logout">
          <span class="material-symbols-outlined">logout</span>
          <span>Đăng xuất hệ thống</span>
        </button>
      </div>
    `;

    oldTrigger.parentNode.replaceChild(container, oldTrigger);

    const triggerBtn = container.querySelector('#user-menu-trigger');
    const dropdownMenu = container.querySelector('#user-menu-dropdown');

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains('show');
      if (isOpen) {
        dropdownMenu.classList.remove('show');
        triggerBtn.classList.remove('active');
      } else {
        dropdownMenu.classList.add('show');
        triggerBtn.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdownMenu.classList.remove('show');
        triggerBtn.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdownMenu.classList.remove('show');
        triggerBtn.classList.remove('active');
      }
    });

    // Xử lý Đăng xuất
    container.querySelector('#menu-btn-logout').addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.remove('show');
      const doLogout = () => {
        if (window.AuthApi && window.AuthApi.logout) {
          try { window.AuthApi.logout(); } catch(err) {}
        }
        localStorage.removeItem('auth_access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_current_user');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('auth_user_role');
        window.location.href = getLoginUrl();
      };

      if (window.ApiClient && ApiClient.showConfirmModal) {
        ApiClient.showConfirmModal({
          title: 'Đăng xuất tài khoản',
          message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Quản lý Học vụ?',
          confirmText: 'Đăng xuất',
          cancelText: 'Ở lại',
          isDanger: true,
          onConfirm: doLogout
        });
      } else {
        doLogout();
      }
    });

    // Đổi mật khẩu
    container.querySelector('#menu-btn-change-pwd').addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.remove('show');
      triggerBtn.classList.remove('active');
      openChangePasswordModal();
    });

    createChangePasswordModal();
  }

  function createChangePasswordModal() {
    if (document.getElementById('modal-user-change-password')) return;
    const modalHtml = `
      <div id="modal-user-change-password" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1000000; align-items: center; justify-content: center;">
        <div style="background: #FFFFFF; border-radius: 8px; width: 400px; max-width: 90vw; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow: hidden; font-family: inherit;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #E2E8F0; background: #F8FAFC;">
            <div style="font-size: 14px; font-weight: 700; color: #002D4F; display: flex; align-items: center; gap: 6px;">
              <span class="material-symbols-outlined" style="color: #0284C7; font-size: 20px;">lock_reset</span>
              <span>ĐỔI MẬT KHẨU TÀI KHOẢN</span>
            </div>
            <button type="button" style="background: none; border: none; cursor: pointer; color: #64748B;" onclick="closeUserChangePasswordModal()">
              <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
            </button>
          </div>
          <form id="form-user-change-pwd" novalidate onsubmit="handleUserSubmitChangePassword(event)" style="padding: 18px 20px;">
            <div style="margin-bottom: 12px;">
              <label style="font-size: 12px; font-weight: 600; color: #334155; display: block; margin-bottom: 4px;">Mật khẩu hiện tại *</label>
              <div class="field-error-text" id="user-old-pwd-error" style="display: none;"></div>
              <input type="password" id="user-old-pwd" required placeholder="Nhập mật khẩu hiện tại" style="width: 100%; height: 36px; padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 13px; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 12px;">
              <label style="font-size: 12px; font-weight: 600; color: #334155; display: block; margin-bottom: 4px;">Mật khẩu mới *</label>
              <div class="field-error-text" id="user-new-pwd-error" style="display: none;"></div>
              <input type="password" id="user-new-pwd" required placeholder="Tối thiểu 6 ký tự" minlength="6" style="width: 100%; height: 36px; padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 13px; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 600; color: #334155; display: block; margin-bottom: 4px;">Xác nhận mật khẩu mới *</label>
              <div class="field-error-text" id="user-confirm-pwd-error" style="display: none;"></div>
              <input type="password" id="user-confirm-pwd" required placeholder="Nhập lại mật khẩu mới" minlength="6" style="width: 100%; height: 36px; padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 13px; box-sizing: border-box;" />
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #E2E8F0; padding-top: 14px;">
              <button type="button" id="btn-cancel-change-pwd" style="height: 32px; padding: 0 14px; font-size: 12px; border: 1px solid #CBD5E1; border-radius: 4px; background: white; cursor: pointer;" onclick="closeUserChangePasswordModal()">Hủy</button>
              <button type="submit" id="btn-submit-change-pwd" style="height: 32px; padding: 0 16px; font-size: 12px; background: #0284C7; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Cập nhật</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function openChangePasswordModal() {
    const modal = document.getElementById('modal-user-change-password');
    if (modal) {
      if (window.ApiClient && ApiClient.clearAllFieldErrors) {
        ApiClient.clearAllFieldErrors('modal-user-change-password');
      }
      document.getElementById('user-old-pwd').value = '';
      document.getElementById('user-new-pwd').value = '';
      document.getElementById('user-confirm-pwd').value = '';
      modal.style.display = 'flex';
    }
  }

  window.closeUserChangePasswordModal = function() {
    const modal = document.getElementById('modal-user-change-password');
    if (modal) modal.style.display = 'none';
  };

  window.handleUserSubmitChangePassword = async function(e) {
    e.preventDefault();
    if (window.ApiClient && ApiClient.clearAllFieldErrors) {
      ApiClient.clearAllFieldErrors('modal-user-change-password');
    }
    const oldP = document.getElementById('user-old-pwd').value.trim();
    const newP = document.getElementById('user-new-pwd').value;
    const confirmP = document.getElementById('user-confirm-pwd').value;

    let hasError = false;
    if (!oldP) {
      if (window.ApiClient && ApiClient.showFieldError) {
        ApiClient.showFieldError('user-old-pwd', 'Vui lòng nhập mật khẩu hiện tại.');
      }
      hasError = true;
    }
    if (!newP) {
      if (window.ApiClient && ApiClient.showFieldError) {
        ApiClient.showFieldError('user-new-pwd', 'Vui lòng nhập mật khẩu mới.');
      }
      hasError = true;
    } else if (newP.length < 6) {
      if (window.ApiClient && ApiClient.showFieldError) {
        ApiClient.showFieldError('user-new-pwd', 'Mật khẩu mới phải có tối thiểu 6 ký tự.');
      }
      hasError = true;
    }
    if (newP !== confirmP) {
      if (window.ApiClient && ApiClient.showFieldError) {
        ApiClient.showFieldError('user-confirm-pwd', 'Mật khẩu xác nhận không khớp!');
      }
      hasError = true;
    }
    if (hasError) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang xử lý...'; }
    try {
      if (window.ProfileApi && window.ProfileApi.changePassword) {
        const res = await ProfileApi.changePassword(oldP, newP);
        if (res && (res.success || res.status === 200)) {
          if (window.ApiClient && ApiClient.showToast) {
            ApiClient.showToast('success', 'Đổi mật khẩu thành công', 'Mật khẩu đã được thay đổi thành công. Hệ thống đang chuyển hướng về trang đăng nhập...');
          }
          closeUserChangePasswordModal();

          // Thu hồi refresh token / phiên làm việc và bắt buộc đăng nhập lại
          if (window.AuthApi && window.AuthApi.logout) {
            try { window.AuthApi.logout(); } catch(err) {}
          }
          localStorage.removeItem('auth_access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth_current_user');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('auth_user_role');
          try { sessionStorage.clear(); } catch(err) {}

          setTimeout(() => {
            window.location.href = getLoginUrl();
          }, 1200);
          return;
        } else {
          const msg = (res && res.message) ? res.message : 'Đổi mật khẩu không thành công!';
          if (window.ApiClient && ApiClient.showFieldError) {
            ApiClient.showFieldError('user-old-pwd', msg);
          }
        }
      } else {
        if (window.ApiClient && ApiClient.showFieldError) {
          ApiClient.showFieldError('user-old-pwd', 'Chức năng đổi mật khẩu chưa sẵn sàng');
        }
      }
    } catch (err) {
      const errMsg = 'Đã xảy ra lỗi: ' + (err.message || 'Không thể đổi mật khẩu');
      if (window.ApiClient && ApiClient.showFieldError) {
        ApiClient.showFieldError('user-old-pwd', errMsg);
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Cập nhật'; }
    }
  };

  /* TÍCH HỢP CHUÔNG THÔNG BÁO VỚI API NOTIFICATIONS THẬT */
  function setupNotificationBell(topbarActions) {
    if (!topbarActions || document.getElementById('topbar-notif-root')) return;

    const notifContainer = document.createElement('div');
    notifContainer.id = 'topbar-notif-root';
    notifContainer.style.cssText = 'position: relative; display: inline-flex; align-items: center; margin-right: 8px;';

    notifContainer.innerHTML = `
      <button type="button" id="topbar-notif-btn" title="Thông báo hệ thống" style="position: relative; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 6px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all 0.15s ease;">
        <span class="material-symbols-outlined" style="font-size: 19px;">notifications</span>
        <span id="topbar-notif-badge" style="display: none; position: absolute; top: -3px; right: -3px; background: #DC2626; color: white; font-size: 10px; font-weight: 700; border-radius: 10px; padding: 1px 5px; line-height: 1.2; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">0</span>
      </button>

      <div id="topbar-notif-dropdown" style="display: none; position: absolute; top: calc(100% + 8px); right: 0; width: 320px; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 999999; overflow: hidden; font-family: inherit;">
        <div style="padding: 10px 14px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 700; color: #002D4F; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 18px; color: #0284C7;">notifications_active</span>
            <span>THÔNG BÁO MỚI</span>
          </div>
          <span id="topbar-notif-count-text" style="font-size: 11px; color: #64748B;">0 thông báo</span>
        </div>
        <div id="topbar-notif-list" style="max-height: 320px; overflow-y: auto; padding: 6px 0;">
          <div style="padding: 18px; text-align: center; color: #94A3B8; font-size: 12px;">Đang tải thông báo...</div>
        </div>
      </div>
    `;

    topbarActions.insertBefore(notifContainer, topbarActions.firstChild);

    const btn = notifContainer.querySelector('#topbar-notif-btn');
    const dropdown = notifContainer.querySelector('#topbar-notif-dropdown');
    const badge = notifContainer.querySelector('#topbar-notif-badge');
    const list = notifContainer.querySelector('#topbar-notif-list');
    const countText = notifContainer.querySelector('#topbar-notif-count-text');

    async function loadNotifications() {
      if (!window.NotificationApi || !window.NotificationApi.getNotifications) return;
      try {
        const res = await NotificationApi.getNotifications(1, 5);
        if (res && res.success && Array.isArray(res.data)) {
          const items = res.data;
          const total = (res.meta && res.meta.totalItems != null) ? res.meta.totalItems : items.length;
          if (total > 0) {
            badge.textContent = total > 9 ? '9+' : total;
            badge.style.display = 'block';
            countText.textContent = `${total} thông báo`;
          } else {
            badge.style.display = 'none';
            countText.textContent = '0 thông báo';
          }

          if (items.length === 0) {
            list.innerHTML = `<div style="padding: 20px; text-align: center; color: #94A3B8; font-size: 12.5px;">Không có thông báo nào</div>`;
            return;
          }

          list.innerHTML = items.map(n => `
            <div style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; transition: background 0.15s; cursor: default;">
              <div style="font-size: 12.5px; font-weight: 600; color: #0F172A; line-height: 1.35; margin-bottom: 3px;">${n.tieuDe || 'Thông báo học vụ'}</div>
              <div style="font-size: 11.5px; color: #64748B; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${n.noiDung || ''}</div>
              <div style="font-size: 10.5px; color: #94A3B8; margin-top: 4px;">${n.ngayTao ? new Date(n.ngayTao).toLocaleDateString('vi-VN') : 'Hôm nay'}</div>
            </div>
          `).join('');
        } else {
          list.innerHTML = `<div style="padding: 16px; text-align: center; color: #94A3B8; font-size: 12px;">Không có thông báo mới</div>`;
        }
      } catch (e) {
        list.innerHTML = `<div style="padding: 16px; text-align: center; color: #EF4444; font-size: 12px;">Không thể tải thông báo</div>`;
      }
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) loadNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!notifContainer.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Tự động kiểm tra số thông báo lúc nạp trang
    loadNotifications();
    window.refreshNotificationBell = loadNotifications;
  }

  // Hook vào syncUserDisplay
  const origSync = syncUserDisplay;
  syncUserDisplay = function() {
    origSync();
    const topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions) {
      setupNotificationBell(topbarActions);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncUserDisplay);
  } else {
    syncUserDisplay();
  }
})();
