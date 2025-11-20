/**
 * Advanced AI Presentation Generator
 * Features: Internet research, intelligent layouts, themes, slide count control
 */

(function() {
  'use strict';

  // ============================================================================
  // Configuration & Constants
  // ============================================================================
  
  const CONFIG = {
    panelId: 'ai-generator-panel',
    buttonId: 'ai-generator-btn',
    closeButtonId: 'ai-panel-close',
    workflowTopicId: 'ai-workflow-topic',
    workflowTextId: 'ai-workflow-text',
    workflowImproveId: 'ai-workflow-improve',
    topicContentId: 'ai-content-topic',
    textContentId: 'ai-content-text',
    improveContentId: 'ai-content-improve',
    optionsSectionId: 'ai-options-section',
    topicInputId: 'ai-topic-input',
    textInputId: 'ai-text-input',
    topicSubmitId: 'ai-topic-submit',
    textSubmitId: 'ai-text-submit',
    improveSubmitId: 'ai-improve-submit',
    slideCountId: 'ai-slide-count',
    themeSelectorId: 'ai-theme-selector',
    loadingId: 'ai-loading',
    errorId: 'ai-error',
    researchStepId: 'step-research',
    generateStepId: 'step-generate',
    designStepId: 'step-design',
    generationDelay: 3000, // Simulated AI delay
  };

  // ============================================================================
  // Theme Definitions
  // ============================================================================
  
  const THEMES = {
    aramco: {
      name: 'Aramco',
      primary: '#003e6a',
      secondary: '#00aae7',
      accent: '#006c35',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'corporate',
      titleAlign: 'center',
      bodyAlign: 'left',
      fontWeight: 'bold',
    },
    blue: {
      name: 'Blue',
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'modern',
      titleAlign: 'left',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'modern-minimal': {
      name: 'Modern Minimal',
      primary: '#0f172a',
      secondary: '#64748b',
      accent: '#94a3b8',
      background: '#ffffff',
      text: '#0f172a',
      textLight: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'minimal',
      titleAlign: 'left',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'gradient-soft': {
      name: 'Gradient Soft',
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#6366f1',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'creative',
      titleAlign: 'center',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'dark-mode': {
      name: 'Dark Mode',
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      accent: '#94a3b8',
      background: '#0f172a',
      text: '#f1f5f9',
      textLight: '#cbd5e1',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'modern',
      titleAlign: 'left',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    // Auto-detected themes
    'energy-oil-gas': {
      name: 'Energy & Oil & Gas',
      primary: '#003e6a',
      secondary: '#00aae7',
      accent: '#006c35',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'corporate',
      titleAlign: 'center',
      bodyAlign: 'left',
      fontWeight: 'bold',
    },
    'technology-ai': {
      name: 'Technology & AI',
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#06b6d4',
      background: '#ffffff',
      text: '#0f172a',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'modern',
      titleAlign: 'center',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'healthcare-medical': {
      name: 'Healthcare',
      primary: '#0d9488',
      secondary: '#14b8a6',
      accent: '#67e8f9',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'clean',
      titleAlign: 'left',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'environment-sustainability': {
      name: 'Environment & Sustainability',
      primary: '#16a34a',
      secondary: '#22c55e',
      accent: '#84cc16',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'organic',
      titleAlign: 'center',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'education-training': {
      name: 'Education & Training',
      primary: '#2563eb',
      secondary: '#f97316',
      accent: '#fbbf24',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'simple',
      titleAlign: 'left',
      bodyAlign: 'left',
      fontWeight: '600',
    },
    'finance-banking': {
      name: 'Finance & Banking',
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      layoutStyle: 'corporate',
      titleAlign: 'left',
      bodyAlign: 'left',
      fontWeight: 'bold',
    },
  };

  // ============================================================================
  // Layout Types
  // ============================================================================
  
  const LAYOUTS = {
    title: 'title',
    'two-column': 'two-column',
    content: 'content',
    'image-text': 'image-text',
    'key-points': 'key-points',
    summary: 'summary',
  };

  // ============================================================================
  // DOM Elements
  // ============================================================================
  
  let elements = {};

  /**
   * Robust element finder - location-independent
   * Prefers elements inside the panel, then visible elements, then first found
   */
  function findElement(id, preferInsidePanel = false) {
    const allMatches = document.querySelectorAll(`#${id}, [data-id="${id}"]`);
    if (allMatches.length === 0) return null;
    
    if (allMatches.length === 1) return allMatches[0];
    
    // Multiple matches found - prioritize
    const panel = elements.panel || document.getElementById(CONFIG.panelId);
    
    if (preferInsidePanel && panel) {
      // Prefer element inside the panel
      const insidePanel = Array.from(allMatches).find(el => panel.contains(el));
      if (insidePanel) return insidePanel;
    }
    
    // Prefer visible elements (offsetParent !== null means element is visible)
    const visible = Array.from(allMatches).find(el => el.offsetParent !== null);
    if (visible) return visible;
    
    // Fallback to first element
    return allMatches[0];
  }

  /**
   * Initialize all elements with robust location-independent finding
   */
  function initializeElements() {
    // Find panel first (required for other elements)
    elements.panel = findElement(CONFIG.panelId) || document.getElementById(CONFIG.panelId);
    
    // Find button (can be anywhere) - use direct getElementById first for reliability
    elements.button = document.getElementById(CONFIG.buttonId) || findElement(CONFIG.buttonId);
    
    // Debug: Log if button not found
    if (!elements.button) {
      console.warn(`AI Generator: Button with ID "${CONFIG.buttonId}" not found in DOM`);
    }
    
    // Find elements, preferring those inside the panel
    elements.closeButton = findElement(CONFIG.closeButtonId, true);
    
    // Find workflow buttons using querySelector for reliability (works regardless of DOM position)
    const topicBtn = document.querySelector(`#${CONFIG.workflowTopicId}`);
    const textBtn = document.querySelector(`#${CONFIG.workflowTextId}`);
    const improveBtn = document.querySelector(`#${CONFIG.workflowImproveId}`);
    
    elements.workflowTopicBtn = topicBtn;
    elements.workflowTextBtn = textBtn;
    elements.workflowImproveBtn = improveBtn;
    elements.topicContent = findElement(CONFIG.topicContentId, true);
    elements.textContent = findElement(CONFIG.textContentId, true);
    elements.improveContent = findElement(CONFIG.improveContentId, true);
    elements.optionsSection = findElement(CONFIG.optionsSectionId, true);
    
    // Inputs and selects - prefer visible ones inside panel
    elements.topicInput = findElement(CONFIG.topicInputId, true);
    elements.textInput = findElement(CONFIG.textInputId, true);
    elements.slideCount = findElement(CONFIG.slideCountId, true);
    elements.themeSelector = findElement(CONFIG.themeSelectorId, true);
    
    // Submit buttons - prefer inside panel
    elements.topicSubmit = findElement(CONFIG.topicSubmitId, true);
    elements.textSubmit = findElement(CONFIG.textSubmitId, true);
    elements.improveSubmit = findElement(CONFIG.improveSubmitId, true);
    
    // Loading and error elements
    elements.loading = findElement(CONFIG.loadingId, true);
    elements.error = findElement(CONFIG.errorId, true);
    elements.researchStep = findElement(CONFIG.researchStepId, true);
    elements.generateStep = findElement(CONFIG.generateStepId, true);
    elements.designStep = findElement(CONFIG.designStepId, true);
    
    // Validate critical elements
    const missing = [];
    if (!elements.panel) missing.push('panel');
    if (!elements.button) missing.push('button');
    
    if (missing.length > 0) {
      console.warn(`AI Generator: Missing critical elements: ${missing.join(', ')}`);
    }
  }

  // ============================================================================
  // State Management
  // ============================================================================
  
  const state = {
    currentWorkflow: 'topic',
    isGenerating: false,
  };

  // ============================================================================
  // UI Control Functions
  // ============================================================================
  
  function openPanel() {
    // Refresh element references in case DOM changed
    initializeElements();
    
    // Find the AI section - check multiple possible locations
    const aiSidebarContent = document.querySelector('.ai-sidebar-content');
    const aiSidebarCard = aiSidebarContent ? aiSidebarContent.closest('.right-sidebar-card') : null;
    
    if (aiSidebarCard) {
      // Scroll to the AI section in the sidebar
      aiSidebarCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Focus appropriate input
      const topicInput = getActiveElementValue(CONFIG.topicInputId) || elements.topicInput;
      const textInput = getActiveElementValue(CONFIG.textInputId) || elements.textInput;
      if (state.currentWorkflow === 'topic' && topicInput) {
        setTimeout(() => topicInput.focus(), 100);
      } else if (state.currentWorkflow === 'text' && textInput) {
        setTimeout(() => textInput.focus(), 100);
      }
    } else if (elements.panel) {
      // Fallback to modal behavior if sidebar version not found
      elements.panel.classList.remove('hidden');
      // Focus appropriate input
      const topicInput = getActiveElementValue(CONFIG.topicInputId) || elements.topicInput;
      const textInput = getActiveElementValue(CONFIG.textInputId) || elements.textInput;
      if (state.currentWorkflow === 'topic' && topicInput) {
        setTimeout(() => topicInput.focus(), 100);
      } else if (state.currentWorkflow === 'text' && textInput) {
        setTimeout(() => textInput.focus(), 100);
      }
    }
  }

  function closePanel() {
    // Refresh panel reference
    const panel = findElement(CONFIG.panelId) || elements.panel;
    if (!panel) return;
    
    panel.classList.add('hidden');
    hideError();
    hideLoading();
    
    // Clear inputs - find all instances
    const topicInputs = document.querySelectorAll(`#${CONFIG.topicInputId}`);
    const textInputs = document.querySelectorAll(`#${CONFIG.textInputId}`);
    topicInputs.forEach(input => input.value = '');
    textInputs.forEach(input => input.value = '');
  }

  /**
   * Select workflow - handles UI updates for workflow switching
   * Works regardless of DOM position
   */
  function selectWorkflow(workflow) {
    if (state.isGenerating || workflow === state.currentWorkflow) return;
    
    state.currentWorkflow = workflow;
    
    // Find all workflow buttons using querySelector (works regardless of DOM position)
    const topicBtn = document.querySelector(`#${CONFIG.workflowTopicId}`);
    const textBtn = document.querySelector(`#${CONFIG.workflowTextId}`);
    const improveBtn = document.querySelector(`#${CONFIG.workflowImproveId}`);
    
    // Remove "active" from all workflow buttons
    [topicBtn, textBtn, improveBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    
    // Add "active" to the clicked button
    if (workflow === 'topic' && topicBtn) {
      topicBtn.classList.add('active');
    } else if (workflow === 'text' && textBtn) {
      textBtn.classList.add('active');
    } else if (workflow === 'improve' && improveBtn) {
      improveBtn.classList.add('active');
    }
    
    // Find all workflow content sections
    const topicContent = document.querySelector(`#${CONFIG.topicContentId}`);
    const textContent = document.querySelector(`#${CONFIG.textContentId}`);
    const improveContent = document.querySelector(`#${CONFIG.improveContentId}`);
    const optionsSection = document.querySelector(`#${CONFIG.optionsSectionId}`);
    
    // Hide all workflow content sections
    [topicContent, textContent, improveContent].forEach(content => {
      if (content) {
        content.classList.remove('active');
        content.classList.add('hidden');
      }
    });
    
    // Show only the selected workflow content
    if (workflow === 'topic' && topicContent) {
      topicContent.classList.add('active');
      topicContent.classList.remove('hidden');
      if (optionsSection) {
        optionsSection.classList.remove('hidden');
        optionsSection.style.display = '';
      }
    } else if (workflow === 'text' && textContent) {
      textContent.classList.add('active');
      textContent.classList.remove('hidden');
      if (optionsSection) {
        optionsSection.classList.remove('hidden');
        optionsSection.style.display = '';
      }
    } else if (workflow === 'improve' && improveContent) {
      improveContent.classList.add('active');
      improveContent.classList.remove('hidden');
      if (optionsSection) {
        optionsSection.classList.add('hidden');
        optionsSection.style.display = 'none';
      }
    }
    
    // Update element references
    elements.topicContent = topicContent;
    elements.textContent = textContent;
    elements.improveContent = improveContent;
    elements.optionsSection = optionsSection;
    
    // Focus appropriate input
    const topicInput = document.querySelector(`#${CONFIG.topicInputId}`);
    const textInput = document.querySelector(`#${CONFIG.textInputId}`);
    if (workflow === 'topic' && topicInput) {
      setTimeout(() => topicInput.focus(), 100);
    } else if (workflow === 'text' && textInput) {
      setTimeout(() => textInput.focus(), 100);
    }
  }

  /**
   * Update button state to loading or normal
   */
  function setButtonLoading(buttonId, isLoading) {
    const buttons = document.querySelectorAll(`#${buttonId}`);
    buttons.forEach(btn => {
      if (!btn) return;
      
      if (isLoading) {
        btn.disabled = true;
        const span = btn.querySelector('span');
        if (span) {
          span.textContent = 'Generating...';
        }
        // Add spinner if not already present
        if (!btn.querySelector('.ai-btn-spinner')) {
          const spinner = document.createElement('div');
          spinner.className = 'ai-btn-spinner';
          spinner.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path></svg>';
          btn.insertBefore(spinner, btn.firstChild);
        }
      } else {
        btn.disabled = false;
        const span = btn.querySelector('span');
        if (span) {
          // Restore original text based on button ID
          if (buttonId === CONFIG.topicSubmitId || buttonId === CONFIG.textSubmitId) {
            span.textContent = 'Generate Presentation';
          } else if (buttonId === CONFIG.improveSubmitId) {
            span.textContent = 'Improve Presentation';
          }
        }
        // Remove spinner
        const spinner = btn.querySelector('.ai-btn-spinner');
        if (spinner) {
          spinner.remove();
        }
      }
    });
  }

  function showLoading() {
    // Show loading UI using getElementById for reliability
    const loadingEl = document.getElementById(CONFIG.loadingId);
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
    }
    
    // Hide workflow content
    [elements.topicContent, elements.textContent, elements.improveContent].forEach(content => {
      if (content) content.style.display = 'none';
    });
    
    state.isGenerating = true;
    // Reset steps
    updateLoadingStep('research');
  }

  function hideLoading() {
    // Hide loading UI using getElementById for reliability
    const loadingEl = document.getElementById(CONFIG.loadingId);
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    
    // Show workflow content again
    [elements.topicContent, elements.textContent, elements.improveContent].forEach(content => {
      if (content) content.style.display = '';
    });
    
    state.isGenerating = false;
  }

  function updateLoadingStep(step) {
    // Use getElementById for reliability
    const researchStep = document.getElementById(CONFIG.researchStepId);
    const generateStep = document.getElementById(CONFIG.generateStepId);
    const designStep = document.getElementById(CONFIG.designStepId);
    
    // Remove active from all steps
    [researchStep, generateStep, designStep].forEach(el => {
      if (el) el.classList.remove('active');
    });
    
    // Add active to current step
    if (step === 'research' && researchStep) {
      researchStep.classList.add('active');
    } else if (step === 'generate' && generateStep) {
      generateStep.classList.add('active');
    } else if (step === 'design' && designStep) {
      designStep.classList.add('active');
    }
  }

  function showError(message) {
    // Hide loading UI
    const loadingEl = document.getElementById(CONFIG.loadingId);
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    
    // Show error UI
    const errorEl = document.getElementById(CONFIG.errorId);
    if (errorEl) {
      const errorText = errorEl.querySelector('.ai-error-text');
      if (errorText) {
        errorText.textContent = message || 'An error occurred. Please try again.';
      }
      errorEl.classList.remove('hidden');
    }
    
    // Restore workflow content visibility
    [elements.topicContent, elements.textContent, elements.improveContent].forEach(content => {
      if (content) content.style.display = '';
    });
    
    state.isGenerating = false;
    
    // Restore all button states
    setButtonLoading(CONFIG.topicSubmitId, false);
    setButtonLoading(CONFIG.textSubmitId, false);
    setButtonLoading(CONFIG.improveSubmitId, false);
  }

  function hideError() {
    if (elements.error) {
      elements.error.classList.add('hidden');
    }
  }

  // ============================================================================
  // Internet Research (Simulated - Full-Depth Multi-Source Research)
  // ============================================================================
  
  async function performWebResearch(topic) {
    // Simulating comprehensive multi-source web research
    updateLoadingStep('research');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulated comprehensive research results with deep content
    return {
      definition: `${topic} represents a fundamental concept in modern technology and business practices. It encompasses a wide range of principles, methodologies, and applications that have transformed how organizations operate and innovate. The concept has evolved significantly over the past decade, driven by technological advancements, changing market demands, and emerging best practices. Understanding ${topic} requires examining its historical development, core theoretical foundations, and practical implementation strategies across various industries and contexts.`,
      
      background: `The origins of ${topic} can be traced back to foundational research and early implementations that established the groundwork for current practices. Over time, the field has undergone substantial evolution, influenced by breakthrough discoveries, industry needs, and technological capabilities. Key milestones include the development of standardized approaches, the establishment of professional communities, and the creation of comprehensive frameworks that guide implementation. Today, ${topic} stands as a critical component of modern business and technology strategies, with widespread adoption across sectors ranging from healthcare and finance to manufacturing and services.`,
      
      importance: `${topic} matters because it addresses fundamental challenges faced by organizations in today's competitive landscape. It enables companies to achieve greater efficiency, improve decision-making processes, and respond more effectively to changing market conditions. The strategic value of ${topic} extends beyond immediate operational benefits, contributing to long-term competitive advantages, enhanced customer satisfaction, and sustainable growth. Organizations that successfully implement ${topic} often report significant improvements in productivity, cost reduction, and innovation capabilities. Furthermore, ${topic} plays a crucial role in enabling digital transformation initiatives and supporting organizational agility in an increasingly complex business environment.`,
      
      applications: [
        {
          industry: 'Healthcare',
          description: `In the healthcare sector, ${topic} has revolutionized patient care delivery, enabling more accurate diagnoses, personalized treatment plans, and improved patient outcomes. Hospitals and medical facilities leverage ${topic} to optimize resource allocation, reduce wait times, and enhance the quality of care. For example, major medical centers have implemented ${topic} to streamline operations, resulting in reduced patient readmission rates and improved satisfaction scores. The technology also supports telemedicine initiatives, making healthcare more accessible to remote populations.`,
          examples: ['Mayo Clinic', 'Johns Hopkins Hospital', 'Cleveland Clinic']
        },
        {
          industry: 'Finance',
          description: `Financial institutions utilize ${topic} to enhance risk management, improve fraud detection, and optimize investment strategies. Banks and investment firms have integrated ${topic} into their core operations, enabling real-time analysis of market trends and customer behavior. This has led to more accurate credit assessments, reduced fraudulent transactions, and improved portfolio performance. Leading financial organizations such as JPMorgan Chase, Goldman Sachs, and Bank of America have reported significant operational improvements through strategic ${topic} implementation.`,
          examples: ['JPMorgan Chase', 'Goldman Sachs', 'Bank of America']
        },
        {
          industry: 'Manufacturing',
          description: `Manufacturing companies apply ${topic} to optimize production processes, improve quality control, and reduce operational costs. The implementation enables predictive maintenance, real-time monitoring of production lines, and data-driven decision making. Major manufacturers like Toyota, General Electric, and Siemens have successfully integrated ${topic} into their operations, achieving substantial improvements in efficiency and product quality. The technology supports Industry 4.0 initiatives, enabling smart factories and connected manufacturing ecosystems.`,
          examples: ['Toyota', 'General Electric', 'Siemens']
        },
        {
          industry: 'Technology',
          description: `Technology companies leverage ${topic} to drive innovation, enhance product development, and improve customer experiences. Leading tech firms including Google, Microsoft, and Amazon have built comprehensive ${topic} capabilities into their platforms and services. These implementations enable rapid scaling, improved service reliability, and enhanced user engagement. The technology sector continues to push the boundaries of what's possible with ${topic}, developing new applications and use cases that transform how businesses and consumers interact with technology.`,
          examples: ['Google', 'Microsoft', 'Amazon']
        }
      ],
      
      challenges: `Despite its numerous benefits, implementing ${topic} presents several significant challenges that organizations must address. Technical complexity requires specialized expertise and substantial investment in infrastructure and training. Organizations often face resistance to change from employees accustomed to traditional methods, necessitating comprehensive change management strategies. Data quality and integration issues can impede successful implementation, requiring careful planning and robust data governance frameworks. Additionally, security and privacy concerns demand rigorous safeguards to protect sensitive information. Cost considerations also play a crucial role, as initial investments can be substantial, though long-term returns typically justify the expenditure. Regulatory compliance adds another layer of complexity, particularly in highly regulated industries such as healthcare and finance.`,
      
      trends: `The future of ${topic} is shaped by several emerging trends that promise to further enhance its capabilities and applications. Artificial intelligence and machine learning integration are enabling more sophisticated and autonomous implementations. Cloud computing is making ${topic} more accessible to organizations of all sizes, reducing barriers to entry. The Internet of Things (IoT) is creating new opportunities for data collection and real-time monitoring. Edge computing is enabling faster processing and reduced latency for time-sensitive applications. Additionally, increased focus on sustainability and environmental impact is driving the development of more efficient and eco-friendly ${topic} solutions. Industry experts predict continued growth and evolution, with new applications emerging in areas such as autonomous systems, personalized experiences, and predictive analytics.`,
      
      bestPractices: `Successful implementation of ${topic} requires adherence to established best practices developed through years of industry experience. Organizations should begin with a comprehensive assessment of current capabilities and clear definition of objectives. Executive sponsorship and organizational alignment are critical for success, ensuring adequate resources and support throughout the implementation process. Phased rollout approaches minimize risk and allow for learning and adjustment. Continuous monitoring and optimization ensure that implementations deliver expected value and adapt to changing conditions. Training and change management programs help ensure user adoption and maximize benefits. Regular evaluation and refinement based on performance metrics and feedback enable continuous improvement and long-term success.`,
      
      caseStudies: [
        {
          company: 'Fortune 500 Corporation',
          result: `A major Fortune 500 company implemented ${topic} across its global operations, resulting in a 35% increase in operational efficiency and $50 million in annual cost savings. The implementation involved comprehensive process redesign, technology integration, and organizational change management. Key success factors included strong executive leadership, phased implementation approach, and comprehensive training programs. The company reported improved customer satisfaction scores, reduced error rates, and enhanced employee engagement.`,
        },
        {
          company: 'Mid-Size Enterprise',
          result: `A mid-size enterprise successfully adopted ${topic} to transform its customer service operations, achieving a 40% reduction in response times and 25% improvement in customer satisfaction. The implementation focused on process automation, data integration, and staff training. The organization was able to handle 50% more customer inquiries with the same staff size, demonstrating significant productivity gains.`,
        }
      ]
    };
  }

  // ============================================================================
  // Topic-Aware Design Detection
  // ============================================================================
  
  /**
   * Detect topic category and auto-select appropriate theme
   * Returns a fully structured theme object with colors and fonts
   */
  function detectTopicTheme(topic) {
    if (!topic) {
      return THEMES.aramco;
    }
    
    const topicLower = topic.toLowerCase();
    
    // Energy, Oil & Gas, Aramco - Check for "saudi aramco" first (two words)
    if (topicLower.includes('saudi aramco') || topicLower.match(/\b(aramco|oil|gas|petroleum|energy|crude|refinery|drilling|upstream|downstream|hydrocarbon)\b/)) {
      return THEMES['energy-oil-gas'];
    }
    
    // Technology, AI, Machine Learning
    if (topicLower.match(/\b(ai|artificial intelligence|machine learning|ml|deep learning|neural|algorithm|tech|technology|software|digital|cyber|data science|big data|cloud|iot|blockchain)\b/)) {
      return THEMES['technology-ai'];
    }
    
    // Healthcare, Medical
    if (topicLower.match(/\b(healthcare|medical|hospital|patient|doctor|nurse|treatment|diagnosis|pharmaceutical|medicine|health|clinical|surgery)\b/)) {
      return THEMES['healthcare-medical'];
    }
    
    // Environment, Sustainability
    if (topicLower.match(/\b(environment|sustainability|green|climate|renewable|solar|wind|eco|carbon|emission|conservation|nature|earth)\b/)) {
      return THEMES['environment-sustainability'];
    }
    
    // Education, Training
    if (topicLower.match(/\b(education|training|learning|course|student|teacher|school|university|academic|curriculum|pedagogy|instruction)\b/)) {
      return THEMES['education-training'];
    }
    
    // Finance, Banking
    if (topicLower.match(/\b(finance|banking|financial|investment|bank|trading|stock|market|accounting|revenue|profit|capital|loan|credit)\b/)) {
      return THEMES['finance-banking'];
    }
    
    // Default to Aramco for corporate/business topics
    return THEMES.aramco;
  }

  /**
   * Get theme configuration (user-selected or auto-detected)
   * Returns a fully structured theme object with colors and fonts
   */
  function getThemeConfig(userTheme, topic) {
    // If user selected a theme, use it
    if (userTheme && THEMES[userTheme]) {
      return THEMES[userTheme];
    }
    
    // Otherwise, auto-detect from topic (already returns full object)
    return detectTopicTheme(topic);
  }

  // ============================================================================
  // Intelligent Layout Selection (Topic-Aware)
  // ============================================================================
  
  function selectLayout(slideIndex, totalSlides, content, slideType, themeConfig) {
    if (slideIndex === 0) return LAYOUTS.title;
    if (slideIndex === totalSlides - 1) return LAYOUTS.summary;
    
    if (slideType === 'title') return LAYOUTS.title;
    
    const layoutStyle = themeConfig?.layoutStyle || 'corporate';
    const contentLength = Array.isArray(content) ? content.length : (content || '').length;
    const hasImages = content && typeof content === 'string' && content.toLowerCase().includes('image');
    
    // Topic-aware layout selection
    if (hasImages) return LAYOUTS['image-text'];
    
    // Corporate topics: prefer structured content layout
    if (layoutStyle === 'corporate') {
      if (contentLength > 800) return LAYOUTS['two-column'];
      return LAYOUTS.content;
    }
    
    // Technical topics: prefer two-column for longer content
    if (layoutStyle === 'modern' || layoutStyle === 'minimal') {
      if (contentLength > 600) return LAYOUTS['two-column'];
      return LAYOUTS.content;
    }
    
    // Creative topics: prefer key-points or content
    if (layoutStyle === 'creative') {
      if (contentLength < 400) return LAYOUTS['key-points'];
      return LAYOUTS.content;
    }
    
    // Clean/Simple layouts: standard content
    if (layoutStyle === 'clean' || layoutStyle === 'simple') {
      return LAYOUTS.content;
    }
    
    // Default behavior
    if (contentLength > 600) return LAYOUTS['two-column'];
    if (contentLength < 300) return LAYOUTS['key-points'];
    
    return LAYOUTS.content;
  }

  // ============================================================================
  // Content Generation
  // ============================================================================
  
  async function generateFromTopic(topic, slideCount, theme) {
    if (!topic || !topic.trim()) {
      showError('Please enter a topic for your presentation.');
      return null;
    }

    // Loading UI is already shown by handleTopicSubmit
    // Just update loading steps here

    try {
      // Step 1: Research
      updateLoadingStep('research');
      const research = await performWebResearch(topic);
      
      // Step 2: Auto-detect theme if not selected
      const themeConfig = getThemeConfig(theme, topic);
      const effectiveTheme = theme || detectTopicTheme(topic);
      
      // Step 3: Generate content
      updateLoadingStep('generate');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const slides = generateSlidesFromResearch(topic, research, parseInt(slideCount), effectiveTheme, themeConfig);
      
      // Step 4: Apply design
      updateLoadingStep('design');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return slides;
    } catch (error) {
      console.error('Error generating from topic:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  function generateSlidesFromResearch(topic, research, slideCount, theme, themeConfig) {
    const slides = [];
    // Use provided themeConfig (already includes auto-detection logic)
    const designConfig = themeConfig || THEMES[theme] || THEMES.aramco;
    
    // Title slide (short title, longer subtitle) - topic-aware design
    const titleAlign = designConfig.titleAlign || 'center';
    const bodyAlign = designConfig.bodyAlign || 'left';
    const fontWeight = designConfig.fontWeight || 'bold';
    
    slides.push({
      title: topic,
      body: `A comprehensive research-based presentation exploring ${topic} through detailed analysis, real-world applications, industry examples, and future trends. This presentation provides in-depth insights based on extensive research and industry best practices.`,
      layout: LAYOUTS.title,
      design: {
        colors: {
          primary: designConfig.primary,
          secondary: designConfig.secondary,
          accent: designConfig.accent,
          background: designConfig.background,
          text: designConfig.text,
          textLight: designConfig.textLight,
        },
        fonts: {
          family: designConfig.fontFamily,
          titleSize: 56,
          bodySize: 22,
          titleAlign: titleAlign,
          bodyAlign: bodyAlign,
          fontWeight: fontWeight,
        },
        layoutStyle: designConfig.layoutStyle,
      },
      notes: `Introduction to ${topic}. Comprehensive overview covering definitions, background, importance, applications, challenges, and future trends.`,
    });
    
    // Introduction slide with definition (120-180 words) - topic-aware layout
    const introLayout = selectLayout(1, slideCount, research.definition, 'content', designConfig);
    
    slides.push({
      title: 'Introduction and Definition',
      body: research.definition,
      layout: introLayout,
      design: {
        colors: {
          primary: designConfig.primary,
          secondary: designConfig.secondary,
          accent: designConfig.accent,
          background: designConfig.background,
          text: designConfig.text,
          textLight: designConfig.textLight,
        },
        fonts: {
          family: designConfig.fontFamily,
          titleSize: 42,
          bodySize: 20,
          titleAlign: titleAlign,
          bodyAlign: bodyAlign,
          fontWeight: fontWeight,
        },
        layoutStyle: designConfig.layoutStyle,
      },
      notes: 'Provide comprehensive definition and overview of the topic',
    });
    
    // Background slide (120-180 words)
    const backgroundLayout = selectLayout(2, slideCount, research.background, 'content', designConfig);
    
    slides.push({
      title: 'Background and Historical Context',
      body: research.background,
      layout: backgroundLayout,
      design: {
        colors: {
          primary: designConfig.primary,
          secondary: designConfig.secondary,
          accent: designConfig.accent,
          background: designConfig.background,
          text: designConfig.text,
          textLight: designConfig.textLight,
        },
        fonts: {
          family: designConfig.fontFamily,
          titleSize: 42,
          bodySize: 20,
          titleAlign: titleAlign,
          bodyAlign: bodyAlign,
          fontWeight: fontWeight,
        },
        layoutStyle: designConfig.layoutStyle,
      },
      notes: 'Explain the historical development and evolution of the topic',
    });
    
    // Why it matters slide (120-180 words)
    const importanceLayout = selectLayout(3, slideCount, research.importance, 'content', designConfig);
    
    slides.push({
      title: 'Why It Matters',
      body: research.importance,
      layout: importanceLayout,
      design: {
        colors: {
          primary: designConfig.primary,
          secondary: designConfig.secondary,
          accent: designConfig.accent,
          background: designConfig.background,
          text: designConfig.text,
          textLight: designConfig.textLight,
        },
        fonts: {
          family: designConfig.fontFamily,
          titleSize: 42,
          bodySize: 20,
          titleAlign: titleAlign,
          bodyAlign: bodyAlign,
          fontWeight: fontWeight,
        },
        layoutStyle: designConfig.layoutStyle,
      },
      notes: 'Explain the strategic importance and value proposition',
    });
    
    // Distribute applications across slides based on slide count
    const remainingSlides = slideCount - 4; // Excluding title, intro, background, importance
    const applications = research.applications || [];
    const applicationSlides = Math.min(applications.length, Math.max(2, Math.floor(remainingSlides * 0.4)));
    const challengesSlide = remainingSlides > applicationSlides + 1;
    const trendsSlide = remainingSlides > applicationSlides + (challengesSlide ? 1 : 0) + 1;
    const bestPracticesSlide = remainingSlides > applicationSlides + (challengesSlide ? 1 : 0) + (trendsSlide ? 1 : 0) + 1;
    const caseStudiesSlide = remainingSlides > applicationSlides + (challengesSlide ? 1 : 0) + (trendsSlide ? 1 : 0) + (bestPracticesSlide ? 1 : 0) + 1;
    
    let slideIndex = 4;
    
    // Application slides (detailed paragraphs)
    const appsPerSlide = Math.ceil(applications.length / applicationSlides);
    for (let i = 0; i < applicationSlides && slideIndex < slideCount - 1; i++) {
      const startIdx = i * appsPerSlide;
      const endIdx = Math.min(startIdx + appsPerSlide, applications.length);
      const slideApps = applications.slice(startIdx, endIdx);
      
      let bodyText = '';
      slideApps.forEach((app, idx) => {
        bodyText += app.description;
        if (app.examples && app.examples.length > 0) {
          bodyText += ` Notable examples include ${app.examples.join(', ')}.`;
        }
        if (idx < slideApps.length - 1) {
          bodyText += ' ';
        }
      });
      
      const title = applicationSlides > 1 
        ? `Industry Applications: ${slideApps.map(a => a.industry).join(' & ')}`
        : 'Industry Applications';
      
      const appLayout = selectLayout(slideIndex, slideCount, bodyText, 'content', designConfig);
      
      slides.push({
        title: title,
        body: bodyText,
        layout: appLayout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: `Detailed applications in ${slideApps.map(a => a.industry).join(', ')}`,
      });
      
      slideIndex++;
    }
    
    // Challenges slide
    if (challengesSlide && slideIndex < slideCount - 1) {
      const challengesLayout = selectLayout(slideIndex, slideCount, research.challenges, 'content', designConfig);
      
      slides.push({
        title: 'Challenges and Considerations',
        body: research.challenges,
        layout: challengesLayout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: 'Discuss implementation challenges and how to address them',
      });
      slideIndex++;
    }
    
    // Future trends slide
    if (trendsSlide && slideIndex < slideCount - 1) {
      const trendsLayout = selectLayout(slideIndex, slideCount, research.trends, 'content', designConfig);
      
      slides.push({
        title: 'Future Trends and Developments',
        body: research.trends,
        layout: trendsLayout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: 'Explore emerging trends and future directions',
      });
      slideIndex++;
    }
    
    // Best practices slide
    if (bestPracticesSlide && slideIndex < slideCount - 1) {
      const bestPracticesLayout = selectLayout(slideIndex, slideCount, research.bestPractices, 'content', designConfig);
      
      slides.push({
        title: 'Best Practices and Implementation',
        body: research.bestPractices,
        layout: bestPracticesLayout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: 'Share proven best practices for successful implementation',
      });
      slideIndex++;
    }
    
    // Case studies slide
    if (caseStudiesSlide && slideIndex < slideCount - 1 && research.caseStudies) {
      const caseBody = research.caseStudies.map(cs => cs.result).join(' ');
      const caseLayout = selectLayout(slideIndex, slideCount, caseBody, 'content', designConfig);
      
      slides.push({
        title: 'Real-World Case Studies',
        body: caseBody,
        layout: caseLayout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: 'Present real-world examples and success stories',
      });
      slideIndex++;
    }
    
    // Fill remaining slides with expanded content if needed
    while (slideIndex < slideCount - 1) {
      const expandedContent = `This section provides additional depth on ${topic}, exploring nuanced aspects and advanced considerations. Organizations implementing ${topic} must carefully evaluate their specific context, requirements, and constraints. Success requires a holistic approach that considers technical, organizational, and strategic dimensions. Continuous learning and adaptation are essential as the field continues to evolve rapidly.`;
      const expandedLayout = selectLayout(slideIndex, slideCount, expandedContent, 'content', designConfig);
      
      slides.push({
        title: `Advanced Considerations: Part ${slideIndex - 3}`,
        body: expandedContent,
        layout: expandedLayout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: 'Additional detailed content and considerations',
      });
      slideIndex++;
    }
    
    // Summary slide (comprehensive paragraph)
    const summaryBody = `In conclusion, ${topic} represents a transformative approach that offers significant value to organizations across industries. Through comprehensive research and analysis, we have explored its fundamental concepts, historical development, strategic importance, and diverse applications. The implementation of ${topic} presents both opportunities and challenges, requiring careful planning, execution, and continuous optimization. As we look toward the future, emerging trends promise to further enhance its capabilities and expand its applications. Organizations that successfully adopt ${topic} stand to gain substantial competitive advantages, improved operational efficiency, and enhanced capabilities for innovation and growth. The key to success lies in understanding the fundamentals, learning from best practices, and adapting approaches to specific organizational contexts and requirements.`;
    const summaryLayout = selectLayout(slideCount - 1, slideCount, summaryBody, 'summary', designConfig);
    
    slides.push({
      title: 'Summary and Key Takeaways',
      body: summaryBody,
      layout: summaryLayout,
      design: {
        colors: {
          primary: designConfig.primary,
          secondary: designConfig.secondary,
          accent: designConfig.accent,
          background: designConfig.background,
          text: designConfig.text,
          textLight: designConfig.textLight,
        },
        fonts: {
          family: designConfig.fontFamily,
          titleSize: 42,
          bodySize: 20,
          titleAlign: titleAlign,
          bodyAlign: bodyAlign,
          fontWeight: fontWeight,
        },
        layoutStyle: designConfig.layoutStyle,
      },
      notes: 'Comprehensive summary of key points, insights, and recommendations',
    });
    
    return slides;
  }

  async function generateFromText(text, slideCount, theme) {
    if (!text || !text.trim()) {
      showError('Please paste your slide content.');
      return null;
    }

    // Loading UI is already shown by handleTextSubmit
    // Just update loading steps here

    try {
      // Extract topic from text for theme detection
      const topicMatch = text.match(/^[^\n]{5,80}/);
      const extractedTopic = topicMatch ? topicMatch[0] : text.substring(0, 50);
      
      // Auto-detect theme if not selected
      const themeConfig = getThemeConfig(theme, extractedTopic);
      const effectiveTheme = theme || detectTopicTheme(extractedTopic);
      
      updateLoadingStep('research');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateLoadingStep('generate');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const slides = parseTextToSlides(text, parseInt(slideCount), effectiveTheme, themeConfig);
      
      updateLoadingStep('design');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return slides;
    } catch (error) {
      console.error('Error generating from text:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  function parseTextToSlides(text, slideCount, theme, themeConfig) {
    // Use provided themeConfig (already includes auto-detection logic)
    const designConfig = themeConfig || THEMES[theme] || THEMES.aramco;
    const titleAlign = designConfig.titleAlign || 'left';
    const bodyAlign = designConfig.bodyAlign || 'left';
    const fontWeight = designConfig.fontWeight || '600';
    const sections = parseTextIntoSections(text);
    const slides = [];
    
    // Convert sections to paragraph-based content
    sections.forEach((section, idx) => {
      let bodyText = '';
      
      if (Array.isArray(section.points) && section.points.length > 0) {
        // Convert bullet points to flowing paragraphs
        bodyText = section.points.map((point, pIdx) => {
          // Expand short points into full sentences
          if (point.length < 50) {
            return `${point}. This aspect is crucial because it directly impacts the overall effectiveness and success of the implementation.`;
          }
          return point;
        }).join(' ');
        
        // Ensure minimum word count (120-180 words)
        const wordCount = bodyText.split(/\s+/).length;
        if (wordCount < 120) {
          const additionalContent = `Furthermore, this topic encompasses multiple dimensions that require careful consideration and strategic planning. Organizations must evaluate various factors including technical requirements, resource availability, and organizational readiness. The successful implementation depends on understanding these interconnected elements and developing a comprehensive approach that addresses each aspect systematically.`;
          bodyText += ' ' + additionalContent;
        }
      } else if (section.content) {
        bodyText = section.content;
        // Expand if too short
        const wordCount = bodyText.split(/\s+/).length;
        if (wordCount < 120) {
          bodyText += ` This topic requires comprehensive understanding and careful analysis. The implications extend beyond immediate applications, influencing long-term strategic decisions and organizational capabilities. Successful implementation demands thorough planning, adequate resources, and commitment to continuous improvement and adaptation.`;
        }
      } else {
        // Generate default content
        bodyText = `This section provides detailed insights into ${section.title || 'the topic'}. The subject matter encompasses multiple important aspects that organizations must understand and address. Key considerations include strategic alignment, technical requirements, resource planning, and change management. Successful implementation requires a holistic approach that integrates various elements and ensures alignment with organizational objectives and capabilities.`;
      }
      
      const layout = selectLayout(slides.length, slideCount, bodyText, section.type, designConfig);
      
      slides.push({
        title: section.title || `Slide ${slides.length + 1}`,
        body: bodyText,
        layout: layout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: idx === 0 ? 56 : 38,
            bodySize: 20,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: `Detailed content for ${section.title || 'slide'}`,
      });
    });
    
    // Expand or compress to match slide count
    if (slides.length < slideCount) {
      // Expand: split longer slides or add new content
      const expansionFactor = slideCount / slides.length;
      const expandedSlides = [];
      
      slides.forEach((slide, idx) => {
        if (expansionFactor > 1.5 && slide.body.split(/\s+/).length > 200) {
          // Split long slides
          const sentences = slide.body.match(/[^.!?]+[.!?]+/g) || [slide.body];
          const sentencesPerSlide = Math.ceil(sentences.length / expansionFactor);
          
          for (let i = 0; i < sentences.length; i += sentencesPerSlide) {
            const slideSentences = sentences.slice(i, i + sentencesPerSlide);
            expandedSlides.push({
              ...slide,
              title: sentences.length > sentencesPerSlide ? `${slide.title} (Part ${Math.floor(i / sentencesPerSlide) + 1})` : slide.title,
              body: slideSentences.join(' '),
            });
          }
        } else {
          expandedSlides.push(slide);
        }
      });
      
      // Fill remaining slots with expanded content
      while (expandedSlides.length < slideCount) {
        const lastSlide = expandedSlides[expandedSlides.length - 1];
        expandedSlides.push({
          ...lastSlide,
          title: `Additional Insights: Part ${expandedSlides.length - slides.length + 1}`,
          body: `This section provides further depth and analysis on the topic. Additional considerations include strategic implications, implementation challenges, and best practices. Organizations must carefully evaluate their specific context and requirements when applying these concepts. The successful integration requires comprehensive planning, adequate resources, and commitment to continuous improvement and adaptation.`,
        });
      }
      
      return expandedSlides.slice(0, slideCount);
    } else if (slides.length > slideCount) {
      // Compress: combine slides while maintaining depth
      const compressionFactor = slides.length / slideCount;
      const compressedSlides = [];
      
      for (let i = 0; i < slides.length; i += compressionFactor) {
        const slideGroup = slides.slice(i, Math.min(i + Math.ceil(compressionFactor), slides.length));
        const combinedBody = slideGroup.map(s => s.body).join(' ');
        
        compressedSlides.push({
          title: slideGroup[0].title,
          body: combinedBody,
          layout: slideGroup[0].layout,
          design: slideGroup[0].design,
          notes: slideGroup.map(s => s.notes).join('; '),
        });
      }
      
      return compressedSlides.slice(0, slideCount);
    }
    
    return slides.slice(0, slideCount);
  }

  function parseTextIntoSections(text) {
    const sections = [];
    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.length < 80 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmed.replace(/[:：]$/, ''),
          points: [],
          type: sections.length === 0 ? 'title' : 'content',
        };
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+[\.\)]/)) {
        if (!currentSection) currentSection = { title: 'Content', points: [] };
        const point = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
        currentSection.points.push(point);
      } else if (trimmed) {
        if (!currentSection) currentSection = { title: 'Content', content: '' };
        if (currentSection.points) {
          currentSection.points.push(trimmed);
        } else {
          currentSection.content = (currentSection.content || '') + ' ' + trimmed;
        }
      }
    });
    
    if (currentSection) sections.push(currentSection);
    
    if (sections.length === 0) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      paragraphs.forEach((para, idx) => {
        const sentences = para.split(/[.!?]+/).filter(s => s.trim());
        sections.push({
          title: `Slide ${idx + 1}`,
          points: sentences.slice(0, 5).map(s => s.trim()),
        });
      });
    }
    
    return sections;
  }

  async function improveCurrentSlides(theme) {
    // Get current slides from app state
    if (typeof window.getCurrentPresentationState !== 'function') {
      showError('Unable to access current slides. Please ensure you are on the editor page.');
      return null;
    }

    const currentState = window.getCurrentPresentationState();
    if (!currentState || !currentState.slides || currentState.slides.length === 0) {
      showError('No slides found to improve. Please create some slides first.');
      return null;
    }

    // Loading UI is already shown by handleImproveSubmit
    // Just update loading steps here

    try {
      updateLoadingStep('research');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateLoadingStep('generate');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const improvedSlides = improveSlidesContent(currentState.slides, theme || 'aramco');
      
      updateLoadingStep('design');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return improvedSlides;
    } catch (error) {
      console.error('Error improving slides:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  function improveSlidesContent(slides, theme) {
    // Extract topic from first slide for theme detection
    const firstSlide = slides[0];
    const firstTitle = firstSlide?.elements?.find(el => el.type === 'text' && (el.fontSize >= 36 || el.fontWeight === 'bold'))?.text || '';
    
    // Auto-detect theme if not selected
    const themeConfig = getThemeConfig(theme, firstTitle);
    const designConfig = themeConfig || THEMES[theme] || THEMES.aramco;
    const titleAlign = designConfig.titleAlign || 'left';
    const bodyAlign = designConfig.bodyAlign || 'left';
    const fontWeight = designConfig.fontWeight || '600';
    
    const improved = [];
    
    slides.forEach((slide, idx) => {
      const elements = slide.elements || [];
      const textElements = elements.filter(el => el.type === 'text');
      
      let title = '';
      let body = '';
      
      textElements.forEach(el => {
        const text = el.text || el.content || '';
        const fontSize = el.fontSize || 18;
        
        if (fontSize >= 36 || el.fontWeight === 'bold') {
          title = text;
        } else {
          body += (body ? '\n' : '') + text;
        }
      });
      
      const layout = selectLayout(idx, slides.length, body, idx === 0 ? 'title' : 'content', designConfig);
      
      improved.push({
        title: title || `Slide ${idx + 1}`,
        body: body || 'Enhanced content',
        layout: layout,
        design: {
          colors: {
            primary: designConfig.primary,
            secondary: designConfig.secondary,
            accent: designConfig.accent,
            background: designConfig.background,
            text: designConfig.text,
            textLight: designConfig.textLight,
          },
          fonts: {
            family: designConfig.fontFamily,
            titleSize: idx === 0 ? 56 : 38,
            bodySize: 22,
            titleAlign: titleAlign,
            bodyAlign: bodyAlign,
            fontWeight: fontWeight,
          },
          layoutStyle: designConfig.layoutStyle,
        },
        notes: `Improved slide ${idx + 1} with better structure and formatting`,
      });
    });
    
    return improved;
  }

  // ============================================================================
  // Slide Creation
  // ============================================================================
  
  function createSlidesInEditor(slidesData) {
    if (!slidesData || slidesData.length === 0) {
      showError('No slides were generated.');
      return false;
    }

    try {
      if (typeof window.createAIPresentation === 'function') {
        window.createAIPresentation(slidesData);
        return true;
      } else {
        showError('Unable to create slides. Please ensure you are on the editor page.');
        return false;
      }
    } catch (error) {
      console.error('Error creating slides:', error);
      showError('Failed to create slides in editor.');
      return false;
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  /**
   * Get active element value - finds the currently visible/active element
   */
  function getActiveElementValue(id) {
    const allMatches = document.querySelectorAll(`#${id}`);
    if (allMatches.length === 0) return null;
    
    // If only one, return it
    if (allMatches.length === 1) return allMatches[0];
    
    // Multiple matches - find the active one
    const panel = elements.panel;
    
    // Prefer element inside active workflow content
    const activeContent = document.querySelector(`#${CONFIG.topicContentId}.active, #${CONFIG.textContentId}.active, #${CONFIG.improveContentId}.active`);
    if (activeContent) {
      const inActiveContent = Array.from(allMatches).find(el => activeContent.contains(el));
      if (inActiveContent) return inActiveContent;
    }
    
    // Prefer element inside panel
    if (panel) {
      const inPanel = Array.from(allMatches).find(el => panel.contains(el));
      if (inPanel) return inPanel;
    }
    
    // Prefer visible element
    const visible = Array.from(allMatches).find(el => el.offsetParent !== null);
    if (visible) return visible;
    
    // Fallback to first
    return allMatches[0];
  }

  async function handleTopicSubmit() {
    if (state.isGenerating) return;
    
    // Refresh element references to ensure we have the latest
    const topicInput = getActiveElementValue(CONFIG.topicInputId) || elements.topicInput;
    const slideCount = getActiveElementValue(CONFIG.slideCountId) || elements.slideCount;
    const themeSelector = getActiveElementValue(CONFIG.themeSelectorId) || elements.themeSelector;
    
    const topic = topicInput?.value || '';
    const slideCountValue = slideCount?.value || '8';
    const theme = themeSelector?.value || 'aramco';
    
    if (!topic.trim()) {
      showError('Please enter a topic.');
      return;
    }
    
    try {
      // Immediately show loading UI and update button state
      showLoading();
      setButtonLoading(CONFIG.topicSubmitId, true);
      hideError();
      
      const slides = await generateFromTopic(topic, slideCountValue, theme);
      
      if (slides) {
        const success = createSlidesInEditor(slides);
        if (success) {
          closePanel();
        }
      }
    } catch (error) {
      console.error('Error in handleTopicSubmit:', error);
      showError('Failed to generate presentation. Please try again.');
    } finally {
      // Always restore button state and hide loading
      hideLoading();
      setButtonLoading(CONFIG.topicSubmitId, false);
    }
  }

  async function handleTextSubmit() {
    if (state.isGenerating) return;
    
    // Refresh element references to ensure we have the latest
    const textInput = getActiveElementValue(CONFIG.textInputId) || elements.textInput;
    const slideCount = getActiveElementValue(CONFIG.slideCountId) || elements.slideCount;
    const themeSelector = getActiveElementValue(CONFIG.themeSelectorId) || elements.themeSelector;
    
    const text = textInput?.value || '';
    const slideCountValue = slideCount?.value || '8';
    const theme = themeSelector?.value || 'aramco';
    
    if (!text.trim()) {
      showError('Please paste your slide content.');
      return;
    }
    
    try {
      // Immediately show loading UI and update button state
      showLoading();
      setButtonLoading(CONFIG.textSubmitId, true);
      hideError();
      
      const slides = await generateFromText(text, slideCountValue, theme);
      
      if (slides) {
        const success = createSlidesInEditor(slides);
        if (success) {
          closePanel();
        }
      }
    } catch (error) {
      console.error('Error in handleTextSubmit:', error);
      showError('Failed to generate presentation. Please try again.');
    } finally {
      // Always restore button state and hide loading
      hideLoading();
      setButtonLoading(CONFIG.textSubmitId, false);
    }
  }

  async function handleImproveSubmit() {
    if (state.isGenerating) return;
    
    // Refresh element references to ensure we have the latest
    const themeSelector = getActiveElementValue(CONFIG.themeSelectorId) || elements.themeSelector;
    const theme = themeSelector?.value || 'aramco';
    
    try {
      // Immediately show loading UI and update button state
      showLoading();
      setButtonLoading(CONFIG.improveSubmitId, true);
      hideError();
      
      const slides = await improveCurrentSlides(theme);
      
      if (slides) {
        const success = createSlidesInEditor(slides);
        if (success) {
          closePanel();
        }
      }
    } catch (error) {
      console.error('Error in handleImproveSubmit:', error);
      showError('Failed to improve slides. Please try again.');
    } finally {
      // Always restore button state and hide loading
      hideLoading();
      setButtonLoading(CONFIG.improveSubmitId, false);
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================
  
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  }

  /**
   * Attach event listeners to elements
   */
  function attachEventListeners() {
    // Button to open panel - always use event delegation for reliability
    // This ensures it works even if button is added dynamically
    document.addEventListener('click', (e) => {
      const clickedButton = e.target.closest(`#${CONFIG.buttonId}`);
      if (clickedButton) {
        e.preventDefault();
        e.stopPropagation();
        openPanel();
      }
    }, true);
    
    // Also attach directly if button exists (for immediate response)
    if (elements.button) {
      elements.button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openPanel();
      });
      console.log('AI Generator: Button event listener attached directly');
    } else {
      console.warn('AI Generator: Button not found, using event delegation only');
    }
    
    // Close button
    if (elements.closeButton) {
      elements.closeButton.addEventListener('click', closePanel);
    }
    
    // Workflow tab buttons - rebind using querySelector for reliability
    const topicBtn = document.querySelector(`#${CONFIG.workflowTopicId}`);
    const textBtn = document.querySelector(`#${CONFIG.workflowTextId}`);
    const improveBtn = document.querySelector(`#${CONFIG.workflowImproveId}`);
    
    if (topicBtn) {
      topicBtn.addEventListener('click', () => selectWorkflow('topic'));
    }
    
    if (textBtn) {
      textBtn.addEventListener('click', () => selectWorkflow('text'));
    }
    
    if (improveBtn) {
      improveBtn.addEventListener('click', () => selectWorkflow('improve'));
    }
    
    // Submit buttons - use event delegation for robustness
    document.addEventListener('click', (e) => {
      const clickedButton = e.target.closest('button');
      if (!clickedButton) return;
      
      const buttonId = clickedButton.id;
      if (buttonId === CONFIG.topicSubmitId) {
        e.preventDefault();
        e.stopPropagation();
        handleTopicSubmit();
      } else if (buttonId === CONFIG.textSubmitId) {
        e.preventDefault();
        e.stopPropagation();
        handleTextSubmit();
      } else if (buttonId === CONFIG.improveSubmitId) {
        e.preventDefault();
        e.stopPropagation();
        handleImproveSubmit();
      }
    }, true);
    
    // Input keydown handlers - use event delegation
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (!target) return;
      
      if (target.id === CONFIG.topicInputId) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleTopicSubmit();
        }
      } else if (target.id === CONFIG.textInputId) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleTextSubmit();
        }
      }
    }, true);
    
    // Close panel when clicking outside (only for modal version)
    document.addEventListener('click', (e) => {
      const aiSidebarContent = document.querySelector('.ai-sidebar-content');
      const aiSidebarCard = aiSidebarContent ? aiSidebarContent.closest('.right-sidebar-card') : null;
      // Only handle modal closing if sidebar version doesn't exist
      if (!aiSidebarCard && elements.panel && !elements.panel.classList.contains('hidden')) {
        const clickedInsidePanel = elements.panel.contains(e.target);
        const clickedOnButton = elements.button?.contains(e.target);
        
        if (!clickedInsidePanel && !clickedOnButton) {
          closePanel();
        }
      }
    });
    
    // Close panel on Escape key (only for modal version)
    document.addEventListener('keydown', (e) => {
      const aiSidebarContent = document.querySelector('.ai-sidebar-content');
      const aiSidebarCard = aiSidebarContent ? aiSidebarContent.closest('.right-sidebar-card') : null;
      // Only handle Escape closing if sidebar version doesn't exist
      if (!aiSidebarCard && e.key === 'Escape' && !elements.panel?.classList.contains('hidden')) {
        closePanel();
      }
    });
  }

  /**
   * Initialize with retry logic
   */
  function initialize() {
    initializeElements();
    
    // Retry once if critical elements not found
    if (!elements.panel || !elements.button) {
      setTimeout(() => {
        console.log('AI Generator: Retrying element initialization...');
        initializeElements();
        if (elements.panel && elements.button) {
          attachEventListeners();
        } else {
          console.warn('AI Generator: Required DOM elements not found after retry');
        }
      }, 50);
      return;
    }
    
    attachEventListeners();
  }

  // ============================================================================
  // Public API
  // ============================================================================
  
  window.AIGenerator = {
    generateFromTopic,
    generateFromText,
    improveCurrentSlides,
    createSlidesInEditor,
    openPanel,
    closePanel,
    THEMES,
    LAYOUTS,
  };

  init();
})();
