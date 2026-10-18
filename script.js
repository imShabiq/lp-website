(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: solid background once past the top, mobile menu toggle
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  document.querySelectorAll('.nav__links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Hero slideshow
  const slides = [...document.querySelectorAll('.hero__slides picture')];
  if (slides.length > 1 && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 6500);
  }

  // Reviews arrows
  const track = document.querySelector('.reviews__track');
  document.querySelectorAll('.reviews__ctrl .round').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = track.querySelector('.quote');
      const step = card ? card.getBoundingClientRect().width + 20 : 400;
      track.scrollBy({ left: step * Number(btn.dataset.dir), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // Scroll reveal
  const revealables = document.querySelectorAll('.section__head, .svc, .ticket, .business__img, .business__copy, .contact__grid > *, .perk, .job, .apply-steps li');
  const rail = document.querySelector('.rail__list');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    if (rail) {
      rail.classList.add('is-armed');
      const railIo = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { rail.classList.add('is-in'); railIo.disconnect(); }
      }, { threshold: 0.25 });
      railIo.observe(rail);
    }
    revealables.forEach((el, idx) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(idx % 3) * 80}ms`;
      io.observe(el);
    });
  }

  // "Ask about business accounts" preselects the business option
  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const radio = document.querySelector(`input[name="service"][value="${link.dataset.service}"]`);
      if (radio) radio.checked = true;
    });
  });

  // Contact form: compose a WhatsApp message (static site, no server needed)
  const form = document.getElementById('contact-form');
  const error = document.getElementById('form-error');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').trim();
    const nameInput = form.querySelector('#f-name');
    if (!name) {
      error.textContent = 'Enter your name so we know who we’re replying to.';
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      return;
    }
    nameInput.removeAttribute('aria-invalid');
    error.textContent = '';

    const lines = [
      `Hello LaundroPlus, I'm ${name}.`,
      `I'm interested in: ${data.get('service')}.`,
    ];
    const phone = (data.get('phone') || '').trim();
    const msg = (data.get('message') || '').trim();
    if (msg) lines.push(msg);
    if (phone) lines.push(`My number: ${phone}`);

    window.open(`https://wa.me/94742555515?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
