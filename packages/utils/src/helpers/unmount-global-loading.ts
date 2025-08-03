/**
 * Remove and destroy loading
 * Placed here instead of in the app tag of index.html to avoid abruptness, fast rendering might cause flickering
 * Improve experience by first adding CSS animation to hide, then removing loading node after animation ends
 * The downside is it increases some code size
 * For custom loading see: https://doc.vben.pro/guide/in-depth/loading.html
 */
export function unmountGlobalLoading() {
  // Find global loading element
  const loadingElement = document.querySelector('#__app-loading__');

  if (loadingElement) {
    // Add hidden class to trigger transition animation
    loadingElement.classList.add('hidden');

    // Find all injected loading elements that need to be removed
    const injectLoadingElements = document.querySelectorAll(
      '[data-app-loading^="inject"]',
    );

    // When transition animation ends, remove loading element and all injected loading elements
    loadingElement.addEventListener(
      'transitionend',
      () => {
        loadingElement.remove(); // Remove loading element
        injectLoadingElements.forEach((el) => el.remove()); // Remove all injected loading elements
      },
      { once: true },
    ); // Ensure event is triggered only once
  }
}
