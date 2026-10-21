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
      error.textContent = T('err_name');
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

  // Language helpers from i18n.js
  const T = (k, v) => (window.LP ? window.LP.t(k, v) : k);
  const S = (k) => (window.LP ? window.LP.s(k) : k);
  const lang = () => (window.LP ? window.LP.lang : 'en');

  // Speed selector: live "ready by" estimate in Colombo time
  const speedStops = [...document.querySelectorAll('#speed .stop')];
  if (speedStops.length) {
    const OPEN = 8 * 60, CLOSE = 18 * 60 + 30;
    const WA = 'https://wa.me/94742555515?text=';
    const colombo = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    const mins = (d) => d.getHours() * 60 + d.getMinutes();
    const fmtTime = (d) => (lang() === 'en'
      ? d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').replace(':', '.').toLowerCase()
      : d.toLocaleTimeString(window.LP.locale, { hour: 'numeric', minute: '2-digit' }));
    const fmtDay = (d, now) => {
      const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
      return diff === 0 ? T('today') : diff === 1 ? T('tomorrow') : d.toLocaleDateString(window.LP ? window.LP.locale : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    };
    const atOpen = (d, addDays) => { const x = new Date(d); x.setDate(x.getDate() + addDays); x.setHours(8, 0, 0, 0); return x; };
    const dropOff = (n) => (mins(n) < OPEN ? atOpen(n, 0) : mins(n) >= CLOSE ? atOpen(n, 1) : n);
    const NOON = 12 * 60, PRESS_LAST = 17 * 60 + 30;
    const SPEEDS = [
      { name: 'Standard', key: 'sp_standard', charge: 'ch_standard', calc: (n) => { const r = new Date(dropOff(n)); r.setDate(r.getDate() + 2); return T('sp_standard_ready', { day: fmtDay(r, n) }); } },
      { name: 'One-day', key: 'sp_oneday', charge: 'ch_oneday', calc: (n) => (mins(n) >= OPEN && mins(n) < CLOSE ? T('sp_oneday_ready') : T('sp_oneday_handover', { day: mins(n) < OPEN ? T('today') : T('tomorrow') })) },
      { name: 'Express', key: 'sp_express', charge: 'ch_express', calc: (n) => {
          const m = mins(n);
          if (m >= OPEN && m < NOON) return T('sp_express_ready');
          const d = m < OPEN ? atOpen(n, 0) : atOpen(n, 1);
          return T('sp_express_handover', { day: fmtDay(d, n) }); } },
      { name: 'Urgent pressing', key: 'sp_urgent', charge: 'ch_urgent', calc: (n) => {
          const m = mins(n);
          if (m >= OPEN && m < PRESS_LAST) return T('sp_urgent_ready', { time: fmtTime(new Date(n.getTime() + 3 * 36e5)) });
          const d = m < OPEN ? atOpen(n, 0) : atOpen(n, 1);
          return T('sp_urgent_handover', { day: fmtDay(d, n) }); } },
    ];
    let current = 0;
    const pickSpeed = (i) => {
      current = i;
      speedStops.forEach((s, j) => s.setAttribute('aria-checked', String(j === i)));
      document.getElementById('speed-fill').style.width = `${(i / 3) * 75}%`;
      const s = SPEEDS[i];
      document.getElementById('speed-ready').innerHTML = s.calc(colombo());
      document.getElementById('speed-charge').innerHTML = `<b>${S(s.key)}</b>${T(s.charge)}`;
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
    document.addEventListener('lp:lang', () => pickSpeed(current));
  }

  // Outlet status: "Open now" / "Closed now" in Colombo time (daily 8.00am to 6.30pm)
  const hoursEls = document.querySelectorAll('[data-hours]');
  if (hoursEls.length) {
    const setStatus = () => {
      const t = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
      const m = t.getHours() * 60 + t.getMinutes();
      const open = m >= 8 * 60 && m < 18 * 60 + 30;
      const text = open ? T('status_open') : T(m < 8 * 60 ? 'status_closed_today' : 'status_closed_tomorrow');
      hoursEls.forEach((el) => { el.textContent = text; el.classList.toggle('is-closed', !open); });
    };
    setStatus();
    setInterval(setStatus, 60000);
    document.addEventListener('lp:lang', setStatus);
  }

  // Long reviews: clamp to 6 lines with a "Read more" toggle (full text stays in the page)
  document.querySelectorAll('.quote blockquote').forEach((q) => {
    q.classList.add('is-clamped');
    if (q.scrollHeight <= q.clientHeight + 2) { q.classList.remove('is-clamped'); return; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'quote__more'; b.textContent = T('read_more'); b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => {
      const open = q.classList.toggle('is-clamped') === false;
      b.textContent = open ? T('show_less') : T('read_more');
      b.setAttribute('aria-expanded', String(open));
    });
    q.after(b);
  });
  document.addEventListener('lp:lang', () => document.querySelectorAll('.quote__more').forEach((b) => {
    b.textContent = b.getAttribute('aria-expanded') === 'true' ? T('show_less') : T('read_more');
  }));

  // Care label decoder: symbols drawn as simple line icons, grouped like a real care label
  const labelsPicker = document.getElementById('labels-picker');
  if (labelsPicker) {
    const tub = '<path d="M5 17c4.5-4 9-4 13.5 0s9 4 13.5 0 7.5-4 11-1"/><path d="M5 17l4.5 21h29L43 16"/>';
    const num = (n) => `<text x="24" y="33" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor" stroke="none" font-family="Instrument Sans, sans-serif">${n}</text>`;
    const cross = '<path d="M7 7l34 34M41 7L7 41"/>';
    const tri = '<path d="M24 7l19 33H5z"/>';
    const sq = '<rect x="7" y="7" width="34" height="34" rx="2"/>';
    const dot = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="2" fill="currentColor" stroke="none"/>`;
    const iron = '<path d="M6 36h36l-3.5-13c-1-4-4-6-8-6H15"/><path d="M15 17c-4.5 0-5.5 6 0 6h23"/>';
    const ring = (l) => `<circle cx="24" cy="24" r="16"/>${l ? `<text x="24" y="30" text-anchor="middle" font-size="16" font-weight="600" fill="currentColor" stroke="none" font-family="Instrument Sans, sans-serif">${l}</text>` : ''}`;
    const hand = '<path d="M19 34v-8.5M22.5 34V24M26 34v-9M29.5 34v-6.5M17 31c0 4 2.5 6 6.5 6s7.5-1.5 7.5-6"/>';

    const LABELS = [
      { group: 'Washing', items: [
        { id: 'w30', svg: tub + num(30), name: 'Machine wash, 30°C', means: 'Wash in a machine with water no hotter than 30°C, on a normal cycle.', we: 'We wash it cool with premium, fabric-safe detergent, so colours stay bright.' },
        { id: 'w40', svg: tub + num(40), name: 'Machine wash, 40°C', means: 'Wash in a machine with water no hotter than 40°C, on a normal cycle.', we: 'Ideal for everyday cottons. We wash at the right temperature and check stains first.' },
        { id: 'wgentle', svg: tub + num(30) + '<path d="M9 43h30"/>', name: 'Gentle wash', means: 'One line under the tub means a gentle cycle with less spinning. Two lines means very gentle.', we: 'We use a delicate cycle, or wash it by hand if the fabric needs it.' },
        { id: 'whand', svg: tub + hand, name: 'Hand wash only', means: 'Wash by hand in water no hotter than 40°C. Do not machine wash.', we: 'Our team washes these pieces by hand and dries them flat or on a hanger.' },
        { id: 'wno', svg: tub + cross, name: 'Do not wash', means: 'The garment should not be washed in water.', we: 'Usually this means dry cleaning. We check the label and fabric, then advise you at the counter.' },
      ]},
      { group: 'Bleaching', items: [
        { id: 'bany', svg: tri, name: 'Bleach allowed', means: 'Any bleach can be used when needed.', we: 'We still use the mildest treatment that works, to protect the fabric.' },
        { id: 'bnocl', svg: tri + '<path d="M18 36l9-16M24 36l9-16"/>', name: 'Non-chlorine bleach only', means: 'Only oxygen-based (colour-safe) bleach. No chlorine bleach.', we: 'We use colour-safe products only, never chlorine.' },
        { id: 'bno', svg: tri + cross, name: 'Do not bleach', means: 'Do not use any kind of bleach.', we: 'We remove stains with treatments that contain no bleach, chosen for the fabric.' },
      ]},
      { group: 'Drying', items: [
        { id: 'dlow', svg: sq + '<circle cx="24" cy="24" r="11"/>' + dot(24, 24), name: 'Tumble dry, low heat', means: 'Can go in a dryer on a low temperature. Two dots means normal heat.', we: 'We dry on low heat to avoid shrinking.' },
        { id: 'dno', svg: sq + '<circle cx="24" cy="24" r="11"/>' + cross, name: 'Do not tumble dry', means: 'Do not use a dryer. The heat can shrink or damage the fabric.', we: 'We air dry it the right way for its shape.' },
        { id: 'dline', svg: sq + '<path d="M8 15c10 7 22 7 32 0"/>', name: 'Line dry', means: 'Hang it on a line or hanger to dry.', we: 'We hang it to dry so it keeps its shape.' },
        { id: 'dflat', svg: sq + '<path d="M14 24h20"/>', name: 'Dry flat', means: 'Lay it flat to dry, so knits and heavy fabrics do not stretch.', we: 'We dry knits and delicate pieces flat on a rack.' },
      ]},
      { group: 'Ironing', items: [
        { id: 'i1', svg: iron + dot(24, 29), name: 'Iron on low (max 110°C)', means: 'Iron on a low setting. Steam may damage the fabric.', we: 'We press on low heat, with a cloth where needed, for silks and synthetics.' },
        { id: 'i2', svg: iron + dot(20, 29) + dot(28, 29), name: 'Iron on medium (max 150°C)', means: 'Iron on a medium setting, suitable for wool and polyester blends.', we: 'Steam pressed and finished by hand at the right heat.' },
        { id: 'i3', svg: iron + dot(17, 29) + dot(24, 29) + dot(31, 29), name: 'Iron on high (max 200°C)', means: 'Iron on a high setting, suitable for cotton and linen.', we: 'We steam press for sharp collars and clean creases.' },
        { id: 'ino', svg: iron + cross, name: 'Do not iron', means: 'Do not iron or press. Heat can melt or mark the fabric.', we: 'We use steam only where it is safe, or finish it without pressing.' },
      ]},
      { group: 'Professional care', items: [
        { id: 'pp', svg: ring('P'), name: 'Dry clean', means: 'Can be dry cleaned professionally with standard solvents.', we: 'We dry clean it, then press and finish it by hand.' },
        { id: 'pf', svg: ring('F'), name: 'Dry clean, gentle solvent only', means: 'Can be dry cleaned only with a mild hydrocarbon solvent, often for delicate fabrics and trims.', we: 'We use a gentle process suited to delicate pieces.' },
        { id: 'pw', svg: ring('W'), name: 'Professional wet clean', means: 'Can be cleaned professionally in water, a gentle alternative to dry cleaning.', we: 'We clean it gently with water-based professional care.' },
        { id: 'pno', svg: ring('') + cross, name: 'Do not dry clean', means: 'The garment should not be dry cleaned.', we: 'We will check the fabric and advise you on the safest way to clean it.' },
      ]},
    ];

    const icon = (svg, cls) => `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
    const all = LABELS.flatMap((g) => g.items);
    labelsPicker.innerHTML = LABELS.map((g) => `
      <div class="labels__group">
        <p class="labels__group-name">${g.group}</p>
        <div class="labels__row">${g.items.map((it) => `<button type="button" class="label-chip" data-id="${it.id}" aria-pressed="false" aria-label="${it.name}" title="${it.name}">${icon(it.svg, 'label-chip__ic')}</button>`).join('')}</div>
      </div>`).join('');
    const detail = document.getElementById('labels-detail');
    const showLabel = (id) => {
      const it = all.find((x) => x.id === id);
      labelsPicker.querySelectorAll('.label-chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
      detail.innerHTML = `
        <button class="labels__close" type="button" aria-label="Close">×</button>
        <div class="labels__big">${icon(it.svg, 'labels__big-ic')}</div>
        <h3 class="labels__name">${it.name}</h3>
        <p class="labels__means">${it.means}</p>
        <div class="labels__we"><p class="labels__we-head">At LaundroPlus</p><p>${it.we}</p></div>
        <a class="labels__ask" href="https://wa.me/94742555515?text=${encodeURIComponent(`Hello LaundroPlus, my garment's label says "${it.name}". Can you clean it?`)}" target="_blank" rel="noopener">Not sure? Ask us on WhatsApp →</a>`;
    };
    labelsPicker.addEventListener('click', (e) => {
      const b = e.target.closest('.label-chip');
      if (!b) return;
      showLabel(b.dataset.id);
      detail.classList.add('is-open'); // phones: slide the answer up from the bottom
      // Keep the tapped symbol visible above the panel
      if (window.matchMedia('(max-width: 860px)').matches) {
        const overlap = b.getBoundingClientRect().bottom - (window.innerHeight - detail.offsetHeight) + 16;
        if (overlap > 0) window.scrollBy({ top: overlap, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
    // Close the phone panel with ×, Escape, or once the section scrolls out of view
    const closeLabel = () => {
      detail.classList.remove('is-open');
      labelsPicker.querySelectorAll('.label-chip').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    };
    detail.addEventListener('click', (e) => { if (e.target.closest('.labels__close')) closeLabel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && detail.classList.contains('is-open')) closeLabel(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { if (!en.isIntersecting && detail.classList.contains('is-open')) closeLabel(); })
        .observe(labelsPicker);
    }
    showLabel('w30');
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
