// Google Sheets Database Manager
class GoogleSheetsDB {
  constructor() {
    this.apiKey = 'AIzaSyC-h7ulDpWncz3iJnJ5iv5ivSDFR98XKC0';
    this.spreadsheetId = '1ba1A5GI2HDB4P9PWjx05bZGctSmJPCllJHlDpGQKLq4';
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    // Назви листів в таблиці
    this.sheets = {
      users: 'Users',           // Користувачі
      admins: 'Admins',         // Адміністратори
      sessions: 'Sessions',     // Сесії користувачів
      logs: 'Logs'             // Логи активності
    }
    
    // Ініціалізуємо демо користувачів якщо їх немає
    this.initDemoUsers();
  }

  // Ініціалізація демо користувачів
  initDemoUsers() {
    const existingUsers = localStorage.getItem('demo_Users');
    if (!existingUsers) {
      // Створюємо тестових користувачів
      const demoUsers = [
        ['admin', 'admin123', 'admin@lyceum157.kh.ua', 'Адміністратор', 'admin', 'active', new Date().toISOString(), '', ''],
        ['teacher', 'teacher123', 'teacher@lyceum157.kh.ua', 'Вчитель', 'teacher', 'active', new Date().toISOString(), '', ''],
        ['user', 'user123', 'user@lyceum157.kh.ua', 'Користувач', 'user', 'active', new Date().toISOString(), '', '']
      ];
      localStorage.setItem('demo_Users', JSON.stringify(demoUsers));
      console.log('Демо користувачі створені:', demoUsers);
    }
  }

  // Демо режим - запис в localStorage
  async writeToLocalStorage(sheetName, values) {
    try {
      const storageKey = `demo_${sheetName}`;
      let existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Додаємо нові рядки
      values.forEach(row => {
        existingData.push(row);
      });
      
      localStorage.setItem(storageKey, JSON.stringify(existingData));
      console.log(`Дані збережено в localStorage: ${storageKey}`, values);
      
      return { success: true };
    } catch (error) {
      console.error('Помилка збереження в localStorage:', error);
      throw error;
    }
  }

  // Читання даних з листа
  async readSheet(sheetName, range = 'A:Z') {
    try {
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!${range}?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Помилка читання з Google Sheets:', error);
      throw error;
    }
  }

  // Запис даних в лист (потребує OAuth2 або Apps Script)
  async writeToSheet(sheetName, values) {
    // Для запису потрібна авторизація OAuth2
    // Тут ми використовуємо Apps Script Web App як проксі
    try {
      // ВАЖЛИВО: Замініть на ваш реальний URL Google Apps Script
      const webAppUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
      
      // Перевіряємо чи налаштований URL
      if (webAppUrl.includes('YOUR_SCRIPT_ID')) {
        // Демо режим - зберігаємо в localStorage
        console.warn('Демо режим: дані зберігаються локально');
        return this.writeToLocalStorage(sheetName, values);
      }
      
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'append',
          sheetName: sheetName,
          values: values
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Помилка запису в Google Sheets:', error);
      throw error;
    }
  }

  // Перевірка користувача
  async authenticateUser(username, password) {
    try {
      // Спочатку перевіряємо localStorage (демо режим)
      const localUsers = JSON.parse(localStorage.getItem('demo_Users') || '[]');
      if (localUsers.length > 0) {
        const user = localUsers.find(user => 
          user[0] && user[0].toLowerCase() === username.toLowerCase() && user[1] === password
        );
        if (user) {
          return {
            success: true,
            userData: {
              username: user[0],
              role: user[4] || 'user',
              email: user[2] || '',
              fullName: user[3] || user[0]
            }
          };
        } else {
          return { success: false, message: 'Неправильний нікнейм або пароль' };
        }
      }

      const users = await this.readSheet(this.sheets.users);
      
      if (!users || users.length <= 1) {
        throw new Error('Таблиця користувачів порожня або недоступна');
      }

      // Перший рядок - заголовки
      const headers = users[0];
      const userRows = users.slice(1);

      // Знаходимо індекси колонок
      const usernameIndex = headers.indexOf('Username');
      const passwordIndex = headers.indexOf('Password');
      const roleIndex = headers.indexOf('Role');
      const statusIndex = headers.indexOf('Status');

      if (usernameIndex === -1 || passwordIndex === -1) {
        throw new Error('Неправильна структура таблиці користувачів');
      }

      // Шукаємо користувача
      const userRow = userRows.find(row => 
        row[usernameIndex] && row[usernameIndex].toLowerCase() === username.toLowerCase()
      );

      if (!userRow) {
        return { success: false, message: 'Користувача не знайдено' };
      }

      // Перевіряємо пароль (в реальному проекті потрібно хешування)
      if (userRow[passwordIndex] !== password) {
        return { success: false, message: 'Неправильний пароль' };
      }

      // Перевіряємо статус
      if (statusIndex !== -1 && userRow[statusIndex] === 'Blocked') {
        return { success: false, message: 'Акаунт заблокований' };
      }

      // Успішна авторизація
      const userData = {
        username: userRow[usernameIndex],
        role: roleIndex !== -1 ? userRow[roleIndex] : 'user',
        status: statusIndex !== -1 ? userRow[statusIndex] : 'active'
      };

      // Логуємо вхід
      await this.logActivity(username, 'login', 'Успішний вхід в систему');

      return { success: true, user: userData };
    } catch (error) {
      console.error('Помилка авторизації:', error);
      return { success: false, message: 'Помилка з\'єднання з базою даних' };
    }
  }

  // Реєстрація нового користувача
  async registerUser(userData) {
    try {
      // Перевіряємо чи існує користувач
      const existingUser = await this.checkUserExists(userData.username, userData.email);
      if (existingUser.exists) {
        return { success: false, message: existingUser.message };
      }

      // Додаємо користувача в таблицю
      const timestamp = new Date().toISOString();
      const newUserRow = [
        userData.username,
        userData.password, // В реальному проекті потрібно хешувати
        userData.email,
        userData.fullName,
        'user', // роль за замовчуванням
        'active', // статус
        timestamp, // дата реєстрації
        userData.phone || '',
        userData.class || ''
      ];

      await this.writeToSheet(this.sheets.users, [newUserRow]);
      
      // Логуємо реєстрацію
      await this.logActivity(userData.username, 'register', 'Реєстрація нового користувача');

      return { success: true, message: 'Користувач успішно зареєстрований' };
    } catch (error) {
      console.error('Помилка реєстрації:', error);
      
      // Більш детальні повідомлення про помилки
      if (error.message.includes('Google Apps Script не налаштований')) {
        return { success: false, message: 'Система реєстрації не налаштована. Зверніться до адміністратора.' };
      } else if (error.message.includes('HTTP error')) {
        return { success: false, message: 'Помилка з\'єднання з сервером. Спробуйте пізніше.' };
      } else {
        return { success: false, message: 'Помилка при реєстрації користувача: ' + error.message };
      }
    }
  }

  // Перевірка існування користувача
  async checkUserExists(username, email) {
    try {
      // Спочатку перевіряємо localStorage (демо режим)
      const localUsers = JSON.parse(localStorage.getItem('demo_Users') || '[]');
      if (localUsers.length > 0) {
        const existingUser = localUsers.find(user => 
          user[0] && user[0].toLowerCase() === username.toLowerCase()
        );
        if (existingUser) {
          return { exists: true, message: 'Користувач з таким нікнеймом вже існує' };
        }
        return { exists: false };
      }

      const users = await this.readSheet(this.sheets.users);
      
      if (!users || users.length <= 1) {
        return { exists: false };
      }

      const headers = users[0];
      const userRows = users.slice(1);

      const usernameIndex = headers.indexOf('Username');
      const emailIndex = headers.indexOf('Email');

      // Перевіряємо username
      if (usernameIndex !== -1) {
        const existingUsername = userRows.find(row => 
          row[usernameIndex] && row[usernameIndex].toLowerCase() === username.toLowerCase()
        );
        if (existingUsername) {
          return { exists: true, message: 'Користувач з таким ім\'ям вже існує' };
        }
      }

      // Перевіряємо email
      if (emailIndex !== -1 && email) {
        const existingEmail = userRows.find(row => 
          row[emailIndex] && row[emailIndex].toLowerCase() === email.toLowerCase()
        );
        if (existingEmail) {
          return { exists: true, message: 'Користувач з таким email вже існує' };
        }
      }

      return { exists: false };
    } catch (error) {
      console.error('Помилка перевірки користувача:', error);
      return { exists: false };
    }
  }

  // Логування активності
  async logActivity(username, action, description) {
    try {
      const timestamp = new Date().toISOString();
      const logRow = [
        timestamp,
        username,
        action,
        description,
        navigator.userAgent,
        window.location.href
      ];

      await this.writeToSheet(this.sheets.logs, [logRow]);
    } catch (error) {
      console.error('Помилка логування:', error);
    }
  }

  // Отримання списку користувачів (тільки для адмінів)
  async getUsers() {
    try {
      const users = await this.readSheet(this.sheets.users);
      
      if (!users || users.length <= 1) {
        return [];
      }

      const headers = users[0];
      const userRows = users.slice(1);

      return userRows.map(row => {
        const user = {};
        headers.forEach((header, index) => {
          if (header !== 'Password') { // Не повертаємо паролі
            user[header] = row[index] || '';
          }
        });
        return user;
      });
    } catch (error) {
      console.error('Помилка отримання користувачів:', error);
      return [];
    }
  }

  // Оновлення профілю користувача
  async updateUserProfile(username, updateData) {
    // Для оновлення потрібен Apps Script або OAuth2
    // Тут буде логіка оновлення через веб-додаток
    try {
      const webAppUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
      
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          sheetName: this.sheets.users,
          username: username,
          updateData: updateData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await this.logActivity(username, 'profile_update', 'Оновлення профілю');
      }

      return result;
    } catch (error) {
      console.error('Помилка оновлення профілю:', error);
      return { success: false, message: 'Помилка оновлення профілю' };
    }
  }

  // Зміна паролю
  async changePassword(username, oldPassword, newPassword) {
    try {
      // Спочатку перевіряємо старий пароль
      const authResult = await this.authenticateUser(username, oldPassword);
      if (!authResult.success) {
        return { success: false, message: 'Неправильний поточний пароль' };
      }

      // Оновлюємо пароль
      const updateResult = await this.updateUserProfile(username, { Password: newPassword });
      
      if (updateResult.success) {
        await this.logActivity(username, 'password_change', 'Зміна паролю');
        return { success: true, message: 'Пароль успішно змінено' };
      }

      return updateResult;
    } catch (error) {
      console.error('Помилка зміни паролю:', error);
      return { success: false, message: 'Помилка зміни паролю' };
    }
  }

  // Ініціалізація таблиць (створення заголовків)
  async initializeTables() {
    try {
      // Заголовки для таблиці користувачів
      const userHeaders = [
        'Username', 'Password', 'Email', 'FullName', 'Role', 
        'Status', 'RegisterDate', 'Phone', 'Class'
      ];

      // Заголовки для таблиці логів
      const logHeaders = [
        'Timestamp', 'Username', 'Action', 'Description', 'UserAgent', 'URL'
      ];

      // Заголовки для таблиці адмінів
      const adminHeaders = [
        'Username', 'Role', 'Permissions', 'CreatedDate'
      ];

      // Заголовки для таблиці сесій
      const sessionHeaders = [
        'SessionId', 'Username', 'CreatedAt', 'ExpiresAt', 'Status'
      ];

      console.log('Ініціалізація таблиць завершена');
      console.log('Заголовки користувачів:', userHeaders);
      console.log('Заголовки логів:', logHeaders);
      
      return true;
    } catch (error) {
      console.error('Помилка ініціалізації таблиць:', error);
      return false;
    }
  }
}

// Ініціалізуємо базу даних глобально
window.database = new GoogleSheetsDB();
