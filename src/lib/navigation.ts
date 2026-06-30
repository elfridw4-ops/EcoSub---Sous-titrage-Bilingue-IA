import { useEffect, useRef, useState } from 'react';

type CloseHandler = () => void;

class NavigationManager {
  private modalStack: { id: string; onBack: CloseHandler }[] = [];
  public showExitToast: (() => void) | null = null;
  private exitPromptTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Ensure we have a base state 'app' so that pressing back from 'app' goes to 'root', giving us a chance to intercept.
    if (!window.history.state || window.history.state.page !== 'app') {
      window.history.replaceState({ page: 'root' }, '');
      window.history.pushState({ page: 'app' }, '');
    }

    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  public registerModal(id: string, onBack: CloseHandler) {
    this.init(); // ensure init
    this.modalStack.push({ id, onBack });
    window.history.pushState({ modalId: id }, '');
  }

  public unregisterModal(id: string) {
    const index = this.modalStack.findIndex(m => m.id === id);
    if (index !== -1) {
      this.modalStack.splice(index, 1);
      // Clean up history state if it was closed programmatically (and is still at the top)
      if (window.history.state && window.history.state.modalId === id) {
        window.history.back();
      }
    }
  }

  private handlePopState(event: PopStateEvent) {
    // 1. Modals management
    if (this.modalStack.length > 0) {
      // User pressed back. The top modal in the stack should be closed.
      const topModal = this.modalStack.pop();
      if (topModal) {
        topModal.onBack();
      }
      return;
    }

    // 2. Base App Double-Tap to Exit
    // We arrive here if the user pressed Back from the 'app' state and went to 'root' (or outside app).
    // Or if the hash/state is empty.
    if (!event.state || event.state.page !== 'app') {
      
      // Push 'app' state back immediately to prevent real exit
      window.history.pushState({ page: 'app' }, '');

      if (this.exitPromptTimer) {
        // Second tap within 2 seconds: Exit for real
        clearTimeout(this.exitPromptTimer);
        this.exitPromptTimer = null;
        window.history.go(-2); // Skip the 'app' and 'root' states to exit
      } else {
        // First tap: show toast
        if (this.showExitToast) this.showExitToast();
        this.exitPromptTimer = setTimeout(() => {
          this.exitPromptTimer = null;
        }, 2000);
      }
    }
  }
}

export const navigationManager = new NavigationManager();
if (typeof window !== 'undefined') {
  navigationManager.init();
}

/**
 * Hook to manage back button closing for a specific modal, popup, or panel.
 */
export function useModalBackHandler(isActive: boolean, onBack: () => void, id: string) {
  useEffect(() => {
    if (isActive) {
      navigationManager.registerModal(id, onBack);
      return () => {
        navigationManager.unregisterModal(id);
      };
    }
  }, [isActive, onBack, id]);
}

/**
 * Hook to manage the root app exit functionality.
 * Returns whether the "Press again to quit" toast should be visible.
 */
export function useExitAppPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    navigationManager.showExitToast = () => {
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 2000);
    };
    return () => {
      navigationManager.showExitToast = null;
    };
  }, []);

  return { showExitPrompt: showPrompt };
}
