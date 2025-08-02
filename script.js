window.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro-screen');
  const menu = document.getElementById('main-menu');

  // Intro Animation abwarten (4 Sekunden)
  intro.addEventListener('animationend', () => {
    // Intro ausblenden
    intro.style.display = 'none';

    // Menü anzeigen mit Animation
    menu.classList.remove('hidden');
    setTimeout(() => {
      menu.classList.add('show');
    }, 50);
  });
});
