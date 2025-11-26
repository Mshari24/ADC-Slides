// Slide Management Module with Undo/Redo Functionality

// jsPDF and html2canvas are loaded via CDN script tags, available as window.jspdf and window.html2canvas

(function() {
  'use strict';

  // Undo/Redo History Stacks
  let undoStack = [];
  let redoStack = [];

  // Get or create slides container
  function getSlidesContainer() {
    let container = document.getElementById('slides-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'slides-container';
      const stage = document.getElementById('stage');
      if (stage) {
        stage.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
      // Append guides to container when it's first created
      if (verticalGuide && horizontalGuide) {
        container.appendChild(verticalGuide);
        container.appendChild(horizontalGuide);
      }
    }
    return container;
  }

  // Create alignment guide elements
  let verticalGuide = document.createElement('div');
  verticalGuide.id = 'vertical-guide';
  verticalGuide.style.position = 'absolute';
  verticalGuide.style.width = '2px';
  verticalGuide.style.height = '100%';
  verticalGuide.style.background = 'rgba(0, 0, 0, 0.15)';
  verticalGuide.style.top = '0';
  verticalGuide.style.left = '50%';
  verticalGuide.style.transform = 'translateX(-1px)';
  verticalGuide.style.display = 'none';
  verticalGuide.style.pointerEvents = 'none';
  verticalGuide.style.zIndex = '9999';

  let horizontalGuide = document.createElement('div');
  horizontalGuide.id = 'horizontal-guide';
  horizontalGuide.style.position = 'absolute';
  horizontalGuide.style.width = '100%';
  horizontalGuide.style.height = '2px';
  horizontalGuide.style.background = 'rgba(0, 0, 0, 0.15)';
  horizontalGuide.style.left = '0';
  horizontalGuide.style.top = '50%';
  horizontalGuide.style.transform = 'translateY(-1px)';
  horizontalGuide.style.display = 'none';
  horizontalGuide.style.pointerEvents = 'none';
  horizontalGuide.style.zIndex = '9999';

  document.addEventListener('DOMContentLoaded', () => {
    const container = getSlidesContainer();
    if (container) {
      container.appendChild(verticalGuide);
      container.appendChild(horizontalGuide);
    }
  });

  function updateAlignmentGuides(element) {
    const canvas = getSlidesContainer();
    if (!canvas || !element) {
      verticalGuide.style.display = 'none';
      horizontalGuide.style.display = 'none';
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    let elementCenterX = elementRect.left - canvasRect.left + elementRect.width / 2;
    let elementCenterY = elementRect.top - canvasRect.top + elementRect.height / 2;
    
    let canvasCenterX = canvasRect.width / 2;
    let canvasCenterY = canvasRect.height / 2;

    if (Math.abs(elementCenterX - canvasCenterX) < 8) {
        verticalGuide.style.display = 'block';
    } else {
        verticalGuide.style.display = 'none';
    }

    if (Math.abs(elementCenterY - canvasCenterY) < 8) {
        horizontalGuide.style.display = 'block';
    } else {
        horizontalGuide.style.display = 'none';
    }
  }

  function hideAlignmentGuides() {
    verticalGuide.style.display = 'none';
    horizontalGuide.style.display = 'none';
  }

  function saveHistory() {
    const container = getSlidesContainer();
    const snapshot = container.innerHTML;
    undoStack.push(snapshot);
    redoStack = [];
  }

  function saveSlidesToLocalStorage() {
    const slides = [];
    document.querySelectorAll('.slide').forEach((slide) => {
        const textboxes = [];
        slide.querySelectorAll('.text-box').forEach((box) => {
            textboxes.push({
                text: box.innerText,
                left: box.style.left,
                top: box.style.top
            });
        });
        slides.push({ textboxes });
    });
    localStorage.setItem('adc_slides', JSON.stringify(slides));
  }

  function createTextBox(text) {
    const box = document.createElement('div');
    box.classList.add('text-box');
    box.contentEditable = true;
    box.innerText = text;

    // Default styling
    box.style.position = 'absolute';
    box.style.minWidth = '200px';
    box.style.minHeight = '30px';
    box.style.padding = '8px 10px';
    box.style.background = 'transparent';
    box.style.outline = 'none';
    box.style.border = '2px solid #1b6e48';  // Aramco green border
    box.style.borderRadius = '6px';
    box.style.fontSize = '18px';
    box.style.cursor = 'move';

    // Allow dragging
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    box.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - box.offsetLeft;
        offsetY = e.clientY - box.offsetTop;
        box.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            // SNAP-TO-GRID
            const gridSize = 10; // how strong the snapping is
            let snappedLeft = Math.round((e.clientX - offsetX) / gridSize) * gridSize;
            let snappedTop = Math.round((e.clientY - offsetY) / gridSize) * gridSize;

            box.style.left = snappedLeft + 'px';
            box.style.top = snappedTop + 'px';
            
            updateAlignmentGuides(box);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            box.style.userSelect = 'text';
            hideAlignmentGuides();
            saveSlidesToLocalStorage();
            saveHistory(); // Save history on move
        }
    });

    box.addEventListener('input', () => {
        saveSlidesToLocalStorage();
        saveHistory(); // Save history on text change
    });

    // Save history when text box is created
    saveHistory();

    return box;
  }

  function createNewSlide() {
    const slide = document.createElement('div');
    slide.className = 'slide';
    const container = getSlidesContainer();
    container.appendChild(slide);
    addSlideThumbnail(slide);
    saveSlidesToLocalStorage();
    saveHistory(); // Save history when slide is added
    return slide;
  }

  function addSlideThumbnail(slide) {
    const list = document.getElementById('slides-list');
    if (!list) return;
    const thumb = slide.cloneNode(true);
    thumb.classList.add('slide-thumbnail');
    list.appendChild(thumb);
  }

  function setActiveSlide(index) {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((s, i) => {
        if (i === index) {
            s.style.display = 'block';
        } else {
            s.style.display = 'none';
        }
    });
  }

  function addBlankSlide() {
    const newSlide = createNewSlide();

    // Make this slide the active slide
    const slides = document.querySelectorAll('.slide');
    const newIndex = slides.length - 1;
    setActiveSlide(newIndex);

    // Save
    saveSlidesToLocalStorage();
  }

  function deleteActiveSlide() {
    const slides = document.querySelectorAll('.slide');
    const thumbnails = document.querySelectorAll('.slide-thumbnail');

    let activeIndex = -1;
    slides.forEach((s, i) => {
        if (s.style.display === 'block') activeIndex = i;
    });

    if (activeIndex === -1) return;

    // Remove slide and thumbnail
    slides[activeIndex].remove();
    thumbnails[activeIndex]?.remove();

    // Load new active slide
    const updatedSlides = document.querySelectorAll('.slide');
    if (updatedSlides.length > 0) {
        const newIndex = Math.max(0, activeIndex - 1);
        setActiveSlide(newIndex);
    }

    saveSlidesToLocalStorage();
    saveHistory(); // Save history when slide is deleted
  }

  function duplicateActiveSlide() {
    const slides = document.querySelectorAll('.slide');
    let activeIndex = -1;

    slides.forEach((s, i) => {
        if (s.style.display === 'block') activeIndex = i;
    });

    if (activeIndex === -1) return;

    const originalSlide = slides[activeIndex];
    const newSlide = createNewSlide();

    // Copy text boxes from original slide
    const originalTextBoxes = originalSlide.querySelectorAll('.text-box');
    originalTextBoxes.forEach((box) => {
        const newBox = createTextBox(box.innerText);
        newBox.style.left = box.style.left;
        newBox.style.top = box.style.top;
        newBox.style.fontSize = box.style.fontSize;
        newBox.style.fontWeight = box.style.fontWeight;
        newBox.style.fontStyle = box.style.fontStyle;
        newBox.style.textAlign = box.style.textAlign;
        newBox.style.color = box.style.color;
        newBox.style.backgroundColor = box.style.backgroundColor;
        newSlide.appendChild(newBox);
    });

    // Activate the duplicated slide
    const updatedSlides = document.querySelectorAll('.slide');
    const newIndex = updatedSlides.length - 1;
    setActiveSlide(newIndex);

    saveSlidesToLocalStorage();
    saveHistory(); // Save history when slide is duplicated
  }

  function loadSlidesFromLocalStorage() {
    const saved = localStorage.getItem('adc_slides');
    if (!saved) return;

    const slides = JSON.parse(saved);
    slides.forEach((s) => {
        const newSlide = createNewSlide();
        s.textboxes.forEach((tb) => {
            const box = createTextBox(tb.text);
            box.style.left = tb.left;
            box.style.top = tb.top;
            newSlide.appendChild(box);
        });
    });
  }

  // Undo/Redo Functions
  function undo() {
    if (undoStack.length === 0) return;
    const container = getSlidesContainer();
    const current = container.innerHTML;
    redoStack.push(current);

    const previous = undoStack.pop();
    container.innerHTML = previous;
    saveSlidesToLocalStorage();
  }

  function redo() {
    if (redoStack.length === 0) return;
    const container = getSlidesContainer();
    const current = container.innerHTML;
    undoStack.push(current);

    const next = redoStack.pop();
    container.innerHTML = next;
    saveSlidesToLocalStorage();
  }

  // Thumbnail click handler
  document.addEventListener('DOMContentLoaded', () => {
    const slidesList = document.getElementById('slides-list');
    if (slidesList) {
      slidesList.addEventListener('click', (event) => {
        const thumb = event.target.closest('.slide-thumbnail');
        if (!thumb) return;

        // Get the index of the clicked thumbnail
        const thumbnails = Array.from(document.querySelectorAll('.slide-thumbnail'));
        const index = thumbnails.indexOf(thumb);

        // Switch active slide
        setActiveSlide(index);
      });
    }
  });

  // Undo/Redo buttons
  let undoBtn = document.getElementById('btn-undo') || document.createElement('button');
  undoBtn.id = 'btn-undo';
  undoBtn.innerText = 'Undo';
  undoBtn.style.marginLeft = '10px';

  let redoBtn = document.getElementById('btn-redo') || document.createElement('button');
  redoBtn.id = 'btn-redo';
  redoBtn.innerText = 'Redo';
  redoBtn.style.marginLeft = '10px';

  document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.getElementById('text-toolbar');
    if (toolbar) {
      toolbar.appendChild(undoBtn);
      toolbar.appendChild(redoBtn);
    }
  });

  // Connect undo/redo buttons
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-undo')?.addEventListener('click', undo);
    document.getElementById('btn-redo')?.addEventListener('click', redo);
    
    // Slide management buttons
    document.getElementById('btn-delete-slide')?.addEventListener('click', deleteActiveSlide);
    document.getElementById('btn-new-slide')?.addEventListener('click', addBlankSlide);
    document.getElementById('btn-duplicate-slide')?.addEventListener('click', duplicateActiveSlide);
    
    // Image insertion button
    document.getElementById('btn-insert-image')?.addEventListener('click', () => {
        imgInput.click();
    });
    
    // Create image button if it doesn't exist
    if (!document.getElementById('btn-insert-image')) {
        let imgBtn = document.createElement('button');
        imgBtn.id = 'btn-insert-image';
        imgBtn.innerText = 'Insert Image';
        imgBtn.style.marginLeft = '10px';
        imgBtn.style.background = '#0055aa';
        imgBtn.style.color = 'white';
        imgBtn.style.border = 'none';
        imgBtn.style.padding = '6px 12px';
        imgBtn.style.borderRadius = '4px';
        imgBtn.style.cursor = 'pointer';
        document.getElementById('text-toolbar')?.appendChild(imgBtn);
        
        imgBtn.addEventListener('click', () => {
            imgInput.click();
        });
    }
  });

  function insertImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.classList.add('slide-image');

        img.style.position = 'absolute';
        img.style.top = '100px';
        img.style.left = '100px';
        img.style.width = '250px';
        img.style.cursor = 'move';

        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;

        img.addEventListener('mousedown', (event) => {
            isDragging = true;
            offsetX = event.clientX - img.offsetLeft;
            offsetY = event.clientY - img.offsetTop;
            img.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (event) => {
            if (isDragging) {
                img.style.left = (event.clientX - offsetX) + 'px';
                img.style.top = (event.clientY - offsetY) + 'px';
                updateAlignmentGuides(img);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                hideAlignmentGuides();
                saveSlidesToLocalStorage();
            }
        });

        // Add image to active slide
        const slides = document.querySelectorAll('.slide');
        let activeSlide = Array.from(slides).find(s => s.style.display === 'block');
        if (activeSlide) {
            activeSlide.appendChild(img);
        }

        saveSlidesToLocalStorage();
    };
    reader.readAsDataURL(file);
  }

  // Add input type=file to pick an image
  let imgInput = document.createElement('input');
  imgInput.type = 'file';
  imgInput.accept = 'image/*';
  imgInput.id = 'image-input';
  imgInput.style.display = 'none';
  document.body.appendChild(imgInput);

  imgInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        insertImageFromFile(e.target.files[0]);
    }
  });

  function insertShape(type) {
    const shape = document.createElement('div');
    shape.classList.add('shape-box');
    shape.style.position = 'absolute';
    shape.style.top = '120px';
    shape.style.left = '120px';
    shape.style.width = '150px';
    shape.style.height = '100px';
    shape.style.cursor = 'move';
    shape.style.background = '#1b6e48'; // Aramco green
    shape.style.borderRadius = type === 'circle' ? '50%' : '6px';

    if (type === 'arrow') {
        shape.style.clipPath = 'polygon(0 40%, 70% 40%, 70% 0, 100% 50%, 70% 100%, 70% 60%, 0 60%)';
        shape.style.borderRadius = '0';
    }

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    shape.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - shape.offsetLeft;
        offsetY = e.clientY - shape.offsetTop;
        shape.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            shape.style.left = (e.clientX - offsetX) + 'px';
            shape.style.top = (e.clientY - offsetY) + 'px';
            updateAlignmentGuides(shape);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            hideAlignmentGuides();
            saveSlidesToLocalStorage();
        }
    });

    const slides = document.querySelectorAll('.slide');
    const activeSlide = Array.from(slides).find(s => s.style.display === 'block');
    if (activeSlide) {
        activeSlide.appendChild(shape);
    }

    saveSlidesToLocalStorage();
  }

  function addShapeButtons() {
    const toolbar = document.getElementById('text-toolbar');
    if (!toolbar) return;

    let rectBtn = document.createElement('button');
    rectBtn.id = 'btn-shape-rect';
    rectBtn.innerText = 'Rectangle';
    rectBtn.style.marginLeft = '10px';

    let circleBtn = document.createElement('button');
    circleBtn.id = 'btn-shape-circle';
    circleBtn.innerText = 'Circle';
    circleBtn.style.marginLeft = '10px';

    let arrowBtn = document.createElement('button');
    arrowBtn.id = 'btn-shape-arrow';
    arrowBtn.innerText = 'Arrow';
    arrowBtn.style.marginLeft = '10px';

    toolbar.appendChild(rectBtn);
    toolbar.appendChild(circleBtn);
    toolbar.appendChild(arrowBtn);
  }

  addShapeButtons();

  // Connect shape buttons
  document.getElementById('btn-shape-rect')?.addEventListener('click', () => insertShape('rect'));
  document.getElementById('btn-shape-circle')?.addEventListener('click', () => insertShape('circle'));
  document.getElementById('btn-shape-arrow')?.addEventListener('click', () => insertShape('arrow'));

  // Track active element for layer control
  let activeTextBox = null;

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('text-box') ||
        e.target.classList.contains('slide-image') ||
        e.target.classList.contains('shape-box')) {
        activeTextBox = e.target;
    }
  });

  function bringToFront() {
    if (activeTextBox) {
        activeTextBox.style.zIndex = 
            (parseInt(activeTextBox.style.zIndex || 1) + 10).toString();
        saveSlidesToLocalStorage();
    }
  }

  function sendToBack() {
    if (activeTextBox) {
        activeTextBox.style.zIndex =
            (parseInt(activeTextBox.style.zIndex || 1) - 10).toString();
        saveSlidesToLocalStorage();
    }
  }

  // Connect layer control buttons
  document.getElementById('btn-front')?.addEventListener('click', bringToFront);
  document.getElementById('btn-back')?.addEventListener('click', sendToBack);

  // Create layer control buttons if they don't exist
  let frontBtn = document.getElementById('btn-front') || document.createElement('button');
  frontBtn.id = 'btn-front';
  frontBtn.innerText = 'Bring Front';
  frontBtn.style.marginLeft = '10px';

  let backBtn = document.getElementById('btn-back') || document.createElement('button');
  backBtn.id = 'btn-back';
  backBtn.innerText = 'Send Back';
  backBtn.style.marginLeft = '10px';

  const toolbar = document.getElementById('text-toolbar');
  if (toolbar && !document.getElementById('btn-front')) {
    toolbar.appendChild(frontBtn);
  }
  if (toolbar && !document.getElementById('btn-back')) {
    toolbar.appendChild(backBtn);
  }

  // Connect buttons after creation
  frontBtn.addEventListener('click', bringToFront);
  backBtn.addEventListener('click', sendToBack);

  // Export slide as PNG function
  function exportSlideAsPNG() {
    const slide = Array.from(document.querySelectorAll('.slide'))
        .find(s => s.style.display === 'block');

    if (!slide) return;

    html2canvas(slide, { backgroundColor: null }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'slide.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
  }

  // Connect export button
  document.getElementById('btn-export-png')?.addEventListener('click', exportSlideAsPNG);

  // Create export button if it doesn't exist
  let exportBtn = document.getElementById('btn-export-png') || document.createElement('button');
  exportBtn.id = 'btn-export-png';
  exportBtn.innerText = 'Export PNG';
  exportBtn.style.marginLeft = '10px';
  exportBtn.style.background = '#1b6e48';
  exportBtn.style.color = 'white';
  exportBtn.style.border = 'none';
  exportBtn.style.padding = '6px 12px';
  exportBtn.style.borderRadius = '4px';
  exportBtn.style.cursor = 'pointer';

  if (toolbar && !document.getElementById('btn-export-png')) {
    toolbar.appendChild(exportBtn);
  }

  // Connect button after creation
  exportBtn.addEventListener('click', exportSlideAsPNG);

  // Export presentation as PDF function
  function exportPresentationPDF() {
    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
      alert('PDF export libraries not loaded. Please refresh the page.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const slides = document.querySelectorAll('.slide');

    let index = 0;

    function processNextSlide() {
        if (index >= slides.length) {
            pdf.save('presentation.pdf');
            return;
        }

        // Show only current slide
        slides.forEach((s, i) => {
            s.style.display = i === index ? 'block' : 'none';
        });

        const slide = slides[index];

        html2canvas(slide, { backgroundColor: 'white' }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 595;  // A4 width in pt
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (index > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            index++;
            processNextSlide();
        });
    }

    processNextSlide();
  }

  // Connect PDF export button
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportPresentationPDF);

  // Create PDF export button if it doesn't exist
  let pdfBtn = document.getElementById('btn-export-pdf') || document.createElement('button');
  pdfBtn.id = 'btn-export-pdf';
  pdfBtn.innerText = 'Export PDF';
  pdfBtn.style.marginLeft = '10px';
  pdfBtn.style.background = '#2b2d42';
  pdfBtn.style.color = 'white';
  pdfBtn.style.border = 'none';
  pdfBtn.style.padding = '6px 12px';
  pdfBtn.style.borderRadius = '4px';
  pdfBtn.style.cursor = 'pointer';

  if (toolbar && !document.getElementById('btn-export-pdf')) {
    toolbar.appendChild(pdfBtn);
  }

  // Connect button after creation
  pdfBtn.addEventListener('click', exportPresentationPDF);

  // Load slides on page load
  window.addEventListener('load', loadSlidesFromLocalStorage);

  // Auto-save functionality
  let autoSaveInterval = null;

  function startAutoSave() {
    if (autoSaveInterval) return; // prevent duplicates
    autoSaveInterval = setInterval(() => {
        try {
            saveSlidesToLocalStorage();
            console.log('Auto-saved');
        } catch (e) {
            console.error('Auto-save failed:', e);
        }
    }, 3000);
  }

  function stopAutoSave() {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }

  window.addEventListener('load', startAutoSave);

  // Export functions to global scope
  window.SlidesModule = {
    createNewSlide,
    createTextBox,
    setActiveSlide,
    addBlankSlide,
    deleteActiveSlide,
    duplicateActiveSlide,
    saveSlidesToLocalStorage,
    loadSlidesFromLocalStorage,
    undo,
    redo,
    saveHistory,
    startAutoSave,
    stopAutoSave
  };

})();

