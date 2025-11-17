(function (global) {
  const ACCOUNTS_KEY = 'adSlides.accounts';
  const CURRENT_KEY = 'adSlides.currentAccount';
  const LEGACY_KEYS = {
    displayName: 'adSlidesUserName',
    formattedName: 'adSlidesUserFormattedName',
    email: 'adSlidesUserEmail',
    initials: 'adSlidesUserInitials',
    firstInitial: 'adSlidesUserFirstInitial',
    phone: 'adSlidesUserPhone'
  };

  const isStorageAvailable = (() => {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('localStorage unavailable', error);
      return false;
    }
  })();

  const safeJSONParse = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse JSON from storage', error);
      return null;
    }
  };

  const canonicalEmail = (email) => (email || '').trim().toLowerCase();

  const defaultAccountData = (overrides = {}) => {
    const canonical = canonicalEmail(overrides.email || overrides.displayEmail || '');
    return {
      profile: {
        displayName: overrides.displayName || '',
        formattedName: overrides.formattedName || '',
        email: canonical,
        displayEmail: overrides.displayEmail || overrides.email || canonical,
        initials: overrides.initials || '',
        firstInitial: overrides.firstInitial || '',
        phone: overrides.phone || ''
      },
      preferences: {
        darkMode: false,
        emailNotifications: true,
        rememberLogin: true
      },
      presentations: {
        autosave: null
      },
      notifications: [],
      notificationsReadAt: null,
      projects: []
    };
  };

  const normalizeAccount = (account = {}, profileOverrides = {}) => {
    const defaults = defaultAccountData(profileOverrides);
    const normalized = {
      profile: { ...defaults.profile, ...(account.profile || {}), ...profileOverrides },
      preferences: { ...defaults.preferences, ...(account.preferences || {}) },
      presentations: { ...defaults.presentations, ...(account.presentations || {}) },
      notifications: Array.isArray(account.notifications) ? account.notifications : [],
      notificationsReadAt: account.notificationsReadAt || null,
      projects: Array.isArray(account.projects) ? account.projects : []
    };
    return normalized;
  };

  const loadAccounts = () => {
    if (!isStorageAvailable) return {};
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const parsed = safeJSONParse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  };

  const saveAccounts = (accounts) => {
    if (!isStorageAvailable) return;
    try {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.warn('Unable to persist accounts', error);
    }
  };

  const setCurrentAccountEmail = (email) => {
    if (!isStorageAvailable) return;
    const canonical = canonicalEmail(email);
    if (canonical) {
      window.localStorage.setItem(CURRENT_KEY, canonical);
    } else {
      window.localStorage.removeItem(CURRENT_KEY);
    }
  };

  const getCurrentAccountEmail = () => {
    if (!isStorageAvailable) return '';
    const value = window.localStorage.getItem(CURRENT_KEY);
    return value ? canonicalEmail(value) : '';
  };

  const ensureAccount = (email, profileOverrides = {}) => {
    const canonical = canonicalEmail(email);
    if (!canonical) return null;
    const accounts = loadAccounts();
    const existing = accounts[canonical];
    const normalized = normalizeAccount(existing, { ...profileOverrides, email: canonical });
    accounts[canonical] = normalized;
    saveAccounts(accounts);
    return normalized;
  };

  const getAccount = (email, createIfMissing = false, profileOverrides = {}) => {
    const canonical = canonicalEmail(email);
    if (!canonical) return null;
    const accounts = loadAccounts();
    let account = accounts[canonical];
    if (!account && createIfMissing) {
      account = normalizeAccount({}, { ...profileOverrides, email: canonical });
      accounts[canonical] = account;
      saveAccounts(accounts);
    }
    return account ? normalizeAccount(account) : null;
  };

  const getCurrentAccount = (createIfMissing = false) => {
    const email = getCurrentAccountEmail();
    if (!email && createIfMissing) return null;
    return email ? getAccount(email, createIfMissing) : null;
  };

  const updateAccount = (email, updater) => {
    const canonical = canonicalEmail(email);
    if (!canonical || typeof updater !== 'function') return null;
    const accounts = loadAccounts();
    const current = normalizeAccount(accounts[canonical], { email: canonical });
    const cloned = JSON.parse(JSON.stringify(current));
    updater(cloned);
    const normalized = normalizeAccount(cloned, { email: canonical });
    accounts[canonical] = normalized;
    saveAccounts(accounts);
    return normalized;
  };

  const updateCurrentAccount = (updater, { createIfMissing = true } = {}) => {
    const email = getCurrentAccountEmail();
    if (!email) {
      if (!createIfMissing) return null;
      return null;
    }
    return updateAccount(email, updater);
  };

  const resetAccountData = (email) => {
    updateAccount(email, (account) => {
      account.notifications = [];
      account.notificationsReadAt = null;
      account.presentations = account.presentations || {};
      account.presentations.autosave = null;
      account.projects = [];
    });
  };

  const resetCurrentAccountData = () => {
    const email = getCurrentAccountEmail();
    if (!email) return;
    resetAccountData(email);
  };

  const clearCurrentAccount = () => {
    if (!isStorageAvailable) return;
    window.localStorage.removeItem(CURRENT_KEY);
  };

  const clearLegacyProfileKeys = () => {
    if (!isStorageAvailable) return;
    Object.values(LEGACY_KEYS).forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn('Unable to remove legacy key', key, error);
      }
    });
  };

  const importLegacyProfile = () => {
    if (!isStorageAvailable) return;
    const legacyEmail = window.localStorage.getItem(LEGACY_KEYS.email);
    if (!legacyEmail) return;
    const legacyDisplay = window.localStorage.getItem(LEGACY_KEYS.displayName) || '';
    const legacyFormatted = window.localStorage.getItem(LEGACY_KEYS.formattedName) || '';
    const legacyInitials = window.localStorage.getItem(LEGACY_KEYS.initials) || '';
    const legacyFirstInitial = window.localStorage.getItem(LEGACY_KEYS.firstInitial) || '';
    const legacyPhone = window.localStorage.getItem(LEGACY_KEYS.phone) || '';

    const account = ensureAccount(legacyEmail, {
      displayName: legacyDisplay,
      formattedName: legacyFormatted || legacyDisplay.replace(/\s+/g, '-'),
      displayEmail: legacyEmail,
      initials: legacyInitials,
      firstInitial: legacyFirstInitial || legacyInitials.charAt(0),
      phone: legacyPhone
    });

    if (account) {
      setCurrentAccountEmail(legacyEmail);
    }
  };

  const api = {
    defaultAccountData,
    loadAccounts,
    saveAccounts,
    ensureAccount,
    getAccount,
    getCurrentAccountEmail,
    setCurrentAccount: setCurrentAccountEmail,
    clearCurrentAccount,
    getCurrentAccount,
    updateAccount,
    updateCurrentAccount,
    resetAccountData,
    resetCurrentAccountData,
    clearLegacyProfileKeys,
    importLegacyProfile
  };

  if (!global.AccountStorage) {
    global.AccountStorage = api;
    importLegacyProfile();
  }
})(typeof window !== 'undefined' ? window : this);
