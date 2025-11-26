/**
 * Regenerate a single slide based on user feedback
 * Updated to match server API expectations
 * 
 * @param {string} slideId - Slide ID (optional, for reference)
 * @param {string} originalTitle - Original slide title
 * @param {string} originalBody - Original slide body (bullet points as string or array)
 * @param {string} userFeedback - User's instruction/feedback for modification
 * @param {object} options - Optional parameters
 * @param {string} options.theme - Theme name (default: 'aramco')
 * @param {string} options.language - Language code 'en' or 'ar' (default: 'en')
 * @param {boolean} options.preserveLayoutType - Whether to preserve title-only layout (default: false)
 * @param {string} options.topic - Presentation topic (default: uses originalTitle)
 * @returns {Promise<object>} Response data from server
 */
async function regenerateSlide(slideId, originalTitle, originalBody, userFeedback, options = {}) {
  try {
    // Parse body into bullets array if it's a string
    let bullets = [];
    if (typeof originalBody === 'string') {
      // Split by newlines and clean up
      bullets = originalBody
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-•*]\s*/, '')); // Remove bullet markers
    } else if (Array.isArray(originalBody)) {
      bullets = originalBody;
    }
    
    // Determine if it's a title-only slide
    const isTitleOnly = bullets.length === 0 || options.preserveLayoutType === true;
    
    // Build originalContent object
    const originalContent = {
      title: originalTitle || '',
      bullets: bullets
    };
    
    // Prepare request body matching server expectations
    const requestBody = {
      topic: options.topic || originalTitle || 'Presentation',
      originalContent: originalContent,
      feedback: userFeedback || '',
      theme: options.theme || 'aramco',
      language: options.language || 'en',
      preserveLayoutType: isTitleOnly
    };
    
    const response = await fetch("/api/ai/regenerate-slide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to regenerate slide (HTTP ${response.status})`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (err) {
    console.error("Regenerate API error:", err);
    throw err; // Re-throw so caller can handle it
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = regenerateSlide;
}

// Also make available globally
if (typeof window !== 'undefined') {
  window.regenerateSlide = regenerateSlide;
}


