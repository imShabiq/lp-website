// LaundroPlus website chat. Talks to the agent Worker set in data-endpoint on this script tag.
// Until an endpoint is set, the chat stays hidden and the WhatsApp button remains the way to reach us.
(() => {
  const script = document.currentScript;
  const endpoint = (script && script.dataset.endpoint || '').trim();
  if (!endpoint) return;

  // Text comes from i18n.js in the visitor's chosen language (English if it is missing)
  const EN = {
    chat_launch: 'Ask us', chat_sub: 'Web assistant · replies in seconds', chat_placeholder: 'Type your question',
    chat_note: 'Automated assistant. For orders and prices, our team will follow up.',
    chat_greeting: 'Ayubowan! I’m the LaundroPlus web assistant. How can I help with your clothes today?',
    chat_hello: 'Ayubowan! Welcome to LaundroPlus 🙏', chat_text: 'I’m the LaundroPlus web assistant. How can I help with your clothes today?',
    chip_hours: 'Opening hours', chip_express: 'Express service', chip_outlet: 'Nearest outlet',
    q_hours: 'What are your opening hours?', q_express: 'How does your express service work?', q_outlet: 'Where are your outlets?',
    chat_wa: 'Continue on WhatsApp', chat_down: 'The assistant is unavailable right now. Please message us on WhatsApp.',
    chat_offline: 'We couldn’t connect. Check your internet connection, or message us on WhatsApp.',
  };
  const T = (k) => (window.LP ? window.LP.t(k) : EN[k]);
  const WA_NUMBER = '94742555515';
  const STORE_KEY = 'lp-chat';

  let messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch (e) { messages = []; }
  const save = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-20))); } catch (e) {} };

  // ---- Build the UI ----
  const launcher = document.createElement('button');
  launcher.className = 'chat-launch';
  launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'chat-panel');
  launcher.innerHTML = `<span class="chat-launch__dot" aria-hidden="true"></span><span class="chat-launch__text">${T('chat_launch')}</span>`;

  const panel = document.createElement('section');
  panel.className = 'chat';
  panel.id = 'chat-panel';
  panel.setAttribute('aria-label', 'Chat with LaundroPlus');
  panel.hidden = true;
  panel.innerHTML = `
    <header class="chat__head">
      <img src="img/logo.png" alt="" width="34" height="34">
      <div><p class="chat__title">LaundroPlus</p><p class="chat__sub">${T('chat_sub')}</p></div>
      <button class="chat__close" type="button" aria-label="Close chat">×</button>
    </header>
    <div class="chat__log" role="log" aria-live="polite"></div>
    <form class="chat__form">
      <label class="sr-only" for="chat-input">Your message</label>
      <textarea id="chat-input" rows="1" maxlength="1000" placeholder="${T('chat_placeholder')}"></textarea>
      <button class="chat__send" type="submit" aria-label="Send message">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>
    <p class="chat__note">${T('chat_note')}</p>`;
  document.body.append(panel, launcher);

  const log = panel.querySelector('.chat__log');
  const form = panel.querySelector('.chat__form');
  const input = panel.querySelector('textarea');
  const sendBtn = panel.querySelector('.chat__send');

  const bubble = (role, text) => {
    const el = document.createElement('div');
    el.className = `msg msg--${role}`;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const handoffButton = () => {
    const lastQuestion = [...messages].reverse().find((m) => m.role === 'user');
    const text = `Hello LaundroPlus, I was chatting on your website.${lastQuestion ? ` My question: ${lastQuestion.content}` : ''}`;
    const a = document.createElement('a');
    a.className = 'msg__wa';
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = T('chat_wa');
    log.appendChild(a);
    log.scrollTop = log.scrollHeight;
  };

  const greetingEl = bubble('assistant', T('chat_greeting'));
  // Switching language updates the chat's own labels and its opening greeting
  document.addEventListener('lp:lang', () => {
    launcher.querySelector('.chat-launch__text').textContent = T('chat_launch');
    panel.querySelector('.chat__sub').textContent = T('chat_sub');
    panel.querySelector('.chat__note').textContent = T('chat_note');
    input.placeholder = T('chat_placeholder');
    greetingEl.textContent = T('chat_greeting');
    log.querySelectorAll('.msg__wa').forEach((a) => { a.textContent = T('chat_wa'); });
  });
  messages.forEach((m) => bubble(m.role, m.content));

  const setOpen = (open) => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.classList.toggle('is-open', open);
    if (open) { input.focus(); log.scrollTop = log.scrollHeight; } else { launcher.focus(); }
  };
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  panel.querySelector('.chat__close').addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  // Enter sends, Shift+Enter adds a line
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });

  let busy = false;
  const send = async (text) => {
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    messages.push({ role: 'user', content: text });
    save();
    bubble('user', text);
    const typing = bubble('assistant', '');
    typing.classList.add('msg--typing');
    typing.setAttribute('aria-label', 'Assistant is typing');
    typing.innerHTML = '<span></span><span></span><span></span>';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok || !data.reply) {
        bubble('assistant', data.error || T('chat_down'));
        handoffButton();
      } else {
        messages.push({ role: 'assistant', content: data.reply });
        save();
        bubble('assistant', data.reply);
        if (data.handoff) handoffButton();
      }
    } catch (err) {
      typing.remove();
      bubble('assistant', T('chat_offline'));
      handoffButton();
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value.trim()); });

  // ---- Greeting bubble: appears 1 second after arrival, once per visit, then hides itself ----
  const TEASER_KEY = 'lp-teaser-shown';
  let teaserShown = false;
  try { teaserShown = sessionStorage.getItem(TEASER_KEY) === '1'; } catch (e) {}
  if (!teaserShown && !messages.length) {
    const teaser = document.createElement('div');
    teaser.className = 'chat-teaser';
    teaser.setAttribute('role', 'status');
    teaser.innerHTML = `
      <button class="chat-teaser__close" type="button" aria-label="Close message">×</button>
      <div class="chat-teaser__typing" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="chat-teaser__body">
        <p class="chat-teaser__hello">${T('chat_hello')}</p>
        <p class="chat-teaser__text">${T('chat_text')}</p>
      </div>
      <div class="chat-teaser__chips">
        <button type="button" data-q="q_hours">${T('chip_hours')}</button>
        <button type="button" data-q="q_express">${T('chip_express')}</button>
        <button type="button" data-q="q_outlet">${T('chip_outlet')}</button>
      </div>`;
    let hideTimer;
    const hideTeaser = () => {
      clearTimeout(hideTimer);
      teaser.classList.remove('is-visible');
      setTimeout(() => teaser.remove(), 400);
      window.removeEventListener('scroll', onFarScroll);
    };
    const startY = () => window.scrollY;
    let firstY = 0;
    const onFarScroll = () => { if (Math.abs(window.scrollY - firstY) > 30) hideTeaser(); }; // any real scroll hides it

    teaser.querySelector('.chat-teaser__close').addEventListener('click', hideTeaser);
    teaser.querySelectorAll('.chat-teaser__chips button').forEach((btn) => {
      btn.addEventListener('click', () => {
        hideTeaser();
        setOpen(true);
        send(T(btn.dataset.q));
      });
    });
    launcher.addEventListener('click', hideTeaser);

    setTimeout(() => {
      if (!panel.hidden) return; // chat already open
      document.body.appendChild(teaser);
      void teaser.offsetHeight; // apply the start position first so the fade-in plays
      teaser.classList.add('is-visible');
      setTimeout(() => {
        teaser.classList.add('is-typed'); // short "typing" moment, then the message
        hideTimer = setTimeout(hideTeaser, 3000); // message stays 3 seconds
      }, 900);
      try { sessionStorage.setItem(TEASER_KEY, '1'); } catch (e) {}
      firstY = startY();
      window.addEventListener('scroll', onFarScroll, { passive: true });
      teaser.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      teaser.addEventListener('mouseleave', () => { hideTimer = setTimeout(hideTeaser, 3000); });
    }, 1000);
  }
})();
