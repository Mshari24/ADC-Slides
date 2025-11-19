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

  const persisted = loadPersistedState();
  if (persisted) {
    Object.assign(state, persisted);
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
    stageEl.innerHTML = '';
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
  const toolsShapesBackBtn = document.getElementById('tools-shapes-back');
  const toolsLinesBackBtn = document.getElementById('tools-lines-back');
  const toolsTablesBackBtn = document.getElementById('tools-tables-back');
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
    if (!toolsPanel.classList.contains('hidden')) {
      requestAnimationFrame(() => positionToolsPanel());
    }
  }

  function showShapesView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('shapes-active');
    toolsPanel.classList.remove('lines-active');
    toolsPanel.classList.remove('tables-active');
    requestAnimationFrame(() => positionToolsPanel());
  }

  function showLinesView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('lines-active');
    toolsPanel.classList.remove('shapes-active');
    toolsPanel.classList.remove('tables-active');
    requestAnimationFrame(() => positionToolsPanel());
  }

  function showTablesView() {
    if (!toolsPanel) return;
    toolsPanel.classList.add('tables-active');
    toolsPanel.classList.remove('shapes-active');
    toolsPanel.classList.remove('lines-active');
    requestAnimationFrame(() => positionToolsPanel());
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
        notifyComingSoon('Drawing tool is coming soon.');
        break;
      case 'shapes':
        showShapesView();
        return;
      case 'line':
        showLinesView();
        return;
      case 'sticky':
        notifyComingSoon('Sticky notes are coming soon.');
        break;
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
        const lineType = lineBtn.dataset.lineType || 'straight';
        console.log('Inserting line type:', lineType); // Debug log
        insertLine(lineType);
        hideToolsPanel();
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
      const lineType = btn.dataset.lineType || 'straight';
      console.log('Direct listener - Inserting line type:', lineType); // Debug log
      insertLine(lineType);
      hideToolsPanel();
    });
  });

  toolsLinesBackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showToolsMainView();
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
  });

  window.addEventListener('resize', () => {
    if (textOptionsPanel && !textOptionsPanel.classList.contains('hidden')) {
      positionTextPanel();
    }
    if (toolsPanel && !toolsPanel.classList.contains('hidden')) {
      positionToolsPanel();
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

  // Click on stage to deselect
  stageEl.addEventListener('click', (e) => {
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
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'center';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Apply background color
    slide.background = backgroundColorValue;
    
    const titleY = 250;
    const subtitleY = 350;
    
    // Adjust title X position based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : 100);
    const bodyX = bodyAlignValue === 'center' ? 640 : (bodyAlignValue === 'right' ? 1180 : 100);
    
    // Main title
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: slideData.title || 'Title',
      content: slideData.title || 'Title',
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
      scale: 1
    });
    
    // Subtitle/body if provided
    if (slideData.body) {
      const bodyLines = slideData.body.split('\n').filter(l => l.trim());
      bodyLines.forEach((line, idx) => {
        slide.elements.push({
          id: uid(),
          type: 'text',
          x: bodyX,
          y: subtitleY + (idx * 50),
          text: line.trim(),
          content: line.trim(),
          fontSize: bodySizeValue,
          color: textColorValue,
          fontFamily: fontFamilyValue,
          fontWeight: 'normal',
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
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'left';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Apply background color
    slide.background = backgroundColorValue;
    
    const startY = 100;
    const titleY = startY;
    const contentStartY = startY + 90;
    const maxWidth = 1080; // Leave margins
    const lineHeight = 32; // Tighter spacing for paragraphs
    
    // Adjust positioning based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : 100);
    const bodyX = bodyAlignValue === 'center' ? 640 : (bodyAlignValue === 'right' ? 1180 : 100);
    
    // Slide title
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: slideData.title || 'Slide',
      content: slideData.title || 'Slide',
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
      scale: 1
    });
    
    // Body content - handle as paragraphs, not line-by-line
    if (slideData.body) {
      // Split into paragraphs (by double newlines or long sentences)
      const paragraphs = slideData.body.split(/\n\n+/).filter(p => p.trim());
      if (paragraphs.length === 0) {
        paragraphs.push(slideData.body);
      }
      
      let currentY = contentStartY;
      
      paragraphs.forEach((paragraph, paraIdx) => {
        // Clean paragraph text
        const cleanPara = paragraph.trim().replace(/\n/g, ' ');
        
        // Split long paragraphs into manageable chunks (max ~600 chars per element)
        const maxChars = 600;
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
                y: currentY,
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
              
              currentY += Math.ceil(currentChunk.length / 80) * (lineHeight * 1.6); // Estimate height
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
              y: currentY,
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
            
            currentY += Math.ceil(currentChunk.length / 80) * (lineHeight * 1.6);
          }
        } else {
          // Single paragraph element
          slide.elements.push({
            id: uid(),
            type: 'text',
            x: bodyX,
            y: currentY,
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
          
          // Estimate height: ~80 chars per line, lineHeight * 1.6
          currentY += Math.ceil(cleanPara.length / 80) * (lineHeight * 1.6);
        }
        
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
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'center';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Apply background color
    slide.background = backgroundColorValue;
    
    const startY = 120;
    const titleY = startY;
    const contentStartY = startY + 100;
    const columnWidth = 500;
    const columnGap = 80;
    const leftX = 100;
    const rightX = leftX + columnWidth + columnGap;
    const lineHeight = 32;
    
    // Adjust title X position based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : 100);
    
    // Title - use primaryColor for headings
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: slideData.title || 'Slide',
      content: slideData.title || 'Slide',
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
      scale: 1
    });
    
    // Split body into two columns
    if (slideData.body) {
      const bodyLines = slideData.body.split('\n').filter(l => l.trim());
      const midPoint = Math.ceil(bodyLines.length / 2);
      const leftColumn = bodyLines.slice(0, midPoint);
      const rightColumn = bodyLines.slice(midPoint);
      
      [leftColumn, rightColumn].forEach((column, colIdx) => {
        const xPos = colIdx === 0 ? leftX : rightX;
        column.forEach((line, idx) => {
          const isBullet = line.trim().startsWith('•');
          slide.elements.push({
            id: uid(),
            type: 'text',
            x: isBullet ? xPos + 40 : xPos,
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
    
    // Read fonts exclusively from design object
    const fontFamilyValue = fonts.family || 'Inter, system-ui, sans-serif';
    const titleSizeValue = fonts.titleSize || 48;
    const bodySizeValue = fonts.bodySize || 24;
    const titleAlignValue = fonts.titleAlign || 'center';
    const bodyAlignValue = fonts.bodyAlign || 'left';
    const fontWeightValue = fonts.fontWeight || 'bold';
    
    // Apply background color
    slide.background = backgroundColorValue;
    
    const startY = 150;
    const titleY = startY;
    const contentStartY = startY + 90;
    const lineHeight = 50;
    
    // Adjust title X position based on alignment
    const titleX = titleAlignValue === 'center' ? 640 : (titleAlignValue === 'right' ? 1180 : 100);
    const bodyX = bodyAlignValue === 'center' ? 640 : (bodyAlignValue === 'right' ? 1180 : 100);
    
    // Title - use titleSize for the title
    slide.elements.push({
      id: uid(),
      type: 'text',
      x: titleX,
      y: titleY,
      text: slideData.title || 'Key Points',
      content: slideData.title || 'Key Points',
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
      scale: 1
    });
    
    // Key points (centered, larger) - use bodySize + 4 for each bullet
    if (slideData.body) {
      const bodyLines = slideData.body.split('\n').filter(l => l.trim());
      bodyLines.forEach((line, idx) => {
        const cleanLine = line.replace(/^[•\-\d+\.\)]\s*/, '');
        slide.elements.push({
          id: uid(),
          type: 'text',
          x: bodyX,
          y: contentStartY + (idx * lineHeight),
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
    // Summary slides behave like content slides but with the same design settings
    createContentSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
  }

  function createImageTextSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize) {
    // Extract design data EXCLUSIVELY from slideData.design object
    const design = slideData.design || {};
    const colors = design.colors || {};
    
    // Read background color exclusively from design object
    const backgroundColorValue = colors.background || '#ffffff';
    
    // Apply background color
    slide.background = backgroundColorValue;
    
    // Apply title and body styles just like content slides (will read from slideData.design)
    createContentSlide(slide, slideData, primaryColor, textColor, fontFamily, titleSize, bodySize);
    // Image support can be added later
  }
  
  
  // Initial render and state save
  renderAll();
  saveState();
  updateUndoRedoButtons();
})();


