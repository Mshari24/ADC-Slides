/**
 * Clean AI Presentation Generator
 * Simple AI slide generation using the backend API
 */

(function() {
  'use strict';

  // Global variable to store selected theme ID (e.g., "blank", "aramco", "blue-aramco", "dark-aramco")
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

  /**
   * Show clear loading state during AI generation
   * Provides visual feedback that generation is in progress
   */
  function showLoading() {
    const loader = document.getElementById("ai-loading");
    if (loader) {
      loader.classList.remove("hidden");
      loader.setAttribute('aria-busy', 'true');
      console.log('[Loading] AI generation started - showing loading indicator');
    }
    
    // Also disable generate button to prevent multiple clicks
    const generateBtn = document.getElementById('ai-page-generate-btn');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.setAttribute('aria-busy', 'true');
    }
  }

  /**
   * Hide loading state after AI generation completes
   * Called on both success and error
   */
  function hideLoading() {
    const loader = document.getElementById("ai-loading");
    if (loader) {
      loader.classList.add("hidden");
      loader.removeAttribute('aria-busy');
      console.log('[Loading] AI generation completed - hiding loading indicator');
    }
    
    // Re-enable generate button
    const generateBtn = document.getElementById('ai-page-generate-btn');
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.removeAttribute('aria-busy');
    }
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

  // Helper function to convert theme name to theme ID
  function getThemeIdFromName(themeName) {
    if (!themeName) return 'aramco'; // Default
    
    const themeNameMap = {
      'Blank Theme': 'blank',
      'AD Theme 1': 'blue-aramco',
      'AD Dark Theme': 'dark-aramco',
      'AD Theme 2': 'aramco'
    };
    
    // If it's already an ID, return it
    if (['blank', 'aramco', 'dark-aramco', 'blue-aramco'].includes(themeName)) {
      return themeName;
    }
    
    // Otherwise, try to map from name
    return themeNameMap[themeName] || 'aramco';
  }

  // Complete theme definition with colors, fonts, spacing, and layout rules
  function getThemeDefinition(themeId) {
    // Map theme IDs/names to complete theme definitions
    const themeDefinitions = {
      'blank': {
        colors: {
          primary: '#333333',
          secondary: '#666666',
          background: '#ffffff',
          text: '#333333',
          accent: '#666666'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,      // Centered vertically for title slides
          contentTop: 80,      // Top margin for content slides
          bulletSpacing: 12,   // Space between bullets
          leftMargin: 112,     // Left margin for content
          rightMargin: 112     // Right margin for content
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      },
      'aramco': {
        colors: {
          primary: '#024c3a',
          secondary: '#00aae7',
          background: '#ffffff',
          text: '#024c3a',
          accent: '#024c3a'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,
          contentTop: 80,
          bulletSpacing: 12,
          leftMargin: 112,
          rightMargin: 112
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      },
      'AD Theme 2': {
        colors: {
          primary: '#024c3a',
          secondary: '#00aae7',
          background: '#ffffff',
          text: '#024c3a',
          accent: '#024c3a'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,
          contentTop: 80,
          bulletSpacing: 12,
          leftMargin: 112,
          rightMargin: 112
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      },
      'dark-aramco': {
        colors: {
          primary: '#00aae7',
          secondary: '#024c3a',
          background: '#1a1a1a',
          text: '#ffffff',
          accent: '#00aae7'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,
          contentTop: 80,
          bulletSpacing: 12,
          leftMargin: 112,
          rightMargin: 112
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: '#1a1a1a',
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#1a1a1a',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      },
      'AD Dark Theme': {
        colors: {
          primary: '#00aae7',
          secondary: '#024c3a',
          background: '#1a1a1a',
          text: '#ffffff',
          accent: '#00aae7'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,
          contentTop: 80,
          bulletSpacing: 12,
          leftMargin: 112,
          rightMargin: 112
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: '#1a1a1a',
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#1a1a1a',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      },
      'blue-aramco': {
        colors: {
          primary: '#00aae7',
          secondary: '#006c35',
          background: '#ffffff',
          text: '#00aae7',
          accent: '#00aae7'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,
          contentTop: 80,
          bulletSpacing: 12,
          leftMargin: 112,
          rightMargin: 112
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: 'linear-gradient(135deg, #004C45 0%, #006c35 50%, #0097D6 100%)', // Special gradient for first slide
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      },
      'AD Theme 1': {
        colors: {
          primary: '#00aae7',
          secondary: '#006c35',
          background: '#ffffff',
          text: '#00aae7',
          accent: '#00aae7'
        },
        fonts: {
          family: 'Inter, system-ui, sans-serif',
          titleSize: 58,
          bodySize: 20,
          titleWeight: '800',
          bodyWeight: 'normal'
        },
        spacing: {
          titleTop: 270,
          contentTop: 80,
          bulletSpacing: 12,
          leftMargin: 112,
          rightMargin: 112
        },
        alignment: {
          title: 'center',
          body: 'left'
        },
        layouts: {
          titleSlide: {
            background: 'linear-gradient(135deg, #004C45 0%, #006c35 50%, #0097D6 100%)',
            titlePosition: { x: 480, y: 270 }
          },
          contentSlide: {
            background: '#ffffff',
            titlePosition: { x: 480, y: 80 },
            bulletStartY: 170
          }
        }
      }
    };

    // Try to find theme by ID first, then by name
    const theme = themeDefinitions[themeId] || themeDefinitions['aramco']; // Default to aramco
    return theme;
  }

  // Legacy function for backward compatibility
  function getThemeColors(themeId) {
    const theme = getThemeDefinition(themeId);
    return {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      background: theme.colors.background,
      text: theme.colors.text
    };
  }

  /**
   * Generate monochromatic color variations from a base color
   * Creates shades and tints of the same hue for cohesive design
   * @param {string} baseColor - Hex color (e.g., '#00aae7')
   * @param {number} titleDarkness - Darkness level for title (0-1, higher = darker)
   * @param {number} bodyLightness - Lightness level for body (0-1, higher = lighter)
   * @returns {Object} { titleColor, bodyColor }
   */
  function generateMonochromaticColors(baseColor, titleDarkness = 0.85, bodyLightness = 0.65) {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance to determine if we should darken or lighten
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLight = luminance > 0.5;

    // Generate title color (darker/more saturated)
    let titleR, titleG, titleB;
    if (isLight) {
      // Darken the color for title
      titleR = Math.max(0, Math.floor(r * titleDarkness));
      titleG = Math.max(0, Math.floor(g * titleDarkness));
      titleB = Math.max(0, Math.floor(b * titleDarkness));
    } else {
      // Lighten slightly but keep saturation
      titleR = Math.min(255, Math.floor(r + (255 - r) * (1 - titleDarkness) * 0.3));
      titleG = Math.min(255, Math.floor(g + (255 - g) * (1 - titleDarkness) * 0.3));
      titleB = Math.min(255, Math.floor(b + (255 - b) * (1 - titleDarkness) * 0.3));
    }

    // Generate body color (lighter/more muted)
    let bodyR, bodyG, bodyB;
    if (isLight) {
      // Further darken but less than title
      const bodyDarkness = titleDarkness * bodyLightness;
      bodyR = Math.max(0, Math.floor(r * bodyDarkness));
      bodyG = Math.max(0, Math.floor(g * bodyDarkness));
      bodyB = Math.max(0, Math.floor(b * bodyDarkness));
    } else {
      // Lighten more for body text
      bodyR = Math.min(255, Math.floor(r + (255 - r) * bodyLightness * 0.5));
      bodyG = Math.min(255, Math.floor(g + (255 - g) * bodyLightness * 0.5));
      bodyB = Math.min(255, Math.floor(b + (255 - b) * bodyLightness * 0.5));
    }

    // Convert back to hex
    const toHex = (val) => {
      const hex = val.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return {
      titleColor: `#${toHex(titleR)}${toHex(titleG)}${toHex(titleB)}`,
      bodyColor: `#${toHex(bodyR)}${toHex(bodyG)}${toHex(bodyB)}`
    };
  }

  /**
   * Create a slide with theme applied at content creation step
   * This is Step 5 of the clean pipeline: Apply theme + layout to each slide
   * 
   * @param {Object} slideData - Normalized slide data from AI (Step 4 output)
   *   Can be either: { title, bullets } or { title, bulletPoints, layoutType }
   * @param {number} index - Slide index (0-based)
   * @param {string} themeId - Theme ID to apply
   * @returns {Object} Slide object with theme applied
   */
  function createAramcoSlide(slideData, index, themeId) {
    // Get complete theme definition (colors, fonts, spacing, layouts)
    const theme = getThemeDefinition(themeId || 'aramco');
    
    // Handle both old format (bullets) and new format (bulletPoints)
    const bullets = slideData.bullets || slideData.bulletPoints || [];
    
    // Ensure bullets is an array
    const bulletPoints = Array.isArray(bullets) ? bullets : [];
    
    // Detect layout type: title-only slides vs content slides
    const isTitleSlide = bulletPoints.length === 0 || slideData.layoutType === 'title';
    const layoutType = isTitleSlide ? 'titleSlide' : 'contentSlide';
    
    // Get layout-specific settings from theme
    const layout = theme.layouts[layoutType];
    const backgroundColor = (themeId === 'blue-aramco' && index === 0) 
      ? theme.layouts.titleSlide.background 
      : layout.background;

    // Slide dimensions
    const slideWidth = 960;
    const slideHeight = 540;
    
    // Layout areas: content area (65%) and image area (30%)
    const contentAreaWidth = Math.floor(slideWidth * 0.65);
    const imageAreaWidth = Math.floor(slideWidth * 0.30);
    const gap = slideWidth - contentAreaWidth - imageAreaWidth; // Remaining space for margins
    
    // Image placeholder dimensions
    const imagePlaceholderWidth = 200;
    const imagePlaceholderHeight = 160;
    
    // Create slide object with theme background applied
    const slideObj = {
      id: generateId(),
      elements: [],
      layout: isTitleSlide ? 'title' : 'content',
      background: backgroundColor
    };

    // Mark first slide for blue-aramco theme (for special rendering)
    if (themeId === 'blue-aramco' && index === 0) {
      slideObj.isBlueAramcoTitle = true;
    }

    // Generate monochromatic colors (used for both title and content slides)
    const monochromeColors = generateMonochromaticColors(
      theme.colors.primary || theme.colors.text || '#00aae7',
      isTitleSlide ? 0.90 : 0.85, // Title darkness
      0.70  // Body lightness
    );

    if (isTitleSlide) {
      // Title slide: Apply theme typography, spacing, and alignment
      // Calculate image dimensions and position for title slide
      const imageWidth = 280;
      const imageHeight = 200;
      const imageMargin = 24;
      
      // Position image on right side, centered vertically
      const imageX = slideWidth - imageWidth - imageMargin;
      const imageY = (slideHeight - imageHeight) / 2; // Center vertically
      
      // Adjust title position to account for image on right
      // Title should be centered in remaining space (left side)
      const availableWidth = imageX - imageMargin; // Space left of image
      const titleX = availableWidth / 2; // Center in available space
      const titleY = slideHeight / 2; // Center vertically
      
      // Ensure title doesn't overflow
      const maxTitleWidth = Math.min(availableWidth - 40, slideWidth * 0.6); // Max 60% of slide width
      
      const titleElement = createTextElement(
        slideData.title || '',
        titleX,
        titleY,
        {
          fontSize: theme.fonts.titleSize,
          fontWeight: theme.fonts.titleWeight,
          color: monochromeColors.titleColor, // Use monochromatic title color
          textAlign: 'center', // Center align for title slides
          fontFamily: theme.fonts.family,
          lineHeight: 1.2
        }
      );
      
      // Set width constraints to prevent overflow
      titleElement.width = maxTitleWidth;
      titleElement.maxWidth = maxTitleWidth;
      titleElement.wordBreak = 'break-word';
      titleElement.whiteSpace = 'normal';
      titleElement.overflowWrap = 'break-word';
      titleElement.isTitleOnly = true;
      slideObj.elements.push(titleElement);
      
      // Add image placeholder for title slide
      const imageSpace = {
        id: generateId(),
        type: 'shape',
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        shapeType: 'rectangle',
        fillColor: 'transparent',
        strokeColor: 'transparent',
        strokeWidth: 0,
        strokeDash: 'solid',
        borderRadius: 0,
        locked: false,
        isImageSpace: true,
        isReservedSpace: true
      };
      slideObj.elements.push(imageSpace);
      
      // Generate image for title slide
      slideObj._imageGenerationPromise = generateAIImageForSlide(
        slideData.title || '',
        [],
        slideData.topic || '',
        themeId
      ).then(imageUrl => {
        if (imageUrl) {
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.state && window.state.slides) {
              const slideInState = window.state.slides.find(s => s.id === slideObj.id) || window.state.slides[index];
              if (slideInState && slideInState.elements) {
                const placeholderIndex = slideInState.elements.findIndex(el => el.isImageSpace);
                if (placeholderIndex >= 0) {
                  const imageElement = {
                    id: generateId(),
                    type: 'image',
                    x: imageX,
                    y: imageY,
                    width: imageWidth,
                    height: imageHeight,
                    src: imageUrl,
                    fileName: `ai-generated-title-${index + 1}`,
                    fileType: 'image',
                    isAIGenerated: true,
                    slideIndex: index
                  };
                  slideInState.elements[placeholderIndex] = imageElement;
                  if (window.saveState) window.saveState();
                  if (window.renderAll) window.renderAll();
                  console.log(`[Image Generation] Added image to title slide ${index + 1}`);
                }
              }
            }
          }, 500);
        }
        return imageUrl;
      }).catch(error => {
        console.error(`[Image Generation] Failed for title slide ${index + 1}:`, error);
        return null;
      });
    } else {
      // Content slide: Clean left-aligned layout with reserved image space
      // Using pure text elements only - NO HTML, NO markup, NO styling
      
      // Mark slide as using flex layout
      slideObj.layout = 'flex';
      slideObj.useFlexLayout = true;
      
      // Body text size (18px or theme's bodySize if < 20)
      const bodyFontSize = theme.fonts.bodySize && theme.fonts.bodySize < 20 ? theme.fonts.bodySize : 18;
      
      // Generate monochromatic colors from theme primary color
      const monochromeColors = generateMonochromaticColors(
        theme.colors.primary || theme.colors.text || '#00aae7',
        0.85, // Title darkness (85% of original)
        0.70  // Body lightness (70% of title darkness)
      );
      const titleColor = monochromeColors.titleColor;
      const bodyTextColor = monochromeColors.bodyColor;
      
      // DETECT IF SLIDE NEEDS DATA VISUALIZATION (CHART) OR IMAGE
      const needsChart = needsDataVisualization(slideData.title || '', bulletPoints);
      const visualType = needsChart ? 'chart' : 'image'; // Chart takes priority if data detected
      
      // USE THEME SPACING RULES for layout
      const themeSpacing = theme.spacing || {};
      const themeLeftMargin = themeSpacing.leftMargin || 112; // Default from theme
      const themeRightMargin = themeSpacing.rightMargin || 112;
      const themeContentTop = themeSpacing.contentTop || 80;
      const themeBulletSpacing = themeSpacing.bulletSpacing || 12;
      
      // VISUAL ELEMENT DIMENSIONS AND POSITIONING (calculated first to reserve space)
      // Charts are slightly larger than images for better readability
      // Base dimensions that will be adjusted based on available space
      const baseVisualWidth = needsChart ? 300 : 280;
      const baseVisualHeight = needsChart ? 200 : 200;
      
      // Calculate visual element position using theme right margin
      const visualX = slideWidth - baseVisualWidth - themeRightMargin;
      const visualWidth = baseVisualWidth;
      const visualHeight = baseVisualHeight;
      
      // Calculate available width for text using theme left margin
      const textAreaWidth = visualX - themeLeftMargin; // Space between theme left margin and visual element
      const textLeftMargin = themeLeftMargin; // Use theme-defined left margin
      
      // 1) TITLE ELEMENT - Use theme layout rules
      // Get title size from theme or use default
      const titleFontSize = theme.fonts.titleSize || 36;
      const titleFontWeight = theme.fonts.titleWeight || '700';
      const titleAlignment = theme.alignment.title || 'left';
      
      // Adjust title width to fit in available space (respecting theme margins)
      const titleMaxWidth = Math.min(textAreaWidth, visualX - themeLeftMargin - 20);
      const titleTopMargin = themeContentTop; // Use theme-defined content top margin
      
      const titleElement = createTextElement(
        (slideData.title || '').trim(), // Pure text, no HTML
        textLeftMargin, // x position (use theme left margin)
        titleTopMargin, // y position (use theme content top)
        {
          fontSize: titleFontSize,
          fontWeight: titleFontWeight,
          color: titleColor, // Use monochromatic title color
          textAlign: titleAlignment,
          fontFamily: theme.fonts.family,
          lineHeight: 1.2
        }
      );
      titleElement.isContentTitle = true;
      titleElement.isLeftAligned = (titleAlignment === 'left');
      titleElement.width = titleMaxWidth;
      titleElement.maxWidth = titleMaxWidth;
      titleElement.wordBreak = 'break-word';
      titleElement.whiteSpace = 'normal';
      titleElement.overflowWrap = 'break-word';
      
      // Validate title position stays within bounds (respecting theme margins)
      if (titleElement.x < themeLeftMargin) titleElement.x = themeLeftMargin;
      if (titleElement.x + titleMaxWidth > visualX) {
        titleElement.width = Math.max(200, visualX - titleElement.x - 20); // Minimum 200px width
        titleElement.maxWidth = titleElement.width;
      }
      
      slideObj.elements.push(titleElement);

      // Calculate title height for positioning body text
      const titleHeight = titleFontSize * 1.2; // fontSize * lineHeight
      const titleBottom = titleTopMargin + titleHeight;
      const bodyStartY = titleBottom + 20; // Title bottom + margin (theme spacing)
      
      // Calculate visual element Y position (align with body start, respecting theme spacing)
      const visualY = Math.max(bodyStartY, titleBottom + 16); // Align with body start or below title
      const visualBottom = visualY + visualHeight;
      const slideBottom = slideHeight - themeRightMargin; // Use theme right margin for bottom
      const maxBodyHeight = Math.min(visualBottom, slideBottom) - bodyStartY - themeRightMargin;
      
      // 2) BODY TEXT ELEMENTS - Use theme spacing and alignment rules
      const validBullets = bulletPoints
        .map(bullet => bullet.trim())
        .filter(bullet => bullet.length > 0);
      
      let currentY = bodyStartY;
      const lineSpacing = themeBulletSpacing; // Use theme-defined bullet spacing
      let dynamicBodyFontSize = bodyFontSize; // Start with theme body size
      const bodyAlignment = theme.alignment.body || 'left';
      
      // Calculate if we need to reduce font size to fit all content
      let totalEstimatedHeight = 0;
      validBullets.forEach(bullet => {
        const estimatedLines = Math.max(1, Math.ceil(bullet.length / Math.floor(textAreaWidth / (bodyFontSize * 0.6))));
        totalEstimatedHeight += Math.ceil(bodyFontSize * 1.45 * estimatedLines) + lineSpacing;
      });
      
      // If content exceeds available space, reduce font size
      if (totalEstimatedHeight > maxBodyHeight && maxBodyHeight > 0) {
        const scaleFactor = Math.max(0.75, maxBodyHeight / totalEstimatedHeight); // Minimum 75% of original size
        dynamicBodyFontSize = Math.max(14, Math.floor(bodyFontSize * scaleFactor)); // Minimum 14px
      }
      
      validBullets.forEach((bullet, index) => {
        // Calculate text width based on available space
        const bulletTextWidth = textAreaWidth;
        const estimatedLines = Math.max(1, Math.ceil(bullet.length / Math.floor(bulletTextWidth / (dynamicBodyFontSize * 0.6))));
        const bulletHeight = Math.ceil(dynamicBodyFontSize * 1.45 * estimatedLines);
        
        // Check if this bullet would overflow (using theme margins)
        if (currentY + bulletHeight > slideBottom - themeRightMargin) {
          // Reduce font size further if needed
          const remainingHeight = slideBottom - themeRightMargin - currentY;
          if (remainingHeight > 0) {
            const adjustedFontSize = Math.max(12, Math.floor(dynamicBodyFontSize * (remainingHeight / bulletHeight)));
            dynamicBodyFontSize = Math.min(dynamicBodyFontSize, adjustedFontSize);
          }
        }
        
        // Create text element with pure text only - using theme rules
        const bodyTextElement = createTextElement(
          bullet, // Pure text, no HTML, no markup
          textLeftMargin, // x position (use theme left margin)
          currentY, // y position
          {
            fontSize: dynamicBodyFontSize, // Use dynamically adjusted font size
            fontWeight: theme.fonts.bodyWeight || 'normal',
            color: bodyTextColor, // Monochromatic color matching theme
            textAlign: bodyAlignment, // Use theme-defined body alignment
            fontFamily: theme.fonts.family, // Use theme font family
            lineHeight: 1.45
          }
        );
        
        // Mark as body text
        bodyTextElement.isBodyText = true;
        bodyTextElement.bulletIndex = index;
        
        // Set width constraints for wrapping (leaves room for visual element on right)
        // Respect theme margins
        bodyTextElement.width = bulletTextWidth;
        bodyTextElement.maxWidth = bulletTextWidth;
        bodyTextElement.wordBreak = 'break-word';
        bodyTextElement.whiteSpace = 'normal';
        bodyTextElement.overflowWrap = 'anywhere';
        bodyTextElement.display = 'block';
        
        // Validate position stays within bounds (respecting theme margins)
        if (bodyTextElement.x < themeLeftMargin) bodyTextElement.x = themeLeftMargin;
        if (bodyTextElement.x + bulletTextWidth > visualX - 20) {
          bodyTextElement.width = Math.max(200, visualX - bodyTextElement.x - 20); // Minimum 200px
          bodyTextElement.maxWidth = bodyTextElement.width;
        }
        if (bodyTextElement.y < bodyStartY) bodyTextElement.y = bodyStartY;
        if (bodyTextElement.y + bulletHeight > slideBottom) {
          // Adjust Y position if it would overflow (respecting theme margins)
          bodyTextElement.y = Math.max(bodyStartY, slideBottom - bulletHeight - themeRightMargin);
        }
        
        slideObj.elements.push(bodyTextElement);
        
        // Update Y position for next bullet (using theme spacing)
        currentY += bulletHeight + lineSpacing;
        
        // Stop if we've run out of vertical space (respecting theme margins)
        if (currentY > slideBottom - themeRightMargin) {
          console.warn(`[Layout] Content truncated at bullet ${index + 1} to prevent overflow`);
        }
      });
      
      // 3) GENERATE AND ADD VISUAL ELEMENT (CHART OR IMAGE) - Based on content analysis
      // Ensure visual element doesn't overflow slide bounds (using theme margins)
      const finalVisualY = Math.max(themeRightMargin, Math.min(visualY, slideHeight - visualHeight - themeRightMargin));
      const finalVisualX = Math.max(themeRightMargin, Math.min(visualX, slideWidth - visualWidth - themeRightMargin));
      
      // DYNAMIC IMAGE RESIZING: Adjust image size based on available space and content
      let finalVisualWidth = visualWidth;
      let finalVisualHeight = visualHeight;
      
      if (!needsChart) {
        // For images: dynamically resize to fit available space while maintaining aspect ratio
        const availableHeight = slideBottom - finalVisualY;
        const availableWidth = slideWidth - finalVisualX - themeRightMargin;
        
        // Maintain aspect ratio (assume 4:3 for images)
        const imageAspectRatio = 4 / 3;
        const maxHeight = Math.min(availableHeight, slideHeight - finalVisualY - themeRightMargin);
        const maxWidth = Math.min(availableWidth, slideWidth - finalVisualX - themeRightMargin);
        
        // Calculate optimal size maintaining aspect ratio
        const heightBasedWidth = maxHeight * imageAspectRatio;
        const widthBasedHeight = maxWidth / imageAspectRatio;
        
        if (heightBasedWidth <= maxWidth) {
          finalVisualWidth = Math.min(heightBasedWidth, maxWidth);
          finalVisualHeight = maxHeight;
        } else {
          finalVisualWidth = maxWidth;
          finalVisualHeight = Math.min(widthBasedHeight, maxHeight);
        }
        
        // Ensure minimum size
        finalVisualWidth = Math.max(200, finalVisualWidth);
        finalVisualHeight = Math.max(150, finalVisualHeight);
        
        // Recalculate text area if image was resized
        if (finalVisualWidth !== visualWidth) {
          const newVisualX = slideWidth - finalVisualWidth - themeRightMargin;
          const newTextAreaWidth = newVisualX - themeLeftMargin;
          
          // Adjust title width if needed
          if (titleElement.width > newTextAreaWidth) {
            titleElement.width = Math.max(200, newTextAreaWidth);
            titleElement.maxWidth = titleElement.width;
          }
          
          // Adjust body text widths
          slideObj.elements.forEach(el => {
            if (el.isBodyText && el.width > newTextAreaWidth) {
              el.width = Math.max(200, newTextAreaWidth);
              el.maxWidth = el.width;
            }
          });
        }
      }
      
      if (needsChart) {
        // Add chart placeholder initially (will be replaced by chart when ready)
        // Charts use fixed size (not dynamically resized like images)
        const chartSpace = {
          id: generateId(),
          type: 'shape',
          x: finalVisualX,
          y: finalVisualY,
          width: visualWidth, // Charts use fixed width
          height: visualHeight, // Charts use fixed height
          shapeType: 'rectangle',
          fillColor: 'transparent',
          strokeColor: 'transparent',
          strokeWidth: 0,
          strokeDash: 'solid',
          borderRadius: 0,
          locked: false,
          isChartSpace: true,
          isReservedSpace: true
        };
        
        // Final validation: ensure chart doesn't overflow (using theme margins)
        if (chartSpace.x + chartSpace.width > slideWidth) {
          chartSpace.x = slideWidth - chartSpace.width - themeRightMargin;
        }
        if (chartSpace.y + chartSpace.height > slideHeight) {
          chartSpace.y = slideHeight - chartSpace.height - themeRightMargin;
        }
        if (chartSpace.x < themeRightMargin) chartSpace.x = themeRightMargin;
        if (chartSpace.y < themeRightMargin) chartSpace.y = themeRightMargin;
        
        slideObj.elements.push(chartSpace);
        
        // Generate chart data asynchronously
        slideObj._chartGenerationPromise = generateChartDataForSlide(
          slideData.title || '',
          bulletPoints,
          slideData.topic || ''
        ).then(chartData => {
          if (chartData) {
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.state && window.state.slides) {
                const slideInState = window.state.slides.find(s => s.id === slideObj.id) || window.state.slides[index];
                if (slideInState && slideInState.elements) {
                  const placeholderIndex = slideInState.elements.findIndex(el => el.isChartSpace);
                  if (placeholderIndex >= 0) {
                    // Generate theme-based colors for chart
                    const chartColors = generateChartColors(theme.colors.primary || '#00aae7', chartData.data.length);
                    
                    const chartElement = {
                      id: generateId(),
                      type: 'chart',
                      chartType: chartData.chartType || 'bar',
                      x: chartSpace.x,
                      y: chartSpace.y,
                      width: chartSpace.width,
                      height: chartSpace.height,
                      data: chartData.data || [],
                      colors: chartColors,
                      showLegend: true,
                      showLabels: true,
                      isAIGenerated: true,
                      slideIndex: index
                    };
                    
                    // Final bounds check (using theme margins)
                    if (chartElement.x + chartElement.width > slideWidth) {
                      chartElement.width = slideWidth - chartElement.x - themeRightMargin;
                    }
                    if (chartElement.y + chartElement.height > slideHeight) {
                      chartElement.height = slideHeight - chartElement.y - themeRightMargin;
                    }
                    
                    slideInState.elements[placeholderIndex] = chartElement;
                    if (window.saveState) window.saveState();
                    if (window.renderAll) window.renderAll();
                    console.log(`[Chart Generation] Added chart to slide ${index + 1} at (${chartElement.x}, ${chartElement.y})`);
                  }
                }
              }
            }, 500);
          }
          return chartData;
        }).catch(error => {
          console.error(`[Chart Generation] Failed for slide ${index + 1}:`, error);
          return null;
        });
      } else {
        // Add image placeholder initially (will be replaced by image when ready)
        const imageSpace = {
          id: generateId(),
          type: 'shape',
          x: finalVisualX,
          y: finalVisualY,
          width: visualWidth,
          height: visualHeight,
          shapeType: 'rectangle',
          fillColor: 'transparent',
          strokeColor: 'transparent',
          strokeWidth: 0,
          strokeDash: 'solid',
          borderRadius: 0,
          locked: false,
          isImageSpace: true,
          isReservedSpace: true
        };
        
        // Use dynamically calculated image dimensions
        imageSpace.width = finalVisualWidth;
        imageSpace.height = finalVisualHeight;
        imageSpace.x = finalVisualX;
        imageSpace.y = finalVisualY;
        
        // Final validation: ensure image doesn't overflow (using theme margins)
        if (imageSpace.x + imageSpace.width > slideWidth) {
          imageSpace.x = slideWidth - imageSpace.width - themeRightMargin;
        }
        if (imageSpace.y + imageSpace.height > slideHeight) {
          imageSpace.y = slideHeight - imageSpace.height - themeRightMargin;
        }
        if (imageSpace.x < themeRightMargin) imageSpace.x = themeRightMargin;
        if (imageSpace.y < themeRightMargin) imageSpace.y = themeRightMargin;
        
        slideObj.elements.push(imageSpace);
        
        // Generate image asynchronously (ALWAYS generate, not optional)
        slideObj._imageGenerationPromise = generateAIImageForSlide(
          slideData.title || '',
          bulletPoints,
          slideData.topic || '',
          themeId
        ).then(imageUrl => {
          if (imageUrl) {
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.state && window.state.slides) {
                const slideInState = window.state.slides.find(s => s.id === slideObj.id) || window.state.slides[index];
                if (slideInState && slideInState.elements) {
                  const placeholderIndex = slideInState.elements.findIndex(el => el.isImageSpace);
                  if (placeholderIndex >= 0) {
                    // Use dynamically resized dimensions
                    const imageElement = {
                      id: generateId(),
                      type: 'image',
                      x: imageSpace.x, // Use validated position
                      y: imageSpace.y, // Use validated position
                      width: imageSpace.width, // Use dynamically resized width
                      height: imageSpace.height, // Use dynamically resized height
                      src: imageUrl,
                      fileName: `ai-generated-${index + 1}`,
                      fileType: 'image',
                      isAIGenerated: true,
                      slideIndex: index
                    };
                    
                    // Final bounds check (using theme margins)
                    if (imageElement.x + imageElement.width > slideWidth) {
                      imageElement.width = slideWidth - imageElement.x - themeRightMargin;
                    }
                    if (imageElement.y + imageElement.height > slideHeight) {
                      imageElement.height = slideHeight - imageElement.y - themeRightMargin;
                    }
                    
                    slideInState.elements[placeholderIndex] = imageElement;
                    if (window.saveState) window.saveState();
                    if (window.renderAll) window.renderAll();
                    console.log(`[Image Generation] Added image to slide ${index + 1} at (${imageElement.x}, ${imageElement.y})`);
                  }
                }
              }
            }, 500);
          } else {
            console.warn(`[Image Generation] No image URL returned for slide ${index + 1}, keeping placeholder`);
          }
          return imageUrl;
        }).catch(error => {
          console.error(`[Image Generation] Failed for slide ${index + 1}:`, error);
          return null;
        });
      }
    }

    // Final validation: Ensure all elements are within slide bounds (using theme margins)
    const themeSpacingFinal = theme.spacing || {};
    const finalThemeLeftMargin = themeSpacingFinal.leftMargin || 112;
    const finalThemeRightMargin = themeSpacingFinal.rightMargin || 112;
    
    slideObj.elements.forEach((element, elemIndex) => {
      // Validate X position (respecting theme margins)
      if (element.x < finalThemeLeftMargin) {
        console.warn(`[Layout Validation] Element ${elemIndex} X position ${element.x} < theme margin, adjusting`);
        element.x = finalThemeLeftMargin;
      }
      if (element.x + (element.width || 0) > slideWidth - finalThemeRightMargin) {
        const maxWidth = slideWidth - element.x - finalThemeRightMargin;
        if (element.width) {
          element.width = Math.max(50, maxWidth); // Minimum 50px width
          element.maxWidth = element.width;
        }
        console.warn(`[Layout Validation] Element ${elemIndex} would overflow right, adjusted width to ${element.width}`);
      }
      
      // Validate Y position (respecting theme margins)
      if (element.y < finalThemeRightMargin) {
        console.warn(`[Layout Validation] Element ${elemIndex} Y position ${element.y} < theme margin, adjusting`);
        element.y = finalThemeRightMargin;
      }
      if (element.y + (element.height || 0) > slideHeight - finalThemeRightMargin) {
        const maxHeight = slideHeight - element.y - finalThemeRightMargin;
        if (element.height) {
          element.height = Math.max(50, maxHeight); // Minimum 50px height
        }
        console.warn(`[Layout Validation] Element ${elemIndex} would overflow bottom, adjusted height to ${element.height}`);
      }
    });

    return slideObj;
  }

  /**
   * Detect if slide content needs data visualization (chart)
   * Checks for numerical data, comparisons, percentages, trends, etc.
   * @param {string} slideTitle - Title of the slide
   * @param {Array} bulletPoints - Array of bullet points
   * @returns {boolean} True if chart would be beneficial
   */
  function needsDataVisualization(slideTitle, bulletPoints) {
    const content = (slideTitle + ' ' + bulletPoints.join(' ')).toLowerCase();
    
    // Keywords that suggest data visualization
    const chartKeywords = [
      'percent', 'percentage', '%', 'statistic', 'data', 'number', 'figure',
      'increase', 'decrease', 'growth', 'decline', 'trend', 'compare', 'comparison',
      'ratio', 'rate', 'average', 'total', 'sum', 'count', 'survey', 'poll',
      'result', 'outcome', 'score', 'metric', 'measurement', 'analysis',
      'quarter', 'year', 'month', 'week', 'period', 'timeframe',
      'bar chart', 'pie chart', 'line graph', 'graph', 'chart'
    ];
    
    // Check for numbers (especially percentages or comparisons)
    const hasNumbers = /\d+/.test(content);
    const hasPercentages = /%\s*\d+|\d+\s*%/.test(content);
    const hasComparisons = /\d+\s*(vs|versus|compared|to|and)\s*\d+/.test(content);
    
    // Check for chart-related keywords
    const hasChartKeywords = chartKeywords.some(keyword => content.includes(keyword));
    
    // Check for multiple data points (suggests comparison)
    const numbers = content.match(/\d+/g);
    const hasMultipleDataPoints = numbers && numbers.length >= 3;
    
    // Decision: chart if (has numbers AND chart keywords) OR (has percentages/comparisons) OR (multiple data points)
    return (hasNumbers && hasChartKeywords) || hasPercentages || hasComparisons || (hasMultipleDataPoints && hasChartKeywords);
  }

  /**
   * Generate theme-based chart colors from primary color
   * Creates harmonious color palette for charts
   * @param {string} primaryColor - Theme primary color
   * @param {number} count - Number of colors needed
   * @returns {Array<string>} Array of hex color codes
   */
  function generateChartColors(primaryColor, count) {
    // Convert hex to RGB
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const colors = [];
    const toHex = (val) => {
      const hex = Math.max(0, Math.min(255, Math.floor(val))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    // Generate variations: lighter, darker, complementary
    for (let i = 0; i < count; i++) {
      const factor = i / Math.max(1, count - 1); // 0 to 1
      let newR, newG, newB;
      
      if (i === 0) {
        // First color: primary color
        newR = r;
        newG = g;
        newB = b;
      } else {
        // Create variations: mix with white/black and shift hue
        const lightness = 0.7 + (factor * 0.3); // 0.7 to 1.0
        const saturation = 0.8 - (factor * 0.2); // 0.8 to 0.6
        
        // Simple color variation algorithm
        newR = Math.min(255, r + (255 - r) * (1 - lightness) * saturation + Math.sin(factor * Math.PI * 2) * 30);
        newG = Math.min(255, g + (255 - g) * (1 - lightness) * saturation + Math.cos(factor * Math.PI * 2) * 30);
        newB = Math.min(255, b + (255 - b) * (1 - lightness) * saturation);
      }
      
      colors.push(`#${toHex(newR)}${toHex(newG)}${toHex(newB)}`);
    }
    
    return colors;
  }

  /**
   * Generate chart data from slide content using AI
   * @param {string} slideTitle - Title of the slide
   * @param {Array} bulletPoints - Array of bullet points
   * @param {string} topic - Overall presentation topic
   * @returns {Promise<Object|null>} Chart data object or null if generation fails
   */
  async function generateChartDataForSlide(slideTitle, bulletPoints, topic) {
    try {
      const response = await fetch('http://localhost:3000/api/ai/generate-chart-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideTitle: slideTitle || 'Presentation Slide',
          bulletPoints: bulletPoints || [],
          topic: topic || ''
        })
      });

      if (!response.ok) {
        console.warn(`[Chart Generation] HTTP ${response.status}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      if (data.chartData) {
        console.log(`[Chart Generation] Successfully generated chart data for: "${slideTitle}"`);
        return data.chartData;
      } else {
        console.warn(`[Chart Generation] No chart data in response for: "${slideTitle}"`);
        return null;
      }
    } catch (error) {
      console.error('[Chart Generation] Error:', error);
      return null;
    }
  }

  /**
   * Generate AI image for a slide using DALL-E
   * ALWAYS generates an image - this is mandatory for all slides
   * @param {string} slideTitle - Title of the slide
   * @param {Array} bulletPoints - Array of bullet points
   * @param {string} topic - Overall presentation topic
   * @param {string} themeId - Theme ID
   * @returns {Promise<string|null>} Image URL or null if generation fails (placeholder kept)
   */
  async function generateAIImageForSlide(slideTitle, bulletPoints, topic, themeId) {
    try {
      const response = await fetch('http://localhost:3000/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideTitle: slideTitle || 'Presentation Slide',
          bulletPoints: bulletPoints || [],
          topic: topic || '',
          theme: themeId || 'aramco'
        })
      });

      if (!response.ok) {
        console.warn(`[Image Generation] HTTP ${response.status}: ${response.statusText} - Will retry or use placeholder`);
        // Return null but placeholder is already in place
        return null;
      }

      const data = await response.json();
      if (data.imageUrl) {
        console.log(`[Image Generation] Successfully generated image for: "${slideTitle}"`);
        return data.imageUrl;
      } else {
        console.warn(`[Image Generation] No image URL in response for: "${slideTitle}" - Placeholder will remain`);
        return null;
      }
    } catch (error) {
      console.error('[Image Generation] Error:', error);
      // Placeholder is already in place, so slide is still valid
      return null;
    }
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

  /**
   * Step 3: Build clean prompt and call AI API
   * Single API call with all necessary information
   * 
   * LOADING STATE: Shows clear loading indicator during generation
   */
  async function generateSlidesFromAI(topic, slideCount, language, selectedTheme) {
    // Show clear loading state
    showLoading();
    console.log(`[AI Generation] Starting generation: topic="${topic}", count=${slideCount}, theme="${selectedTheme}", lang="${language}"`);
    
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

    // Options section is always visible for topic and text workflows
    const optionsSection = document.getElementById('ai-options-section');
    if (optionsSection) {
      optionsSection.style.display = 'flex';
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
    // themeIdentifier can be: theme ID ("blank", "aramco", etc.) or theme name ("Blank Theme", "AD Theme 1", etc.)
    // Always stores theme ID in selectedTheme
    
    // Ensure themeIdentifier is a valid string (never undefined or null)
    if (!themeIdentifier || typeof themeIdentifier !== 'string') {
      console.error('Invalid theme identifier:', themeIdentifier);
      return;
    }
    
    const validTheme = String(themeIdentifier).trim();
    
    // Convert to theme ID if it's a name, otherwise use as-is
    const themeId = getThemeIdFromName(validTheme);
    
    // Store theme ID in selectedTheme (not name)
    window.selectedTheme = themeId;
    selectedTheme = themeId;
    
    // Update visual state for all theme cards in AI generator theme grid
    const aiThemesGrid = document.querySelector('#ai-themes-grid');
    if (aiThemesGrid) {
      const themeBoxes = aiThemesGrid.querySelectorAll('.theme-box');
      themeBoxes.forEach(box => {
        box.classList.remove('active', 'selected');
        
        // Match by theme ID (stored in dataset)
        const boxThemeId = box.dataset.themeId;
        if (boxThemeId === themeId) {
          box.classList.add('active', 'selected');
        }
      });
    }
    
    console.log('Selected theme ID:', themeId);
  }

  // Expose selectTheme globally for external access
  window.selectTheme = selectTheme;

  // Text workflow handler - defined at module scope
  async function handleTextSubmit() {
    // Prevent multiple simultaneous generation requests
    if (isGenerating) {
      console.warn('Generation already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('AI text button clicked');
    
    // Set flag to prevent duplicates
    isGenerating = true;
    
    const textInput = document.getElementById('ai-text-input');
    const text = textInput?.value.trim();
    const slideCountInput = document.getElementById('number-of-slides')?.value;
    const language = document.getElementById('ai-language-selector')?.value;
    const selectedTheme = window.selectedTheme || null; // Get selected theme from global variable

    if (!text) {
        alert('Please enter some text.');
        isGenerating = false; // Reset flag
        return;
    }

    // Validate slide count - if empty, treat as null and stop
    if (!slideCountInput || slideCountInput.trim() === '') {
      alert('Please enter the number of slides.');
      isGenerating = false; // Reset flag
      return;
    }

    // Always convert to integer using parseInt
    const slideCount = parseInt(slideCountInput, 10);

    // Validate slide count range (1-50)
    if (isNaN(slideCount) || slideCount < 1 || slideCount > 50) {
      alert('Slide count must be between 1 and 50.');
      isGenerating = false; // Reset flag
      return;
    }

    // Validate theme selection - ensure selectedTheme is NOT undefined, null, or empty
    if (!selectedTheme || selectedTheme === null || selectedTheme === undefined || selectedTheme === '') {
      alert('Please select a theme.');
      isGenerating = false; // Reset flag
      return;
    }

    showLoading();
    try {
      // Use text as topic for now (can be enhanced later)
      const result = await generateSlidesFromAI(text, slideCount, language, selectedTheme);

      if (result.error) {
          alert(result.error);
          hideLoading();
          isGenerating = false; // Reset flag
          return;
      }

      if (!result.slides) {
          alert('No slides returned.');
          hideLoading();
          isGenerating = false; // Reset flag
          return;
      }

      // Step 4: Parse AI response into normalized slide data structure
      // DEFENSIVE CHECK: Handle malformed response gracefully
      if (!result || typeof result !== 'object') {
        console.error('[Safety] Invalid response: not an object');
        alert('Invalid response from server. Please try again.');
        hideLoading();
        isGenerating = false;
        return;
      }
      
      if (result.error) {
        console.error('[Safety] Server error:', result.error);
        alert(result.error || 'Error generating slides. Please try again.');
        hideLoading();
        isGenerating = false;
        return;
      }
      
      if (!result.slides || !Array.isArray(result.slides)) {
        console.error('[Safety] Invalid response: missing or invalid slides array');
        alert('Invalid response: no slides returned. Please try again.');
        hideLoading();
        isGenerating = false;
        return;
      }
      
      if (result.slides.length === 0) {
        console.error('[Safety] Invalid response: empty slides array');
        alert('No slides were generated. Please try again.');
        hideLoading();
        isGenerating = false;
        return;
      }

      // DEFENSIVE CHECK: Ensure we don't exceed requested count
      const MAX_SLIDES = 50;
      const slidesToGenerate = result.slides.slice(0, slideCount);

      // MINIMAL LOG: Slide count requested vs produced
      if (slidesToGenerate.length !== slideCount) {
        console.log(`[Slide Count] Requested: ${slideCount}, Using: ${slidesToGenerate.length}`);
      }

      // selectedTheme already contains theme ID (e.g., "blank", "aramco", "blue-aramco")
      const themeId = selectedTheme || 'aramco'; // Fallback to 'aramco' if somehow undefined
      
      // MINIMAL LOG: Theme applied
      console.log(`[Theme] Applying theme: ${themeId}`);

      // Step 5: For each slide - Apply theme + layout
      // Theme is applied at content creation step (not after, not separately)
      // DEFENSIVE CHECK: Validate each slide data before creating
      // Get topic from the original request (stored in result or passed separately)
      const presentationTopic = result.topic || text || '';
      
      const slideObjects = slidesToGenerate.map((slideData, index) => {
        // DEFENSIVE CHECK: Handle malformed slide data
        if (!slideData || typeof slideData !== 'object') {
          console.warn(`[Safety] Invalid slide data at index ${index}, using defaults`);
          slideData = { title: `Slide ${index + 1}`, bullets: [] };
        }
        
        // Normalize slide data structure with defensive checks
        const normalizedSlideData = {
          id: `slide-${index}`,
          title: (slideData.title && typeof slideData.title === 'string') ? slideData.title.trim() : `Slide ${index + 1}`,
          bulletPoints: Array.isArray(slideData.bullets) ? slideData.bullets : [],
          notes: (slideData.notes && typeof slideData.notes === 'string') ? slideData.notes : '',
          layoutType: (!slideData.bullets || slideData.bullets.length === 0) ? 'title' : 'content',
          topic: presentationTopic // Pass topic for image generation
        };
        
        // Ensure title is not empty
        if (!normalizedSlideData.title || normalizedSlideData.title.length === 0) {
          normalizedSlideData.title = `Slide ${index + 1}`;
        }
        
        // Apply theme + layout during creation (not after)
        return createAramcoSlide(normalizedSlideData, index, themeId);
      }).filter(slide => slide !== null && slide !== undefined); // Remove any null/undefined slides
      
      // DEFENSIVE CHECK: Final validation - ensure exact count
      if (slideObjects.length !== slideCount) {
        console.warn(`[Safety] Created ${slideObjects.length} slides, expected ${slideCount}`);
        // Trim to exact count if we somehow got more
        if (slideObjects.length > slideCount) {
          slideObjects.splice(slideCount);
        }
      }
      
      // MINIMAL LOG: Final slide count
      console.log(`[Final] Created ${slideObjects.length} slides with theme ${themeId}`);

      // Step 6: Save slides and render once
      // Theme colors are already applied during slide creation (Step 5)
      // No separate theme deck is created - slides are created WITH theme applied
      if (typeof window !== 'undefined' && window.addAISlides) {
        window.addAISlides(slideObjects, themeId);
      } else {
        // Fallback: dispatch event that app.js listens to
        const event = new CustomEvent('ai-slides-generated', { 
          detail: { slides: slideObjects, themeId: themeId },
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
      isGenerating = false; // Reset flag
    }
  }

  // End of clean AI system

  // ----------------------
  //  Generate Slides Functions
  // ----------------------

  // Flag to prevent multiple simultaneous generation requests
  let isGenerating = false;

  async function generateSlidesRequest() {
    // Prevent multiple simultaneous generation requests
    if (isGenerating) {
      console.warn('Generation already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('AI topic button clicked');
    
    // Set flag to prevent duplicates
    isGenerating = true;
    
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
      // selectedTheme contains theme ID (e.g., "blank", "aramco", "blue-aramco", "dark-aramco")
      const requestBody = {
        slideCount: selectedSlideCount,  // Always a number
        theme: selectedTheme,            // Theme ID (validated above)
        topic: selectedTopic,           // Always a string (validated above)
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

      // Server already handles deduplication and exact count, but add safety check
      if (!data.slides || !Array.isArray(data.slides)) {
        alert('Invalid response: no slides array');
        stopLoading();
        return;
      }

      // Ensure we don't exceed requested count (server should handle this, but double-check)
      const slidesToGenerate = data.slides.slice(0, selectedSlideCount);

      if (slidesToGenerate.length !== selectedSlideCount) {
        console.warn(`Slide count mismatch: requested ${selectedSlideCount}, received ${slidesToGenerate.length}`);
      }

      // Step 4: Parse AI response into normalized slide data structure
      // selectedTheme already contains theme ID (e.g., "blank", "aramco", "blue-aramco")
      const themeId = selectedTheme || 'aramco'; // Fallback to 'aramco' if somehow undefined
      
      // MINIMAL LOG: Theme applied
      console.log(`[Theme] Applying theme: ${themeId}`);

      // Step 5: For each slide - Apply theme + layout
      // Theme is applied at content creation step (not after, not separately)
      // DEFENSIVE CHECK: Validate each slide data before creating
      // Get topic from the original request
      const presentationTopic = data.topic || selectedTopic || '';
      
      const slideObjects = slidesToGenerate.map((slideData, index) => {
        // DEFENSIVE CHECK: Handle malformed slide data
        if (!slideData || typeof slideData !== 'object') {
          console.warn(`[Safety] Invalid slide data at index ${index}, using defaults`);
          slideData = { title: `Slide ${index + 1}`, bullets: [] };
        }
        
        // Normalize slide data structure with defensive checks
        const normalizedSlideData = {
          id: `slide-${index}`,
          title: (slideData.title && typeof slideData.title === 'string') ? slideData.title.trim() : `Slide ${index + 1}`,
          bulletPoints: Array.isArray(slideData.bullets) ? slideData.bullets : [],
          notes: (slideData.notes && typeof slideData.notes === 'string') ? slideData.notes : '',
          layoutType: (!slideData.bullets || slideData.bullets.length === 0) ? 'title' : 'content',
          topic: presentationTopic // Pass topic for image generation
        };
        
        // Ensure title is not empty
        if (!normalizedSlideData.title || normalizedSlideData.title.length === 0) {
          normalizedSlideData.title = `Slide ${index + 1}`;
        }
        
        // Apply theme + layout during creation (not after)
        return createAramcoSlide(normalizedSlideData, index, themeId);
      }).filter(slide => slide !== null && slide !== undefined); // Remove any null/undefined slides
      
      // DEFENSIVE CHECK: Final validation - ensure exact count
      if (slideObjects.length !== selectedSlideCount) {
        console.warn(`[Safety] Created ${slideObjects.length} slides, expected ${selectedSlideCount}`);
        // Trim to exact count if we somehow got more
        if (slideObjects.length > selectedSlideCount) {
          slideObjects.splice(selectedSlideCount);
        }
      }
      
      // MINIMAL LOG: Final slide count
      console.log(`[Final] Created ${slideObjects.length} slides with theme ${themeId}`);

      // Step 6: Save slides and render once
      // Theme colors are already applied during slide creation (Step 5)
      // No separate theme deck is created - slides are created WITH theme applied
      if (typeof window !== 'undefined' && window.addAISlides) {
        window.addAISlides(slideObjects, themeId);
        } else {
        // Fallback: dispatch event that app.js listens to
        const event = new CustomEvent('ai-slides-generated', { 
          detail: { slides: slideObjects, themeId: themeId },
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
      // Always stop loading and reset flag, even if there's an error
      stopLoading();
      isGenerating = false;
    }
  }

  /**
   * Single unified generate handler function
   * Handles both initial generation and regeneration
   * 
   * REGENERATION BEHAVIOR:
   * - Always replaces existing slides (never appends)
   * - Shows clear loading state
   * - Shows exactly one presentation after success
   */
  async function handleGenerate() {
    // Validate theme selection before proceeding
    const currentTheme = window.selectedTheme || selectedTheme;
    if (!currentTheme || currentTheme === null || currentTheme === undefined || currentTheme === '') {
      alert('Please select a theme.');
      return;
    }
    
    console.log('[Generate] User clicked Generate button - starting generation/regeneration');
    
    try {
      // generateSlidesRequest() handles:
      // - Loading state (showLoading/stopLoading)
      // - Clearing existing slides (regeneration behavior)
      // - Creating slides with theme applied
      // - Adding slides to state (single presentation, never appended)
      await generateSlidesRequest();
      
      console.log('[Generate] Generation completed successfully - showing single presentation');
      
      // Close AI page after successful generation (if it's open)
      if (typeof hideAIPage === 'function' && isAIPageVisible) {
        hideAIPage();
        isAIPageVisible = false;
      }
    } catch (e) {
      console.error('[Generate] Error during generation:', e);
      const errorMessage = e.message || 'An unexpected error occurred while generating slides.';
      alert(`Error generating slides: ${errorMessage}`);
      // Ensure loading state is cleared on error
      hideLoading();
      stopLoading();
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
        }
        
        if (activeContent) {
          activeContent.classList.add('active');
        }
        
        // Options section is always visible for topic and text workflows
        const optionsSection = aiPage.querySelector('.ai-generator-options');
        if (optionsSection) {
          optionsSection.style.display = 'flex';
        }
      });
    });
    
    // Theme box selection - Use EXACT same structure and logic as main theme modal
    const aiThemesGrid = aiPage.querySelector('#ai-themes-grid');
    if (aiThemesGrid) {
      // Use the EXACT same availableThemes array from app.js (exposed via window)
      const themesToUse = window.availableThemes || [];
      
      aiThemesGrid.innerHTML = '';
      
      // Get current theme from app.js or previously selected theme (now stores theme ID)
      const currentThemeId = window.currentTheme || window.selectedTheme || 'blank';
      
      // Create theme boxes using EXACT same structure as main theme modal
      themesToUse.forEach(theme => {
        // Create simple box container
        const themeBox = document.createElement('div');
        // Check if this theme matches the current selection (by ID)
        const isSelected = theme.id === currentThemeId;
        themeBox.className = `theme-box ${isSelected ? 'active selected' : ''}`;
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
        // Set swatch color dynamically (per-theme color, so inline style is appropriate)
        colorSwatch.style.backgroundColor = swatchColor;
        
        // Create theme name label (EXACT same as main theme modal)
        const label = document.createElement('div');
        label.className = 'theme-box-label';
        label.textContent = theme.name;
        
        // Assemble box (EXACT same as main theme modal)
        themeBox.appendChild(colorSwatch);
        themeBox.appendChild(label);
        
        // Attach click handler - store theme ID and update visual state
        themeBox.addEventListener('click', () => {
          // Store theme ID directly in selectedTheme
          selectTheme(theme.id);
          
          // Update visual state in main themes modal if it exists
          if (window.currentTheme !== undefined) {
            window.currentTheme = theme.id;
          }
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
      // Restore visual state - selectedTheme now stores theme ID directly
      selectTheme(currentSelectedTheme);
    } else if (window.currentTheme) {
      // If no explicit selection but there's a current theme, select it by ID
      selectTheme(window.currentTheme);
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
  
  // Expose createAramcoSlide globally for use in app.js (Proof/Review feature)
  window.createAramcoSlide = createAramcoSlide;

  // Note: btn-ai-generate listener is handled in initializeAIPage() to avoid duplicates
  // No separate connectAIGenerateButton() needed

})();
