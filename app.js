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

  // Undo/Redo stack
  const history = {
    stack: [JSON.stringify(state)],
    pointer: 0
  };

  function saveState() {
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
      updateUndoRedoButtons();
    }
  }

  function redo() {
    if (history.pointer < history.stack.length - 1) {
      history.pointer++;
      const saved = JSON.parse(history.stack[history.pointer]);
      Object.assign(state, saved);
      renderAll();
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
          t.textContent = (el.text || 'Text').substring(0, 20);
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
          if (el.shape === 'circle') s.style.borderRadius = '50%';
          inner.appendChild(s);
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
        node.style.backgroundColor = el.fillColor || 'transparent';
        node.style.border = `${el.strokeWidth || 1}px ${el.strokeDash === 'dashed' ? 'dashed' : el.strokeDash === 'dotted' ? 'dotted' : 'solid'} ${el.strokeColor || 'transparent'}`;
        node.textContent = el.text || 'Double-click to edit';
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'text';

        node.addEventListener('input', () => {
          el.text = node.textContent || '';
          saveState();
          renderSidebar();
        });

        // Selection and drag
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        let dragStartTime = 0;
        let dragStartPos = { x: 0, y: 0 };
        
        node.addEventListener('mousedown', (e) => {
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
          e.preventDefault();
        });
        
        // Double click to edit
        node.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          node.focus();
          const range = document.createRange();
          range.selectNodeContents(node);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
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
            el.x = Math.max(0, Math.min(1280 - 20, origX + dx));
            el.y = Math.max(0, Math.min(720 - 20, origY + dy));
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
          }
        };
        
        const handleMouseUp = () => {
          if (dragging) {
            dragging = false;
            saveState();
            renderSidebar();
          } else if (dragStartTime > 0) {
            // Single click - focus for editing
            setTimeout(() => {
              if (!dragging) {
                node.focus();
              }
            }, 100);
          }
          dragStartTime = 0;
          if (node) {
            node.style.cursor = 'text';
            node.style.userSelect = 'text';
          }
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
        if (el.shape === 'circle') node.style.borderRadius = '50%';
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'pointer';
        
        node.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(node);
          e.stopPropagation();
        });
        
        stageEl.appendChild(node);
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
    if (fillColor) fillColor.value = el.fillColor || '#ffffff';
    if (strokeColor) strokeColor.value = el.strokeColor || '#000000';
    if (strokeWidth) strokeWidth.value = String(el.strokeWidth || 1);
    if (strokeDash) strokeDash.value = el.strokeDash || 'solid';
  }

  function renderAll() {
    // Update page numbers on all slides before rendering
    state.slides.forEach((slide, idx) => {
      slide.elements.forEach(el => {
        if (el.isPageNumber) {
          el.text = String(idx + 1);
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
      fontWeight: 'bold'
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    // Focus the newly created element
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        node.focus();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
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
      fontWeight: '600'
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    // Focus the newly created element
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        node.focus();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
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
      fontWeight: 'normal'
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    // Focus the newly created element
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        node.focus();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
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
    positionPanel();
  }

  function hideTextPanel() {
    if (!textOptionsPanel) return;
    textOptionsPanel.classList.add('hidden');
    textOptionsPanel.classList.remove('page-number-active');
    showTextOptionsView();
  }

  function positionPanel() {
    if (!textSidebarItem || !textOptionsPanel) return;
    const rect = textSidebarItem.getBoundingClientRect();
    textOptionsPanel.style.top = `${rect.top}px`;
    textOptionsPanel.style.left = `${rect.right + 12}px`;
  }

  if (textSidebarItem && textOptionsPanel) {
    textSidebarItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      positionPanel();
      const isHidden = textOptionsPanel.classList.contains('hidden');
      if (isHidden) {
        textOptionsPanel.classList.remove('hidden');
        showTextOptionsView();
      } else {
        textOptionsPanel.classList.add('hidden');
      }
    });
  }

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
    if (textOptionsPanel && !textOptionsPanel.contains(e.target) && !textSidebarItem.contains(e.target)) {
      hideTextPanel();
    }
  });

  window.addEventListener('resize', () => {
    if (!textOptionsPanel || textOptionsPanel.classList.contains('hidden')) return;
    positionPanel();
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
      } else {
        hideContextToolbar();
      }
    });
  }

  function pasteFromClipboard() {
    if (!clipboardElement) return;
    const slide = state.slides[state.currentSlideIndex];
    const newEl = JSON.parse(JSON.stringify(clipboardElement));
    newEl.id = uid();
    newEl.x = (newEl.x || 0) + 20;
    newEl.y = (newEl.y || 0) + 20;
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
        newEl.x = (newEl.x || 0) + 20;
        newEl.y = (newEl.y || 0) + 20;
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
        const bounds = selected.getBoundingClientRect();
        el.x = (stageWidth - bounds.width) / 2;
        el.y = (stageHeight - bounds.height) / 2;
        saveState();
        renderAll();
        reselectElement(elId);
        break;
      }
      case 'to-page': {
        const stageWidth = 1280;
        const stageHeight = 720;
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
      document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
      hideContextToolbar();
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

  // Initial render and state save
  renderAll();
  saveState();
  updateUndoRedoButtons();
})();


