// Minimal Slides Clone: very basic deck with add/select slides and editable text boxes

(function () {
  const AccountStorage = window.AccountStorage;
  const LOCAL_STORAGE_KEY = 'adc_slides_autosave_v1';

  const savePresentationSnapshot = (snapshot) => {
    if (AccountStorage && AccountStorage.getCurrentAccount()) {
      AccountStorage.updateCurrentAccount((account) => {
        account.presentations = account.presentations || {};
        account.presentations.autosave = snapshot;
      });
    } else if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
      } catch (err) {
        console.warn('Failed to persist state', err);
      }
    }
  };

  const loadPresentationSnapshot = () => {
    if (AccountStorage) {
      const account = AccountStorage.getCurrentAccount();
      if (account && account.presentations && account.presentations.autosave) {
        return account.presentations.autosave;
      }
    }
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && AccountStorage && AccountStorage.getCurrentAccount()) {
        AccountStorage.updateCurrentAccount((account) => {
          account.presentations = account.presentations || {};
          account.presentations.autosave = parsed;
        });
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (err) {
          console.warn('Unable to clear legacy presentation state', err);
        }
      }
      return parsed;
    } catch (err) {
      console.warn('Failed to load persisted state', err);
      return null;
    }
  };

  function persistState() {
    const snapshot = JSON.parse(JSON.stringify(state));
    savePresentationSnapshot(snapshot);
  }

  function loadPersistedState() {
    const persisted = loadPresentationSnapshot();
    if (!persisted || !Array.isArray(persisted.slides)) return null;
    return persisted;
  }

  function normalizeState(st) {
    if (!st || !Array.isArray(st.slides) || st.slides.length === 0) {
      st.slides = [defaultSlide()];
    }
    st.slides.forEach(slide => {
      if (!Array.isArray(slide.elements)) slide.elements = [];
      slide.elements.forEach(el => {
        if (el.type === 'text') {
          el.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
          el.fontSize = el.fontSize || 18;
          el.fontWeight = el.fontWeight || 'normal';
          el.fontStyle = el.fontStyle || 'normal';
          el.textAlign = el.textAlign || 'left';
          el.underline = !!el.underline;
          el.lineHeight = el.lineHeight || 1.2;
          el.listType = el.listType || null;
          el.rotation = typeof el.rotation === 'number' ? el.rotation : 0;
          el.scale = el.scale || 1;
          el.content = el.content || el.text || '';
          el.text = el.text || el.content || '';
        }
      });
    });
    st.title = st.title || 'Untitled presentation';
    if (typeof st.currentSlideIndex !== 'number') st.currentSlideIndex = 0;
    st.currentSlideIndex = Math.min(Math.max(0, st.currentSlideIndex), st.slides.length - 1);
  }

  const stageEl = document.getElementById('stage');
  const stageWrap = document.querySelector('.stage-wrap');
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

  // Drawing mode state
  let isDrawingMode = false;
  let isEraserMode = false;
  let currentDrawing = null;
  let currentPath = null;
  let drawingPoints = [];
  let currentDrawColor = '#000000';
  let currentDrawWidth = 3;

  // Check URL parameters for presentation ID
  const urlParams = new URLSearchParams(window.location.search);
  const presentationId = urlParams.get('presentation');
  const projectId = urlParams.get('project');
  const isNewPresentation = !!presentationId; // If there's a presentation ID, it's a new one (not autosave)
  
  // Only load autosave if there's NO presentation ID in URL
  // If there's a presentation ID, create a fresh presentation
  const persisted = !presentationId ? loadPersistedState() : null;
  
  if (persisted) {
    Object.assign(state, persisted);
  } else {
    // Create fresh state for new presentation
    state.title = 'Untitled presentation';
    state.currentSlideIndex = 0;
    state.slides = [defaultSlide()];
  }
  
  normalizeState(state);
  persistState();

  // Undo/Redo stack
  const history = {
    stack: [JSON.stringify(state)],
    pointer: 0
  };

  function saveState() {
    persistState();
    const current = JSON.stringify(state);
    if (history.stack[history.pointer] !== current) {
      history.stack = history.stack.slice(0, history.pointer + 1);
      history.stack.push(current);
      history.pointer = history.stack.length - 1;
      if (history.stack.length > 50) {
        history.stack.shift();
        history.pointer--;
      }
      updateUndoRedoButtons();
    }
  }

  function undo() {
    if (history.pointer > 0) {
      history.pointer--;
      const saved = JSON.parse(history.stack[history.pointer]);
      Object.assign(state, saved);
      renderAll();
      persistState();
      updateUndoRedoButtons();
    }
  }

  function redo() {
    if (history.pointer < history.stack.length - 1) {
      history.pointer++;
      const saved = JSON.parse(history.stack[history.pointer]);
      Object.assign(state, saved);
      renderAll();
      persistState();
      updateUndoRedoButtons();
    }
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = history.pointer === 0;
    if (btnRedo) btnRedo.disabled = history.pointer === history.stack.length - 1;
  }

  // Utils
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function getSelectedElement() {
    return document.querySelector('.el.selected');
  }

  function updateSelectedElement() {
    const selected = getSelectedElement();
    if (!selected) return;
    const slide = state.slides[state.currentSlideIndex];
    const elId = selected.dataset.id;
    const el = slide.elements.find(e => e.id === elId);
    if (!el) return;

    // Update from toolbar controls
    const fontFamily = document.getElementById('font-family')?.value;
    const fontSize = document.getElementById('font-size')?.value;
    const fontColor = document.getElementById('font-color')?.value;
    const fillColor = document.getElementById('fill-color')?.value;
    const strokeColor = document.getElementById('stroke-color')?.value;
    const strokeWidth = document.getElementById('stroke-width')?.value;
    const strokeDash = document.getElementById('stroke-dash')?.value;

    if (el.type === 'text') {
      if (fontFamily) {
        el.fontFamily = fontFamily;
        selected.style.fontFamily = fontFamily;
      }
      if (fontSize) {
        el.fontSize = parseInt(fontSize);
        selected.style.fontSize = fontSize + 'px';
      }
      if (fontColor) {
        el.color = fontColor;
        selected.style.color = fontColor;
      }
    }

    if (el.type === 'line') {
      // Update line properties
      if (strokeColor) {
        el.strokeColor = strokeColor;
        // Update SVG line/path stroke color
        const svg = selected.querySelector('svg');
        if (svg) {
          const path = svg.querySelector('line, path');
          if (path) path.setAttribute('stroke', strokeColor);
          // Update control points stroke color
          const controlPoints = svg.querySelectorAll('.line-control-point');
          controlPoints.forEach(circle => {
            circle.setAttribute('stroke', strokeColor);
          });
        }
      }
      if (strokeWidth !== undefined) {
        el.strokeWidth = parseInt(strokeWidth);
        // Update SVG line/path stroke width
        const svg = selected.querySelector('svg');
        if (svg) {
          const path = svg.querySelector('line, path');
          if (path) path.setAttribute('stroke-width', strokeWidth);
        }
      }
      // Lines don't support stroke dash in the current implementation
      // but we can save it for future use
      if (strokeDash) {
        el.strokeDash = strokeDash;
      }
    } else {
      // Update shape/text properties
      if (fillColor) {
        el.fillColor = fillColor;
        selected.style.backgroundColor = fillColor;
      }
      if (strokeColor) {
        el.strokeColor = strokeColor;
        selected.style.borderColor = strokeColor;
      }
      if (strokeWidth !== undefined) {
        el.strokeWidth = parseInt(strokeWidth);
        selected.style.borderWidth = strokeWidth + 'px';
      }
      if (strokeDash) {
        el.strokeDash = strokeDash;
        if (strokeDash === 'dashed') selected.style.borderStyle = 'dashed';
        else if (strokeDash === 'dotted') selected.style.borderStyle = 'dotted';
        else selected.style.borderStyle = 'solid';
      }
    }

    saveState();
  }

  function setStatus(msg) {
    const s = document.getElementById('status-text');
    if (s) s.textContent = msg;
  }

  // Rendering
  function renderSidebar() {
    if (!sidebarEl) return;
    sidebarEl.innerHTML = '';
    state.slides.forEach((slide, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (idx === state.currentSlideIndex ? ' selected' : '');
      thumb.dataset.index = String(idx);
      thumb.draggable = true;

      const label = document.createElement('div');
      label.className = 'thumb-label';
      label.textContent = `Slide ${idx + 1}`;

      const inner = document.createElement('div');
      inner.className = 'thumb-inner';
      // Render preview of elements
      slide.elements.forEach((el) => {
        if (el.type === 'text') {
          const t = document.createElement('div');
          t.style.position = 'absolute';
          t.style.left = (el.x * 0.12) + 'px';
          t.style.top = (el.y * 0.12) + 'px';
          t.style.fontSize = ((el.fontSize || 18) * 0.12) + 'px';
          t.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
          t.style.color = el.color || '#111';
          t.style.whiteSpace = 'nowrap';
          t.style.overflow = 'hidden';
          t.style.maxWidth = '150px';
          const plain = (el.content ? el.content.replace(/<[^>]+>/g, '') : el.text || 'Text');
          t.textContent = plain.substring(0, 20);
          inner.appendChild(t);
        } else if (el.type === 'shape') {
          const s = document.createElement('div');
          s.style.position = 'absolute';
          s.style.left = (el.x * 0.12) + 'px';
          s.style.top = (el.y * 0.12) + 'px';
          s.style.width = ((el.width || 100) * 0.12) + 'px';
          s.style.height = ((el.height || 100) * 0.12) + 'px';
          s.style.backgroundColor = el.fillColor || '#fff';
          s.style.border = `1px solid ${el.strokeColor || '#000'}`;
          applyShapeAppearance(s, el.shape);
          inner.appendChild(s);
        } else if (el.type === 'table') {
          const tablePreview = document.createElement('div');
          tablePreview.style.position = 'absolute';
          tablePreview.style.left = (el.x * 0.12) + 'px';
          tablePreview.style.top = (el.y * 0.12) + 'px';
          tablePreview.style.width = ((el.width || 300) * 0.12) + 'px';
          tablePreview.style.height = ((el.height || 200) * 0.12) + 'px';
          tablePreview.style.display = 'grid';
          const rows = el.rows || 3;
          const cols = el.cols || 3;
          tablePreview.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          tablePreview.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
          tablePreview.style.border = `1px solid ${el.borderColor || '#1f2937'}`;
          for (let r = 0; r < rows * cols; r++) {
            const cell = document.createElement('div');
            cell.style.border = `1px solid ${el.borderColor || '#1f2937'}`;
            cell.style.background = el.backgroundColor || '#ffffff';
            tablePreview.appendChild(cell);
          }
          inner.appendChild(tablePreview);
        } else if (el.type === 'image' && el.src) {
          const img = document.createElement('img');
          img.src = el.src;
          img.style.position = 'absolute';
          img.style.left = (el.x * 0.12) + 'px';
          img.style.top = (el.y * 0.12) + 'px';
          img.style.width = ((el.width || 200) * 0.12) + 'px';
          img.style.height = ((el.height || 200) * 0.12) + 'px';
          img.style.objectFit = 'cover';
          inner.appendChild(img);
        } else if (el.type === 'sticky') {
          const stickyPreview = document.createElement('div');
          stickyPreview.style.position = 'absolute';
          stickyPreview.style.left = (el.x * 0.12) + 'px';
          stickyPreview.style.top = (el.y * 0.12) + 'px';
          stickyPreview.style.width = ((el.width || 200) * 0.12) + 'px';
          stickyPreview.style.height = ((el.height || 200) * 0.12) + 'px';
          stickyPreview.style.backgroundColor = el.color || '#fef08a';
          stickyPreview.style.borderRadius = '2px';
          stickyPreview.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          inner.appendChild(stickyPreview);
        } else if (el.type === 'pdf' && el.src) {
          const pdfPreview = document.createElement('div');
          pdfPreview.style.position = 'absolute';
          pdfPreview.style.left = (el.x * 0.12) + 'px';
          pdfPreview.style.top = (el.y * 0.12) + 'px';
          pdfPreview.style.width = ((el.width || 200) * 0.12) + 'px';
          pdfPreview.style.height = ((el.height || 250) * 0.12) + 'px';
          pdfPreview.style.backgroundColor = '#f3f4f6';
          pdfPreview.style.border = '1px solid #d1d5db';
          pdfPreview.style.borderRadius = '2px';
          pdfPreview.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          inner.appendChild(pdfPreview);
        } else if (el.type === 'chart') {
          const chartPreview = document.createElement('div');
          chartPreview.style.position = 'absolute';
          chartPreview.style.left = (el.x * 0.12) + 'px';
          chartPreview.style.top = (el.y * 0.12) + 'px';
          chartPreview.style.width = ((el.width || 400) * 0.12) + 'px';
          chartPreview.style.height = ((el.height || 300) * 0.12) + 'px';
          chartPreview.style.backgroundColor = '#ffffff';
          chartPreview.style.border = '1px solid #e5e7eb';
          chartPreview.style.borderRadius = '2px';
          chartPreview.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          inner.appendChild(chartPreview);
        } else if (el.type === 'line') {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '153.6');
          svg.setAttribute('height', '86.4');
          svg.style.position = 'absolute';
          svg.style.left = '0';
          svg.style.top = '0';
          svg.style.pointerEvents = 'none';
          
          let x1 = (el.x1 || 200) * 0.12;
          let y1 = (el.y1 || 200) * 0.12;
          let x2 = (el.x2 || 400) * 0.12;
          let y2 = (el.y2 || 200) * 0.12;
          let midX = el.midX !== null && el.midX !== undefined ? el.midX * 0.12 : null;
          let midY = el.midY !== null && el.midY !== undefined ? el.midY * 0.12 : null;
          const strokeColor = el.strokeColor || '#000000';
          const strokeWidth = (el.strokeWidth || 2) * 0.12;
          
          let path;
          if (el.lineType === 'straight') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            path.setAttribute('x1', x1);
            path.setAttribute('y1', y1);
            path.setAttribute('x2', x2);
            path.setAttribute('y2', y2);
          } else if (el.lineType === 'wavy') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const controlY = midY !== null && midY !== undefined ? midY : ((y1 + y2) / 2 - 3.6);
            path.setAttribute('d', `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${controlY}, ${(x1 + x2) / 2} ${(y1 + y2) / 2} T ${x2} ${y2}`);
          } else if (el.lineType === 'semicircular') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const controlX = midX !== null && midX !== undefined ? midX : (x1 + x2) / 2;
            const controlY = midY !== null && midY !== undefined ? midY : (y1 - 6);
            path.setAttribute('d', `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`);
          }
          
          if (path) {
            path.setAttribute('stroke', strokeColor);
            path.setAttribute('stroke-width', strokeWidth);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            svg.appendChild(path);
          }
          
          inner.appendChild(svg);
        }
      });

      thumb.appendChild(label);
      thumb.appendChild(inner);
      sidebarEl.appendChild(thumb);

      // Click to select
      thumb.addEventListener('click', (e) => {
        if (e.target.closest('.context-menu')) return;
        state.currentSlideIndex = idx;
        renderAll();
      });

      // Drag and drop
      thumb.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
        thumb.classList.add('dragging');
      });

      thumb.addEventListener('dragend', () => {
        document.querySelectorAll('.slide-thumb').forEach(t => t.classList.remove('dragging', 'drag-over'));
      });

      thumb.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        thumb.classList.add('drag-over');
      });

      thumb.addEventListener('dragleave', () => {
        thumb.classList.remove('drag-over');
      });

      thumb.addEventListener('drop', (e) => {
        e.preventDefault();
        thumb.classList.remove('drag-over');
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const toIdx = idx;
        if (fromIdx !== toIdx) {
          const [moved] = state.slides.splice(fromIdx, 1);
          state.slides.splice(toIdx, 0, moved);
          if (state.currentSlideIndex === fromIdx) {
            state.currentSlideIndex = toIdx;
          } else if (state.currentSlideIndex > fromIdx && state.currentSlideIndex <= toIdx) {
            state.currentSlideIndex--;
          } else if (state.currentSlideIndex < fromIdx && state.currentSlideIndex >= toIdx) {
            state.currentSlideIndex++;
          }
          saveState();
          renderAll();
        }
      });

      // Right-click context menu
      thumb.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const menu = document.getElementById('slide-context-menu');
        if (menu) {
          menu.style.left = e.pageX + 'px';
          menu.style.top = e.pageY + 'px';
          menu.classList.remove('hidden');
          menu.dataset.slideIndex = String(idx);
        }
      });
    });
  }

  // Context Toolbar functionality
  const stageContainer = stageEl?.parentElement;
  const floatingToolbar = document.getElementById('floating-toolbar');
  const toolbarMenu = document.getElementById('toolbar-menu');
  const btnMore = document.getElementById('btn-more');
  let clipboardElement = null;
  let currentToolbarTarget = null;
  
  function positionFloatingToolbar(targetNode) {
    if (!floatingToolbar || !targetNode) return;
    const container = stageContainer || document.body;
    const containerRect = container.getBoundingClientRect();
    const rect = targetNode.getBoundingClientRect();
    const toolbarRect = floatingToolbar.getBoundingClientRect();
    const scrollTop = container === document.body ? window.scrollY : container.scrollTop;
    const scrollLeft = container === document.body ? window.scrollX : container.scrollLeft;
    const top = rect.top - containerRect.top + scrollTop - toolbarRect.height - 16;
    const left = rect.left - containerRect.left + scrollLeft + rect.width / 2 - toolbarRect.width / 2;
    const maxTop = (containerRect.height || window.innerHeight) - toolbarRect.height - 16;
    const maxLeft = (containerRect.width || window.innerWidth) - toolbarRect.width - 16;
    floatingToolbar.style.top = `${Math.max(16, Math.min(top, maxTop))}px`;
    floatingToolbar.style.left = `${Math.max(16, Math.min(left, maxLeft))}px`;
  }
  
  function showContextToolbar(targetNode) {
    if (!floatingToolbar || !targetNode) return;
    currentToolbarTarget = targetNode;
    floatingToolbar.classList.remove('hidden');
    toolbarMenu?.classList.add('hidden');
    requestAnimationFrame(() => positionFloatingToolbar(targetNode));
  }
  
  function hideContextToolbar() {
    if (floatingToolbar) {
      floatingToolbar.classList.add('hidden');
    }
    toolbarMenu?.classList.add('hidden');
    currentToolbarTarget = null;
    hideTextControlBar();
  }

  function renderStage() {
    // Don't clear if we're in the middle of drawing (preserve temp SVG)
    if (!isDrawingMode || !currentDrawing) {
      stageEl.innerHTML = '';
    } else {
      // Only remove non-temp elements
      const tempSvg = stageEl.querySelector('.drawing-temp');
      const elementsToRemove = stageEl.querySelectorAll('.el:not(.drawing-temp)');
      elementsToRemove.forEach(el => el.remove());
    }
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return;
    
    // Remove previous selection listeners
    document.querySelectorAll('.el').forEach(el => {
      el.classList.remove('selected');
    });
    
    slide.elements.forEach((el) => {
      if (el.type === 'text') {
        const node = document.createElement('div');
        node.className = 'el text';
        node.dataset.id = el.id;
        node.contentEditable = el.locked ? 'false' : 'true';
        node.spellcheck = false;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.minWidth = '80px';
        node.style.minHeight = '24px';
        node.style.fontSize = (el.fontSize || 18) + 'px';
        node.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
        node.style.color = el.color || '#111';
        node.style.fontWeight = el.fontWeight || 'normal';
        node.style.fontStyle = el.fontStyle || 'normal';
        node.style.textDecoration = el.underline ? 'underline' : 'none';
        node.style.textAlign = el.textAlign || 'left';
        node.style.lineHeight = el.lineHeight ? String(el.lineHeight) : '1.2';
        node.style.backgroundColor = el.fillColor || 'transparent';
        node.style.border = `${el.strokeWidth || 1}px ${el.strokeDash === 'dashed' ? 'dashed' : el.strokeDash === 'dotted' ? 'dotted' : 'solid'} ${el.strokeColor || 'transparent'}`;
        node.style.transformOrigin = 'top left';
        node.innerHTML = el.content || el.text || 'Double-click to edit';
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'text';

        node.addEventListener('input', () => {
          if (editingElementId === el.id) {
            syncEditingContent({ save: false });
          } else {
            el.content = node.innerHTML;
            el.text = node.innerText || '';
            renderSidebar();
          }
          saveState();
        });

        let dragging = false;
        let resizing = false;
        let dragFromIcon = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        let dragStartTime = 0;
        let dragStartPos = { x: 0, y: 0 };
        let startScale = el.scale || 1;

        const moveHandle = document.createElement('button');
        moveHandle.className = 'text-move-handle';
        moveHandle.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="5 9 2 12 5 15"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line></svg>';
        moveHandle.setAttribute('contenteditable', 'false');
        moveHandle.type = 'button';
        node.appendChild(moveHandle);
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle se';
        resizeHandle.setAttribute('contenteditable', 'false');
        node.appendChild(resizeHandle);

        const showDragInfo = () => {
          if (!dragIndicator || !stageWrap) return;
          dragIndicator.textContent = `x: ${Math.round(el.x)}  y: ${Math.round(el.y)}`;
          const stageRect = stageWrap.getBoundingClientRect();
          const rect = node.getBoundingClientRect();
          dragIndicator.style.left = `${rect.left + rect.width / 2 - stageRect.left}px`;
          dragIndicator.style.top = `${rect.top - stageRect.top}px`;
          dragIndicator.classList.remove('hidden');
        };
        const hideDragInfo = () => {
          dragIndicator?.classList.add('hidden');
        };
        const updateTransform = () => {
          const parts = [];
          if (el.scale && el.scale !== 1) parts.push(`scale(${el.scale})`);
          node.style.transform = parts.join(' ');
        };
        updateTransform();

        function startDrag(e, options = {}) {
          if (e.button !== 0) return;
          if (editingElementId === el.id && !options.force) return;
          if (el.locked) {
            document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
            node.classList.add('selected');
            updateToolbarFromSelection();
            showContextToolbar(node);
            showTextControlBarForElement(el);
            e.preventDefault();
            return;
          }
          dragFromIcon = !!options.fromIcon;
          dragStartTime = Date.now();
          dragStartPos = { x: e.clientX, y: e.clientY };
          dragging = false;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          showTextControlBarForElement(el);
          node.classList.add('dragging');
          showDragInfo();
          document.body.style.cursor = 'grabbing';
          e.preventDefault();
        }

        node.addEventListener('mousedown', (e) => startDrag(e));
        moveHandle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          startDrag(e, { fromIcon: true, force: true });
        });

        node.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          enterTextEditing(node, el);
        });

        const handleMouseMove = (e) => {
          if (resizing) {
            const dx = e.clientX - dragStartPos.x;
            const dy = e.clientY - dragStartPos.y;
            const delta = Math.max(dx, dy);
            const base = Math.max(node.offsetWidth, node.offsetHeight) || 1;
            const factor = Math.max(0.2, startScale + delta / base);
            el.scale = factor;
            updateTransform();
            persistState();
            return;
          }
          if (dragStartTime === 0 || (editingElementId === el.id && !dragFromIcon)) return;
          const moveDistance = Math.abs(e.clientX - dragStartPos.x) + Math.abs(e.clientY - dragStartPos.y);
          if ((moveDistance > 5 || dragFromIcon) && !dragging) {
            dragging = true;
            node.style.cursor = 'move';
            node.style.userSelect = 'none';
          }
          if (dragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.x = Math.max(0, Math.min(1280 - 20, origX + dx));
            el.y = Math.max(0, Math.min(720 - 20, origY + dy));
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
            showDragInfo();
            persistState();
          }
        };

        const handleMouseUp = () => {
          if (resizing) {
            resizing = false;
            document.body.style.cursor = '';
            saveState();
            renderSidebar();
            if (editingElementId === el.id) enterTextEditing(node, el);
            return;
          }
          if (dragging) {
            dragging = false;
            node.classList.remove('dragging');
            saveState();
            renderSidebar();
            if (editingElementId === el.id) {
              enterTextEditing(node, el);
            }
          } else if (dragStartTime > 0 && !el.locked && !dragFromIcon) {
            enterTextEditing(node, el);
          }
          dragStartTime = 0;
          dragFromIcon = false;
          hideDragInfo();
          document.body.style.cursor = '';
          if (node) {
            node.style.cursor = 'text';
            node.style.userSelect = 'text';
          }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        resizeHandle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          if (e.button !== 0) return;
          if (el.locked) return;
          resizing = true;
          startScale = el.scale || 1;
          dragStartPos = { x: e.clientX, y: e.clientY };
          document.body.style.cursor = 'nwse-resize';
        });

        stageEl.appendChild(node);
      } else if (el.type === 'sticky') {
        const node = document.createElement('div');
        node.className = 'el sticky';
        node.dataset.id = el.id;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || 200) + 'px';
        node.style.height = (el.height || 200) + 'px';
        node.style.backgroundColor = el.color || '#fef08a';
        node.style.borderRadius = '4px';
        node.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        node.style.position = 'absolute';
        node.style.display = 'flex';
        node.style.flexDirection = 'column';
        node.style.padding = '12px';
        node.style.boxSizing = 'border-box';
        node.style.cursor = 'move';
        
        // Text content area
        const textArea = document.createElement('div');
        textArea.className = 'sticky-text';
        textArea.contentEditable = el.locked ? 'false' : 'true';
        textArea.spellcheck = false;
        textArea.style.flex = '1';
        textArea.style.minHeight = '120px';
        textArea.style.fontSize = (el.fontSize || 16) + 'px';
        textArea.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
        textArea.style.color = '#1f2937';
        textArea.style.outline = 'none';
        textArea.style.border = 'none';
        textArea.style.background = 'transparent';
        textArea.style.resize = 'none';
        textArea.style.overflow = 'auto';
        textArea.textContent = el.text || 'Add Text';
        if (el.content) {
          textArea.innerHTML = el.content;
        }
        
        // Username area (permanently at bottom)
        const usernameArea = document.createElement('div');
        usernameArea.className = 'sticky-username';
        usernameArea.style.marginTop = 'auto';
        usernameArea.style.paddingTop = '8px';
        usernameArea.style.borderTop = '1px solid rgba(0, 0, 0, 0.1)';
        usernameArea.style.fontSize = '12px';
        usernameArea.style.color = 'rgba(0, 0, 0, 0.6)';
        usernameArea.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
        usernameArea.textContent = el.username || getUsername();
        usernameArea.style.userSelect = 'none';
        usernameArea.style.pointerEvents = 'none';
        
        node.appendChild(textArea);
        node.appendChild(usernameArea);
        
        // Text editing
        textArea.addEventListener('input', () => {
          el.text = textArea.innerText || '';
          el.content = textArea.innerHTML;
          saveState();
        });
        
        textArea.addEventListener('blur', () => {
          if (!textArea.innerText.trim() || textArea.innerText.trim() === 'Add Text') {
            textArea.textContent = 'Add Text';
            el.text = 'Add Text';
            el.content = '';
          } else {
            el.text = textArea.innerText || '';
            el.content = textArea.innerHTML;
          }
          saveState();
        });
        
        // Handle paste events to clean up formatting
        textArea.addEventListener('paste', (e) => {
          e.preventDefault();
          const text = (e.clipboardData || window.clipboardData).getData('text/plain');
          document.execCommand('insertText', false, text);
        });
        
        // Drag functionality
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        let dragStartTime = 0;
        let dragStartPos = { x: 0, y: 0 };
        
        function startDrag(e) {
          if (e.button !== 0) return;
          if (el.locked) {
            document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
            node.classList.add('selected');
            updateToolbarFromSelection();
            showContextToolbar(node);
            e.preventDefault();
            return;
          }
          dragStartTime = Date.now();
          dragStartPos = { x: e.clientX, y: e.clientY };
          dragging = false;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          node.classList.add('dragging');
          e.preventDefault();
        }
        
        node.addEventListener('mousedown', (e) => {
          // If clicking on text area, allow text editing
          if (e.target === textArea || textArea.contains(e.target)) {
            // Focus text area for editing
            setTimeout(() => {
              textArea.focus();
            }, 0);
            return;
          }
          // Otherwise, start dragging
          startDrag(e);
        });
        
        // Double-click to focus text area
        node.addEventListener('dblclick', (e) => {
          if (e.target !== usernameArea && !usernameArea.contains(e.target)) {
            textArea.focus();
            e.stopPropagation();
          }
        });
        
        const handleMouseMove = (e) => {
          if (dragStartTime === 0) return;
          const moveDistance = Math.abs(e.clientX - dragStartPos.x) + Math.abs(e.clientY - dragStartPos.y);
          if (moveDistance > 5 && !dragging) {
            dragging = true;
            node.style.cursor = 'move';
            node.style.userSelect = 'none';
          }
          if (dragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.x = Math.max(0, Math.min(1280 - (el.width || 200), origX + dx));
            el.y = Math.max(0, Math.min(720 - (el.height || 200), origY + dy));
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
            persistState();
          }
        };
        
        const handleMouseUp = () => {
          if (dragging) {
            dragging = false;
            node.classList.remove('dragging');
            saveState();
          }
          dragStartTime = 0;
          document.body.style.cursor = '';
          node.style.cursor = 'move';
          node.style.userSelect = '';
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        stageEl.appendChild(node);
      } else if (el.type === 'image' && el.src) {
        const node = document.createElement('div');
        node.className = 'el image';
        node.dataset.id = el.id;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || 300) + 'px';
        node.style.height = (el.height || 200) + 'px';
        node.style.position = 'absolute';
        node.style.cursor = el.locked ? 'default' : 'move';
        
        const img = document.createElement('img');
        img.src = el.src;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.draggable = false;
        node.appendChild(img);
        
        // Drag functionality
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        
        function startDrag(e) {
          if (e.button !== 0 || el.locked) return;
          dragging = false;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(elm => elm.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
          e.preventDefault();
        }
        
        node.addEventListener('mousedown', startDrag);
        
        const handleMouseMove = (e) => {
          if (!dragging && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
            dragging = true;
            node.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
          }
          if (dragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.x = Math.max(0, Math.min(1280 - (el.width || 300), origX + dx));
            el.y = Math.max(0, Math.min(720 - (el.height || 200), origY + dy));
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
            persistState();
          }
        };
        
        const handleMouseUp = () => {
          if (dragging) {
            dragging = false;
            saveState();
          }
          node.style.cursor = 'move';
          document.body.style.cursor = '';
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        stageEl.appendChild(node);
      } else if (el.type === 'pdf' && el.src) {
        const node = document.createElement('div');
        node.className = 'el pdf';
        node.dataset.id = el.id;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || 200) + 'px';
        node.style.height = (el.height || 250) + 'px';
        node.style.position = 'absolute';
        node.style.backgroundColor = '#f3f4f6';
        node.style.border = '2px solid #d1d5db';
        node.style.borderRadius = '8px';
        node.style.display = 'flex';
        node.style.flexDirection = 'column';
        node.style.alignItems = 'center';
        node.style.justifyContent = 'center';
        node.style.padding = '16px';
        node.style.cursor = el.locked ? 'default' : 'move';
        node.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        
        // PDF icon
        const pdfIcon = document.createElement('div');
        pdfIcon.innerHTML = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        `;
        pdfIcon.style.marginBottom = '8px';
        
        // PDF filename
        const fileName = document.createElement('div');
        fileName.textContent = el.fileName || 'document.pdf';
        fileName.style.fontSize = '12px';
        fileName.style.color = '#6b7280';
        fileName.style.textAlign = 'center';
        fileName.style.wordBreak = 'break-word';
        fileName.style.maxWidth = '100%';
        
        node.appendChild(pdfIcon);
        node.appendChild(fileName);
        
        // Click to open PDF
        node.addEventListener('dblclick', () => {
          if (el.src) {
            window.open(el.src, '_blank');
          }
        });
        
        // Drag functionality
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        
        function startDrag(e) {
          if (e.button !== 0 || el.locked) return;
          dragging = false;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(elm => elm.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
          e.preventDefault();
        }
        
        node.addEventListener('mousedown', startDrag);
        
        const handleMouseMove = (e) => {
          if (!dragging && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
            dragging = true;
            node.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
          }
          if (dragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.x = Math.max(0, Math.min(1280 - (el.width || 200), origX + dx));
            el.y = Math.max(0, Math.min(720 - (el.height || 250), origY + dy));
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
            persistState();
          }
        };
        
        const handleMouseUp = () => {
          if (dragging) {
            dragging = false;
            saveState();
          }
          node.style.cursor = 'move';
          document.body.style.cursor = '';
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        stageEl.appendChild(node);
      } else if (el.type === 'chart') {
        const node = document.createElement('div');
        node.className = 'el chart';
        node.dataset.id = el.id;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || 400) + 'px';
        node.style.height = (el.height || 300) + 'px';
        node.style.position = 'absolute';
        node.style.backgroundColor = '#ffffff';
        node.style.border = '1px solid #e5e7eb';
        node.style.borderRadius = '8px';
        node.style.padding = '16px';
        node.style.boxSizing = 'border-box';
        node.style.cursor = el.locked ? 'default' : 'move';
        node.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        
        // Create SVG for chart
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${el.width || 400} ${el.height || 300}`);
        svg.style.display = 'block';
        
        const data = el.data || [];
        const colors = el.colors || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#a855f7', '#06b6d4'];
        const chartType = el.chartType || 'bar';
        const width = el.width || 400;
        const height = el.height || 300;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Render chart based on type
        if (chartType === 'bar') {
          const maxValue = Math.max(...data.map(d => d.value), 1);
          const barWidth = chartWidth / data.length * 0.6;
          const spacing = chartWidth / data.length;
          
          data.forEach((item, i) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + i * spacing + spacing * 0.2;
            const y = padding + chartHeight - barHeight;
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', colors[i % colors.length]);
            rect.setAttribute('rx', '2');
            svg.appendChild(rect);
            
            if (el.showLabels) {
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', x + barWidth / 2);
              text.setAttribute('y', padding + chartHeight + 15);
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('font-size', '12');
              text.setAttribute('fill', '#374151');
              text.textContent = item.label;
              svg.appendChild(text);
            }
          });
        } else if (chartType === 'column') {
          const maxValue = Math.max(...data.map(d => d.value), 1);
          const columnWidth = chartWidth / data.length * 0.6;
          const spacing = chartWidth / data.length;
          
          data.forEach((item, i) => {
            const columnHeight = (item.value / maxValue) * chartHeight;
            const x = padding + i * spacing + spacing * 0.2;
            const y = padding + chartHeight - columnHeight;
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', columnWidth);
            rect.setAttribute('height', columnHeight);
            rect.setAttribute('fill', colors[i % colors.length]);
            rect.setAttribute('rx', '2');
            svg.appendChild(rect);
            
            if (el.showLabels) {
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', x + columnWidth / 2);
              text.setAttribute('y', padding + chartHeight + 15);
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('font-size', '12');
              text.setAttribute('fill', '#374151');
              text.textContent = item.label;
              svg.appendChild(text);
            }
          });
        } else if (chartType === 'pie' || chartType === 'doughnut') {
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(chartWidth, chartHeight) / 2 - 10;
          const innerRadius = chartType === 'doughnut' ? radius * 0.5 : 0;
          const total = data.reduce((sum, d) => sum + d.value, 0);
          
          let currentAngle = -Math.PI / 2;
          data.forEach((item, i) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = item.color || colors[i % colors.length];
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const x1 = centerX + Math.cos(currentAngle) * radius;
            const y1 = centerY + Math.sin(currentAngle) * radius;
            const x2 = centerX + Math.cos(currentAngle + sliceAngle) * radius;
            const y2 = centerY + Math.sin(currentAngle + sliceAngle) * radius;
            const x3 = centerX + Math.cos(currentAngle + sliceAngle) * innerRadius;
            const y3 = centerY + Math.sin(currentAngle + sliceAngle) * innerRadius;
            const x4 = centerX + Math.cos(currentAngle) * innerRadius;
            const y4 = centerY + Math.sin(currentAngle) * innerRadius;
            
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
            path.setAttribute('d', d);
            path.setAttribute('fill', color);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '2');
            svg.appendChild(path);
            
            currentAngle += sliceAngle;
          });
          
          if (el.showLegend) {
            data.forEach((item, i) => {
              const color = item.color || colors[i % colors.length];
              const legendY = padding + i * 20;
              
              const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              rect.setAttribute('x', padding);
              rect.setAttribute('y', legendY - 8);
              rect.setAttribute('width', '12');
              rect.setAttribute('height', '12');
              rect.setAttribute('fill', color);
              svg.appendChild(rect);
              
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', padding + 18);
              text.setAttribute('y', legendY);
              text.setAttribute('font-size', '12');
              text.setAttribute('fill', '#374151');
              text.textContent = `${item.label}: ${item.value}`;
              svg.appendChild(text);
            });
          }
        } else if (chartType === 'line' || chartType === 'area') {
          const maxValue = Math.max(...data.map(d => d.value), 1);
          const pointSpacing = chartWidth / (data.length - 1 || 1);
          const points = data.map((item, i) => ({
            x: padding + i * pointSpacing,
            y: padding + chartHeight - (item.value / maxValue) * chartHeight
          }));
          
          if (chartType === 'area') {
            const areaPath = `M ${points[0].x} ${padding + chartHeight} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${padding + chartHeight} Z`;
            const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            area.setAttribute('d', areaPath);
            area.setAttribute('fill', colors[0]);
            area.setAttribute('opacity', '0.3');
            svg.appendChild(area);
          }
          
          const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          line.setAttribute('d', linePath);
          line.setAttribute('fill', 'none');
          line.setAttribute('stroke', colors[0]);
          line.setAttribute('stroke-width', '3');
          line.setAttribute('stroke-linecap', 'round');
          line.setAttribute('stroke-linejoin', 'round');
          svg.appendChild(line);
          
          points.forEach((point, i) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', colors[0]);
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
            
            if (el.showLabels && i % Math.ceil(data.length / 6) === 0) {
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', point.x);
              text.setAttribute('y', padding + chartHeight + 15);
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('font-size', '10');
              text.setAttribute('fill', '#374151');
              text.textContent = data[i].label;
              svg.appendChild(text);
            }
          });
        }
        
        node.appendChild(svg);
        
        // Drag functionality
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        
        function startDrag(e) {
          if (e.button !== 0 || el.locked) return;
          dragging = false;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(elm => elm.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
          e.preventDefault();
        }
        
        node.addEventListener('mousedown', startDrag);
        
        const handleMouseMove = (e) => {
          if (!dragging && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
            dragging = true;
            node.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
          }
          if (dragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.x = Math.max(0, Math.min(1280 - (el.width || 400), origX + dx));
            el.y = Math.max(0, Math.min(720 - (el.height || 300), origY + dy));
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
            persistState();
          }
        };
        
        const handleMouseUp = () => {
          if (dragging) {
            dragging = false;
            saveState();
          }
          node.style.cursor = 'move';
          document.body.style.cursor = '';
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        stageEl.appendChild(node);
      } else if (el.type === 'shape') {
        const node = document.createElement('div');
        node.className = 'el shape';
        node.dataset.id = el.id;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || 100) + 'px';
        node.style.height = (el.height || 100) + 'px';
        node.style.backgroundColor = el.fillColor || '#fff';
        node.style.border = `${el.strokeWidth || 1}px ${el.strokeDash === 'dashed' ? 'dashed' : el.strokeDash === 'dotted' ? 'dotted' : 'solid'} ${el.strokeColor || '#000'}`;
        applyShapeAppearance(node, el.shape);
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'pointer';
        
        node.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
          e.stopPropagation();
        });
        
        stageEl.appendChild(node);
      } else if (el.type === 'table') {
        const rows = Math.max(1, el.rows || 3);
        const cols = Math.max(1, el.cols || 3);
        const node = document.createElement('div');
        node.className = 'el table';
        node.dataset.id = el.id;
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || cols * 90) + 'px';
        node.style.height = (el.height || rows * 56) + 'px';
        node.style.display = 'grid';
        node.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        node.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        node.style.border = `1px solid ${el.borderColor || '#1f2937'}`;
        node.style.background = el.backgroundColor || '#ffffff';
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'pointer';

        for (let r = 0; r < rows * cols; r++) {
          const cell = document.createElement('div');
          cell.className = 'table-cell';
          cell.style.border = `1px solid ${el.borderColor || '#1f2937'}`;
          cell.style.background = el.backgroundColor || '#ffffff';
          node.appendChild(cell);
        }

        node.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          document.querySelectorAll('.el').forEach(elm => elm.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
          e.stopPropagation();
        });

        stageEl.appendChild(node);
      } else if (el.type === 'line') {
        const container = document.createElement('div');
        container.className = 'el line';
        container.dataset.id = el.id;
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.top = '0';
        container.style.pointerEvents = 'none';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1280');
        svg.setAttribute('height', '720');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.pointerEvents = 'all';
        
        let x1 = el.x1 || 200;
        let y1 = el.y1 || 200;
        let x2 = el.x2 || 400;
        let y2 = el.y2 || 200;
        let midX = el.midX;
        let midY = el.midY;
        const strokeColor = el.strokeColor || '#000000';
        const strokeWidth = el.strokeWidth || 2;
        
        const updateLinePath = () => {
          // Remove old path
          const oldPath = svg.querySelector('line, path');
          if (oldPath) svg.removeChild(oldPath);
          
          let path;
          if (el.lineType === 'straight') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            path.setAttribute('x1', x1);
            path.setAttribute('y1', y1);
            path.setAttribute('x2', x2);
            path.setAttribute('y2', y2);
          } else if (el.lineType === 'wavy') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const controlY = midY !== null && midY !== undefined ? midY : ((y1 + y2) / 2 - 30);
            path.setAttribute('d', `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${controlY}, ${(x1 + x2) / 2} ${(y1 + y2) / 2} T ${x2} ${y2}`);
          } else if (el.lineType === 'semicircular') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const controlX = midX !== null && midX !== undefined ? midX : (x1 + x2) / 2;
            const controlY = midY !== null && midY !== undefined ? midY : (y1 - 50);
            path.setAttribute('d', `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`);
          }
          
          path.setAttribute('stroke', strokeColor);
          path.setAttribute('stroke-width', strokeWidth);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-linecap', 'round');
          svg.insertBefore(path, svg.firstChild);
          
          // Update element data
          el.x1 = x1;
          el.y1 = y1;
          el.x2 = x2;
          el.y2 = y2;
          if (midX !== null && midX !== undefined) el.midX = midX;
          if (midY !== null && midY !== undefined) el.midY = midY;
        };
        
        updateLinePath();
        
        // Add control points with drag functionality
        // Note: updateSelectionBox will be defined later, we'll reference it via closure
        let updateSelectionBoxRef = null;
        
        const addControlPoint = (x, y, pointType) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', '6');
          circle.setAttribute('fill', 'white');
          circle.setAttribute('stroke', strokeColor);
          circle.setAttribute('stroke-width', '2.5');
          circle.classList.add('line-control-point');
          circle.dataset.pointType = pointType;
          circle.style.cursor = 'grab';
          circle.style.pointerEvents = 'all';
          
          let isDragging = false;
          
          const handleMouseDown = (e) => {
            if (e.button !== 0 || el.locked) return;
            e.stopPropagation();
            isDragging = true;
            const stageRect = stageEl.getBoundingClientRect();
            const origX = parseFloat(circle.getAttribute('cx'));
            const origY = parseFloat(circle.getAttribute('cy'));
            const startMouseX = e.clientX - stageRect.left;
            const startMouseY = e.clientY - stageRect.top;
            circle.style.cursor = 'grabbing';
            
            const handleMouseMove = (e) => {
              if (!isDragging) return;
              const currentMouseX = e.clientX - stageRect.left;
              const currentMouseY = e.clientY - stageRect.top;
              const dx = currentMouseX - startMouseX;
              const dy = currentMouseY - startMouseY;
              const newX = Math.max(0, Math.min(1280, origX + dx));
              const newY = Math.max(0, Math.min(720, origY + dy));
              
              circle.setAttribute('cx', newX);
              circle.setAttribute('cy', newY);
              
              if (pointType === 'start') {
                x1 = newX;
                y1 = newY;
              } else if (pointType === 'end') {
                x2 = newX;
                y2 = newY;
              } else if (pointType === 'mid') {
                midX = newX;
                midY = newY;
              }
              
              updateLinePath();
              
              // Update selection box if line is selected
              if (updateSelectionBoxRef && container.classList.contains('selected')) {
                updateSelectionBoxRef();
              }
            };
            
            const handleMouseUp = () => {
              if (isDragging) {
                isDragging = false;
                circle.style.cursor = 'grab';
                saveState();
                renderSidebar();
              }
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };
            
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          };
          
          circle.addEventListener('mousedown', handleMouseDown);
          svg.appendChild(circle);
        };
        
        addControlPoint(x1, y1, 'start');
        addControlPoint(x2, y2, 'end');
        if (midX !== null && midX !== undefined && midY !== null && midY !== undefined) {
          addControlPoint(midX, midY, 'mid');
        }
        
        container.appendChild(svg);
        container.style.cursor = 'pointer';
        container.classList.toggle('locked', !!el.locked);
        
        // Create selection box overlay
        const selectionBox = document.createElement('div');
        selectionBox.className = 'line-selection-box';
        selectionBox.style.position = 'absolute';
        selectionBox.style.pointerEvents = 'none';
        selectionBox.style.display = 'none';
        selectionBox.style.border = '1px solid rgba(0, 170, 231, 0.3)';
        selectionBox.style.borderRadius = '4px';
        selectionBox.style.backgroundColor = 'rgba(0, 170, 231, 0.02)';
        selectionBox.style.boxSizing = 'border-box';
        
        // Create center move handle
        const centerHandle = document.createElement('div');
        centerHandle.className = 'line-center-handle';
        centerHandle.style.position = 'absolute';
        centerHandle.style.width = '12px';
        centerHandle.style.height = '12px';
        centerHandle.style.borderRadius = '50%';
        centerHandle.style.backgroundColor = 'rgba(0, 170, 231, 0.8)';
        centerHandle.style.border = '2px solid white';
        centerHandle.style.cursor = 'grab';
        centerHandle.style.boxShadow = '0 2px 4px rgba(0, 43, 73, 0.2)';
        centerHandle.style.transform = 'translate(-50%, -50%)';
        centerHandle.style.pointerEvents = 'all';
        selectionBox.appendChild(centerHandle);
        container.appendChild(selectionBox);
        
        // Function to update selection box position and size
        const updateSelectionBox = () => {
          if (!container.classList.contains('selected')) {
            selectionBox.style.display = 'none';
            return;
          }
          
          // Calculate bounding box from all control points
          const points = [
            { x: x1, y: y1 },
            { x: x2, y: y2 }
          ];
          if (midX !== null && midX !== undefined && midY !== null && midY !== undefined) {
            points.push({ x: midX, y: midY });
          }
          
          const minX = Math.min(...points.map(p => p.x));
          const maxX = Math.max(...points.map(p => p.x));
          const minY = Math.min(...points.map(p => p.y));
          const maxY = Math.max(...points.map(p => p.y));
          
          // Add padding around the line
          const padding = 10;
          const boxX = Math.max(0, minX - padding);
          const boxY = Math.max(0, minY - padding);
          const boxWidth = Math.min(1280 - boxX, maxX - minX + padding * 2);
          const boxHeight = Math.min(720 - boxY, maxY - minY + padding * 2);
          
          selectionBox.style.left = boxX + 'px';
          selectionBox.style.top = boxY + 'px';
          selectionBox.style.width = boxWidth + 'px';
          selectionBox.style.height = boxHeight + 'px';
          selectionBox.style.display = 'block';
          
          // Position center handle
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          centerHandle.style.left = (centerX - boxX) + 'px';
          centerHandle.style.top = (centerY - boxY) + 'px';
        };
        
        // Center handle drag functionality
        let isDraggingLine = false;
        centerHandle.addEventListener('mousedown', (e) => {
          if (e.button !== 0 || el.locked) return;
          e.stopPropagation();
          isDraggingLine = true;
          const stageRect = stageEl.getBoundingClientRect();
          const startMouseX = e.clientX - stageRect.left;
          const startMouseY = e.clientY - stageRect.top;
          
          // Store original positions
          const origX1 = x1;
          const origY1 = y1;
          const origX2 = x2;
          const origY2 = y2;
          const origMidX = midX;
          const origMidY = midY;
          
          centerHandle.style.cursor = 'grabbing';
          
          const handleMouseMove = (e) => {
            if (!isDraggingLine) return;
            const currentMouseX = e.clientX - stageRect.left;
            const currentMouseY = e.clientY - stageRect.top;
            const dx = currentMouseX - startMouseX;
            const dy = currentMouseY - startMouseY;
            
            // Calculate new positions
            const newX1 = Math.max(0, Math.min(1280, origX1 + dx));
            const newY1 = Math.max(0, Math.min(720, origY1 + dy));
            const newX2 = Math.max(0, Math.min(1280, origX2 + dx));
            const newY2 = Math.max(0, Math.min(720, origY2 + dy));
            
            x1 = newX1;
            y1 = newY1;
            x2 = newX2;
            y2 = newY2;
            
            if (midX !== null && midX !== undefined && midY !== null && midY !== undefined) {
              const newMidX = Math.max(0, Math.min(1280, origMidX + dx));
              const newMidY = Math.max(0, Math.min(720, origMidY + dy));
              midX = newMidX;
              midY = newMidY;
            }
            
            // Update line path
            updateLinePath();
            
            // Update control points
            const controlPoints = svg.querySelectorAll('.line-control-point');
            controlPoints.forEach(circle => {
              const pointType = circle.dataset.pointType;
              let currentX, currentY;
              if (pointType === 'start') {
                currentX = x1;
                currentY = y1;
              } else if (pointType === 'end') {
                currentX = x2;
                currentY = y2;
              } else if (pointType === 'mid') {
                currentX = midX;
                currentY = midY;
              }
              circle.setAttribute('cx', currentX);
              circle.setAttribute('cy', currentY);
            });
            
            // Update selection box
            updateSelectionBox();
          };
          
          const handleMouseUp = () => {
            if (isDraggingLine) {
              isDraggingLine = false;
              centerHandle.style.cursor = 'grab';
              saveState();
              renderSidebar();
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
          };
          
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
        });
        
        container.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          if (e.target.classList.contains('line-control-point')) {
            return; // Let control point handle it
          }
          if (e.target.classList.contains('line-center-handle')) {
            return; // Let center handle handle it
          }
          document.querySelectorAll('.el').forEach(elm => elm.classList.remove('selected'));
          container.classList.add('selected');
          updateSelectionBox();
          updateToolbarFromSelection();
          showContextToolbar(container);
          hideTextControlBar();
          e.stopPropagation();
        });
        
        // Store reference to updateSelectionBox for use in addControlPoint
        updateSelectionBoxRef = updateSelectionBox;
        
        // Update selection box when line path changes
        const originalUpdateLinePath = updateLinePath;
        updateLinePath = () => {
          originalUpdateLinePath();
          if (container.classList.contains('selected')) {
            updateSelectionBox();
          }
        };
        
        stageEl.appendChild(container);
      } else if (el.type === 'drawing') {
        // Render drawing element
        const container = document.createElement('div');
        container.className = 'el drawing';
        container.dataset.id = el.id;
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.top = '0';
        container.style.pointerEvents = 'all';
        container.style.cursor = 'pointer';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1280');
        svg.setAttribute('height', '720');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.pointerEvents = 'all';
        
        // Render all paths in the drawing
        if (el.paths && Array.isArray(el.paths)) {
          el.paths.forEach(pathData => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', el.strokeColor || '#000000');
            path.setAttribute('stroke-width', el.strokeWidth || 3);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
          });
        }
        
        container.appendChild(svg);
        container.classList.toggle('locked', !!el.locked);
        
        // Make drawing selectable
        container.addEventListener('mousedown', (e) => {
          if (e.button !== 0 || el.locked) return;
          if (isDrawingMode) {
            // Exit drawing mode when clicking on an element
            cancelDrawing();
            deactivateDrawingMode();
            return;
          }
          document.querySelectorAll('.el').forEach(elm => elm.classList.remove('selected'));
          container.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(container);
          hideTextControlBar();
          e.stopPropagation();
        });
        
        stageEl.appendChild(container);
      }
    });
  }

  function updateToolbarFromSelection() {
    const selected = getSelectedElement();
    if (!selected) return;
    const slide = state.slides[state.currentSlideIndex];
    const elId = selected.dataset.id;
    const el = slide.elements.find(e => e.id === elId);
    if (!el) return;

    if (el.type === 'text') {
      const fontFamily = document.getElementById('font-family');
      const fontSize = document.getElementById('font-size');
      const fontColor = document.getElementById('font-color');
      if (fontFamily) fontFamily.value = el.fontFamily || 'Inter, system-ui, sans-serif';
      if (fontSize) fontSize.value = String(el.fontSize || 18);
      if (fontColor) fontColor.value = el.color || '#111111';
    }

    const fillColor = document.getElementById('fill-color');
    const strokeColor = document.getElementById('stroke-color');
    const strokeWidth = document.getElementById('stroke-width');
    const strokeDash = document.getElementById('stroke-dash');
    
    if (el.type === 'line') {
      // Lines only have stroke properties, no fill
      if (fillColor) fillColor.value = '#ffffff'; // Default, not used for lines
      if (strokeColor) strokeColor.value = el.strokeColor || '#000000';
      if (strokeWidth) strokeWidth.value = String(el.strokeWidth || 2);
      if (strokeDash) strokeDash.value = el.strokeDash || 'solid';
    } else {
      if (fillColor) fillColor.value = el.fillColor || '#ffffff';
      if (strokeColor) strokeColor.value = el.strokeColor || '#000000';
      if (strokeWidth) strokeWidth.value = String(el.strokeWidth || 1);
      if (strokeDash) strokeDash.value = el.strokeDash || 'solid';
    }
  }

  function renderAll() {
    // Update page numbers on all slides before rendering
    state.slides.forEach((slide, idx) => {
      slide.elements.forEach(el => {
        if (el.isPageNumber) {
          const pageText = String(idx + 1);
          el.text = pageText;
          el.content = pageText;
        }
      });
    });
    if (deckTitleEl) {
      deckTitleEl.textContent = state.title;
    }
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

  function copySlide() {
    const src = state.slides[state.currentSlideIndex];
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid();
    // Store in clipboard (could use localStorage or a global variable)
    if (typeof window !== 'undefined') {
      window.slideClipboard = copy;
    }
    // Show feedback
    setStatus('Slide copied to clipboard');
  }

  function pasteSlide() {
    if (typeof window !== 'undefined' && window.slideClipboard) {
      const copy = JSON.parse(JSON.stringify(window.slideClipboard));
      copy.id = uid();
      state.slides.splice(state.currentSlideIndex + 1, 0, copy);
      state.currentSlideIndex += 1;
      saveState();
      renderAll();
      setStatus('Slide pasted');
    }
  }

  // Slide zoom state
  let slideZoomLevel = 1.0;
  const minZoom = 0.25;
  const maxZoom = 2.0;
  const zoomStep = 0.1;

  function updateSlideZoom(level) {
    slideZoomLevel = Math.max(minZoom, Math.min(maxZoom, level));
    const stageContainer = document.querySelector('.stage-container');
    if (stageContainer) {
      stageContainer.style.transform = `scale(${slideZoomLevel})`;
      stageContainer.style.transformOrigin = 'center center';
    }
    const zoomValueDisplay = document.getElementById('slide-zoom-value');
    if (zoomValueDisplay) {
      zoomValueDisplay.textContent = `${Math.round(slideZoomLevel * 100)}%`;
    }
  }

  function zoomSlideIn() {
    updateSlideZoom(slideZoomLevel + zoomStep);
  }

  function zoomSlideOut() {
    updateSlideZoom(slideZoomLevel - zoomStep);
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
    saveState();
    renderAll();
  }

  function insertShape(shapeType) {
    const slide = state.slides[state.currentSlideIndex];
    slide.elements.push({
      id: uid(),
      type: 'shape',
      shape: shapeType,
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      fillColor: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 1,
      strokeDash: 'solid'
    });
    saveState();
    renderAll();
  }

  function getUsername() {
    if (typeof AccountStorage !== 'undefined' && AccountStorage) {
      const account = AccountStorage.getCurrentAccount();
      if (account && account.profile) {
        return account.profile.displayName || account.profile.formattedName?.replace(/-/g, ' ') || 'User';
      }
    }
    return 'User';
  }

  function insertStickyNote(color = '#fef08a') {
    const slide = state.slides[state.currentSlideIndex];
    const username = getUsername();
    const newSticky = {
      id: uid(),
      type: 'sticky',
      x: 200,
      y: 200,
      width: 200,
      height: 200,
      color: color,
      text: 'Add Text',
      username: username,
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
    };
    slide.elements.push(newSticky);
    saveState();
    renderAll();
    
    // Select and focus the newly created sticky note
    setTimeout(() => {
      const stickyElement = stageEl.querySelector(`.el.sticky[data-id="${newSticky.id}"]`);
      if (stickyElement) {
        // Select the sticky note
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        stickyElement.classList.add('selected');
        updateToolbarFromSelection();
        showContextToolbar(stickyElement);
        
        // Focus the text area for immediate editing
        const textArea = stickyElement.querySelector('.sticky-text');
        if (textArea) {
          textArea.focus();
          // Select all text so user can start typing immediately
          if (textArea.innerText === 'Add Text') {
            const range = document.createRange();
            range.selectNodeContents(textArea);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }, 50);
    
    hideStickyNotesPanel();
  }

  function insertImage(src, fileName, fileType) {
    const slide = state.slides[state.currentSlideIndex];
    const newImage = {
      id: uid(),
      type: 'image',
      x: 200,
      y: 200,
      width: 300,
      height: 200,
      src: src,
      fileName: fileName || 'image',
      fileType: fileType || 'image'
    };
    slide.elements.push(newImage);
    saveState();
    renderAll();
    
    // Select the newly created image
    setTimeout(() => {
      const imageElement = stageEl.querySelector(`.el.image[data-id="${newImage.id}"]`);
      if (imageElement) {
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        imageElement.classList.add('selected');
        updateToolbarFromSelection();
        showContextToolbar(imageElement);
      }
    }, 50);
  }

  function insertPDF(src, fileName) {
    const slide = state.slides[state.currentSlideIndex];
    const newPDF = {
      id: uid(),
      type: 'pdf',
      x: 200,
      y: 200,
      width: 200,
      height: 250,
      src: src,
      fileName: fileName || 'document.pdf'
    };
    slide.elements.push(newPDF);
    saveState();
    renderAll();
    
    // Select the newly created PDF
    setTimeout(() => {
      const pdfElement = stageEl.querySelector(`.el.pdf[data-id="${newPDF.id}"]`);
      if (pdfElement) {
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        pdfElement.classList.add('selected');
        updateToolbarFromSelection();
        showContextToolbar(pdfElement);
      }
    }, 50);
  }

  function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const fileType = file.type;
      const fileName = file.name;
      
      // Check if it's an image
      if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          insertImage(e.target.result, fileName, 'image');
        };
        reader.onerror = () => {
          alert('Error reading image file. Please try again.');
        };
        reader.readAsDataURL(file);
      }
      // Check if it's a PDF
      else if (fileType === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          insertPDF(e.target.result, fileName);
        };
        reader.onerror = () => {
          alert('Error reading PDF file. Please try again.');
        };
        reader.readAsDataURL(file);
      }
      else {
        alert(`File type "${fileType}" is not supported. Please upload an image or PDF.`);
      }
    });
  }

  function openFileUpload() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
      handleFileUpload(e.target.files);
      // Remove the input after use
      document.body.removeChild(fileInput);
    });
    
    // Add to body and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  function showChartEditor(chartType) {
    const chartTypeSelection = document.getElementById('chart-type-selection');
    const chartEditorPanel = document.getElementById('chart-editor-panel');
    const chartsPanelTitle = document.getElementById('charts-panel-title');
    
    if (!chartTypeSelection || !chartEditorPanel) return;
    
    // Hide type selection, show editor
    chartTypeSelection.classList.add('hidden');
    chartEditorPanel.classList.remove('hidden');
    
    // Update title
    if (chartsPanelTitle) {
      const chartNames = {
        'bar': 'Bar Chart',
        'pie': 'Pie Chart',
        'line': 'Line Chart',
        'area': 'Area Chart',
        'doughnut': 'Doughnut Chart',
        'column': 'Column Chart'
      };
      chartsPanelTitle.textContent = `Edit ${chartNames[chartType] || 'Chart'}`;
    }
    
    // Initialize editor with default values
    initializeChartEditor(chartType);
  }

  function initializeChartEditor(chartType) {
    const chartWidth = document.getElementById('chart-width');
    const chartHeight = document.getElementById('chart-height');
    const chartDataCount = document.getElementById('chart-data-count');
    const chartDataValues = document.getElementById('chart-data-values');
    const chartColors = document.getElementById('chart-colors');
    
    // Set default dimensions
    if (chartWidth) chartWidth.value = 400;
    if (chartHeight) chartHeight.value = 300;
    
    // Set default data count
    let defaultCount = 4;
    if (chartType === 'line' || chartType === 'area') {
      defaultCount = 6;
    }
    if (chartDataCount) {
      chartDataCount.value = defaultCount;
      // Remove existing listeners by cloning
      const newInput = chartDataCount.cloneNode(true);
      chartDataCount.parentNode.replaceChild(newInput, chartDataCount);
      newInput.addEventListener('input', () => {
        const count = parseInt(newInput.value) || defaultCount;
        updateChartDataInputs(chartType, count);
        updateChartColorInputs(count);
      });
    }
    
    // Initialize data inputs
    updateChartDataInputs(chartType, defaultCount);
    
    // Initialize color inputs
    updateChartColorInputs(defaultCount);
  }

  function updateChartDataInputs(chartType, count) {
    const chartDataValues = document.getElementById('chart-data-values');
    if (!chartDataValues) return;
    
    chartDataValues.innerHTML = '';
    
    const defaultLabels = chartType === 'line' || chartType === 'area' 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
      : ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];
    
    const defaultValues = [30, 45, 25, 50, 35, 40, 28, 42, 38, 33];
    
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'chart-data-item';
      item.innerHTML = `
        <input type="text" class="chart-data-label" data-index="${i}" value="${defaultLabels[i] || `Item ${i + 1}`}" placeholder="Label" />
        <input type="number" class="chart-data-value" data-index="${i}" value="${defaultValues[i] || 30}" min="0" max="100" placeholder="Value" />
      `;
      chartDataValues.appendChild(item);
    }
  }

  function updateChartColorInputs(count) {
    const chartColors = document.getElementById('chart-colors');
    if (!chartColors) return;
    
    chartColors.innerHTML = '';
    
    const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];
    
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'chart-color-item';
      const color = defaultColors[i % defaultColors.length];
      item.innerHTML = `
        <input type="color" class="chart-color-picker" data-index="${i}" value="${color}" />
        <input type="text" class="chart-color-hex" data-index="${i}" value="${color}" placeholder="#000000" />
      `;
      chartColors.appendChild(item);
      
      // Sync color picker and hex input
      const colorPicker = item.querySelector('.chart-color-picker');
      const colorHex = item.querySelector('.chart-color-hex');
      colorPicker.addEventListener('input', (e) => {
        colorHex.value = e.target.value;
      });
      colorHex.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          colorPicker.value = e.target.value;
        }
      });
    }
  }

  function insertChart(chartType = 'bar', options = {}) {
    const slide = state.slides[state.currentSlideIndex];
    
    // Get values from editor
    const chartWidth = document.getElementById('chart-width');
    const chartHeight = document.getElementById('chart-height');
    const chartDataCount = document.getElementById('chart-data-count');
    
    const width = options.width || (chartWidth ? parseInt(chartWidth.value) : 400);
    const height = options.height || (chartHeight ? parseInt(chartHeight.value) : 300);
    const dataCount = options.dataCount || (chartDataCount ? parseInt(chartDataCount.value) : 4);
    
    // Collect data values
    const data = [];
    const dataLabels = document.querySelectorAll('.chart-data-label');
    const dataValues = document.querySelectorAll('.chart-data-value');
    const colorPickers = document.querySelectorAll('.chart-color-picker');
    
    for (let i = 0; i < dataCount; i++) {
      const label = dataLabels[i] ? dataLabels[i].value : `Item ${i + 1}`;
      const value = dataValues[i] ? parseInt(dataValues[i].value) || 0 : 30;
      const color = colorPickers[i] ? colorPickers[i].value : '#3b82f6';
      
      if (chartType === 'pie' || chartType === 'doughnut') {
        data.push({ label, value, color });
      } else {
        data.push({ label, value });
      }
    }
    
    // Collect colors
    const colors = [];
    colorPickers.forEach(picker => {
      colors.push(picker.value);
    });
    
    const newChart = {
      id: uid(),
      type: 'chart',
      chartType: chartType,
      x: 200,
      y: 150,
      width: width,
      height: height,
      data: data,
      colors: colors.length > 0 ? colors : ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#a855f7', '#06b6d4'],
      showLegend: true,
      showLabels: true
    };
    
    slide.elements.push(newChart);
    saveState();
    renderAll();
    
    // Select the newly created chart
    setTimeout(() => {
      const chartElement = stageEl.querySelector(`.el.chart[data-id="${newChart.id}"]`);
      if (chartElement) {
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        chartElement.classList.add('selected');
        updateToolbarFromSelection();
        showContextToolbar(chartElement);
      }
    }, 50);
    
    // Reset editor and close panel
    const chartTypeSelection = document.getElementById('chart-type-selection');
    const chartEditorPanel = document.getElementById('chart-editor-panel');
    const chartsPanelTitle = document.getElementById('charts-panel-title');
    
    if (chartTypeSelection) chartTypeSelection.classList.remove('hidden');
    if (chartEditorPanel) chartEditorPanel.classList.add('hidden');
    if (chartsPanelTitle) chartsPanelTitle.textContent = 'Choose Chart Type';
    selectedChartType = null;
    
    hideChartsPanel();
  }

  function insertTable(rows = 3, cols = 3) {
    const slide = state.slides[state.currentSlideIndex];
    const cellWidth = 90;
    const cellHeight = 56;
    slide.elements.push({
      id: uid(),
      type: 'table',
      rows,
      cols,
      x: 200,
      y: 200,
      width: cols * cellWidth,
      height: rows * cellHeight,
      cellWidth,
      cellHeight,
      borderColor: '#1f2937',
      backgroundColor: '#ffffff'
    });
    saveState();
    renderAll();
  }

  function insertLine(lineType) {
    console.log('insertLine called with type:', lineType);
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) {
      console.error('No slide found');
      return;
    }
    
    const baseX = 200;
    const baseY = 200;
    const length = 200;
    
    let x1 = baseX;
    let y1 = baseY;
    let x2 = baseX + length;
    let y2 = baseY;
    let midX = baseX + length / 2;
    let midY = baseY;
    
    if (lineType === 'straight') {
      // Diagonal straight line
      y2 = baseY - 100;
    } else if (lineType === 'wavy') {
      // Wavy line (S-curve)
      y1 = baseY - 20;
      y2 = baseY - 20;
      midY = baseY - 50;
    } else if (lineType === 'semicircular') {
      // Semi-circular line
      y1 = baseY + 50;
      y2 = baseY + 50;
      midY = baseY - 50;
    }
    
    const newLine = {
      id: uid(),
      type: 'line',
      lineType: lineType,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      midX: lineType === 'semicircular' ? midX : null,
      midY: lineType === 'semicircular' ? midY : null,
      strokeColor: '#000000',
      strokeWidth: 2
    };
    
    console.log('Adding line to slide:', newLine);
    slide.elements.push(newLine);
    saveState();
    renderAll();
    console.log('Line added, total elements:', slide.elements.length);
    
    // Select the newly created line so it's visible
    reselectElement(newLine.id);
  }

  function applyShapeAppearance(node, shape) {
    if (!node) return;
    node.style.borderRadius = '12px';
    node.style.clipPath = '';
    switch (shape) {
      case 'circle':
        node.style.borderRadius = '50%';
        break;
      case 'triangle':
        node.style.borderRadius = '0';
        node.style.clipPath = 'polygon(50% 0, 0 100%, 100% 100%)';
        break;
      case 'diamond':
        node.style.borderRadius = '0';
        node.style.clipPath = 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)';
        break;
      default:
        break;
    }
  }

  // Expose to window for toolbar access
  window.insertShape = insertShape;

  // Context menu functions
  window.addSlideAfter = function(idx) {
    const newSlide = defaultSlide();
    state.slides.splice(idx + 1, 0, newSlide);
    state.currentSlideIndex = idx + 1;
    saveState();
    renderAll();
  };

  window.duplicateSlideAt = function(idx) {
    const src = state.slides[idx];
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid();
    state.slides.splice(idx + 1, 0, copy);
    state.currentSlideIndex = idx + 1;
    saveState();
    renderAll();
  };

  window.deleteSlideAt = function(idx) {
    if (state.slides.length <= 1) return;
    state.slides.splice(idx, 1);
    if (state.currentSlideIndex >= idx) {
      state.currentSlideIndex = Math.max(0, state.currentSlideIndex - 1);
    }
    saveState();
    renderAll();
  };

  // Events wiring
  btnAddSlide?.addEventListener('click', () => { addSlide(); saveState(); });
  btnDelSlide?.addEventListener('click', () => { deleteSlide(); saveState(); });
  btnDupSlide?.addEventListener('click', () => { dupSlide(); saveState(); });
  btnInsertText?.addEventListener('click', insertText);

  // Undo/Redo
  document.getElementById('btn-undo')?.addEventListener('click', undo);
  document.getElementById('btn-redo')?.addEventListener('click', redo);

  // Toolbar controls
  ['font-family', 'font-size', 'font-color', 'fill-color', 'stroke-color', 'stroke-width', 'stroke-dash'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        updateSelectedElement();
        renderSidebar();
      });
    }
  });

  deckTitleEl?.addEventListener('input', () => {
    state.title = deckTitleEl.textContent || 'Untitled presentation';
  });

  sidebarEl?.addEventListener('click', (e) => {
    const item = e.target.closest('.slide-thumb');
    if (!item) return;
    const idx = Number(item.dataset.index || 0);
    if (!Number.isNaN(idx)) {
      state.currentSlideIndex = idx;
      renderAll();
    }
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    // Exit drawing mode with Escape
    if (e.key === 'Escape' && isDrawingMode) {
      e.preventDefault();
      cancelDrawing();
      deactivateDrawingMode();
      return;
    }
    
    // Undo/Redo
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      redo();
      return;
    }
    
    // Other shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      addSlide();
      saveState();
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      const selected = getSelectedElement();
      if (selected) {
        const slide = state.slides[state.currentSlideIndex];
        const elId = selected.dataset.id;
        const index = slide.elements.findIndex(e => e.id === elId);
        if (index >= 0) {
          slide.elements.splice(index, 1);
          saveState();
          renderAll();
        }
      } else {
        deleteSlide();
      }
    }
    if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      insertText();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      document.execCommand('bold', false, null);
      saveState();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      document.execCommand('italic', false, null);
      saveState();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      document.execCommand('underline', false, null);
      saveState();
    }
  });

  // Function to add heading
  function addHeading() {
    const slide = state.slides[state.currentSlideIndex];
    const newElement = {
      id: uid(),
      type: 'text',
      x: 100,
      y: 100,
      text: 'Heading',
      fontSize: 48,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'left',
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    showTextControlBarForElement(newElement);
    // Focus the newly created element
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        enterTextEditing(node, newElement);
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  }

  // Function to add subheading
  function addSubheading() {
    const slide = state.slides[state.currentSlideIndex];
    const newElement = {
      id: uid(),
      type: 'text',
      x: 100,
      y: 180,
      text: 'Subheading',
      fontSize: 32,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '600',
      fontStyle: 'normal',
      textAlign: 'left',
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    showTextControlBarForElement(newElement);
    // Focus the newly created element
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        enterTextEditing(node, newElement);
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  }

  // Function to add body text
  function addBodyText() {
    const slide = state.slides[state.currentSlideIndex];
    const newElement = {
      id: uid(),
      type: 'text',
      x: 100,
      y: 260,
      text: 'Body text',
      fontSize: 18,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      underline: false,
      lineHeight: 1.4,
      listType: null,
      rotation: 0,
      scale: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    showTextControlBarForElement(newElement);
    // Focus the newly created element
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        enterTextEditing(node, newElement);
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  }

  // Function to add page number
  function addPageNumber(position) {
    // Remove existing page numbers first
    state.slides.forEach(slide => {
      slide.elements = slide.elements.filter(el => !el.isPageNumber);
    });
    
    // Calculate position based on selection
    let x = 100, y = 100;
    const stageWidth = 1280;
    const stageHeight = 720;
    const padding = 40;

    switch(position) {
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'top-center':
        x = stageWidth / 2 - 30;
        y = padding;
        break;
      case 'top-right':
        x = stageWidth - padding - 60;
        y = padding;
        break;
      case 'bottom-left':
        x = padding;
        y = stageHeight - padding - 30;
        break;
      case 'bottom-center':
        x = stageWidth / 2 - 30;
        y = stageHeight - padding - 30;
        break;
      case 'bottom-right':
        x = stageWidth - padding - 60;
        y = stageHeight - padding - 30;
        break;
    }

    // Add page number to all slides
    state.slides.forEach((slide, idx) => {
      slide.elements.push({
        id: uid(),
        type: 'text',
        x: x,
        y: y,
        text: String(idx + 1),
      content: String(idx + 1),
        fontSize: 16,
        color: '#666',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 'normal',
        isPageNumber: true,
        pageNumberPosition: position
      });
    });
    saveState();
    renderAll();
  }

  // Text sidebar panel functionality
  const textSidebarItem = document.querySelector('.sidebar-item[title="Text"]');
  const textOptionsPanel = document.getElementById('text-options-panel');
  const textOptionButtons = textOptionsPanel ? textOptionsPanel.querySelectorAll('.text-option-btn') : [];
  const positionButtons = textOptionsPanel ? textOptionsPanel.querySelectorAll('.position-btn') : [];
  const textOptionsView = textOptionsPanel ? textOptionsPanel.querySelector('.panel-view-options') : null;
  const pageNumberView = textOptionsPanel ? textOptionsPanel.querySelector('.panel-view-page-number') : null;
  const pageNumberBackBtn = document.getElementById('page-number-back');
  const textControlBar = document.getElementById('text-control-bar');
  const textFontFamily = document.getElementById('text-font-family');
  const textFontSize = document.getElementById('text-font-size');
  const textFontColor = document.getElementById('text-font-color');
  const textColorSwatch = textControlBar?.querySelector('.color-swatch');
  const textBoldBtn = document.getElementById('text-bold');
  const textItalicBtn = document.getElementById('text-italic');
  const textUnderlineBtn = document.getElementById('text-underline');
  const textAlignButtons = textControlBar ? textControlBar.querySelectorAll('.align-btn') : [];
  const textBulletBtn = document.getElementById('text-bullet');
  const textNumberedBtn = document.getElementById('text-numbered');
  const textLineSpacingBtn = document.getElementById('text-line-spacing');
  const textMoreBtn = document.getElementById('text-more');
  const toolsSidebarItem = document.querySelector('.sidebar-item[title="Tools"]');
  const toolsPanel = document.getElementById('tools-panel');
  const toolOptionButtons = toolsPanel ? toolsPanel.querySelectorAll('.text-option-btn[data-tool]') : [];
  const toolsMainView = toolsPanel ? toolsPanel.querySelector('.tools-view-main') : null;
  const toolsShapesView = toolsPanel ? toolsPanel.querySelector('.tools-view-shapes') : null;
  const toolsLinesView = toolsPanel ? toolsPanel.querySelector('.tools-view-lines') : null;
  const toolsTablesView = toolsPanel ? toolsPanel.querySelector('.tools-view-tables') : null;
  const toolsDrawView = toolsPanel ? toolsPanel.querySelector('.tools-view-draw') : null;
  const toolsShapesBackBtn = document.getElementById('tools-shapes-back');
  const toolsLinesBackBtn = document.getElementById('tools-lines-back');
  const toolsTablesBackBtn = document.getElementById('tools-tables-back');
  const toolsDrawBackBtn = document.getElementById('tools-draw-back');
  const drawOptionButtons = toolsPanel ? toolsPanel.querySelectorAll('.draw-option-btn') : [];
  const shapeOptionButtons = toolsPanel ? toolsPanel.querySelectorAll('.shape-option-btn') : [];
  const lineOptionButtons = toolsPanel ? toolsPanel.querySelectorAll('.line-option-btn') : [];
  const tableOptionButtons = toolsPanel ? toolsPanel.querySelectorAll('.table-option-btn') : [];
  let editingElementId = null;
  let editingNode = null;

  const dragIndicator = document.createElement('div');
  dragIndicator.className = 'drag-indicator hidden';
  stageWrap?.appendChild(dragIndicator);

  // Text search disabled – placeholder functions for compatibility
  const searchState = { active: false };
  function lockInteractivity() {}

  function showToolsMainView() {
    if (!toolsPanel) return;
    toolsPanel.classList.remove('shapes-active');
    toolsPanel.classList.remove('lines-active');
    toolsPanel.classList.remove('tables-active');
    toolsPanel.classList.remove('draw-active');
    if (!toolsPanel.classList.contains('hidden')) {
      requestAnimationFrame(() => positionToolsPanel());
    }
  }

  function showShapesView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('shapes-active');
    toolsPanel.classList.remove('lines-active');
    toolsPanel.classList.remove('tables-active');
    toolsPanel.classList.remove('draw-active');
    requestAnimationFrame(() => positionToolsPanel());
  }

  function showLinesView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('lines-active');
    toolsPanel.classList.remove('shapes-active');
    toolsPanel.classList.remove('tables-active');
    toolsPanel.classList.remove('draw-active');
    requestAnimationFrame(() => positionToolsPanel());
  }

  function showTablesView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('tables-active');
    toolsPanel.classList.remove('shapes-active');
    toolsPanel.classList.remove('lines-active');
    toolsPanel.classList.remove('draw-active');
    requestAnimationFrame(() => positionToolsPanel());
  }

  function showDrawView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('draw-active');
    toolsPanel.classList.remove('shapes-active');
    toolsPanel.classList.remove('lines-active');
    toolsPanel.classList.remove('tables-active');
    requestAnimationFrame(() => positionToolsPanel());
  }

  function positionStickyNotesPanel() {
    const stickyNotesPanel = document.getElementById('sticky-notes-panel');
    const toolsSidebarItem = document.querySelector('.sidebar-item[title="Tools"]');
    
    if (!stickyNotesPanel || !toolsSidebarItem) return;
    
    const sidebarRect = toolsSidebarItem.getBoundingClientRect();
    stickyNotesPanel.style.top = `${sidebarRect.top}px`;
    stickyNotesPanel.style.left = `${sidebarRect.right + 12}px`;
  }

  function showStickyNotesView() {
    const stickyNotesPanel = document.getElementById('sticky-notes-panel');
    if (stickyNotesPanel) {
      stickyNotesPanel.classList.remove('hidden');
      positionStickyNotesPanel();
    }
  }

  function hideStickyNotesPanel() {
    const stickyNotesPanel = document.getElementById('sticky-notes-panel');
    if (stickyNotesPanel) {
      stickyNotesPanel.classList.add('hidden');
    }
  }

  function positionChartsPanel() {
    const chartsPanel = document.getElementById('charts-panel');
    const chartsSidebarItem = document.querySelector('.sidebar-item[title="Charts"]');
    
    if (!chartsPanel || !chartsSidebarItem) return;
    
    const sidebarRect = chartsSidebarItem.getBoundingClientRect();
    const panelHeight = chartsPanel.offsetHeight || 400;
    const windowHeight = window.innerHeight;
    const centeredTop = (windowHeight - panelHeight) / 2;
    
    chartsPanel.style.top = `${Math.max(20, centeredTop)}px`;
    chartsPanel.style.left = `${sidebarRect.right + 12}px`;
  }

  function showChartsView() {
    const chartsPanel = document.getElementById('charts-panel');
    const chartTypeSelection = document.getElementById('chart-type-selection');
    const chartEditorPanel = document.getElementById('chart-editor-panel');
    const chartsPanelTitle = document.getElementById('charts-panel-title');
    
    if (chartsPanel) {
      chartsPanel.classList.remove('hidden');
      positionChartsPanel();
      
      // Reset to type selection view
      if (chartTypeSelection) chartTypeSelection.classList.remove('hidden');
      if (chartEditorPanel) chartEditorPanel.classList.add('hidden');
      if (chartsPanelTitle) chartsPanelTitle.textContent = 'Choose Chart Type';
      selectedChartType = null;
    }
  }

  function hideChartsPanel() {
    const chartsPanel = document.getElementById('charts-panel');
    if (chartsPanel) {
      chartsPanel.classList.add('hidden');
    }
  }

  function hideToolsPanel() {
    if (!toolsPanel) return;
    showToolsMainView();
    toolsPanel.classList.add('hidden');
  }

  function positionToolsPanel() {
    if (!toolsPanel || !toolsSidebarItem || typeof window === 'undefined') return;
    const sidebarRect = toolsSidebarItem.getBoundingClientRect();
    const panelRect = toolsPanel.getBoundingClientRect();
    const panelWidth = panelRect.width || toolsPanel.offsetWidth || 320;
    const panelHeight = panelRect.height || toolsPanel.offsetHeight || 280;
    const left = Math.min(window.innerWidth - panelWidth - 16, sidebarRect.right + 16);
    const top = Math.max(16, (window.innerHeight - panelHeight) / 2);
    toolsPanel.style.left = `${Math.max(16, left)}px`;
    toolsPanel.style.top = `${top}px`;
  }

  function notifyComingSoon(message) {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    } else {
      console.info(message);
    }
  }

  function handleToolAction(tool) {
    switch (tool) {
      case 'draw':
        activateCanvaDrawingMode();
        hideToolsPanel();
        return;
      case 'shapes':
        showShapesView();
        return;
      case 'line':
        showLinesView();
        return;
      case 'sticky':
        showStickyNotesView();
        hideToolsPanel();
        return;
      case 'textbox':
        insertText();
        break;
      case 'table':
        showTablesView();
        return;
      default:
        break;
    }
    hideToolsPanel();
  }

  function positionDrawingToolbar() {
    const drawingToolbar = document.getElementById('drawing-toolbar');
    const toolsSidebarItem = document.querySelector('.sidebar-item[title="Tools"]');
    
    if (!drawingToolbar || !toolsSidebarItem) return;
    
    const sidebarRect = toolsSidebarItem.getBoundingClientRect();
    drawingToolbar.style.top = `${sidebarRect.top}px`;
    drawingToolbar.style.left = `${sidebarRect.right + 12}px`;
  }

  function activateCanvaDrawingMode() {
    const drawingToolbar = document.getElementById('drawing-toolbar');
    const drawingColorPanel = document.getElementById('drawing-color-panel');
    
    // Show drawing toolbar and color panel
    if (drawingToolbar) {
      drawingToolbar.classList.remove('hidden');
      positionDrawingToolbar();
    }
    if (drawingColorPanel) {
      drawingColorPanel.classList.remove('hidden');
    }
    
    // Activate pen tool by default
    activateDrawingTool('pen');
    
    // Update color palette circle with current color
    const colorPaletteBtn = document.getElementById('color-picker-btn');
    if (colorPaletteBtn) {
      const circle = colorPaletteBtn.querySelector('.color-palette-circle');
      if (circle) {
        circle.style.background = currentDrawColor;
      }
    }
  }

  function deactivateCanvaDrawingMode() {
    const drawingToolbar = document.getElementById('drawing-toolbar');
    const drawingColorPanel = document.getElementById('drawing-color-panel');
    
    // Hide drawing toolbar and color panel
    if (drawingToolbar) {
      drawingToolbar.classList.add('hidden');
    }
    if (drawingColorPanel) {
      drawingColorPanel.classList.add('hidden');
    }
    
    deactivateDrawingMode();
  }

  function activateDrawingTool(tool) {
    // Update active tool button
    const toolButtons = document.querySelectorAll('.drawing-tool-btn');
    toolButtons.forEach(btn => {
      if (btn.dataset.drawTool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Set drawing mode based on tool
    if (tool === 'select') {
      isDrawingMode = false;
      isEraserMode = false;
      if (stageEl) {
        stageEl.style.cursor = 'default';
      }
    } else if (tool === 'eraser') {
      isDrawingMode = true;
      isEraserMode = true;
      if (stageEl) {
        stageEl.style.cursor = 'grab';
      }
    } else if (tool === 'pen' || tool === 'highlighter' || tool === 'arrow') {
      isDrawingMode = true;
      isEraserMode = false;
      if (stageEl) {
        stageEl.style.cursor = 'crosshair';
      }
      // Set stroke width based on tool
      if (tool === 'highlighter') {
        currentDrawWidth = 20; // Thicker for highlighter
      } else if (tool === 'arrow') {
        currentDrawWidth = 3;
        // Arrow will be handled differently - we'll draw arrows instead of freehand
      } else {
        currentDrawWidth = 3; // Default pen width
      }
    }
  }

  function activateDrawingMode() {
    isDrawingMode = true;
    if (stageEl) {
      stageEl.style.cursor = 'crosshair';
      stageEl.style.userSelect = 'none';
    }
    // Visual feedback that drawing mode is active
    if (stageEl) {
      stageEl.setAttribute('data-drawing-mode', 'true');
    }
  }

  function deactivateDrawingMode() {
    isDrawingMode = false;
    isEraserMode = false;
    if (stageEl) {
      stageEl.style.cursor = '';
      stageEl.style.userSelect = '';
      stageEl.removeAttribute('data-drawing-mode');
    }
    // Finalize current drawing if any
    if (currentDrawing && drawingPoints.length > 0) {
      finalizeDrawing();
    }
  }

  function startDrawing(e) {
    if (!isDrawingMode) return;
    
    const rect = stageEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create new drawing element
    const slide = state.slides[state.currentSlideIndex];
    // Check which tool is active
    const activeTool = document.querySelector('.drawing-tool-btn.active')?.dataset.drawTool || 'pen';
    
    let strokeColor = currentDrawColor;
    // For highlighter, make color semi-transparent
    if (activeTool === 'highlighter') {
      // Convert hex to rgba with opacity
      const r = parseInt(currentDrawColor.slice(1, 3), 16);
      const g = parseInt(currentDrawColor.slice(3, 5), 16);
      const b = parseInt(currentDrawColor.slice(5, 7), 16);
      strokeColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
    }
    
    currentDrawing = {
      id: uid(),
      type: 'drawing',
      paths: [],
      strokeColor: strokeColor,
      strokeWidth: currentDrawWidth,
      tool: activeTool
    };
    
    drawingPoints = [{ x, y }];
    
    // Create temporary SVG path for visual feedback
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1280');
    svg.setAttribute('height', '720');
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1000';
    svg.className = 'drawing-temp';
    
    currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    currentPath.setAttribute('stroke', currentDrawing.strokeColor);
    currentPath.setAttribute('stroke-width', currentDrawing.strokeWidth);
    currentPath.setAttribute('fill', 'none');
    currentPath.setAttribute('stroke-linecap', 'round');
    currentPath.setAttribute('stroke-linejoin', 'round');
    currentPath.setAttribute('d', `M ${x} ${y}`);
    
    svg.appendChild(currentPath);
    stageEl.appendChild(svg);
    
    e.preventDefault();
    e.stopPropagation();
  }

  function continueDrawing(e) {
    if (!isDrawingMode || !currentPath || drawingPoints.length === 0) return;
    
    const rect = stageEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingPoints.push({ x, y });
    
    // Update path
    let pathData = `M ${drawingPoints[0].x} ${drawingPoints[0].y}`;
    for (let i = 1; i < drawingPoints.length; i++) {
      pathData += ` L ${drawingPoints[i].x} ${drawingPoints[i].y}`;
    }
    currentPath.setAttribute('d', pathData);
    
    e.preventDefault();
    e.stopPropagation();
  }

  function finalizeDrawing() {
    if (!currentDrawing) {
      // Clean up if no drawing object
      const tempSvg = stageEl.querySelector('.drawing-temp');
      if (tempSvg) {
        stageEl.removeChild(tempSvg);
      }
      currentDrawing = null;
      currentPath = null;
      drawingPoints = [];
      return;
    }
    
    // If we have at least one point, save the drawing
    if (drawingPoints.length > 0) {
      // Save path data - handle single point case by creating a small line
      let pathData;
      if (drawingPoints.length === 1) {
        // Single point - create a tiny dot/line so it's visible
        const p = drawingPoints[0];
        pathData = `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
      } else {
        pathData = `M ${drawingPoints[0].x} ${drawingPoints[0].y}`;
        for (let i = 1; i < drawingPoints.length; i++) {
          pathData += ` L ${drawingPoints[i].x} ${drawingPoints[i].y}`;
        }
      }
      currentDrawing.paths.push(pathData);
      
      // Add to slide BEFORE removing temp SVG to ensure it persists
      const slide = state.slides[state.currentSlideIndex];
      if (slide) {
        slide.elements.push(currentDrawing);
        // Save state immediately
        saveState();
        
        // Remove temporary SVG after saving
        const tempSvg = stageEl.querySelector('.drawing-temp');
        if (tempSvg) {
          stageEl.removeChild(tempSvg);
        }
        
        // Re-render to show the permanent drawing
        renderAll();
      }
    } else {
      // No points, just clean up
      const tempSvg = stageEl.querySelector('.drawing-temp');
      if (tempSvg) {
        stageEl.removeChild(tempSvg);
      }
    }
    
    // Reset
    currentDrawing = null;
    currentPath = null;
    drawingPoints = [];
  }

  function cancelDrawing() {
    const tempSvg = stageEl.querySelector('.drawing-temp');
    if (tempSvg) {
      stageEl.removeChild(tempSvg);
    }
    currentDrawing = null;
    currentPath = null;
    drawingPoints = [];
  }

  function showTextOptionsView() {
    if (!textOptionsPanel) return;
    textOptionsPanel.classList.remove('page-number-active');
    textOptionsView?.classList.remove('hidden');
    pageNumberView?.classList.add('hidden');
  }

  function showPageNumberView() {
    if (!textOptionsPanel) return;
    textOptionsPanel.classList.add('page-number-active');
    textOptionsView?.classList.add('hidden');
    pageNumberView?.classList.remove('hidden');
    positionTextPanel();
  }

  function hideTextPanel() {
    if (!textOptionsPanel) return;
    textOptionsPanel.classList.add('hidden');
    textOptionsPanel.classList.remove('page-number-active');
    showTextOptionsView();
  }

  function updateTextControlBar(el) {
    if (!textControlBar || !el) return;
    textControlBar.classList.remove('hidden');
    if (textFontFamily) textFontFamily.value = el.fontFamily || 'Inter, system-ui, sans-serif';
    if (textFontSize) textFontSize.value = el.fontSize || 92;
    if (textFontColor) {
      const color = el.color || '#111111';
      textFontColor.value = color;
      if (textColorSwatch) textColorSwatch.style.setProperty('--swatch-color', color);
    }
    const isBold = (el.fontWeight && String(el.fontWeight).toLowerCase() === 'bold') || Number(el.fontWeight) >= 600;
    textBoldBtn?.classList.toggle('active', isBold);
    const isItalic = String(el.fontStyle).toLowerCase() === 'italic';
    textItalicBtn?.classList.toggle('active', isItalic);
    const isUnderline = !!el.underline;
    textUnderlineBtn?.classList.toggle('active', isUnderline);
    if (textAlignButtons) {
      textAlignButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === (el.textAlign || 'left'));
      });
    }
    textBulletBtn?.classList.toggle('active', el.listType === 'bullet');
    textNumberedBtn?.classList.toggle('active', el.listType === 'number');
    textLineSpacingBtn?.classList.toggle('active', el.lineHeight && Number(el.lineHeight) > 1.2);
  }

  function showTextControlBarForElement(el) {
    updateTextControlBar(el);
  }

  function hideTextControlBar() {
    if (textControlBar) textControlBar.classList.add('hidden');
  }

  function enterTextEditing(node, el) {
    if (!node || !el) return;
    editingElementId = el.id;
    editingNode = node;
    node.contentEditable = 'true';
    node.classList.add('editing');
    node.style.userSelect = 'text';
    document.querySelectorAll('.el').forEach(elNode => elNode.classList.remove('selected'));
    node.classList.add('selected');
    updateToolbarFromSelection();
    showContextToolbar(node);
    showTextControlBarForElement(el);
    updateFormattingButtons();
    requestAnimationFrame(() => {
      node.focus();
    });
  }

  function exitTextEditing() {
    if (editingNode) {
      const el = getEditingElement();
      if (el) syncEditingContent({ save: false });
      editingNode.classList.remove('editing');
    }
    editingElementId = null;
    editingNode = null;
    hideTextControlBar();
  }

  function getEditingElement() {
    if (!editingElementId) return null;
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return null;
    return slide.elements.find(e => e.id === editingElementId) || null;
  }

  function syncEditingContent({ save = true } = {}) {
    const el = getEditingElement();
    if (!el || !editingNode) return;
    el.content = editingNode.innerHTML;
    el.text = editingNode.innerText || '';
    if (save) {
      saveState();
    }
    renderSidebar();
  }

  function wrapRangeWithSpan(range, styleSetter) {
    const span = document.createElement('span');
    styleSetter(span);
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(newRange);
    return span;
  }

  function applyStyleToSelection(styleSetter) {
    if (!editingNode) return false;
    editingNode.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (range.collapsed || !editingNode.contains(range.commonAncestorContainer)) {
      return false;
    }
    wrapRangeWithSpan(range, styleSetter);
    return true;
  }

  function applyExecCommand(cmd, value) {
    if (!editingNode) return;
    editingNode.focus();
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (_) {}
    document.execCommand(cmd, false, value ?? null);
    syncEditingContent();
    updateFormattingButtons();
  }

  function updateFormattingButtons() {
    if (!editingNode) return;
    try {
      textBoldBtn?.classList.toggle('active', document.queryCommandState('bold'));
      textItalicBtn?.classList.toggle('active', document.queryCommandState('italic'));
      textUnderlineBtn?.classList.toggle('active', document.queryCommandState('underline'));
    } catch (_) {
      // queryCommandState may fail in some environments; ignore.
    }
  }

  function positionTextPanel() {
    if (!textSidebarItem || !textOptionsPanel) return;
    const rect = textSidebarItem.getBoundingClientRect();
    textOptionsPanel.style.top = `${rect.top}px`;
    textOptionsPanel.style.left = `${rect.right + 12}px`;
  }

  if (textSidebarItem && textOptionsPanel) {
    textSidebarItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideToolsPanel();
      positionTextPanel();
      const isHidden = textOptionsPanel.classList.contains('hidden');
      if (isHidden) {
        textOptionsPanel.classList.remove('hidden');
        showTextOptionsView();
      } else {
        textOptionsPanel.classList.add('hidden');
      }
    });
  }

  if (toolsSidebarItem && toolsPanel) {
    toolsSidebarItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideTextPanel();
      const isHidden = toolsPanel.classList.contains('hidden');
      if (isHidden) {
        showToolsMainView();
        toolsPanel.classList.remove('hidden');
        positionToolsPanel();
      } else {
        toolsPanel.classList.add('hidden');
      }
    });

    // Use event delegation to handle clicks on all option buttons
    // This must handle line, shape, and table buttons before stopping propagation
    toolsPanel.addEventListener('click', (e) => {
      // Check if click is on a line option button or its children (SVG, etc.)
      const lineBtn = e.target.closest('.line-option-btn');
      if (lineBtn) {
        e.preventDefault();
        e.stopPropagation();
        // Remove active class from all line option buttons
        lineOptionButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        lineBtn.classList.add('active');
        const lineType = lineBtn.dataset.lineType || 'straight';
        console.log('Inserting line type:', lineType); // Debug log
        insertLine(lineType);
        // Keep panel open so user can see the line appear on the canvas
        return;
      }
      
      // Check if click is on a shape option button
      const shapeBtn = e.target.closest('.shape-option-btn');
      if (shapeBtn) {
        // Let the existing shape handler deal with it, but don't stop propagation here
        return;
      }
      
      // Check if click is on a table option button
      const tableBtn = e.target.closest('.table-option-btn');
      if (tableBtn) {
        // Let the existing table handler deal with it, but don't stop propagation here
        return;
      }
      
      // For other clicks, stop propagation
      e.stopPropagation();
    });
  }

  toolOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      if (tool) {
        handleToolAction(tool);
      }
    });
  });

  shapeOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const shape = btn.dataset.shape || 'rectangle';
      insertShape(shape);
      hideToolsPanel();
    });
  });

  toolsShapesBackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showToolsMainView();
  });
  
  // Direct listeners as backup (in case event delegation doesn't work)
  lineOptionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Remove active class from all line option buttons
      lineOptionButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      const lineType = btn.dataset.lineType || 'straight';
      console.log('Direct listener - Inserting line type:', lineType); // Debug log
      insertLine(lineType);
      // Keep panel open so user can see the line appear on the canvas
    });
  });

  toolsLinesBackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showToolsMainView();
  });

  toolsDrawBackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showToolsMainView();
  });

  // Handle draw option button clicks
  drawOptionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove active class from all draw option buttons
      drawOptionButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const drawColor = btn.dataset.drawColor;
      const drawWidth = btn.dataset.drawWidth;
      const drawMode = btn.dataset.drawMode;
      
      if (drawMode === 'eraser') {
        isEraserMode = true;
        isDrawingMode = true;
        if (stageEl) {
          stageEl.style.cursor = 'grab';
        }
      } else {
        isEraserMode = false;
        if (drawColor) {
          currentDrawColor = drawColor;
        }
        if (drawWidth) {
          currentDrawWidth = parseInt(drawWidth, 10);
        }
        activateDrawingMode();
      }
      
      // Keep panel open
    });
  });

  tableOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const rows = parseInt(btn.dataset.rows || '3', 10);
      const cols = parseInt(btn.dataset.cols || '3', 10);
      insertTable(
        Number.isNaN(rows) ? 3 : rows,
        Number.isNaN(cols) ? 3 : cols
      );
      hideToolsPanel();
    });
  });

  toolsTablesBackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showToolsMainView();
  });

  if (pageNumberBackBtn) {
    pageNumberBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showTextOptionsView();
    });
  }

  if (textOptionsPanel) {
    textOptionsPanel.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    const clickedTextTrigger = textSidebarItem ? textSidebarItem.contains(e.target) : false;
    if (textOptionsPanel && !textOptionsPanel.contains(e.target) && !clickedTextTrigger) {
      hideTextPanel();
    }
    const clickedToolsTrigger = toolsSidebarItem ? toolsSidebarItem.contains(e.target) : false;
    if (toolsPanel && !toolsPanel.contains(e.target) && !clickedToolsTrigger) {
      hideToolsPanel();
    }
    const drawingToolbar = document.getElementById('drawing-toolbar');
    const drawingColorPanel = document.getElementById('drawing-color-panel');
    const clickedDrawingTrigger = toolsSidebarItem ? toolsSidebarItem.contains(e.target) : false;
    if (drawingToolbar && !drawingToolbar.classList.contains('hidden') && 
        !drawingToolbar.contains(e.target) && !clickedDrawingTrigger &&
        !(drawingColorPanel && drawingColorPanel.contains(e.target))) {
      deactivateCanvaDrawingMode();
    }
  });

  window.addEventListener('resize', () => {
    if (textOptionsPanel && !textOptionsPanel.classList.contains('hidden')) {
      positionTextPanel();
    }
    if (toolsPanel && !toolsPanel.classList.contains('hidden')) {
      positionToolsPanel();
    }
    const drawingToolbar = document.getElementById('drawing-toolbar');
    if (drawingToolbar && !drawingToolbar.classList.contains('hidden')) {
      positionDrawingToolbar();
    }
  });

  // Handle text option button clicks
  textOptionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const option = btn.dataset.option;

      if (option === 'heading') {
        addHeading();
        hideTextPanel();
      } else if (option === 'subheading') {
        addSubheading();
        hideTextPanel();
      } else if (option === 'body') {
        addBodyText();
        hideTextPanel();
      } else if (option === 'pagenumber') {
        showPageNumberView();
      }
    });
  });

  // Handle page number position selection
  positionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const position = btn.dataset.position;
      addPageNumber(position);
      hideTextPanel();
    });
  });

  function getSelectedElementInfo() {
    const selected = getSelectedElement();
    if (!selected) return null;
    const slide = state.slides[state.currentSlideIndex];
    const elId = selected.dataset.id;
    const el = slide.elements.find(e => e.id === elId);
    if (!el) return null;
    return { selected, slide, el, elId };
  }

  function reselectElement(elId) {
    requestAnimationFrame(() => {
      const node = document.querySelector(`.el[data-id="${elId}"]`);
      if (node) {
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        node.classList.add('selected');
        updateToolbarFromSelection();
        showContextToolbar(node);
        const slide = state.slides[state.currentSlideIndex];
        const elData = slide?.elements.find(e => e.id === elId);
        if (elData?.type === 'text') {
          showTextControlBarForElement(elData);
          enterTextEditing(node, elData);
        } else {
          hideTextControlBar();
          exitTextEditing();
        }
      } else {
        hideContextToolbar();
        hideTextControlBar();
      }
    });
  }

  function getSelectedTextElement() {
    if (editingNode) {
      const el = getEditingElement();
      if (!el) return null;
      return { node: editingNode, el };
    }
    const node = getSelectedElement();
    if (!node || !node.classList.contains('text')) return null;
    const slide = state.slides[state.currentSlideIndex];
    const elId = node.dataset.id;
    const el = slide.elements.find(e => e.id === elId);
    if (!el) return null;
    return { node, el };
  }

  function pasteFromClipboard() {
    if (!clipboardElement) return;
    const slide = state.slides[state.currentSlideIndex];
    const newEl = JSON.parse(JSON.stringify(clipboardElement));
    newEl.id = uid();
    if (newEl.type === 'line') {
      // Offset line coordinates
      newEl.x1 = (newEl.x1 || 200) + 20;
      newEl.y1 = (newEl.y1 || 200) + 20;
      newEl.x2 = (newEl.x2 || 400) + 20;
      newEl.y2 = (newEl.y2 || 200) + 20;
      if (newEl.midX !== null && newEl.midX !== undefined) {
        newEl.midX = newEl.midX + 20;
      }
      if (newEl.midY !== null && newEl.midY !== undefined) {
        newEl.midY = newEl.midY + 20;
      }
    } else {
      newEl.x = (newEl.x || 0) + 20;
      newEl.y = (newEl.y || 0) + 20;
    }
    slide.elements.push(newEl);
    saveState();
    renderAll();
    reselectElement(newEl.id);
  }

  function performAction(action) {
    if (action === 'paste') {
      pasteFromClipboard();
      return;
    }
    const info = getSelectedElementInfo();
    if (!info) return;
    const { selected, slide, el, elId } = info;
    switch (action) {
      case 'copy':
        clipboardElement = JSON.parse(JSON.stringify(el));
        break;
      case 'duplicate': {
        const newEl = JSON.parse(JSON.stringify(el));
        newEl.id = uid();
        if (el.type === 'line') {
          // Offset line coordinates
          newEl.x1 = (newEl.x1 || 200) + 20;
          newEl.y1 = (newEl.y1 || 200) + 20;
          newEl.x2 = (newEl.x2 || 400) + 20;
          newEl.y2 = (newEl.y2 || 200) + 20;
          if (newEl.midX !== null && newEl.midX !== undefined) {
            newEl.midX = newEl.midX + 20;
          }
          if (newEl.midY !== null && newEl.midY !== undefined) {
            newEl.midY = newEl.midY + 20;
          }
        } else {
          newEl.x = (newEl.x || 0) + 20;
          newEl.y = (newEl.y || 0) + 20;
        }
        slide.elements.push(newEl);
        saveState();
        renderAll();
        reselectElement(newEl.id);
        break;
      }
      case 'delete': {
        const index = slide.elements.findIndex(e => e.id === elId);
        if (index >= 0) {
          slide.elements.splice(index, 1);
          saveState();
          renderAll();
          hideContextToolbar();
        }
        break;
      }
      case 'lock': {
        el.locked = !el.locked;
        saveState();
        renderAll();
        reselectElement(elId);
        break;
      }
      case 'align': {
        const stageWidth = 1280;
        const stageHeight = 720;
        if (el.type === 'line') {
          // Center line based on its bounding box
          const minX = Math.min(el.x1 || 200, el.x2 || 400);
          const maxX = Math.max(el.x1 || 200, el.x2 || 400);
          const minY = Math.min(el.y1 || 200, el.y2 || 200);
          const maxY = Math.max(el.y1 || 200, el.y2 || 200);
          const lineWidth = maxX - minX;
          const lineHeight = maxY - minY;
          const centerX = minX + lineWidth / 2;
          const centerY = minY + lineHeight / 2;
          const offsetX = (stageWidth / 2) - centerX;
          const offsetY = (stageHeight / 2) - centerY;
          el.x1 = (el.x1 || 200) + offsetX;
          el.y1 = (el.y1 || 200) + offsetY;
          el.x2 = (el.x2 || 400) + offsetX;
          el.y2 = (el.y2 || 200) + offsetY;
          if (el.midX !== null && el.midX !== undefined) {
            el.midX = el.midX + offsetX;
          }
          if (el.midY !== null && el.midY !== undefined) {
            el.midY = el.midY + offsetY;
          }
        } else {
          const bounds = selected.getBoundingClientRect();
          el.x = (stageWidth - bounds.width) / 2;
          el.y = (stageHeight - bounds.height) / 2;
        }
        saveState();
        renderAll();
        reselectElement(elId);
        break;
      }
      case 'to-page': {
        const stageWidth = 1280;
        const stageHeight = 720;
        if (el.type === 'line') {
          // Move line to nearest edge based on bounding box
          const minX = Math.min(el.x1 || 200, el.x2 || 400);
          const maxX = Math.max(el.x1 || 200, el.x2 || 400);
          const minY = Math.min(el.y1 || 200, el.y2 || 200);
          const maxY = Math.max(el.y1 || 200, el.y2 || 200);
          const lineWidth = maxX - minX;
          const lineHeight = maxY - minY;
          const distToLeft = minX;
          const distToRight = stageWidth - maxX;
          const distToTop = minY;
          const distToBottom = stageHeight - maxY;
          const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
          let offsetX = 0;
          let offsetY = 0;
          if (minDist === distToLeft) {
            offsetX = -minX;
          } else if (minDist === distToRight) {
            offsetX = stageWidth - maxX;
          } else if (minDist === distToTop) {
            offsetY = -minY;
          } else if (minDist === distToBottom) {
            offsetY = stageHeight - maxY;
          }
          el.x1 = (el.x1 || 200) + offsetX;
          el.y1 = (el.y1 || 200) + offsetY;
          el.x2 = (el.x2 || 400) + offsetX;
          el.y2 = (el.y2 || 200) + offsetY;
          if (el.midX !== null && el.midX !== undefined) {
            el.midX = el.midX + offsetX;
          }
          if (el.midY !== null && el.midY !== undefined) {
            el.midY = el.midY + offsetY;
          }
        } else {
          const bounds = selected.getBoundingClientRect();
          const distToLeft = el.x;
          const distToRight = stageWidth - (el.x + bounds.width);
          const distToTop = el.y;
          const distToBottom = stageHeight - (el.y + bounds.height);
          const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
          if (minDist === distToLeft) el.x = 0;
          else if (minDist === distToRight) el.x = stageWidth - bounds.width;
          else if (minDist === distToTop) el.y = 0;
          else if (minDist === distToBottom) el.y = stageHeight - bounds.height;
        }
        saveState();
        renderAll();
        reselectElement(elId);
        break;
      }
      case 'link': {
        const url = prompt('Enter URL:', el.link || '');
        if (url !== null) {
          el.link = url;
          saveState();
          renderAll();
          reselectElement(elId);
        }
        break;
      }
      case 'timing': {
        alert('Element timing feature - coming soon');
        break;
      }
      case 'comment': {
        const comment = prompt('Add a comment:', el.comment || '');
        if (comment !== null) {
          el.comment = comment;
          saveState();
          renderAll();
          reselectElement(elId);
        }
        break;
      }
      case 'alt-text': {
        const altText = prompt('Enter alternative text:', el.altText || '');
        if (altText !== null) {
          el.altText = altText;
          saveState();
          renderAll();
          reselectElement(elId);
        }
        break;
      }
      default:
        break;
    }
  }

  // Drawing mode mouse events
  let isMouseDown = false;
  
  stageEl.addEventListener('mousedown', (e) => {
    if (isDrawingMode) {
      // Handle eraser mode
      if (isEraserMode) {
        const clickedElement = e.target.closest('.el.drawing');
        if (clickedElement) {
          const elId = clickedElement.dataset.id;
          const slide = state.slides[state.currentSlideIndex];
          const index = slide.elements.findIndex(el => el.id === elId);
          if (index >= 0) {
            slide.elements.splice(index, 1);
            saveState();
            renderAll();
          }
        }
        return;
      }
      
      // Don't start drawing if clicking on an existing element
      if (e.target.closest('.el') && !e.target.closest('.drawing-temp')) {
        cancelDrawing();
        deactivateDrawingMode();
        return;
      }
      isMouseDown = true;
      startDrawing(e);
    }
  });
  
  stageEl.addEventListener('mousemove', (e) => {
    if (isDrawingMode && isMouseDown) {
      continueDrawing(e);
    }
  });
  
  stageEl.addEventListener('mouseup', (e) => {
    if (isDrawingMode && isMouseDown) {
      isMouseDown = false;
      finalizeDrawing();
    }
  });
  
  stageEl.addEventListener('mouseleave', (e) => {
    if (isDrawingMode && isMouseDown) {
      isMouseDown = false;
      finalizeDrawing();
    }
  });

  // Click on stage to deselect (but not in drawing mode)
  stageEl.addEventListener('click', (e) => {
    if (isDrawingMode) {
      // Don't deselect in drawing mode
      return;
    }
    if (!e.target.closest('.el')) {
      document.querySelectorAll('.el').forEach(el => {
        el.classList.remove('selected');
        // Hide selection boxes for lines
        const selectionBox = el.querySelector('.line-selection-box');
        if (selectionBox) {
          selectionBox.style.display = 'none';
        }
      });
      hideContextToolbar();
      exitTextEditing();
    }
  });

  floatingToolbar?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  btnMore?.addEventListener('click', (e) => {
    e.stopPropagation();
    toolbarMenu?.classList.toggle('hidden');
  });

  toolbarMenu?.querySelectorAll('.toolbar-menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      toolbarMenu.classList.add('hidden');
      if (action) performAction(action);
    });
  });

  document.addEventListener('click', () => {
    toolbarMenu?.classList.add('hidden');
  });

  document.getElementById('btn-comment')?.addEventListener('click', () => performAction('comment'));
  document.getElementById('btn-lock')?.addEventListener('click', () => performAction('lock'));
  document.getElementById('btn-link')?.addEventListener('click', () => performAction('link'));

  textFontFamily?.addEventListener('change', () => {
    const value = textFontFamily.value;
    const applied = applyStyleToSelection(span => { span.style.fontFamily = value; });
    if (!applied) {
      const el = getEditingElement();
      if (!el || !editingNode) return;
      el.fontFamily = value;
      editingNode.style.fontFamily = value;
    }
    syncEditingContent();
    updateFormattingButtons();
  });

  textFontSize?.addEventListener('change', () => {
    const size = parseInt(textFontSize.value, 10);
    if (Number.isNaN(size)) return;
    const applied = applyStyleToSelection(span => { span.style.fontSize = `${size}px`; });
    if (!applied) {
      const el = getEditingElement();
      if (!el || !editingNode) return;
      el.fontSize = size;
      editingNode.style.fontSize = `${size}px`;
    }
    syncEditingContent();
    updateFormattingButtons();
  });

  textFontColor?.addEventListener('input', () => {
    const value = textFontColor.value;
    if (textColorSwatch) textColorSwatch.style.setProperty('--swatch-color', value);
    const applied = applyStyleToSelection(span => { span.style.color = value; });
    if (!applied) {
      const el = getEditingElement();
      if (!el || !editingNode) return;
      el.color = value;
      editingNode.style.color = value;
    }
    syncEditingContent();
    updateFormattingButtons();
  });

  textBoldBtn?.addEventListener('click', () => {
    applyExecCommand('bold');
  });

  textItalicBtn?.addEventListener('click', () => {
    applyExecCommand('italic');
  });

  textUnderlineBtn?.addEventListener('click', () => {
    applyExecCommand('underline');
  });

  textAlignButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const el = getEditingElement();
      if (!el || !editingNode) return;
      const align = btn.dataset.align || 'left';
      el.textAlign = align;
      editingNode.style.textAlign = align;
      textAlignButtons.forEach(b => b.classList.toggle('active', b === btn));
      syncEditingContent();
      updateFormattingButtons();
    });
  });

  textBulletBtn?.addEventListener('click', () => {
    if (!editingNode) return;
    const el = getEditingElement();
    if (!el) return;
    const lines = (editingNode.innerText || '').split('\n');
    if (el.listType === 'bullet') {
      el.listType = null;
      const updated = lines.map(line => line.replace(/^\s*•\s?/, ''));
      editingNode.innerText = updated.join('\n');
      textBulletBtn.classList.remove('active');
    } else {
      const wasNumber = el.listType === 'number';
      el.listType = 'bullet';
      const sanitized = lines.map(line => line.replace(/^\s*\d+[\).\s]/, '').trimStart());
      const updated = sanitized.map(line => line.startsWith('• ') ? line : `• ${line}`);
      editingNode.innerText = updated.join('\n');
      textBulletBtn.classList.add('active');
      if (wasNumber) {
        textNumberedBtn?.classList.remove('active');
      }
    }
    syncEditingContent();
    updateFormattingButtons();
  });

  textNumberedBtn?.addEventListener('click', () => {
    if (!editingNode) return;
    const el = getEditingElement();
    if (!el) return;
    const lines = (editingNode.innerText || '').split('\n');
    if (el.listType === 'number') {
      el.listType = null;
      const updated = lines.map(line => line.replace(/^\s*\d+[\).\s]/, ''));
      editingNode.innerText = updated.join('\n');
      textNumberedBtn.classList.remove('active');
    } else {
      const wasBullet = el.listType === 'bullet';
      const sanitized = lines.map(line => line.replace(/^\s*•\s?/, '').trimStart());
      el.listType = 'number';
      const updated = sanitized.map((line, idx) => {
        const prefix = `${idx + 1}. `;
        return line.match(/^\s*\d+[\).\s]/) ? line.replace(/^\s*\d+[\).\s]/, prefix) : `${prefix}${line}`;
      });
      editingNode.innerText = updated.join('\n');
      textNumberedBtn.classList.add('active');
      if (wasBullet) {
        textBulletBtn?.classList.remove('active');
      }
    }
    syncEditingContent();
    updateFormattingButtons();
  });

  textLineSpacingBtn?.addEventListener('click', () => {
    const el = getEditingElement();
    if (!editingNode || !el) return;
    const isExpanded = !textLineSpacingBtn.classList.contains('active');
    textLineSpacingBtn.classList.toggle('active', isExpanded);
    el.lineHeight = isExpanded ? 1.6 : 1.2;
    editingNode.style.lineHeight = String(el.lineHeight);
    syncEditingContent();
    updateFormattingButtons();
  });

  // Search stubs
  function performTextSearch() { return []; }
  function searchNext() {}
  function searchPrev() {}
  function clearTextSearch() {
    searchState.active = false;
  }
  function releaseInteractionAfterScroll() {}

  window.addEventListener('resize', () => {
    if (currentToolbarTarget && !floatingToolbar?.classList.contains('hidden')) {
      positionFloatingToolbar(currentToolbarTarget);
    }
  });

  window.addEventListener('scroll', () => {
    if (currentToolbarTarget && !floatingToolbar?.classList.contains('hidden')) {
      positionFloatingToolbar(currentToolbarTarget);
    }
  }, true);

  stageEl.parentElement?.addEventListener('scroll', () => {
    if (currentToolbarTarget && !floatingToolbar?.classList.contains('hidden')) {
      positionFloatingToolbar(currentToolbarTarget);
    }
  });

  textControlBar?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  textControlBar?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('selectionchange', () => {
    if (!editingNode) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    if (anchor && editingNode.contains(anchor)) {
      updateFormattingButtons();
    }
  });

  window.searchText = performTextSearch;
  window.searchNext = searchNext;
  window.searchPrev = searchPrev;
  window.clearTextSearch = clearTextSearch;

  // ============================================================================
  // AI Presentation Generator Integration
  // ============================================================================
  
  /**
   * Get current presentation state for AI improvement
   */
  window.getCurrentPresentationState = function() {
    return JSON.parse(JSON.stringify(state));
  };

  /**
   * Create a presentation from AI-generated slide data (new JSON format)
   * @param {Array} slidesData - Array of slide objects with title, body, layout, design, notes
   */
  window.createAIPresentation = function(slidesData) {
    if (!slidesData || !Array.isArray(slidesData) || slidesData.length === 0) {
      console.error('Invalid slides data provided');
      return false;
    }

    try {
      // Clear existing slides and start fresh
      state.slides = [];
      state.currentSlideIndex = 0;
      state.title = slidesData[0]?.title || 'AI Generated Presentation';

      // Create slides from data
      slidesData.forEach((slideData, index) => {
        const slide = defaultSlide();
        const layout = slideData.layout || 'content';
        const design = slideData.design || {};
        const colors = design.colors || {};
        const fonts = design.fonts || {};
        
        // Default theme values (fallback only - functions read from slideData.design)
        const primaryColor = colors.primary || '#003e6a';
        const secondaryColor = colors.secondary || '#00aae7';
        const textColor = colors.text || '#1e293b';
        const textLightColor = colors.textLight || '#475569';
        const backgroundColor = colors.background || '#ffffff';
        const fontFamily = fonts.family || 'Inter, system-ui, sans-serif';
        const titleSize = fonts.titleSize || 42;
        const bodySize = fonts.bodySize || 22;
        
        // Store notes if provided
        if (slideData.notes) {
          slide.notes = slideData.notes;
        }
        
        // Apply layout
        if (layout === 'title') {
          createTitleSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize);
        } else if (layout === 'two-column') {
          createTwoColumnSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
        } else if (layout === 'image-text') {
          createImageTextSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
        } else if (layout === 'key-points') {
          createKeyPointsSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
        } else if (layout === 'summary') {
          createSummarySlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
        } else {
          // Default content layout
          createContentSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
        }
        
        state.slides.push(slide);
      });

      // Ensure at least one slide exists
      if (state.slides.length === 0) {
        state.slides.push(defaultSlide());
      }

      // Update title in UI
      if (deckTitleEl) {
        deckTitleEl.textContent = state.title;
      }

      // Save state and render
      saveState();
      renderAll();
      
      // Navigate to first slide
      state.currentSlideIndex = 0;
      renderAll();
      
      return true;
    } catch (error) {
      console.error('Error creating AI presentation:', error);
      return false;
    }
  };

  // Helper functions for different layouts
  function createTitleSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize) {
    // Extract design data EXCLUSIVELY from slideData.design object
    const design = slideData.design || {};
    const colors = design.colors || {};
    const fonts = design.fonts || {};
    
    // Read colors exclusively from design object
    const primaryColorValue = colors.primary || '#003e6a';
    const secondaryColorValue = colors.secondary || '#00aae7';
    const accentColorValue = colors.accent || '#006c35';
    const backgroundColorValue = colors.background || '#ffffff';
    const textColorValue = colors.text || '#1e293b';
    const textLightValue = colors.textLight || '#475569';
    
    // Fallback colors if theme has no custom design
    const fallbackBg = backgroundColorValue === '#ffffff' ? '#fdfdfd' : backgroundColorValue;
    const fallbackAccent = accentColorValue || '#3a77ff';
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
      if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${opacity})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Helper function to add decorative background shapes with safe zones
    const addDecorativeShapes = () => {
      // Safe zones: 140px horizontal, 100px vertical margins
      // Title zone: top 20-35% (144-252px)
      // Content zone: mid 35-80% (252-576px)
      const safeLeft = 140;
      const safeRight = 1280 - 140;
      const safeTop = 100;
      const safeBottom = 720 - 100;
      const titleZoneTop = 144; // 20% of 720
      const titleZoneBottom = 252; // 35% of 720
      const contentZoneTop = 252; // 35% of 720
      const contentZoneBottom = 576; // 80% of 720
      
      // Shape 1: Top-right corner (outside safe zones)
      const shape1Size = 280;
      const shape1Opacity = 0.09 + Math.random() * 0.04; // 0.09-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeRight - shape1Size + 40, // Right edge, partially off-screen
        y: safeTop - shape1Size / 2, // Top edge
        width: shape1Size,
        height: shape1Size,
        fillColor: hexToRgba(accentColorValue || fallbackAccent, shape1Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(32px)',
        rotation: 1 + Math.random() * 2, // 1-3 degrees
        scale: 1.02 + Math.random() * 0.03, // 1.02-1.05
        zIndex: -1
      });
      
      // Shape 2: Bottom-left corner (outside safe zones)
      const shape2Size = 240;
      const shape2Opacity = 0.08 + Math.random() * 0.05; // 0.08-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeLeft - shape2Size / 2, // Left edge
        y: safeBottom - shape2Size / 2 + 20, // Bottom edge
        width: shape2Size,
        height: shape2Size,
        fillColor: hexToRgba(secondaryColorValue, shape2Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(28px)',
        rotation: 1.5 + Math.random() * 1.5, // 1.5-3 degrees
        scale: 1.03 + Math.random() * 0.02, // 1.03-1.05
        zIndex: -1
      });
    };
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'center';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Add decorative shapes FIRST (so they appear behind)
    addDecorativeShapes();
    slide.background = fallbackBg;
    
    const titleY = 250;
    const subtitleY = 380;
    const padding = 60;
    
    // Adjust title X position based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : padding);
    const bodyX = bodyAlignValue === 'center' ? 640 : (bodyAlignValue === 'right' ? 1180 : padding);
    
    // Main title with shadow
    const titleText = slideData.title || 'Title';
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: titleText,
      content: titleText,
      fontSize: titleSizeValue,
      color: primaryColorValue,
      fontFamily: fontFamilyValue,
      fontWeight: fontWeightValue,
      fontStyle: 'normal',
      textAlign: titleAlignValue,
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    });
    
    // Accent underline beneath title (40% of title width, 3-4px height, centered)
    const titleWidth = titleText.length * (titleSizeValue * 0.6);
    const accentLineWidth = titleWidth * 0.4; // 40% of title width
    const accentLineX = titleAlignValue === 'center' ? 640 - (accentLineWidth / 2) :
                        (titleAlignValue === 'right' ? titleX + titleWidth - accentLineWidth : titleX);
    const accentLineY = titleY + titleSizeValue + 15;
    
    slide.elements.push({
      id: uid(),
      type: 'shape',
      shapeType: 'rounded-rectangle',
      x: accentLineX,
      y: accentLineY,
      width: accentLineWidth,
      height: 3.5, // 3-4px
      fillColor: primaryColorValue, // Use primary color for underline
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: '2px',
      rotation: 0,
      scale: 1
    });
    
    // Subtitle/body if provided - wrap in glassmorphism card
    if (slideData.body) {
      const bodyLines = slideData.body.split('\n').filter(l => l.trim());
      const bodyText = bodyLines.join(' ');
      const containerWidth = Math.min(bodyText.length * 9 + 80, 1000);
      const containerHeight = bodyLines.length * 55 + 60;
      const containerX = bodyAlignValue === 'center' ? 640 - (containerWidth / 2) :
                         (bodyAlignValue === 'right' ? 1180 - containerWidth : padding);
      const containerY = subtitleY - 30;
      
      // Glassmorphism container with blur
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'rounded-rectangle',
        x: containerX,
        y: containerY,
        width: containerWidth,
        height: containerHeight,
        fillColor: 'rgba(255, 255, 255, 0.55)',
        strokeColor: hexToRgba(fallbackAccent, 0.15),
        strokeWidth: 1,
        borderRadius: '18px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(16px)',
        filter: 'blur(0px)',
        rotation: 0,
        scale: 1
      });
      
      bodyLines.forEach((line, idx) => {
        slide.elements.push({
          id: uid(),
          type: 'text',
          x: bodyX,
          y: subtitleY + (idx * 55),
          text: line.trim(),
          content: line.trim(),
          fontSize: bodySizeValue,
          color: textColorValue,
          fontFamily: fontFamilyValue,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: bodyAlignValue,
          underline: false,
          lineHeight: 1.5,
          listType: null,
          rotation: 0,
          scale: 1
        });
      });
    }
  }

  function createContentSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize) {
    // Extract design data EXCLUSIVELY from slideData.design object
    const design = slideData.design || {};
    const colors = design.colors || {};
    const fonts = design.fonts || {};
    
    // Read colors exclusively from design object
    const primaryColorValue = colors.primary || '#003e6a';
    const secondaryColorValue = colors.secondary || '#00aae7';
    const accentColorValue = colors.accent || '#006c35';
    const backgroundColorValue = colors.background || '#ffffff';
    const textColorValue = colors.text || '#1e293b';
    const textLightValue = colors.textLight || '#475569';
    
    // Fallback colors if theme has no custom design
    const fallbackBg = backgroundColorValue === '#ffffff' ? '#fdfdfd' : backgroundColorValue;
    const fallbackAccent = accentColorValue || '#3a77ff';
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
      if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${opacity})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Helper function to add decorative background shapes with safe zones
    const addDecorativeShapes = () => {
      const safeLeft = 140;
      const safeRight = 1280 - 140;
      const safeTop = 100;
      const safeBottom = 720 - 100;
      const contentZoneTop = 252; // 35% of 720
      const contentZoneBottom = 576; // 80% of 720
      
      // Shape 1: Top-right corner
      const shape1Size = 260;
      const shape1Opacity = 0.08 + Math.random() * 0.05; // 0.08-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeRight - shape1Size + 30,
        y: safeTop - shape1Size / 2,
        width: shape1Size,
        height: shape1Size,
        fillColor: hexToRgba(accentColorValue || fallbackAccent, shape1Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(30px)',
        rotation: 1.2 + Math.random() * 1.8, // 1.2-3 degrees
        scale: 1.02 + Math.random() * 0.03, // 1.02-1.05
        zIndex: -1
      });
      
      // Shape 2: Bottom-left corner
      const shape2Size = 220;
      const shape2Opacity = 0.07 + Math.random() * 0.06; // 0.07-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeLeft - shape2Size / 2,
        y: safeBottom - shape2Size / 2 + 30,
        width: shape2Size,
        height: shape2Size,
        fillColor: hexToRgba(secondaryColorValue, shape2Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(28px)',
        rotation: 1.5 + Math.random() * 1.5, // 1.5-3 degrees
        scale: 1.03 + Math.random() * 0.02, // 1.03-1.05
        zIndex: -1
      });
    };
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'left';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Add decorative shapes FIRST (so they appear behind)
    addDecorativeShapes();
    slide.background = fallbackBg;
    
    const startY = 100;
    const titleY = startY;
    const contentStartY = startY + 140;
    const maxWidth = 1080;
    const lineHeight = 32;
    const padding = 60;
    
    // Adjust positioning based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : padding);
    const bodyX = bodyAlignValue === 'center' ? 640 : (bodyAlignValue === 'right' ? 1180 : padding);
    
    // Slide title with shadow
    const titleText = slideData.title || 'Slide';
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: titleText,
      content: titleText,
      fontSize: titleSizeValue,
      color: primaryColorValue,
      fontFamily: fontFamilyValue,
      fontWeight: fontWeightValue,
      fontStyle: 'normal',
      textAlign: titleAlignValue,
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
    });
    
    // Accent underline beneath title (40% of title width, centered)
    const titleWidth = titleText.length * (titleSizeValue * 0.6);
    const accentLineWidth = titleWidth * 0.4; // 40% of title width
    const accentLineX = titleAlignValue === 'center' ? 640 - (accentLineWidth / 2) :
                        (titleAlignValue === 'right' ? titleX + titleWidth - accentLineWidth : titleX);
    const accentLineY = titleY + titleSizeValue + 12;
    
    slide.elements.push({
      id: uid(),
      type: 'shape',
      shapeType: 'rounded-rectangle',
      x: accentLineX,
      y: accentLineY,
      width: accentLineWidth,
      height: 3.5, // 3-4px
      fillColor: primaryColorValue, // Use primary color for underline
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: '2px',
      rotation: 0,
      scale: 1
    });
    
    // Body content - handle as paragraphs, wrapped in styled containers
    if (slideData.body) {
      // Split into paragraphs (by double newlines or long sentences)
      const paragraphs = slideData.body.split(/\n\n+/).filter(p => p.trim());
      if (paragraphs.length === 0) {
        paragraphs.push(slideData.body);
      }
      
      let currentY = contentStartY;
      const containerPadding = 30; // 28-32px padding for content cards
      const containerMaxWidth = Math.min(maxWidth, 1000);
      
      paragraphs.forEach((paragraph, paraIdx) => {
        // Clean paragraph text
        const cleanPara = paragraph.trim().replace(/\n/g, ' ');
        
        // Calculate container dimensions
        const estimatedLines = Math.ceil(cleanPara.length / 80);
        const containerHeight = Math.max(estimatedLines * (bodySizeValue * 1.6) + (containerPadding * 2), 80);
        const containerX = bodyAlignValue === 'center' ? 640 - (containerMaxWidth / 2) :
                           (bodyAlignValue === 'right' ? 1180 - containerMaxWidth : padding);
        
        // Create glassmorphism text container
        slide.elements.push({
          id: uid(),
          type: 'shape',
          shapeType: 'rounded-rectangle',
          x: containerX,
          y: currentY - containerPadding,
          width: containerMaxWidth,
          height: containerHeight,
          fillColor: 'rgba(255, 255, 255, 0.55)',
          strokeColor: 'rgba(0, 0, 0, 0.08)',
          strokeWidth: 1,
          borderRadius: '18px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(16px)',
          filter: 'blur(0px)',
          rotation: 0,
          scale: 1
        });
        
        // Split long paragraphs into manageable chunks (max ~600 chars per element)
        const maxChars = 600;
        let textY = currentY;
        
        if (cleanPara.length > maxChars) {
          const sentences = cleanPara.match(/[^.!?]+[.!?]+/g) || [cleanPara];
          let currentChunk = '';
          
          sentences.forEach((sentence, sentIdx) => {
            if ((currentChunk + sentence).length > maxChars && currentChunk) {
              // Create element for current chunk
              slide.elements.push({
                id: uid(),
                type: 'text',
                x: bodyX,
                y: textY,
                text: currentChunk.trim(),
                content: currentChunk.trim(),
                fontSize: bodySizeValue,
                color: textColorValue,
                fontFamily: fontFamilyValue,
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: bodyAlignValue,
                underline: false,
                lineHeight: 1.6,
                listType: null,
                rotation: 0,
                scale: 1
              });
              
              textY += Math.ceil(currentChunk.length / 80) * (lineHeight * 1.6); // Estimate height
              currentChunk = sentence + ' ';
            } else {
              currentChunk += sentence + ' ';
            }
          });
          
          // Add remaining chunk
          if (currentChunk.trim()) {
            slide.elements.push({
              id: uid(),
              type: 'text',
              x: bodyX,
              y: textY,
              text: currentChunk.trim(),
              content: currentChunk.trim(),
              fontSize: bodySizeValue,
              color: textColorValue,
              fontFamily: fontFamilyValue,
              fontWeight: 'normal',
              fontStyle: 'normal',
              textAlign: bodyAlignValue,
              underline: false,
              lineHeight: 1.6,
              listType: null,
              rotation: 0,
              scale: 1
            });
            
            textY += Math.ceil(currentChunk.length / 80) * (lineHeight * 1.6);
          }
        } else {
          // Single paragraph element
          slide.elements.push({
            id: uid(),
            type: 'text',
            x: bodyX,
            y: textY,
            text: cleanPara,
            content: cleanPara,
            fontSize: bodySizeValue,
            color: textColorValue,
            fontFamily: fontFamilyValue,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: bodyAlignValue,
            underline: false,
            lineHeight: 1.6,
            listType: null,
            rotation: 0,
            scale: 1
          });
          
          textY += Math.ceil(cleanPara.length / 80) * (lineHeight * 1.6);
        }
        
        // Update currentY for next paragraph
        currentY = textY + containerPadding + 20;
        
        // Add spacing between paragraphs
        if (paraIdx < paragraphs.length - 1) {
          currentY += 20;
        }
      });
    }
  }

  function createTwoColumnSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize) {
    // Extract design data EXCLUSIVELY from slideData.design object
    const design = slideData.design || {};
    const colors = design.colors || {};
    const fonts = design.fonts || {};
    
    // Read colors exclusively from design object
    const primaryColorValue = colors.primary || '#003e6a';
    const secondaryColorValue = colors.secondary || '#00aae7';
    const accentColorValue = colors.accent || '#006c35';
    const backgroundColorValue = colors.background || '#ffffff';
    const textColorValue = colors.text || '#1e293b';
    const textLightValue = colors.textLight || '#475569';
    
    // Fallback colors if theme has no custom design
    const fallbackBg = backgroundColorValue === '#ffffff' ? '#fdfdfd' : backgroundColorValue;
    const fallbackAccent = accentColorValue || '#3a77ff';
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
      if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${opacity})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Helper function to add decorative background shapes with safe zones
    const addDecorativeShapes = () => {
      const safeLeft = 140;
      const safeRight = 1280 - 140;
      const safeTop = 100;
      const safeBottom = 720 - 100;
      
      // Shape 1: Top-right corner
      const shape1Size = 270;
      const shape1Opacity = 0.08 + Math.random() * 0.05; // 0.08-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeRight - shape1Size + 25,
        y: safeTop - shape1Size / 2,
        width: shape1Size,
        height: shape1Size,
        fillColor: hexToRgba(accentColorValue || fallbackAccent, shape1Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(32px)',
        rotation: 1 + Math.random() * 2, // 1-3 degrees
        scale: 1.02 + Math.random() * 0.03, // 1.02-1.05
        zIndex: -1
      });
      
      // Shape 2: Bottom-left corner
      const shape2Size = 230;
      const shape2Opacity = 0.07 + Math.random() * 0.06; // 0.07-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeLeft - shape2Size / 2,
        y: safeBottom - shape2Size / 2 + 25,
        width: shape2Size,
        height: shape2Size,
        fillColor: hexToRgba(secondaryColorValue, shape2Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(30px)',
        rotation: 1.8 + Math.random() * 1.2, // 1.8-3 degrees
        scale: 1.03 + Math.random() * 0.02, // 1.03-1.05
        zIndex: -1
      });
    };
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'center';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Add decorative shapes FIRST (so they appear behind)
    addDecorativeShapes();
    slide.background = fallbackBg;
    
    const startY = 120;
    const titleY = startY;
    const contentStartY = startY + 140;
    const columnWidth = 480;
    const columnGap = 80;
    const leftX = 100;
    const rightX = leftX + columnWidth + columnGap;
    const lineHeight = 32;
    const padding = 60;
    
    // Adjust title X position based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : padding);
    
    // Title with shadow
    const titleText = slideData.title || 'Slide';
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: titleText,
      content: titleText,
      fontSize: titleSizeValue,
      color: primaryColorValue,
      fontFamily: fontFamilyValue,
      fontWeight: fontWeightValue,
      fontStyle: 'normal',
      textAlign: titleAlignValue,
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
    });
    
    // Accent underline beneath title (40% of title width, centered)
    const titleWidth = titleText.length * (titleSizeValue * 0.6);
    const accentLineWidth = titleWidth * 0.4; // 40% of title width
    const accentLineX = titleAlignValue === 'center' ? 640 - (accentLineWidth / 2) :
                        (titleAlignValue === 'right' ? titleX + titleWidth - accentLineWidth : titleX);
    const accentLineY = titleY + titleSizeValue + 12;
    
    slide.elements.push({
      id: uid(),
      type: 'shape',
      shapeType: 'rounded-rectangle',
      x: accentLineX,
      y: accentLineY,
      width: accentLineWidth,
      height: 3.5, // 3-4px
      fillColor: primaryColorValue, // Use primary color for underline
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: '2px',
      rotation: 0,
      scale: 1
    });
    
    // Add vertical colored separator between columns
    const separatorX = leftX + columnWidth + (columnGap / 2);
    const separatorY = contentStartY - 20;
    const separatorHeight = 400;
    
    slide.elements.push({
      id: uid(),
      type: 'shape',
      shapeType: 'rounded-rectangle',
      x: separatorX - 2,
      y: separatorY,
      width: 4,
      height: separatorHeight,
      fillColor: hexToRgba(secondaryColorValue || fallbackAccent, 0.35),
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: '2px',
      rotation: 0,
      scale: 1
    });
    
    // Split body into two columns with styled containers
    if (slideData.body) {
      const bodyLines = slideData.body.split('\n').filter(l => l.trim());
      const midPoint = Math.ceil(bodyLines.length / 2);
      const leftColumn = bodyLines.slice(0, midPoint);
      const rightColumn = bodyLines.slice(midPoint);
      
      [leftColumn, rightColumn].forEach((column, colIdx) => {
        const xPos = colIdx === 0 ? leftX + padding : rightX + padding;
        const containerX = colIdx === 0 ? leftX : rightX;
        const containerHeight = column.length * lineHeight + (padding * 2);
        
        // Create glassmorphism container for each column
        slide.elements.push({
          id: uid(),
          type: 'shape',
          shapeType: 'rounded-rectangle',
          x: containerX,
          y: contentStartY - padding,
          width: columnWidth,
          height: containerHeight,
          fillColor: 'rgba(255, 255, 255, 0.55)',
          strokeColor: 'rgba(0, 0, 0, 0.08)',
          strokeWidth: 1,
          borderRadius: '18px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(16px)',
          filter: 'blur(0px)',
          rotation: 0,
          scale: 1
        });
        
        column.forEach((line, idx) => {
          const isBullet = line.trim().startsWith('•');
          slide.elements.push({
            id: uid(),
            type: 'text',
            x: isBullet ? xPos + 30 : xPos,
            y: contentStartY + (idx * lineHeight),
            text: line.trim(),
            content: line.trim(),
            fontSize: bodySizeValue - 2,
            color: textColorValue,
            fontFamily: fontFamilyValue,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: bodyAlignValue,
            underline: false,
            lineHeight: 1.4,
            listType: isBullet ? 'bullet' : null,
            rotation: 0,
            scale: 1
          });
        });
      });
    }
  }

  function createKeyPointsSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize) {
    // Extract design data EXCLUSIVELY from slideData.design object
    const design = slideData.design || {};
    const colors = design.colors || {};
    const fonts = design.fonts || {};
    
    // Read colors exclusively from design object
    const primaryColorValue = colors.primary || '#003e6a';
    const secondaryColorValue = colors.secondary || '#00aae7';
    const accentColorValue = colors.accent || '#006c35';
    const backgroundColorValue = colors.background || '#ffffff';
    const textColorValue = colors.text || '#1e293b';
    const textLightValue = colors.textLight || '#475569';
    
    // Fallback colors if theme has no custom design
    const fallbackBg = backgroundColorValue === '#ffffff' ? '#fdfdfd' : backgroundColorValue;
    const fallbackAccent = accentColorValue || '#3a77ff';
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
      if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${opacity})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Helper function to add decorative background shapes with safe zones
    const addDecorativeShapes = () => {
      const safeLeft = 140;
      const safeRight = 1280 - 140;
      const safeTop = 100;
      const safeBottom = 720 - 100;
      
      // Shape 1: Top-right corner
      const shape1Size = 250;
      const shape1Opacity = 0.09 + Math.random() * 0.04; // 0.09-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeRight - shape1Size + 35,
        y: safeTop - shape1Size / 2,
        width: shape1Size,
        height: shape1Size,
        fillColor: hexToRgba(accentColorValue || fallbackAccent, shape1Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(35px)',
        rotation: 1.5 + Math.random() * 1.5, // 1.5-3 degrees
        scale: 1.02 + Math.random() * 0.03, // 1.02-1.05
        zIndex: -1
      });
      
      // Shape 2: Bottom-left corner
      const shape2Size = 240;
      const shape2Opacity = 0.08 + Math.random() * 0.05; // 0.08-0.13
      slide.elements.push({
        id: uid(),
        type: 'shape',
        shapeType: 'circle',
        x: safeLeft - shape2Size / 2,
        y: safeBottom - shape2Size / 2 + 20,
        width: shape2Size,
        height: shape2Size,
        fillColor: hexToRgba(secondaryColorValue, shape2Opacity),
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: '50%',
        filter: 'blur(30px)',
        rotation: 1.2 + Math.random() * 1.8, // 1.2-3 degrees
        scale: 1.03 + Math.random() * 0.02, // 1.03-1.05
        zIndex: -1
      });
    };
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'center';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Add decorative shapes FIRST (so they appear behind)
    addDecorativeShapes();
    slide.background = fallbackBg;
    
    const startY = 150;
    const titleY = startY;
    const contentStartY = startY + 140;
    const lineHeight = 70;
    const padding = 60;
    
    // Adjust title X position based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : padding);
    const bodyX = bodyAlignValue === 'center' ? 640 : (bodyAlignValue === 'right' ? 1180 : padding);
    
    // Title with shadow
    const titleText = slideData.title || 'Key Points';
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: titleText,
      content: titleText,
      fontSize: titleSizeValue,
      color: primaryColorValue,
      fontFamily: fontFamilyValue,
      fontWeight: fontWeightValue,
      fontStyle: 'normal',
      textAlign: titleAlignValue,
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
    });
    
    // Accent underline beneath title (40% of title width, centered)
    const titleWidth = titleText.length * (titleSizeValue * 0.6);
    const accentLineWidth = titleWidth * 0.4; // 40% of title width
    const accentLineX = titleAlignValue === 'center' ? 640 - (accentLineWidth / 2) :
                        (titleAlignValue === 'right' ? titleX + titleWidth - accentLineWidth : titleX);
    const accentLineY = titleY + titleSizeValue + 12;
    
    slide.elements.push({
      id: uid(),
      type: 'shape',
      shapeType: 'rounded-rectangle',
      x: accentLineX,
      y: accentLineY,
      width: accentLineWidth,
      height: 3.5, // 3-4px
      fillColor: primaryColorValue, // Use primary color for underline
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: '2px',
      rotation: 0,
      scale: 1
    });
    
    // Key points (centered, larger) - use bodySize + 4 for each bullet with icons
    if (slideData.body) {
      const bodyLines = slideData.body.split('\n').filter(l => l.trim());
      bodyLines.forEach((line, idx) => {
        const cleanLine = line.replace(/^[•\-\d+\.\)]\s*/, '');
        const pointY = contentStartY + (idx * lineHeight);
        const iconSize = 24;
        const iconX = bodyAlignValue === 'center' ? 640 - 400 : (bodyAlignValue === 'right' ? 1180 - 400 : padding);
        const textX = iconX + iconSize + 20;
        
        // Checkmark icon (circle with accent color)
        slide.elements.push({
          id: uid(),
          type: 'shape',
          shapeType: 'circle',
          x: iconX,
          y: pointY - 2,
          width: iconSize,
          height: iconSize,
          fillColor: hexToRgba(accentColorValue || fallbackAccent, 0.18),
          strokeColor: accentColorValue || fallbackAccent,
          strokeWidth: 2,
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          rotation: 0,
          scale: 1.05
        });
        
        // Glassmorphism container for each key point
        const containerWidth = 900;
        const containerHeight = lineHeight - 10;
        const containerX = bodyAlignValue === 'center' ? 640 - (containerWidth / 2) :
                            (bodyAlignValue === 'right' ? 1180 - containerWidth : padding);
        
        slide.elements.push({
          id: uid(),
          type: 'shape',
          shapeType: 'rounded-rectangle',
          x: containerX,
          y: pointY - 10,
          width: containerWidth,
          height: containerHeight,
          fillColor: 'rgba(255, 255, 255, 0.55)',
          strokeColor: 'rgba(0, 0, 0, 0.08)',
          strokeWidth: 1,
          borderRadius: '18px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(16px)',
          filter: 'blur(0px)',
          rotation: 0,
          scale: 1
        });
        
        // Key point text
        slide.elements.push({
          id: uid(),
          type: 'text',
          x: textX,
          y: pointY,
          text: cleanLine,
          content: cleanLine,
          fontSize: bodySizeValue + 4,
          color: textColorValue,
          fontFamily: fontFamilyValue,
          fontWeight: '600',
          fontStyle: 'normal',
          textAlign: bodyAlignValue,
          underline: false,
          lineHeight: 1.4,
          listType: null,
          rotation: 0,
          scale: 1
        });
      });
    }
  }

  function createSummarySlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize) {
    // Summary slides use content slide layout but with enhanced visual design
    // The createContentSlide function already adds styled containers and decorative elements
    createContentSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
    
    // Additional summary-specific enhancements: add highlight accent boxes
    const design = slideData.design || {};
    const colors = design.colors || {};
    const accentColorValue = colors.accent || '#006c35';
    const fallbackAccent = accentColorValue || '#3a77ff';
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
      if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${opacity})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Add highlight accent boxes around summary containers for visual emphasis
    if (slideData.body) {
      const paragraphs = slideData.body.split(/\n\n+/).filter(p => p.trim());
      if (paragraphs.length === 0) {
        paragraphs.push(slideData.body);
      }
      
      paragraphs.forEach((paragraph, paraIdx) => {
        const cleanPara = paragraph.trim().replace(/\n/g, ' ');
        const estimatedLines = Math.ceil(cleanPara.length / 80);
        const containerHeight = Math.max(estimatedLines * 40 + 60, 80);
        const containerWidth = Math.min(1000, 1080);
        const containerX = 640 - (containerWidth / 2);
        const containerY = 220 + (paraIdx * (containerHeight + 60));
        
        // Add highlight accent box behind container
        slide.elements.push({
          id: uid(),
          type: 'shape',
          shapeType: 'rounded-rectangle',
          x: containerX - 8,
          y: containerY - 8,
          width: containerWidth + 16,
          height: containerHeight + 16,
          fillColor: hexToRgba(fallbackAccent, 0.05),
          strokeColor: hexToRgba(fallbackAccent, 0.2),
          strokeWidth: 2,
          borderRadius: '16px'
        });
      });
    }
  }

  function createImageTextSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize) {
    // Extract design data EXCLUSIVELY from slideData.design object
    const design = slideData.design || {};
    const colors = design.colors || {};
    
    // Read background color exclusively from design object
    const backgroundColorValue = colors.background || '#ffffff';
    
    // Fallback colors if theme has no custom design
    const fallbackBg = backgroundColorValue === '#ffffff' ? '#fdfdfd' : backgroundColorValue;
    
    // Apply background color
    slide.background = fallbackBg;
    
    // Apply title and body styles just like content slides (will read from slideData.design)
    // This already includes styled containers, decorative bars, and visual design elements
    createContentSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
    
    // Image support can be added later - for now, slides have full visual design from createContentSlide
  }
  
  // Drawing interface event handlers
  const drawingToolbar = document.getElementById('drawing-toolbar');
  const drawingToolbarClose = document.getElementById('drawing-toolbar-close');
  const drawingColorPanel = document.getElementById('drawing-color-panel');
  const drawingToolButtons = document.querySelectorAll('.drawing-tool-btn');
  const colorSwatches = document.querySelectorAll('.color-swatch[data-color]');
  const addColorBtn = document.querySelector('.color-swatch.add-color');
  const colorPaletteBtn = document.getElementById('color-picker-btn');
  const colorPickerModal = document.getElementById('color-picker-modal');
  const colorPickerClose = document.getElementById('color-picker-close');
  const fullColorPicker = document.getElementById('full-color-picker');
  const colorHexInput = document.getElementById('color-hex-input');
  const colorPreviewBox = document.getElementById('color-preview-box');
  const colorPickerApply = document.getElementById('color-picker-apply');

  // Close drawing toolbar
  drawingToolbarClose?.addEventListener('click', () => {
    deactivateCanvaDrawingMode();
  });

  // Tool selection
  drawingToolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.drawTool;
      if (tool) {
        activateDrawingTool(tool);
      }
    });
  });

  // Color selection
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      if (color) {
        // Remove active from all swatches
        colorSwatches.forEach(s => s.classList.remove('active'));
        // Add active to clicked swatch
        swatch.classList.add('active');
        // Update current draw color
        currentDrawColor = color;
        // Update color palette circle
        if (colorPaletteBtn) {
          const circle = colorPaletteBtn.querySelector('.color-palette-circle');
          if (circle) {
            circle.style.background = color;
          }
        }
      }
    });
  });

  // Add color button
  addColorBtn?.addEventListener('click', () => {
    if (colorPickerModal) {
      colorPickerModal.classList.remove('hidden');
      // Set current color in picker
      if (fullColorPicker) {
        fullColorPicker.value = currentDrawColor;
      }
      if (colorHexInput) {
        colorHexInput.value = currentDrawColor;
      }
      if (colorPreviewBox) {
        colorPreviewBox.style.background = currentDrawColor;
      }
    }
  });

  // Color palette button
  colorPaletteBtn?.addEventListener('click', () => {
    if (colorPickerModal) {
      colorPickerModal.classList.remove('hidden');
      // Set current color in picker
      if (fullColorPicker) {
        fullColorPicker.value = currentDrawColor;
      }
      if (colorHexInput) {
        colorHexInput.value = currentDrawColor;
      }
      if (colorPreviewBox) {
        colorPreviewBox.style.background = currentDrawColor;
      }
    }
  });

  // Close color picker modal
  colorPickerClose?.addEventListener('click', () => {
    if (colorPickerModal) {
      colorPickerModal.classList.add('hidden');
    }
  });

  // Update color preview when picker changes
  fullColorPicker?.addEventListener('input', (e) => {
    const color = e.target.value;
    if (colorHexInput) {
      colorHexInput.value = color;
    }
    if (colorPreviewBox) {
      colorPreviewBox.style.background = color;
    }
  });

  // Update color from hex input
  colorHexInput?.addEventListener('input', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      if (fullColorPicker) {
        fullColorPicker.value = color;
      }
      if (colorPreviewBox) {
        colorPreviewBox.style.background = color;
      }
    }
  });

  // Apply color from picker
  colorPickerApply?.addEventListener('click', () => {
    const color = fullColorPicker?.value || currentDrawColor;
    currentDrawColor = color;
    
    // Update active swatch if color matches
    colorSwatches.forEach(swatch => {
      if (swatch.dataset.color === color) {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      }
    });
    
    // Update color palette circle
    if (colorPaletteBtn) {
      const circle = colorPaletteBtn.querySelector('.color-palette-circle');
      if (circle) {
        circle.style.background = color;
      }
    }
    
    // Close modal
    if (colorPickerModal) {
      colorPickerModal.classList.add('hidden');
    }
  });

  // Close modal when clicking outside
  colorPickerModal?.addEventListener('click', (e) => {
    if (e.target === colorPickerModal) {
      colorPickerModal.classList.add('hidden');
    }
  });

  // Sticky notes event handlers
  const stickyNotesPanel = document.getElementById('sticky-notes-panel');
  const stickyNotesClose = document.getElementById('sticky-notes-close');
  const stickyColorButtons = document.querySelectorAll('.sticky-color-btn');

  // Close sticky notes panel
  stickyNotesClose?.addEventListener('click', () => {
    hideStickyNotesPanel();
  });

  // Sticky color selection
  stickyColorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      if (color) {
        insertStickyNote(color);
      }
    });
  });

  // Close sticky notes panel when clicking outside
  document.addEventListener('click', (e) => {
    if (stickyNotesPanel && !stickyNotesPanel.classList.contains('hidden')) {
      const clickedStickyTrigger = toolsSidebarItem ? toolsSidebarItem.contains(e.target) : false;
      if (!stickyNotesPanel.contains(e.target) && !clickedStickyTrigger) {
        hideStickyNotesPanel();
      }
    }
  });

  // Reposition sticky notes panel on resize
  window.addEventListener('resize', () => {
    if (stickyNotesPanel && !stickyNotesPanel.classList.contains('hidden')) {
      positionStickyNotesPanel();
    }
  });

  // Upload button event listener
  const uploadSidebarItem = document.querySelector('.sidebar-item[title="Upload"]');
  uploadSidebarItem?.addEventListener('click', () => {
    openFileUpload();
  });

  // Charts event handlers
  const chartsPanel = document.getElementById('charts-panel');
  const chartsClose = document.getElementById('charts-close');
  const chartOptionButtons = document.querySelectorAll('.chart-option-btn');
  const chartsSidebarItem = document.querySelector('.sidebar-item[title="Charts"]');

  // Close charts panel
  chartsClose?.addEventListener('click', () => {
    hideChartsPanel();
  });

  // Chart type selection - show editor instead of inserting directly
  let selectedChartType = null;
  chartOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const chartType = btn.dataset.chartType;
      if (chartType) {
        selectedChartType = chartType;
        showChartEditor(chartType);
      }
    });
  });

  // Charts sidebar item click
  chartsSidebarItem?.addEventListener('click', () => {
    showChartsView();
  });

  // Close charts panel when clicking outside
  document.addEventListener('click', (e) => {
    if (chartsPanel && !chartsPanel.classList.contains('hidden')) {
      const clickedChartsTrigger = chartsSidebarItem ? chartsSidebarItem.contains(e.target) : false;
      if (!chartsPanel.contains(e.target) && !clickedChartsTrigger) {
        hideChartsPanel();
      }
    }
  });

  // Reposition charts panel on resize
  window.addEventListener('resize', () => {
    if (chartsPanel && !chartsPanel.classList.contains('hidden')) {
      positionChartsPanel();
    }
  });

  // Chart Editor handlers
  const chartEditorBack = document.getElementById('chart-editor-back');
  const chartEditorApply = document.getElementById('chart-editor-apply');

  chartEditorBack?.addEventListener('click', () => {
    const chartTypeSelection = document.getElementById('chart-type-selection');
    const chartEditorPanel = document.getElementById('chart-editor-panel');
    const chartsPanelTitle = document.getElementById('charts-panel-title');
    
    if (chartTypeSelection) chartTypeSelection.classList.remove('hidden');
    if (chartEditorPanel) chartEditorPanel.classList.add('hidden');
    if (chartsPanelTitle) chartsPanelTitle.textContent = 'Choose Chart Type';
  });

  chartEditorApply?.addEventListener('click', () => {
    if (selectedChartType) {
      insertChart(selectedChartType);
    }
  });

  // Slide controls event handlers
  const slideControlAdd = document.getElementById('slide-control-add');
  const slideControlDuplicate = document.getElementById('slide-control-duplicate');
  const slideControlDelete = document.getElementById('slide-control-delete');
  const slideControlCopy = document.getElementById('slide-control-copy');
  const slideZoomIn = document.getElementById('slide-zoom-in');
  const slideZoomOut = document.getElementById('slide-zoom-out');

  // Add blank slide
  slideControlAdd?.addEventListener('click', () => {
    addSlide();
    saveState();
  });

  // Duplicate slide
  slideControlDuplicate?.addEventListener('click', () => {
    dupSlide();
    saveState();
  });

  // Delete slide
  slideControlDelete?.addEventListener('click', () => {
    if (state.slides.length <= 1) {
      alert('Cannot delete the last slide.');
      return;
    }
    if (confirm('Are you sure you want to delete this slide?')) {
      deleteSlide();
      saveState();
    }
  });

  // Copy slide
  slideControlCopy?.addEventListener('click', () => {
    copySlide();
  });

  // Zoom controls
  slideZoomIn?.addEventListener('click', () => {
    zoomSlideIn();
  });

  slideZoomOut?.addEventListener('click', () => {
    zoomSlideOut();
  });

  // Initialize zoom display
  updateSlideZoom(slideZoomLevel);

  // Presentation Mode
  const presentationMode = document.getElementById('presentation-mode');
  const presentBtn = document.getElementById('present-btn');
  const presentationSlide = document.getElementById('presentation-slide');
  const presentationSlideInfo = document.getElementById('presentation-slide-info');
  const presentationPrev = document.getElementById('presentation-prev');
  const presentationNext = document.getElementById('presentation-next');
  const presentationExit = document.getElementById('presentation-exit');
  let presentationSlideIndex = 0;

  function enterPresentationMode() {
    if (!presentationMode || !presentationSlide) return;
    presentationSlideIndex = state.currentSlideIndex;
    presentationMode.classList.remove('hidden');
    renderPresentationSlide();
    updatePresentationInfo();
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  function exitPresentationMode() {
    if (!presentationMode) return;
    presentationMode.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function renderPresentationSlide() {
    if (!presentationSlide || !state.slides[presentationSlideIndex]) return;
    const slide = state.slides[presentationSlideIndex];
    
    // Create a container for the presentation slide
    const slideEl = document.createElement('div');
    slideEl.style.width = '100%';
    slideEl.style.height = '100%';
    slideEl.style.position = 'relative';
    slideEl.style.background = slide.background || '#ffffff';
    slideEl.style.overflow = 'hidden';
    
    // Render slide elements (similar to renderStage but read-only)
    slide.elements.forEach((el) => {
      if (el.type === 'text') {
        const node = document.createElement('div');
        node.className = 'el text';
        node.style.position = 'absolute';
        node.style.left = (el.x / 1280 * 100) + '%';
        node.style.top = (el.y / 720 * 100) + '%';
        node.style.fontSize = (el.fontSize || 18) + 'px';
        node.style.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
        node.style.color = el.color || '#111';
        node.style.fontWeight = el.fontWeight || 'normal';
        node.style.fontStyle = el.fontStyle || 'normal';
        node.style.textDecoration = el.underline ? 'underline' : 'none';
        node.style.textAlign = el.textAlign || 'left';
        node.style.lineHeight = el.lineHeight ? String(el.lineHeight) : '1.2';
        node.style.backgroundColor = el.fillColor || 'transparent';
        // Support text shadow for enhanced visuals
        if (el.textShadow) {
          node.style.textShadow = el.textShadow;
        }
        // Support box shadow for text containers
        if (el.boxShadow) {
          node.style.boxShadow = el.boxShadow;
        }
        // Support transform for rotation and scale
        if (el.rotation || el.scale) {
          const rotation = el.rotation || 0;
          const scale = el.scale || 1;
          node.style.transform = `rotate(${rotation}deg) scale(${scale})`;
          node.style.transformOrigin = 'center center';
        }
        node.innerHTML = el.content || el.text || '';
        node.style.pointerEvents = 'none';
        slideEl.appendChild(node);
      } else if (el.type === 'shape') {
        const node = document.createElement('div');
        node.className = 'el shape';
        node.style.position = 'absolute';
        node.style.left = (el.x / 1280 * 100) + '%';
        node.style.top = (el.y / 720 * 100) + '%';
        node.style.width = (el.width / 1280 * 100) + '%';
        node.style.height = (el.height / 720 * 100) + '%';
        node.style.backgroundColor = el.fillColor || 'transparent';
        node.style.border = `${el.strokeWidth || 1}px solid ${el.strokeColor || 'transparent'}`;
        // Support borderRadius property, or default based on shapeType
        const borderRadius = el.borderRadius || (el.shapeType === 'rounded-rectangle' ? '12px' : (el.shapeType === 'circle' ? '50%' : '0'));
        node.style.borderRadius = borderRadius;
        // Support z-index for layering (decorative shapes behind content)
        if (el.zIndex !== undefined) {
          node.style.zIndex = el.zIndex;
        }
        // Support box shadow for depth
        if (el.boxShadow) {
          node.style.boxShadow = el.boxShadow;
        }
        // Support blur/filter effects for glassmorphism
        if (el.filter) {
          node.style.filter = el.filter;
        }
        if (el.backdropFilter) {
          node.style.backdropFilter = el.backdropFilter;
          node.style.webkitBackdropFilter = el.backdropFilter;
        }
        // Support transform for rotation and scale
        if (el.rotation || el.scale) {
          const rotation = el.rotation || 0;
          const scale = el.scale || 1;
          node.style.transform = `rotate(${rotation}deg) scale(${scale})`;
          node.style.transformOrigin = 'center center';
        }
        node.style.pointerEvents = 'none';
        slideEl.appendChild(node);
      } else if (el.type === 'line') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', el.path || '');
        path.setAttribute('stroke', el.color || '#000');
        path.setAttribute('stroke-width', (el.width || 2) + '');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
        slideEl.appendChild(svg);
      } else if (el.type === 'drawing') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        if (el.paths && Array.isArray(el.paths)) {
          el.paths.forEach(pathData => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData.d || '');
            path.setAttribute('stroke', pathData.color || '#000');
            path.setAttribute('stroke-width', (pathData.width || 3) + '');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
          });
        }
        slideEl.appendChild(svg);
      } else if (el.type === 'image') {
        const img = document.createElement('img');
        img.style.position = 'absolute';
        img.style.left = (el.x / 1280 * 100) + '%';
        img.style.top = (el.y / 720 * 100) + '%';
        img.style.width = (el.width / 1280 * 100) + '%';
        img.style.height = (el.height / 720 * 100) + '%';
        img.style.objectFit = 'contain';
        img.src = el.src || '';
        img.style.pointerEvents = 'none';
        slideEl.appendChild(img);
      } else if (el.type === 'sticky') {
        const sticky = document.createElement('div');
        sticky.className = 'el sticky';
        sticky.style.position = 'absolute';
        sticky.style.left = (el.x / 1280 * 100) + '%';
        sticky.style.top = (el.y / 720 * 100) + '%';
        sticky.style.width = (el.width / 1280 * 100) + '%';
        sticky.style.height = (el.height / 720 * 100) + '%';
        sticky.style.backgroundColor = el.color || '#fef08a';
        sticky.style.borderRadius = '4px';
        sticky.style.padding = '8px';
        sticky.style.fontSize = '14px';
        sticky.innerHTML = el.text || '';
        sticky.style.pointerEvents = 'none';
        slideEl.appendChild(sticky);
      } else if (el.type === 'chart') {
        const chartContainer = document.createElement('div');
        chartContainer.style.position = 'absolute';
        chartContainer.style.left = (el.x / 1280 * 100) + '%';
        chartContainer.style.top = (el.y / 720 * 100) + '%';
        chartContainer.style.width = (el.width / 1280 * 100) + '%';
        chartContainer.style.height = (el.height / 720 * 100) + '%';
        if (el.svg) {
          chartContainer.innerHTML = el.svg;
        }
        chartContainer.style.pointerEvents = 'none';
        slideEl.appendChild(chartContainer);
      }
    });
    
    presentationSlide.innerHTML = '';
    presentationSlide.appendChild(slideEl);
  }

  function updatePresentationInfo() {
    if (presentationSlideInfo) {
      presentationSlideInfo.textContent = `${presentationSlideIndex + 1} / ${state.slides.length}`;
    }
  }

  function goToPresentationSlide(index) {
    if (index < 0 || index >= state.slides.length) return;
    presentationSlideIndex = index;
    renderPresentationSlide();
    updatePresentationInfo();
  }

  presentBtn?.addEventListener('click', enterPresentationMode);
  presentationExit?.addEventListener('click', exitPresentationMode);
  presentationPrev?.addEventListener('click', () => {
    if (presentationSlideIndex > 0) {
      goToPresentationSlide(presentationSlideIndex - 1);
    }
  });
  presentationNext?.addEventListener('click', () => {
    if (presentationSlideIndex < state.slides.length - 1) {
      goToPresentationSlide(presentationSlideIndex + 1);
    }
  });
  
  // Keyboard navigation in presentation mode
  document.addEventListener('keydown', (e) => {
    if (presentationMode && !presentationMode.classList.contains('hidden')) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (presentationSlideIndex < state.slides.length - 1) {
          goToPresentationSlide(presentationSlideIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (presentationSlideIndex > 0) {
          goToPresentationSlide(presentationSlideIndex - 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        exitPresentationMode();
      }
    }
  });

  // Export Menu
  const exportBtn = document.getElementById('export-btn');
  const exportMenu = document.getElementById('export-menu');
  const exportShareLink = document.getElementById('export-share-link');
  const exportPDF = document.getElementById('export-pdf');
  const exportPowerPoint = document.getElementById('export-powerpoint');
  const exportPNG = document.getElementById('export-png');

  function toggleExportMenu() {
    if (exportMenu) {
      exportMenu.classList.toggle('hidden');
    }
  }

  function closeExportMenu() {
    if (exportMenu) {
      exportMenu.classList.add('hidden');
    }
  }

  exportBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleExportMenu();
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (exportMenu && !exportMenu.classList.contains('hidden')) {
      if (!exportMenu.contains(e.target) && !exportBtn?.contains(e.target)) {
        closeExportMenu();
      }
    }
  });

  // Export functions
  exportShareLink?.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link:', url);
    });
    closeExportMenu();
  });

  exportPDF?.addEventListener('click', () => {
    alert('PDF export functionality will be implemented soon.');
    closeExportMenu();
  });

  exportPowerPoint?.addEventListener('click', () => {
    alert('PowerPoint export functionality will be implemented soon.');
    closeExportMenu();
  });

  exportPNG?.addEventListener('click', () => {
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return;
    
    // Create a canvas to render the slide
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = slide.background || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Note: Full rendering would require more complex implementation
    // This is a placeholder
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slide-${state.currentSlideIndex + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    closeExportMenu();
  });

  // Initial render and state save
  renderAll();
  saveState();
  updateUndoRedoButtons();
})();


