// Restrained motion: one hero reveal, care symbols drawing in, slight photo depth.
// Skipped entirely for visitors who prefer reduced motion.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;

  // Care symbols draw in once when they come into view
  const icons = document.querySelectorAll('.svc__ic, .step__ic');
  const drawIo = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-drawn'); drawIo.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  icons.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 100}ms`;
    drawIo.observe(el);
  });

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero headline: words rise out of a mask, once
  const h1 = document.querySelector('.hero h1');
  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
  const wrapWords = (node, target) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.setAttribute('aria-hidden', 'true');
          w.innerHTML = '<span class="w__i"></span>';
          w.firstChild.textContent = part;
          target.appendChild(w);
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const copy = child.cloneNode(false);
        wrapWords(child, copy);
        target.appendChild(copy);
      }
    });
  };
  const frag = document.createDocumentFragment();
  wrapWords(h1, frag);
  h1.replaceChildren(frag);

  const words = h1.querySelectorAll('.w__i');
  const bits = document.querySelectorAll('.hero .eyebrow, .hero__lede, .hero__cta');
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 });
  tl.from(words, { yPercent: 105, duration: 1.1, stagger: 0.05 })
    .from(bits, { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.08 }, '-=0.7');
  // Never leave the hero hidden if animation frames stall
  setTimeout(() => { if (tl.progress() < 1) tl.progress(1); }, 3500);

  // Slight depth: photos move a little slower than the page
  gsap.to('.hero__slides', {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.fromTo('.team picture img', { yPercent: -4 }, {
    yPercent: 4, ease: 'none',
    scrollTrigger: { trigger: '.team', start: 'top bottom', end: 'bottom top', scrub: true },
  });
})();
