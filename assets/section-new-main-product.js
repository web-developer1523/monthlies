(() => {
  const sections = document.querySelectorAll('[data-new-main-product]');
  if (!sections.length) return;

  const removeRechargeContainers = (root = document) => {
    root
      .querySelectorAll('.rc-container-wrapper.rc_container_wrapper')
      .forEach((element) => element.remove());
  };

  removeRechargeContainers();
  if (!window.__sMainProductRechargeObserver) {
    const rechargeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches('.rc-container-wrapper.rc_container_wrapper')) {
            node.remove();
            return;
          }
          removeRechargeContainers(node);
        });
      });
    });
    rechargeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    window.__sMainProductRechargeObserver = rechargeObserver;
  }

  sections.forEach((section) => {
    const formTargets = Array.from(
      section.querySelectorAll('[data-purchase-form-inputs]')
    );
    const wrappers = section.querySelectorAll('[data-purchase-tabs]');
    const subscriptionOnlyBlocks = Array.from(
      section.querySelectorAll('[data-subscription-only]')
    );
    const purchaseForms = Array.from(
      section.querySelectorAll('.new-main-product__purchase-form')
    );
    const summaryCards = Array.from(
      section.querySelectorAll('[data-purchase-summary]')
    );
    const summaryButtons = Array.from(
      section.querySelectorAll('[data-summary-submit]')
    );
    const cartAddUrl = section.dataset.cartAddUrl || '/cart/add.js';
    const cartUpdateUrl = section.dataset.cartUpdateUrl || '/cart/update.js';
    const cartUrl = section.dataset.cartUrl || '/cart';
    const cartComponent =
      document.querySelector('cart-drawer') ||
      document.querySelector('cart-notification');
    const atcButton = section.querySelector('.new-main-product__purchase-submit');
    const stickyATC = section.querySelector('.new-main-product__purchase-card');
    const footer = document.querySelector('.shopify-section-group-footer-group');
    if(atcButton && stickyATC) {
      window.addEventListener('scroll',()=>{
        toggleStickyATC(atcButton, stickyATC, footer);
      });
    }

    const toggleStickyATC = (atcButton, stickyATC, footer) => {
      const atcButtonTop = atcButton.getBoundingClientRect().top + window.pageYOffset;
      const footerTop = footer?.getBoundingClientRect().top + window.pageYOffset || document.documentElement.scrollHeight;
      if((atcButtonTop <= document.documentElement.scrollTop && footerTop >= document.documentElement.scrollTop + window.innerHeight) && !stickyATC.classList.contains('new-main-product__purchase-card--visible')) {
        stickyATC.classList.add('new-main-product__purchase-card--visible');
      }
      else if((atcButtonTop > document.documentElement.scrollTop || footerTop < document.documentElement.scrollTop + window.innerHeight) && stickyATC.classList.contains('new-main-product__purchase-card--visible')) {
        stickyATC.classList.remove('new-main-product__purchase-card--visible');
      }
    }

    const openCart = (responseData) => {
      if (
        cartComponent &&
        responseData &&
        typeof cartComponent.renderContents === 'function'
      ) {
        cartComponent.renderContents(responseData);
        return;
      }
      window.location.assign(cartUrl || '/cart');
    };

    const getCartSectionsPayload = () => {
      if (
        cartComponent &&
        typeof cartComponent.getSectionsToRender === 'function'
      ) {
        return {
          sections: cartComponent
            .getSectionsToRender()
            .map((section) => section.id),
          sections_url: window.location.pathname,
        };
      }
      return null;
    };

    const getActiveOption = () =>
      section.querySelector(
        '[data-purchase-panel].is-active [data-purchase-option].is-active'
      );

    const getActiveDiscountCode = () => {
      const option = getActiveOption();
      if (!option) return '';
      return (option.dataset.discountCode || '').trim();
    };

    const applyDiscountCode = async (code) => {
      if (!code) return null;
      try {
        const payload = {
          attributes: { discount_code: code },
          discount: code,
        };
        const sectionsPayload = getCartSectionsPayload();
        if (sectionsPayload) {
          payload.sections = sectionsPayload.sections;
          payload.sections_url = sectionsPayload.sections_url;
        }
        const response = await fetch(cartUpdateUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        return response.json().catch(() => null);
      } catch (error) {
        console.error(error);
        return null;
      }
    };

    const updateSummaryPrice = (option) => {
      if (!summaryCards.length || !option) return;
      const optionUnit = option.querySelector(
        '.new-main-product__purchase-option-unit'
      );
      const unitText = optionUnit?.textContent?.trim() || '';
      summaryCards.forEach((card) => {
        const priceEl = card.querySelector('[data-summary-price]');
        if (!priceEl) return;
        const basePrice = priceEl.dataset.basePrice || '';
        const prefix = card.dataset.pricePrefix || '';
        const suffix = card.dataset.priceSuffix || '';
        const priceValue = unitText || basePrice;
        if (!priceValue) return;
        const prefixText = prefix ? `${prefix} ` : '';
        const suffixText = suffix ? ` ${suffix}` : '';
        priceEl.textContent = `${prefixText}${priceValue}${suffixText}`.trim();
      });
    };

    const syncFormInputs = (option) => {
      if (!option) return;
      const optionInputs = option.querySelector(
        '.new-main-product__purchase-option-inputs'
      );
      if (optionInputs && formTargets.length) {
        formTargets.forEach((target) => {
          target.innerHTML = optionInputs.innerHTML;
          const planInput = target.querySelector('input[name="selling_plan"]');
          if (planInput && !planInput.value) {
            planInput.remove();
          }
        });
      }
      updateSummaryPrice(option);
    };

    purchaseForms.forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector(
          '.new-main-product__purchase-submit'
        );
        const activeOption = section.querySelector(
          '[data-purchase-panel].is-active [data-purchase-option].is-active'
        );
        const activePlanInput = activeOption?.querySelector(
          '.new-main-product__purchase-option-inputs input[name="selling_plan"]'
        );
        const formInputs = form.querySelector('[data-purchase-form-inputs]');
        if (formInputs) {
          let planInput = formInputs.querySelector('input[name="selling_plan"]');
          if (!activePlanInput || !activePlanInput.value) {
            if (planInput) {
              planInput.remove();
            }
          }
        }
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute('aria-busy', 'true');
        }

        const discountCode = getActiveDiscountCode();
        try {
          const formData = new FormData(form);
          const sectionsPayload = getCartSectionsPayload();
          if (sectionsPayload) {
            formData.append('sections', sectionsPayload.sections);
            formData.append('sections_url', sectionsPayload.sections_url);
            if (typeof cartComponent.setActiveElement === 'function') {
              cartComponent.setActiveElement(document.activeElement);
            }
          }
          const response = await fetch(cartAddUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: formData,
          });
          const responseData = await response.json().catch(() => null);
      if (!response.ok || (responseData && responseData.status)) {
        let errorMessage = 'Add to cart failed';
        if (responseData && responseData.description) {
          errorMessage = responseData.description;
        }
        throw new Error(errorMessage);
      }

      let cartData = responseData;

      if (discountCode) {
        const updatedCart = await applyDiscountCode(discountCode);
        if (updatedCart && !updatedCart.status && updatedCart.sections) {
          cartData = updatedCart;
        } else if (updatedCart && !updatedCart.status) {
          const sectionsPayload = getCartSectionsPayload();
          if (sectionsPayload) {
            const refresh = await fetch(cartUpdateUrl, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(sectionsPayload),
            })
              .then((res) => res.json())
              .catch(() => null);
            if (refresh) {
              cartData = refresh;
            }
          }
        }
        openCart(cartData);
      } else {
        openCart(cartData);
      }

      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'new-main-product',
          productVariantId: formData.get('id'),
          cartData,
        });
      }
        } catch (error) {
          console.error(error);
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
          }
        }
      });
    });

    const triggerPurchaseSubmit = () => {
      const form = purchaseForms[0];
      if (!form) return;
      const submitButton = form.querySelector(
        '.new-main-product__purchase-submit'
      );
      if (submitButton) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit(submitButton);
        } else {
          submitButton.click();
        }
        return;
      }
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    };

    summaryButtons.forEach((button) => {
      button.addEventListener('click', triggerPurchaseSubmit);
    });

    wrappers.forEach((wrapper) => {
      const tabs = Array.from(wrapper.querySelectorAll('[data-purchase-tab]'));
      const panels = Array.from(wrapper.querySelectorAll('[data-purchase-panel]'));
      if (!tabs.length || !panels.length) return;

      const setActiveTab = (tabName) => {
        tabs.forEach((tab) => {
          const isActive = tab.dataset.purchaseTab === tabName;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        panels.forEach((panel) => {
          panel.classList.toggle(
            'is-active',
            panel.dataset.purchasePanel === tabName
          );
        });
        subscriptionOnlyBlocks.forEach((block) => {
          block.hidden = tabName !== 'subscription';
        });
        const activePanel = panels.find(
          (panel) => panel.dataset.purchasePanel === tabName
        );
        if (activePanel) {
          const options = Array.from(
            activePanel.querySelectorAll('[data-purchase-option]')
          );
          let activeOption = options.find(
            (option) => option.classList.contains('is-active') && !option.disabled
          );
          if (!activeOption && options.length) {
            const fallbackOption =
              options.find((option) => !option.disabled) || options[0];
            if (fallbackOption) {
              options.forEach((option) => {
                const isActive = option === fallbackOption;
                option.classList.toggle('is-active', isActive);
                option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
              });
              activeOption = fallbackOption;
            }
          }
          syncFormInputs(activeOption);
        }
      };

      const defaultTab =
        wrapper.dataset.defaultTab || tabs[0].dataset.purchaseTab;
      setActiveTab(defaultTab);

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          setActiveTab(tab.dataset.purchaseTab);
        });
      });

      wrapper.addEventListener('click', (event) => {
        const option = event.target.closest('[data-purchase-option]');
        if (!option) return;
        if (option.disabled) return;
        const panel = option.closest('[data-purchase-panel]');
        if (!panel) return;
        panel.querySelectorAll('[data-purchase-option]').forEach((item) => {
          const isActive = item === option;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        syncFormInputs(option);
      });
    });
  });
})();
