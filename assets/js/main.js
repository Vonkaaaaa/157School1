document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const links = document.querySelector('[data-nav-links]');
  
  if (toggle && links) {
    // Toggle menu
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.contains('open');
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', !isOpen);
      
      // Update button text
      toggle.textContent = isOpen ? 'Меню' : 'Закрити';
    });
    
    // Close menu when clicking on a link
    const navLinks = links.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Меню';
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Меню';
      }
    });
    
    // Handle resize to reset menu state
    window.addEventListener('resize', () => {
      if (window.innerWidth > 640) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Меню';
      }
    });
  }

  const form = document.querySelector('form[data-validate]');
  if (form) {
    form.addEventListener('submit', (e) => {
      const name = form.querySelector('input[name="name"]');
      const email = form.querySelector('input[name="email"]');
      const message = form.querySelector('textarea[name="message"]');
      let ok = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      [name, email, message].forEach((el) => {
        if (!el) return;
        el.setAttribute('aria-invalid', 'false');
      });
      if (name && name.value.trim().length < 2) {
        name.setAttribute('aria-invalid', 'true');
        ok = false;
      }
      if (email && !emailRegex.test(email.value)) {
        email.setAttribute('aria-invalid', 'true');
        ok = false;
      }
      if (message && message.value.trim().length < 10) {
        message.setAttribute('aria-invalid', 'true');
        ok = false;
      }
      if (!ok) {
        e.preventDefault();
        const container = form.querySelector('[data-errors]');
        if (container) {
          container.innerHTML = 'Перевірте правильність заповнення полів.';
          container.style.display = 'block';
        }
      }
    });
  }

  // Simple scroll reveal
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const onScroll = () => {
    const trigger = window.scrollY + window.innerHeight * 0.9;
    revealEls.forEach((el) => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (top < trigger) el.classList.add('visible');
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});


