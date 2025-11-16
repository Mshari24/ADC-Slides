// Minimal Slides Clone: very basic deck with add/select slides and editable text boxes

(function () {
  // Storage key for slide page presentation data
  const LOCAL_STORAGE_KEY = 'slidePagePresentationData';
  
  // Build the full presentation object for saving
  function buildPresentationData() {
    return {
      // List of slide objects
      slides: state.slides.map((slide, index) => ({
        slideId: slide.id, // Unique slide identifier
        index: index, // Slide order
        // List of element objects
        elements: slide.elements.map(el => {
          // Common properties for all elements
          const elementData = {
            elementId: el.id, // Unique element identifier
            type: el.type, // "text", "shape", or "image"
            slideId: slide.id, // Which slide this element belongs to
            position: { x: el.x, y: el.y }, // Position on canvas
            width: el.width,
            height: el.height,
            rotation: el.rotation || 0,
            zIndex: el.zIndex || 0 // Layer order
          };
          
          // Type-specific properties
          if (el.type === 'text') {
            elementData.textContent = el.text || el.content || '';
            elementData.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
            elementData.fontSize = el.fontSize || 18;
            elementData.fontWeight = el.fontWeight || 'normal';
            elementData.textColor = el.color || '#111';
            elementData.alignment = el.textAlign || 'left';
            elementData.borderColor = el.strokeColor || '#002b49';
            elementData.borderWidth = el.strokeWidth || 1;
            elementData.backgroundColor = el.fillColor || 'transparent';
            elementData.fontStyle = el.fontStyle || 'normal';
            elementData.underline = el.underline || false;
            elementData.lineHeight = el.lineHeight || 1.2;
            elementData.listType = el.listType || null;
          } else if (el.type === 'shape') {
            elementData.shapeType = el.shape || 'rectangle';
            elementData.fillColor = el.fillColor || 'rgba(255, 255, 255, 0.9)';
            elementData.borderColor = el.strokeColor || 'rgba(0, 43, 73, 0.2)';
            elementData.borderWidth = el.strokeWidth || 1;
            elementData.borderRadius = el.borderRadius;
            elementData.strokeDash = el.strokeDash || 'solid';
          } else if (el.type === 'image') {
            elementData.imageSource = el.src; // Path or data URL
            elementData.originalWidth = el.originalWidth;
            elementData.originalHeight = el.originalHeight;
            elementData.opacity = el.opacity || 1;
            elementData.border = el.border || false;
            elementData.borderWidth = el.borderWidth || 0;
            elementData.borderColor = el.borderColor || 'rgba(0, 43, 73, 0.2)';
            elementData.borderRadius = el.borderRadius || 8;
          }
          
          return elementData;
        }),
        theme: slide.theme || 'aramco',
        background: slide.background || '#ffffff',
        notes: slide.notes || ''
      })),
      // Which slide is currently selected
      activeSlideId: state.slides[state.currentSlideIndex]?.id || null,
      activeSlideIndex: state.currentSlideIndex,
      title: state.title || 'Untitled presentation'
    };
  }
  
  // Save the full presentation to persistent storage
  function persistState() {
    if (typeof localStorage === 'undefined') return;
    try {
      // Build the full presentation object
      const presentationData = buildPresentationData();
      // Convert to JSON string and store
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presentationData));
    } catch (err) {
      console.warn('Failed to persist state', err);
    }
  }
  
  // Load the full presentation from persistent storage
  function loadPersistedState() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.slides)) return null;
      return parsed;
    } catch (err) {
      console.warn('Failed to load persisted state', err);
      return null;
    }
  }
  
  // Rebuild state from loaded presentation data
  function rebuildStateFromPresentation(presentationData) {
    if (!presentationData || !Array.isArray(presentationData.slides)) return;
    
    // Clear existing slides
    state.slides = [];
    
    // Rebuild slides from saved data
    presentationData.slides.forEach((savedSlide, index) => {
      const slide = {
        id: savedSlide.slideId,
        elements: [],
        theme: savedSlide.theme || 'aramco',
        background: savedSlide.background || '#ffffff',
        notes: savedSlide.notes || ''
      };
      
      // Rebuild elements for this slide
      if (Array.isArray(savedSlide.elements)) {
        savedSlide.elements.forEach(savedEl => {
          const element = {
            id: savedEl.elementId,
            type: savedEl.type,
            x: savedEl.position?.x || 100,
            y: savedEl.position?.y || 100,
            width: savedEl.width || (savedEl.type === 'image' ? 200 : savedEl.type === 'text' ? 100 : 100),
            height: savedEl.height || (savedEl.type === 'image' ? 200 : savedEl.type === 'text' ? 100 : 100),
            rotation: savedEl.rotation || 0,
            zIndex: savedEl.zIndex || 0
          };
          
          // Rebuild type-specific properties
          if (savedEl.type === 'text') {
            element.text = savedEl.textContent || '';
            element.content = savedEl.textContent || '';
            element.fontFamily = savedEl.fontFamily || 'Inter, system-ui, sans-serif';
            element.fontSize = savedEl.fontSize || 18;
            element.fontWeight = savedEl.fontWeight || 'normal';
            element.color = savedEl.textColor || '#111';
            element.textAlign = savedEl.alignment || 'left';
            element.strokeColor = savedEl.borderColor || '#002b49';
            element.strokeWidth = savedEl.borderWidth || 1;
            element.fillColor = savedEl.backgroundColor || 'transparent';
            element.fontStyle = savedEl.fontStyle || 'normal';
            element.underline = savedEl.underline || false;
            element.lineHeight = savedEl.lineHeight || 1.2;
            element.listType = savedEl.listType || null;
          } else if (savedEl.type === 'shape') {
            element.shape = savedEl.shapeType || 'rectangle';
            element.fillColor = savedEl.fillColor || 'rgba(255, 255, 255, 0.9)';
            element.strokeColor = savedEl.borderColor || 'rgba(0, 43, 73, 0.2)';
            element.strokeWidth = savedEl.borderWidth || 1;
            element.borderRadius = savedEl.borderRadius;
            element.strokeDash = savedEl.strokeDash || 'solid';
          } else if (savedEl.type === 'image') {
            element.src = savedEl.imageSource;
            element.originalWidth = savedEl.originalWidth;
            element.originalHeight = savedEl.originalHeight;
            element.opacity = savedEl.opacity || 1;
            element.border = savedEl.border || false;
            element.borderWidth = savedEl.borderWidth || 0;
            element.borderColor = savedEl.borderColor || 'rgba(0, 43, 73, 0.2)';
            element.borderRadius = savedEl.borderRadius || 8;
          }
          
          slide.elements.push(element);
        });
      }
      
      state.slides.push(slide);
    });
    
    // Set active slide
    if (presentationData.activeSlideId) {
      const activeIndex = state.slides.findIndex(s => s.id === presentationData.activeSlideId);
      if (activeIndex >= 0) {
        state.currentSlideIndex = activeIndex;
      } else {
        state.currentSlideIndex = presentationData.activeSlideIndex || 0;
      }
    } else {
      state.currentSlideIndex = presentationData.activeSlideIndex || 0;
    }
    
    // Ensure currentSlideIndex is valid
    state.currentSlideIndex = Math.min(Math.max(0, state.currentSlideIndex), state.slides.length - 1);
    
    // Set title
    state.title = presentationData.title || 'Untitled presentation';
  }
  function normalizeState(st) {
    if (!st || !Array.isArray(st.slides) || st.slides.length === 0) {
      st.slides = [defaultSlide()];
    }
    st.slides.forEach(slide => {
      if (!Array.isArray(slide.elements)) slide.elements = [];
      slide.elements.forEach(el => {
        // Ensure position is always defined and within canvas bounds
        if (typeof el.x !== 'number' || el.x < 4) el.x = 100;
        if (typeof el.y !== 'number' || el.y < 4) el.y = 100;
        
        // Constrain existing elements to canvas bounds (with 4px padding)
        if (el.x < 4) el.x = 4;
        if (el.y < 4) el.y = 4;
        
        // For non-text elements, ensure they don't overflow
        if (el.type !== 'text') {
          const elWidth = el.width || (el.type === 'image' ? 200 : 100);
          const elHeight = el.height || (el.type === 'image' ? 200 : 100);
          if (el.x + elWidth > 1276) el.x = Math.max(4, 1276 - elWidth);
          if (el.y + elHeight > 716) el.y = Math.max(4, 716 - elHeight);
        }
        
        if (el.type === 'text') {
          el.fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
          el.fontSize = el.fontSize || 18;
          el.fontWeight = el.fontWeight || 'normal';
          // Normalize fontWeight: convert 'bold' to '700' for consistency
          if (el.fontWeight === 'bold') el.fontWeight = '700';
          if (el.fontWeight === '600') el.fontWeight = '700';
          el.fontStyle = el.fontStyle || 'normal';
          el.textAlign = el.textAlign || 'left';
          el.underline = !!el.underline;
          el.lineHeight = el.lineHeight || 1.2;
          el.listType = el.listType || null;
          el.rotation = typeof el.rotation === 'number' ? el.rotation : 0;
          el.scale = typeof el.scale === 'number' ? el.scale : 1;
          el.content = el.content || el.text || '';
          el.text = el.text || el.content || '';
          // Ensure text properties are defined
          el.color = el.color || '#111';
          el.fillColor = el.fillColor || 'transparent';
          el.strokeColor = el.strokeColor || '#002b49';
          el.strokeWidth = typeof el.strokeWidth === 'number' ? el.strokeWidth : 1;
          el.strokeDash = el.strokeDash || 'solid';
          el.locked = !!el.locked;
        } else if (el.type === 'shape') {
          // Ensure shape dimensions are defined
          if (typeof el.width !== 'number') el.width = 100;
          if (typeof el.height !== 'number') el.height = 100;
          // Ensure shape properties are defined
          el.shape = el.shape || 'rectangle';
          el.fillColor = el.fillColor || 'rgba(255, 255, 255, 0.9)';
          el.strokeColor = el.strokeColor || 'rgba(0, 43, 73, 0.2)';
          el.strokeWidth = typeof el.strokeWidth === 'number' ? el.strokeWidth : 1;
          el.borderRadius = typeof el.borderRadius === 'number' ? el.borderRadius : (el.shape === 'circle' ? undefined : 8);
          el.strokeDash = el.strokeDash || 'solid';
          el.rotation = typeof el.rotation === 'number' ? el.rotation : 0;
          el.scale = typeof el.scale === 'number' ? el.scale : 1;
        } else if (el.type === 'image') {
          // Ensure image dimensions are defined
          if (typeof el.width !== 'number') el.width = 200;
          if (typeof el.height !== 'number') el.height = 200;
          // Ensure image properties are defined
          el.rotation = typeof el.rotation === 'number' ? el.rotation : 0;
          el.scale = typeof el.scale === 'number' ? el.scale : 1;
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

  // Auto-save timeout for text input debouncing
  let textInputSaveTimeout = null;

  const defaultSlide = () => ({
    id: uid(), // Unique slide ID
    elements: [], // List of elements (text boxes, shapes, images)
    theme: 'aramco', // Default theme
    background: '#ffffff', // Default background color
    notes: '' // Slide notes
  });

  const state = {
    title: 'Untitled presentation',
    currentSlideIndex: 0,
    slides: [defaultSlide()],
  };

  // On page load: Check for saved data and rebuild if it exists
  const persisted = loadPersistedState();
  if (persisted) {
    // Rebuild state from saved presentation data
    rebuildStateFromPresentation(persisted);
  } else {
    // If no data exists, create a default single blank slide
    state.slides = [defaultSlide()];
    state.currentSlideIndex = 0;
  }
  
  // Normalize state to ensure all properties are valid
  normalizeState(state);
  
  // Persist the initial state
  persistState();

  // Undo/Redo stack with action history
  // Each entry contains: { state: stringified state, action: action metadata }
  // The history stack contains all states (both undo and redo)
  // - Everything before the pointer: undo stack (actions that can be undone)
  // - Everything after the pointer: redo stack (actions that can be redone)
  // - The pointer position: current state
  const history = {
    stack: [{
      state: JSON.stringify(state),
      action: {
        type: 'init',
        description: 'Initial state'
      }
    }],
    pointer: 0 // Points to the current state in the stack
  };

  function saveState(actionType = 'unknown', actionDescription = '', targetInfo = {}) {
    persistState();
    const current = JSON.stringify(state);
    
    // Only save if state actually changed
    if (history.stack[history.pointer].state !== current) {
      // Clear redo stack when new action is performed (not from Redo)
      // This removes everything after the current pointer, effectively clearing the redo stack
      // The redo stack is implicitly everything after the pointer position
      history.stack = history.stack.slice(0, history.pointer + 1);
      
      // Create action entry with metadata
      const actionEntry = {
        state: current,
        action: {
          type: actionType, // e.g., 'add_text', 'edit_text', 'move_element', 'resize_element', 'add_slide', 'delete_slide', etc.
          description: actionDescription,
          timestamp: Date.now(),
          slideId: state.slides[state.currentSlideIndex]?.id,
          slideIndex: state.currentSlideIndex,
          ...targetInfo // Additional info like elementId, oldValue, newValue, etc.
        }
      };
      
      history.stack.push(actionEntry);
      history.pointer = history.stack.length - 1;
      
      // Limit history size to 50 entries
      if (history.stack.length > 50) {
        history.stack.shift();
        history.pointer--;
      }
      
      updateUndoRedoButtons();
    }
  }

  function undo() {
    // Check if history stack is not empty (pointer > 0 means we can go back)
    if (history.pointer > 0) {
      // Move pointer back to previous state
      history.pointer--;
      
      // Restore the previous state
      const previousEntry = history.stack[history.pointer];
      const saved = JSON.parse(previousEntry.state);
      Object.assign(state, saved);
      
      // Update UI to reflect the reverted state
      renderAll();
      
      // Persist the reverted state
      persistState();
      
      // Update button states (disable undo if at beginning, enable redo)
      updateUndoRedoButtons();
    }
  }

  function redo() {
    // Check if redo stack is not empty
    // The redo stack is implicitly everything after the current pointer position
    // If pointer < length - 1, there are actions that can be redone
    if (history.pointer < history.stack.length - 1) {
      // Move pointer forward to next state (reapplying the undone action)
      history.pointer++;
      
      // Get the action entry from the redo stack
      const nextEntry = history.stack[history.pointer];
      
      // Reapply the action by restoring the state
      // This works for all action types:
      // - add_text: Recreates the text box
      // - delete_text: Removes the text box again
      // - edit_text: Applies the new text content again
      // - move_element: Moves element back to new x, y position
      // - resize_element: Applies new width and height again
      // - add_slide: Re-adds the slide
      // - delete_slide: Deletes the slide again
      const saved = JSON.parse(nextEntry.state);
      Object.assign(state, saved);
      
      // Update UI to reflect the redone state
      // This refreshes the canvas, slide list, and all indicators
      renderAll();
      
      // Persist the redone state to localStorage
      persistState();
      
      // Update button states:
      // - Enable undo (we can now undo the redone action)
      // - Disable redo if we're at the end of the stack
      updateUndoRedoButtons();
    }
    // If redo stack is empty (pointer === length - 1), do nothing
    // The button will be disabled by updateUndoRedoButtons()
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const topBtnUndo = document.getElementById('top-toolbar-undo');
    const topBtnRedo = document.getElementById('top-toolbar-redo');
    
    // Disable undo button if history stack is empty (pointer at beginning)
    if (btnUndo) btnUndo.disabled = history.pointer === 0;
    if (topBtnUndo) topBtnUndo.disabled = history.pointer === 0;
    
    // Disable redo button if redo stack is empty (pointer at end)
    // The redo stack is empty when pointer === length - 1 (no actions after pointer)
    if (btnRedo) btnRedo.disabled = history.pointer === history.stack.length - 1;
    if (topBtnRedo) topBtnRedo.disabled = history.pointer === history.stack.length - 1;
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

    // Auto-save after any property change
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
    // Don't hide text control bar if we're editing text
    if (!editingNode) {
    hideTextControlBar();
    }
  }

  // Snapping function for gentle snapping to center and edges
  function applySnapping(x, y, width, height) {
    const stageWidth = 1280;
    const stageHeight = 720;
    const snapThreshold = 20; // Pixels within which snapping occurs
    let snappedX = x;
    let snappedY = y;
    
    // Snap to horizontal center
    const centerX = stageWidth / 2;
    const elementCenterX = x + (width || 0) / 2;
    if (Math.abs(elementCenterX - centerX) < snapThreshold) {
      snappedX = centerX - (width || 0) / 2;
    }
    
    // Snap to vertical center
    const centerY = stageHeight / 2;
    const elementCenterY = y + (height || 0) / 2;
    if (Math.abs(elementCenterY - centerY) < snapThreshold) {
      snappedY = centerY - (height || 0) / 2;
    }
    
    // Snap to left edge
    if (Math.abs(x) < snapThreshold) {
      snappedX = 0;
    }
    
    // Snap to right edge
    const rightEdge = stageWidth - (width || 0);
    if (Math.abs(x - rightEdge) < snapThreshold) {
      snappedX = rightEdge;
    }
    
    // Snap to top edge
    if (Math.abs(y) < snapThreshold) {
      snappedY = 0;
    }
    
    // Snap to bottom edge
    const bottomEdge = stageHeight - (height || 0);
    if (Math.abs(y - bottomEdge) < snapThreshold) {
      snappedY = bottomEdge;
    }
    
    return { x: snappedX, y: snappedY };
  }

  function renderStage() {
    stageEl.innerHTML = '';
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return;
    
    // Update stage label to show current slide number and total
    const stageLabel = document.getElementById('stage-label');
    if (stageLabel) {
      stageLabel.textContent = `Slide ${state.currentSlideIndex + 1} of ${state.slides.length}`;
    }
    
    // Restore theme and background if slide has one
    const stage = document.getElementById('stage');
    if (stage) {
      if (slide.theme) {
        // Apply theme-based background
        switch(slide.theme) {
          case 'aramco':
            stage.style.background = '#ffffff';
            break;
          case 'ocean':
            stage.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
            break;
          case 'forest':
            stage.style.background = 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
            break;
          case 'sunset':
            stage.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
            break;
          default:
            stage.style.background = slide.background || '#ffffff';
        }
      } else {
        // Use custom background if no theme
        stage.style.background = slide.background || '#ffffff';
      }
    }
    
    // Show/hide empty state placeholder
    if (stage) {
      if (!slide.elements || slide.elements.length === 0) {
        stage.classList.add('stage-empty');
      } else {
        stage.classList.remove('stage-empty');
      }
    }
    
    // Restore slide notes
    const notesTextarea = document.getElementById('slide-notes-textarea');
    if (notesTextarea) {
      notesTextarea.value = slide.notes || '';
    }
    
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
        node.style.border = `${el.strokeWidth || 1}px ${el.strokeDash === 'dashed' ? 'dashed' : el.strokeDash === 'dotted' ? 'dotted' : 'solid'} ${el.strokeColor || '#002b49'}`;
        node.style.transformOrigin = 'top left';
        // Constrain text width to prevent overflow outside canvas
        const maxTextWidth = 1280 - el.x - 16; // Leave padding on right
        if (maxTextWidth > 0) {
          node.style.maxWidth = maxTextWidth + 'px';
        }
        node.innerHTML = el.content || el.text || 'Double-click to edit';
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'text';

        node.addEventListener('input', () => {
          if (editingElementId === el.id) {
            syncEditingContent({ save: false });
            // Auto-save on text input (debounced)
            if (!textInputSaveTimeout) {
              textInputSaveTimeout = setTimeout(() => {
                saveState();
                textInputSaveTimeout = null;
              }, 500);
            }
            // Keep toolbar visible during input
            showTextControlBarForElement(el);
            // Update max-width constraint when text changes to prevent overflow
            const maxTextWidth = 1280 - el.x - 16;
            if (maxTextWidth > 0) {
              node.style.maxWidth = maxTextWidth + 'px';
            }
          } else {
            el.content = node.innerHTML;
            el.text = node.innerText || '';
            renderSidebar();
          }
          saveState();
        });
        
        // Keep toolbar visible during text selection changes
        node.addEventListener('selectstart', () => {
          if (editingElementId === el.id) {
            showTextControlBarForElement(el);
          }
        });
        
        // Keep toolbar visible on keydown (for delete, enter, etc.)
        node.addEventListener('keydown', (e) => {
          if (editingElementId === el.id) {
            showTextControlBarForElement(el);
            // Update formatting buttons after key operations
            setTimeout(() => updateFormattingButtons(), 0);
          }
        });
        
        // Keep toolbar visible on keyup (for delete, enter, etc.)
        node.addEventListener('keyup', (e) => {
          if (editingElementId === el.id) {
            showTextControlBarForElement(el);
            updateFormattingButtons();
          }
        });
        
        // Ensure auto-save on blur (when user clicks away)
        node.addEventListener('blur', () => {
          if (textInputSaveTimeout) {
            clearTimeout(textInputSaveTimeout);
            textInputSaveTimeout = null;
          }
          syncEditingContent({ save: true });
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
          if (el.type === 'text' || el.type === 'shape') {
          showTextControlBarForElement(el);
          }
          node.classList.add('dragging');
          // Disable transitions during drag for smooth movement
          node.style.transition = 'none';
          showDragInfo();
          document.body.style.cursor = 'grabbing';
          e.preventDefault();
        }

        // Track if we should allow dragging (only when clicking on border/background, not text content)
        let allowDrag = false;
        
        // 6. Moving the text box - allow dragging when clicking on border/background
        // Click on move handle or border area starts dragging
        node.addEventListener('mousedown', (e) => {
          // If clicking on the move handle, always start dragging
          if (e.target === moveHandle || moveHandle.contains(e.target)) {
            allowDrag = true;
            startDrag(e, { fromIcon: true, force: true });
            return;
          }
          // If clicking on resize handle, don't start drag
          if (e.target === resizeHandle || resizeHandle.contains(e.target)) {
            allowDrag = false;
            return;
          }
          // If clicking directly on text content (not border), don't drag - will enter edit mode instead
          if (e.target === node || node.contains(e.target)) {
            // Check if clicking near the edges (border area) - allow drag
            const rect = node.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const borderThreshold = 10; // 10px border area
            
            const isNearBorder = clickX < borderThreshold || 
                                clickX > rect.width - borderThreshold ||
                                clickY < borderThreshold || 
                                clickY > rect.height - borderThreshold;
            
            if (isNearBorder) {
              // Clicking near border - allow dragging
              allowDrag = true;
              startDrag(e);
            } else {
              // Clicking on text content - don't drag, will enter edit mode on click
              allowDrag = false;
              e.stopPropagation();
            }
          } else {
            // Clicking outside text content - allow drag
            allowDrag = true;
            startDrag(e);
          }
        });
        
        moveHandle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          allowDrag = true;
          startDrag(e, { fromIcon: true, force: true });
        });

        // 4. Text selection and editing - single click inside text box activates editing
        node.addEventListener('click', (e) => {
          // Don't enter editing if we just dragged
          if (allowDrag) {
            allowDrag = false;
            return;
          }
          
          // Don't enter editing if clicking on move handle or resize handle
          if (e.target === moveHandle || moveHandle.contains(e.target) ||
              e.target === resizeHandle || resizeHandle.contains(e.target)) {
            return;
          }
          
          // Enter editing mode when clicking on text content
          e.stopPropagation();
          enterTextEditing(node, el);
          
          // Set cursor at click position
          requestAnimationFrame(() => {
            if (document.caretRangeFromPoint) {
              const range = document.caretRangeFromPoint(e.clientX, e.clientY);
              if (range) {
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            }
          });
        });
        
        // Keep double-click for quick editing
        node.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          enterTextEditing(node, el);
        });

        let rafId = null;
        let dragPersistTimeout = null;
        let dragInfoTimeout = null;
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
          // Only allow dragging if allowDrag is true (clicked on border/background, not text content)
          if (!allowDrag) return;
          if (dragStartTime === 0) return;
          if (editingElementId === el.id && !dragFromIcon) return;
          
          const moveDistance = Math.abs(e.clientX - dragStartPos.x) + Math.abs(e.clientY - dragStartPos.y);
          if ((moveDistance > 5 || dragFromIcon) && !dragging) {
            dragging = true;
            node.style.cursor = 'move';
            node.style.userSelect = 'none';
          }
          if (dragging) {
            // Cancel any pending animation frame
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
            }
            
            // Use requestAnimationFrame for smooth dragging
            rafId = requestAnimationFrame(() => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
              let newX = origX + dx;
              let newY = origY + dy;
              
              // Get element dimensions (cache to avoid repeated DOM reads)
              let elWidth, elHeight;
              if (el.type === 'text') {
                // For text elements, use actual rendered dimensions
                const rect = node.getBoundingClientRect();
                elWidth = rect.width || node.offsetWidth || 100;
                elHeight = rect.height || node.offsetHeight || 100;
              } else {
                elWidth = el.width || node.offsetWidth || 100;
                elHeight = el.height || node.offsetHeight || 100;
              }
              
              // Constrain to canvas bounds (with padding to prevent edge overlap)
              const padding = 4;
              newX = Math.max(padding, Math.min(1280 - elWidth - padding, newX));
              newY = Math.max(padding, Math.min(720 - elHeight - padding, newY));
              
              // Apply snapping
              const snapped = applySnapping(newX, newY, elWidth, elHeight);
              el.x = snapped.x;
              el.y = snapped.y;
              
              // Disable transitions during drag for smooth movement
              node.style.transition = 'none';
              node.style.willChange = 'transform';
            node.style.left = el.x + 'px';
            node.style.top = el.y + 'px';
              
              // Throttle drag info updates to prevent lag
              if (!dragInfoTimeout) {
                dragInfoTimeout = requestAnimationFrame(() => {
            showDragInfo();
                  dragInfoTimeout = null;
                });
              }
              // Throttle persistState during drag to avoid lag
              if (!dragPersistTimeout) {
                dragPersistTimeout = setTimeout(() => {
            persistState();
                  dragPersistTimeout = null;
                }, 150);
              }
              rafId = null;
            });
          }
        };

        const handleMouseUp = () => {
          // Cancel any pending animation frame
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          
          // Clear any pending timeouts
          if (dragPersistTimeout) {
            clearTimeout(dragPersistTimeout);
            dragPersistTimeout = null;
          }
          if (dragInfoTimeout) {
            cancelAnimationFrame(dragInfoTimeout);
            dragInfoTimeout = null;
          }
          
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
            // Re-enable transitions after drag for smooth animations
            node.style.transition = '';
            node.style.willChange = '';
            // 6. Save the final x, y position for that text box
            saveState();
            renderSidebar();
            if (editingElementId === el.id) {
              enterTextEditing(node, el);
            }
          } else if (dragStartTime > 0 && !el.locked && !dragFromIcon && !allowDrag) {
            // Only enter editing if we didn't drag and clicked on text content
            enterTextEditing(node, el);
          }
          dragStartTime = 0;
          dragFromIcon = false;
          allowDrag = false; // Reset allowDrag flag
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
        node.style.backgroundColor = el.fillColor || 'rgba(255, 255, 255, 0.9)';
        node.style.border = `${el.strokeWidth || 1}px ${el.strokeDash === 'dashed' ? 'dashed' : el.strokeDash === 'dotted' ? 'dotted' : 'solid'} ${el.strokeColor || 'rgba(0, 43, 73, 0.2)'}`;
        
        // Apply Aramco styling: rounded corners and soft shadow
        if (el.shape === 'circle') {
          node.style.borderRadius = '50%';
        } else if (el.borderRadius !== undefined) {
          node.style.borderRadius = el.borderRadius + 'px';
        } else {
          node.style.borderRadius = '8px'; // Default rounded corners
        }
        
        // Soft shadow for Aramco style
        node.style.boxShadow = '0 4px 12px rgba(15, 44, 103, 0.08), 0 2px 4px rgba(15, 44, 103, 0.04)';
        
        // Special handling for arrow shape
        if (el.shape === 'arrow') {
          node.style.clipPath = 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)';
        }
        
        // Special handling for line - keep smooth corners and shadow
        if (el.shape === 'line') {
          // Line already has borderRadius from element properties
          // Keep soft shadow for consistency
        }
        
        node.classList.toggle('locked', !!el.locked);
        node.style.cursor = el.locked ? 'default' : 'move';
        node.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease, left 0.1s ease-out, top 0.1s ease-out';
        
        // Apply rotation and z-index
        if (el.rotation !== undefined && el.rotation !== 0) {
          node.style.transform = `rotate(${el.rotation}deg)`;
        }
        if (el.zIndex !== undefined) {
          node.style.zIndex = el.zIndex;
        }
        
        // Add resize handles for shapes (except lines which are 1D)
        let shapeResizing = false;
        let shapeResizeHandle = null;
        let shapeResizeStartX = 0, shapeResizeStartY = 0;
        let shapeResizeStartWidth = 0, shapeResizeStartHeight = 0;
        let shapeResizeStartElX = 0, shapeResizeStartElY = 0;
        
        // Create resize handles (corner handles) - must be created before event handlers
        if (el.shape !== 'line') {
          const handles = ['nw', 'ne', 'sw', 'se'];
          handles.forEach(handlePos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle handle-${handlePos}`;
            handle.style.display = 'none'; // Hidden by default, shown when selected
            handle.style.cursor = handlePos === 'nw' || handlePos === 'se' ? 'nwse-resize' : 'nesw-resize';
            node.appendChild(handle);
          });
        }
        
        // Smooth dragging for shapes
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        let shapeRafId = null;
        
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
        
        const handleShapeMouseMove = (e) => {
          // Handle resizing first
          if (shapeResizing) {
            handleShapeResize(e);
            return;
          }
          
          if (!dragging || el.locked) return;
          
          // Cancel any pending animation frame
          if (shapeRafId !== null) {
            cancelAnimationFrame(shapeRafId);
          }
          
          // Use requestAnimationFrame for smooth dragging
          shapeRafId = requestAnimationFrame(() => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const stageRect = stageWrap?.getBoundingClientRect();
            if (stageRect) {
              let newX = origX + dx;
              let newY = origY + dy;
              
              // Get element dimensions (cache to avoid repeated reads)
              const elWidth = el.width || 100;
              const elHeight = el.height || 100;
              
              // Constrain to canvas bounds (with padding to prevent edge overlap)
              const padding = 4;
              newX = Math.max(padding, Math.min(1280 - elWidth - padding, newX));
              newY = Math.max(padding, Math.min(720 - elHeight - padding, newY));
              
              // Apply snapping
              const snapped = applySnapping(newX, newY, elWidth, elHeight);
              el.x = snapped.x;
              el.y = snapped.y;
              
              // Disable transitions during drag for smooth movement
              node.style.transition = 'none';
              node.style.left = el.x + 'px';
              node.style.top = el.y + 'px';
              // Throttle drag info updates to prevent lag
              if (!shapeDragInfoTimeout) {
                shapeDragInfoTimeout = requestAnimationFrame(() => {
                  showDragInfo();
                  shapeDragInfoTimeout = null;
                });
              }
              // Throttle saveState during drag to avoid lag
              if (!shapeDragPersistTimeout) {
                shapeDragPersistTimeout = setTimeout(() => {
                  persistState();
                  shapeDragPersistTimeout = null;
                }, 100);
              }
            }
            shapeRafId = null;
          });
        };
        
        const handleShapeMouseUp = () => {
          // Cancel any pending animation frame
          if (shapeRafId !== null) {
            cancelAnimationFrame(shapeRafId);
            shapeRafId = null;
          }
          
          // Clear any pending timeouts
          if (shapeDragPersistTimeout) {
            clearTimeout(shapeDragPersistTimeout);
            shapeDragPersistTimeout = null;
          }
          if (shapeDragInfoTimeout) {
            cancelAnimationFrame(shapeDragInfoTimeout);
            shapeDragInfoTimeout = null;
          }
          
          if (shapeResizing) {
            shapeResizing = false;
            shapeResizeHandle = null;
            document.body.style.cursor = '';
            saveState(); // Save state after resize
            renderSidebar();
            return;
          }
          
          if (dragging) {
            dragging = false;
            // Re-enable transitions after drag
            node.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease, left 0.1s ease-out, top 0.1s ease-out';
            node.classList.remove('dragging');
            hideDragInfo();
            document.body.style.cursor = '';
            saveState();
            renderSidebar();
          }
        };
        
        // Show/hide resize handles based on selection
        const updateResizeHandles = () => {
          const handles = node.querySelectorAll('.resize-handle');
          if (node.classList.contains('selected') && !el.locked && el.shape !== 'line') {
            handles.forEach(h => h.style.display = 'block');
          } else {
            handles.forEach(h => h.style.display = 'none');
          }
        };
        
        // Handle resize handle mousedown
        if (el.shape !== 'line') {
          const handles = node.querySelectorAll('.resize-handle');
          handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (el.locked) return;
              shapeResizing = true;
              shapeResizeHandle = handle.className.includes('nw') ? 'nw' :
                                  handle.className.includes('ne') ? 'ne' :
                                  handle.className.includes('sw') ? 'sw' : 'se';
              shapeResizeStartX = e.clientX;
              shapeResizeStartY = e.clientY;
              shapeResizeStartWidth = el.width || 100;
              shapeResizeStartHeight = el.height || 100;
              shapeResizeStartElX = el.x;
              shapeResizeStartElY = el.y;
              document.body.style.cursor = handle.style.cursor;
            });
          });
        }
        
        // Handle shape resizing
        const handleShapeResize = (e) => {
          if (!shapeResizing || el.locked) return;
          
          const dx = e.clientX - shapeResizeStartX;
          const dy = e.clientY - shapeResizeStartY;
          
          let newWidth = shapeResizeStartWidth;
          let newHeight = shapeResizeStartHeight;
          let newX = shapeResizeStartElX;
          let newY = shapeResizeStartElY;
          
          // Maintain aspect ratio for circles
          const maintainAspect = el.shape === 'circle';
          
          if (shapeResizeHandle === 'se') {
            newWidth = Math.max(20, shapeResizeStartWidth + dx);
            if (maintainAspect) {
              newHeight = newWidth;
            } else {
              newHeight = Math.max(20, shapeResizeStartHeight + dy);
            }
          } else if (shapeResizeHandle === 'sw') {
            newWidth = Math.max(20, shapeResizeStartWidth - dx);
            if (maintainAspect) {
              newHeight = newWidth;
            } else {
              newHeight = Math.max(20, shapeResizeStartHeight + dy);
            }
            newX = shapeResizeStartElX + (shapeResizeStartWidth - newWidth);
          } else if (shapeResizeHandle === 'ne') {
            newWidth = Math.max(20, shapeResizeStartWidth + dx);
            if (maintainAspect) {
              newHeight = newWidth;
            } else {
              newHeight = Math.max(20, shapeResizeStartHeight - dy);
            }
            newY = shapeResizeStartElY + (shapeResizeStartHeight - newHeight);
          } else if (shapeResizeHandle === 'nw') {
            newWidth = Math.max(20, shapeResizeStartWidth - dx);
            if (maintainAspect) {
              newHeight = newWidth;
            } else {
              newHeight = Math.max(20, shapeResizeStartHeight - dy);
            }
            newX = shapeResizeStartElX + (shapeResizeStartWidth - newWidth);
            newY = shapeResizeStartElY + (shapeResizeStartHeight - newHeight);
          }
          
          // Constrain to canvas bounds
          const padding = 4;
          if (newX < padding) {
            newWidth -= (padding - newX);
            newX = padding;
          }
          if (newY < padding) {
            newHeight -= (padding - newY);
            newY = padding;
          }
          if (newX + newWidth > 1280 - padding) {
            newWidth = 1280 - padding - newX;
          }
          if (newY + newHeight > 720 - padding) {
            newHeight = 720 - padding - newY;
          }
          
          el.width = newWidth;
          el.height = newHeight;
          el.x = newX;
          el.y = newY;
          
          // Update circle borderRadius if needed
          if (el.shape === 'circle') {
            el.borderRadius = 50;
          }
          
          node.style.width = newWidth + 'px';
          node.style.height = newHeight + 'px';
          node.style.left = newX + 'px';
          node.style.top = newY + 'px';
          if (el.shape === 'circle') {
            node.style.borderRadius = '50%';
          }
        };
        
        node.addEventListener('mousedown', (e) => {
          // Don't start drag if clicking on resize handle
          if (e.target.classList.contains('resize-handle')) return;
          
          if (e.button !== 0 || el.locked) return;
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateResizeHandles(); // Show resize handles when selected
          node.style.transition = 'none'; // Disable transition during drag for smooth movement
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
          node.classList.add('dragging');
          showDragInfo();
          document.body.style.cursor = 'grabbing';
          e.stopPropagation();
          e.preventDefault();
        });
        
        // Handle click to select shape (without dragging)
        node.addEventListener('click', (e) => {
          if (e.target.classList.contains('resize-handle')) return;
          if (dragging) return; // Don't select if we just dragged
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateResizeHandles();
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
        });
        
        document.addEventListener('mousemove', handleShapeMouseMove);
        document.addEventListener('mouseup', handleShapeMouseUp);
        
        stageEl.appendChild(node);
      } else if (el.type === 'image' && el.src) {
        const node = document.createElement('img');
        node.className = 'el image';
        node.dataset.id = el.id;
        node.src = el.src;
        node.style.position = 'absolute';
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
        node.style.width = (el.width || 200) + 'px';
        node.style.height = (el.height || 200) + 'px';
        node.style.objectFit = 'contain'; // Use 'contain' to preserve aspect ratio
        node.style.borderRadius = (el.borderRadius || 8) + 'px';
        node.style.boxShadow = '0 4px 12px rgba(15, 44, 103, 0.08), 0 2px 4px rgba(15, 44, 103, 0.04)';
        node.style.cursor = el.locked ? 'default' : 'move';
        node.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease, left 0.1s ease-out, top 0.1s ease-out';
        
        // Apply opacity
        if (el.opacity !== undefined) {
          node.style.opacity = el.opacity;
        }
        
        // Apply rotation
        if (el.rotation !== undefined && el.rotation !== 0) {
          node.style.transform = `rotate(${el.rotation}deg)`;
        }
        
        // Apply z-index
        if (el.zIndex !== undefined) {
          node.style.zIndex = el.zIndex;
        }
        
        // Apply border if enabled
        if (el.border) {
          node.style.border = `${el.borderWidth || 2}px solid ${el.borderColor || 'rgba(0, 43, 73, 0.2)'}`;
        }
        
        node.classList.toggle('locked', !!el.locked);
        
        // Add resize handles for images
        let imageResizing = false;
        let imageResizeHandle = null;
        let imageResizeStartX = 0, imageResizeStartY = 0;
        let imageResizeStartWidth = 0, imageResizeStartHeight = 0;
        let imageResizeStartElX = 0, imageResizeStartElY = 0;
        
        // Create resize handles (corner handles)
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(handlePos => {
          const handle = document.createElement('div');
          handle.className = `resize-handle handle-${handlePos}`;
          handle.style.display = 'none'; // Hidden by default, shown when selected
          handle.style.cursor = handlePos === 'nw' || handlePos === 'se' ? 'nwse-resize' : 'nesw-resize';
          node.appendChild(handle);
        });
        
        // Show/hide resize handles based on selection
        const updateImageResizeHandles = () => {
          const handles = node.querySelectorAll('.resize-handle');
          if (node.classList.contains('selected') && !el.locked) {
            handles.forEach(h => h.style.display = 'block');
          } else {
            handles.forEach(h => h.style.display = 'none');
          }
        };
        
        // Handle resize handle mousedown
        const imageHandles = node.querySelectorAll('.resize-handle');
        imageHandles.forEach(handle => {
          handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (el.locked) return;
            imageResizing = true;
            imageResizeHandle = handle.className.includes('nw') ? 'nw' :
                                handle.className.includes('ne') ? 'ne' :
                                handle.className.includes('sw') ? 'sw' : 'se';
            imageResizeStartX = e.clientX;
            imageResizeStartY = e.clientY;
            imageResizeStartWidth = el.width || 200;
            imageResizeStartHeight = el.height || 200;
            imageResizeStartElX = el.x;
            imageResizeStartElY = el.y;
            document.body.style.cursor = handle.style.cursor;
          });
        });
        
        // Handle image resizing (always maintain aspect ratio)
        const handleImageResize = (e) => {
          if (!imageResizing || el.locked) return;
          
          const dx = e.clientX - imageResizeStartX;
          const dy = e.clientY - imageResizeStartY;
          
          // Calculate aspect ratio from original dimensions
          const aspectRatio = (el.originalWidth || el.width || 200) / (el.originalHeight || el.height || 200);
          
          let newWidth = imageResizeStartWidth;
          let newHeight = imageResizeStartHeight;
          let newX = imageResizeStartElX;
          let newY = imageResizeStartElY;
          
          // Calculate new dimensions based on handle position, maintaining aspect ratio
          if (imageResizeHandle === 'se') {
            // Bottom-right: resize based on both dx and dy, use the larger change
            const scaleX = (imageResizeStartWidth + dx) / imageResizeStartWidth;
            const scaleY = (imageResizeStartHeight + dy) / imageResizeStartHeight;
            const scale = Math.max(scaleX, scaleY); // Use larger scale
            newWidth = Math.max(50, Math.round(imageResizeStartWidth * scale));
            newHeight = Math.round(newWidth / aspectRatio);
          } else if (imageResizeHandle === 'sw') {
            // Bottom-left: resize based on both dx and dy
            const scaleX = (imageResizeStartWidth - dx) / imageResizeStartWidth;
            const scaleY = (imageResizeStartHeight + dy) / imageResizeStartHeight;
            const scale = Math.max(scaleX, scaleY);
            newWidth = Math.max(50, Math.round(imageResizeStartWidth * scale));
            newHeight = Math.round(newWidth / aspectRatio);
            newX = imageResizeStartElX + (imageResizeStartWidth - newWidth);
          } else if (imageResizeHandle === 'ne') {
            // Top-right: resize based on both dx and dy
            const scaleX = (imageResizeStartWidth + dx) / imageResizeStartWidth;
            const scaleY = (imageResizeStartHeight - dy) / imageResizeStartHeight;
            const scale = Math.max(scaleX, scaleY);
            newWidth = Math.max(50, Math.round(imageResizeStartWidth * scale));
            newHeight = Math.round(newWidth / aspectRatio);
            newY = imageResizeStartElY + (imageResizeStartHeight - newHeight);
          } else if (imageResizeHandle === 'nw') {
            // Top-left: resize based on both dx and dy
            const scaleX = (imageResizeStartWidth - dx) / imageResizeStartWidth;
            const scaleY = (imageResizeStartHeight - dy) / imageResizeStartHeight;
            const scale = Math.max(scaleX, scaleY);
            newWidth = Math.max(50, Math.round(imageResizeStartWidth * scale));
            newHeight = Math.round(newWidth / aspectRatio);
            newX = imageResizeStartElX + (imageResizeStartWidth - newWidth);
            newY = imageResizeStartElY + (imageResizeStartHeight - newHeight);
          }
          
          // Constrain to canvas bounds
          const padding = 4;
          if (newX < padding) {
            const adjust = padding - newX;
            newWidth -= adjust;
            newX = padding;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newY < padding) {
            const adjust = padding - newY;
            newHeight -= adjust;
            newY = padding;
            newWidth = Math.round(newHeight * aspectRatio);
          }
          if (newX + newWidth > 1280 - padding) {
            newWidth = 1280 - padding - newX;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newY + newHeight > 720 - padding) {
            newHeight = 720 - padding - newY;
            newWidth = Math.round(newHeight * aspectRatio);
          }
          
          el.width = newWidth;
          el.height = newHeight;
          el.x = newX;
          el.y = newY;
          
          node.style.width = newWidth + 'px';
          node.style.height = newHeight + 'px';
          node.style.left = newX + 'px';
          node.style.top = newY + 'px';
        };
        
        // Image dragging
        let dragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;
        let imageRafId = null;
        
        const handleImageMouseMove = (e) => {
          // Handle resizing first
          if (imageResizing) {
            handleImageResize(e);
            return;
          }
          
          if (!dragging || el.locked) return;
          
          if (imageRafId !== null) {
            cancelAnimationFrame(imageRafId);
          }
          
          imageRafId = requestAnimationFrame(() => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const stageRect = stageWrap?.getBoundingClientRect();
            if (stageRect) {
              let newX = origX + dx;
              let newY = origY + dy;
              
              // Cache dimensions
              const elWidth = el.width || 200;
              const elHeight = el.height || 200;
              
              // Constrain to canvas bounds (with padding to prevent edge overlap)
              const padding = 4;
              newX = Math.max(padding, Math.min(1280 - elWidth - padding, newX));
              newY = Math.max(padding, Math.min(720 - elHeight - padding, newY));
              
              const snapped = applySnapping(newX, newY, elWidth, elHeight);
              el.x = snapped.x;
              el.y = snapped.y;
              
              node.style.transition = 'none';
              node.style.left = el.x + 'px';
              node.style.top = el.y + 'px';
              // Throttle drag info updates
              if (!imageDragInfoTimeout) {
                imageDragInfoTimeout = requestAnimationFrame(() => {
                  showImageDragInfo();
                  imageDragInfoTimeout = null;
                });
              }
              // Throttle saveState during drag to avoid lag
              if (!imageDragPersistTimeout) {
                imageDragPersistTimeout = setTimeout(() => {
                  persistState();
                  imageDragPersistTimeout = null;
                }, 100);
              }
            }
            imageRafId = null;
          });
        };
        
        const handleImageMouseUp = () => {
          if (imageRafId !== null) {
            cancelAnimationFrame(imageRafId);
            imageRafId = null;
          }
          
          // Clear any pending timeouts
          if (imageDragPersistTimeout) {
            clearTimeout(imageDragPersistTimeout);
            imageDragPersistTimeout = null;
          }
          if (imageDragInfoTimeout) {
            cancelAnimationFrame(imageDragInfoTimeout);
            imageDragInfoTimeout = null;
          }
          
          if (imageResizing) {
            imageResizing = false;
            imageResizeHandle = null;
            document.body.style.cursor = '';
            saveState(); // Save state after resize
            renderSidebar();
            return;
          }
          
          if (dragging) {
            dragging = false;
            node.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease, left 0.1s ease-out, top 0.1s ease-out';
            node.classList.remove('dragging');
            hideImageDragInfo();
            document.body.style.cursor = '';
            saveState();
            renderSidebar();
          }
          
          document.removeEventListener('mousemove', handleImageMouseMove);
          document.removeEventListener('mouseup', handleImageMouseUp);
        };
        
        const showImageDragInfo = () => {
          if (!dragIndicator || !stageWrap) return;
          dragIndicator.textContent = `x: ${Math.round(el.x)}  y: ${Math.round(el.y)}`;
          const stageRect = stageWrap.getBoundingClientRect();
          const rect = node.getBoundingClientRect();
          dragIndicator.style.left = `${rect.left + rect.width / 2 - stageRect.left}px`;
          dragIndicator.style.top = `${rect.top - stageRect.top}px`;
          dragIndicator.classList.remove('hidden');
        };
        
        const hideImageDragInfo = () => {
          dragIndicator?.classList.add('hidden');
        };
        
        node.addEventListener('mousedown', (e) => {
          // Don't start drag if clicking on resize handle
          if (e.target.classList.contains('resize-handle')) return;
          
          if (e.button !== 0 || el.locked) return;
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          origX = el.x;
          origY = el.y;
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateImageResizeHandles(); // Show resize handles when selected
          node.style.transition = 'none';
          node.classList.add('dragging');
          showImageDragInfo();
          document.body.style.cursor = 'grabbing';
          e.stopPropagation();
          e.preventDefault();
          
          document.addEventListener('mousemove', handleImageMouseMove);
          document.addEventListener('mouseup', handleImageMouseUp);
        });
        
        node.addEventListener('click', (e) => {
          if (e.target.classList.contains('resize-handle')) return;
          if (dragging) return; // Don't select if we just dragged
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          node.classList.add('selected');
          updateImageResizeHandles();
          updateToolbarFromSelection();
          showContextToolbar(node);
          hideTextControlBar();
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
    // Create a new slide object
    const newSlide = defaultSlide();
    
    // Insert the new slide immediately after the current slide
    const insertIndex = state.currentSlideIndex + 1;
    state.slides.splice(insertIndex, 0, newSlide);
    
    // Set the new slide as the active slide
    state.currentSlideIndex = insertIndex;
    
    // Record action for undo/redo with metadata
    saveState('add_slide', `Added slide ${insertIndex + 1}`, {
      slideId: newSlide.id,
      slideIndex: insertIndex
    });
    
    // Update the UI (renders stage, sidebar with thumbnails, etc.)
    renderAll();
  }

  function deleteSlide() {
    if (state.slides.length <= 1) return;
    
    // Store slide info before deletion for undo
    const deletedSlide = state.slides[state.currentSlideIndex];
    const deletedIndex = state.currentSlideIndex;
    
    // Remove the current slide
    state.slides.splice(state.currentSlideIndex, 1);
    
    // Adjust current slide index (move to previous slide, or stay at 0 if deleting first slide)
    state.currentSlideIndex = Math.max(0, state.currentSlideIndex - 1);
    
    // Record action for undo/redo with metadata
    saveState('delete_slide', `Deleted slide ${deletedIndex + 1}`, {
      slideId: deletedSlide.id,
      slideIndex: deletedIndex,
      deletedSlide: JSON.parse(JSON.stringify(deletedSlide)) // Store full slide data for undo
    });
    
    // Update the UI
    renderAll();
  }

  function dupSlide() {
    const src = state.slides[state.currentSlideIndex];
    if (!src) return;
    
    // Create a deep copy of the current slide
    const copy = JSON.parse(JSON.stringify(src));
    // Assign a new unique ID to the copy
    copy.id = uid();
    
    // Insert the copy immediately after the current slide
    const insertIndex = state.currentSlideIndex + 1;
    state.slides.splice(insertIndex, 0, copy);
    
    // Set the copied slide as the active slide
    state.currentSlideIndex = insertIndex;
    
    // Record action for undo/redo with metadata
    saveState('duplicate_slide', `Duplicated slide ${state.currentSlideIndex}`, {
      slideId: copy.id,
      slideIndex: insertIndex,
      sourceSlideId: src.id
    });
    
    // Update the UI
    renderAll();
  }

  function insertText() {
    // Show text options panel when clicking Text button
    const textPanel = document.getElementById('text-options-panel');
    const textSidebarItem = document.querySelector('.sidebar-item[title="Text"]');
    if (textPanel && textSidebarItem) {
      // Hide shapes panel if open
      const shapesPanel = document.getElementById('shapes-options-panel');
      if (shapesPanel) shapesPanel.classList.add('hidden');
      
      // Toggle text panel
      const isHidden = textPanel.classList.contains('hidden');
      if (isHidden) {
        textPanel.classList.remove('hidden');
        positionTextPanel();
      } else {
        textPanel.classList.add('hidden');
      }
    } else {
      // Fallback: add default text if panel doesn't exist
      addBodyText();
    }
  }
  
  function positionTextPanel() {
    const textPanel = document.getElementById('text-options-panel');
    const textSidebarItem = document.querySelector('.sidebar-item[title="Text"]');
    if (textPanel && textSidebarItem) {
      const rect = textSidebarItem.getBoundingClientRect();
      textPanel.style.left = (rect.right + 8) + 'px';
      textPanel.style.top = rect.top + 'px';
    }
  }

  function insertShape(shapeType) {
    const slide = state.slides[state.currentSlideIndex];
    const stageWidth = 1280;
    const stageHeight = 720;
    // Center on canvas
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;
    
    // Default dimensions based on shape type
    // Use Aramco theme colors: green (#006c35), blue (#00aae7), navy (#002b49)
    let width = 150;
    let height = 100;
    let fillColor = 'rgba(0, 170, 231, 0.1)'; // Light blue from Aramco theme
    let strokeColor = 'rgba(0, 43, 73, 0.3)'; // Dark navy from Aramco theme
    let strokeWidth = 2;
    let borderRadius = 12; // Smooth rounded corners for Aramco style
    
    // Adjust for specific shapes
    if (shapeType === 'rectangle') {
      width = 150;
      height = 100;
      borderRadius = 0; // Sharp corners for rectangle
    } else if (shapeType === 'rounded-rectangle') {
      width = 150;
      height = 100;
      borderRadius = 12; // Smooth rounded corners
    } else if (shapeType === 'circle') {
      width = 100;
      height = 100;
      borderRadius = 50; // Full circle
    } else if (shapeType === 'line') {
      width = 200;
      height = 3;
      fillColor = 'transparent';
      strokeColor = 'rgba(0, 43, 73, 0.4)'; // Dark navy
      strokeWidth = 2;
      borderRadius = 2; // Slight rounding for smooth appearance
    } else if (shapeType === 'arrow') {
      width = 150;
      height = 50;
      fillColor = 'rgba(0, 170, 231, 0.15)'; // Light blue from Aramco theme
      strokeColor = 'rgba(0, 170, 231, 0.5)'; // Aramco blue
      strokeWidth = 2;
      borderRadius = 8; // Rounded arrow base
    }
    
    const newElement = {
      id: uid(),
      type: 'shape',
      shape: shapeType,
      x: centerX - width / 2,
      y: centerY - height / 2,
      width: width,
      height: height,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: strokeWidth,
      strokeDash: 'solid',
      borderRadius: borderRadius,
      rotation: 0, // Default rotation angle
      zIndex: 0 // Default z-index (layer order)
    };
    slide.elements.push(newElement);
    saveState('add_shape', `Added ${shapeType} shape`, {
      elementId: newElement.id,
      elementType: 'shape',
      shapeType: shapeType
    });
    renderAll();
    
    // Select the newly added shape
    setTimeout(() => {
      const newEl = document.querySelector(`[data-id="${newElement.id}"]`);
      if (newEl) {
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        newEl.classList.add('selected');
        updateToolbarFromSelection();
        showContextToolbar(newEl);
      }
    }, 50);
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
  // Note: addSlide, deleteSlide, and dupSlide now call saveState() internally
  btnAddSlide?.addEventListener('click', () => { addSlide(); });
  btnDelSlide?.addEventListener('click', () => { deleteSlide(); });
  btnDupSlide?.addEventListener('click', () => { dupSlide(); });
  btnInsertText?.addEventListener('click', insertText);

  // Undo/Redo
  document.getElementById('btn-undo')?.addEventListener('click', undo);
  document.getElementById('btn-redo')?.addEventListener('click', redo);
  
  // Top toolbar buttons
  document.getElementById('top-toolbar-undo')?.addEventListener('click', undo);
  document.getElementById('top-toolbar-redo')?.addEventListener('click', redo);
  
  // Save button click handler
  document.getElementById('top-toolbar-save')?.addEventListener('click', () => {
    // Collect current state and build full presentation object
    const presentationData = buildPresentationData();
    
    // Convert to JSON and store in persistent storage
    persistState();
    
    // Show visual confirmation without blocking UI
    const saveBtn = document.getElementById('top-toolbar-save');
    if (saveBtn) {
      const originalText = saveBtn.querySelector('span')?.textContent || 'Save';
      
      // Update button to show "Saved" state
      const span = saveBtn.querySelector('span');
      if (span) {
        span.textContent = 'Saved';
      }
      saveBtn.classList.add('saved');
      
      // Reset after 2 seconds
      setTimeout(() => {
        if (span) {
          span.textContent = originalText;
        }
        saveBtn.classList.remove('saved');
      }, 2000);
    }
  });
  
  const textButton = document.getElementById('top-toolbar-text');
  if (textButton) {
    textButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Text button clicked'); // Debug log
      // Directly create a text box on the canvas
      // addBodyText() already handles selection, editing, and toolbar visibility
      try {
        if (typeof addBodyText === 'function') {
          addBodyText();
          console.log('addBodyText called successfully');
        } else {
          console.error('addBodyText is not a function!');
        }
      } catch (error) {
        console.error('Error in addBodyText:', error);
      }
    });
    console.log('Text button event listener registered');
  } else {
    console.error('Text button element not found in DOM!');
  }
  
  // Shapes panel
  const shapesPanel = document.getElementById('shapes-options-panel');
  const shapesSidebarItem = document.querySelector('.sidebar-item[title="Elements"]');
  const shapeOptionButtons = shapesPanel ? shapesPanel.querySelectorAll('.text-option-btn[data-shape]') : [];

  function positionShapesPanel() {
    if (!shapesPanel || !shapesSidebarItem) return;
    const rect = shapesSidebarItem.getBoundingClientRect();
    shapesPanel.style.left = (rect.right + 8) + 'px';
    shapesPanel.style.top = rect.top + 'px';
  }

  // Handle shapes sidebar item click
  if (shapesSidebarItem) {
    shapesSidebarItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      positionShapesPanel();
      const isHidden = shapesPanel.classList.contains('hidden');
      if (isHidden) {
        // Hide text panel if open
        const textPanel = document.getElementById('text-options-panel');
        if (textPanel) textPanel.classList.add('hidden');
        // Show shapes panel
        shapesPanel.classList.remove('hidden');
      } else {
        shapesPanel.classList.add('hidden');
      }
    });
  }

  // Handle shape option button clicks
  shapeOptionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const shapeType = btn.dataset.shape;
      if (shapeType) {
        insertShape(shapeType);
        if (shapesPanel) shapesPanel.classList.add('hidden');
      }
    });
  });

  document.getElementById('top-toolbar-shapes')?.addEventListener('click', () => {
    // Show shapes panel - keep it open if already open (no flicker)
    if (shapesPanel && shapesSidebarItem) {
      const isHidden = shapesPanel.classList.contains('hidden');
      if (isHidden) {
        // Hide text panel if open
        const textPanel = document.getElementById('text-options-panel');
        if (textPanel) textPanel.classList.add('hidden');
        // Show shapes panel
        shapesPanel.classList.remove('hidden');
        positionShapesPanel();
      }
      // If already open, keep it open (no action needed)
    }
  });
  
  // Image upload functionality
  const imageInput = document.createElement('input');
  imageInput.type = 'file';
  imageInput.accept = 'image/*';
  imageInput.style.display = 'none';
  document.body.appendChild(imageInput);
  
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Accept common formats: jpg, jpeg, png, gif, webp, svg
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        insertImage(imageUrl);
      };
      reader.onerror = () => {
        console.error('Failed to read image file');
        // Could show an error message to the user here
      };
      reader.readAsDataURL(file);
    }
    // Reset input to allow selecting the same file again
    imageInput.value = '';
  });
  
  function insertImage(imageUrl) {
    const slide = state.slides[state.currentSlideIndex];
    const stageWidth = 1280;
    const stageHeight = 720;
    
    // Create a temporary image to get original dimensions
    const img = new Image();
    img.onload = () => {
      // Get original dimensions
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Calculate display dimensions - scale down if too large, maintaining aspect ratio
      let displayWidth = originalWidth;
      let displayHeight = originalHeight;
      const maxWidth = stageWidth * 0.8; // 80% of canvas width
      const maxHeight = stageHeight * 0.8; // 80% of canvas height
      
      if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const scaleX = maxWidth / displayWidth;
        const scaleY = maxHeight / displayHeight;
        const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit both dimensions
        displayWidth = Math.round(displayWidth * scale);
        displayHeight = Math.round(displayHeight * scale);
      }
      
      // Center image on canvas
      const centerX = (stageWidth / 2) - (displayWidth / 2);
      const centerY = (stageHeight / 2) - (displayHeight / 2);
      
      const newElement = {
        id: uid(),
        type: 'image',
        src: imageUrl,
        x: centerX,
        y: centerY,
        originalWidth: originalWidth, // Store original dimensions
        originalHeight: originalHeight,
        width: displayWidth, // Display dimensions
        height: displayHeight,
        zIndex: 0, // Layer order
        opacity: 1, // Opacity (0-1)
        rotation: 0, // Rotation angle
        border: false, // Border flag
        borderWidth: 0,
        borderColor: 'rgba(0, 43, 73, 0.2)',
        borderRadius: 8 // Rounded corners
      };
      
      slide.elements.push(newElement);
      saveState('add_image', 'Added image', {
        elementId: newElement.id,
        elementType: 'image',
        originalWidth: originalWidth,
        originalHeight: originalHeight
      });
      renderAll();
      
      // Select the newly added image
      setTimeout(() => {
        const newEl = document.querySelector(`[data-id="${newElement.id}"]`);
        if (newEl) {
          document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
          newEl.classList.add('selected');
          updateToolbarFromSelection();
          showContextToolbar(newEl);
          hideTextControlBar();
        }
      }, 50);
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
      // Could show an error message to the user here
    };
    
    img.src = imageUrl;
  }
  
  // Handle upload button clicks
  const uploadButtons = document.querySelectorAll('.sidebar-item[title="Upload"]');
  uploadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      imageInput.click();
    });
  });
  
  document.getElementById('top-toolbar-images')?.addEventListener('click', () => {
    // Open image upload
    imageInput.click();
  });
  
  document.getElementById('top-toolbar-theme')?.addEventListener('click', () => {
    // Apply Aramco theme
    applyTheme('aramco');
  });
  
  // Theme color button handlers
  const themeColorButtons = document.querySelectorAll('.theme-color-btn');
  themeColorButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = btn.dataset.theme;
      if (theme) {
        // Remove active class from all theme buttons
        themeColorButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Apply theme
        applyTheme(theme);
      }
    });
  });
  
  // Function to apply theme
  function applyTheme(themeName, save = true) {
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return;
    
    // Store theme in slide metadata
    slide.theme = themeName;
    
    // Apply theme colors to stage background
    const stage = document.getElementById('stage');
    if (stage) {
      switch(themeName) {
        case 'aramco':
          stage.style.background = '#ffffff';
          break;
        case 'ocean':
          stage.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
          break;
        case 'forest':
          stage.style.background = 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
          break;
        case 'sunset':
          stage.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
          break;
        default:
          stage.style.background = '#ffffff';
      }
    }
    
    // Update active theme button
    const themeColorButtons = document.querySelectorAll('.theme-color-btn');
    themeColorButtons.forEach(btn => {
      if (btn.dataset.theme === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    if (save) {
      saveState();
      renderSidebar();
    }
  }
  
  // Layout option button handlers
  const layoutOptionButtons = document.querySelectorAll('.layout-option-btn');
  layoutOptionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const layout = btn.dataset.layout;
      if (layout) {
        // Remove active class from all layout buttons
        layoutOptionButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Apply layout (for now, just store it - can be extended later)
        const slide = state.slides[state.currentSlideIndex];
        if (slide) {
          slide.layout = layout;
          saveState();
        }
      }
    });
  });
  
  // Slide notes textarea handler
  const slideNotesTextarea = document.getElementById('slide-notes-textarea');
  if (slideNotesTextarea) {
    slideNotesTextarea.addEventListener('input', () => {
      const slide = state.slides[state.currentSlideIndex];
      if (slide) {
        slide.notes = slideNotesTextarea.value;
        saveState();
      }
    });
    
    slideNotesTextarea.addEventListener('blur', () => {
      const slide = state.slides[state.currentSlideIndex];
      if (slide) {
        slide.notes = slideNotesTextarea.value;
        saveState();
      }
    });
  }

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
    saveState(); // Auto-save title changes
  });
  
  // Also save on blur to catch programmatic changes
  deckTitleEl?.addEventListener('blur', () => {
    state.title = deckTitleEl.textContent || 'Untitled presentation';
    saveState();
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
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Don't delete if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      e.preventDefault();
      const selected = getSelectedElement();
      if (selected) {
        const slide = state.slides[state.currentSlideIndex];
        const elId = selected.dataset.id;
        const index = slide.elements.findIndex(e => e.id === elId);
        if (index >= 0) {
          // Record action for undo/redo
          const deletedElement = slide.elements[index];
          slide.elements.splice(index, 1);
          saveState(); // This includes undo/redo history
          renderAll();
          // Hide toolbars after deletion
          hideTextControlBar();
          const contextToolbar = document.getElementById('floating-toolbar');
          if (contextToolbar) contextToolbar.classList.add('hidden');
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

  // Function to add title text
  function addTitleText() {
    const slide = state.slides[state.currentSlideIndex];
    const stageWidth = 1280;
    const stageHeight = 720;
    // Center on canvas
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2 - 100; // Slightly above center for title
    
    const newElement = {
      id: uid(),
      type: 'text',
      x: centerX,
      y: centerY,
      text: 'Title',
      fontSize: 64,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'center',
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      strokeColor: '#002b49',
      strokeWidth: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    
    // Adjust x position to center text properly after rendering
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        const rect = node.getBoundingClientRect();
        const textWidth = rect.width;
        newElement.x = centerX - (textWidth / 2);
        node.style.left = newElement.x + 'px';
        saveState();
        
        // Select and focus the newly created element
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        node.classList.add('selected');
        showTextControlBarForElement(newElement);
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

  // Function to add heading
  function addHeading() {
    const slide = state.slides[state.currentSlideIndex];
    const stageWidth = 1280;
    const stageHeight = 720;
    // Center on canvas
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2 - 50; // Slightly above center for heading
    
    const newElement = {
      id: uid(),
      type: 'text',
      x: centerX,
      y: centerY,
      text: 'Heading',
      fontSize: 48,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'center',
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      strokeColor: '#002b49',
      strokeWidth: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    
    // Adjust x position to center text properly after rendering
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        const rect = node.getBoundingClientRect();
        const textWidth = rect.width;
        newElement.x = centerX - (textWidth / 2);
        node.style.left = newElement.x + 'px';
        saveState();
        
        // Select and focus the newly created element
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        node.classList.add('selected');
        showTextControlBarForElement(newElement);
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
    const stageWidth = 1280;
    const stageHeight = 720;
    // Center on canvas
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2; // Center for subheading
    
    const newElement = {
      id: uid(),
      type: 'text',
      x: centerX,
      y: centerY,
      text: 'Subheading',
      fontSize: 36,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'center',
      underline: false,
      lineHeight: 1.2,
      listType: null,
      rotation: 0,
      scale: 1,
      strokeColor: '#002b49',
      strokeWidth: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    
    // Adjust x position to center text properly after rendering
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        const rect = node.getBoundingClientRect();
        const textWidth = rect.width;
        newElement.x = centerX - (textWidth / 2);
        node.style.left = newElement.x + 'px';
        saveState();
        
        // Select and focus the newly created element
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        node.classList.add('selected');
        showTextControlBarForElement(newElement);
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
    // 1. Check which slide is currently active
    const slide = state.slides[state.currentSlideIndex];
    if (!slide) return;
    
    const stageWidth = 1280;
    const stageHeight = 720;
    // 2. Place the text box in the visible area of the canvas (centered)
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;
    
    // 3. Create a new text box element with all required properties
    const newElement = {
      id: uid(),
      type: 'text',
      // Position: x, y relative to the canvas
      x: centerX,
      y: centerY,
      // Text content (string) - default placeholder text
      text: 'Click to edit text',
      content: 'Click to edit text',
      // Font size
      fontSize: 18,
      // Font family
      fontFamily: 'Inter, system-ui, sans-serif',
      // Font weight (normal, bold)
      fontWeight: 'normal',
      fontStyle: 'normal',
      // Text color
      color: '#111',
      // Text alignment
      textAlign: 'center',
      underline: false,
      lineHeight: 1.4,
      listType: null,
      rotation: 0,
      scale: 1,
      // Background / border settings
      fillColor: 'transparent',
      strokeColor: '#002b49',
      strokeWidth: 1,
      strokeDash: 'solid',
      // Width and height will be auto-calculated based on content
      locked: false
    };
    
    // 4. Add the text box to the active slide's canvas
    slide.elements.push(newElement);
    
    // 7. Persist state - create action entry for Undo/Redo
    saveState();
    renderAll();
    
    // 5. Make the text box focused and ready for typing
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        // Adjust x position to center text properly after rendering
        const rect = node.getBoundingClientRect();
        const textWidth = rect.width;
        newElement.x = centerX - (textWidth / 2);
        node.style.left = newElement.x + 'px';
        saveState();
        
        // Select the text box
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        node.classList.add('selected');
        
        // Show the text control bar (toolbar)
    showTextControlBarForElement(newElement);
        
        // Enter text editing mode
        enterTextEditing(node, newElement);
        
        // 5. Set cursor inside the text and select all existing placeholder text
        // so typing replaces it
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        
        // Ensure cursor is visible and ready for typing
        requestAnimationFrame(() => {
          node.focus();
          // Re-select all text to ensure it's fully selected
          const range2 = document.createRange();
          range2.selectNodeContents(node);
          const sel2 = window.getSelection();
          sel2?.removeAllRanges();
          sel2?.addRange(range2);
        });
      }
    }, 50);
  }

  // Function to add caption
  function addCaption() {
    const slide = state.slides[state.currentSlideIndex];
    const stageWidth = 1280;
    const stageHeight = 720;
    // Center on canvas
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2 + 50; // Slightly below center for caption
    
    const newElement = {
      id: uid(),
      type: 'text',
      x: centerX,
      y: centerY,
      text: 'Caption',
      fontSize: 14,
      color: '#111',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      underline: false,
      lineHeight: 1.4,
      listType: null,
      rotation: 0,
      scale: 1,
      strokeColor: '#002b49',
      strokeWidth: 1
    };
    slide.elements.push(newElement);
    saveState();
    renderAll();
    
    // Adjust x position to center text properly after rendering
    setTimeout(() => {
      const node = document.querySelector(`[data-id="${newElement.id}"]`);
      if (node) {
        const rect = node.getBoundingClientRect();
        const textWidth = rect.width;
        newElement.x = centerX - (textWidth / 2);
        node.style.left = newElement.x + 'px';
        saveState();
        
        // Select and focus the newly created element
        document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
        node.classList.add('selected');
        showTextControlBarForElement(newElement);
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
        fontSize: 18,
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
  const textFontSize = document.getElementById('text-font-size');
  const textBoldBtn = document.getElementById('text-bold');
  const textItalicBtn = document.getElementById('text-italic');
  const textUnderlineBtn = document.getElementById('text-underline');
  const textColorPicker = document.getElementById('text-color-picker');
  const textAlignButtons = textControlBar ? textControlBar.querySelectorAll('.align-btn') : [];
  let editingElementId = null;
  let editingNode = null;
  
  // Zoom functionality
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomValue = document.querySelector('.zoom-value');
  // Use the existing stageContainer variable (defined earlier as stageEl?.parentElement)
  // For zoom, we need the .stage-container element, so get it separately
  const stageContainerForZoom = document.querySelector('.stage-container');
  let currentZoom = 100;
  
  function updateZoom(zoom) {
    currentZoom = Math.max(50, Math.min(200, zoom));
    if (zoomValue) zoomValue.textContent = `${currentZoom}%`;
    if (stageContainerForZoom) {
      const scale = currentZoom / 100;
      stageContainerForZoom.style.transform = `scale(${scale})`;
      stageContainerForZoom.style.transformOrigin = 'center center';
      stageContainerForZoom.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    }
  }
  
  zoomInBtn?.addEventListener('click', () => {
    const steps = [100, 125, 150, 175, 200];
    const nextZoom = steps.find(z => z > currentZoom) || 200;
    updateZoom(nextZoom);
  });
  
  zoomOutBtn?.addEventListener('click', () => {
    const steps = [50, 75, 100, 125, 150, 175, 200];
    const prevZoom = [...steps].reverse().find(z => z < currentZoom) || 50;
    updateZoom(prevZoom);
  });
  
  // Initialize zoom
  updateZoom(100);

  const dragIndicator = document.createElement('div');
  dragIndicator.className = 'drag-indicator hidden';
  stageWrap?.appendChild(dragIndicator);

  // Text search disabled – placeholder functions for compatibility
  // searchState is declared later in the code, so we don't redeclare it here
  function lockInteractivity() {}


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

  function updateTextControlBar(el) {
    if (!textControlBar || !el) return;
    if (el.type === 'shape') {
      // For shapes, show width/height in size field
      if (textFontSize) {
        textFontSize.value = Math.round(el.width || 100);
        textFontSize.title = 'Width';
      }
      if (textColorPicker) {
        // For shapes, use fillColor
        const color = el.fillColor || 'rgba(255, 255, 255, 0.9)';
        // Convert rgba to hex if needed
        if (color.startsWith('rgba') || color.startsWith('rgb')) {
          const rgb = color.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const hex = '#' + rgb.slice(0, 3).map(x => {
              const val = parseInt(x);
              return (val < 16 ? '0' : '') + val.toString(16);
            }).join('');
            textColorPicker.value = hex;
          } else {
            textColorPicker.value = '#ffffff';
          }
        } else {
          textColorPicker.value = color;
        }
      }
    } else {
      // For text elements
      if (textFontSize) {
        textFontSize.value = el.fontSize || 18;
        textFontSize.title = 'Font size';
      }
      if (textColorPicker) {
      const color = el.color || '#111111';
        textColorPicker.value = color;
    }
      const isBold = (el.fontWeight && String(el.fontWeight).toLowerCase() === 'bold') || Number(el.fontWeight) >= 700;
    textBoldBtn?.classList.toggle('active', isBold);
    const isItalic = String(el.fontStyle).toLowerCase() === 'italic';
    textItalicBtn?.classList.toggle('active', isItalic);
    const isUnderline = !!el.underline;
    textUnderlineBtn?.classList.toggle('active', isUnderline);
    }
    if (textAlignButtons) {
      textAlignButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === (el.textAlign || 'left'));
      });
    }
  }

  function showTextControlBarForElement(el) {
    if (!textControlBar || !el) return;
    updateTextControlBar(el);
    
    // Ensure toolbar is appended to stage for absolute positioning
    if (textControlBar.parentElement !== stageEl) {
      stageEl.appendChild(textControlBar);
    }
    
    // Find the element node (text or shape)
    const node = document.querySelector(`[data-id="${el.id}"]`);
    if (!node) return;
    
    // For shapes, hide text-specific buttons (Bold, Italic, Underline)
    if (el.type === 'shape') {
      textBoldBtn?.classList.add('hidden');
      textItalicBtn?.classList.add('hidden');
      textUnderlineBtn?.classList.add('hidden');
    } else {
      textBoldBtn?.classList.remove('hidden');
      textItalicBtn?.classList.remove('hidden');
      textUnderlineBtn?.classList.remove('hidden');
    }
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      // Position the toolbar inline (below the text element)
      const nodeRect = node.getBoundingClientRect();
      const stageRect = stageEl.getBoundingClientRect();
      
      // Calculate position relative to stage
      const offsetX = nodeRect.left - stageRect.left + (nodeRect.width / 2);
      const offsetY = nodeRect.bottom - stageRect.top + 12; // 12px gap below text
      
      // Get toolbar dimensions
      textControlBar.style.visibility = 'hidden';
      textControlBar.classList.remove('hidden');
      const toolbarRect = textControlBar.getBoundingClientRect();
      const toolbarWidth = toolbarRect.width;
      const toolbarHeight = toolbarRect.height;
      
      // Check if toolbar would go below stage, if so position above
      let finalY = offsetY;
      if (offsetY + toolbarHeight > 720) {
        finalY = nodeRect.top - stageRect.top - toolbarHeight - 12; // 12px gap above text
      }
      
      // Constrain to stage bounds
      const constrainedX = Math.max(8, Math.min(offsetX - (toolbarWidth / 2), 1280 - toolbarWidth - 8));
      const constrainedY = Math.max(8, Math.min(finalY, 720 - toolbarHeight - 8));
      
      textControlBar.style.left = constrainedX + 'px';
      textControlBar.style.top = constrainedY + 'px';
      textControlBar.style.visibility = 'visible';
    });
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
      // Keep toolbar visible if text element is still selected
      if (editingNode.classList.contains('selected')) {
        showTextControlBarForElement(el);
      }
    }
    editingElementId = null;
    editingNode = null;
    const selected = getSelectedElement();
    if (selected && selected.classList.contains('text')) {
      const elId = selected.dataset.id;
      const slide = state.slides[state.currentSlideIndex];
      const el = slide.elements.find(e => e.id === elId);
      if (el) {
        showTextControlBarForElement(el);
      }
    } else if (!selected) {
    hideTextControlBar();
    }
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
    // Keep toolbar visible after command execution
    const el = getEditingElement();
    if (el) {
      showTextControlBarForElement(el);
    }
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
    if (shapesPanel && !shapesPanel.contains(e.target) && !shapesSidebarItem?.contains(e.target) && !document.getElementById('top-toolbar-shapes')?.contains(e.target)) {
      shapesPanel.classList.add('hidden');
    }
  });
  
  window.addEventListener('resize', () => {
    if (shapesPanel && !shapesPanel.classList.contains('hidden')) {
      positionShapesPanel();
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

      if (option === 'title') {
        addTitleText();
        hideTextPanel();
      } else if (option === 'heading') {
        addHeading();
        hideTextPanel();
      } else if (option === 'subheading') {
        addSubheading();
        hideTextPanel();
      } else if (option === 'body') {
        addBodyText();
        hideTextPanel();
      } else if (option === 'caption') {
        addCaption();
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
    // Don't hide if clicking on text control bar
    if (e.target.closest('#text-control-bar')) {
      return;
    }
    if (!e.target.closest('.el')) {
      document.querySelectorAll('.el').forEach(el => el.classList.remove('selected'));
      hideContextToolbar();
      exitTextEditing();
      hideTextControlBar();
    } else {
      // If clicking on an element, show toolbar for text or shape
      const clickedEl = e.target.closest('.el');
      if (clickedEl) {
        const elId = clickedEl.dataset.id;
        const slide = state.slides[state.currentSlideIndex];
        const el = slide.elements.find(e => e.id === elId);
        if (el && (el.type === 'text' || el.type === 'shape')) {
          showTextControlBarForElement(el);
        } else {
          hideTextControlBar();
        }
      }
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
    const el = getEditingElement();
    if (el && el.type === 'shape') {
      // For shapes, update width
      el.width = size;
      const node = document.querySelector(`[data-id="${el.id}"]`);
      if (node) {
        node.style.width = `${size}px`;
      }
      saveState();
      renderAll();
      // Reselect to update toolbar position
      setTimeout(() => {
        const updatedNode = document.querySelector(`[data-id="${el.id}"]`);
        if (updatedNode) {
          updatedNode.classList.add('selected');
          showTextControlBarForElement(el);
        }
      }, 0);
    } else {
      // For text elements
    const applied = applyStyleToSelection(span => { span.style.fontSize = `${size}px`; });
    if (!applied) {
      if (!el || !editingNode) return;
      el.fontSize = size;
      editingNode.style.fontSize = `${size}px`;
    }
    syncEditingContent();
    updateFormattingButtons();
    }
    // Keep toolbar visible
    if (el) showTextControlBarForElement(el);
  });

  textColorPicker?.addEventListener('input', () => {
    const value = textColorPicker.value;
    const el = getEditingElement();
    if (el && el.type === 'shape') {
      // For shapes, update fillColor
      el.fillColor = value;
      const node = document.querySelector(`[data-id="${el.id}"]`);
      if (node) {
        node.style.backgroundColor = value;
      }
      saveState();
    } else {
      // For text elements
    const applied = applyStyleToSelection(span => { span.style.color = value; });
    if (!applied) {
      if (!el || !editingNode) return;
      el.color = value;
      editingNode.style.color = value;
    }
    syncEditingContent();
    updateFormattingButtons();
    }
    // Keep toolbar visible
    if (el) showTextControlBarForElement(el);
  });

  textBoldBtn?.addEventListener('click', () => {
    applyExecCommand('bold');
    // Keep toolbar visible after bold operation
    const el = getEditingElement();
    if (el) showTextControlBarForElement(el);
    // Normalize bold to fontWeight 700 for consistency
    if (editingNode) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const spans = editingNode.querySelectorAll('span[style*="font-weight"], strong, b');
        spans.forEach(span => {
          const weight = span.style.fontWeight || window.getComputedStyle(span).fontWeight;
          if (weight === 'bold' || Number(weight) >= 600) {
            span.style.fontWeight = '700';
          }
        });
        // Also update the element's fontWeight if entire element is bold
        const el = getEditingElement();
        if (el) {
          const computedWeight = window.getComputedStyle(editingNode).fontWeight;
          if (computedWeight === 'bold' || Number(computedWeight) >= 700) {
            el.fontWeight = '700';
            editingNode.style.fontWeight = '700';
          }
          // Keep toolbar visible after bold operation
          showTextControlBarForElement(el);
        }
      }
    }
    syncEditingContent();
    updateFormattingButtons();
  });

  textItalicBtn?.addEventListener('click', () => {
    applyExecCommand('italic');
    // Keep toolbar visible after italic operation
    const el = getEditingElement();
    if (el) showTextControlBarForElement(el);
    syncEditingContent(); // Auto-save formatting changes
    updateFormattingButtons();
  });

  textUnderlineBtn?.addEventListener('click', () => {
    applyExecCommand('underline');
    // Keep toolbar visible after underline operation
    const el = getEditingElement();
    if (el) showTextControlBarForElement(el);
    syncEditingContent(); // Auto-save formatting changes
    updateFormattingButtons();
  });

  // Delete button
  const textDeleteBtn = document.getElementById('text-delete');
  textDeleteBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Try to get element from editing state first
    let el = getEditingElement();
    // If not editing, try to get from selected element
    if (!el) {
      const selected = getSelectedElement();
      if (selected && selected.classList.contains('text')) {
        const elId = selected.dataset.id;
        const slide = state.slides[state.currentSlideIndex];
        el = slide.elements.find(e => e.id === elId);
      }
    }
    if (!el) return;
    const slide = state.slides[state.currentSlideIndex];
    const index = slide.elements.findIndex(e => e.id === el.id);
    if (index >= 0) {
      slide.elements.splice(index, 1);
      exitTextEditing();
      hideTextControlBar();
      saveState();
      renderAll();
    }
  });

  // Move button - enables drag mode
  const textMoveBtn = document.getElementById('text-move');
  textMoveBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = getEditingElement();
    if (!el || !editingNode) return;
    // Exit editing mode and enable dragging
    exitTextEditing();
    // Select the element for dragging
    const node = document.querySelector(`[data-id="${el.id}"]`);
    if (node) {
      node.click();
      // Keep toolbar visible
      showTextControlBarForElement(el);
    }
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
      // Keep toolbar visible after alignment change
      showTextControlBarForElement(el);
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
  // Text search state
  const searchState = {
    active: false,
    query: '',
    matches: [],
    currentIndex: -1
  };
  
  // Debounced text search to prevent freezing
  let searchTimeout = null;
  function performTextSearch(query) {
    // Clear any pending search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search to prevent freezing
    searchTimeout = setTimeout(() => {
      if (!query || !query.trim()) {
        searchState.active = false;
        searchState.matches = [];
        searchState.currentIndex = -1;
        return [];
      }
      
      const q = query.trim().toLowerCase();
      searchState.query = q;
      searchState.matches = [];
      searchState.currentIndex = -1;
      
      // Search through all slides and elements (use requestAnimationFrame for non-blocking)
      requestAnimationFrame(() => {
        state.slides.forEach((slide, slideIndex) => {
          slide.elements.forEach((el, elIndex) => {
            if (el.type === 'text') {
              const text = (el.text || el.content || '').toLowerCase();
              if (text.includes(q)) {
                searchState.matches.push({
                  slideIndex,
                  elIndex,
                  element: el,
                  text: el.text || el.content
                });
              }
            }
          });
        });
        
        searchState.active = searchState.matches.length > 0;
        if (searchState.active && searchState.matches.length > 0) {
          searchState.currentIndex = 0;
          // Navigate to first match
          navigateToSearchMatch(0);
        }
      });
      
      searchTimeout = null;
    }, 150); // 150ms debounce
    
    return searchState.matches;
  }
  
  function navigateToSearchMatch(index) {
    if (index < 0 || index >= searchState.matches.length) return;
    const match = searchState.matches[index];
    searchState.currentIndex = index;
    
    // Switch to the slide containing the match
    if (state.currentSlideIndex !== match.slideIndex) {
      state.currentSlideIndex = match.slideIndex;
      renderAll();
    }
    
    // Highlight the matched element
    requestAnimationFrame(() => {
      const node = document.querySelector(`[data-id="${match.element.id}"]`);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        node.classList.add('search-highlight');
        setTimeout(() => {
          node.classList.remove('search-highlight');
        }, 2000);
      }
    });
  }
  
  function searchNext() {
    if (!searchState.active || searchState.matches.length === 0) return;
    const nextIndex = (searchState.currentIndex + 1) % searchState.matches.length;
    navigateToSearchMatch(nextIndex);
  }
  
  function searchPrev() {
    if (!searchState.active || searchState.matches.length === 0) return;
    const prevIndex = searchState.currentIndex <= 0 
      ? searchState.matches.length - 1 
      : searchState.currentIndex - 1;
    navigateToSearchMatch(prevIndex);
  }
  
  function clearTextSearch() {
    searchState.active = false;
    searchState.query = '';
    searchState.matches = [];
    searchState.currentIndex = -1;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    // Remove all search highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.classList.remove('search-highlight');
    });
  }
  
  function releaseInteractionAfterScroll() {}

  // Throttle resize handler to prevent lag
  let resizeTimeoutToolbar = null;
  window.addEventListener('resize', () => {
    if (resizeTimeoutToolbar) return;
    resizeTimeoutToolbar = requestAnimationFrame(() => {
    if (currentToolbarTarget && !floatingToolbar?.classList.contains('hidden')) {
      positionFloatingToolbar(currentToolbarTarget);
    }
      resizeTimeoutToolbar = null;
    });
  });

  // Throttle scroll handler to prevent lag
  let scrollTimeoutToolbar = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeoutToolbar) return;
    scrollTimeoutToolbar = requestAnimationFrame(() => {
    if (currentToolbarTarget && !floatingToolbar?.classList.contains('hidden')) {
      positionFloatingToolbar(currentToolbarTarget);
    }
      scrollTimeoutToolbar = null;
    });
  }, true);

  stageEl.parentElement?.addEventListener('scroll', () => {
    if (scrollTimeoutToolbar) return;
    scrollTimeoutToolbar = requestAnimationFrame(() => {
    if (currentToolbarTarget && !floatingToolbar?.classList.contains('hidden')) {
      positionFloatingToolbar(currentToolbarTarget);
    }
      scrollTimeoutToolbar = null;
    });
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
      // Keep toolbar visible when selection changes
      const el = getEditingElement();
      if (el) {
        showTextControlBarForElement(el);
      }
      updateFormattingButtons();
    }
  });

  window.searchText = performTextSearch;
  window.searchNext = searchNext;
  window.searchPrev = searchPrev;
  window.clearTextSearch = clearTextSearch;

  // Ensure final save on page unload
  window.addEventListener('beforeunload', () => {
    persistState();
  });
  
  // Also save on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      persistState();
    }
  });

  // Mobile sidebar toggle functionality
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const slidesSidebar = document.getElementById('slides-sidebar');
  const editorSidebar = document.querySelector('.editor-sidebar');
  const rightSidebar = document.querySelector('.right-sidebar');
  
  let mobileSidebarOpen = false;
  
  function toggleMobileSidebars() {
    mobileSidebarOpen = !mobileSidebarOpen;
    const app = document.getElementById('app');
    
    if (window.innerWidth <= 768) {
      if (mobileSidebarOpen) {
        // Show sidebars on mobile
        if (app) app.classList.add('mobile-sidebar-open');
        if (slidesSidebar) slidesSidebar.style.display = 'flex';
        if (sidebar) sidebar.style.display = 'flex';
        if (editorSidebar) editorSidebar.style.display = 'flex';
        if (rightSidebar) rightSidebar.style.display = 'flex';
      } else {
        // Hide sidebars on mobile
        if (app) app.classList.remove('mobile-sidebar-open');
        if (slidesSidebar) slidesSidebar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        if (editorSidebar) editorSidebar.style.display = 'none';
        if (rightSidebar) rightSidebar.style.display = 'none';
      }
    }
  }
  
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileSidebars();
    });
  }
  
  // Handle window resize to show/hide sidebars appropriately
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) return;
    resizeTimeout = setTimeout(() => {
      const app = document.getElementById('app');
      if (window.innerWidth > 768) {
        // Always show sidebars on desktop
        if (app) app.classList.remove('mobile-sidebar-open');
        if (slidesSidebar) slidesSidebar.style.display = '';
        if (sidebar) sidebar.style.display = '';
        if (editorSidebar) editorSidebar.style.display = '';
        if (rightSidebar) rightSidebar.style.display = '';
        mobileSidebarOpen = false;
      } else {
        // Hide sidebars by default on mobile
        if (!mobileSidebarOpen) {
          if (app) app.classList.remove('mobile-sidebar-open');
          if (slidesSidebar) slidesSidebar.style.display = 'none';
          if (sidebar) sidebar.style.display = 'none';
          if (editorSidebar) editorSidebar.style.display = 'none';
          if (rightSidebar) rightSidebar.style.display = 'none';
        }
      }
      resizeTimeout = null;
    }, 150);
  });
  
  // Initial check for mobile
  if (window.innerWidth <= 768 && !mobileSidebarOpen) {
    const app = document.getElementById('app');
    if (app) app.classList.remove('mobile-sidebar-open');
    if (slidesSidebar) slidesSidebar.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (editorSidebar) editorSidebar.style.display = 'none';
    if (rightSidebar) rightSidebar.style.display = 'none';
  }

  // Initial render after loading/initializing state
  // This rebuilds all slides and elements from saved data (if any)
  renderAll();
  
  // Initialize clean Undo/Redo history after loading
  // The history stack starts with the current state
  saveState('init', 'Initial state after load');
  updateUndoRedoButtons();
  
  // Debug: Verify button exists
  const textBtn = document.getElementById('top-toolbar-text');
  if (!textBtn) {
    console.error('Text button not found!');
  } else {
    console.log('Text button found, event listener attached');
  }
  
  // Debug: Verify function exists
  if (typeof addBodyText === 'function') {
    console.log('addBodyText function is available');
  } else {
    console.error('addBodyText function is NOT available!');
  }

  // Panel Toggle Functionality with Floating Button
  const PANEL_STATE_KEY = 'rightPanelVisible';
  const EDGE_DETECTION_DISTANCE = 120; // pixels from right edge
  
  // Initialize panel toggle - use setTimeout to ensure DOM is fully ready
  setTimeout(function() {
    const panelToggleBtn = document.getElementById('panel-toggle-floating-btn');
    const rightSidebarPanel = document.querySelector('.right-sidebar');
    const stageContainerForPanel = document.querySelector('.stage-container');
    const stageWrap = document.querySelector('.stage-wrap');
    
    if (!panelToggleBtn) {
      console.error('Panel toggle button not found!');
      return;
    }
    
    if (!rightSidebarPanel) {
      console.error('Right sidebar not found!');
      return;
    }
    
    if (!stageContainerForPanel) {
      console.error('Stage container not found!');
      return;
    }
    
    let mouseMoveTimeout = null;
    let isButtonVisible = false;
    
    // Load panel state from localStorage
    function loadPanelState() {
      const savedState = localStorage.getItem(PANEL_STATE_KEY);
      if (savedState === null) {
        // Default to visible if no saved state
        return true;
      }
      return savedState === 'true';
    }
    
    // Save panel state to localStorage
    function savePanelState(isVisible) {
      localStorage.setItem(PANEL_STATE_KEY, String(isVisible));
    }
    
    // Update button icon based on panel state
    function updateButtonIcon(isPanelVisible) {
      if (isPanelVisible) {
        panelToggleBtn.classList.remove('panel-hidden');
      } else {
        panelToggleBtn.classList.add('panel-hidden');
      }
    }
    
    // Show button with fade in
    function showButton() {
      if (!isButtonVisible) {
        isButtonVisible = true;
        panelToggleBtn.classList.add('visible');
      }
    }
    
    // Hide button with fade out
    function hideButton() {
      if (isButtonVisible) {
        isButtonVisible = false;
        panelToggleBtn.classList.remove('visible');
      }
    }
    
    // Check if mouse is near right edge
    function checkMousePosition(e) {
      const windowWidth = window.innerWidth;
      const mouseX = e.clientX;
      const distanceFromRight = windowWidth - mouseX;
      
      // Don't hide if mouse is over the button itself
      const buttonRect = panelToggleBtn.getBoundingClientRect();
      const isOverButton = mouseX >= buttonRect.left && mouseX <= buttonRect.right &&
                          e.clientY >= buttonRect.top && e.clientY <= buttonRect.bottom;
      
      if (distanceFromRight <= EDGE_DETECTION_DISTANCE || isOverButton) {
        showButton();
        // Clear any pending hide timeout
        if (mouseMoveTimeout) {
          clearTimeout(mouseMoveTimeout);
          mouseMoveTimeout = null;
        }
      } else {
        // Delay hiding to avoid flickering
        if (mouseMoveTimeout) {
          clearTimeout(mouseMoveTimeout);
        }
        mouseMoveTimeout = setTimeout(function() {
          // Double-check mouse position before hiding
          const currentDistance = window.innerWidth - e.clientX;
          if (currentDistance > EDGE_DETECTION_DISTANCE && !isOverButton) {
            hideButton();
          }
        }, 300);
      }
    }
    
    // Toggle panel visibility
    function togglePanel() {
      const isCurrentlyVisible = !rightSidebarPanel.classList.contains('hidden');
      const shouldBeVisible = !isCurrentlyVisible;
      
      if (shouldBeVisible) {
        // Show panel: slide in from right, zoom out canvas (scale 1.0 → 0.95)
        rightSidebarPanel.classList.remove('hidden');
        stageContainerForPanel.classList.remove('zoomed');
        panelToggleBtn.classList.add('panel-visible');
      } else {
        // Hide panel: slide out to right, zoom in canvas (scale 0.95 → 1.0)
        rightSidebarPanel.classList.add('hidden');
        stageContainerForPanel.classList.add('zoomed');
        panelToggleBtn.classList.remove('panel-visible');
      }
      
      // Update button icon
      updateButtonIcon(shouldBeVisible);
      
      // Save state
      savePanelState(shouldBeVisible);
    }
    
    // Initialize panel state on page load
    function initializePanelState() {
      const shouldBeVisible = loadPanelState();
      
      if (shouldBeVisible) {
        // Panel visible: canvas at scale 0.95
        rightSidebarPanel.classList.remove('hidden');
        stageContainerForPanel.classList.remove('zoomed');
        panelToggleBtn.classList.add('panel-visible');
      } else {
        // Panel hidden: canvas at scale 1.0 (expanded)
        rightSidebarPanel.classList.add('hidden');
        stageContainerForPanel.classList.add('zoomed');
        panelToggleBtn.classList.remove('panel-visible');
      }
      
      // Update button icon based on initial state
      updateButtonIcon(shouldBeVisible);
    }
    
    // Attach event listeners
    panelToggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Panel toggle button clicked!');
      togglePanel();
    });
    
    // Track mouse movement to show/hide button
    document.addEventListener('mousemove', checkMousePosition);
    
    // Show button when hovering over the button itself
    panelToggleBtn.addEventListener('mouseenter', function() {
      showButton();
      // Clear any pending hide timeout when hovering over button
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = null;
      }
    });
    
    // Keep button visible when mouse leaves (with delay)
    panelToggleBtn.addEventListener('mouseleave', function(e) {
      // Don't hide immediately, let the mousemove handler manage it
      setTimeout(function() {
        const mouseX = e.clientX;
        const distanceFromRight = window.innerWidth - mouseX;
        if (distanceFromRight > EDGE_DETECTION_DISTANCE) {
          hideButton();
        }
      }, 100);
    });
    
    // Initialize panel state on page load
    initializePanelState();
    
    console.log('Panel toggle with floating button initialized successfully', {
      button: panelToggleBtn,
      sidebar: rightSidebarPanel,
      container: stageContainerForPanel,
      buttonRect: panelToggleBtn.getBoundingClientRect()
    });
    
    // Debug: Log when button becomes visible
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (panelToggleBtn.classList.contains('visible')) {
            console.log('Button is now visible');
          } else {
            console.log('Button is now hidden');
          }
        }
      });
    });
    observer.observe(panelToggleBtn, { attributes: true, attributeFilter: ['class'] });
  }, 100);
})();


