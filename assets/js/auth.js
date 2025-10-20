// Менеджер авторизации и управления интерфейсом
class AuthManager {
  constructor() {
    this.sessionKey = 'cms_session';
    this.init();
  }

  init() {
    this.updateNavigationUI();
    this.setupLogoutHandlers();
  }

  // Проверка авторизации пользователя
  isUserLoggedIn() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      if (!session) return false;

      const sessionData = JSON.parse(session);
      
      // Проверяем срок действия сессии (24 часа)
      const loginTime = new Date(sessionData.loginTime);
      const now = new Date();
      const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        // Сессия истекла
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка проверки сессии:', error);
      this.logout();
      return false;
    }
  }

  // Получение данных пользователя
  getUserData() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      if (!session) return null;
      
      return JSON.parse(session);
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      return null;
    }
  }

  // Обновление интерфейса навигации
  updateNavigationUI() {
    const registerLink = document.querySelector('.register-link');
    const loginLink = document.querySelector('.login-link');
    const profileLink = document.querySelector('.profile-link');
    
    if (this.isUserLoggedIn()) {
      // Пользователь авторизован - скрываем кнопки регистрации и входа
      if (registerLink) registerLink.style.display = 'none';
      if (loginLink) loginLink.style.display = 'none';
      if (profileLink) profileLink.style.display = 'block';
      
      // Добавляем кнопку выхода, если её нет
      this.addLogoutButton();
    } else {
      // Пользователь не авторизован - показываем кнопки регистрации и входа
      if (registerLink) registerLink.style.display = 'block';
      if (loginLink) loginLink.style.display = 'block';
      if (profileLink) profileLink.style.display = 'none';
      
      // Удаляем кнопку выхода
      this.removeLogoutButton();
    }
  }

  // Добавление кнопки выхода
  addLogoutButton() {
    const navLinks = document.querySelector('#nav-links');
    if (!navLinks) return;
    
    // Проверяем, есть ли уже кнопка выхода
    let logoutLink = navLinks.querySelector('.logout-link');
    if (logoutLink) return;
    
    // Создаем кнопку выхода
    logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.className = 'logout-link';
    logoutLink.textContent = 'Вихід';
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });
    
    // Добавляем кнопку в конец навигации
    navLinks.appendChild(logoutLink);
  }

  // Удаление кнопки выхода
  removeLogoutButton() {
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
      logoutLink.remove();
    }
  }

  // Выход из системы
  logout() {
    // Удаляем сессию
    localStorage.removeItem(this.sessionKey);
    
    // Обновляем интерфейс
    this.updateNavigationUI();
    
    // Перенаправляем на главную страницу, если находимся на защищенной странице
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['profile.html', 'cms.html', 'admin.html'];
    
    if (protectedPages.includes(currentPage)) {
      window.location.href = 'index.html';
    }
    
    // Показываем уведомление
    this.showNotification('Вы успешно вышли из системы', 'success');
  }

  // Настройка обработчиков выхода
  setupLogoutHandlers() {
    // Обработчик для существующих кнопок выхода
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('logout-btn') || 
          e.target.id === 'logoutBtn' ||
          e.target.textContent === 'Выход') {
        e.preventDefault();
        this.logout();
      }
    });
  }

  // Показать уведомление
  showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Цвет в зависимости от типа
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#4CAF50';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        break;
      default:
        notification.style.backgroundColor = '#2196F3';
    }
    
    // Добавляем CSS анимацию, если её нет
    if (!document.querySelector('#auth-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'auth-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Проверка доступа к защищенным страницам
  checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['profile.html', 'cms.html', 'admin.html'];
    
    if (protectedPages.includes(currentPage) && !this.isUserLoggedIn()) {
      this.showNotification('Для доступа к этой странице необходимо войти в систему', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return false;
    }
    
    return true;
  }

  // Проверка роли пользователя для доступа к админ-панели
  checkAdminAccess() {
    const userData = this.getUserData();
    const currentPage = window.location.pathname.split('/').pop();
    
    if ((currentPage === 'cms.html' || currentPage === 'admin.html') && userData) {
      if (userData.role !== 'admin' && userData.role !== 'teacher') {
        this.showNotification('У вас нет прав доступа к этой странице', 'error');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000);
        return false;
      }
    }
    
    return true;
  }
}

// Глобальная инициализация
window.authManager = new AuthManager();

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем доступ к странице
  window.authManager.checkPageAccess();
  window.authManager.checkAdminAccess();
  
  // Обновляем интерфейс через небольшую задержку для корректной работы
  setTimeout(() => {
    window.authManager.updateNavigationUI();
  }, 100);
  
  // Дополнительная проверка через 500мс для надежности
  setTimeout(() => {
    window.authManager.updateNavigationUI();
  }, 500);
});

// Обновляем интерфейс при изменении localStorage (например, при входе в другой вкладке)
window.addEventListener('storage', (e) => {
  if (e.key === 'cms_session') {
    window.authManager.updateNavigationUI();
  }
});
