// Панель администрации - JavaScript функциональность

class AdminPanel {
  constructor() {
    this.pages = [];
    this.currentPage = null;
    this.currentEditor = 'html';
    this.init();
  }

  init() {
    this.loadPages();
    this.setupEventListeners();
    this.setupTabs();
    this.setupModals();
    this.setupEditor();
  }

  // Загрузка списка страниц
  loadPages() {
    // Загружаем существующие страницы
    this.pages = [
      {
        id: 1,
        title: 'Главная',
        url: 'index.html',
        description: 'Главная страница сайта',
        lastModified: '2024-12-15',
        status: 'published',
        filePath: '/site/index.html'
      },
      {
        id: 2,
        title: 'О школе',
        url: 'about.html',
        description: 'Информация о школе',
        lastModified: '2024-12-14',
        status: 'published',
        filePath: '/site/about.html'
      },
      {
        id: 3,
        title: 'Новости',
        url: 'news.html',
        description: 'Новости и события',
        lastModified: '2024-12-13',
        status: 'published',
        filePath: '/site/news.html'
      },
      {
        id: 4,
        title: 'Расписание',
        url: 'schedule.html',
        description: 'Расписание уроков',
        lastModified: '2024-12-12',
        status: 'published',
        filePath: '/site/schedule.html'
      },
      {
        id: 5,
        title: 'Учителя',
        url: 'teachers.html',
        description: 'Наши учителя',
        lastModified: '2024-12-11',
        status: 'published',
        filePath: '/site/teachers.html'
      },
      {
        id: 6,
        title: 'Поступление',
        url: 'admission.html',
        description: 'Правила поступления',
        lastModified: '2024-12-10',
        status: 'published',
        filePath: '/site/admission.html'
      },
      {
        id: 7,
        title: 'Контакты',
        url: 'contacts.html',
        description: 'Контактная информация',
        lastModified: '2024-12-09',
        status: 'published',
        filePath: '/site/contacts.html'
      }
    ];

    this.renderPagesList();
    this.updatePageSelector();
  }

  // Отрисовка списка страниц
  renderPagesList() {
    const pagesList = document.getElementById('pages-list');
    if (!pagesList) return;

    pagesList.innerHTML = this.pages.map(page => `
      <div class="page-item" data-page-id="${page.id}">
        <div class="page-info">
          <h3>${page.title}</h3>
          <p>${page.description}</p>
          <small>Последнее изменение: ${page.lastModified}</small>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-icon btn-edit" onclick="adminPanel.editPage(${page.id})">
            Редактировать
          </button>
          <button class="btn btn-secondary btn-icon" onclick="adminPanel.duplicatePage(${page.id})">
            Дублировать
          </button>
          <button class="btn btn-danger btn-icon btn-delete" onclick="adminPanel.deletePage(${page.id})">
            Удалить
          </button>
        </div>
      </div>
    `).join('');
  }

  // Обновление селектора страниц
  updatePageSelector() {
    const selector = document.getElementById('page-selector');
    if (!selector) return;

    selector.innerHTML = '<option value="">Выберите страницу для редактирования</option>' +
      this.pages.map(page => 
        `<option value="${page.id}">${page.title}</option>`
      ).join('');
  }

  // Настройка вкладок
  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Убираем активный класс со всех вкладок
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Добавляем активный класс к выбранной вкладке
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });
  }

  // Настройка модальных окон
  setupModals() {
    // Модальное окно добавления страницы
    const addPageBtn = document.getElementById('add-page-btn');
    const addPageModal = document.getElementById('add-page-modal');
    const cancelAddPage = document.getElementById('cancel-add-page');
    const confirmAddPage = document.getElementById('confirm-add-page');

    if (addPageBtn) {
      addPageBtn.addEventListener('click', () => {
        this.showModal('add-page-modal');
      });
    }

    if (cancelAddPage) {
      cancelAddPage.addEventListener('click', () => {
        this.hideModal('add-page-modal');
      });
    }

    if (confirmAddPage) {
      confirmAddPage.addEventListener('click', () => {
        this.addNewPage();
      });
    }

    // Модальное окно удаления страницы
    const deletePageModal = document.getElementById('delete-page-modal');
    const cancelDeletePage = document.getElementById('cancel-delete-page');
    const confirmDeletePage = document.getElementById('confirm-delete-page');

    if (cancelDeletePage) {
      cancelDeletePage.addEventListener('click', () => {
        this.hideModal('delete-page-modal');
      });
    }

    if (confirmDeletePage) {
      confirmDeletePage.addEventListener('click', () => {
        this.confirmDeletePage();
      });
    }

    // Закрытие модальных окон по клику на крестик
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Закрытие модальных окон по клику вне контента
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
  }

  // Настройка редактора
  setupEditor() {
    // Селектор страниц для редактирования
    const pageSelector = document.getElementById('page-selector');
    if (pageSelector) {
      pageSelector.addEventListener('change', (e) => {
        const pageId = parseInt(e.target.value);
        if (pageId) {
          this.loadPageForEditing(pageId);
        } else {
          this.hideEditor();
        }
      });
    }

    // Вкладки редактора
    const editorTabs = document.querySelectorAll('.editor-tab');
    editorTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const editorType = tab.dataset.editor;
        this.switchEditor(editorType);
      });
    });

    // Кнопки редактора
    const saveContentBtn = document.getElementById('save-content-btn');
    const previewBtn = document.getElementById('preview-btn');
    const resetContentBtn = document.getElementById('reset-content-btn');

    if (saveContentBtn) {
      saveContentBtn.addEventListener('click', () => {
        this.savePageContent();
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.previewPage();
      });
    }

    if (resetContentBtn) {
      resetContentBtn.addEventListener('click', () => {
        this.resetPageContent();
      });
    }
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
          window.location.href = 'index.html';
        }
      });
    }

    // Сохранение настроек
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // Создание резервной копии
    const backupNowBtn = document.getElementById('backup-now-btn');
    if (backupNowBtn) {
      backupNowBtn.addEventListener('click', () => {
        this.createBackup();
      });
    }
  }

  // Показать модальное окно
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
  }

  // Скрыть модальное окно
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  // Добавление новой страницы
  addNewPage() {
    const title = document.getElementById('page-title').value;
    const url = document.getElementById('page-url').value;
    const description = document.getElementById('page-description').value;
    const template = document.getElementById('page-template').value;

    if (!title || !url) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    const fileName = url.endsWith('.html') ? url : url + '.html';
    const filePath = `/site/${fileName}`;
    
    // Копируем существующий файл как шаблон
    this.copyTemplateFile(template, filePath, title, description).then(() => {
      const newPage = {
        id: Date.now(),
        title: title,
        url: fileName,
        description: description,
        lastModified: new Date().toISOString().split('T')[0],
        status: 'published',
        filePath: filePath
      };

      this.pages.push(newPage);
      this.renderPagesList();
      this.updatePageSelector();
      
      // Добавляем карточку на главную страницу
      this.addPageCardToIndex(newPage);
      
      this.hideModal('add-page-modal');
      
      // Очистка формы
      document.getElementById('add-page-form').reset();
      
      alert('Страница успешно создана и добавлена на главную!');
    }).catch(error => {
      console.error('Ошибка создания файла:', error);
      alert('Ошибка при создании страницы. Проверьте консоль для подробностей.');
    });
  }

  // Редактирование страницы
  editPage(pageId) {
    // Переключаемся на вкладку редактирования
    document.querySelector('[data-tab="content"]').click();
    
    // Выбираем страницу в селекторе
    const pageSelector = document.getElementById('page-selector');
    if (pageSelector) {
      pageSelector.value = pageId;
      pageSelector.dispatchEvent(new Event('change'));
    }
  }

  // Дублирование страницы
  duplicatePage(pageId) {
    const page = this.pages.find(p => p.id === pageId);
    if (page) {
      const duplicatedPage = {
        ...page,
        id: Date.now(),
        title: page.title + ' (копия)',
        url: page.url.replace('.html', '_copy.html'),
        status: 'draft'
      };
      
      this.pages.push(duplicatedPage);
      this.renderPagesList();
      this.updatePageSelector();
      alert('Страница успешно дублирована!');
    }
  }

  // Удаление страницы
  deletePage(pageId) {
    const page = this.pages.find(p => p.id === pageId);
    if (page) {
      document.getElementById('delete-page-name').textContent = page.title;
      this.pageToDelete = pageId;
      this.showModal('delete-page-modal');
    }
  }

  // Подтверждение удаления страницы
  confirmDeletePage() {
    if (this.pageToDelete) {
      this.pages = this.pages.filter(p => p.id !== this.pageToDelete);
      this.renderPagesList();
      this.updatePageSelector();
      this.hideModal('delete-page-modal');
      this.pageToDelete = null;
      alert('Страница успешно удалена!');
    }
  }

  // Загрузка страницы для редактирования
  loadPageForEditing(pageId) {
    const page = this.pages.find(p => p.id === pageId);
    if (!page) return;

    this.currentPage = page;
    this.showEditor();
    this.loadPageContent();
  }

  // Показать редактор
  showEditor() {
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer) {
      editorContainer.style.display = 'block';
    }
  }

  // Скрыть редактор
  hideEditor() {
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer) {
      editorContainer.style.display = 'none';
    }
    this.currentPage = null;
  }

  // Загрузка содержимого страницы
  loadPageContent() {
    if (!this.currentPage) return;

    // Загружаем реальный файл
    this.loadFileContent(this.currentPage.filePath).then(content => {
      // Парсим HTML для извлечения CSS и JS
      const { html, css, js } = this.parseFileContent(content);
      
      // Загружаем CSS стили из файла styles.css
      this.loadCSSStyles().then(globalCSS => {
        // Объединяем глобальные стили с локальными
        const combinedCSS = globalCSS + '\n\n/* Локальные стили страницы */\n' + css;
        
        // Заполняем редакторы
        document.getElementById('html-editor').value = html;
        document.getElementById('css-editor').value = combinedCSS;
        document.getElementById('js-editor').value = js;

        // Обновляем дерево содержимого
        this.updateContentTree();
      });
    }).catch(error => {
      console.error('Ошибка загрузки файла:', error);
      alert('Ошибка при загрузке содержимого страницы');
    });
  }

  // Обновление дерева содержимого
  updateContentTree() {
    const contentTree = document.getElementById('content-tree');
    if (!contentTree) return;

    const htmlContent = document.getElementById('html-editor').value;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const treeHTML = this.buildContentTree(doc.body);
    contentTree.innerHTML = treeHTML;
  }

  // Построение дерева содержимого
  buildContentTree(element, level = 0) {
    let html = '';
    const indent = '  '.repeat(level);
    
    if (element.tagName) {
      const tagName = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';
      const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
      
      html += `<div class="content-tree-item" style="padding-left: ${level * 20}px">
        <span>${indent}&lt;${tagName}${id}${classes}&gt;</span>
      </div>`;
    }

    Array.from(element.children).forEach(child => {
      html += this.buildContentTree(child, level + 1);
    });

    return html;
  }

  // Переключение редактора
  switchEditor(editorType) {
    this.currentEditor = editorType;
    
    // Обновляем вкладки
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-editor="${editorType}"]`).classList.add('active');
    
    // Показываем соответствующий редактор
    document.querySelectorAll('.editor-textarea').forEach(textarea => {
      textarea.style.display = 'none';
    });
    document.getElementById(`${editorType}-editor`).style.display = 'block';
  }

  // Сохранение содержимого страницы
  savePageContent() {
    if (!this.currentPage) return;

    const htmlContent = document.getElementById('html-editor').value;
    const cssContent = document.getElementById('css-editor').value;
    const jsContent = document.getElementById('js-editor').value;

    // Объединяем содержимое в полный HTML
    const fullHTML = this.combineFileContent(htmlContent, cssContent, jsContent);
    
    // Сохраняем в файл
    this.saveFileContent(this.currentPage.filePath, fullHTML).then(() => {
      // Обновляем дату последнего изменения
      this.currentPage.lastModified = new Date().toISOString().split('T')[0];
      this.renderPagesList();
      alert('Содержимое страницы успешно сохранено!');
    }).catch(error => {
      console.error('Ошибка сохранения файла:', error);
      alert('Ошибка при сохранении страницы. Проверьте консоль для подробностей.');
    });
  }

  // Предварительный просмотр страницы
  previewPage() {
    if (!this.currentPage) return;

    const htmlContent = document.getElementById('html-editor').value;
    const cssContent = document.getElementById('css-editor').value;
    const jsContent = document.getElementById('js-editor').value;

    // Создаем полный HTML с CSS и JS
    const fullHTML = this.combineFileContent(htmlContent, cssContent, jsContent);

    // Открываем в новом окне как обычную страницу
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(fullHTML);
      newWindow.document.close();
      newWindow.focus();
    } else {
      alert('Пожалуйста, разрешите всплывающие окна для предпросмотра');
    }
  }

  // Сброс содержимого страницы
  resetPageContent() {
    if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
      this.loadPageContent();
      alert('Содержимое страницы сброшено к последней сохраненной версии');
    }
  }

  // Сохранение настроек
  saveSettings() {
    const settings = {
      siteTitle: document.getElementById('site-title').value,
      siteDescription: document.getElementById('site-description').value,
      adminEmail: document.getElementById('admin-email').value,
      backupFrequency: document.getElementById('backup-frequency').value
    };

    // Симуляция сохранения настроек
    console.log('Сохранение настроек:', settings);
    alert('Настройки успешно сохранены!');
  }

  // Создание резервной копии
  createBackup() {
    const backupData = {
      pages: this.pages,
      settings: {
        siteTitle: document.getElementById('site-title').value,
        siteDescription: document.getElementById('site-description').value,
        adminEmail: document.getElementById('admin-email').value,
        backupFrequency: document.getElementById('backup-frequency').value
      },
      timestamp: new Date().toISOString()
    };

    // Создаем и скачиваем файл резервной копии
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Резервная копия успешно создана!');
  }

  // Создание HTML файла
  createHTMLFile(filePath, content) {
    return new Promise((resolve, reject) => {
      // Создаем blob с содержимым файла
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания файла
      const fileName = filePath.split('/').pop();
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      // Добавляем в DOM, кликаем и удаляем
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Освобождаем память
      URL.revokeObjectURL(url);
      
      // Показываем уведомление пользователю
      this.showCreateNotification(fileName);
      
      setTimeout(() => {
        console.log('Файл создан и готов к сохранению:', fileName);
        console.log('Содержимое:', content.substring(0, 200) + '...');
        resolve();
      }, 500);
    });
  }

  // Загрузка содержимого файла
  loadFileContent(filePath) {
    return new Promise((resolve, reject) => {
      // В реальном приложении здесь будет fetch запрос
      // Для демонстрации используем localStorage
      const fileKey = `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const content = localStorage.getItem(fileKey);
      
      if (content) {
        setTimeout(() => resolve(content), 300);
      } else {
        // Если файл не найден в localStorage, загружаем из существующих файлов
        this.loadExistingFile(filePath).then(resolve).catch(reject);
      }
    });
  }

  // Загрузка существующего файла
  loadExistingFile(filePath) {
    return new Promise((resolve, reject) => {
      // Загружаем реальный файл через fetch
      const fileName = filePath.split('/').pop();
      const relativePath = `./${fileName}`;
      
      fetch(relativePath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(content => {
          console.log('Файл загружен:', fileName);
          resolve(content);
        })
        .catch(error => {
          console.error('Ошибка загрузки файла:', error);
          // Если файл не найден, создаем базовый шаблон
          const pageTitle = fileName.replace('.html', '');
          const content = this.generatePageTemplate(
            pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1),
            `Описание для ${pageTitle}`,
            'default'
          );
          resolve(content);
        });
    });
  }

  // Сохранение содержимого файла
  saveFileContent(filePath, content) {
    return new Promise((resolve, reject) => {
      // Создаем blob с содержимым файла
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания файла
      const fileName = filePath.split('/').pop();
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      // Добавляем в DOM, кликаем и удаляем
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Освобождаем память
      URL.revokeObjectURL(url);
      
      // Показываем уведомление пользователю
      this.showSaveNotification(fileName);
      
      setTimeout(() => {
        console.log('Файл готов к сохранению:', fileName);
        console.log('Содержимое:', content.substring(0, 200) + '...');
        resolve();
      }, 500);
    });
  }

  // Генерация шаблона страницы
  generatePageTemplate(title, description, template) {
    const baseTemplate = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} — Lyceum School</title>
    <meta name="description" content="${description}">
    <link rel="stylesheet" href="assets/css/styles.css">
  </head>
  <body>
    <div class="bg-decor" aria-hidden="true">
      <span class="blob one"></span>
      <span class="blob two"></span>
      <span class="blob three"></span>
      <span class="blob four"></span>
      <span class="blob five"></span>
      <span class="blob six"></span>
      <span class="blob seven"></span>
      <span class="blob eight"></span>
    </div>
    <header class="site-header" role="banner">
      <div class="container nav">
        <a class="brand" href="index.html">
          <img class="brand-badge-img" src="assets/img/157-badge.svg" alt="157">
          <span>Lyceum School</span>
        </a>
        <nav aria-label="Основная навигация">
          <button class="menu-toggle" aria-expanded="false" aria-controls="nav-links" data-menu-toggle>
            Меню
          </button>
          <div id="nav-links" class="nav-links" data-nav-links>
            <a href="index.html">Главная</a>
            <a href="about.html">О школе</a>
            <a href="news.html">Новости</a>
            <a href="schedule.html">Расписание</a>
            <a href="teachers.html">Учителя</a>
            <a href="admission.html">Поступление</a>
            <a href="contacts.html">Контакты</a>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="container hero-inner">
          <div class="reveal">
            <span class="pill">${title}</span>
            <h1><span class="text-gradient">${title}</span></h1>
            <p>${description}</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div>© <span id="year"></span> Lyceum School. Все права защищены.</div>
      </div>
    </footer>

    <script src="assets/js/main.js"></script>
    <script>
      document.getElementById('year').textContent = new Date().getFullYear();
    </script>
  </body>
</html>`;

    // Добавляем специфичный контент в зависимости от шаблона
    let specificContent = '';
    
    switch (template) {
      case 'news':
        specificContent = `
      <section>
        <div class="container">
          <h2 class="section-title accent-underline">Новости</h2>
          <div class="cards">
            <div class="card reveal">
              <h3>Заголовок новости</h3>
              <p>Содержимое новости...</p>
            </div>
          </div>
        </div>
      </section>`;
        break;
      case 'contact':
        specificContent = `
      <section>
        <div class="container">
          <h2 class="section-title accent-underline">Контакты</h2>
          <div class="cards">
            <div class="card reveal">
              <h3>Адрес</h3>
              <p>ул. Образования, д. 157<br>Москва, 123456</p>
            </div>
          </div>
        </div>
      </section>`;
        break;
      default:
        specificContent = `
      <section>
        <div class="container">
          <h2 class="section-title accent-underline">Содержимое</h2>
          <p>Добавьте здесь содержимое страницы...</p>
        </div>
      </section>`;
    }

    return baseTemplate.replace('</main>', specificContent + '\n    </main>');
  }

  // Парсинг содержимого файла
  parseFileContent(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Извлекаем CSS из тега style
    const styleElement = doc.querySelector('style');
    const css = styleElement ? styleElement.textContent : '';
    
    // Извлекаем JavaScript из тегов script
    const scriptElements = doc.querySelectorAll('script');
    let js = '';
    scriptElements.forEach(script => {
      if (script.src === '' || !script.src) {
        js += script.textContent + '\n';
      }
    });
    
    // Возвращаем HTML без встроенных стилей и скриптов
    const html = content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    return { html, css, js };
  }

  // Объединение содержимого в полный HTML
  combineFileContent(html, css, js) {
    // Добавляем CSS в head
    let combinedHTML = html;
    if (css.trim()) {
      combinedHTML = combinedHTML.replace(
        '</head>',
        `    <style>\n${css}\n    </style>\n  </head>`
      );
    }
    
    // Добавляем JavaScript перед закрывающим тегом body
    if (js.trim()) {
      combinedHTML = combinedHTML.replace(
        '</body>',
        `    <script>\n${js}\n    </script>\n  </body>`
      );
    }
    
    return combinedHTML;
  }

  // Загрузка CSS стилей из файла styles.css
  loadCSSStyles() {
    return new Promise((resolve, reject) => {
      // Загружаем реальный файл styles.css
      fetch('./assets/css/styles.css')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(cssContent => {
          console.log('CSS стили загружены');
          resolve(cssContent);
        })
        .catch(error => {
          console.error('Ошибка загрузки CSS:', error);
          // Если файл не найден, возвращаем базовые стили
          const fallbackCSS = `/* Базовые стили (файл styles.css не найден) */
:root {
  --brand: #1e88e5;
  --brand-dark: #1565c0;
  --bg: #ffffff;
  --text: #1e3a8a;
  --muted: #6b7280;
  --border: #e5e7eb;
  --surface: #f8fafc;
  --success: #22c55e;
  --danger: #ef4444;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  color: var(--text);
  background: radial-gradient(1200px 600px at -10% -10%, rgba(30,136,229,0.10), transparent 60%);
  min-height: 100vh;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.hero { background: linear-gradient(0deg, rgba(248,250,252,.3), rgba(255,255,255,.3)); border-bottom: 1px solid rgba(229,231,235,.6); backdrop-filter: blur(4px); }
.hero-inner { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 32px; padding: 32px 0; }
.text-gradient { background: linear-gradient(135deg, var(--brand), #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.pill { background: rgba(30,136,229,0.1); color: var(--brand); padding: 4px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin: 32px 0; }
.card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.section-title { font-size: 2rem; font-weight: 700; margin-bottom: 16px; color: var(--text); }
.accent-underline { border-bottom: 3px solid var(--brand); padding-bottom: 8px; }`;
          resolve(fallbackCSS);
        });
    });
  }

  // Копирование шаблонного файла
  copyTemplateFile(templateFile, newFilePath, title, description) {
    return new Promise((resolve, reject) => {
      // В реальном приложении здесь будет API запрос для копирования файла
      // Для демонстрации загружаем содержимое шаблона и модифицируем его
      const templatePath = `/site/${templateFile}`;
      
      this.loadFileContent(templatePath).then(content => {
        // Модифицируем содержимое для новой страницы
        const modifiedContent = this.modifyTemplateContent(content, title, description);
        
        // Создаем новый файл с модифицированным содержимым
        this.createHTMLFile(newFilePath, modifiedContent).then(() => {
          console.log('Шаблон скопирован:', templateFile, '->', newFilePath);
          resolve();
        }).catch(reject);
      }).catch(reject);
    });
  }

  // Модификация содержимого шаблона
  modifyTemplateContent(content, title, description) {
    // Заменяем заголовок страницы
    let modifiedContent = content.replace(
      /<title>.*?<\/title>/,
      `<title>${title} — Lyceum School</title>`
    );
    
    // Заменяем описание
    modifiedContent = modifiedContent.replace(
      /<meta name="description" content=".*?">/,
      `<meta name="description" content="${description}">`
    );
    
    // Заменяем заголовок в hero секции
    modifiedContent = modifiedContent.replace(
      /<h1><span class="text-gradient">.*?<\/span><\/h1>/,
      `<h1><span class="text-gradient">${title}</span></h1>`
    );
    
    // Заменяем описание в hero секции
    modifiedContent = modifiedContent.replace(
      /<p>.*?<\/p>/,
      `<p>${description}</p>`
    );
    
    return modifiedContent;
  }

  // Добавление карточки новой страницы на главную
  addPageCardToIndex(newPage) {
    // В реальном приложении здесь будет API запрос для обновления index.html
    console.log('Добавление карточки новой страницы на главную:', newPage);
    
    // Симуляция добавления карточки
    const cardHTML = `
      <div class="card reveal">
        <div class="icon-circle">📄</div>
        <h3>${newPage.title}</h3>
        <p>${newPage.description}</p>
        <p><a href="/site/${newPage.url}">Открыть</a></p>
      </div>`;
    
    console.log('Карточка для добавления:', cardHTML);
    alert('Новая страница будет добавлена на главную страницу сайта!');
  }

  // Показать уведомление о создании файла
  showCreateNotification(fileName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>✅</span>
        <span>Файл ${fileName} создан и готов к скачиванию!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Показать уведомление о сохранении файла
  showSaveNotification(fileName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>💾</span>
        <span>Файл ${fileName} сохранен и готов к скачиванию!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Инициализация панели администрации
let adminPanel;
document.addEventListener('DOMContentLoaded', function() {
  adminPanel = new AdminPanel();
});
