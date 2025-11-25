/**
 * Clean AI Presentation Generator
 * Simple AI slide generation using the backend API
 */

(function() {
  'use strict';

  // Global variable to store selected theme name
  let selectedTheme = null;
  
  // Expose selectedTheme globally for external access
  Object.defineProperty(window, 'selectedTheme', {
    get: function() { return selectedTheme; },
    set: function(value) { selectedTheme = value; },
    enumerable: true,
    configurable: true
  });

  // ----------------------
  //  Loading Indicator Functions
  // ----------------------

  function showLoading() {
    const loader = document.getElementById("ai-loading");
    if (loader) loader.classList.remove("hidden");
  }

  function hideLoading() {
    const loader = document.getElementById("ai-loading");
    if (loader) loader.classList.add("hidden");
  }

  // ----------------------
  //  Helper Functions
  // ----------------------

  // Generate unique ID matching app.js uid() function
  function generateId() {
    return Math.random().toString(36).slice(2, 9);
  }

  // Create text element structure matching app.js element format exactly
  function createTextElement(text, x, y, options = {}) {
      return {
      id: generateId(),
      type: 'text',
      x: x || 100,
      y: y || 100,
      text: text || '',
      content: text || '',
      fontSize: options.fontSize || 18,
      color: options.color || '#111',
      fontFamily: options.fontFamily || 'Inter, system-ui, sans-serif',
      fontWeight: options.fontWeight || 'normal',
      fontStyle: options.fontStyle || 'normal',
      textAlign: options.textAlign || 'left',
      underline: options.underline || false,
      lineHeight: options.lineHeight || 1.2,
      listType: options.listType || null,
      rotation: options.rotation || 0,
      scale: options.scale || 1,
      fillColor: options.fillColor || 'transparent',
      strokeColor: options.strokeColor || 'transparent',
      strokeWidth: options.strokeWidth || 1,
      strokeDash: options.strokeDash || 'solid',
      locked: options.locked || false
    };
  }

  // ----------------------
  //  AI Slide Generation Helper
  // ----------------------

  function createAramcoSlide(slideData, index) {
    // Detect title-only slides (only title, no bullets)
    const isTitleSlide = !slideData.bullets || slideData.bullets.length === 0;

    // Create slide object matching defaultSlide() structure exactly: { id: uid(), elements: [] }
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: isTitleSlide ? 'title' : 'content' // Add layout property
    };

    if (isTitleSlide) {
      // Title-only slide: centered title element
      // Stage is 960px wide, 540px tall with 40px padding top/bottom, 56px left/right
      // Content area: 848px wide (960 - 112), 460px tall (540 - 80)
      // Center: x = 56 + 424 = 480px, y = 40 + 230 = 270px
      const titleElement = createTextElement(
        slideData.title || '',
        480, // Center horizontally (960px / 2)
        270, // Center vertically (540px / 2)
        {
          fontSize: 58,
          fontWeight: '800',
          color: '#024c3a',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      
      // Mark as title-only slide title
      titleElement.isTitleOnly = true;
      slideObj.elements.push(titleElement);
    } else {
      // Content slide: title at top, then bullet points
      // Stage is 960px wide with 56px padding, so center is at 480px
      // Title starts at top padding (40px) + some margin = ~80px
      const titleElement = createTextElement(
        slideData.title || '',
        480, // Center horizontally (960px / 2)
        80, // Top position (after 40px padding + margin)
        {
          fontSize: 42,
          fontWeight: '700',
          color: '#024c3a',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      titleElement.isContentTitle = true;
      slideObj.elements.push(titleElement);

      // Add bullet points as text elements
      // Start below title: 80px (title top) + ~50px (title height) + 40px (spacing) = ~170px
      const bullets = Array.isArray(slideData.bullets) ? slideData.bullets : [];
      let yPosition = 170; // Start below title with 40px spacing
      
      bullets.forEach((bullet, bulletIndex) => {
        const bulletElement = createTextElement(
          bullet,
          112, // Left margin (56px padding + 56px for centering content area)
          yPosition,
          {
            fontSize: 20,
            color: '#024c3a',
            textAlign: 'left',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.6
          }
        );
        bulletElement.isBullet = true;
        bulletElement.bulletIndex = bulletIndex; // Store index for animation delay
        slideObj.elements.push(bulletElement);
        yPosition += Math.ceil(20 * 1.6) + 12; // Line height + spacing between bullets
      });
    }

    // Return slide object matching defaultSlide() structure exactly
    return slideObj;
  }

  // ----------------------
  //  Table of Contents Template
  // ----------------------

  function createTableOfContentsSlide(options = {}) {
    // Default options
    const tocItems = options.tocItems || ['1. Example', '2. Example', '3. Example'];
    const notesItems = options.notesItems || ['1. Example', '2. Example', '3. Example'];
    const pageNumber = options.pageNumber || '2';

    // Create slide object
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: 'table-of-contents',
      background: '#FFFFFF'
    };

    // Header: "Table of Contents" - Top-left (40px padding)
    const header = createTextElement(
      'Table of Contents',
      40, // Left padding
      40, // Top padding
      {
        fontSize: 30, // 28-32pt equivalent
        fontWeight: '700',
        color: '#333333',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    header.isTOCHeader = true;
    slideObj.elements.push(header);

    // Section Title: "Table of Contents" - Below header (~90px from top)
    const sectionTitle = createTextElement(
      'Table of Contents',
      40, // Left padding
      90, // Below header (40px top + ~50px spacing)
      {
        fontSize: 21, // 20-22pt equivalent
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    sectionTitle.isTOCSectionTitle = true;
    slideObj.elements.push(sectionTitle);

    // First Numbered List - Below section title (~140px from top)
    let yPos = 140;
    tocItems.forEach((item, index) => {
      const listItem = createTextElement(
        item,
        40, // Left padding (same as section title)
        yPos,
        {
          fontSize: 21, // 20-22pt equivalent
          fontWeight: '400',
          color: '#333333',
          textAlign: 'left',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.5
        }
      );
      listItem.isTOCListItem = true;
      listItem.listIndex = index;
      slideObj.elements.push(listItem);
      yPos += 35; // Line spacing
    });

    // Notes Section Label - Below first list (~240px from top, adjust based on items)
    const notesLabelY = yPos + 40;
    const notesLabel = createTextElement(
      'Notes',
      40, // Left padding
      notesLabelY,
      {
        fontSize: 21, // 20-22pt equivalent
        fontWeight: '600', // Semi-bold
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    notesLabel.isTOCNotesLabel = true;
    slideObj.elements.push(notesLabel);

    // Notes Numbered List - Below Notes label
    let notesYPos = notesLabelY + 40;
    notesItems.forEach((item, index) => {
      const notesItem = createTextElement(
        item,
        40, // Left padding
        notesYPos,
        {
          fontSize: 21, // 20-22pt equivalent
          fontWeight: '400',
          color: '#333333',
          textAlign: 'left',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.5
        }
      );
      notesItem.isTOCNotesItem = true;
      notesItem.listIndex = index;
      slideObj.elements.push(notesItem);
      notesYPos += 35; // Line spacing
    });

    // Footer - Bottom of slide (540px height - 40px padding = 500px from top)
    // Left footer: Copyright
    const copyright = createTextElement(
      '© All rights Reserved',
      40, // Left padding
      480, // Near bottom
      {
        fontSize: 10, // 10-11pt equivalent
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    copyright.isTOCFooter = true;
    copyright.footerPosition = 'left';
    slideObj.elements.push(copyright);

    // Left footer: Classification
    const classification = createTextElement(
      'Aramco Digital: General Use',
      40, // Left padding
      495, // Below copyright
      {
        fontSize: 10, // 10-11pt equivalent
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    classification.isTOCFooter = true;
    classification.footerPosition = 'left-bottom';
    slideObj.elements.push(classification);

    // Center footer: Classification text
    const centerFooter = createTextElement(
      'This content has been classified as Aramco Digital: Confidential Use',
      480, // Center (960px / 2)
      495, // Same height as left footer
      {
        fontSize: 10, // 10-11pt equivalent
        fontWeight: '400',
        color: '#555555',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    centerFooter.isTOCFooter = true;
    centerFooter.footerPosition = 'center';
    slideObj.elements.push(centerFooter);

    // Page Number - Bottom-right (960px - 40px padding = 920px from left)
    const pageNum = createTextElement(
      pageNumber,
      920, // Right padding
      495, // Bottom padding
      {
        fontSize: 12, // 12pt equivalent
        fontWeight: '400',
        color: '#444444',
        textAlign: 'right',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    pageNum.isTOCPageNumber = true;
    slideObj.elements.push(pageNum);

    return slideObj;
  }

  // Expose function globally for use
  window.createTableOfContentsSlide = createTableOfContentsSlide;

  // ----------------------
  //  Title Page Template
  // ----------------------

  function createTitlePageSlide(options = {}) {
    // Default options
    const topic = options.topic || 'Topic';
    const sector = options.sector || '(sector)';
    const subtitle = options.subtitle || 'Project Status Update';
    const date = options.date || 'Month 27th, 2025';

    // Create slide object with black background
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: 'title-page',
      background: '#000000'
    };

    // Top decorative diagonal lines (12 lines, neon green #00FF7A)
    // Positioned in top-left area, angle ~65-70 degrees
    const topLineStartY = 0;
    const topLineEndY = 150; // Height of decorative area
    const lineSpacing = 80; // Horizontal spacing between lines
    const angle = 68; // degrees
    const angleRad = (angle * Math.PI) / 180;
    const lineLength = topLineEndY / Math.sin(angleRad);
    
    for (let i = 0; i < 12; i++) {
      const startX = 50 + (i * lineSpacing);
      const startY = topLineStartY;
      const endX = startX + lineLength * Math.cos(angleRad);
      const endY = topLineEndY;
      
      const lineElement = {
        id: generateId(),
        type: 'line',
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        lineType: 'straight',
        strokeColor: '#00FF7A',
        strokeWidth: 2,
        locked: true // Lock decorative lines
      };
      lineElement.isTitlePageTopLine = true;
      slideObj.elements.push(lineElement);
    }

    // Main Title: "Topic" - Neon green, bold, 48-54pt
    const mainTitle = createTextElement(
      topic,
      120, // Left padding
      120, // Upper third of slide (540px / 3 = 180px, but start higher)
      {
        fontSize: 51, // 48-54pt equivalent (~51pt)
        fontWeight: '700',
        color: '#00FF7A',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    mainTitle.isTitlePageMainTitle = true;
    slideObj.elements.push(mainTitle);

    // Subtitle: "(sector)" - To the right of main title
    // Calculate position based on main title width (approximate)
    const sectorX = 120 + (topic.length * 35); // Approximate width calculation
    const sectorY = 120 + 5; // Slightly lower for alignment
    const sectorTitle = createTextElement(
      sector,
      sectorX,
      sectorY,
      {
        fontSize: 24, // 24pt
        fontWeight: '400',
        color: '#00FF7A',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    sectorTitle.isTitlePageSector = true;
    slideObj.elements.push(sectorTitle);

    // Secondary Title: "Project Status Update" - White, 32pt
    const secondaryTitle = createTextElement(
      subtitle,
      120, // Left padding (same as main title)
      180, // Below main title (120 + ~60px for title height)
      {
        fontSize: 32, // 32pt
        fontWeight: '400',
        color: '#FFFFFF',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    secondaryTitle.isTitlePageSubtitle = true;
    slideObj.elements.push(secondaryTitle);

    // Date Section: "Month 27th, 2025" - White, 26-28pt, lower left
    const dateElement = createTextElement(
      date,
      120, // Left padding
      400, // Lower left quadrant (540px * 0.75 = 405px)
      {
        fontSize: 27, // 26-28pt equivalent (~27pt)
        fontWeight: '400',
        color: '#FFFFFF',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    dateElement.isTitlePageDate = true;
    slideObj.elements.push(dateElement);

    // Bottom decorative diagonal lines (9-10 lines, gray #666666)
    // Positioned in bottom-right quadrant
    const bottomLineStartY = 390; // Start in bottom-right area
    const bottomLineEndY = 540; // End at bottom
    const bottomLineSpacing = 90;
    const bottomLineLength = (bottomLineEndY - bottomLineStartY) / Math.sin(angleRad);
    
    for (let i = 0; i < 10; i++) {
      const startX = 500 + (i * bottomLineSpacing); // Start from middle-right
      const startY = bottomLineStartY;
      const endX = startX + bottomLineLength * Math.cos(angleRad);
      const endY = bottomLineEndY;
      
      // Only add lines that fit in the slide width
      if (endX <= 960) {
        const bottomLineElement = {
          id: generateId(),
          type: 'line',
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          lineType: 'straight',
          strokeColor: '#666666',
          strokeWidth: 2,
          locked: true // Lock decorative lines
        };
        bottomLineElement.isTitlePageBottomLine = true;
        slideObj.elements.push(bottomLineElement);
      }
    }

    // Logo placeholder - Top-right (will be handled separately or as image element)
    // For now, we'll add a text placeholder that can be replaced with image later
    const logoPlaceholder = createTextElement(
      'aramco digital',
      770, // Top-right (960px - 190px logo width)
      40, // Top padding
      {
        fontSize: 14,
        fontWeight: '400',
        color: '#FFFFFF',
        textAlign: 'right',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    logoPlaceholder.isTitlePageLogo = true;
    slideObj.elements.push(logoPlaceholder);

    return slideObj;
  }

  // Expose function globally for use
  window.createTitlePageSlide = createTitlePageSlide;

  // ----------------------
  //  Timeline Gantt Layout Template
  // ----------------------

  function createTimelineGanttSlide(options = {}) {
    // Default options
    const title = options.title || 'ONE of the point';
    const months = options.months || ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayMonth = options.todayMonth || 'Oct'; // Month for "Today" marker
    const todayDay = options.todayDay || 15; // Day within month for "Today"
    const pageNumber = options.pageNumber || '3';

    // Create slide object with white background
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: 'timeline-gantt',
      background: '#FFFFFF'
    };

    // Header: "ONE of the point" - Top-left (40px padding)
    const header = createTextElement(
      title,
      40,
      40,
      {
        fontSize: 30, // 28-32pt equivalent
        fontWeight: '700',
        color: '#333333',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    header.isGanttHeader = true;
    slideObj.elements.push(header);

    // Calculate grid dimensions
    const gridStartX = 200; // Start of month columns
    const gridStartY = 100; // Start of grid area
    const gridHeight = 380; // Height of grid area
    const monthWidth = 120; // Width per month column
    const rowHeight = 45; // Height per task row

    // Create month headers
    months.forEach((month, index) => {
      const monthX = gridStartX + (index * monthWidth) + (monthWidth / 2);
      const monthLabel = createTextElement(
        month,
        monthX,
        gridStartY - 10,
        {
          fontSize: 18,
          fontWeight: '400',
          color: '#555555',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      monthLabel.isGanttMonthHeader = true;
      slideObj.elements.push(monthLabel);

      // Vertical dashed gridline for each month
      const gridline = {
        id: generateId(),
        type: 'line',
        x1: gridStartX + (index * monthWidth),
        y1: gridStartY,
        x2: gridStartX + (index * monthWidth),
        y2: gridStartY + gridHeight,
        lineType: 'straight',
        strokeColor: '#C2C2C2',
        strokeWidth: 1,
        strokeDasharray: '5,5',
        locked: true
      };
      gridline.isGanttGridline = true;
      slideObj.elements.push(gridline);
    });

    // Right edge gridline
    const rightGridline = {
      id: generateId(),
      type: 'line',
      x1: gridStartX + (months.length * monthWidth),
      y1: gridStartY,
      x2: gridStartX + (months.length * monthWidth),
      y2: gridStartY + gridHeight,
      lineType: 'straight',
      strokeColor: '#C2C2C2',
      strokeWidth: 1,
      strokeDasharray: '5,5',
      locked: true
    };
    rightGridline.isGanttGridline = true;
    slideObj.elements.push(rightGridline);

    // Section labels (vertical columns on left)
    const sections = [
      { label: 'Initiative', y: gridStartY + 20 },
      { label: 'Kick-off', y: gridStartY + 65 },
      { label: 'Delivery', y: gridStartY + 140 },
      { label: 'Installation', y: gridStartY + 280 },
      { label: 'Completion', y: gridStartY + 360 }
    ];

    sections.forEach((section) => {
      const sectionLabel = createTextElement(
        section.label,
        40, // Left padding
        section.y,
        {
          fontSize: 22, // 22pt
          fontWeight: '400',
          color: '#333333',
          textAlign: 'left',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      sectionLabel.isGanttSectionLabel = true;
      slideObj.elements.push(sectionLabel);
    });

    // Helper function to create Gantt arrow bar
    function createGanttBar(startMonth, startDay, endMonth, endDay, color, rowIndex) {
      const startMonthIndex = months.indexOf(startMonth);
      const endMonthIndex = months.indexOf(endMonth);
      
      if (startMonthIndex === -1 || endMonthIndex === -1) return null;

      // Calculate positions
      const daysInMonth = 30; // Approximate
      const startX = gridStartX + (startMonthIndex * monthWidth) + ((startDay / daysInMonth) * monthWidth);
      const endX = gridStartX + (endMonthIndex * monthWidth) + ((endDay / daysInMonth) * monthWidth);
      const barY = gridStartY + 140 + (rowIndex * rowHeight); // Start from Delivery section
      const barHeight = 20;

      // Create arrow shape using SVG path
      const arrowPath = `M ${startX} ${barY} L ${endX - 10} ${barY} L ${endX - 10} ${barY - 5} L ${endX} ${barY + (barHeight/2)} L ${endX - 10} ${barY + barHeight + 5} L ${endX - 10} ${barY + barHeight} L ${startX} ${barY + barHeight} Z`;

      return {
        id: generateId(),
        type: 'shape',
        x: startX,
        y: barY,
        width: endX - startX,
        height: barHeight,
        fillColor: color,
        strokeColor: '#333333',
        strokeWidth: 1,
        path: arrowPath,
        locked: true
      };
    }

    // Kick-off diamond (yellow) - June 16th
    const kickoffMonthIndex = months.indexOf('Jun');
    if (kickoffMonthIndex !== -1) {
      const kickoffX = gridStartX + (kickoffMonthIndex * monthWidth) + ((16 / 30) * monthWidth);
      const kickoffY = gridStartY + 65;
      const diamondSize = 12;

      // Create diamond shape using SVG path
      const diamondPath = `M ${kickoffX} ${kickoffY - diamondSize} L ${kickoffX + diamondSize} ${kickoffY} L ${kickoffX} ${kickoffY + diamondSize} L ${kickoffX - diamondSize} ${kickoffY} Z`;

      const kickoffDiamond = {
        id: generateId(),
        type: 'shape',
        x: kickoffX - diamondSize,
        y: kickoffY - diamondSize,
        width: diamondSize * 2,
        height: diamondSize * 2,
        fillColor: '#FFD800',
        strokeColor: '#333333',
        strokeWidth: 1,
        path: diamondPath,
        locked: true
      };
      kickoffDiamond.isGanttKickoff = true;
      slideObj.elements.push(kickoffDiamond);
    }

    // Delivery batches (example data - can be customized via options)
    const deliveryBatches = options.deliveryBatches || [
      { batch: 'Batch #1', startMonth: 'Jul', startDay: 8, endMonth: 'Jul', endDay: 24, prepColor: '#BFC7D1', statusColor: '#00FF4A', row: 0 },
      { batch: 'Batch #2', startMonth: 'Sep', startDay: 9, endMonth: 'Sep', endDay: 17, prepColor: '#BFC7D1', statusColor: '#00FF4A', row: 1 },
      { batch: 'Batch #3', startMonth: 'Sep', startDay: 18, endMonth: 'Sep', endDay: 30, prepColor: '#BFC7D1', statusColor: '#00FF4A', row: 2 },
      { batch: 'Batch #4', startMonth: 'Oct', startDay: 20, endMonth: 'Oct', endDay: 25, prepColor: '#BFC7D1', statusColor: '#FFC94A', row: 3 },
      { batch: 'Batch #5', startMonth: 'Oct', startDay: 30, endMonth: 'Nov', endDay: 4, prepColor: '#BFC7D1', statusColor: '#FFC94A', row: 4 }
    ];

    deliveryBatches.forEach((batch) => {
      // Prep phase (gray)
      const prepBar = createGanttBar(
        batch.startMonth,
        batch.startDay - 5, // Start a few days earlier for prep
        batch.startMonth,
        batch.startDay,
        batch.prepColor,
        batch.row
      );
      if (prepBar) {
        prepBar.isGanttBar = true;
        prepBar.barType = 'prep';
        slideObj.elements.push(prepBar);
      }

      // Status phase (green/yellow/blue)
      const statusBar = createGanttBar(
        batch.startMonth,
        batch.startDay,
        batch.endMonth,
        batch.endDay,
        batch.statusColor,
        batch.row
      );
      if (statusBar) {
        statusBar.isGanttBar = true;
        statusBar.barType = 'status';
        slideObj.elements.push(statusBar);
      }

      // Batch label
      const batchLabel = createTextElement(
        batch.batch,
        gridStartX - 160,
        gridStartY + 140 + (batch.row * rowHeight) + 10,
        {
          fontSize: 14,
          fontWeight: '400',
          color: '#333333',
          textAlign: 'right',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      batchLabel.isGanttBatchLabel = true;
      slideObj.elements.push(batchLabel);
    });

    // Installation batches
    const installationBatches = options.installationBatches || [
      { batch: 'Batch #1', startMonth: 'Jul', startDay: 27, endMonth: 'Aug', endDay: 1, prepColor: '#BFC7D1', statusColor: '#00FF4A', row: 0 },
      { batch: 'Batch #2', startMonth: 'Sep', startDay: 29, endMonth: 'Oct', endDay: 7, prepColor: '#BFC7D1', statusColor: '#00FF4A', row: 1 },
      { batch: 'Batch #3', startMonth: 'Oct', startDay: 25, endMonth: 'Nov', endDay: 3, prepColor: '#BFC7D1', statusColor: '#FFC94A', row: 2 },
      { batch: 'Batch #4', startMonth: 'Nov', startDay: 4, endMonth: 'Dec', endDay: 4, prepColor: '#BFC7D1', statusColor: '#FFC94A', row: 3 }
    ];

    installationBatches.forEach((batch) => {
      const prepBar = createGanttBar(
        batch.startMonth,
        batch.startDay - 5,
        batch.startMonth,
        batch.startDay,
        batch.prepColor,
        batch.row + 5 // Offset for Installation section
      );
      if (prepBar) {
        prepBar.isGanttBar = true;
        prepBar.barType = 'prep';
        slideObj.elements.push(prepBar);
      }

      const statusBar = createGanttBar(
        batch.startMonth,
        batch.startDay,
        batch.endMonth,
        batch.endDay,
        batch.statusColor,
        batch.row + 5
      );
      if (statusBar) {
        statusBar.isGanttBar = true;
        statusBar.barType = 'status';
        slideObj.elements.push(statusBar);
      }

      const batchLabel = createTextElement(
        batch.batch,
        gridStartX - 160,
        gridStartY + 280 + (batch.row * rowHeight) + 10,
        {
          fontSize: 14,
          fontWeight: '400',
          color: '#333333',
          textAlign: 'right',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      batchLabel.isGanttBatchLabel = true;
      slideObj.elements.push(batchLabel);
    });

    // Completion diamond (yellow) - December 4th
    const completionMonthIndex = months.indexOf('Dec');
    if (completionMonthIndex !== -1) {
      const completionX = gridStartX + (completionMonthIndex * monthWidth) + ((4 / 30) * monthWidth);
      const completionY = gridStartY + 360;
      const diamondSize = 12;

      const diamondPath = `M ${completionX} ${completionY - diamondSize} L ${completionX + diamondSize} ${completionY} L ${completionX} ${completionY + diamondSize} L ${completionX - diamondSize} ${completionY} Z`;

      const completionDiamond = {
        id: generateId(),
        type: 'shape',
        x: completionX - diamondSize,
        y: completionY - diamondSize,
        width: diamondSize * 2,
        height: diamondSize * 2,
        fillColor: '#FFD800',
        strokeColor: '#333333',
        strokeWidth: 1,
        path: diamondPath,
        locked: true
      };
      completionDiamond.isGanttCompletion = true;
      slideObj.elements.push(completionDiamond);
    }

    // Today marker - Red vertical dashed line
    const todayMonthIndex = months.indexOf(todayMonth);
    if (todayMonthIndex !== -1) {
      const todayX = gridStartX + (todayMonthIndex * monthWidth) + ((todayDay / 30) * monthWidth);
      
      const todayLine = {
        id: generateId(),
        type: 'line',
        x1: todayX,
        y1: gridStartY,
        x2: todayX,
        y2: gridStartY + gridHeight + 20, // Extend below grid
        lineType: 'straight',
        strokeColor: '#FF0000',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        locked: true
      };
      todayLine.isGanttTodayLine = true;
      slideObj.elements.push(todayLine);

      // "Today" label with triangle
      const todayLabel = createTextElement(
        'Today',
        todayX + 5,
        gridStartY + gridHeight + 15,
        {
          fontSize: 12,
          fontWeight: '400',
          color: '#FF0000',
          textAlign: 'left',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      todayLabel.isGanttTodayLabel = true;
      slideObj.elements.push(todayLabel);
    }

    // Footer - Same as TOC slide
    const copyright = createTextElement(
      '© All rights Reserved',
      40,
      480,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    copyright.isGanttFooter = true;
    copyright.footerPosition = 'left';
    slideObj.elements.push(copyright);

    const classification = createTextElement(
      'Aramco Digital: General Use',
      40,
      495,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    classification.isGanttFooter = true;
    classification.footerPosition = 'left-bottom';
    slideObj.elements.push(classification);

    const centerFooter = createTextElement(
      'This content has been classified as Aramco Digital: Confidential Use',
      480,
      495,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    centerFooter.isGanttFooter = true;
    centerFooter.footerPosition = 'center';
    slideObj.elements.push(centerFooter);

    const pageNum = createTextElement(
      pageNumber,
      920,
      495,
      {
        fontSize: 12,
        fontWeight: '400',
        color: '#444444',
        textAlign: 'right',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    pageNum.isGanttPageNumber = true;
    slideObj.elements.push(pageNum);

    return slideObj;
  }

  // Expose function globally for use
  window.createTimelineGanttSlide = createTimelineGanttSlide;

  // ----------------------
  //  Overall Project Status Template
  // ----------------------

  function createProjectStatusSlide(options = {}) {
    // Default options
    const title = options.title || 'Overall Project Status';
    const phases = options.phases || [
      {
        number: 1,
        status: 'Completed (Aug 6)',
        statusColor: '#00FF4A',
        bullets: ['Example', 'Example', 'Example']
      },
      {
        number: 2,
        status: 'In-Progress (Oct 7)',
        statusColor: '#3DDCFF',
        bullets: ['Example', 'Example', 'Example']
      },
      {
        number: 3,
        status: 'In-Progress (Nov 6)',
        statusColor: '#3DDCFF',
        bullets: ['Example', 'Example', 'Example']
      },
      {
        number: 4,
        status: 'To Do (Dec 4)',
        statusColor: '#E0E0E0',
        bullets: ['Example', 'Example', 'Example']
      }
    ];
    const pageNumber = options.pageNumber || '4';

    // Create slide object with white background
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: 'project-status',
      background: '#FFFFFF'
    };

    // Header: "Overall Project Status" - Top-left (40px padding)
    const header = createTextElement(
      title,
      40,
      40,
      {
        fontSize: 31, // 30-32pt equivalent
        fontWeight: '700',
        color: '#333333',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    header.isProjectStatusHeader = true;
    slideObj.elements.push(header);

    // Calculate phase dimensions
    const phaseStartY = 100; // Start below header
    const phaseHeight = 350; // Height of phase area
    const phaseWidth = 200; // Width per phase (960px / 4 = 240px, but account for spacing)
    const phaseSpacing = 20; // Space between phases
    const totalPhaseWidth = (phaseWidth * 4) + (phaseSpacing * 3); // Total width of all phases
    const phaseStartX = (960 - totalPhaseWidth) / 2; // Center phases horizontally

    // Create phases
    phases.forEach((phase, index) => {
      const phaseX = phaseStartX + (index * (phaseWidth + phaseSpacing));
      const phaseCenterX = phaseX + (phaseWidth / 2);

      // Status tag - Top of phase
      const statusTag = createTextElement(
        phase.status,
        phaseCenterX,
        phaseStartY + 20,
        {
          fontSize: 19, // 18-20pt equivalent
          fontWeight: '600', // Semi-bold
          color: '#000000',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          backgroundColor: phase.statusColor,
          padding: '10px 20px',
          borderRadius: '8px'
        }
      );
      statusTag.isProjectStatusTag = true;
      statusTag.phaseNumber = phase.number;
      statusTag.statusColor = phase.statusColor;
      slideObj.elements.push(statusTag);

      // Phase title - "Phase #X"
      const phaseTitle = createTextElement(
        `Phase #${phase.number}`,
        phaseCenterX,
        phaseStartY + 70,
        {
          fontSize: 45, // 42-48pt equivalent (~45pt)
          fontWeight: '700',
          color: '#000000',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      phaseTitle.isProjectStatusPhaseTitle = true;
      phaseTitle.phaseNumber = phase.number;
      slideObj.elements.push(phaseTitle);

      // Camera icon placeholder - Below title
      // Using a simple text representation, can be replaced with SVG/image later
      const iconY = phaseStartY + 140;
      const iconElement = createTextElement(
        '📷', // Placeholder - can be replaced with SVG path
        phaseCenterX,
        iconY,
        {
          fontSize: 80, // Approximate size for icon
          fontWeight: '400',
          color: '#696969',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      iconElement.isProjectStatusIcon = true;
      iconElement.phaseNumber = phase.number;
      slideObj.elements.push(iconElement);

      // Bullet points - Below icon
      const bulletsStartY = iconY + 100;
      phase.bullets.forEach((bullet, bulletIndex) => {
        const bulletY = bulletsStartY + (bulletIndex * 35);
        const bulletElement = createTextElement(
          bullet,
          phaseX + 20, // Left padding within phase
          bulletY,
          {
            fontSize: 21, // 20-22pt equivalent
            fontWeight: '400',
            color: '#000000',
            textAlign: 'left',
            fontFamily: 'Inter, system-ui, sans-serif',
            backgroundColor: '#00FF4A',
            padding: '5px 10px',
            borderRadius: '4px'
          }
        );
        bulletElement.isProjectStatusBullet = true;
        bulletElement.phaseNumber = phase.number;
        bulletElement.bulletIndex = bulletIndex;
        slideObj.elements.push(bulletElement);
      });

      // Green chevron separator between phases (except after last phase)
      if (index < phases.length - 1) {
        const chevronX = phaseX + phaseWidth + (phaseSpacing / 2);
        const chevronY = phaseStartY + (phaseHeight / 2);
        
        // Create chevron using SVG path
        const chevronSize = 30;
        const chevronPath = `M ${chevronX} ${chevronY - chevronSize} L ${chevronX + chevronSize} ${chevronY} L ${chevronX} ${chevronY + chevronSize} Z`;

        const chevron = {
          id: generateId(),
          type: 'shape',
          x: chevronX - chevronSize,
          y: chevronY - chevronSize,
          width: chevronSize * 2,
          height: chevronSize * 2,
          fillColor: '#8BC53F',
          strokeColor: '#8BC53F',
          strokeWidth: 0,
          path: chevronPath,
          locked: true
        };
        chevron.isProjectStatusChevron = true;
        slideObj.elements.push(chevron);
      }
    });

    // Footer - Same as previous slides
    const copyright = createTextElement(
      '© All rights Reserved',
      40,
      480,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    copyright.isProjectStatusFooter = true;
    copyright.footerPosition = 'left';
    slideObj.elements.push(copyright);

    const classification = createTextElement(
      'Aramco Digital: General Use',
      40,
      495,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    classification.isProjectStatusFooter = true;
    classification.footerPosition = 'left-bottom';
    slideObj.elements.push(classification);

    const centerFooter = createTextElement(
      'This content has been classified as Aramco Digital: Confidential Use',
      480,
      495,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    centerFooter.isProjectStatusFooter = true;
    centerFooter.footerPosition = 'center';
    slideObj.elements.push(centerFooter);

    const pageNum = createTextElement(
      pageNumber,
      920,
      495,
      {
        fontSize: 12,
        fontWeight: '400',
        color: '#444444',
        textAlign: 'right',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    pageNum.isProjectStatusPageNumber = true;
    slideObj.elements.push(pageNum);

    return slideObj;
  }

  // Expose function globally for use
  window.createProjectStatusSlide = createProjectStatusSlide;

  // ----------------------
  //  One of the point Matrix Template
  // ----------------------

  function createMatrixSlide(options = {}) {
    // Default options
    const title = options.title || 'One of the point';
    const columns = options.columns || [
      { title: 'Example Phase I', subtext: 'num' },
      { title: 'Example Phase II', subtext: 'example' },
      { title: 'Example Expansion', subtext: 'num' },
      { title: 'Example Phase 1', subtext: 'num' }
    ];
    const leftRowLabels = options.leftRowLabels || ['example', 'example', 'example', 'example', 'example'];
    const rightRowLabels = options.rightRowLabels || ['example', 'example', 'example'];
    const matrix = options.matrix || [
      [false, false, false, false], // Row 1: all empty
      [false, false, false, false], // Row 2: all empty
      [false, true, true, true],    // Row 3: first empty, rest filled
      [false, false, false, false], // Row 4: all empty
      [true, false, true, true]     // Row 5: first filled, second empty, rest filled
    ];
    const dates = options.dates || ['Date', 'Date', 'Date'];
    const buttons = options.buttons || ['Example1', 'Example2', 'Example3', 'Example4', 'Example5', 'Example6'];
    const pageNumber = options.pageNumber || '5';

    // Create slide object with white background
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: 'matrix',
      background: '#FFFFFF'
    };

    // Header: "One of the point" - Top-left (40px padding)
    const header = createTextElement(
      title,
      40,
      40,
      {
        fontSize: 29, // 28-30pt equivalent
        fontWeight: '700',
        color: '#333333',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    header.isMatrixHeader = true;
    slideObj.elements.push(header);

    // Calculate matrix dimensions
    const matrixStartX = 200; // Start of matrix (after left labels)
    const matrixStartY = 120; // Start below column headers
    const circleSize = 38; // 36-40px equivalent (~38px)
    const circleSpacing = 60; // Spacing between circles
    const rowHeight = 70; // Height per row
    const columnWidth = 180; // Width per column

    // Column titles and subtexts
    columns.forEach((column, colIndex) => {
      const colX = matrixStartX + (colIndex * columnWidth) + (columnWidth / 2);
      
      // Column title
      const colTitle = createTextElement(
        column.title,
        colX,
        90,
        {
          fontSize: 22, // 22pt
          fontWeight: '600', // Semi-bold
          color: '#333333',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      colTitle.isMatrixColumnTitle = true;
      slideObj.elements.push(colTitle);

      // Subtext
      const subtext = createTextElement(
        column.subtext,
        colX,
        110,
        {
          fontSize: 15, // 14-16pt equivalent
          fontWeight: '400',
          color: '#777777',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      subtext.isMatrixSubtext = true;
      slideObj.elements.push(subtext);
    });

    // Left-side row labels
    leftRowLabels.forEach((label, rowIndex) => {
      const rowY = matrixStartY + (rowIndex * rowHeight) + (rowHeight / 2);
      const rowLabel = createTextElement(
        label,
        40, // Left padding
        rowY,
        {
          fontSize: 21, // 20-22pt equivalent
          fontWeight: '400',
          color: '#555555',
          textAlign: 'left',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      rowLabel.isMatrixRowLabel = true;
      rowLabel.rowIndex = rowIndex;
      slideObj.elements.push(rowLabel);
    });

    // Right-side row labels (starting from row 3, index 2)
    rightRowLabels.forEach((label, index) => {
      const rowIndex = index + 3; // Start from row 4 (0-indexed: 3)
      const rowY = matrixStartY + (rowIndex * rowHeight) + (rowHeight / 2);
      const rowLabel = createTextElement(
        label,
        920, // Right side
        rowY,
        {
          fontSize: 21, // 20-22pt equivalent
          fontWeight: '400',
          color: '#555555',
          textAlign: 'right',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      rowLabel.isMatrixRowLabel = true;
      rowLabel.rowIndex = rowIndex;
      rowLabel.isRightSide = true;
      slideObj.elements.push(rowLabel);
    });

    // Circle matrix - 5 rows × 4 columns
    matrix.forEach((row, rowIndex) => {
      row.forEach((isFilled, colIndex) => {
        const circleX = matrixStartX + (colIndex * columnWidth) + (columnWidth / 2);
        const circleY = matrixStartY + (rowIndex * rowHeight) + (rowHeight / 2);
        
        // Create circle using SVG path
        const radius = circleSize / 2;
        const circlePath = `M ${circleX} ${circleY - radius} A ${radius} ${radius} 0 0 1 ${circleX} ${circleY + radius} A ${radius} ${radius} 0 0 1 ${circleX} ${circleY - radius} Z`;

        const circle = {
          id: generateId(),
          type: 'shape',
          x: circleX - radius,
          y: circleY - radius,
          width: circleSize,
          height: circleSize,
          fillColor: isFilled ? '#FFB400' : 'transparent',
          strokeColor: '#FFB400',
          strokeWidth: isFilled ? 0 : 3,
          path: circlePath,
          locked: true
        };
        circle.isMatrixCircle = true;
        circle.rowIndex = rowIndex;
        circle.colIndex = colIndex;
        circle.isFilled = isFilled;
        slideObj.elements.push(circle);
      });
    });

    // Date labels with arrow lines
    dates.forEach((date, index) => {
      if (index >= columns.length - 1) return; // Only 3 dates for first 3 columns
      
      const dateX = matrixStartX + (index * columnWidth) + (columnWidth / 2);
      const dateY = matrixStartY + (matrix.length * rowHeight) + 30;
      
      // Date label
      const dateLabel = createTextElement(
        date,
        dateX,
        dateY,
        {
          fontSize: 15, // 14-16pt equivalent
          fontWeight: '400',
          color: '#777777',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      dateLabel.isMatrixDate = true;
      slideObj.elements.push(dateLabel);

      // Arrow line pointing right (if not last date)
      if (index < dates.length - 1) {
        const arrowStartX = dateX + 50;
        const arrowEndX = matrixStartX + ((index + 1) * columnWidth) + (columnWidth / 2) - 50;
        const arrowY = dateY + 15;
        
        // Create arrow line with arrowhead
        const arrowPath = `M ${arrowStartX} ${arrowY} L ${arrowEndX} ${arrowY} L ${arrowEndX - 5} ${arrowY - 3} M ${arrowEndX} ${arrowY} L ${arrowEndX - 5} ${arrowY + 3}`;

        const arrowLine = {
          id: generateId(),
          type: 'line',
          x1: arrowStartX,
          y1: arrowY,
          x2: arrowEndX,
          y2: arrowY,
          lineType: 'straight',
          strokeColor: '#C2C2C2',
          strokeWidth: 2,
          path: arrowPath,
          locked: true
        };
        arrowLine.isMatrixArrow = true;
        slideObj.elements.push(arrowLine);
      }
    });

    // Right-side buttons
    const buttonStartX = 750; // Right side
    const buttonStartY = 120;
    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonSpacing = 10;

    buttons.forEach((buttonText, index) => {
      const buttonY = buttonStartY + (index * (buttonHeight + buttonSpacing));
      const buttonCenterX = buttonStartX + (buttonWidth / 2);
      const buttonCenterY = buttonY + (buttonHeight / 2);

      // Create button as shape with text
      const buttonRect = {
        id: generateId(),
        type: 'shape',
        x: buttonStartX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        fillColor: '#00A3E0',
        strokeColor: '#004F66',
        strokeWidth: 1,
        path: `M ${buttonStartX} ${buttonY} L ${buttonStartX + buttonWidth} ${buttonY} L ${buttonStartX + buttonWidth} ${buttonY + buttonHeight} L ${buttonStartX} ${buttonY + buttonHeight} Z`,
        locked: true
      };
      buttonRect.isMatrixButton = true;
      buttonRect.buttonIndex = index;
      slideObj.elements.push(buttonRect);

      // Button text
      const buttonTextEl = createTextElement(
        buttonText,
        buttonCenterX,
        buttonCenterY,
        {
          fontSize: 23, // 22-24pt equivalent
          fontWeight: '400',
          color: '#FFFFFF',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      );
      buttonTextEl.isMatrixButtonText = true;
      buttonTextEl.buttonIndex = index;
      slideObj.elements.push(buttonTextEl);
    });

    // Footer - Same as previous slides
    const copyright = createTextElement(
      '© All rights Reserved',
      40,
      480,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    copyright.isMatrixFooter = true;
    copyright.footerPosition = 'left';
    slideObj.elements.push(copyright);

    const classification = createTextElement(
      'Aramco Digital: General Use',
      40,
      495,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    classification.isMatrixFooter = true;
    classification.footerPosition = 'left-bottom';
    slideObj.elements.push(classification);

    const centerFooter = createTextElement(
      'This content has been classified as Aramco Digital: Confidential Use',
      480,
      495,
      {
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    centerFooter.isMatrixFooter = true;
    centerFooter.footerPosition = 'center';
    slideObj.elements.push(centerFooter);

    const pageNum = createTextElement(
      pageNumber,
      920,
      495,
      {
        fontSize: 12,
        fontWeight: '400',
        color: '#444444',
        textAlign: 'right',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    );
    pageNum.isMatrixPageNumber = true;
    slideObj.elements.push(pageNum);

    return slideObj;
  }

  // Expose function globally for use
  window.createMatrixSlide = createMatrixSlide;

  // ----------------------
  //  AI Presentation Logic
  // ----------------------

  async function generateSlidesFromAI(topic, slideCount, language, selectedTheme) {
    showLoading();
    try {
        const response = await fetch('http://localhost:3000/api/ai/generate-slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
                topic: topic,
                slideCount: slideCount,
                language: language,
                selectedTheme: selectedTheme || null
          })
        });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          hideLoading();
          return { error: errorData.error || `Server error: ${response.status} ${response.statusText}` };
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('AI Request Error:', err);
        hideLoading();
        return { error: err.message || 'Failed to connect to server. Please make sure the server is running.' };
    }
  }

  // ----------------------
  //  Workflow Switching
  // ----------------------

  function switchWorkflow(workflow) {
    // Update workflow buttons (if they exist)
    document.querySelectorAll('.ai-workflow-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`ai-workflow-${workflow}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update workflow content
    document.querySelectorAll('.ai-workflow-content').forEach(content => {
      content.classList.remove('active');
    });
    const activeContent = document.getElementById(`ai-content-${workflow}`);
    if (activeContent) activeContent.classList.add('active');

    // Show/hide options section (hide for improve workflow)
    const optionsSection = document.getElementById('ai-options-section');
    if (optionsSection) {
      optionsSection.style.display = workflow === 'improve' ? 'none' : 'flex';
    }
  }

  // Initialize when DOM is ready
  function initializeAI() {
    console.log('Initializing AI generator...');
    
    // Set default workflow to 'topic'
    switchWorkflow('topic');
    
    console.log('AI generator initialization complete');
  }

  // Helper function to create check icon SVG
  function createCheckIcon() {
    const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    checkIcon.setAttribute('viewBox', '0 0 24 24');
    checkIcon.setAttribute('width', '20');
    checkIcon.setAttribute('height', '20');
    checkIcon.style.cssText = 'position: absolute; top: 8px; right: 8px; z-index: 10; pointer-events: none;';
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', '#0097D6');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 12l2 2 4-4');
    path.setAttribute('stroke', '#ffffff');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    
    checkIcon.appendChild(circle);
    checkIcon.appendChild(path);
    
    return checkIcon;
  }

  // Helper function to remove check icon from a card
  function removeCheckIcon(card) {
    const existingCheck = card.querySelector('.theme-check-icon');
    if (existingCheck) {
      existingCheck.remove();
    }
  }

  // Helper function to add check icon to a card
  function addCheckIcon(card) {
    // Remove any existing check icon first
    removeCheckIcon(card);
    
    // Create and add new check icon
    const checkIcon = createCheckIcon();
    checkIcon.classList.add('theme-check-icon');
    card.appendChild(checkIcon);
  }

  // Theme selection function - receives theme name or identifier
  function selectTheme(themeIdentifier) {
    // themeIdentifier can be: "AD Theme 1", "AD Theme 2", "AD Dark Theme", "Blank Theme", or theme ID
    
    // Ensure themeIdentifier is a valid string (never undefined or null)
    if (!themeIdentifier || typeof themeIdentifier !== 'string') {
      console.error('Invalid theme identifier:', themeIdentifier);
      return;
    }
    
    // Update selected theme globally - always store as string
    const validTheme = String(themeIdentifier).trim();
    window.selectedTheme = validTheme;
    selectedTheme = validTheme;
    
    // Update visual state for all theme cards in AI generator theme grid
    const aiThemesGrid = document.querySelector('#ai-themes-grid');
    if (aiThemesGrid) {
      const themeBoxes = aiThemesGrid.querySelectorAll('.theme-box');
      themeBoxes.forEach(box => {
        box.classList.remove('active');
        box.classList.remove('selected');
        
        // Match by theme name (label text) or theme ID
        const boxLabel = box.querySelector('.theme-box-label');
        const boxThemeId = box.dataset.themeId;
        if (boxLabel && (boxLabel.textContent === validTheme || boxThemeId === validTheme)) {
          box.classList.add('active');
          box.classList.add('selected');
        }
      });
    }
    
    console.log('Selected theme:', themeIdentifier);
  }

  // Expose selectTheme globally for external access
  window.selectTheme = selectTheme;

  // Text workflow handler - defined at module scope
  async function handleTextSubmit() {
    console.log('AI text button clicked');
    const textInput = document.getElementById('ai-text-input');
    const text = textInput?.value.trim();
    const slideCountInput = document.getElementById('number-of-slides')?.value;
    const language = document.getElementById('ai-language-selector')?.value;
    const selectedTheme = window.selectedTheme || null; // Get selected theme from global variable

    if (!text) {
        alert('Please enter some text.');
        return;
    }

    // Validate slide count - if empty, treat as null and stop
    if (!slideCountInput || slideCountInput.trim() === '') {
      alert('Please enter the number of slides.');
      return;
    }

    // Always convert to integer using parseInt
    const slideCount = parseInt(slideCountInput, 10);

    // Validate slide count range (1-50)
    if (isNaN(slideCount) || slideCount < 1 || slideCount > 50) {
      alert('Slide count must be between 1 and 50.');
      return;
    }

    // Validate theme selection - ensure selectedTheme is NOT undefined, null, or empty
    if (!selectedTheme || selectedTheme === null || selectedTheme === undefined || selectedTheme === '') {
      alert('Please select a theme.');
      return;
    }

    showLoading();
    try {
      // Use text as topic for now (can be enhanced later)
      const result = await generateSlidesFromAI(text, slideCount, language, selectedTheme);

      if (result.error) {
          alert(result.error);
          hideLoading();
          return;
      }

      if (!result.slides) {
          alert('No slides returned.');
          hideLoading();
          return;
      }

      // Ensure we only generate the exact number of slides requested
      const slidesToGenerate = result.slides.slice(0, slideCount);

      // Create slide objects matching defaultSlide() structure exactly
      const slideObjects = slidesToGenerate.map((slideData, index) => {
        return createAramcoSlide(slideData, index);
      });

      // Add slides to state through window.addAISlides (exposed by app.js)
      if (typeof window !== 'undefined' && window.addAISlides) {
        window.addAISlides(slideObjects);
      } else {
        // Fallback: dispatch event that app.js listens to
        const event = new CustomEvent('ai-slides-generated', { 
          detail: { slides: slideObjects },
          bubbles: true
        });
        window.dispatchEvent(event);
      }

      // Auto-redirect without showing alert
      const presentationId = result.presentationId;
      if (presentationId) {
        window.location.href = 'index.html?presentation=' + presentationId;
      }
    } catch (err) {
      console.error('Text submit error:', err);
      alert(`Error generating slides: ${err.message || 'Unknown error'}`);
    } finally {
      hideLoading();
    }
  }

  function handleImproveSubmit() {
    console.log('AI improve button clicked');
    alert('Improve functionality coming soon!');
    // TODO: Implement improve slides functionality
  }

  // End of clean AI system

  // ----------------------
  //  Generate Slides Functions
  // ----------------------

  async function generateSlidesRequest() {
    console.log('AI topic button clicked');
    
    // Start loading immediately
    startLoading();
    
    try {
      const selectedTopic = document.getElementById('ai-input')?.value.trim();
      const slideCountInput = document.getElementById('number-of-slides')?.value;
      const selectedLanguage = document.getElementById('ai-language-selector')?.value;
      const selectedTheme = window.selectedTheme || null; // Get selected theme from global variable

      if (!selectedTopic) {
        alert('Please enter a topic.');
        stopLoading();
        return;
      }

      // Validate slide count - if empty, treat as null and stop
      if (!slideCountInput || slideCountInput.trim() === '') {
        alert('Please enter the number of slides.');
        stopLoading();
        return;
      }

      // Always convert to integer using parseInt
      const selectedSlideCount = parseInt(slideCountInput, 10);

      // Validate slide count range (1-50)
      if (isNaN(selectedSlideCount) || selectedSlideCount < 1 || selectedSlideCount > 50) {
        alert('Slide count must be between 1 and 50.');
        stopLoading();
        return;
      }

      // Validate theme selection - ensure selectedTheme is NOT undefined, null, or empty
      if (!selectedTheme || selectedTheme === null || selectedTheme === undefined || selectedTheme === '') {
        alert('Please select a theme.');
        stopLoading();
        return;
      }

      // Validate language - ensure it's not undefined, default to 'en' if empty
      const finalLanguage = selectedLanguage && selectedLanguage.trim() !== '' 
        ? selectedLanguage.trim() 
        : 'en';

      // Ensure all values are defined before sending
      const requestBody = {
        slideCount: selectedSlideCount,  // Always a number
        theme: selectedTheme,            // Always a string (validated above)
        topic: selectedTopic,            // Always a string (validated above)
        language: finalLanguage          // Always a string (defaults to 'en')
      };

      // Double-check: ensure no undefined values
      if (requestBody.slideCount === undefined || 
          requestBody.theme === undefined || 
          requestBody.topic === undefined || 
          requestBody.language === undefined) {
        console.error('Invalid request body:', requestBody);
        alert('Error: Missing required fields. Please try again.');
        stopLoading();
        return;
      }

      const response = await fetch('http://localhost:3000/api/ai/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        alert(errorData.error || 'Failed to fetch');
        stopLoading();
        return;
      }

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        stopLoading();
        return;
      }
      
      if (!data.slides) {
        alert('No slides returned.');
        stopLoading();
        return;
      }

      const slidesToGenerate = data.slides.slice(0, selectedSlideCount);

      // Create slide objects matching defaultSlide() structure exactly
      const slideObjects = slidesToGenerate.map((slideData, index) => {
        return createAramcoSlide(slideData, index);
      });

      // Add slides to state through window.addAISlides (exposed by app.js)
      if (typeof window !== 'undefined' && window.addAISlides) {
        window.addAISlides(slideObjects);
        } else {
        // Fallback: dispatch event that app.js listens to
        const event = new CustomEvent('ai-slides-generated', { 
          detail: { slides: slideObjects },
          bubbles: true
        });
        window.dispatchEvent(event);
      }

      // Auto-redirect without showing alert
      const presentationId = data.presentationId;
      if (presentationId) {
        window.location.href = 'index.html?presentation=' + presentationId;
      }
    } catch (error) {
      console.error('Error in generateSlidesRequest:', error);
      alert('Failed to fetch');
    } finally {
      // Always stop loading, even if there's an error
      stopLoading();
    }
  }

  // Single unified generate handler function
  async function handleGenerate() {
    // Validate theme selection before proceeding
    const currentTheme = window.selectedTheme || selectedTheme;
    if (!currentTheme || currentTheme === null || currentTheme === undefined || currentTheme === '') {
      alert('Please select a theme.');
      return;
    }
    
    try {
      // generateSlidesRequest() handles loading state internally
      await generateSlidesRequest();
      
      // Close AI page after successful generation (if it's open)
      if (typeof hideAIPage === 'function' && isAIPageVisible) {
        hideAIPage();
        isAIPageVisible = false;
      }
    } catch (e) {
      console.error('Generate slides error:', e);
      const errorMessage = e.message || 'An unexpected error occurred while generating slides.';
      alert(`Error generating slides: ${errorMessage}`);
    }
    // Note: generateSlidesRequest() handles stopLoading() in its finally block
  }

  // ----------------------
  //  Loading State Management
  // ----------------------

  function startLoading() {
    // Update sidebar button (if exists)
    const generateBtn = document.getElementById('ai-topic-submit');
    if (generateBtn) {
      const generateText = generateBtn.querySelector('span');
      generateBtn.disabled = true;
      generateBtn.classList.add('loading');
      const spinner = '<svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>';
      if (generateText) {
        generateText.innerHTML = spinner + ' Generating...';
        } else {
        generateBtn.innerHTML = spinner + ' Generating...';
      }
    }
    
    // Update page button (main AI generator button)
    const pageBtn = document.getElementById('ai-page-generate-btn');
    if (pageBtn) {
      pageBtn.disabled = true;
      pageBtn.classList.add('loading');
      const pageText = pageBtn.querySelector('span');
      const spinner = '<svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>';
      if (pageText) {
        pageText.innerHTML = spinner + ' Generating...';
        } else {
        pageBtn.innerHTML = spinner + ' Generating...';
      }
    }
    
    console.log('Loading state started');
  }

  function stopLoading() {
    // Update sidebar button (if exists)
    const generateBtn = document.getElementById('ai-topic-submit');
    if (generateBtn) {
      const generateText = generateBtn.querySelector('span');
      generateBtn.disabled = false;
      generateBtn.classList.remove('loading');
      if (generateText) {
        generateText.innerText = 'Generate Presentation';
        } else {
        generateBtn.textContent = 'Generate Presentation';
      }
    }
    
    // Update page button (main AI generator button)
    const pageBtn = document.getElementById('ai-page-generate-btn');
    if (pageBtn) {
      pageBtn.disabled = false;
      pageBtn.classList.remove('loading');
      const pageText = pageBtn.querySelector('span');
      if (pageText) {
        pageText.innerText = 'Generate Presentation';
      } else {
        pageBtn.textContent = 'Generate Presentation';
      }
    }
    
    console.log('Loading state stopped');
  }


  // ============================================
  //  AI Generator Full Page Functionality
  // ============================================
  
  // Global state for AI page visibility
  let isAIPageVisible = false;
  let aiPageBtn = null;
  let aiPage = null;

  // Global functions to show/hide AI page
  function showAIPage() {
    const page = document.getElementById('ai-generator-page');
    if (!page) {
      console.error('AI generator page not found');
      return;
    }
    console.log('Showing AI page');
    page.classList.remove('hidden');
    // Modal overlay - workspace content remains visible behind backdrop
    isAIPageVisible = true;
  }

  function hideAIPage() {
    const page = document.getElementById('ai-generator-page');
    if (!page) return;
    console.log('Hiding AI page');
    page.classList.add('hidden');
    // Modal overlay - workspace content remains visible
    isAIPageVisible = false;
  }

  // Expose toggle function globally for inline onclick
  window.toggleAIPage = function() {
    const page = document.getElementById('ai-generator-page');
    if (!page) {
      console.error('AI generator page not found');
      return;
    }
    if (page.classList.contains('hidden')) {
      showAIPage();
    } else {
      hideAIPage();
    }
  };

  // Guard flag to prevent duplicate initialization
  let aiPageInitialized = false;

  function initializeAIPage() {
    // Support both possible button IDs
    aiPageBtn = document.getElementById('ai-generate-btn') || document.getElementById('btn-ai-generate');
    aiPage = document.getElementById('ai-generator-page');
    
    if (!aiPageBtn) {
      console.error('AI generate button not found. Looking for: ai-generate-btn or btn-ai-generate');
      setTimeout(initializeAIPage, 100);
      return;
    }
    
    if (!aiPage) {
      console.error('AI generator page not found. Looking for: ai-generator-page');
      setTimeout(initializeAIPage, 100);
      return;
    }

    // Prevent duplicate initialization
    if (aiPageInitialized) {
      return;
    }
    aiPageInitialized = true;

    // Remove all existing event listeners by cloning and replacing
    const newBtn = aiPageBtn.cloneNode(true);
    aiPageBtn.parentNode.replaceChild(newBtn, aiPageBtn);
    aiPageBtn = newBtn;
    
    // Add ONLY ONE event listener
    aiPageBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (isAIPageVisible) {
        hideAIPage();
      } else {
        showAIPage();
      }
      return false;
    });

    // Default to 'topic' workflow
    document.querySelectorAll('.ai-generator-workflow-content').forEach(content => {
      content.classList.remove('active');
    });
    const topicContent = document.getElementById('ai-page-content-topic');
    if (topicContent) {
      topicContent.classList.add('active');
    }

    // Workflow tab switching
    const workflowTabs = aiPage.querySelectorAll('.ai-workflow-tab');
    workflowTabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const workflow = this.dataset.workflow;
        
        // Update tab active state
        workflowTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Update workflow content visibility
        document.querySelectorAll('.ai-generator-workflow-content').forEach(content => {
          content.classList.remove('active');
        });
        
        let activeContent = null;
        if (workflow === 'topic') {
          activeContent = document.getElementById('ai-page-content-topic');
        } else if (workflow === 'text') {
          activeContent = document.getElementById('ai-page-content-text');
        } else if (workflow === 'improve') {
          activeContent = document.getElementById('ai-page-content-improve');
        }
        
        if (activeContent) {
          activeContent.classList.add('active');
        }
        
        // Show/hide options section (hide for improve workflow)
        const optionsSection = aiPage.querySelector('.ai-generator-options');
        if (optionsSection) {
          optionsSection.style.display = workflow === 'improve' ? 'none' : 'flex';
        }
      });
    });
    
    // Theme box selection - Use EXACT same structure and logic as main theme modal
    const aiThemesGrid = aiPage.querySelector('#ai-themes-grid');
    if (aiThemesGrid) {
      // Use the EXACT same availableThemes array from app.js (exposed via window)
      const themesToUse = window.availableThemes || [];
      
      aiThemesGrid.innerHTML = '';
      
      // Get current theme from app.js to show active state
      const currentTheme = window.currentTheme || 'blank';
      
      // Create theme boxes using EXACT same structure as main theme modal
      themesToUse.forEach(theme => {
        // Create simple box container (EXACT same as main theme modal)
        const themeBox = document.createElement('div');
        themeBox.className = `theme-box ${theme.id === currentTheme ? 'active' : ''}`;
        themeBox.dataset.themeId = theme.id;
        
        // Create color preview swatch (EXACT same as main theme modal)
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'theme-box-swatch';
        
        // Set specific colors for each theme (EXACT same as main theme modal)
        const themeSwatchColors = {
          'blank': '#FFFFFF',
          'aramco': '#004F44',
          'dark-aramco': '#2E7BA6',
          'blue-aramco': '#58A9E0'
        };
        
        const swatchColor = themeSwatchColors[theme.id] || theme.colors.primary;
        colorSwatch.style.backgroundColor = swatchColor;
        
        // Blank theme: add border to make white swatch visible (EXACT same as main theme modal)
        if (theme.id === 'blank') {
          colorSwatch.style.border = '1px solid #e5e7eb';
        }
        
        // Create theme name label (EXACT same as main theme modal)
        const label = document.createElement('div');
        label.className = 'theme-box-label';
        label.textContent = theme.name;
        
        // Assemble box (EXACT same as main theme modal)
        themeBox.appendChild(colorSwatch);
        themeBox.appendChild(label);
        
        // Attach click handler - calls loadTheme() with theme ID to apply the theme
        themeBox.addEventListener('click', () => {
          if (window.loadTheme) {
            window.loadTheme(theme.id);
          }
          // Also update visual state for AI generator
          selectTheme(theme.name);
        });
        
        aiThemesGrid.appendChild(themeBox);
      });
    }

    // Listen for theme changes from main themes panel to keep AI generator in sync
    window.addEventListener('theme-changed', (e) => {
      if (e.detail && e.detail.themeId) {
        // Update active state in AI generator theme grid
        const aiThemesGrid = aiPage.querySelector('#ai-themes-grid');
        if (aiThemesGrid) {
          aiThemesGrid.querySelectorAll('.theme-box').forEach(box => {
            box.classList.toggle('active', box.dataset.themeId === e.detail.themeId);
          });
        }
      }
    });
    
    // Restore selected theme state if one was previously selected
    const currentSelectedTheme = window.selectedTheme || selectedTheme;
    if (currentSelectedTheme && typeof currentSelectedTheme === 'string' && currentSelectedTheme.trim() !== '') {
      // Restore visual state without changing the stored value
      selectTheme(currentSelectedTheme);
    }

    // Generate button handler - attach handleGenerate listener
    const generateBtn = document.getElementById('ai-page-generate-btn');
    if (generateBtn) {
      // Remove ALL existing event listeners by cloning and replacing
      generateBtn.replaceWith(generateBtn.cloneNode(true));
      
      // Attach ONLY ONE event listener
      document.getElementById('ai-page-generate-btn').addEventListener('click', handleGenerate);
    }

    // Sync page inputs with sidebar inputs for compatibility
    function syncInputs() {
      const inputMapping = {
        'ai-page-input': 'ai-input',
        'ai-page-text-input': 'ai-text-input',
        'ai-page-slide-count': 'number-of-slides',
        'ai-page-language-selector': 'ai-language-selector'
      };

      Object.entries(inputMapping).forEach(([pageId, sidebarId]) => {
        const pageInput = document.getElementById(pageId);
        const sidebarInput = document.getElementById(sidebarId);
        
        if (pageInput && sidebarInput) {
          pageInput.addEventListener('input', () => {
            sidebarInput.value = pageInput.value;
          });
          
          sidebarInput.addEventListener('input', () => {
            pageInput.value = sidebarInput.value;
          });
        }
      });
    }

    syncInputs();

    // Add close button handler - use existing window.closeAIGenerator function
    const closeBtn = aiPage.querySelector('.ai-generator-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.closeAIGenerator === 'function') {
          window.closeAIGenerator();
        } else {
          hideAIPage(); // Fallback if function doesn't exist
        }
      });
    }

    // Add backdrop click handler - only close if clicking directly on backdrop
    const backdrop = aiPage.querySelector('.ai-generator-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        // Only close if clicking directly on backdrop, not on modal content
        if (e.target === backdrop) {
          e.preventDefault();
          e.stopPropagation();
          hideAIPage();
        }
      });
    }

    // Hide AI page when clicking on slides or navigating
    window.addEventListener('click', (e) => {
      // If clicking outside AI page (on slides sidebar, etc.), hide it
      if (isAIPageVisible && !aiPage.contains(e.target) && !aiPageBtn.contains(e.target)) {
        // Only hide if clicking on slide-related elements
        if (e.target.closest('#slides-sidebar') || e.target.closest('.slide-thumbnail')) {
          hideAIPage();
          isAIPageVisible = false;
        }
      }
    });
  }

  // Single initialization function - called only once
  function initAIGenerator() {
    // Initialize AI system (for sidebar compatibility)
    initializeAI();
    
    // Initialize AI Full Page View (handles btn-ai-generate and ai-page-generate-btn)
    initializeAIPage();

    // MAIN TOPIC BUTTON LISTENER - Only for "From Topic" workflow (sidebar)
    const generateBtn = document.getElementById('ai-topic-submit');
    if (generateBtn) {
      // Remove any existing listeners
      generateBtn.replaceWith(generateBtn.cloneNode(true));
      const newGenerateBtn = document.getElementById('ai-topic-submit');
      newGenerateBtn.addEventListener('click', handleGenerate);
    }

    // TEXT WORKFLOW BUTTON LISTENER - Only for "From Text" workflow
    const textSubmitBtn = document.getElementById('ai-text-submit');
    if (textSubmitBtn) {
      // Remove any existing listeners
      textSubmitBtn.replaceWith(textSubmitBtn.cloneNode(true));
      const newTextSubmitBtn = document.getElementById('ai-text-submit');
      newTextSubmitBtn.addEventListener('click', handleTextSubmit);
    }

    // IMPROVE WORKFLOW BUTTON LISTENER
    const improveSubmitBtn = document.getElementById('ai-improve-submit');
    if (improveSubmitBtn) {
      // Remove any existing listeners
      improveSubmitBtn.replaceWith(improveSubmitBtn.cloneNode(true));
      const newImproveSubmitBtn = document.getElementById('ai-improve-submit');
      newImproveSubmitBtn.addEventListener('click', handleImproveSubmit);
    }
  }

  // Initialize only once when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIGenerator);
  } else {
    // DOM is already ready
    initAIGenerator();
  }

  // Simple function to open AI Generator - exposed globally
  function openAIGenerator() {
    const aiPage = document.getElementById('ai-generator-page');
    if (!aiPage) {
      console.error('AI generator page not found');
      return;
    }
    // Simply remove the hidden class to show the page
    aiPage.classList.remove('hidden');
    console.log('AI Generator page opened');
  }

  // Expose function globally
  window.openAIGenerator = openAIGenerator;

  // Note: btn-ai-generate listener is handled in initializeAIPage() to avoid duplicates
  // No separate connectAIGenerateButton() needed

})();
