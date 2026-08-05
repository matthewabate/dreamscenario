/**
 * router.js — Dream Scenario
 *
 * Every section lives at its own real, crawlable URL when hosted:
 *   /              (Approach, closed hero landing)
 *   /approach.html (Approach, pre-opened)
 *   /services.html
 *   /studio.html
 *   /contact.html
 *
 * All pages are flat files at the site root — no subfolders.
 *
 * Each of those URLs is a complete, standalone HTML page — if JavaScript is
 * off, or a search engine crawls it, or someone lands on it directly, it
 * renders correctly with its own <title>, meta description, and content,
 * full page load, no tricks. Nav links carry a real, working href (a
 * relative path to the actual file) so this works even without JS.
 *
 * When JS is on AND the page is being served over http/https, clicking an
 * internal nav link is intercepted: this script fetches the destination
 * page in the background, and swaps ONLY the #scroll-content markup (and
 * the <title>/meta tags) into the current document. #hero — and the
 * <video> inside it — is never touched, so the background never restarts
 * between pages. The URL updates via history.pushState to the clean form
 * (e.g. /services/), so back/forward and bookmarking work normally.
 *
 * When the page is opened directly from disk (file://), browsers block
 * fetch() between local files, so this script does NOT intercept clicks —
 * links just navigate normally using their real relative href, which is
 * exactly how a static file browsed locally is supposed to work.
 */
(function () {
  const isFileProtocol = location.protocol === 'file:';

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeBtn = document.getElementById('closeBtn');
  const navOverlay = document.getElementById('navOverlay');
  const scrollBody = document.getElementById('scroll-body');
  const scrollContent = document.getElementById('scroll-content');
  const heroText = document.getElementById('hero-text');

  const ROUTES = {
    '/': 'approach',
    '/approach.html': 'approach',
    '/services.html': 'services',
    '/studio.html': 'studio',
    '/contact.html': 'contact'
  };

  const ACCENTS = {
    approach: 'var(--gold)',
    services: 'var(--pink)',
    studio: 'var(--olive)',
    contact: 'var(--teal)'
  };

  function normalizePath(p) {
    if (!p) return '/';
    if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
    return p;
  }

  function currentSection() {
    return document.body.dataset.pageSection;
  }

  /* ── Active nav + accent color ── */
  function setActiveSection(id) {
    document.querySelectorAll('a[data-section]').forEach(a =>
      a.classList.toggle('active', a.dataset.section === id)
    );
    document.documentElement.style.setProperty('--accent', ACCENTS[id] || 'var(--teal)');
  }

  function clearActiveSection() {
    document.querySelectorAll('a[data-section]').forEach(a => a.classList.remove('active'));
    document.documentElement.style.setProperty('--accent', 'var(--teal)');
  }

  /* ── Offset of el from scroll-content top ── */
  function offsetFromPanel(el) {
    return scrollContent.scrollTop
      + el.getBoundingClientRect().top
      - scrollContent.getBoundingClientRect().top;
  }

  /* ── Open / close the panel locally (no page change) ── */
  function openPanel() {
    if (scrollBody.classList.contains('is-open')) return;
    const first = scrollContent.querySelector('.content-section');
    const top = first ? offsetFromPanel(first) : 0;
    scrollContent.scrollTo({ top, behavior: 'instant' });
    scrollBody.classList.add('is-open');
    heroText.classList.add('is-open');
    setActiveSection(currentSection());
  }

  function closePanelLocal() {
    scrollBody.classList.remove('is-open');
    heroText.classList.remove('is-open');
    scrollContent.scrollTo({ top: 0, behavior: 'instant' });
    clearActiveSection();
  }

  /* ── Services submenu (in-page anchor scroll, unrelated to routing) ── */
  function getHeadlineOffset() {
    const right = document.querySelector('.section-right');
    return right ? parseFloat(getComputedStyle(right).paddingTop) : 102;
  }

  let subnavScrollHandler = null;

  function wireSubnav() {
    if (subnavScrollHandler) {
      scrollContent.removeEventListener('scroll', subnavScrollHandler);
      subnavScrollHandler = null;
    }
    const serviceNavLinks = document.querySelectorAll('.service-subnav a');
    if (!serviceNavLinks.length) return;

    serviceNavLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const panel = document.getElementById(link.dataset.panel);
        if (!panel) return;
        const panelTop = panel.getBoundingClientRect().top;
        const containerTop = scrollContent.getBoundingClientRect().top;
        const panelPadding = parseInt(getComputedStyle(panel).paddingTop) || 0;
        scrollContent.scrollTo({
          top: scrollContent.scrollTop + (panelTop - containerTop) - getHeadlineOffset() + panelPadding,
          behavior: 'smooth'
        });
      });
    });

    const servicePanelIds = ['panel-sd', 'panel-xa', 'panel-xd'];

    function updateSubnav() {
      const scrollTop = scrollContent.scrollTop;
      let activePanelId = servicePanelIds[0];
      for (const id of servicePanelIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const panelPadding = parseInt(getComputedStyle(el).paddingTop) || 0;
        if (el.offsetTop + panelPadding - getHeadlineOffset() <= scrollTop + 1) activePanelId = id;
      }
      serviceNavLinks.forEach(a => a.classList.toggle('active', a.dataset.panel === activePanelId));
    }

    subnavScrollHandler = updateSubnav;
    scrollContent.addEventListener('scroll', subnavScrollHandler, { passive: true });
  }

  /* ── Client logo grid sizing ── */
  function equalizeLogos() {
    const grid = document.querySelector('.client-logos');
    if (!grid) return;
    const imgs = grid.querySelectorAll('img');
    let maxW = 0;
    imgs.forEach(img => { maxW = Math.max(maxW, img.getBoundingClientRect().width); });
    if (maxW > 0) grid.style.setProperty('--logo-cell-w', maxW + 'px');
  }

  function initPageEnhancements() {
    wireSubnav();
    if (document.readyState === 'complete') equalizeLogos();
    else window.addEventListener('load', equalizeLogos, { once: true });
  }

  /* ── Cross-page navigation (http/https only): fetch + swap ── */
  let navigating = false;

  async function navigateTo(cleanPath, sectionId, { push = true } = {}) {
    const path = normalizePath(cleanPath);
    if (navigating) return;
    if (push && path === normalizePath(location.pathname)) {
      // Already on this URL — just make sure its content is actually visible
      // rather than silently doing nothing (e.g. clicking a nav item while
      // its page is loaded but the panel happens to be closed).
      if (!scrollBody.classList.contains('is-open')) {
        scrollBody.classList.add('is-open');
        heroText.classList.add('is-open');
        setActiveSection(sectionId || currentSection());
      }
      navOverlay.classList.remove('is-open');
      return;
    }
    navigating = true;

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('Navigation fetch failed: ' + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newContent = doc.getElementById('scroll-content');
      if (!newContent) throw new Error('No #scroll-content in response');

      document.title = doc.title;

      const swap = (selector, attr) => {
        const cur = document.querySelector(selector);
        const next = doc.querySelector(selector);
        if (cur && next) cur.setAttribute(attr, next.getAttribute(attr));
      };
      swap('meta[name="description"]', 'content');
      swap('link[rel="canonical"]', 'href');
      swap('meta[property="og:title"]', 'content');
      swap('meta[property="og:description"]', 'content');
      swap('meta[property="og:url"]', 'content');
      swap('meta[name="twitter:title"]', 'content');
      swap('meta[name="twitter:description"]', 'content');

      scrollContent.innerHTML = newContent.innerHTML;
      scrollContent.scrollTop = 0;
      document.body.dataset.pageSection = sectionId || ROUTES[path] || '';

      if (!scrollBody.classList.contains('is-open')) {
        scrollBody.classList.add('is-open');
        heroText.classList.add('is-open');
      }
      setActiveSection(currentSection());
      initPageEnhancements();

      if (push) history.pushState({ path }, '', path);
      navOverlay.classList.remove('is-open');
    } catch (err) {
      // Something went wrong with the in-page swap — do a real navigation
      // rather than leave the user stuck.
      location.href = path;
      return;
    } finally {
      navigating = false;
    }
  }

  function goHomeClosed() {
    if (currentSection() === 'approach') {
      closePanelLocal();
    } else {
      navigateTo('/', 'approach').then(closePanelLocal);
    }
  }

  document.querySelectorAll('a[data-route]').forEach(a => {
    a.addEventListener('click', e => {
      if (isFileProtocol) return; // let the real relative href navigate normally
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let modified clicks behave normally
      e.preventDefault();
      const cleanPath = a.dataset.clean;
      if (a.id === 'logoLink' || a.id === 'overlayLogoLink') {
        goHomeClosed();
        navOverlay.classList.remove('is-open');
        return;
      }
      navigateTo(cleanPath, a.dataset.section);
    });
  });

  if (!isFileProtocol) {
    window.addEventListener('popstate', () => {
      const path = normalizePath(location.pathname);
      const section = ROUTES[path];
      if (path === '/' && !scrollBody.classList.contains('is-open')) return;
      navigateTo(path, section, { push: false });
    });
  }

  /* ── Mobile nav ── */
  hamburgerBtn.addEventListener('click', () => navOverlay.classList.add('is-open'));
  closeBtn.addEventListener('click', () => navOverlay.classList.remove('is-open'));

  /* ── Detent thresholds ── */
  const WHEEL_DETENT = 56;   /* scroll up to close */
  const HERO_OPEN_DETENT = 112; /* scroll down to open — less sensitive */

  /* ── Scroll down from hero → open panel (home page only; other pages load open) ── */
  let heroOpenDetent = 0;

  document.addEventListener('wheel', e => {
    if (scrollBody.classList.contains('is-open')) return;
    if (e.deltaY > 0) {
      heroOpenDetent += Math.abs(e.deltaY);
      if (heroOpenDetent >= HERO_OPEN_DETENT) {
        heroOpenDetent = 0;
        openPanel();
      }
    } else {
      heroOpenDetent = 0;
    }
  }, { passive: true });

  /* ── Scroll up past top → close panel, back to hero (only makes sense on home) ── */
  let wheelDetent = 0;

  scrollBody.addEventListener('wheel', e => {
    if (!scrollBody.classList.contains('is-open')) return;
    if (currentSection() !== 'approach') return;
    if (scrollContent.scrollTop <= 1 && e.deltaY < 0) {
      wheelDetent += Math.abs(e.deltaY);
      if (wheelDetent >= WHEEL_DETENT) {
        wheelDetent = 0;
        closePanelLocal();
      }
    } else {
      wheelDetent = 0;
    }
  }, { passive: true });

  /* Touch: pull down from top to close (home page only) */
  let touchStartY = 0;
  scrollBody.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  scrollBody.addEventListener('touchmove', e => {
    if (!scrollBody.classList.contains('is-open')) return;
    if (currentSection() !== 'approach') return;
    if (scrollContent.scrollTop === 0 && e.touches[0].clientY - touchStartY > 80) {
      closePanelLocal();
    }
  }, { passive: true });

  /* Touch: swipe up on hero to open panel */
  let heroTouchStartY = 0;
  document.getElementById('hero').addEventListener('touchstart', e => {
    heroTouchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.getElementById('hero').addEventListener('touchmove', e => {
    if (scrollBody.classList.contains('is-open')) return;
    if (heroTouchStartY - e.touches[0].clientY > 80) {
      heroTouchStartY = 0;
      openPanel();
    }
  }, { passive: true });

  /* ── Initial page state ── */
  if (scrollBody.classList.contains('is-open')) {
    setActiveSection(currentSection());
  } else {
    clearActiveSection();
  }
  initPageEnhancements();
})();
