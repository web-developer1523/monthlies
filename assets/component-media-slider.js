(() => {
  const scrollThumbIntoView = (thumb, container) => {
    if (!thumb || !container) return;
    const containerWidth = container.clientWidth;
    const left =
      thumb.offsetLeft - (containerWidth - thumb.clientWidth) / 2;
    container.scrollTo({
      left: Math.max(left, 0),
      behavior: 'smooth',
    });
  };

  const updateThumbState = (thumbs, activeIndex, container) => {
    const normalizedIndex = Math.min(
      Math.max(activeIndex, 0),
      thumbs.length - 1
    );
    const activeThumb = thumbs[normalizedIndex];
    thumbs.forEach((thumb, index) => {
      const isActive = index === normalizedIndex;
      thumb.classList.toggle('is-active', isActive);
      if (isActive) {
        thumb.setAttribute('aria-current', 'true');
      } else {
        thumb.removeAttribute('aria-current');
      }
    });
    scrollThumbIntoView(activeThumb, container);
  };

  const initMediaSlider = (root) => {
    if (!root || root.dataset.mediaSliderThumbsInit === 'true') return;
    const sliderElement = root.querySelector('.media-slider__component.swiper');
    const thumbsContainer = root.querySelector('.media-slider__thumbs');
    const thumbButtons = thumbsContainer
      ? Array.from(thumbsContainer.querySelectorAll('.media-slider__thumb'))
      : [];
    if (!sliderElement || thumbButtons.length === 0) return;

    const waitForSwiper = () => {
      const sliderInstance = sliderElement.swiper;
      if (!sliderInstance) {
        requestAnimationFrame(waitForSwiper);
        return;
      }

      root.dataset.mediaSliderThumbsInit = 'true';

      const handleSlideChange = () => {
        const index =
          sliderInstance.realIndex ??
          sliderInstance.activeIndex ??
          sliderInstance.previousIndex ??
          0;
        updateThumbState(thumbButtons, index, thumbsContainer);
      };

      thumbButtons.forEach((thumb, index) => {
        thumb.dataset.mediaThumbIndex = index;
        thumb.addEventListener('click', () => {
          sliderInstance.slideTo(index);
        });
      });

      sliderInstance.on('slideChange', handleSlideChange);
      handleSlideChange();
    };

    waitForSwiper();
  };

  const initGuaranteePagination = (sectionRoot) => {
    if (
      !sectionRoot ||
      sectionRoot.dataset.guaranteePaginationInit === 'true' ||
      !sectionRoot.hasAttribute('data-new-main-product')
    ) {
      return;
    }

    const sliderElement = sectionRoot.querySelector('.new-main-product__guarantee-slider.swiper');
    const paginationWrapper = sectionRoot.querySelector('.new-main-product__guarantee-pagination-dots');
    if (!sliderElement || !paginationWrapper) return;

    const waitForSwiper = () => {
      const sliderInstance = sliderElement.swiper;
      if (!sliderInstance) {
        requestAnimationFrame(waitForSwiper);
        return;
      }

      sectionRoot.dataset.guaranteePaginationInit = 'true';

      const totalSlides = sliderInstance.slides.length;
      const firstIndex = 0;
      const lastIndex = Math.max(totalSlides - 1, 0);
      const middleIndex = Math.floor((totalSlides - 1) / 2);
      const requestedPositions = [firstIndex, middleIndex, lastIndex];
      const positions = Array.from(new Set(requestedPositions));
      const hasCenterButton = positions.length > 2;

      paginationWrapper.innerHTML = '';
      const labelPrefix = paginationWrapper.dataset.guaranteePaginationLabel || 'Slide';

      const buttons = positions.map((targetIndex, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'swiper-pagination-bullet';
        button.dataset.guaranteePaginationTarget = targetIndex;
        if (hasCenterButton && index === 1) {
          button.dataset.guaranteePaginationRole = 'center';
        } else if (index === 0) {
          button.dataset.guaranteePaginationRole = 'start';
        } else if (index === positions.length - 1) {
          button.dataset.guaranteePaginationRole = 'end';
        }
        button.setAttribute('aria-label', `${labelPrefix} ${targetIndex + 1}`);
        button.addEventListener('click', () => {
          const role = button.dataset.guaranteePaginationRole;
          if (role === 'center') {
            const currentIndex =
              sliderInstance.realIndex ?? sliderInstance.activeIndex ?? 0;
            if (currentIndex === firstIndex && firstIndex !== lastIndex) {
              sliderInstance.slideNext();
            } else if (currentIndex === lastIndex && firstIndex !== lastIndex) {
              sliderInstance.slidePrev();
            }
            return;
          }
          sliderInstance.slideTo(targetIndex);
        });
        paginationWrapper.appendChild(button);
        return button;
      });

      const updateActive = () => {
        const currentIndex = sliderInstance.realIndex ?? sliderInstance.activeIndex ?? 0;
        let bestIndex = 0;
        let bestDistance = Infinity;
        positions.forEach((target, idx) => {
          const distance = Math.abs(currentIndex - target);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = idx;
          }
        });
        buttons.forEach((button, idx) => {
          button.classList.toggle('swiper-pagination-bullet-active', idx === bestIndex);
        });
      };

      sliderInstance.on('slideChange', updateActive);
      updateActive();
    };

    waitForSwiper();
  };

  const initAll = () => {
    document.querySelectorAll('[data-media-slider]').forEach(initMediaSlider);
    document.querySelectorAll('[data-new-main-product]').forEach(initGuaranteePagination);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => {
    event.target
      .querySelectorAll('[data-media-slider]')
      .forEach((root) => {
        delete root.dataset.mediaSliderThumbsInit;
        initMediaSlider(root);
      });
    if (event.target.hasAttribute('data-new-main-product')) {
      delete event.target.dataset.guaranteePaginationInit;
      initGuaranteePagination(event.target);
    } else {
      event.target
        .querySelectorAll('[data-new-main-product]')
        .forEach((section) => {
          delete section.dataset.guaranteePaginationInit;
          initGuaranteePagination(section);
        });
    }
  });
})();
