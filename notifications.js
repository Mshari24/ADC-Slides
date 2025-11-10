(() => {
  const PREVIEW_LIMIT = 5;
  const STORAGE_KEY = 'adcNotificationsReadAt';

  const notifications = [
    { id: 'notif-001', title: 'John Doe shared a slide with you', meta: '2 minutes ago' },
    { id: 'notif-002', title: 'System maintenance tonight at 11 PM', meta: '1 hour ago' },
    { id: 'notif-003', title: 'Sarah Smith commented on your presentation', meta: '3 hours ago' },
    { id: 'notif-004', title: 'You were added to the Q4 Planning group', meta: '5 hours ago' },
    { id: 'notif-005', title: 'Your presentation was successfully exported', meta: 'Yesterday' },
    { id: 'notif-006', title: 'ESG Council requested updated metrics', meta: '2 days ago' },
  ];

  const listTemplate = (item) => `
    <li class="notification-list-item" data-notification-id="${item.id}">
      <span class="notification-list-item-title">${item.title}</span>
      <span class="notification-list-item-meta">${item.meta}</span>
    </li>
  `;

  const readState = {
    get timestamp() {
      try {
        return window.localStorage.getItem(STORAGE_KEY) || null;
      } catch (err) {
        console.warn('Unable to access notifications state', err);
        return null;
      }
    },
    set timestamp(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (err) {
        console.warn('Unable to store notifications state', err);
      }
    }
  };

  const hasMarkedAllRead = () => Boolean(readState.timestamp);

  const hidePanel = (panel, button) => {
    if (!panel || panel.classList.contains('hidden')) return;
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');
    panel.removeAttribute('data-open');
    button?.setAttribute('aria-expanded', 'false');
  };

  const showPanel = (panel, button) => {
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.removeAttribute('aria-hidden');
    panel.setAttribute('data-open', 'true');
    button?.setAttribute('aria-expanded', 'true');
    panel.focus();
  };

  const renderList = (listEl, emptyEl) => {
    if (!listEl) return [];
    const items = hasMarkedAllRead() ? [] : notifications.slice(0, PREVIEW_LIMIT);
    listEl.innerHTML = items.map(listTemplate).join('');
    if (emptyEl) {
      emptyEl.classList.toggle('hidden', items.length > 0);
    }
    return items;
  };

  const markAllRead = (badge, emptyEl, listEl) => {
    readState.timestamp = String(Date.now());
    const items = renderList(listEl, emptyEl);
    if (badge) {
      badge.classList.add('hidden');
      badge.textContent = String(items.length);
    }
  };

  const bindDropdown = () => {
    const button = document.getElementById('btn-top-notifications');
    const panel = document.getElementById('notification-panel');
    if (!button || !panel || panel.dataset.bound === 'true') return;

    panel.dataset.bound = 'true';
    const listEl = panel.querySelector('[data-notification-list]');
    const emptyEl = panel.querySelector('[data-notification-empty]');
    const markButton = panel.querySelector('[data-notification-mark-read]');
    const seeAll = panel.querySelector('[data-notification-see-all]');
    const badge = document.getElementById('notif-count');

    const items = renderList(listEl, emptyEl);
    if (badge) {
      const count = Math.min(items.length, 9);
      badge.textContent = String(count);
      badge.classList.toggle('hidden', count === 0);
    }

    const closePanel = () => hidePanel(panel, button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        showPanel(panel, button);
        badge?.classList.add('hidden');
      } else {
        closePanel();
      }
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && !button.contains(event.target)) {
        closePanel();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    });

    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePanel();
        button.focus();
      }
    });

    markButton?.addEventListener('click', () => {
      markAllRead(badge, emptyEl, listEl);
      hidePanel(panel, button);
    });

    seeAll?.addEventListener('click', (event) => {
      event.preventDefault();
      const targetPath = '/notifications';
      window.location.assign(targetPath);
    });
  };

  const init = () => {
    bindDropdown();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.ADCNotifications = {
    refresh: init,
  };
})();

