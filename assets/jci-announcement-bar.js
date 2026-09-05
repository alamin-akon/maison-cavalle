/**
 * Maison Cavallé — announcement bar.
 *
 * The prototype simply removes the bar from the DOM on dismiss, so it returns
 * on the next page load. `data-jci-remember-dismissal` opts into keeping it
 * hidden for the rest of the session instead.
 */
class JciAnnouncementBar extends HTMLElement {
  connectedCallback() {
    this.dismissButton = this.querySelector('[data-jci-announcement-dismiss]');
    if (!this.dismissButton) return;

    if (this.remembersDismissal && this.#wasDismissed()) {
      this.hidden = true;
      return;
    }

    this.dismissButton.addEventListener('click', this.#handleDismiss);
  }

  disconnectedCallback() {
    this.dismissButton?.removeEventListener('click', this.#handleDismiss);
  }

  get remembersDismissal() {
    return this.hasAttribute('data-jci-remember-dismissal');
  }

  get #storageKey() {
    return `jci-announcement-dismissed:${this.dataset.jciSectionId ?? 'default'}`;
  }

  /* Storage throws in private-mode and blocked-cookie contexts. */
  #wasDismissed() {
    try {
      return sessionStorage.getItem(this.#storageKey) === '1';
    } catch {
      return false;
    }
  }

  #rememberDismissal() {
    try {
      sessionStorage.setItem(this.#storageKey, '1');
    } catch {
      /* Nothing to persist to — the bar still hides for this page view. */
    }
  }

  #handleDismiss = () => {
    if (this.remembersDismissal) {
      this.#rememberDismissal();
      this.hidden = true;
      return;
    }

    this.remove();
  };
}

if (!customElements.get('jci-announcement-bar')) {
  customElements.define('jci-announcement-bar', JciAnnouncementBar);
}
