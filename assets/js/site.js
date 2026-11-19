/* Small progressive enhancement: native <details> works without JavaScript. */
(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const projects = Array.from(document.querySelectorAll('.project'));
  projects.forEach((project) => {
    project.addEventListener('toggle', () => {
      if (project.open) {
        // Keep the page considered and easy to navigate: one expanded work sample at a time.
        projects.forEach((other) => {
          if (other !== project) other.open = false;
        });
      } else {
        project.querySelectorAll('video').forEach((video) => video.pause());
      }
    });
  });

  // Preserve old /projects/#id deep links by opening the referenced row after redirect.
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash) {
    const target = document.getElementById(hash);
    if (target && target.matches('details.project')) target.open = true;
  }
})();
