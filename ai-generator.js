/**
 * Clean AI Presentation Generator
 * Simple AI slide generation using the backend API
 */

(function() {
  'use strict';

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
  //  AI Presentation Logic
  // ----------------------

  async function generateSlidesFromAI(topic, slideCount, language) {
    showLoading();
    try {
        const response = await fetch('http://localhost:3000/api/ai/generate-slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
                topic: topic,
                slideCount: slideCount,
                language: language
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
    // Update workflow buttons
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
    
    // Use event delegation on the AI sidebar content container
    const aiSidebarContent = document.querySelector('.ai-sidebar-content');
    if (aiSidebarContent) {
      console.log('AI sidebar content found, using event delegation');
      
      // Workflow button delegation
      aiSidebarContent.addEventListener('click', (e) => {
        const workflowBtn = e.target.closest('.ai-workflow-btn');
        if (workflowBtn) {
          e.preventDefault();
          e.stopPropagation();
          const workflow = workflowBtn.dataset.workflow || workflowBtn.id.replace('ai-workflow-', '');
          console.log('Workflow button clicked:', workflow);
          switchWorkflow(workflow);
          return;
        }
      });
    }
    
    // Also attach direct listeners as backup
    const topicBtn = document.getElementById('ai-workflow-topic');
    const textBtn = document.getElementById('ai-workflow-text');
    const improveBtn = document.getElementById('ai-workflow-improve');
    
    console.log('Workflow buttons found:', { topicBtn, textBtn, improveBtn });
    
    if (topicBtn) {
      topicBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Topic workflow clicked (direct)');
        switchWorkflow('topic');
      });
    }

    if (textBtn) {
      textBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Text workflow clicked (direct)');
        switchWorkflow('text');
      });
    }

    if (improveBtn) {
      improveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Improve workflow clicked (direct)');
        switchWorkflow('improve');
      });
    }

    console.log('AI generator initialization complete');
  }

  // Text workflow handler - defined at module scope
  async function handleTextSubmit() {
    console.log('AI text button clicked');
    const textInput = document.getElementById('ai-text-input');
    const text = textInput?.value.trim();
    const slideCount = parseInt(document.getElementById('ai-slide-count')?.value);
    const language = document.getElementById('ai-language-selector')?.value;

    if (!text) {
        alert('Please enter some text.');
        return;
    }

    showLoading();
    try {
      // Use text as topic for now (can be enhanced later)
      const result = await generateSlidesFromAI(text, slideCount, language);

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

      alert(`Successfully generated ${slidesToGenerate.length} slides!`);
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
    const topic = document.getElementById('ai-input')?.value.trim();
    const slideCount = parseInt(document.getElementById('ai-slide-count')?.value);
    const language = document.getElementById('ai-language-selector')?.value;

    if (!topic) {
      alert('Please enter a topic.');
      return;
    }

    const result = await generateSlidesFromAI(topic, slideCount, language);

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

    alert(`Successfully generated ${slidesToGenerate.length} slides!`);
      hideLoading();
  }

  async function generateSlides() {
    startLoading();
    try {
      await generateSlidesRequest();
    } catch (e) {
      console.error('Generate slides error:', e);
      const errorMessage = e.message || 'An unexpected error occurred while generating slides.';
      alert(`Error generating slides: ${errorMessage}`);
    } finally {
      stopLoading();
    }
  }

  // ----------------------
  //  Loading State Management
  // ----------------------

  function startLoading() {
    const generateBtn = document.getElementById('ai-topic-submit');
    if (!generateBtn) return;
    
    const generateText = generateBtn.querySelector('span');
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    if (generateText) {
      generateText.innerText = 'Generating...';
    } else {
      // Fallback if span doesn't exist
      generateBtn.textContent = 'Generating...';
    }
  }

  function stopLoading() {
    const generateBtn = document.getElementById('ai-topic-submit');
    if (!generateBtn) return;
    
    const generateText = generateBtn.querySelector('span');
    generateBtn.disabled = false;
    generateBtn.classList.remove('loading');
    if (generateText) {
      generateText.innerText = 'Generate Presentation';
    }
  }


  // Wrap ALL AI listeners and DOM access in DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize AI system
    initializeAI();

    // MAIN TOPIC BUTTON LISTENER - Only for "From Topic" workflow
    const generateBtn = document.getElementById('ai-topic-submit');
    if (generateBtn) {
      // Remove any existing listeners
      generateBtn.onclick = null;
      generateBtn.replaceWith(generateBtn.cloneNode(true));
      const newGenerateBtn = document.getElementById('ai-topic-submit');
      newGenerateBtn.onclick = generateSlides;
    } else {
      console.error('ai-topic-submit button not found');
    }

    // TEXT WORKFLOW BUTTON LISTENER - Only for "From Text" workflow
    const textSubmitBtn = document.getElementById('ai-text-submit');
    if (textSubmitBtn) {
      textSubmitBtn.onclick = handleTextSubmit;
    }

    // IMPROVE WORKFLOW BUTTON LISTENER
    const improveSubmitBtn = document.getElementById('ai-improve-submit');
    if (improveSubmitBtn) {
      improveSubmitBtn.onclick = handleImproveSubmit;
    }
  });

})();
