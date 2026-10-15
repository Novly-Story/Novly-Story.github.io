(() => {
  'use strict';

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  let observer;

  function showAll() {
    document.documentElement.classList.remove('motion-ready');
    reveals.forEach(element => element.classList.add('is-visible'));
    observer?.disconnect();
  }

  if (!motion.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    document.querySelectorAll('.section-heading, .writing-copy, .writing-details, .ai-copy, .possibility-list, .question-list, .footer-top').forEach(group => {
      [...group.children].forEach((element, index) => {
        if (element.matches('[data-reveal]')) element.style.setProperty('--delay', `${Math.min(index, 3) * 75}ms`);
      });
    });
    reveals.forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }

  // A real screenshot, not an invented demo: let the visitor explore its three areas.
  const descriptions = {
    manuscript: 'A clear page, chapter by chapter. Format your draft, highlight a passage and keep writing as pages break automatically.',
    world: 'The story around the story. Navigate chapters and keep characters, locations and the details of your world within reach.',
    assistant: 'Help when you ask for it. The assistant sees your active chapter, cast and locations, so the next suggestion belongs to your book.'
  };
  const image = document.querySelector('.explorer-image');
  const description = document.querySelector('#view-description');
  const controls = [...document.querySelectorAll('[data-view]')];

  controls.forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.view;
    if (!Object.hasOwn(descriptions, view)) return;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    image.dataset.focus = view;
    description.textContent = descriptions[view];
  }));
  document.documentElement.classList.add('interactive');

  // A chaptered hero: real features, with visitor-controlled and accessible playback.
  const carousel = document.querySelector('.feature-carousel');
  const slides = [...carousel.querySelectorAll('[data-slide]')];
  const chapters = [...carousel.querySelectorAll('[data-feature]')];
  const pauseButton = carousel.querySelector('[data-carousel="pause"]');
  const stage = carousel.querySelector('.feature-slides');
  const status = carousel.querySelector('.carousel-status');
  const duration = 6500;
  let activeSlide = 0;
  let userPaused = motion.matches;
  let inView = true;
  let hovering = false;
  let timer = null;
  let startedAt = 0;
  let remaining = duration;

  function stopTimer() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
  }

  function syncPlayback() {
    const focused = carousel.contains(document.activeElement) && document.activeElement !== pauseButton;
    const enabled = !userPaused && !motion.matches;
    const held = !inView || document.hidden || hovering || focused;
    carousel.classList.toggle('is-playing', enabled);
    carousel.classList.toggle('is-held', held);
    pauseButton.disabled = motion.matches;
    pauseButton.setAttribute('aria-pressed', String(!enabled));
    pauseButton.setAttribute('aria-label', motion.matches ? 'Automatic playback is off for reduced motion' : enabled ? 'Pause feature carousel' : 'Play feature carousel');
    if (!enabled || held) {
      stopTimer();
      return;
    }
    if (timer !== null) return;
    startedAt = performance.now();
    timer = setTimeout(() => {
      timer = null;
      selectSlide((activeSlide + 1) % slides.length);
    }, remaining);
  }

  function selectSlide(index, manual = false) {
    if (manual) userPaused = true;
    stopTimer();
    remaining = duration;
    carousel.classList.remove('is-playing');
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const wasActive = slide.classList.contains('is-active');
      const isActive = position === activeSlide;
      slide.classList.toggle('is-leaving', wasActive && !isActive);
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.inert = !isActive;
    });
    chapters.forEach((chapter, position) => chapter.setAttribute('aria-pressed', String(position === activeSlide)));
    // Restart the progress animation only on a chapter change, not on hover or focus.
    void carousel.offsetWidth;
    if (manual) status.textContent = slides[activeSlide].getAttribute('aria-label');
    syncPlayback();
  }

  chapters.forEach(chapter => chapter.addEventListener('click', () => selectSlide(Number(chapter.dataset.feature), true)));
  carousel.querySelector('[data-carousel="previous"]').addEventListener('click', () => selectSlide(activeSlide - 1, true));
  carousel.querySelector('[data-carousel="next"]').addEventListener('click', () => selectSlide(activeSlide + 1, true));
  pauseButton.addEventListener('click', () => {
    if (motion.matches) return;
    userPaused = !userPaused;
    remaining = duration;
    carousel.classList.remove('is-playing');
    void carousel.offsetWidth;
    syncPlayback();
  });
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  stage.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovering = true;
    syncPlayback();
  });
  stage.addEventListener('pointerleave', () => { hovering = false; syncPlayback(); });
  carousel.addEventListener('focusin', syncPlayback);
  carousel.addEventListener('focusout', () => requestAnimationFrame(syncPlayback));
  document.addEventListener('visibilitychange', syncPlayback);
  let touchStart;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') touchStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  stage.addEventListener('pointerup', event => {
    if (!touchStart || event.pointerType !== 'touch') return;
    const x = event.clientX - touchStart.x;
    const y = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.5) selectSlide(activeSlide + (x < 0 ? 1 : -1), true);
  }, { passive: true });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.15 }).observe(carousel);
  }
  syncPlayback();

  // Opening-page perspective and layered curves, without taking over scrolling.
  const product = document.querySelector('.product-parallax');
  const curves = document.querySelector('.page-curves');
  const hero = document.querySelector('.hero');
  let scheduled = false;
  let heroInView = true;

  function updateParallax() {
    scheduled = false;
    if (motion.matches || !heroInView) return;
    const progress = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 1.1)));
    product.style.transform = `translateY(${-progress * 35}px) rotateX(${(1 - progress) * 2}deg)`;
    curves.style.transform = `translateY(${progress * 100}px)`;
  }

  function queueParallax() {
    if (scheduled || motion.matches || !heroInView) return;
    scheduled = true;
    requestAnimationFrame(updateParallax);
  }

  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroInView = entries[0].isIntersecting;
      if (heroInView) queueParallax();
    });
    heroObserver.observe(hero);
  }

  addEventListener('scroll', queueParallax, { passive: true });
  addEventListener('resize', queueParallax, { passive: true });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      userPaused = true;
      syncPlayback();
      showAll();
      product.style.removeProperty('transform');
      curves.style.removeProperty('transform');
    } else {
      syncPlayback();
      queueParallax();
    }
  });
  queueParallax();
})();
