(() => {
  const PREVIEW_LIMIT = 5;
  const STORAGE_KEY = 'adcNotificationsReadAt';

  const notifications = [
    { id: 'notif-001', unread: true, type: 'collaboration', title: 'John Doe shared a slide with you', meta: '2 minutes ago' },
    { id: 'notif-002', unread: true, type: 'system', title: 'System maintenance tonight at 11 PM', meta: '1 hour ago' },
    { id: 'notif-003', unread: true, type: 'collaboration', title: 'Sarah Smith commented on your presentation', meta: '3 hours ago' },
    { id: 'notif-004', unread: true, type: 'collaboration', title: 'You were added to the Q4 Planning group', meta: '5 hours ago' },
    { id: 'notif-005', unread: false, type: 'system', title: 'Your presentation was successfully exported', meta: 'Yesterday' },
    { id: 'notif-006', unread: false, type: 'system', title: 'ESG Council requested updated metrics', meta: '2 days ago' },
    { id: 'notif-007', unread: false, type: 'collaboration', title: 'Layla Haddad mentioned you in Innovation Review', meta: '3 days ago' },
    { id: 'notif-008', unread: false, type: 'system', title: 'New templates available in Quick create', meta: 'Last week' },
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

  const getActiveNotifications = () => notifications.filter(item => item.dismissed !== true);

  const getPreviewItems = () => getActiveNotifications().slice(0, PREVIEW_LIMIT);

  const getUnreadCount = () => {
    if (hasMarkedAllRead()) return 0;
    return getActiveNotifications().filter(item => item.unread === true).length;
  };

  const getIconForType = (type) => {
    if (type === 'system') {
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    `;
  };

  const pageItemTemplate = (item, isUnread) => `
    <div class="notification-item${isUnread ? ' unread' : ''}" data-type="${item.type || 'collaboration'}" data-notification-id="${item.id}">
      <div class="notification-indicator"></div>
      <div class="notification-icon ${item.type || 'collaboration'}">
        ${getIconForType(item.type || 'collaboration')}
      </div>
      <div class="notification-content">
        <div class="notification-text">
          <span class="notification-summary">${item.title}</span>
          <span class="notification-timestamp">${item.meta}</span>
        </div>
        <div class="notification-action">
          <button class="action-link dismiss" type="button" data-dismiss-notification>Dismiss</button>
        </div>
      </div>
    </div>
  `;

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
    getActiveNotifications().forEach(item => { item.unread = false; });
    readState.timestamp = String(Date.now());
    renderList(listEl, emptyEl);
    updateBadge(badge, button);
  };

  const renderPageFeed = (listEl, emptyEl) => {
    if (!listEl) return;
    const items = getActiveNotifications();
    const allMarkedRead = hasMarkedAllRead();
    listEl.innerHTML = items
      .map(item => pageItemTemplate(item, allMarkedRead ? false : item.unread === true))
      .join('');

    if (emptyEl) {
      emptyEl.classList.toggle('hidden', items.length > 0);
    }
  };

  const dismissNotification = (id) => {
    const found = notifications.find(item => item.id === id);
    if (found) {
      found.unread = false;
      found.dismissed = true;
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
      window.location.assign('./notification.html');
    });
  };

  const bindPage = () => {
    const listEl = document.querySelector('[data-notifications-page-list]');
    if (!listEl) return;

    const emptyEl = document.querySelector('[data-notifications-page-empty]');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const markButton = document.querySelector('[data-page-mark-read]');
    let currentFilter = 'all';

    const applyFilter = (filter) => {
      currentFilter = filter;
      const items = listEl.querySelectorAll('.notification-item');
      items.forEach(item => {
        const type = item.getAttribute('data-type');
        const isUnread = item.classList.contains('unread');
        let show = true;
        if (filter === 'unread') {
          show = isUnread;
        } else if (filter !== 'all') {
          show = type === filter;
        }
        item.style.display = show ? 'flex' : 'none';
      });
      updateEmptyState();
    };

    const updateEmptyState = () => {
      if (!emptyEl) return;
      const visible = Array.from(listEl.querySelectorAll('.notification-item')).some(item => item.style.display !== 'none');
      emptyEl.classList.toggle('hidden', visible);
    };

    const rerender = () => {
      renderPageFeed(listEl, emptyEl);
      applyFilter(currentFilter);
    };

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        applyFilter(button.dataset.filter || 'all');
      });
    });

    markButton?.addEventListener('click', () => {
      markAllRead();
      rerender();
    });

    listEl.addEventListener('click', (event) => {
      const dismissButton = event.target.closest('[data-dismiss-notification]');
      if (!dismissButton) return;
      const parent = dismissButton.closest('.notification-item');
      if (!parent) return;
      const id = parent.getAttribute('data-notification-id');
      parent.classList.add('removing');
      setTimeout(() => {
        dismissNotification(id);
        rerender();
      }, 200);
    });

    rerender();
  };

  const init = () => {
    if (hasMarkedAllRead()) {
      notifications.forEach(item => { item.unread = false; });
    }
    bindDropdown();
    bindPage();
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

