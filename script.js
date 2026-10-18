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

  // Speed selector: live "ready by" estimate in Colombo time
  const speedStops = [...document.querySelectorAll('#speed .stop')];
  if (speedStops.length) {
    const OPEN = 8 * 60, CLOSE = 18 * 60 + 30;
    const WA = 'https://wa.me/94742555515?text=';
    const colombo = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    const mins = (d) => d.getHours() * 60 + d.getMinutes();
    const fmtTime = (d) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').replace(':', '.').toLowerCase();
    const fmtDay = (d, now) => {
      const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
      return diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    };
    const atOpen = (d, addDays) => { const x = new Date(d); x.setDate(x.getDate() + addDays); x.setHours(8, 0, 0, 0); return x; };
    const dropOff = (n) => (mins(n) < OPEN ? atOpen(n, 0) : mins(n) >= CLOSE ? atOpen(n, 1) : n);
    const SPEEDS = [
      { name: 'Standard', charge: 'Standard price', calc: (n) => { const r = new Date(dropOff(n)); r.setDate(r.getDate() + 2); r.setHours(18, 30, 0, 0); return `Ready <em>${fmtDay(r, n)}</em> by 6.30pm`; } },
      { name: 'One-day', charge: '+25% on the standard price', calc: (n) => { const r = new Date(dropOff(n).getTime() + 24 * 36e5); return `Ready <em>${fmtDay(r, n)}</em> by ${fmtTime(r)}`; } },
      { name: 'Express', charge: '+50% on the standard price', calc: (n) => {
          const m = mins(n);
          if (m >= OPEN && m <= CLOSE - 360) return `Ready <em>today</em> by ${fmtTime(new Date(n.getTime() + 6 * 36e5))}`;
          const r = m < OPEN ? atOpen(n, 0) : atOpen(n, 1); r.setHours(14, 0);
          return `Ready <em>${fmtDay(r, n)}</em> by 2pm`; } },
      { name: 'Urgent pressing', charge: '+100% (double) the standard price', calc: (n) => {
          const m = mins(n);
          return m >= OPEN && m < CLOSE - 120 ? 'Ready <em>within a few hours</em>, today'
            : `Ready <em>${m < OPEN ? 'this morning' : 'tomorrow morning'}</em>, a few hours after we open`; } },
    ];
    const pickSpeed = (i) => {
      speedStops.forEach((s, j) => s.setAttribute('aria-checked', String(j === i)));
      document.getElementById('speed-fill').style.width = `${(i / 3) * 75}%`;
      const s = SPEEDS[i];
      document.getElementById('speed-ready').innerHTML = s.calc(colombo());
      document.getElementById('speed-charge').innerHTML = `<b>${s.name}</b>${s.charge}`;
      document.getElementById('speed-book').href = WA + encodeURIComponent(`Hello LaundroPlus, I'd like ${s.name} service.`);
    };
    speedStops.forEach((s, i) => {
      s.addEventListener('click', () => pickSpeed(i));
      s.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const j = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
        speedStops[j].focus();
        pickSpeed(j);
      });
    });
    pickSpeed(0);
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
