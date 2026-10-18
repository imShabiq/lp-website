// LaundroPlus website chat. Talks to the agent Worker set in data-endpoint on this script tag.
// Until an endpoint is set, the chat stays hidden and the WhatsApp button remains the way to reach us.
(() => {
  const script = document.currentScript;
  const endpoint = (script && script.dataset.endpoint || '').trim();
  if (!endpoint) return;

  const GREETING = 'Ayubowan! I’m the LaundroPlus web assistant. How can I help with your clothes today?';
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
  launcher.innerHTML = '<span class="chat-launch__dot" aria-hidden="true"></span>Ask us';

  const panel = document.createElement('section');
  panel.className = 'chat';
  panel.id = 'chat-panel';
  panel.setAttribute('aria-label', 'Chat with LaundroPlus');
  panel.hidden = true;
  panel.innerHTML = `
    <header class="chat__head">
      <img src="img/logo.png" alt="" width="34" height="34">
      <div><p class="chat__title">LaundroPlus</p><p class="chat__sub">Web assistant · replies in seconds</p></div>
      <button class="chat__close" type="button" aria-label="Close chat">×</button>
    </header>
    <div class="chat__log" role="log" aria-live="polite"></div>
    <form class="chat__form">
      <label class="sr-only" for="chat-input">Your message</label>
      <textarea id="chat-input" rows="1" maxlength="1000" placeholder="Type your question"></textarea>
      <button class="chat__send" type="submit" aria-label="Send message">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>
    <p class="chat__note">Automated assistant. For orders and prices, our team will follow up.</p>`;
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
    a.textContent = 'Continue on WhatsApp';
    log.appendChild(a);
    log.scrollTop = log.scrollHeight;
  };

  bubble('assistant', GREETING);
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
        bubble('assistant', data.error || 'The assistant is unavailable right now. Please message us on WhatsApp.');
        handoffButton();
      } else {
        messages.push({ role: 'assistant', content: data.reply });
        save();
        bubble('assistant', data.reply);
        if (data.handoff) handoffButton();
      }
    } catch (err) {
      typing.remove();
      bubble('assistant', 'We couldn’t connect. Check your internet connection, or message us on WhatsApp.');
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
        <p class="chat-teaser__hello">Ayubowan! Welcome to LaundroPlus 🙏</p>
        <p class="chat-teaser__text">I’m the LaundroPlus web assistant. How can I help with your clothes today?</p>
      </div>
      <div class="chat-teaser__chips">
        <button type="button">Opening hours</button>
        <button type="button">Express service</button>
        <button type="button">Nearest outlet</button>
      </div>`;
    const QUESTIONS = {
      'Opening hours': 'What are your opening hours?',
      'Express service': 'How does your express service work?',
      'Nearest outlet': 'Where are your outlets?',
    };
    let hideTimer;
    const hideTeaser = () => {
      clearTimeout(hideTimer);
      teaser.classList.remove('is-visible');
      setTimeout(() => teaser.remove(), 400);
      window.removeEventListener('scroll', onFarScroll);
    };
    const startY = () => window.scrollY;
    let firstY = 0;
    const onFarScroll = () => { if (Math.abs(window.scrollY - firstY) > window.innerHeight * 1.5) hideTeaser(); };

    teaser.querySelector('.chat-teaser__close').addEventListener('click', hideTeaser);
    teaser.querySelectorAll('.chat-teaser__chips button').forEach((btn) => {
      btn.addEventListener('click', () => {
        hideTeaser();
        setOpen(true);
        send(QUESTIONS[btn.textContent]);
      });
    });
    launcher.addEventListener('click', hideTeaser);

    setTimeout(() => {
      if (!panel.hidden) return; // chat already open
      document.body.appendChild(teaser);
      void teaser.offsetHeight; // apply the start position first so the fade-in plays
      teaser.classList.add('is-visible');
      setTimeout(() => teaser.classList.add('is-typed'), 900); // short "typing" moment, then the message
      try { sessionStorage.setItem(TEASER_KEY, '1'); } catch (e) {}
      firstY = startY();
      window.addEventListener('scroll', onFarScroll, { passive: true });
      hideTimer = setTimeout(hideTeaser, 12000);
      teaser.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      teaser.addEventListener('mouseleave', () => { hideTimer = setTimeout(hideTeaser, 6000); });
    }, 1000);
  }
})();
