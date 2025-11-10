(() => {
  const PREVIEW_LIMIT = 5;
  const STORAGE_KEY = 'adcNotificationsReadAt';

  const notifications = [
    { id: 'notif-001', unread: true, title: 'John Doe shared a slide with you', meta: '2 minutes ago' },
    { id: 'notif-002', unread: true, title: 'System maintenance tonight at 11 PM', meta: '1 hour ago' },
    { id: 'notif-003', unread: true, title: 'Sarah Smith commented on your presentation', meta: '3 hours ago' },
    { id: 'notif-004', unread: true, title: 'You were added to the Q4 Planning group', meta: '5 hours ago' },
    { id: 'notif-005', unread: false, title: 'Your presentation was successfully exported', meta: 'Yesterday' },
    { id: 'notif-006', unread: false, title: 'ESG Council requested updated metrics', meta: '2 days ago' },
  ];

  const listTemplate = (item, isUnread) => `
    <li class="notification-list-item${isUnread ? ' unread' : ' read'}" data-notification-id="${item.id}">
      ${!isUnread ? '<span class="notification-checkmark" aria-label="Read">✓</span>' : ''}
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

  const getPreviewItems = () => notifications.slice(0, PREVIEW_LIMIT);

  const getUnreadCount = () => {
    if (hasMarkedAllRead()) return 0;
    return notifications.filter(item => item.unread === true).length;
  };

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
    const items = getPreviewItems();
    const allMarkedRead = hasMarkedAllRead();
    listEl.innerHTML = items
      .map(item => {
        // If user clicked "Mark all read", show all as read (with checkmark)
        // Otherwise, respect the item's unread property
        const isUnread = allMarkedRead ? false : (item.unread === true);
        return listTemplate(item, isUnread);
      })
      .join('');
    if (emptyEl) {
      emptyEl.classList.toggle('hidden', items.length > 0);
    }
    return items;
  };

  const updateBadge = (badge, button) => {
    if (!badge) return;
    const unread = getUnreadCount();
    const display = unread > 99 ? '99+' : String(unread);
    const hasUnread = unread > 0;
    badge.textContent = display;
    badge.classList.toggle('hidden', !hasUnread);
    badge.setAttribute('aria-hidden', hasUnread ? 'false' : 'true');
    if (button) {
      const baseLabel = 'Notifications';
      button.setAttribute('aria-label', hasUnread ? `${baseLabel} (${display} unread)` : baseLabel);
    }
  };

  const markAllRead = (badge, emptyEl, listEl, button) => {
    notifications.forEach(item => { item.unread = false; });
    readState.timestamp = String(Date.now());
    renderList(listEl, emptyEl);
    updateBadge(badge, button);
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

    renderList(listEl, emptyEl);
    updateBadge(badge, button);

    const closePanel = () => hidePanel(panel, button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        showPanel(panel, button);
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
      markAllRead(badge, emptyEl, listEl, button);
    });

    seeAll?.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.assign('./notifications.html');
    });
  };

  const init = () => {
    if (hasMarkedAllRead()) {
      notifications.forEach(item => { item.unread = false; });
    }
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

