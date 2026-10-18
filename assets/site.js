// Novly website: reveals, the live manuscript, the Continue control, the index cards, the cover.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal once as each part enters; nothing stays hidden if the observer never fires.
  const targets = document.querySelectorAll('[data-reveal], [data-shutter]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
    window.addEventListener('load', () => setTimeout(() => {
      targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
    }, 2500));
  } else {
    targets.forEach((el) => el.classList.add('is-in'));
  }


  // Hero carousel: four moments of Novly, advancing on their own with a ribbon progress tab.
  (() => {
    const stage = document.querySelector('.stage');
    const slides = [...document.querySelectorAll('.slide')];
    const tabs = [...document.querySelectorAll('.slide-tab')];
    const tabBar = document.querySelector('.slide-tabs');
    if (!stage || slides.length < 2) return;
    const time = 7000;
    let index = 0;
    let timer = null;
    let paused = false;
    const typed = document.getElementById('ai-typed');
    const aiText = 'Ivo leaned closer. “That isn’t a star,” he said. “It’s a door.” Mara pressed her thumb to the ink. It was still wet.';
    let aiTimer = null;

    function typeAI() {
      clearInterval(aiTimer);
      if (!typed) return;
      if (reduce) { typed.textContent = aiText; return; }
      let i = 0;
      typed.textContent = '';
      aiTimer = setInterval(() => {
        i += Math.max(1, Math.round(Math.random() * 3));
        typed.textContent = aiText.slice(0, i);
        if (i >= aiText.length) clearInterval(aiTimer);
      }, 38);
    }

    function show(next, user = false) {
      next = (next + slides.length) % slides.length;
      if (next === index && !user) return;
      const previous = slides[index];
      slides.forEach((slide) => slide.classList.remove('is-first'));
      if (next !== index) {
        previous.classList.remove('is-active');
        previous.classList.add('is-leaving');
        previous.setAttribute('aria-hidden', 'true');
        setTimeout(() => previous.classList.remove('is-leaving'), 720);
      }
      slides[next].classList.add('is-active');
      slides[next].removeAttribute('aria-hidden');
      tabs.forEach((tab, i) => {
        tab.classList.toggle('is-active', i === next);
        tab.classList.toggle('is-done', i < next);
        tab.setAttribute('aria-selected', String(i === next));
        // restart the progress fill
        const fill = tab.querySelector('.slide-tab__fill');
        fill.style.animation = 'none';
        void fill.offsetWidth;
        fill.style.animation = '';
      });
      index = next;
      if (slides[index].id === 'slide-1') typeAI();
      schedule();
    }

    function schedule() {
      clearTimeout(timer);
      if (reduce || paused) return;
      timer = setTimeout(() => show(index + 1), time);
    }

    function setPaused(value) {
      paused = value;
      tabBar.classList.toggle('is-paused', value);
      if (value) clearTimeout(timer); else schedule();
    }

    slides[0].classList.add('is-first');
    tabs.forEach((tab) => tab.addEventListener('click', () => show(Number(tab.dataset.go), true)));
    tabBar.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      show(index + (event.key === 'ArrowRight' ? 1 : -1), true);
      tabs[index].focus();
    });
    // Pause while the visitor is reading, hovering or typing; resume when they leave.
    stage.addEventListener('pointerenter', () => setPaused(true));
    stage.addEventListener('pointerleave', () => { if (!stage.contains(document.activeElement)) setPaused(false); });
    stage.addEventListener('focusin', () => setPaused(true));
    stage.addEventListener('focusout', () => setTimeout(() => { if (!stage.contains(document.activeElement) && !stage.matches(':hover')) setPaused(false); }, 0));
    document.addEventListener('visibilitychange', () => setPaused(document.hidden));
    // Swipe on touch screens.
    let startX = null;
    stage.addEventListener('touchstart', (event) => { startX = event.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (event) => {
      if (startX === null) return;
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50 && document.activeElement?.id !== 'manuscript') show(index + (dx < 0 ? 1 : -1), true);
      startX = null;
    });
    // A slight tilt toward the pointer.
    const deck = document.getElementById('slides');
    if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('pointermove', (event) => {
        const box = stage.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        deck.style.transform = `translate(${(x * -14).toFixed(1)}px, ${(y * -10).toFixed(1)}px)`;
      });
      stage.addEventListener('pointerleave', () => { deck.style.transform = ''; });
    }
    schedule();
  })();

  // The live manuscript: names light up as you type, like Novly's preview.
  const cast = [
    { name: 'Mara Venn', short: 'Mara', kind: 'Character', detail: 'Protagonist', colour: '#f59e0b' },
    { name: 'Ivo Bell', short: 'Ivo', kind: 'Character', detail: 'Mentor', colour: '#8b5cf6' }, // taste-skill-ignore: the character's colour in the app
    { name: 'The Observatory', kind: 'Location', detail: 'Location', colour: '#10b981' },
    { name: 'Bellweather Bay', kind: 'Location', detail: 'Location', colour: '#3b82f6' },
  ];
  const commands = [
    { label: 'Continue with AI', detail: 'Write what happens next', run: () => continueStory(true) },
    { label: 'Heading', detail: 'Turn into a heading', run: () => {} },
    { label: 'Quote', detail: 'Turn into a quote', run: () => {} },
    { label: 'Scene break', detail: 'Insert * * *', run: () => insertAtCaret('\n\n* * *\n\n') },
  ];
  const input = document.getElementById('manuscript');
  const mirror = document.getElementById('mirror');
  const mentions = document.getElementById('mentions');
  const words = document.getElementById('live-words');
  const menu = document.getElementById('menu');
  const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const names = cast.flatMap((c) => [c.name, c.short].filter(Boolean).map((n) => ({ n, c })))
    .sort((a, b) => b.n.length - a.n.length);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${names.map(({ n }) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:['’]s)?(?![\\p{L}\\p{N}])`, 'giu');

  function render() {
    if (!input) return;
    const text = input.value;
    const counts = new Map();
    let html = '';
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      const found = names.find(({ n }) => n.toLowerCase() === match[1].toLowerCase());
      if (!found) continue;
      counts.set(found.c, (counts.get(found.c) || 0) + 1);
      html += escape(text.slice(last, match.index)) + `<mark style="--c:${found.c.colour}">${escape(match[0])}</mark>`;
      last = match.index + match[0].length;
    }
    html += escape(text.slice(last)) + '\n';
    mirror.innerHTML = html;
    input.style.height = mirror.offsetHeight + 'px';
    words.textContent = (text.match(/\S+/g) || []).length;
    mentions.innerHTML = [...counts].map(([c, n]) => `<span style="--c:${c.colour}">${escape(c.short || c.name)} <b>×${n}</b></span>`).join('');
  }

  // "@" names and "/" commands, from the word before the caret.
  let menuState = null;
  function updateMenu() {
    const before = input.value.slice(0, input.selectionStart);
    const match = before.match(/(^|\s)([@/])([^\s@/]{0,20})$/);
    if (!match || input.selectionStart !== input.selectionEnd) return closeMenu();
    const [, , trigger, query] = match;
    const q = query.toLowerCase();
    const items = trigger === '@'
      ? cast.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ label: c.name, detail: c.detail, colour: c.colour, run: () => replaceTrigger(c.name) }))
      : commands.filter((c) => c.label.toLowerCase().includes(q)).map((c) => ({ ...c, run: () => { replaceTrigger(''); c.run(); } }));
    if (!items.length) return closeMenu();
    menuState = { start: input.selectionStart - query.length - 1, items, index: 0 };
    drawMenu();
  }
  function drawMenu() {
    menu.innerHTML = menuState.items.map((item, i) => `<button type="button" role="option" class="${i === menuState.index ? 'is-active' : ''}" data-i="${i}">${item.colour ? `<span class="dot" style="--c:${item.colour}"></span>` : ''}${escape(item.label)}<small>${escape(item.detail)}</small></button>`).join('');
    menu.hidden = false;
  }
  function closeMenu() { menuState = null; menu.hidden = true; }
  function replaceTrigger(text) {
    const { start } = menuState;
    const end = input.selectionStart;
    input.setRangeText(text, start, end, 'end');
    closeMenu();
    render();
    input.focus();
  }
  function insertAtCaret(text) {
    input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
    render();
  }
  if (input) {
    input.addEventListener('input', () => { render(); updateMenu(); });
    input.addEventListener('keydown', (event) => {
      if (!menuState) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const n = menuState.items.length;
        menuState.index = (menuState.index + (event.key === 'ArrowDown' ? 1 : n - 1)) % n;
        drawMenu();
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        menuState.items[menuState.index].run();
      } else if (event.key === 'Escape') {
        closeMenu();
      }
    });
    input.addEventListener('blur', () => setTimeout(closeMenu, 150));
    menu.addEventListener('mousedown', (event) => {
      const button = event.target.closest('button');
      if (!button || !menuState) return;
      event.preventDefault();
      menuState.items[Number(button.dataset.i)].run();
    });
    render();
    new ResizeObserver(render).observe(input.parentElement);
  }

  // The Continue control: the AI writes the next lines of the sample book.
  const sample = [
    'Mara turned the brass key until the cabinet sighed open. Inside, on the oldest map of Bellweather Bay, someone had drawn a seventh star in fresh ink.',
    'Ivo leaned closer. “That isn’t a star,” he said. “It’s a door.”',
  ];
  const showcase = document.querySelector('.showcase');
  const button = document.getElementById('continue');
  const output = document.getElementById('continuation');
  const stuck = document.getElementById('stuck-word');
  let typing = null;
  function typeInto(element, text, done) {
    if (reduce) { element.textContent = text; done?.(); return; }
    let i = 0;
    clearInterval(typing);
    typing = setInterval(() => {
      i += Math.max(1, Math.round(Math.random() * 3));
      element.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing); done?.(); }
    }, 22);
  }
  function continueStory(fromManuscript = false) {
    if (fromManuscript && input) {
      const addition = (input.value.endsWith('\n') ? '' : '\n\n') + sample[0];
      const base = input.value;
      let i = 0;
      clearInterval(typing);
      if (reduce) { input.value = base + addition; render(); return; }
      typing = setInterval(() => {
        i += 2;
        input.value = base + addition.slice(0, i);
        render();
        if (i >= addition.length) clearInterval(typing);
      }, 24);
      return;
    }
    const night = showcase.dataset.state !== 'night';
    showcase.dataset.state = night ? 'night' : 'gold';
    stuck.textContent = night ? 'Unstuck' : 'Stuck';
    if (night) typeInto(output, sample.join(' ')); else { clearInterval(typing); output.textContent = ''; }
  }
  button?.addEventListener('click', () => continueStory(false));

  // Index cards: one open at a time.
  const cards = [...document.querySelectorAll('.card')];
  cards.forEach((card) => {
    card.querySelector('.card__tab').addEventListener('click', () => {
      cards.forEach((other) => {
        const open = other === card ? !other.classList.contains('is-open') : false;
        other.classList.toggle('is-open', open);
        other.querySelector('.card__tab').setAttribute('aria-expanded', String(open));
      });
    });
  });

  // The blank in the closing sentence titles the cover beside it.
  const title = document.getElementById('title-input');
  const cover = document.getElementById('cover-title');
  title?.addEventListener('input', () => { cover.textContent = title.value.trim() || 'Your book'; });

  // Download buttons link straight to the newest Novly.dmg (GitHub's latest-release download URL),
  // so they work without JavaScript. The lookup only pins the exact file and shows the version.
  const RELEASES = 'https://api.github.com/repos/Novly-Story/releases/releases/latest';
  fetch(RELEASES, { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((release) => {
      const dmg = (release.assets || []).find((asset) => asset.name === 'Novly.dmg')
        || (release.assets || []).find((asset) => asset.name === 'Novely.dmg')
        || (release.assets || []).find((asset) => asset.name.endsWith('.dmg'));
      const version = (release.tag_name || '').replace(/^v/, '');
      if (dmg) {
        document.querySelectorAll('a[data-download]').forEach((link) => { link.href = dmg.browser_download_url; });
        document.querySelectorAll('form[data-download]').forEach((form) => {
          form.addEventListener('submit', (event) => { event.preventDefault(); window.location.href = dmg.browser_download_url; });
        });
      }
      if (release.html_url) document.querySelectorAll('[data-release-page]').forEach((link) => { link.href = release.html_url; });
      if (version) document.querySelectorAll('[data-release-version]').forEach((label) => { label.textContent = ` \u00b7 v${version}`; });
    })
    .catch(() => {});

  // Story Map: switch between the constellation and the storylines.
  const mapTabs = Array.from(document.querySelectorAll('.map-tab'));
  function showMap(index, focus) {
    mapTabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls'))?.classList.toggle('is-active', on);
      if (on && focus) tab.focus();
    });
  }
  mapTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showMap(i, false));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      showMap((i + (event.key === 'ArrowRight' ? 1 : mapTabs.length - 1)) % mapTabs.length, true);
    });
  });
})();
