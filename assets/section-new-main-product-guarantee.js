(() => {
  const initGuaranteeSlider = (root) => {
    if (!root || root.dataset.guaranteeSliderInit === 'true') return;
    root.dataset.guaranteeSliderInit = 'true';

    const sliderComponent = root;
    const slider = sliderComponent.slider || sliderComponent.querySelector('[id^="Slider-"]');
    const dots = Array.from(root.querySelectorAll('[data-guarantee-dot]'));

    if (!sliderComponent || !slider || dots.length === 0) return;

    const getSlides = () => sliderComponent.sliderItemsToShow || sliderComponent.querySelectorAll('[id^="Slide-"]');

    const getTotalSlides = () => {
      const slides = getSlides();
      return slides ? slides.length : 0;
    };

    const setSlideVisibility = (currentIndex) => {
      const slides = Array.from(getSlides() || []);
      slides.forEach((item, index) => {
        const linkElements = item.querySelectorAll('a');
        const isActive = index === currentIndex - 1;
        if (isActive) {
          linkElements.forEach((link) => {
            link.removeAttribute('tabindex');
          });
          item.setAttribute('aria-hidden', 'false');
          item.removeAttribute('tabindex');
        } else {
          linkElements.forEach((link) => {
            link.setAttribute('tabindex', '-1');
          });
          item.setAttribute('aria-hidden', 'true');
          item.setAttribute('tabindex', '-1');
        }
      });
    };

    const setActiveDot = (currentIndex) => {
      const totalSlides = getTotalSlides();
      if (!totalSlides) return;
      const isFirst = currentIndex <= 1;
      const isLast = currentIndex >= totalSlides;

      dots.forEach((dot) => {
        const role = dot.dataset.dotRole;
        const isActive =
          (role === 'first' && isFirst) ||
          (role === 'last' && isLast) ||
          (role === 'middle' && !isFirst && !isLast);

        dot.classList.toggle('slider-counter__link--active', isActive);
        if (isActive) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      setSlideVisibility(currentIndex);
    };

    const goToIndex = (index) => {
      const slides = getSlides();
      const target = slides[index - 1] || slides[0];
      if (!target) return;
      slider.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', (event) => {
        event.preventDefault();
        const index = Number(dot.dataset.slideIndex);
        if (!index) return;
        goToIndex(index);
      });
    });

    sliderComponent.addEventListener('slideChanged', (event) => {
      const currentIndex = event.detail?.currentPage;
      if (!currentIndex) return;
      setActiveDot(currentIndex);
    });

    setActiveDot(sliderComponent.currentPage || 1);
  };

  const initAll = () => {
    document.querySelectorAll('[data-guarantee-slider]').forEach(initGuaranteeSlider);
  };

  if (window.customElements?.whenDefined) {
    window.customElements.whenDefined('slider-component').then(initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll('[data-guarantee-slider]').forEach(initGuaranteeSlider);
  });
})();
