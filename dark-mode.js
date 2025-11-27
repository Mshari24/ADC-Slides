/**
 * Dark Mode System for ADC Slides
 * Uses Aramco brand colors for dark theme
 */
(function() {
  'use strict';

  // Aramco Dark Mode Color Palette
  const ARAMCO_DARK_COLORS = {
    // Backgrounds
    bgPrimary: '#0a1628',      // Deep navy background
    bgSecondary: '#0f1b2e',    // Slightly lighter navy
    bgTertiary: '#1a2332',     // Card/panel background
    bgElevated: '#243040',     // Elevated elements
    
    // Text
    textPrimary: '#e8f0f8',    // Primary text
    textSecondary: '#b8c8d8',  // Secondary text
    textTertiary: '#8a9ba8',   // Tertiary text
    
    // Borders
    borderPrimary: '#2a3441',   // Primary borders
    borderSecondary: '#1e2835', // Secondary borders
    
    // Aramco Brand Colors (adjusted for dark mode)
    aramcoNavy: '#002b49',
    aramcoBlue: '#00aae7',     // Bright blue for accents
    aramcoTeal: '#00a38d',     // Teal for highlights
    aramcoGreen: '#006c35',
    
    // Interactive states
    hoverBg: '#1e2835',
    activeBg: '#243040',
    focusRing: 'rgba(0, 170, 231, 0.3)',
  };

  /**
   * Initialize dark mode from stored preference
   */
  function initDarkMode() {
    const storage = window.AccountStorage;
    if (!storage) return;

    const account = storage.getCurrentAccount();
    if (!account) return;

    const isDarkMode = account.preferences?.darkMode === true;
    applyDarkMode(isDarkMode);
  }

  /**
   * Apply or remove dark mode
   */
  function applyDarkMode(enabled) {
    if (enabled) {
      // Apply to html and body
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      
      // Also apply to any root containers
      const rootContainers = document.querySelectorAll('.home-root, .profile-root, .workspace-root');
      rootContainers.forEach(container => {
        container.classList.add('dark-mode');
      });
      
      // Set CSS custom properties for Aramco dark colors
      const root = document.documentElement;
      root.style.setProperty('--dark-bg-primary', ARAMCO_DARK_COLORS.bgPrimary);
      root.style.setProperty('--dark-bg-secondary', ARAMCO_DARK_COLORS.bgSecondary);
      root.style.setProperty('--dark-bg-tertiary', ARAMCO_DARK_COLORS.bgTertiary);
      root.style.setProperty('--dark-bg-elevated', ARAMCO_DARK_COLORS.bgElevated);
      root.style.setProperty('--dark-text-primary', ARAMCO_DARK_COLORS.textPrimary);
      root.style.setProperty('--dark-text-secondary', ARAMCO_DARK_COLORS.textSecondary);
      root.style.setProperty('--dark-text-tertiary', ARAMCO_DARK_COLORS.textTertiary);
      root.style.setProperty('--dark-border-primary', ARAMCO_DARK_COLORS.borderPrimary);
      root.style.setProperty('--dark-border-secondary', ARAMCO_DARK_COLORS.borderSecondary);
      root.style.setProperty('--dark-aramco-blue', ARAMCO_DARK_COLORS.aramcoBlue);
      root.style.setProperty('--dark-aramco-teal', ARAMCO_DARK_COLORS.aramcoTeal);
      root.style.setProperty('--dark-hover-bg', ARAMCO_DARK_COLORS.hoverBg);
      root.style.setProperty('--dark-active-bg', ARAMCO_DARK_COLORS.activeBg);
      root.style.setProperty('--dark-focus-ring', ARAMCO_DARK_COLORS.focusRing);
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      
      // Remove from root containers
      const rootContainers = document.querySelectorAll('.home-root, .profile-root, .workspace-root');
      rootContainers.forEach(container => {
        container.classList.remove('dark-mode');
      });
    }

    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('dark-mode-changed', { 
      detail: { enabled } 
    }));
  }

  /**
   * Toggle dark mode
   */
  function toggleDarkMode() {
    const storage = window.AccountStorage;
    if (!storage) return false;

    const account = storage.getCurrentAccount();
    if (!account) return false;

    const currentState = account.preferences?.darkMode === true;
    const newState = !currentState;

    storage.updateCurrentAccount((acc) => {
      acc.preferences = acc.preferences || {};
      acc.preferences.darkMode = newState;
    });

    applyDarkMode(newState);
    return newState;
  }

  /**
   * Set dark mode state
   */
  function setDarkMode(enabled) {
    const storage = window.AccountStorage;
    if (!storage) return;

    storage.updateCurrentAccount((acc) => {
      acc.preferences = acc.preferences || {};
      acc.preferences.darkMode = enabled;
    });

    applyDarkMode(enabled);
  }

  /**
   * Get current dark mode state
   */
  function isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
  } else {
    initDarkMode();
  }

  // Listen for storage changes (for cross-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('account')) {
      initDarkMode();
    }
  });

  // Expose API
  window.DarkMode = {
    init: initDarkMode,
    toggle: toggleDarkMode,
    set: setDarkMode,
    isEnabled: isDarkMode,
    apply: applyDarkMode,
  };
})();

