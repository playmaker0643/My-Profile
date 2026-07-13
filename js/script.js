(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------------------------------------------------
     Loader
  --------------------------------------------------------- */
  window.addEventListener('load', () => {
    const loader = $('#loader');
    setTimeout(() => {
      loader.classList.add('hidden');
      startHeroSequence();
    }, prefersReducedMotion ? 100 : 1500);
  });

  /* ---------------------------------------------------------
     Theme toggle
  --------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggle = $('#theme-toggle');
  const savedTheme = localStorage.getItem('pm-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('pm-theme', next);
  });

  /* ---------------------------------------------------------
     Scroll progress + nav shadow + back-to-top + nav-cta reveal
  --------------------------------------------------------- */
  const progressBar = $('#scroll-progress');
  const nav = $('#site-nav');
  const backToTop = $('#back-to-top');
  const navCta = $('#nav-cta');

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';

    nav.classList.toggle('scrolled', scrollTop > 10);
    backToTop.classList.toggle('show', scrollTop > 600);
    if (navCta) navCta.style.display = scrollTop > 500 ? 'inline-flex' : 'none';
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------
     Mobile nav
  --------------------------------------------------------- */
  const navToggle = $('#nav-toggle');
  const mobileMenu = $('#mobile-menu');
  navToggle.addEventListener('click', () => {
    const open = navToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    mobileMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------------------------------------------------------
     Active nav link on scroll
  --------------------------------------------------------- */
  const sections = $$('main section[id]');
  const navLinks = $$('.nav-links a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach(s => navObserver.observe(s));

  /* ---------------------------------------------------------
     Custom cursor (desktop only)
  --------------------------------------------------------- */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    function ringLoop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(ringLoop);
    }
    ringLoop();
    $$('a, button, input, textarea, .project-card, .filter-chip').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('active'));
    });
  }

  /* ---------------------------------------------------------
     Hero: terminal boot lines + typed titles
  --------------------------------------------------------- */
  function startHeroSequence() {
    const lines = $$('#terminal-body .line');
    lines.forEach((line, i) => {
      setTimeout(() => {
        line.style.transition = 'opacity 300ms ease';
        line.style.opacity = '1';
      }, prefersReducedMotion ? 0 : i * 220);
    });
    startTyping();
    animateStats();
  }

  const titles = [
    'Computer Software Engineering Student',
    'Frontend Developer',
    'Cybersecurity Enthusiast',
    'Future Software Engineer'
  ];
  function startTyping() {
    const el = $('#type-line');
    if (!el) return;
    if (prefersReducedMotion) {
      el.textContent = titles.join(' · ');
      return;
    }
    let ti = 0, ci = 0, deleting = false;
    const caret = document.createElement('span');
    caret.className = 'caret';
    function tick() {
      const current = titles[ti];
      if (!deleting) {
        ci++;
        el.textContent = current.slice(0, ci);
        el.appendChild(caret);
        if (ci === current.length) {
          deleting = true;
          setTimeout(tick, 1400);
          return;
        }
      } else {
        ci--;
        el.textContent = current.slice(0, ci);
        el.appendChild(caret);
        if (ci === 0) {
          deleting = false;
          ti = (ti + 1) % titles.length;
        }
      }
      setTimeout(tick, deleting ? 30 : 55);
    }
    tick();
  }

  /* ---------------------------------------------------------
     Animated stat counters
  --------------------------------------------------------- */
  let statsAnimated = false;
  function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;
    $$('#stat-strip [data-count]').forEach(el => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (prefersReducedMotion) { el.textContent = target; return; }
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const iv = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(iv); }
        el.textContent = cur;
      }, 30);
    });
    $('#stat-strip').classList.add('in');
  }

  /* ---------------------------------------------------------
     Network canvas background (hero)
  --------------------------------------------------------- */
  (function networkCanvas() {
    const canvas = $('#network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, nodes = [];
    const NODE_COUNT_BASE = 60;

    function resize() {
      const hero = $('.hero');
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
      const count = Math.min(NODE_COUNT_BASE, Math.floor((w * h) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['rgba(59,130,246,', 'rgba(34,211,238,', 'rgba(168,85,247,'];

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = colors[i % colors.length] + (1 - dist / 140) * 0.18 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n, i) => {
        ctx.fillStyle = colors[i % colors.length] + '0.8)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (!prefersReducedMotion) requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ---------------------------------------------------------
     Scroll reveal (IntersectionObserver)
  --------------------------------------------------------- */
  const revealEls = $$('.reveal, .reveal-stagger');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        if (entry.target.id === 'skills-grid' || entry.target.closest('#skills')) {
          animateSkillBars(entry.target);
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  function animateSkillBars(scope) {
    $$('.skill-row', scope).forEach(row => {
      const pct = row.getAttribute('data-pct');
      const bar = $('.skill-bar span', row);
      if (bar) setTimeout(() => { bar.style.width = pct + '%'; }, 100);
    });
  }

  /* ---------------------------------------------------------
     Projects: filter + search
  --------------------------------------------------------- */
  const projectCards = $$('.project-card');
  const filterChips = $$('.filter-chip');
  const searchInput = $('#project-search');
  const noResults = $('#no-results');
  let activeFilter = 'all';

  function applyProjectFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    let visibleCount = 0;
    projectCards.forEach(card => {
      const tags = card.getAttribute('data-tags') || '';
      const text = card.textContent.toLowerCase();
      const matchesFilter = activeFilter === 'all' || tags.includes(activeFilter);
      const matchesSearch = !q || text.includes(q);
      const show = matchesFilter && matchesSearch;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      applyProjectFilters();
    });
  });
  searchInput.addEventListener('input', applyProjectFilters);

  /* ---------------------------------------------------------
     Contact form validation
  --------------------------------------------------------- */
  const form = $('#contact-form');
  const formStatus = $('#form-status');

  function setFieldError(rowId, errId, message) {
    const row = document.getElementById(rowId);
    const errEl = document.getElementById(errId);
    row.classList.toggle('invalid', !!message);
    errEl.textContent = message || '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#f-name').value.trim();
    const email = $('#f-email').value.trim();
    const message = $('#f-message').value.trim();
    let valid = true;

    if (name.length < 2) {
      setFieldError('row-name', 'err-name', 'Please enter your full name.');
      valid = false;
    } else setFieldError('row-name', 'err-name', '');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setFieldError('row-email', 'err-email', 'Please enter a valid email address.');
      valid = false;
    } else setFieldError('row-email', 'err-email', '');

    if (message.length < 10) {
      setFieldError('row-message', 'err-message', 'Message should be at least 10 characters.');
      valid = false;
    } else setFieldError('row-message', 'err-message', '');

    if (!valid) {
      formStatus.textContent = 'Please fix the errors above.';
      formStatus.className = 'form-status';
      return;
    }

    formStatus.textContent = 'Sending…';
    formStatus.className = 'form-status';
    setTimeout(() => {
      formStatus.textContent = `Thanks, ${name.split(' ')[0]} — your message has been queued. I'll reply at ${email} soon.`;
      formStatus.className = 'form-status success';
      form.reset();
    }, 900);
  });

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     PWA: service worker registration
  --------------------------------------------------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
