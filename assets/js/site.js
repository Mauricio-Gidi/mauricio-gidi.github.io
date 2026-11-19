/* V9 — cumulative sections, with destination-led anchor navigation.
   The website stays fully readable without JavaScript or in reduced-motion mode. */
(() => {
  'use strict';
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const projects = Array.from(document.querySelectorAll('details.project'));
  projects.forEach((project) => {
    project.addEventListener('toggle', () => {
      if (project.open) {
        projects.forEach((other) => { if (other !== project) other.open = false; });
      } else {
        project.querySelectorAll('video').forEach((video) => video.pause());
      }
    });
  });

  const hash = decodeURIComponent(window.location.hash.slice(1));
  const deepLink = hash ? document.getElementById(hash) : null;
  if (deepLink?.matches('details.project')) deepLink.open = true;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || typeof window.requestAnimationFrame !== 'function') return;

  const root = document.documentElement;
  const sections = Array.from(document.querySelectorAll('.narrative-section'));
  const revealIntro = () => root.classList.add('intro-interrupted');
  if (window.scrollY > 48 || hash) revealIntro();
  window.addEventListener('wheel', revealIntro, { once: true, passive: true });
  window.addEventListener('touchmove', revealIntro, { once: true, passive: true });
  window.addEventListener('scroll', () => {
    if (window.scrollY > 48) revealIntro();
  }, { passive: true });

  let navigation = null;
  let queued = false;
  const update = () => {
    if (navigation) return; // During a programmatic journey, the destination must wait.
    const trigger = Math.min(window.innerHeight * 0.35, 315);
    const atBottom = window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 5;
    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top;
      // Short final sections cannot always reach the usual entry line because
      // the document ends. Reveal them once clearly visible at the page bottom.
      const reached = top <= trigger || (atBottom && top < window.innerHeight * 0.82);
      section.classList.toggle('is-active', reached);
      if (!reached) section.classList.remove('nav-prior');
    });
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => { queued = false; update(); });
  };

  const endNavigation = (nav, completed) => {
    if (navigation !== nav) return;
    navigation = null;
    nav.section.classList.remove('nav-pending');
    // Previous sections become immediately readable; the destination gets
    // its own ordered entrance only *after* arriving at that destination.
    if (completed) {
      window.requestAnimationFrame(() => {
        nav.section.classList.add('is-active');
        schedule();
      });
    } else schedule();
  };

  function startNavigation(section, anchor) {
    if (navigation) endNavigation(navigation, false);
    revealIntro();
    const index = sections.indexOf(section);
    if (index === -1) return;
    sections.forEach((item, i) => {
      item.classList.remove('nav-pending');
      if (i < index) {
        item.classList.add('nav-prior', 'is-active');
      } else {
        item.classList.remove('nav-prior');
        item.classList.remove('is-active');
      }
    });
    section.classList.add('nav-pending');
    // Establish the pending opacity before starting the browser's scroll.
    void section.offsetWidth;

    const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.min(limit, Math.max(0, window.scrollY + section.getBoundingClientRect().top - 36));
    const nav = { section, targetY, started: performance.now(), nearFrames: 0 };
    navigation = nav;
    if (window.location.hash !== '#' + anchor) {
      window.history.pushState(null, '', '#' + encodeURIComponent(anchor));
    }
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    const frame = (time) => {
      if (navigation !== nav) return;
      nav.nearFrames = Math.abs(window.scrollY - nav.targetY) < 3 ? nav.nearFrames + 1 : 0;
      if ((nav.nearFrames >= 5 && time - nav.started > 100) || time - nav.started > 2400) {
        endNavigation(nav, true);
      } else {
        window.requestAnimationFrame(frame);
      }
    };
    window.requestAnimationFrame(frame);
  }

  const cancelNavigation = () => {
    if (navigation) endNavigation(navigation, false);
  };
  window.addEventListener('wheel', cancelNavigation, { passive: true });
  window.addEventListener('touchstart', cancelNavigation, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) cancelNavigation();
  });

  // Standard anchors remain functional if JavaScript is disabled. With JS,
  // custom navigation delays the destination's reveal until scroll arrival.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = decodeURIComponent(link.getAttribute('href').slice(1));
      const target = anchor && document.getElementById(anchor);
      const section = target?.closest('.narrative-section');
      if (!section) return;
      event.preventDefault();
      startNavigation(section, anchor);
    });
  });

  // Keyboard navigation directly into a project must not hide the focused item.
  document.addEventListener('focusin', (event) => {
    const section = event.target.closest?.('.narrative-section');
    if (section && !event.target.closest('.site-nav')) section.classList.add('focus-access');
  });
  document.addEventListener('focusout', (event) => {
    const section = event.target.closest?.('.narrative-section');
    if (section) window.setTimeout(() => {
      if (!section.contains(document.activeElement)) section.classList.remove('focus-access');
    }, 0);
  });

  // Initial state must be calculated before any content can become hidden.
  update();
  root.classList.add('motion-ready');
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('popstate', schedule);

  preference.addEventListener?.('change', (event) => {
    if (event.matches) {
      cancelNavigation();
      root.classList.remove('motion-ready');
      revealIntro();
    } else {
      update();
      root.classList.add('motion-ready');
    }
  });
})();
