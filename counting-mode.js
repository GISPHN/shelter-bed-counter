(() => {
  'use strict';

  function applyCountingMode() {
    const panel = document.querySelector('#counterPanel');
    const isCounting = Boolean(panel && !panel.classList.contains('hidden'));
    document.body.classList.toggle('counting-mode', isCounting);
  }

  function improveCounterLabels() {
    const cardboardHeading = document.querySelector('[data-counter="cardboardBedCount"] h3');
    if (cardboardHeading) {
      cardboardHeading.setAttribute('aria-label', '段ボールベッド');
      cardboardHeading.innerHTML = '段ボール<br>ベッド';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.querySelector('#counterPanel');
    improveCounterLabels();
    applyCountingMode();
    if (!panel) return;

    new MutationObserver(applyCountingMode).observe(panel, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
})();
