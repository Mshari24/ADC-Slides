// Minimal Slides Clone: very basic deck with add/select slides and editable text boxes

(function () {
  const stageEl = document.getElementById('stage');
  const sidebarEl = document.getElementById('slides-sidebar');
  const deckTitleEl = document.getElementById('deck-title');

  const btnAddSlide = document.getElementById('btn-add-slide');
  const btnDelSlide = document.getElementById('btn-del-slide');
  const btnDupSlide = document.getElementById('btn-dup-slide');
  const btnInsertText = document.getElementById('btn-insert-text');

  const defaultSlide = () => ({ id: uid(), elements: [] });

  const state = {
    title: 'Untitled presentation',
    currentSlideIndex: 0,
    slides: [defaultSlide()],
  };

  // Utils
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function setStatus(msg) {
    const s = document.getElementById('status-text');
    if (s) s.textContent = msg;
  }

  // Rendering
  function renderSidebar() {
    sidebarEl.innerHTML = '';
    state.slides.forEach((slide, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (idx === state.currentSlideIndex ? ' selected' : '');
      thumb.dataset.index = String(idx);

      const inner = document.createElement('div');
      inner.className = 'thumb-inner';
      // very simple preview: render text elements
      slide.elements.forEach((el) => {
        if (el.type === 'text') {
          const t = document.createElement('div');
          t.style.position = 'absolute';
          t.style.left = el.x + 'px';
          t.style.top = el.y + 'px';
          t.style.fontSize = (el.fontSize || 18) + 'px';
          t.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
          t.style.color = el.color || '#111';
          t.textContent = el.text || 'Text';
          inner.appendChild(t);
        }
      });
      thumb.appendChild(inner);
      sidebarEl.appendChild(thumb);
    });
  }

  function renderStage() {
    stageEl.innerHTML = '';
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return;
    slide.elements.forEach((el) => {
      if (el.type === 'text') {
        const node = document.createElement('div');
        node.className = 'el text';
        node.contentEditable = 'true';
        node.spellcheck = false;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.minWidth = '80px';
        node.style.minHeight = '24px';
        node.style.fontSize = (el.fontSize || 18) + 'px';
        node.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
        node.style.color = el.color || '#111';
        node.textContent = el.text || 'Double-click to edit';

        node.addEventListener('input', () => {
          el.text = node.textContent || '';
          renderSidebar();
        });

        // basic drag within stage
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        node.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          node.classList.add('selected');
          e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => {
          if (!dragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          el.x = Math.max(0, Math.min(1280 - 20, origX + dx));
          el.y = Math.max(0, Math.min(720 - 20, origY + dy));
          node.style.left = el.x + 'px';
          node.style.top = el.y + 'px';
        });
        window.addEventListener('mouseup', () => {
          if (dragging) {
            dragging = false;
            node.classList.remove('selected');
            renderSidebar();
          }
        });

        stageEl.appendChild(node);
      }
    });
  }

  function renderAll() {
    deckTitleEl.textContent = state.title;
    renderSidebar();
    renderStage();
    setStatus(`Slide ${state.currentSlideIndex + 1} of ${state.slides.length}`);
  }

  // Actions
  function addSlide() {
    state.slides.push(defaultSlide());
    state.currentSlideIndex = state.slides.length - 1;
    renderAll();
  }

  function deleteSlide() {
    if (state.slides.length <= 1) return;
    state.slides.splice(state.currentSlideIndex, 1);
    state.currentSlideIndex = Math.max(0, state.currentSlideIndex - 1);
    renderAll();
  }

  function dupSlide() {
    const src = state.slides[state.currentSlideIndex];
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid();
    state.slides.splice(state.currentSlideIndex + 1, 0, copy);
    state.currentSlideIndex += 1;
    renderAll();
  }

  function insertText() {
    const slide = state.slides[state.currentSlideIndex];
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: 100,
      y: 100,
      text: 'Text',
      fontSize: 24,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
    });
    renderAll();
  }

  // Events wiring
  btnAddSlide?.addEventListener('click', addSlide);
  btnDelSlide?.addEventListener('click', deleteSlide);
  btnDupSlide?.addEventListener('click', dupSlide);
  btnInsertText?.addEventListener('click', insertText);

  deckTitleEl.addEventListener('input', () => {
    state.title = deckTitleEl.textContent || 'Untitled presentation';
  });

  sidebarEl.addEventListener('click', (e) => {
    const item = e.target.closest('.slide-thumb');
    if (!item) return;
    const idx = Number(item.dataset.index || 0);
    if (!Number.isNaN(idx)) {
      state.currentSlideIndex = idx;
      renderAll();
    }
  });

  // Keyboard: very minimal
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      addSlide();
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      deleteSlide();
    }
    if (e.key.toLowerCase() === 't') {
      e.preventDefault();
      insertText();
    }
  });

  // Initial render
  renderAll();
})();


