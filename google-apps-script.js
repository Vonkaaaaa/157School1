// Google Apps Script для работы с Google Sheets
// Этот код нужно разместить в Google Apps Script и опубликовать как веб-приложение

const SPREADSHEET_ID = '1ba1A5GI2HDB4P9PWjx05bZGctSmJPCllJHlDpGQKLq4';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'append':
        return appendToSheet(data.sheetName, data.values);
      case 'update':
        return updateUser(data.sheetName, data.username, data.updateData);
      case 'delete':
        return deleteUser(data.sheetName, data.username);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Невідома дія'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Помилка в doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Помилка сервера: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheetName = e.parameter.sheetName;
    
    if (action === 'read') {
      return readSheet(sheetName);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Невідома дія'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Помилка в doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Помилка сервера: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Додавання рядка в таблицю
function appendToSheet(sheetName, values) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // Якщо листа не існує, створюємо його
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // Додаємо заголовки залежно від типу листа
      if (sheetName === 'Users') {
        sheet.getRange(1, 1, 1, 9).setValues([[
          'Username', 'Password', 'Email', 'FullName', 'Role', 
          'Status', 'RegisterDate', 'Phone', 'Class'
        ]]);
      } else if (sheetName === 'Logs') {
        sheet.getRange(1, 1, 1, 6).setValues([[
          'Timestamp', 'Username', 'Action', 'Description', 'UserAgent', 'URL'
        ]]);
      } else if (sheetName === 'Admins') {
        sheet.getRange(1, 1, 1, 4).setValues([[
          'Username', 'Role', 'Permissions', 'CreatedDate'
        ]]);
      } else if (sheetName === 'Sessions') {
        sheet.getRange(1, 1, 1, 5).setValues([[
          'SessionId', 'Username', 'CreatedAt', 'ExpiresAt', 'Status'
        ]]);
      }
    }
    
    // Додаємо новий рядок
    sheet.appendRow(values);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Дані успішно додано'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Помилка в appendToSheet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Помилка додавання даних: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Читання даних з листа
function readSheet(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Лист не знайдено'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, data: data}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Помилка в readSheet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Помилка читання даних: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Оновлення користувача
function updateUser(sheetName, username, updateData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Лист не знайдено'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const usernameIndex = headers.indexOf('Username');
    
    if (usernameIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Колонка Username не знайдена'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Знаходимо рядок користувача
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][usernameIndex] === username) {
        userRowIndex = i + 1; // +1 тому що getRange використовує 1-based індексацію
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Користувача не знайдено'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Оновлюємо дані
    Object.keys(updateData).forEach(key => {
      const columnIndex = headers.indexOf(key);
      if (columnIndex !== -1) {
        sheet.getRange(userRowIndex, columnIndex + 1).setValue(updateData[key]);
      }
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Користувача оновлено'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Помилка в updateUser: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Помилка оновлення користувача: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Видалення користувача
function deleteUser(sheetName, username) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Лист не знайдено'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const usernameIndex = headers.indexOf('Username');
    
    if (usernameIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Колонка Username не знайдена'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Знаходимо рядок користувача
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][usernameIndex] === username) {
        userRowIndex = i + 1; // +1 тому що deleteRow використовує 1-based індексацію
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Користувача не знайдено'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Видаляємо рядок
    sheet.deleteRow(userRowIndex);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Користувача видалено'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Помилка в deleteUser: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Помилка видалення користувача: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Функція для тестування
function testConnection() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Підключення до таблиці успішне: ' + spreadsheet.getName());
    return true;
  } catch (error) {
    Logger.log('Помилка підключення: ' + error.toString());
    return false;
  }
}
