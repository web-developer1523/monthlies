class CycleProgressSection extends HTMLElement {
  constructor(){
    super();
  }

  connectedCallback() {
    if (this.dataset.cycleProgressInit === 'true') return;
    this.dataset.cycleProgressInit = 'true';

    const tabs = Array.from(this.querySelectorAll('[data-cycle-tab]'));
    const panels = Array.from(this.querySelectorAll('[data-cycle-panel]'));
    const tabsWrap = this.querySelector('.cycle-progress__tabs');
    const track = this.querySelector('.cycle-progress__track');
    const indicator = this.querySelector('[data-cycle-indicator]');
    if (!tabs.length || !panels.length || !tabsWrap || !track || !indicator) return;

    const total = tabs.length;
    const defaultIndex = Number(this.dataset.defaultIndex || 0);
    const clampIndex = Math.max(0, Math.min(total - 1, defaultIndex));
    let activeIndex = clampIndex;

    const updateTrack = (index) => {
      const activeTab = tabs[index];
      if (!activeTab) return;
      const trackRect = track.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      if (!trackRect.width) return;
      const fill = Math.min(Math.max(tabRect.right - trackRect.left, 0), trackRect.width);
      const indicatorWidth = indicator.offsetWidth || 0;
      let indicatorLeft = fill;
      if (indicatorWidth) {
        indicatorLeft = Math.min(Math.max(indicatorLeft, indicatorWidth), trackRect.width);
      }
      tabsWrap.style.setProperty('--cycle-progress-fill', `${fill}px`);
      tabsWrap.style.setProperty('--cycle-progress-indicator', `${indicatorLeft}px`);
    };

    const setActive = (index) => {
      activeIndex = index;
      tabs.forEach((tab, idx) => {
        const isActive = idx === index;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      panels.forEach((panel, idx) => {
        const isActive = idx === index;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });
      const indicatorValue = tabs[index]?.dataset.indicator || String(index + 1);
      indicator.textContent = indicatorValue;
      updateTrack(index);
    };

    const onResize = () => window.requestAnimationFrame(() => updateTrack(activeIndex));

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setActive(index));
    });

    window.addEventListener('resize', onResize);
    this._cleanup = () => window.removeEventListener('resize', onResize);

    setActive(clampIndex);
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
}

customElements.define('cycle-progress-section', CycleProgressSection);