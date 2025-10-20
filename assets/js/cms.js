// CMS - Система управління контентом
class CMSManager {
  constructor() {
    this.currentPage = null;
    this.contentEditor = null;
    this.newsEditor = null;
    this.currentNewsId = null;
    this.userSession = null;
    this.init();
  }

  init() {
    if (!this.checkAuthentication()) {
      this.redirectToLogin();
      return;
    }
    
    this.setupTabs();
    this.setupEditors();
    this.setupPageSelector();
    this.setupMediaUpload();
    this.setupEventListeners();
    this.loadData();
    this.displayUserInfo();
    this.loadPagesList();
  }

  // Перевірка авторизації
  checkAuthentication() {
    const session = localStorage.getItem('cms_session');
    if (!session) {
      return false;
    }

    try {
      const sessionData = JSON.parse(session);
      const now = new Date().getTime();
      
      // Перевіряємо, чи не минув час сесії (24 години)
      if (now - sessionData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('cms_session');
        return false;
      }
      
      this.userSession = sessionData;
      return true;
    } catch (error) {
      localStorage.removeItem('cms_session');
      return false;
    }
  }

  // Перенаправлення на сторінку входу
  redirectToLogin() {
    window.location.href = 'login.html';
  }

  // Відображення інформації про користувача
  displayUserInfo() {
    if (this.userSession) {
      const header = document.querySelector('.cms-header');
      const userInfo = document.createElement('div');
      userInfo.style.cssText = 'position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; color: white; font-weight: 600;';
      userInfo.innerHTML = `
        👤 ${this.userSession.username} (${this.userSession.role})
        <button onclick="logout()" style="margin-left: 15px; background: rgba(255,255,255,0.3); border: none; padding: 5px 10px; border-radius: 15px; color: white; cursor: pointer;">Вийти</button>
      `;
      header.style.position = 'relative';
      header.appendChild(userInfo);
      
      // Додаємо індикатор режиму роботи
      this.addModeIndicator();
    }
  }

  // Додавання індикатора режиму роботи
  addModeIndicator() {
    const header = document.querySelector('.cms-header');
    const modeIndicator = document.createElement('div');
    modeIndicator.id = 'mode-indicator';
    modeIndicator.style.cssText = 'position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; color: white; font-size: 14px;';
    modeIndicator.innerHTML = '🔄 Перевірка режиму...';
    header.appendChild(modeIndicator);
    
    // Перевіряємо, чи можемо завантажити файли
    this.checkFileAccess();
  }

  // Перевірка доступу до файлів
  async checkFileAccess() {
    const indicator = document.getElementById('mode-indicator');
    try {
      const response = await fetch('index.html');
      if (response.ok) {
        indicator.innerHTML = '✅ Режим: Реальні файли';
        indicator.style.background = 'rgba(34, 197, 94, 0.8)';
      } else {
        throw new Error('Файл не доступний');
      }
    } catch (error) {
      indicator.innerHTML = '⚠️ Режим: Демо-дані';
      indicator.style.background = 'rgba(245, 158, 11, 0.8)';
    }
  }

  // Налаштування вкладок
  setupTabs() {
    const tabs = document.querySelectorAll('.cms-tab');
    const contents = document.querySelectorAll('.cms-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        // Видаляємо активний клас з усіх вкладок
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Додаємо активний клас до поточної вкладки
        tab.classList.add('active');
        document.getElementById(tabId).classList.add('active');
      });
    });
  }

  // Налаштування редакторів
  setupEditors() {
    // Редактор для сторінок
    if (document.getElementById('content-editor')) {
      this.contentEditor = new Quill('#content-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
          ]
        },
        placeholder: 'Введіть текст сторінки...'
      });
    }

    // Редактор для створення нових сторінок
    if (document.getElementById('new-page-content-editor')) {
      this.newPageEditor = new Quill('#new-page-content-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        },
        placeholder: 'Введіть початковий контент сторінки...'
      });
    }

    // Редактор для новин
    if (document.getElementById('news-content-editor')) {
      this.newsEditor = new Quill('#news-content-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        },
        placeholder: 'Введіть текст новини...'
      });
    }
  }

  // Налаштування селектора сторінок
  setupPageSelector() {
    const pageSelect = document.getElementById('page-select');
    if (pageSelect) {
      pageSelect.addEventListener('change', (e) => {
        const pageId = e.target.value;
        if (pageId) {
          this.loadPage(pageId);
        } else {
          this.hidePage();
        }
      });
    }
  }

  // Налаштування завантаження медіафайлів
  setupMediaUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

    if (uploadArea && fileInput) {
      // Клік по області завантаження
      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });

      // Перетягування файлів
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        this.handleFiles(files);
      });

      // Вибір файлів через input
      fileInput.addEventListener('change', (e) => {
        this.handleFiles(e.target.files);
      });
    }
  }

  // Налаштування обробників подій
  setupEventListeners() {
    // Встановлення поточної дати для новин
    const newsDate = document.getElementById('news-date');
    if (newsDate) {
      newsDate.value = new Date().toISOString().split('T')[0];
    }

    // Автоматичне оновлення URL при введенні назви сторінки
    const newPageTitle = document.getElementById('new-page-title');
    const newPageUrl = document.getElementById('new-page-url');
    const urlPreview = document.getElementById('url-preview');
    const urlFilename = document.getElementById('url-filename');

    if (newPageTitle && newPageUrl) {
      newPageTitle.addEventListener('input', (e) => {
        const title = e.target.value;
        // Генеруємо URL з назви (транслітерація)
        const url = this.generateUrlFromTitle(title);
        newPageUrl.value = url;
        this.updateUrlPreview(url);
      });

      newPageUrl.addEventListener('input', (e) => {
        const url = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        e.target.value = url;
        this.updateUrlPreview(url);
      });
    }
  }

  // Генерація URL з назви сторінки
  generateUrlFromTitle(title) {
    // Транслітерація українських літер
    const translitMap = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
      'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
      'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya'
    };

    return title
      .toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  // Оновлення предпросмотру URL
  updateUrlPreview(url) {
    const urlPreview = document.getElementById('url-preview');
    const urlFilename = document.getElementById('url-filename');
    
    if (urlPreview && urlFilename) {
      if (url) {
        urlFilename.textContent = url + '.html';
        urlPreview.style.display = 'block';
      } else {
        urlPreview.style.display = 'none';
      }
    }
  }

  // Завантаження даних
  loadData() {
    // Завантажуємо збережені дані з localStorage
    const savedData = localStorage.getItem('cms_data');
    if (savedData) {
      this.data = JSON.parse(savedData);
    } else {
      this.data = this.getDefaultData();
    }
  }

  // Отримання даних за замовчуванням
  getDefaultData() {
    return {
      pages: {
        index: {
          title: 'Ласкаво просимо до ліцею №157',
          subtitle: 'Освіта майбутнього вже сьогодні',
          content: '<p>Ми створюємо освітнє середовище, де кожен учень може розкрити свій потенціал і досягти видатних результатів.</p>'
        },
        about: {
          title: 'Про наш ліцей',
          subtitle: 'Освіта майбутнього',
          content: '<p>Ліцей №157 працює з 1991 року та має багаті традиції якісної освіти.</p>'
        },
        news: {
          title: 'Новини',
          subtitle: 'Останні події',
          content: '<p>Слідкуйте за життям нашого ліцею</p>'
        }
      },
      customPages: [], // Користувацькі сторінки
      news: [
        {
          id: 1,
          title: 'Перемога на обласній олімпіаді',
          date: '2024-12-15',
          content: '<p>Учні 11 класу зайняли перше місце на обласній олімпіаді з математики. Вітаємо переможців!</p>',
          image: null
        },
        {
          id: 2,
          title: 'Нове обладнання в лабораторіях',
          date: '2024-12-12',
          content: '<p>До ліцею надійшло сучасне обладнання для фізичних та хімічних лабораторій.</p>',
          image: null
        }
      ],
      settings: {
        siteName: 'Ліцей №157 м. Харків',
        siteDescription: 'Офіційний сайт Харківського ліцею №157: новини, розклад, вчителі, вступ та контакти.',
        address: 'вул. 92-ї Бригади, 30, Харків, 61172',
        phone: '+38 (057) 123-45-67',
        email: 'info@lyceum157.kh.ua',
        social: {
          instagram: 'https://www.instagram.com/kharkiv_liceum157',
          telegram: 'https://t.me/kha_luce157',
          tiktok: 'https://www.tiktok.com/@kharkiv_liceum157'
        }
      }
    };
  }

  // Оновлення селектора сторінок
  updatePageSelector() {
    const selector = document.getElementById('page-select');
    if (!selector) return;

    // Системні сторінки
    const systemPages = [
      { id: 'index', title: 'Головна сторінка' },
      { id: 'about', title: 'Про ліцей' },
      { id: 'news', title: 'Новини' },
      { id: 'schedule', title: 'Розклад' },
      { id: 'teachers', title: 'Вчителі' },
      { id: 'admission', title: 'Вступ' },
      { id: 'contacts', title: 'Контакти' }
    ];

    // Користувацькі сторінки
    const customPages = this.data.customPages || [];

    let options = '<option value="">-- Оберіть сторінку --</option>';
    
    // Додаємо системні сторінки
    systemPages.forEach(page => {
      options += `<option value="${page.id}">${page.title}</option>`;
    });
    
    // Додаємо користувацькі сторінки, якщо вони є
    if (customPages.length > 0) {
      options += '<optgroup label="Користувацькі сторінки">';
      customPages.forEach(page => {
        options += `<option value="${page.id}">${page.title}</option>`;
      });
      options += '</optgroup>';
    }

    selector.innerHTML = options;
  }

  // Збереження даних
  saveData() {
    localStorage.setItem('cms_data', JSON.stringify(this.data));
    this.showMessage('Дані успішно збережено!', 'success');
  }

  // Завантаження сторінки для редагування
  loadPage(pageId) {
    this.currentPage = pageId;
    
    // Перевіряємо, чи це користувацька сторінка
    const customPages = this.data.customPages || [];
    const customPage = customPages.find(p => p.id === pageId);
    
    if (customPage) {
      // Для користувацьких сторінок використовуємо збережені дані
      this.loadCustomPageContent(customPage).then(pageData => {
        document.getElementById('page-title').value = pageData.title || '';
        document.getElementById('page-subtitle').value = pageData.subtitle || '';
        
        if (this.contentEditor) {
          this.contentEditor.root.innerHTML = pageData.content || '';
        }
        
        this.showPage();
      });
    } else {
      // Для системних сторінок завантажуємо реальний HTML файл
      this.loadRealPageContent(pageId).then(pageData => {
        document.getElementById('page-title').value = pageData.title || '';
        document.getElementById('page-subtitle').value = pageData.subtitle || '';
        
        if (this.contentEditor) {
          this.contentEditor.root.innerHTML = pageData.content || '';
        }
        
        this.showPage();
      }).catch(error => {
        console.error('Помилка завантаження сторінки:', error);
        this.showMessage('Переключено на демо-режим. Для роботи з реальними файлами запустіть локальний сервер.', 'success');
      });
    }
  }

  // Завантаження користувацької сторінки
  async loadCustomPageContent(customPage) {
    // Для користувацьких сторінок повертаємо збережені дані
    return {
      title: customPage.title,
      subtitle: customPage.subtitle || '',
      content: customPage.content || '<p>Контент користувацької сторінки...</p>',
      originalHtml: this.generatePageHtml(customPage.title, customPage.subtitle, customPage.description, customPage.content || '', 'basic')
    };
  }

  // Завантаження реального вмісту сторінки
  async loadRealPageContent(pageId) {
    const fileName = pageId === 'index' ? 'index.html' : `${pageId}.html`;
    
    try {
      // Спробуємо завантажити файл
      const response = await fetch(fileName);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const htmlContent = await response.text();
      return this.parsePageContent(htmlContent);
    } catch (error) {
      console.error('Помилка завантаження файлу:', error);
      
      // Якщо не вдалося завантажити, використовуємо демо-дані
      return this.getDefaultPageContent(pageId);
    }
  }

  // Отримання демо-даних для сторінки
  getDefaultPageContent(pageId) {
    const defaultContent = {
      index: {
        title: 'Ласкаво просимо до ліцею №157',
        subtitle: 'Освіта майбутнього вже сьогодні',
        content: `
          <section class="about-preview">
            <div class="container">
              <h2 class="section-title accent-underline">Про наш ліцей</h2>
              <p class="muted">Освіта майбутнього вже сьогодні</p>
              <div class="about-content">
                <div class="about-text reveal">
                  <h3>Ліцей №157 — освіта майбутнього</h3>
                  <p>Ми створюємо освітнє середовище, де кожен учень може розкрити свій потенціал і досягти видатних результатів. Наш ліцей працює з 1991 року та має багаті традиції якісної освіти.</p>
                  <div class="achievements-mini">
                    <div class="achievement-item">
                      <strong>92%</strong> поступають у ВНЗ
                    </div>
                    <div class="achievement-item">
                      <strong>23</strong> переможці олімпіад
                    </div>
                    <div class="achievement-item">
                      <strong>175</strong> середній бал ЗНО
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Ласкаво просимо до ліцею №157', 'Освіта майбутнього вже сьогодні')
      },
      about: {
        title: 'Про наш ліцей',
        subtitle: 'Освіта майбутнього',
        content: `
          <section>
            <div class="container">
              <h2 class="section-title accent-underline">Історія ліцею</h2>
              <p>Ліцей №157 працює з 1991 року та має багаті традиції якісної освіти.</p>
              
              <h3>Наші досягнення</h3>
              <ul>
                <li>92% випускників поступають у ВНЗ</li>
                <li>23 переможці олімпіад щорічно</li>
                <li>Середній бал ЗНО - 175</li>
                <li>Сучасне обладнання в лабораторіях</li>
              </ul>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Про наш ліцей', 'Освіта майбутнього')
      },
      news: {
        title: 'Новини',
        subtitle: 'Останні події ліцею',
        content: `
          <section class="news-preview">
            <div class="container">
              <h2 class="section-title accent-underline">Останні новини</h2>
              <div class="cards">
                <div class="modern-card">
                  <h3>Перемога на олімпіаді</h3>
                  <p>Учні 11 класу зайняли перше місце на обласній олімпіаді з математики.</p>
                </div>
              </div>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Новини', 'Останні події ліцею')
      },
      schedule: {
        title: 'Розклад уроків',
        subtitle: 'Час дзвінків та організація навчального процесу',
        content: `
          <section>
            <div class="container">
              <h2 class="section-title accent-underline">Час дзвінків</h2>
              <div class="schedule-grid">
                <div class="schedule-item">
                  <span class="lesson-num">1 урок</span>
                  <span class="lesson-time">08:30 - 09:15</span>
                </div>
                <div class="schedule-item">
                  <span class="lesson-num">2 урок</span>
                  <span class="lesson-time">09:25 - 10:10</span>
                </div>
              </div>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Розклад уроків', 'Час дзвінків та організація навчального процесу')
      },
      teachers: {
        title: 'Наші вчителі',
        subtitle: 'Досвідчені педагоги та наставники',
        content: `
          <section>
            <div class="container">
              <h2 class="section-title accent-underline">Педагогічний колектив</h2>
              <div class="teachers-grid">
                <div class="teacher-card">
                  <h3>Іванова Марія Петрівна</h3>
                  <p class="teacher-subject">Математика</p>
                  <p>Вчитель вищої категорії, стаж 15 років</p>
                </div>
              </div>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Наші вчителі', 'Досвідчені педагоги та наставники')
      },
      admission: {
        title: 'Вступ до ліцею',
        subtitle: 'Приєднуйтесь до нашої освітньої спільноти',
        content: `
          <section>
            <div class="container">
              <h2 class="section-title accent-underline">Правила вступу</h2>
              <div class="admission-steps">
                <div class="step">
                  <h4>1. Подача документів</h4>
                  <p>З 1 березня по 31 травня</p>
                </div>
                <div class="step">
                  <h4>2. Вступні іспити</h4>
                  <p>Математика та українська мова</p>
                </div>
              </div>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Вступ до ліцею', 'Приєднуйтесь до нашої освітньої спільноти')
      },
      contacts: {
        title: 'Контакти',
        subtitle: 'Зв\'яжіться з нами',
        content: `
          <section>
            <div class="container">
              <h2 class="section-title accent-underline">Контактна інформація</h2>
              <div class="contact-info">
                <p><strong>Адреса:</strong> вул. 92-ї Бригади, 30, Харків, 61172</p>
                <p><strong>Телефон:</strong> +38 (057) 123-45-67</p>
                <p><strong>Email:</strong> info@lyceum157.kh.ua</p>
              </div>
            </div>
          </section>
        `,
        originalHtml: this.generateBasicHtml('Контакти', 'Зв\'яжіться з нами')
      }
    };

    return defaultContent[pageId] || defaultContent.index;
  }

  // Генерація базового HTML
  generateBasicHtml(title, subtitle) {
    return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} — Ліцей №157</title>
    <link rel="stylesheet" href="assets/css/styles.css">
  </head>
  <body>
    <header class="site-header">
      <div class="container nav">
        <a class="brand" href="index.html">
          <img class="brand-badge-img" src="assets/img/log.jpg" alt="Ліцей №157">
          <span>Ліцей №157</span>
        </a>
        <nav>
          <div class="nav-links">
            <a href="index.html">Головна</a>
            <a href="about.html">Про ліцей</a>
            <a href="news.html">Новини</a>
            <a href="schedule.html">Розклад</a>
            <a href="teachers.html">Вчителі</a>
            <a href="admission.html">Вступ</a>
            <a href="contacts.html">Контакти</a>
          </div>
        </nav>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="container hero-inner">
          <div class="reveal">
            <h1><span class="text-gradient">${title}</span></h1>
            <p>${subtitle}</p>
          </div>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div class="container">
        <div>© 2024 Ліцей №157 м. Харків. Всі права захищені.</div>
      </div>
    </footer>
    <script src="assets/js/main.js"></script>
  </body>
</html>`;
  }

  // Парсинг вмісту сторінки
  parsePageContent(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Витягуємо заголовок сторінки
    const titleElement = doc.querySelector('title');
    const title = titleElement ? titleElement.textContent.split('—')[0].trim() : '';
    
    // Витягуємо основний заголовок
    const h1Element = doc.querySelector('h1');
    const mainTitle = h1Element ? h1Element.textContent : title;
    
    // Витягуємо підзаголовок (перший p після h1)
    const subtitleElement = doc.querySelector('h1 + p, .hero p');
    const subtitle = subtitleElement ? subtitleElement.textContent : '';
    
    // Витягуємо основний контент (все в main, крім hero секції)
    const mainElement = doc.querySelector('main');
    let content = '';
    
    if (mainElement) {
      // Клонуємо main елемент
      const mainClone = mainElement.cloneNode(true);
      
      // Видаляємо hero секцію, якщо вона є
      const heroSection = mainClone.querySelector('.hero');
      if (heroSection) {
        heroSection.remove();
      }
      
      // Видаляємо footer, якщо він потрапив в main
      const footer = mainClone.querySelector('footer');
      if (footer) {
        footer.remove();
      }
      
      content = mainClone.innerHTML;
    }
    
    return {
      title: mainTitle,
      subtitle: subtitle,
      content: content,
      originalHtml: htmlContent
    };
  }

  // Показати редактор сторінки
  showPage() {
    const editor = document.getElementById('page-editor');
    if (editor) {
      editor.style.display = 'block';
    }
  }

  // Сховати редактор сторінки
  hidePage() {
    const editor = document.getElementById('page-editor');
    if (editor) {
      editor.style.display = 'none';
    }
    this.currentPage = null;
  }

  // Обробка завантажених файлів
  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        this.uploadFile(file);
      } else {
        this.showMessage('Підтримуються тільки зображення!', 'error');
      }
    });
  }

  // Завантаження файлу
  uploadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaGrid = document.getElementById('media-grid');
      const mediaItem = document.createElement('div');
      mediaItem.className = 'media-item';
      
      mediaItem.innerHTML = `
        <div class="media-preview">
          <img src="${e.target.result}" alt="${file.name}">
        </div>
        <h4>${file.name}</h4>
        <div class="news-actions">
          <button class="btn btn-primary btn-small" onclick="copyImageLink('${e.target.result}')">📋 Копіювати посилання</button>
          <button class="btn btn-warning btn-small" onclick="deleteMedia(this)">🗑️ Видалити</button>
        </div>
      `;
      
      mediaGrid.appendChild(mediaItem);
      this.showMessage(`Файл ${file.name} успішно завантажено!`, 'success');
    };
    reader.readAsDataURL(file);
  }

  // Показати повідомлення
  showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = `${type}-message`;
    message.textContent = text;
    
    // Додаємо повідомлення в початок контейнера
    const container = document.querySelector('.cms-container');
    container.insertBefore(message, container.firstChild);
    
    // Видаляємо повідомлення через 3 секунди
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  // Оновлення HTML файлу з новим контентом
  updatePageHtml(originalHtml, title, subtitle, content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, 'text/html');
    
    // Оновлюємо title
    const titleElement = doc.querySelector('title');
    if (titleElement && title) {
      const siteName = titleElement.textContent.includes('—') ? 
        titleElement.textContent.split('—')[1] : ' — Ліцей №157';
      titleElement.textContent = title + siteName;
    }
    
    // Оновлюємо основний заголовок
    const h1Element = doc.querySelector('h1');
    if (h1Element && title) {
      // Зберігаємо структуру з span, якщо вона є
      const spanElement = h1Element.querySelector('span.text-gradient');
      if (spanElement) {
        spanElement.textContent = title;
      } else {
        h1Element.textContent = title;
      }
    }
    
    // Оновлюємо підзаголовок
    const subtitleElement = doc.querySelector('h1 + p, .hero p');
    if (subtitleElement && subtitle) {
      subtitleElement.textContent = subtitle;
    }
    
    // Оновлюємо основний контент
    const mainElement = doc.querySelector('main');
    if (mainElement && content) {
      // Зберігаємо hero секцію
      const heroSection = mainElement.querySelector('.hero');
      
      // Очищуємо main, але зберігаємо hero
      mainElement.innerHTML = '';
      
      if (heroSection) {
        mainElement.appendChild(heroSection);
      }
      
      // Додаємо новий контент
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = content;
      mainElement.appendChild(contentDiv);
    }
    
    return doc.documentElement.outerHTML;
  }

  // Завантаження оновленого файлу
  downloadUpdatedFile(pageId, htmlContent) {
    const fileName = pageId === 'index' ? 'index.html' : `${pageId}.html`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // Завантаження списку сторінок для управління
  loadPagesList() {
    const pagesList = document.getElementById('pages-management-list');
    if (!pagesList) return;

    // Системні сторінки (не можна видаляти)
    const systemPages = [
      { id: 'index', title: 'Головна сторінка', url: 'index.html', description: 'Головна сторінка сайту', type: 'system' },
      { id: 'about', title: 'Про ліцей', url: 'about.html', description: 'Інформація про ліцей', type: 'system' },
      { id: 'news', title: 'Новини', url: 'news.html', description: 'Новини та події', type: 'system' },
      { id: 'schedule', title: 'Розклад', url: 'schedule.html', description: 'Розклад уроків', type: 'system' },
      { id: 'teachers', title: 'Вчителі', url: 'teachers.html', description: 'Інформація про вчителів', type: 'system' },
      { id: 'admission', title: 'Вступ', url: 'admission.html', description: 'Правила вступу', type: 'system' },
      { id: 'contacts', title: 'Контакти', url: 'contacts.html', description: 'Контактна інформація', type: 'system' }
    ];

    // Користувацькі сторінки (можна видаляти)
    const customPages = this.data.customPages || [];

    const allPages = [...systemPages, ...customPages];

    pagesList.innerHTML = allPages.map(page => `
      <div class="page-management-item ${page.type}-page">
        <div class="page-info">
          <h4>${page.title}</h4>
          <div class="page-url">${page.url}</div>
          <div class="page-description">${page.description}</div>
          <div class="page-status">
            <span class="status-badge ${page.type}">
              ${page.type === 'system' ? '🔒 Системна' : '📝 Користувацька'}
            </span>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-small" onclick="editPageFromList('${page.id}')">
            ✏️ Редагувати
          </button>
          ${page.type === 'custom' ? `
            <button class="btn btn-danger btn-small" onclick="deletePageFromList('${page.id}')">
              🗑️ Видалити
            </button>
          ` : `
            <button class="btn btn-danger btn-small" disabled title="Системні сторінки не можна видаляти">
              🔒 Захищено
            </button>
          `}
        </div>
      </div>
    `).join('');
  }

  // Генерація HTML для нової сторінки
  generatePageHtml(title, subtitle, description, content, template) {
    const templateContent = this.getTemplateContent(template, title, subtitle, content);
    const navigationHtml = this.generateNavigationHtml();
    
    return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} — Ліцей №157</title>
    <meta name="description" content="${description || title}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/img/log.jpg">
    <link rel="shortcut icon" type="image/x-icon" href="assets/img/log.jpg">
    
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
    </div>
    
    <header class="site-header" role="banner">
      <div class="container nav">
        <a class="brand" href="index.html">
          <img class="brand-badge-img" src="assets/img/log.jpg" alt="Ліцей №157">
          <span>Ліцей №157</span>
        </a>
        <nav aria-label="Основна навігація">
          <button class="menu-toggle" aria-expanded="false" aria-controls="nav-links" data-menu-toggle aria-label="Відкрити меню">
          </button>
          <div id="nav-links" class="nav-links" data-nav-links>
            ${navigationHtml}
          </div>
        </nav>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="container hero-inner">
          <div class="reveal watermark">
            <h1><span class="text-gradient">${title}</span></h1>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
          </div>
        </div>
      </section>

      ${templateContent}
    </main>

    <footer class="site-footer">
      <div class="container">
        <div>© <span id="year"></span> Ліцей №157 м. Харків. Всі права захищені.</div>
      </div>
    </footer>

    <script src="assets/js/main.js"></script>
    <script>
      document.getElementById('year').textContent = new Date().getFullYear();
    </script>
  </body>
</html>`;
  }

  // Генерація HTML навігації з усіма сторінками
  generateNavigationHtml() {
    // Системні сторінки
    const systemPages = [
      { url: 'index.html', title: 'Головна' },
      { url: 'about.html', title: 'Про ліцей' },
      { url: 'news.html', title: 'Новини' },
      { url: 'schedule.html', title: 'Розклад' },
      { url: 'teachers.html', title: 'Вчителі' },
      { url: 'admission.html', title: 'Вступ' },
      { url: 'contacts.html', title: 'Контакти' }
    ];

    // Користувацькі сторінки
    const customPages = this.data.customPages || [];

    let navigationHtml = '';
    
    // Додаємо системні сторінки
    systemPages.forEach(page => {
      navigationHtml += `<a href="${page.url}">${page.title}</a>\n            `;
    });
    
    // Додаємо користувацькі сторінки
    customPages.forEach(page => {
      navigationHtml += `<a href="${page.url}">${page.title}</a>\n            `;
    });

    return navigationHtml.trim();
  }

  // Отримання контенту шаблону
  getTemplateContent(template, title, subtitle, content) {
    const templates = {
      basic: `
        <section>
          <div class="container">
            ${content}
          </div>
        </section>
      `,
      content: `
        <section>
          <div class="container">
            <div class="content-wrapper">
              ${content}
            </div>
          </div>
        </section>
      `,
      gallery: `
        <section>
          <div class="container">
            <h2 class="section-title accent-underline">Галерея</h2>
            <div class="gallery-grid">
              ${content}
            </div>
          </div>
        </section>
      `,
      contact: `
        <section>
          <div class="container">
            <h2 class="section-title accent-underline">Контактна інформація</h2>
            <div class="contact-content">
              ${content}
            </div>
          </div>
        </section>
      `
    };

    return templates[template] || templates.basic;
  }

  // Валідація URL сторінки
  validatePageUrl(url) {
    const urlPattern = /^[a-z0-9-]+$/;
    return urlPattern.test(url) && url.length > 0 && url.length <= 50;
  }

  // Створення інструкцій для оновлення навігації
  createNavigationUpdateInstructions(newPageTitle, newPageUrl) {
    const customPages = this.data.customPages || [];
    const allCustomPages = customPages.map(page => `<a href="${page.url}">${page.title}</a>`).join('\n            ');
    
    const instructions = `
ІНСТРУКЦІЇ ПО ДОДАВАННЮ НОВОЇ СТОРІНКИ В НАВІГАЦІЮ

Нова сторінка: ${newPageTitle} (${newPageUrl})

Щоб додати нову сторінку в меню всіх існуючих сторінок, потрібно:

1. ВІДКРИЙТЕ кожен з наступних файлів:
   - index.html
   - about.html
   - news.html
   - schedule.html
   - teachers.html
   - admission.html
   - contacts.html

2. ЗНАЙДІТЬ в кожному файлі блок навігації:
   <div id="nav-links" class="nav-links" data-nav-links>
     <a href="index.html">Головна</a>
     <a href="about.html">Про ліцей</a>
     <a href="news.html">Новини</a>
     <a href="schedule.html">Розклад</a>
     <a href="teachers.html">Вчителі</a>
     <a href="admission.html">Вступ</a>
     <a href="contacts.html">Контакти</a>
   </div>

3. ЗАМІНІТЬ весь блок навігації на:
   <div id="nav-links" class="nav-links" data-nav-links>
     <a href="index.html">Головна</a>
     <a href="about.html">Про ліцей</a>
     <a href="news.html">Новини</a>
     <a href="schedule.html">Розклад</a>
     <a href="teachers.html">Вчителі</a>
     <a href="admission.html">Вступ</a>
     <a href="contacts.html">Контакти</a>
     ${allCustomPages}
   </div>

4. ЗБЕРЕЖІТЬ всі файли

5. ЗАВАНТАЖТЕ оновлені файли на сервер

АЛЬТЕРНАТИВНИЙ СПОСІБ:
Ви можете використовувати функцію "Знайти та замінити" в текстовому редакторі:

ЗНАЙТИ:
</div>
        </nav>

ЗАМІНИТИ НА:
<a href="${newPageUrl}">${newPageTitle}</a>
          </div>
        </nav>

Це додасть нову сторінку перед закриваючим тегом навігації.

Дата створення: ${new Date().toLocaleString('uk-UA')}
`;

    return instructions;
  }
}

// Глобальні функції для використання в HTML
function switchTab(tabName) {
  const tab = document.querySelector(`[data-tab="${tabName}"]`);
  if (tab) {
    tab.click();
  }
}

async function savePage() {
  if (!window.cmsManager.currentPage) {
    window.cmsManager.showMessage('Спочатку оберіть сторінку для редагування!', 'error');
    return;
  }

  const title = document.getElementById('page-title').value;
  const subtitle = document.getElementById('page-subtitle').value;
  const content = window.cmsManager.contentEditor.root.innerHTML;

  // Перевіряємо, чи це користувацька сторінка
  const customPages = window.cmsManager.data.customPages || [];
  const customPageIndex = customPages.findIndex(p => p.id === window.cmsManager.currentPage);

  if (customPageIndex !== -1) {
    // Зберігаємо користувацьку сторінку
    customPages[customPageIndex].title = title;
    customPages[customPageIndex].subtitle = subtitle;
    customPages[customPageIndex].content = content;
    
    // Генеруємо оновлений HTML файл
    const updatedHtml = window.cmsManager.generatePageHtml(title, subtitle, customPages[customPageIndex].description, content, 'basic');
    
    // Завантажуємо файл
    window.cmsManager.downloadUpdatedFile(window.cmsManager.currentPage, updatedHtml);
    
    // Зберігаємо дані та оновлюємо інтерфейс
    window.cmsManager.saveData();
    window.cmsManager.loadPagesList();
    
    window.cmsManager.showMessage('Користувацька сторінка збережена! Завантажте файл та замініть на сервері.', 'success');
  } else {
    // Зберігаємо системну сторінку
    try {
      // Завантажуємо оригінальний файл
      const originalData = await window.cmsManager.loadRealPageContent(window.cmsManager.currentPage);
      
      // Створюємо оновлений HTML
      const updatedHtml = window.cmsManager.updatePageHtml(originalData.originalHtml, title, subtitle, content);
      
      // Зберігаємо файл
      window.cmsManager.downloadUpdatedFile(window.cmsManager.currentPage, updatedHtml);
      
      window.cmsManager.showMessage('Системна сторінка збережена! Завантажте файл та замініть на сервері.', 'success');
    } catch (error) {
      console.error('Помилка збереження:', error);
      window.cmsManager.showMessage('Помилка збереження сторінки', 'error');
    }
  }
}

async function previewPage() {
  if (!window.cmsManager.currentPage) {
    window.cmsManager.showMessage('Спочатку оберіть сторінку для редагування!', 'error');
    return;
  }

  const title = document.getElementById('page-title').value;
  const subtitle = document.getElementById('page-subtitle').value;
  const content = window.cmsManager.contentEditor.root.innerHTML;

  // Перевіряємо, чи це користувацька сторінка
  const customPages = window.cmsManager.data.customPages || [];
  const customPage = customPages.find(p => p.id === window.cmsManager.currentPage);

  let previewHtml;

  if (customPage) {
    // Для користувацьких сторінок генеруємо HTML з нуля
    previewHtml = window.cmsManager.generatePageHtml(title, subtitle, customPage.description, content, 'basic');
  } else {
    // Для системних сторінок використовуємо оригінальний файл
    try {
      const originalData = await window.cmsManager.loadRealPageContent(window.cmsManager.currentPage);
      previewHtml = window.cmsManager.updatePageHtml(originalData.originalHtml, title, subtitle, content);
    } catch (error) {
      console.error('Помилка завантаження оригіналу:', error);
      // Якщо не вдалося завантажити, створюємо базовий HTML
      previewHtml = window.cmsManager.generatePageHtml(title, subtitle, '', content, 'basic');
    }
  }

  // Відкриваємо в новому вікні
  const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  if (newWindow) {
    newWindow.document.write(previewHtml);
    newWindow.document.close();
    newWindow.focus();
  } else {
    window.cmsManager.showMessage('Дозвольте спливаючі вікна для перегляду', 'error');
  }
}

function resetPage() {
  if (confirm('Ви впевнені, що хочете скинути всі зміни?')) {
    window.cmsManager.loadPage(window.cmsManager.currentPage);
    window.cmsManager.showMessage('Зміни скинуто!', 'success');
  }
}

function addNews() {
  window.cmsManager.currentNewsId = null;
  document.getElementById('news-form-title').textContent = 'Додати новину';
  document.getElementById('news-title').value = '';
  document.getElementById('news-date').value = new Date().toISOString().split('T')[0];
  
  if (window.cmsManager.newsEditor) {
    window.cmsManager.newsEditor.root.innerHTML = '';
  }
  
  document.getElementById('news-list').style.display = 'none';
  document.getElementById('news-form').style.display = 'block';
}

function editNews(newsId) {
  const news = window.cmsManager.data.news.find(n => n.id === newsId);
  if (news) {
    window.cmsManager.currentNewsId = newsId;
    document.getElementById('news-form-title').textContent = 'Редагувати новину';
    document.getElementById('news-title').value = news.title;
    document.getElementById('news-date').value = news.date;
    
    if (window.cmsManager.newsEditor) {
      window.cmsManager.newsEditor.root.innerHTML = news.content;
    }
    
    document.getElementById('news-list').style.display = 'none';
    document.getElementById('news-form').style.display = 'block';
  }
}

function saveNews() {
  const title = document.getElementById('news-title').value;
  const date = document.getElementById('news-date').value;
  const content = window.cmsManager.newsEditor.root.innerHTML;

  if (!title || !date || !content) {
    window.cmsManager.showMessage('Заповніть всі поля!', 'error');
    return;
  }

  const newsData = {
    title,
    date,
    content,
    image: null
  };

  if (window.cmsManager.currentNewsId) {
    // Редагування існуючої новини
    const newsIndex = window.cmsManager.data.news.findIndex(n => n.id === window.cmsManager.currentNewsId);
    if (newsIndex !== -1) {
      window.cmsManager.data.news[newsIndex] = {
        ...window.cmsManager.data.news[newsIndex],
        ...newsData
      };
    }
  } else {
    // Додавання нової новини
    newsData.id = Date.now();
    window.cmsManager.data.news.unshift(newsData);
  }

  window.cmsManager.saveData();
  cancelNews();
  updateNewsList();
}

function cancelNews() {
  document.getElementById('news-list').style.display = 'block';
  document.getElementById('news-form').style.display = 'none';
  window.cmsManager.currentNewsId = null;
}

function deleteNews(newsId) {
  if (confirm('Ви впевнені, що хочете видалити цю новину?')) {
    window.cmsManager.data.news = window.cmsManager.data.news.filter(n => n.id !== newsId);
    window.cmsManager.saveData();
    updateNewsList();
  }
}

function updateNewsList() {
  const newsList = document.getElementById('news-list');
  newsList.innerHTML = window.cmsManager.data.news.map(news => `
    <div class="news-item">
      <h4>${news.title}</h4>
      <div class="news-date">${news.date}</div>
      <p>${news.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
      <div class="news-actions">
        <button class="btn btn-primary btn-small" onclick="editNews(${news.id})">✏️ Редагувати</button>
        <button class="btn btn-warning btn-small" onclick="deleteNews(${news.id})">🗑️ Видалити</button>
      </div>
    </div>
  `).join('');
}

function copyImageLink(src) {
  navigator.clipboard.writeText(src).then(() => {
    window.cmsManager.showMessage('Посилання скопійовано!', 'success');
  });
}

function deleteMedia(button) {
  if (confirm('Ви впевнені, що хочете видалити це зображення?')) {
    button.closest('.media-item').remove();
    window.cmsManager.showMessage('Зображення видалено!', 'success');
  }
}

function saveSettings() {
  const settings = {
    siteName: document.getElementById('site-name').value,
    siteDescription: document.getElementById('site-description').value,
    address: document.getElementById('site-address').value,
    phone: document.getElementById('site-phone').value,
    email: document.getElementById('site-email').value,
    social: {
      instagram: document.getElementById('social-instagram').value,
      telegram: document.getElementById('social-telegram').value,
      tiktok: document.getElementById('social-tiktok').value
    }
  };

  window.cmsManager.data.settings = settings;
  window.cmsManager.saveData();
}

function exportSettings() {
  const dataStr = JSON.stringify(window.cmsManager.data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `cms_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  window.cmsManager.showMessage('Налаштування експортовано!', 'success');
}

// Функції управління сторінками
function showCreatePageForm() {
  document.getElementById('pages-management-list').parentElement.style.display = 'none';
  document.getElementById('create-page-form').style.display = 'block';
  
  // Очищуємо форму
  document.getElementById('new-page-title').value = '';
  document.getElementById('new-page-url').value = '';
  document.getElementById('new-page-description').value = '';
  document.getElementById('new-page-heading').value = '';
  document.getElementById('new-page-subtitle').value = '';
  
  if (window.cmsManager.newPageEditor) {
    window.cmsManager.newPageEditor.root.innerHTML = '<p>Введіть початковий контент сторінки...</p>';
  }
}

function cancelCreatePage() {
  document.getElementById('pages-management-list').parentElement.style.display = 'block';
  document.getElementById('create-page-form').style.display = 'none';
}

function createNewPage() {
  const title = document.getElementById('new-page-title').value.trim();
  const url = document.getElementById('new-page-url').value.trim().toLowerCase();
  const description = document.getElementById('new-page-description').value.trim();
  const heading = document.getElementById('new-page-heading').value.trim() || title;
  const subtitle = document.getElementById('new-page-subtitle').value.trim();
  const template = document.getElementById('new-page-template').value;
  const content = window.cmsManager.newPageEditor ? window.cmsManager.newPageEditor.root.innerHTML : '';

  // Валідація
  if (!title) {
    window.cmsManager.showMessage('Введіть назву сторінки!', 'error');
    return;
  }

  if (!url) {
    window.cmsManager.showMessage('Введіть URL сторінки!', 'error');
    return;
  }

  if (!window.cmsManager.validatePageUrl(url)) {
    window.cmsManager.showMessage('URL може містити тільки латинські літери, цифри та дефіси!', 'error');
    return;
  }

  // Перевіряємо, чи не існує вже така сторінка
  const existingPages = window.cmsManager.data.customPages || [];
  const systemPages = ['index', 'about', 'news', 'schedule', 'teachers', 'admission', 'contacts'];
  
  if (systemPages.includes(url) || existingPages.some(page => page.id === url)) {
    window.cmsManager.showMessage('Сторінка з таким URL вже існує!', 'error');
    return;
  }

  // Створюємо нову сторінку
  const newPage = {
    id: url,
    title: title,
    url: url + '.html',
    description: description || title,
    type: 'custom',
    created: new Date().toISOString().split('T')[0]
  };

  // Додаємо до списку користувацьких сторінок
  if (!window.cmsManager.data.customPages) {
    window.cmsManager.data.customPages = [];
  }
  window.cmsManager.data.customPages.push(newPage);

  // Генерируем HTML файл
  const pageHtml = window.cmsManager.generatePageHtml(heading, subtitle, description, content, template);
  
  // Зберігаємо файл
  const blob = new Blob([pageHtml], { type: 'text/html' });
  const downloadUrl = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = newPage.url;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(downloadUrl);

  // Створюємо інструкції по оновленню навігації
  const instructions = window.cmsManager.createNavigationUpdateInstructions(title, newPage.url);
  const instructionsBlob = new Blob([instructions], { type: 'text/plain' });
  const instructionsUrl = URL.createObjectURL(instructionsBlob);
  
  const instructionsLink = document.createElement('a');
  instructionsLink.href = instructionsUrl;
  instructionsLink.download = `ДОДАВАННЯ_${url.toUpperCase()}_В_НАВІГАЦІЮ.txt`;
  instructionsLink.style.display = 'none';
  
  document.body.appendChild(instructionsLink);
  instructionsLink.click();
  document.body.removeChild(instructionsLink);
  
  URL.revokeObjectURL(instructionsUrl);

  // Зберігаємо дані та оновлюємо інтерфейс
  window.cmsManager.saveData();
  window.cmsManager.loadPagesList();
  window.cmsManager.updatePageSelector();
  
  cancelCreatePage();
  window.cmsManager.showMessage(`Сторінка "${title}" створена! Завантажено файл сторінки та інструкції по додаванню в навігацію.`, 'success');
}

function refreshPagesList() {
  window.cmsManager.loadPagesList();
  window.cmsManager.showMessage('Список сторінок оновлено!', 'success');
}

function downloadNavigationInstructions() {
  const customPages = window.cmsManager.data.customPages || [];
  
  if (customPages.length === 0) {
    window.cmsManager.showMessage('Немає користувацьких сторінок для додавання в навігацію.', 'error');
    return;
  }

  // Створюємо загальні інструкції для всіх користувацьких сторінок
  const allCustomPagesHtml = customPages.map(page => `<a href="${page.url}">${page.title}</a>`).join('\n            ');
  
  const generalInstructions = `
ІНСТРУКЦІЇ ПО ОНОВЛЕННЮ НАВІГАЦІЇ ДЛЯ ВСІХ КОРИСТУВАЦЬКИХ СТОРІНОК

Користувацькі сторінки для додавання в меню:
${customPages.map(page => `- ${page.title} (${page.url})`).join('\n')}

Щоб додати всі користувацькі сторінки в меню існуючих сторінок:

1. ВІДКРИЙТЕ кожен з наступних файлів:
   - index.html
   - about.html
   - news.html
   - schedule.html
   - teachers.html
   - admission.html
   - contacts.html

2. ЗНАЙДІТЬ в кожному файлі блок навігації:
   <div id="nav-links" class="nav-links" data-nav-links>
     <a href="index.html">Головна</a>
     <a href="about.html">Про ліцей</a>
     <a href="news.html">Новини</a>
     <a href="schedule.html">Розклад</a>
     <a href="teachers.html">Вчителі</a>
     <a href="admission.html">Вступ</a>
     <a href="contacts.html">Контакти</a>
   </div>

3. ЗАМІНІТЬ весь блок навігації на:
   <div id="nav-links" class="nav-links" data-nav-links>
     <a href="index.html">Головна</a>
     <a href="about.html">Про ліцей</a>
     <a href="news.html">Новини</a>
     <a href="schedule.html">Розклад</a>
     <a href="teachers.html">Вчителі</a>
     <a href="admission.html">Вступ</a>
     <a href="contacts.html">Контакти</a>
     ${allCustomPagesHtml}
   </div>

4. ЗБЕРЕЖІТЬ всі файли

5. ЗАВАНТАЖТЕ оновлені файли на сервер

ШВИДКИЙ СПОСІБ (через пошук та заміну):
У текстовому редакторі використовуйте функцію "Знайти та замінити":

ЗНАЙТИ:
          </div>
        </nav>

ЗАМІНИТИ НА:
          ${allCustomPagesHtml}
          </div>
        </nav>

Це додасть всі користувацькі сторінки перед закриваючим тегом навігації.

Дата створення: ${new Date().toLocaleString('uk-UA')}
`;

  const instructionsBlob = new Blob([generalInstructions], { type: 'text/plain' });
  const instructionsUrl = URL.createObjectURL(instructionsBlob);
  
  const instructionsLink = document.createElement('a');
  instructionsLink.href = instructionsUrl;
  instructionsLink.download = 'ОНОВЛЕННЯ_НАВІГАЦІЇ_ВСІ_СТОРІНКИ.txt';
  instructionsLink.style.display = 'none';
  
  document.body.appendChild(instructionsLink);
  instructionsLink.click();
  document.body.removeChild(instructionsLink);
  
  URL.revokeObjectURL(instructionsUrl);

  window.cmsManager.showMessage(`Завантажено інструкції для додавання ${customPages.length} користувацьких сторінок в навігацію.`, 'success');
}

function editPageFromList(pageId) {
  // Переходимо на вкладку редагування
  switchTab('pages');
  
  // Вибираємо сторінку в селекторі
  const pageSelector = document.getElementById('page-select');
  if (pageSelector) {
    pageSelector.value = pageId;
    pageSelector.dispatchEvent(new Event('change'));
  }
}

function deletePageFromList(pageId) {
  const customPages = window.cmsManager.data.customPages || [];
  const page = customPages.find(p => p.id === pageId);
  
  if (!page) {
    window.cmsManager.showMessage('Сторінка не знайдена!', 'error');
    return;
  }

  if (confirm(`Ви впевнені, що хочете видалити сторінку "${page.title}"?\n\nЦе видалить сторінку зі списку CMS, але файл ${page.url} залишиться на сервері. Видаліть його вручну.`)) {
    // Видаляємо зі списку
    window.cmsManager.data.customPages = customPages.filter(p => p.id !== pageId);
    
    // Зберігаємо дані та оновлюємо інтерфейс
    window.cmsManager.saveData();
    window.cmsManager.loadPagesList();
    window.cmsManager.updatePageSelector();
    
    window.cmsManager.showMessage(`Сторінка "${page.title}" видалена зі списку CMS. Не забудьте видалити файл ${page.url} з сервера.`, 'success');
  }
}

function logout() {
  if (confirm('Ви впевнені, що хочете вийти з системи?')) {
    // Используем AuthManager для выхода
    if (window.authManager) {
      window.authManager.logout();
    } else {
      localStorage.removeItem('cms_session');
      window.location.href = 'login.html';
    }
  }
}

// Ініціалізація CMS при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  window.cmsManager = new CMSManager();
});
