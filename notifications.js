(() => {
  const PREVIEW_LIMIT = 5;
  const storage = window.AccountStorage;
  const fallbackStore = {
    notifications: [],
    notificationsReadAt: null
  };

  const ensureAccountNotifications = () => {
    if (!storage) return;
    storage.updateCurrentAccount((account) => {
      account.notifications = Array.isArray(account.notifications) ? account.notifications : [];
      if (typeof account.notificationsReadAt === 'undefined') {
        account.notificationsReadAt = null;
      }
    }, { createIfMissing: true });
  };

  const getNotificationList = () => {
    if (storage) {
      const account = storage.getCurrentAccount(true);
      if (account && Array.isArray(account.notifications)) {
        return account.notifications;
      }
      return [];
    }
    return fallbackStore.notifications;
  };

  const updateNotifications = (mutator) => {
    if (storage && storage.getCurrentAccount()) {
      storage.updateCurrentAccount((account) => {
        const list = Array.isArray(account.notifications) ? account.notifications : [];
        mutator(list);
        account.notifications = list;
      });
    } else {
      mutator(fallbackStore.notifications);
    }
  };

  const getReadTimestamp = () => {
    if (storage) {
      const account = storage.getCurrentAccount();
      return account ? account.notificationsReadAt || null : null;
    }
    return fallbackStore.notificationsReadAt;
  };

  const setReadTimestamp = (value) => {
    if (storage && storage.getCurrentAccount()) {
      storage.updateCurrentAccount((account) => {
        account.notificationsReadAt = value || null;
      });
    } else {
      fallbackStore.notificationsReadAt = value || null;
    }
  };

  const hasMarkedAllRead = () => Boolean(getReadTimestamp());

  const getActiveNotifications = () => getNotificationList().filter(item => item && item.dismissed !== true);

  const getPreviewItems = () => getActiveNotifications().slice(0, PREVIEW_LIMIT);

  const getUnreadCount = () => {
    if (hasMarkedAllRead()) return 0;
    return getActiveNotifications().filter(item => item.unread !== false).length;
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
    <div class="notification-item${isUnread ? ' unread' : ''}" data-type="${item.type || 'collaboration'}" data-notification-id="${item.id}" role="button" tabindex="0">
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
    updateNotifications(list => {
      list.forEach(item => {
        if (item) item.unread = false;
      });
    });
    setReadTimestamp(String(Date.now()));
    renderList(listEl, emptyEl);
    updateBadge(badge, button);
  };

  const markNotificationRead = (id) => {
    updateNotifications(list => {
      const found = list.find(item => item && item.id === id);
      if (found) {
        found.unread = false;
      }
    });
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
    updateNotifications(list => {
      const index = list.findIndex(item => item && item.id === id);
      if (index > -1) {
        list.splice(index, 1);
      }
    });
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

    const handleListInteraction = (event) => {
      const item = event.target.closest('.notification-list-item');
      if (!item) return;
      const notificationId = item.getAttribute('data-notification-id');
      markNotificationRead(notificationId);
      renderList(listEl, emptyEl);
      updateBadge(badge, button);
    };

    listEl?.addEventListener('click', handleListInteraction);
    listEl?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handleListInteraction(event);
    });

    seeAll?.addEventListener('click', (event) => {
      event.preventDefault();
      // Notification page has been removed
    });
  };

  const bindPage = () => {
    const listEl = document.querySelector('[data-notifications-page-list]');
    if (!listEl) return;

    const emptyEl = document.querySelector('[data-notifications-page-empty]');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const markButton = document.querySelector('[data-page-mark-read]');
    const dropdownList = document.querySelector('[data-notification-list]');
    const dropdownEmpty = document.querySelector('[data-notification-empty]');
    const headerBadge = document.getElementById('notif-count');
    const headerButton = document.getElementById('btn-top-notifications');
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
      markAllRead(headerBadge, dropdownEmpty, dropdownList, headerButton);
      rerender();
    });

    const syncPreview = () => {
      renderList(dropdownList, dropdownEmpty);
      updateBadge(headerBadge, headerButton);
    };

    listEl.addEventListener('click', (event) => {
      const itemRow = event.target.closest('.notification-item');
      if (!itemRow) return;
      const id = itemRow.getAttribute('data-notification-id');

      if (event.target.closest('[data-dismiss-notification]')) {
        itemRow.classList.add('removing');
        setTimeout(() => {
          dismissNotification(id);
          rerender();
          syncPreview();
        }, 200);
        return;
      }

      markNotificationRead(id);
      rerender();
      syncPreview();
    });

    listEl.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const itemRow = event.target.closest('.notification-item');
      if (!itemRow) return;
      event.preventDefault();
      const id = itemRow.getAttribute('data-notification-id');
      markNotificationRead(id);
      rerender();
      syncPreview();
    });

    rerender();
  };

  const init = () => {
    ensureAccountNotifications();
    const list = getNotificationList();
    if (list.some(item => item && item.unread === true)) {
      setReadTimestamp(null);
    } else if (hasMarkedAllRead()) {
      updateNotifications(items => {
        items.forEach(item => {
          if (item) item.unread = false;
        });
      });
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

