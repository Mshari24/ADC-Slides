import express from "express"

import cors from "cors"

import dotenv from "dotenv"

dotenv.config()

console.log("ENV LOADED:", process.env.OPENAI_API_KEY ? "YES" : "NO")

import OpenAI from "openai"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Minimal static server with SPA fallback to index.html
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from "url";

// Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 1) API routes FIRST
app.use('/api', (req, res, next) => next());

// 2) Explicit API routes (existing)
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post("/api/ai/test", async (req, res) => {
    try {
        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: "Hello from ADC-Slides!"
        })

        res.json({
            status: "ok",
            message: response.output_text
        })
    } catch (error) {
        res.json({
            status: "error",
            message: error.message
        })
    }
})

// Helper function to normalize text for comparison (remove extra whitespace, lowercase)
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Helper function to calculate similarity between two strings (simple Jaccard similarity)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(normalizeText(str1).split(' '));
  const words2 = new Set(normalizeText(str2).split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

// Helper function to check if two slides are duplicates or near-duplicates
function areSlidesDuplicate(slide1, slide2, similarityThreshold = 0.85) {
  // Compare titles
  const titleSimilarity = calculateSimilarity(slide1.title, slide2.title);
  if (titleSimilarity >= similarityThreshold) {
    return true;
  }
  
  // If titles are similar enough, compare bullet points
  const bullets1 = slide1.bullets || [];
  const bullets2 = slide2.bullets || [];
  
  // If both have no bullets or both have bullets, compare them
  if (bullets1.length === 0 && bullets2.length === 0) {
    // Both are title-only slides - compare titles more strictly
    return titleSimilarity >= 0.9;
  }
  
  if (bullets1.length === 0 || bullets2.length === 0) {
    // One has bullets, one doesn't - not duplicates
    return false;
  }
  
  // Compare bullet content
  const bullets1Text = bullets1.join(' ').toLowerCase();
  const bullets2Text = bullets2.join(' ').toLowerCase();
  const bulletsSimilarity = calculateSimilarity(bullets1Text, bullets2Text);
  
  // If both title and bullets are similar, it's a duplicate
  return titleSimilarity >= 0.7 && bulletsSimilarity >= similarityThreshold;
}

// Deduplication function: removes duplicate or near-duplicate slides
function deduplicateSlides(slides, requestedCount) {
  if (!Array.isArray(slides) || slides.length === 0) {
    return [];
  }
  
  const uniqueSlides = [];
  const seenHashes = new Set();
  
  for (const slide of slides) {
    // Create a hash-like identifier for this slide
    const titleNormalized = normalizeText(slide.title || '');
    const bulletsNormalized = (slide.bullets || []).map(b => normalizeText(b)).join('|');
    const slideHash = `${titleNormalized}::${bulletsNormalized}`;
    
    // Check if we've seen this exact slide before
    if (seenHashes.has(slideHash)) {
      console.log(`Exact duplicate detected, skipping: "${slide.title}"`);
      continue;
    }
    
    // Check for near-duplicates by comparing with existing unique slides
    let isDuplicate = false;
    for (const uniqueSlide of uniqueSlides) {
      if (areSlidesDuplicate(slide, uniqueSlide)) {
        console.log(`Near-duplicate detected, skipping: "${slide.title}" (similar to "${uniqueSlide.title}")`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seenHashes.add(slideHash);
      uniqueSlides.push(slide);
      
      // Stop if we have enough unique slides
      if (uniqueSlides.length >= requestedCount) {
        break;
      }
    }
  }
  
  return uniqueSlides;
}

// AI Generate Slides endpoint
app.post('/api/ai/generate-slides', async (req, res) => {
  console.log('POST /api/ai/generate-slides - Request received');
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  
  try {
    const { topic, slideCount, language } = req.body;

    // Normalize and validate inputs
    const parsedSlideCount = Number(slideCount);
    const lang = (language || "en").toLowerCase();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        error: "Topic is required and must be a non-empty string",
      });
    }

    // DEFENSIVE CHECK: Validate and clamp slide count
    const MAX_SLIDES = 50;
    const MIN_SLIDES = 1;
    
    if (
      !parsedSlideCount ||
      Number.isNaN(parsedSlideCount) ||
      parsedSlideCount < MIN_SLIDES ||
      parsedSlideCount > MAX_SLIDES
    ) {
      // Clamp to valid range and inform user
      const clampedCount = Math.max(MIN_SLIDES, Math.min(MAX_SLIDES, parsedSlideCount || 8));
      console.warn(`[Safety] Invalid slide count ${parsedSlideCount}, clamping to ${clampedCount}`);
      
      if (parsedSlideCount > MAX_SLIDES) {
        return res.status(400).json({
          error: `Slide count must be between ${MIN_SLIDES} and ${MAX_SLIDES}. Requested: ${parsedSlideCount}`,
          clampedCount: clampedCount
        });
      }
      return res.status(400).json({
        error: `Slide count must be between ${MIN_SLIDES} and ${MAX_SLIDES}`,
      });
    }
    
    // Final clamped count (should be same as parsedSlideCount if valid)
    const finalSlideCount = Math.max(MIN_SLIDES, Math.min(MAX_SLIDES, parsedSlideCount));
    if (finalSlideCount !== parsedSlideCount) {
      console.warn(`[Safety] Clamped slide count from ${parsedSlideCount} to ${finalSlideCount}`);
    }

    if (!["ar", "en"].includes(lang)) {
      return res.status(400).json({
        error: 'language must be either "ar" or "en"',
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file' 
      });
    }

    // Build the prompt based on language
    const languageInstruction = lang === 'ar' 
      ? 'Generate content in Arabic. All titles and bullet points must be in Arabic.'
      : 'Generate content in English. All titles and bullet points must be in English.';

    // Calculate logical slide distribution using finalSlideCount (after clamping)
    const introSlides = 1; // Always start with intro
    const conclusionSlides = 1; // Always end with conclusion
    const mainContentSlides = Math.max(1, finalSlideCount - introSlides - conclusionSlides);
    
    const systemPrompt = `You are a professional presentation generator. Generate structured slide content in a clear text format.

${languageInstruction}

CRITICAL CONSTRAINTS (MUST FOLLOW EXACTLY):
1. You MUST produce exactly ${finalSlideCount} slides - no more, no less.
2. Each slide must have a unique title and unique content.
3. Do NOT repeat the same slide content or create duplicates.
4. Do NOT create multiple slides with identical or nearly identical titles/bullets.

SLIDE STRUCTURE REQUIREMENTS:
- Slide 1: Introduction/Title slide (title-only, no bullets)
- Slides 2-${finalSlideCount - 1}: Main content slides (each with 3-5 bullet points)
- Slide ${finalSlideCount}: Summary/Conclusion slide (title-only or with 2-3 summary bullets)

CONTENT SLIDE REQUIREMENTS:
- Each content slide MUST have exactly 3-5 bullet points
- Each bullet point should be a complete, meaningful sentence
- Bullet points should be distinct and non-repetitive
- Content should flow logically from slide to slide

OUTPUT FORMAT (use this exact structure for each slide):
SLIDE 1:
Title: [slide title text]
Bullets: [leave empty for title-only slides]

SLIDE 2:
Title: [slide title text]
Bullets:
- [bullet point 1]
- [bullet point 2]
- [bullet point 3]

[Continue this format for all ${finalSlideCount} slides]

VALIDATION RULES:
- Total slides: exactly ${finalSlideCount}
- First slide: title-only (no bullets)
- Last slide: title-only or summary bullets
- Middle slides: each has 3-5 bullet points
- All titles: unique and non-repetitive
- All content: relevant to the topic "${topic}"
- Language: proper ${lang === 'ar' ? 'Arabic' : 'English'} grammar and formatting`;

    const userPrompt = `Generate a presentation about: "${topic}"

REQUIREMENTS:
- Create exactly ${finalSlideCount} slides total
- Slide 1: Introduction slide (title-only)
- Slides 2-${finalSlideCount - 1}: Main content slides (each with 3-5 bullet points about "${topic}")
- Slide ${finalSlideCount}: Conclusion/Summary slide (title-only or 2-3 summary bullets)
- Ensure logical flow: Introduction → Main Content → Conclusion
- Each slide must be unique - no duplicates or repeated content
- Content should be professional, accurate, and relevant to "${topic}"`;

    // Combine system and user prompts into a single input string for Responses API
    const combinedInput = `${systemPrompt}\n\n${userPrompt}`;

    // Call OpenAI API using Responses API format
    let response;
    try {
      response = await client.responses.create({
        model: "gpt-4o-mini",
        input: combinedInput,
        text: { format: { type: "text" } }
      });
    } catch (apiError) {
      console.error('=== OpenAI API CALL ERROR ===');
      console.error('Error type:', apiError.constructor.name);
      console.error('Error message:', apiError.message);
      console.error('Error stack:', apiError.stack);
      if (apiError.status) {
        console.error('HTTP status:', apiError.status);
      }
      if (apiError.response) {
        console.error('API response:', apiError.response);
      }
      console.error('============================');
      throw apiError;
    }

    // DEFENSIVE CHECK: Handle malformed AI response
    if (!response.output_text) {
      console.error('[Safety] No response content from OpenAI');
      throw new Error('No response content from OpenAI');
    }

    // Parse text response into slide objects
    function parseTextResponse(text) {
      const slides = [];
      const slideBlocks = text.split(/SLIDE \d+:/i);
      
      for (let i = 1; i < slideBlocks.length; i++) {
        const block = slideBlocks[i].trim();
        if (!block) continue;
        
        const titleMatch = block.match(/Title:\s*(.+?)(?:\n|$)/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        if (!title) continue;
        
        // Extract bullets
        const bullets = [];
        const bulletsMatch = block.match(/Bullets:\s*\n((?:- .+\n?)+)/is);
        if (bulletsMatch) {
          const bulletsText = bulletsMatch[1];
          const bulletLines = bulletsText.match(/- (.+)/g);
          if (bulletLines) {
            bullets.push(...bulletLines.map(b => b.replace(/^- /, '').trim()).filter(b => b.length > 0));
          }
        }
        
        slides.push({
          title: title,
          bullets: bullets
        });
      }
      
      return slides;
    }

    let parsedSlides;
    try {
      parsedSlides = parseTextResponse(response.output_text);
    } catch (parseError) {
      console.error('[Safety] Text parse error:', parseError.message);
      console.error('[Safety] Response preview:', response.output_text.substring(0, 500));
      throw new Error('Failed to parse AI response. The AI may have returned invalid data.');
    }
    
    if (!parsedSlides || !Array.isArray(parsedSlides)) {
      console.error('[Safety] Invalid response: could not extract slides');
      throw new Error('Invalid response structure: could not extract slides');
    }
    
    if (parsedSlides.length === 0) {
      console.error('[Safety] Invalid response: empty slides array');
      throw new Error('Invalid response: AI returned no slides');
    }
    
    // Wrap in expected structure for compatibility
    const parsedResponse = { slides: parsedSlides };

    // MINIMAL LOG: Slide count requested vs produced
    console.log(`[AI Response] Requested: ${finalSlideCount}, Received: ${parsedResponse.slides.length}`);

    // CODE-SIDE SANITY CHECKS (not just prompt instructions)
    // DEFENSIVE CHECK: Limit slides to process (prevent processing too many)
    const maxSlidesToProcess = Math.min(parsedResponse.slides.length, finalSlideCount * 2); // Allow buffer for deduplication
    const slidesToValidate = parsedResponse.slides.slice(0, maxSlidesToProcess);
    
    // Validate each slide with strict requirements
    const validatedSlides = slidesToValidate.map((slide, index) => {
      // DEFENSIVE CHECK: Handle malformed slide data
      if (!slide || typeof slide !== 'object') {
        console.warn(`[Safety] Invalid slide object at index ${index}, skipping`);
        return null;
      }
      
      // Check 1: Title must exist and be non-empty
      if (!slide.title || typeof slide.title !== 'string' || slide.title.trim().length === 0) {
        console.warn(`[Safety] Slide ${index + 1} missing title, using default`);
        slide.title = `Slide ${index + 1}`;
      }
      
      const trimmedTitle = slide.title.trim();
      
      // Check 2: Bullets must be an array
      if (!slide.bullets || !Array.isArray(slide.bullets)) {
        slide.bullets = [];
      }
      
      // Check 3: Clean and validate bullets
      const cleanedBullets = slide.bullets
        .map(b => {
          if (typeof b === 'string') return b.trim();
          if (b === null || b === undefined) return '';
          return String(b).trim();
        })
        .filter(b => b.length > 0);
      
      // Check 4: Content slides must have 3-5 bullet points (enforce in code)
      const isFirstSlide = index === 0;
      const isLastSlide = index === slidesToValidate.length - 1;
      const isContentSlide = !isFirstSlide && !isLastSlide;
      
      if (isContentSlide && cleanedBullets.length > 0) {
        // Content slides should have 3-5 bullets
        if (cleanedBullets.length < 3) {
          console.warn(`Slide ${index + 1} has only ${cleanedBullets.length} bullets, expected 3-5 for content slides`);
          // Don't throw, but log warning
        }
        if (cleanedBullets.length > 5) {
          console.warn(`Slide ${index + 1} has ${cleanedBullets.length} bullets, trimming to 5`);
          cleanedBullets.splice(5);
        }
      }
      
      return {
        title: trimmedTitle,
        bullets: cleanedBullets
      };
    }).filter(slide => slide !== null); // Remove any null slides from malformed data
    
    // Check 5: Ensure first slide is title-only (intro)
    if (validatedSlides[0] && validatedSlides[0].bullets.length > 0) {
      console.warn('First slide should be title-only (intro), but has bullets. Clearing bullets.');
      validatedSlides[0].bullets = [];
    }
    
    // Check 6: Ensure last slide is title-only or has summary bullets (conclusion)
    const lastSlide = validatedSlides[validatedSlides.length - 1];
    if (lastSlide && lastSlide.bullets.length > 3) {
      console.warn('Last slide (conclusion) has too many bullets, trimming to 3 summary points');
      lastSlide.bullets = lastSlide.bullets.slice(0, 3);
    }

    // Apply deduplication to remove duplicates and near-duplicates
    const uniqueSlides = deduplicateSlides(validatedSlides, finalSlideCount);
    console.log(`[Deduplication] Before: ${validatedSlides.length}, After: ${uniqueSlides.length} unique slides`);

    // DEFENSIVE CHECK: Ensure exact count (clamp to finalSlideCount)
    let finalSlides = uniqueSlides;
    
    // If we have fewer slides than requested after deduplication, pad with placeholder slides
    if (finalSlides.length < finalSlideCount) {
      console.log(`[Safety] Only ${finalSlides.length} unique slides, padding to ${finalSlideCount}`);
      while (finalSlides.length < finalSlideCount) {
        finalSlides.push({
          title: lang === 'ar' 
            ? `شريحة ${finalSlides.length + 1}: ${topic}`
            : `Slide ${finalSlides.length + 1}: ${topic}`,
          bullets: lang === 'ar'
            ? ['نقطة رئيسية', 'نقطة إضافية']
            : ['Key point', 'Additional point']
        });
      }
    }
    
    // If we somehow have more slides than requested, trim to exact count
    if (finalSlides.length > finalSlideCount) {
      console.log(`[Safety] ${finalSlides.length} slides, trimming to ${finalSlideCount}`);
      finalSlides = finalSlides.slice(0, finalSlideCount);
    }

    // Final validation: ensure exact count
    if (finalSlides.length !== finalSlideCount) {
      console.error(`[Safety] CRITICAL: Count mismatch: expected ${finalSlideCount}, got ${finalSlides.length}`);
      // Force exact count
      if (finalSlides.length > finalSlideCount) {
        finalSlides = finalSlides.slice(0, finalSlideCount);
      } else {
        while (finalSlides.length < finalSlideCount) {
          finalSlides.push({
            title: lang === 'ar' 
              ? `شريحة ${finalSlides.length + 1}: ${topic}`
              : `Slide ${finalSlides.length + 1}: ${topic}`,
            bullets: lang === 'ar'
              ? ['نقطة رئيسية', 'نقطة إضافية']
              : ['Key point', 'Additional point']
          });
        }
      }
    }

    // MINIMAL LOG: Final slide count
    console.log(`[Final] Returning exactly ${finalSlides.length} slides (requested: ${finalSlideCount})`);

    // Return the response
    res.json({
      success: true,
      slides: finalSlides
    });

  } catch (error) {
    console.error('=== ERROR IN /api/ai/generate-slides ===');
    console.error('Request body:', req.body);
    console.error('Error object:', error);
    console.error('Error stack:', error.stack);
    if (typeof response !== 'undefined') {
      console.error('Completion response:', response);
    }
    console.error('========================================');
    
    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: `OpenAI API error: ${error.message}`
      });
    }

    // Handle other errors
    res.status(500).json({
      error: error.message || 'An error occurred while generating slides'
    });
  }
});

// 3) Serve static files AFTER API
app.use(express.static('.'));

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api/')) {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Single Slide Regeneration endpoint
app.post('/api/ai/regenerate-slide', async (req, res) => {
  console.log('POST /api/ai/regenerate-slide - Request received');
  console.log('Request body:', req.body);
  
  try {
    const { topic, originalContent, feedback, theme, language, preserveLayoutType } = req.body;

    // Validate inputs
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({
        error: "Topic is required and must be a non-empty string",
      });
    }

    if (!originalContent || typeof originalContent !== 'object') {
      return res.status(400).json({
        error: "originalContent is required and must be an object",
      });
    }

    const lang = (language || "en").toLowerCase();
    if (!["ar", "en"].includes(lang)) {
      return res.status(400).json({
        error: 'language must be either "ar" or "en"',
      });
    }
    
    // Determine if original slide was title-only (preserve layout type)
    const isTitleOnly = preserveLayoutType === true || 
                        (originalContent.bullets && originalContent.bullets.length === 0);

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file' 
      });
    }

    // Build prompt for single slide regeneration
    const languageInstruction = lang === 'ar' 
      ? 'Generate content in Arabic. All titles and bullet points must be in Arabic.'
      : 'Generate content in English. All titles and bullet points must be in English.';

    const originalBullets = originalContent.bullets || [];
    const originalBulletsText = originalBullets.length > 0 
      ? originalBullets.join('\n- ')
      : '(Title-only slide)';

    const systemPrompt = `You are a professional presentation slide generator. Generate a SINGLE slide based on user feedback.

${languageInstruction}

IMPORTANT:
- Generate exactly ONE slide (not multiple slides)
- Return slide content in the following text format:
Title: [slide title]
Bullets:
- [bullet point 1]
- [bullet point 2]
- [bullet point 3]

If the slide should be title-only, leave Bullets section empty.

SLIDE REQUIREMENTS:
- Title: Clear, concise, relevant to the topic
- Bullets: ${isTitleOnly ? 'MUST leave empty (this is a title-only slide).' : 'Provide 3-5 bullet points for content slide.'}
- Content should incorporate user feedback while maintaining relevance to the original topic
- ${isTitleOnly ? 'IMPORTANT: This slide must remain title-only. Leave Bullets section empty.' : ''}
- Use proper ${lang === 'ar' ? 'Arabic' : 'English'} grammar and formatting`;

    const userPrompt = feedback && feedback.trim()
      ? `Original slide topic: "${topic}"

Original content:
Title: ${originalContent.title || '(No title)'}
Bullets:
${originalBulletsText}
${isTitleOnly ? '\nNOTE: This is a title-only slide. You MUST leave Bullets empty.' : ''}

User feedback: "${feedback}"

Please regenerate this slide incorporating the user's feedback. ${feedback.toLowerCase().includes('simpler') || feedback.toLowerCase().includes('simple') ? 'Make it simpler and more concise.' : ''} ${feedback.toLowerCase().includes('example') ? 'Add a concrete example.' : ''} ${feedback.toLowerCase().includes('long') || feedback.toLowerCase().includes('shorter') ? 'Make it shorter and more concise.' : ''}

${isTitleOnly ? 'CRITICAL: This slide must remain title-only. Leave Bullets section empty.' : 'Return the regenerated slide in text format with Title and Bullets (3-5 bullets).'}`
      : `Regenerate this slide about "${topic}".

Original content:
Title: ${originalContent.title || '(No title)'}
Bullets:
${originalBulletsText}
${isTitleOnly ? '\nNOTE: This is a title-only slide. You MUST leave Bullets empty.' : ''}

${isTitleOnly ? 'CRITICAL: This slide must remain title-only. Leave Bullets section empty.' : 'Return the regenerated slide in text format with Title and Bullets (3-5 bullets).'}`;

    const combinedInput = `${systemPrompt}\n\n${userPrompt}`;

    // Call OpenAI API
    let response;
    try {
      response = await client.responses.create({
        model: "gpt-4o-mini",
        input: combinedInput,
        text: { format: { type: "text" } }
      });
    } catch (apiError) {
      console.error('[Safety] OpenAI API error:', apiError.message);
      throw apiError;
    }

    // DEFENSIVE CHECK: Handle malformed response
    if (!response.output_text) {
      throw new Error('No response content from OpenAI');
    }

    // Parse text response
    function parseSingleSlideText(text) {
      const titleMatch = text.match(/Title:\s*(.+?)(?:\n|$)/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      if (!title) {
        throw new Error('Invalid response: missing title');
      }
      
      // Extract bullets
      const bullets = [];
      const bulletsMatch = text.match(/Bullets:\s*\n((?:- .+\n?)+)/is);
      if (bulletsMatch) {
        const bulletsText = bulletsMatch[1];
        const bulletLines = bulletsText.match(/- (.+)/g);
        if (bulletLines) {
          bullets.push(...bulletLines.map(b => b.replace(/^- /, '').trim()).filter(b => b.length > 0));
        }
      }
      
      return { title, bullets };
    }

    let parsedResponse;
    try {
      parsedResponse = parseSingleSlideText(response.output_text);
    } catch (parseError) {
      console.error('[Safety] Text parse error:', parseError.message);
      console.error('[Safety] Response preview:', response.output_text.substring(0, 300));
      throw new Error('Failed to parse AI response');
    }

    // Validate response structure
    if (!parsedResponse.title || typeof parsedResponse.title !== 'string') {
      throw new Error('Invalid response: missing or invalid title');
    }

    if (!parsedResponse.bullets || !Array.isArray(parsedResponse.bullets)) {
      parsedResponse.bullets = [];
    }

    // Clean and validate bullets
    let cleanedBullets = parsedResponse.bullets
      .map(b => typeof b === 'string' ? b.trim() : String(b).trim())
      .filter(b => b.length > 0);

    // Preserve layout type: if original was title-only, force empty bullets
    if (isTitleOnly) {
      if (cleanedBullets.length > 0) {
        console.warn(`[Safety] Original slide was title-only, but AI returned ${cleanedBullets.length} bullets. Forcing empty bullets to preserve layout.`);
        cleanedBullets = [];
      }
    } else {
      // Ensure content slides have 3-5 bullets
      if (cleanedBullets.length > 0 && cleanedBullets.length < 3) {
        console.warn(`[Safety] Slide has only ${cleanedBullets.length} bullets, expected 3-5`);
      }
      if (cleanedBullets.length > 5) {
        cleanedBullets.splice(5);
        console.warn('[Safety] Trimmed bullets to 5');
      }
    }

    const regeneratedSlide = {
      title: parsedResponse.title.trim(),
      bullets: cleanedBullets
    };

    console.log(`[Single Slide] Regenerated slide: "${regeneratedSlide.title}" with ${cleanedBullets.length} bullets`);

    res.json({
      success: true,
      slide: regeneratedSlide
    });

  } catch (error) {
    console.error('=== ERROR IN /api/ai/regenerate-slide ===');
    console.error('Request body:', req.body);
    console.error('Error:', error.message);
    console.error('========================================');
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: `OpenAI API error: ${error.message}`
      });
    }

    res.status(500).json({
      error: error.message || 'An error occurred while regenerating slide'
    });
  }
});

// AI Assistant Chat endpoint
app.post('/api/ai/assistant-chat', async (req, res) => {
  console.log('POST /api/ai/assistant-chat - Request received');
  
  try {
    const { message, deckInfo, currentSlideInfo, slideNumber } = req.body;

    // Validate inputs
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string",
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file' 
      });
    }

    // Build context-aware prompt
    let contextPrompt = `You are a helpful AI assistant for a slide presentation editor. Your role is to GUIDE users on how to use the AI slide generation features effectively.

CRITICAL SCOPE AND SAFETY CONSTRAINTS:
- YOUR ROLE: Provide GUIDANCE and SUGGESTIONS only
- DO NOT: Execute code, modify slides, or perform actions directly
- DO NOT: Generate code snippets, scripts, or technical implementation details
- DO NOT: Attempt to access or modify the application's internal state
- STAY FOCUSED ON: Presentations, prompt writing, and slide editing guidance
- ALWAYS: Tell users WHAT TO DO, never do it for them

IMPORTANT GUIDELINES:
- Respond CONCISELY (2-4 short paragraphs max)
- Provide ACTIONABLE suggestions (e.g., copy-paste ready prompts, specific feedback phrases)
- Do NOT change slides directly - tell users what to do instead
- Focus on practical help, not long explanations
- Use bullet points for lists
- Be friendly but professional
- If asked about topics outside presentations/slides, politely redirect to your scope

AVAILABLE FEATURES (GUIDANCE ONLY):
1. AI Slide Generator - Users can generate full presentations from a topic
   - Users click "AI Generate" button, enter topic, choose slide count (5-10 recommended), select theme, then generate
   - Good prompts follow format: "[Topic]: [Key points] - [Audience/Tone]"
   - Example: "Cybersecurity awareness: threats, best practices, incident response - for employees"
   - YOUR ROLE: Suggest prompts, don't generate slides yourself

2. Proof/Review - Users can regenerate individual slides with feedback
   - Located in right sidebar above this chat
   - Users add feedback notes, then click "Regenerate This Slide"
   - Feedback examples: "Make it shorter", "Add example", "More formal"
   - Only regenerates the current slide, others stay unchanged
   - YOUR ROLE: Suggest feedback phrases, don't modify slides yourself

3. Themes - AD Theme 1 (Blue Aramco), AD Theme 2 (Aramco), AD Dark Theme, Blank Theme
   - YOUR ROLE: Explain theme options, don't change themes yourself

EXAMPLE USE CASES TO HANDLE:

CASE 1: User wants a presentation (e.g., "I want a short professional presentation about X")
→ Provide a complete, copy-paste ready prompt including:
   - Topic with key points
   - Suggested slide count (e.g., "5-7 slides")
   - Audience/tone (e.g., "for employees", "professional")
   Example format: "Cybersecurity awareness: common threats, password security, phishing prevention, incident reporting - 6 slides - professional presentation for employees"
   → DO NOT: Generate the actual slides or try to create them

CASE 2: User asks how to fix a slide (e.g., "This slide is too long. How can I tell the AI to fix it?")
→ Provide a SPECIFIC sample revision note they can copy-paste into Proof/Review
   Format: "Make this slide shorter with 3 bullets and keep only the main ideas."
   Or: "Reduce to 3-4 key points and remove unnecessary details."
   Always provide the exact text they should use.
   → DO NOT: Try to modify the slide yourself or execute any code

CASE 3: User asks about Proof/Review feature (e.g., "What does the proof slide box do?")
→ Explain:
   - It's the "Proof/Review Slide" section in the right sidebar
   - Users can add feedback notes about the current slide
   - Clicking "Regenerate This Slide" updates only that slide based on feedback
   - Other slides remain unchanged
   - Useful for iterative improvements
   → DO NOT: Try to access or modify the Proof/Review feature directly

OUT OF SCOPE TOPICS:
- If asked about non-presentation topics (e.g., general coding, other software), politely redirect:
  "I'm focused on helping with slide presentations. I can help you with prompt writing, slide improvement, or using the AI generator features."
- If asked to execute code or modify slides directly, explain:
  "I can guide you on what to do, but you'll need to use the interface yourself. Here's how..."

USER'S QUESTION: "${message.trim()}"`;

    // Add deck context if available
    if (deckInfo && deckInfo.title) {
      contextPrompt += `\n\nCURRENT DECK CONTEXT:
- Title: "${deckInfo.title}"
- Total slides: ${deckInfo.slideCount || 'unknown'}`;
    }

    // Add current slide context if available
    if (currentSlideInfo && currentSlideInfo.title) {
      const slideRef = slideNumber ? `Slide ${slideNumber}` : 'Current slide';
      contextPrompt += `\n\n${slideRef.toUpperCase()} CONTEXT:
- Title: "${currentSlideInfo.title}"`;
      
      if (currentSlideInfo.bullets && currentSlideInfo.bullets.length > 0) {
        contextPrompt += `\n- Bullet points: ${currentSlideInfo.bullets.length}`;
        contextPrompt += `\n- Content preview: ${currentSlideInfo.bullets.slice(0, 3).join('; ')}`;
      } else {
        contextPrompt += `\n- Type: Title-only slide`;
      }
      
      contextPrompt += `\n\nWhen responding about this slide, provide specific, actionable feedback suggestions they can copy-paste into the Proof/Review section.`;
    }

    // Add instructions based on message content
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('prompt') || lowerMessage.includes('what should i type')) {
      contextPrompt += `\n\nUSER NEEDS PROMPT EXAMPLES: Provide 2-3 copy-paste ready prompt examples using the format: "[Topic]: [Key points] - [Audience/Tone]"`;
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('fix') || lowerMessage.includes('better')) {
      contextPrompt += `\n\nUSER NEEDS FEEDBACK SUGGESTIONS: Provide specific feedback phrases they can use in Proof/Review, like "Make it shorter", "Add example", etc.`;
    }
    
    if (lowerMessage.includes('formal') || lowerMessage.includes('shorter') || lowerMessage.includes('technical')) {
      contextPrompt += `\n\nUSER NEEDS TONE/STYLE GUIDANCE: Provide both prompt suggestions AND Proof/Review feedback examples for achieving the desired style.`;
    }

    contextPrompt += `\n\nRespond helpfully and concisely. Focus on what the user can DO, not long explanations.`;

    // Call OpenAI API
    let response;
    try {
      response = await client.responses.create({
        model: "gpt-4o-mini",
        input: contextPrompt,
        text: { format: { type: "text" } }
      });
    } catch (apiError) {
      console.error('[AI Assistant] OpenAI API error:', apiError.message);
      throw apiError;
    }

    // DEFENSIVE CHECK: Handle malformed response
    if (!response.output_text) {
      throw new Error('No response content from OpenAI');
    }

    let assistantResponse = response.output_text.trim();
    
    // Safety check: Remove any potential code execution attempts
    // This is a defense-in-depth measure (content is also sanitized on frontend)
    const dangerousPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /\.exec\(/gi,
      /\.call\(/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(assistantResponse)) {
        console.warn('[AI Assistant] Potentially dangerous content detected, sanitizing response');
        assistantResponse = assistantResponse.replace(pattern, '[removed]');
      }
    }

    console.log(`[AI Assistant] Generated response (${assistantResponse.length} chars)`);

    res.json({
      success: true,
      response: assistantResponse
    });

  } catch (error) {
    console.error('=== ERROR IN /api/ai/assistant-chat ===');
    console.error('Request body:', req.body);
    console.error('Error:', error.message);
    console.error('========================================');
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: `OpenAI API error: ${error.message}`
      });
    }

    res.status(500).json({
      error: error.message || 'An error occurred while processing chat message'
    });
  }
});

// AI Image Generation endpoint
app.post('/api/ai/generate-image', async (req, res) => {
  console.log('POST /api/ai/generate-image - Request received');
  
  try {
    const { slideTitle, bulletPoints, topic, theme } = req.body;

    // Validate inputs
    if (!slideTitle || typeof slideTitle !== 'string') {
      return res.status(400).json({
        error: "slideTitle is required and must be a string",
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file' 
      });
    }

    // Build image prompt based on slide content
    const bulletText = Array.isArray(bulletPoints) && bulletPoints.length > 0
      ? bulletPoints.slice(0, 3).join(', ') // Use first 3 bullets for context
      : '';
    
    const imagePrompt = `A professional, clean, modern illustration or photograph related to: ${slideTitle}${bulletText ? '. Key concepts: ' + bulletText : ''}. ${topic ? 'Context: ' + topic : ''}. Style: professional presentation slide image, clean background, suitable for business presentation, high quality, professional photography or illustration style.`;

    // Generate image using DALL-E (MANDATORY - always generate)
    let imageResponse;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        imageResponse = await client.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        break; // Success, exit retry loop
      } catch (apiError) {
        retryCount++;
        console.error(`[Image Generation] OpenAI API error (attempt ${retryCount}/${maxRetries + 1}):`, apiError.message);
        
        if (retryCount > maxRetries) {
          // All retries exhausted - return error but don't fail the request
          // Placeholder will remain in slide
          console.warn('[Image Generation] All retries exhausted, placeholder will be used');
          return res.json({
            success: true,
            imageUrl: null,
            error: `Image generation failed after ${maxRetries + 1} attempts: ${apiError.message}`,
            prompt: imagePrompt // Return prompt for debugging
          });
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Extract image URL
    const imageUrl = imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url
      ? imageResponse.data[0].url
      : null;

    if (!imageUrl) {
      console.warn('[Image Generation] No image URL in response');
      return res.json({
        success: true,
        imageUrl: null
      });
    }

    console.log(`[Image Generation] Generated image for slide: "${slideTitle}"`);

    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: imagePrompt
    });

  } catch (error) {
    console.error('=== ERROR IN /api/ai/generate-image ===');
    console.error('Request body:', req.body);
    console.error('Error:', error.message);
    console.error('========================================');
    
    // Image generation is optional, so return success with null image
    res.json({
      success: true,
      imageUrl: null,
      error: error.message
    });
  }
});

// AI Chart Data Generation endpoint
app.post('/api/ai/generate-chart-data', async (req, res) => {
  console.log('POST /api/ai/generate-chart-data - Request received');
  
  try {
    const { slideTitle, bulletPoints, topic } = req.body;

    // Validate inputs
    if (!slideTitle || typeof slideTitle !== 'string') {
      return res.status(400).json({
        error: "slideTitle is required and must be a string",
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file' 
      });
    }

    // Build prompt to extract data and suggest chart type
    const bulletText = Array.isArray(bulletPoints) && bulletPoints.length > 0
      ? bulletPoints.join('\n')
      : '';
    
    const chartPrompt = `Analyze the following slide content and extract numerical data that would benefit from visualization.

Slide Title: ${slideTitle}
Content:
${bulletText}
${topic ? `Context: ${topic}` : ''}

Extract any numbers, percentages, statistics, comparisons, or data points mentioned. If data is present, suggest an appropriate chart type (bar, pie, line, column) and create realistic chart data.

Return ONLY a JSON object with this structure:
{
  "chartType": "bar" | "pie" | "line" | "column",
  "data": [
    {"label": "Category 1", "value": 25},
    {"label": "Category 2", "value": 40},
    ...
  ]
}

If no meaningful data can be extracted, return:
{
  "chartType": null,
  "data": []
}`;

    // Call OpenAI API
    let response;
    try {
      response = await client.responses.create({
        model: "gpt-4o-mini",
        input: chartPrompt,
        text: { format: { type: "text" } }
      });
    } catch (apiError) {
      console.error('[Chart Generation] OpenAI API error:', apiError.message);
      return res.json({
        success: true,
        chartData: null,
        error: apiError.message
      });
    }

    if (!response.output_text) {
      return res.json({
        success: true,
        chartData: null
      });
    }

    // Parse response - try to extract JSON
    let chartData = null;
    try {
      // Try to find JSON in response
      const jsonMatch = response.output_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        chartData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn('[Chart Generation] Failed to parse JSON, using fallback');
      // Fallback: create simple bar chart from bullet points
      if (bulletPoints && bulletPoints.length > 0) {
        chartData = {
          chartType: 'bar',
          data: bulletPoints.slice(0, 5).map((bullet, i) => ({
            label: `Item ${i + 1}`,
            value: 20 + (i * 10) // Simple incrementing values
          }))
        };
      }
    }

    if (chartData && chartData.chartType && chartData.data && chartData.data.length > 0) {
      console.log(`[Chart Generation] Generated ${chartData.chartType} chart with ${chartData.data.length} data points`);
      res.json({
        success: true,
        chartData: chartData
      });
    } else {
      console.warn('[Chart Generation] No valid chart data generated');
      res.json({
        success: true,
        chartData: null
      });
    }

  } catch (error) {
    console.error('=== ERROR IN /api/ai/generate-chart-data ===');
    console.error('Request body:', req.body);
    console.error('Error:', error.message);
    console.error('========================================');
    
    res.json({
      success: true,
      chartData: null,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in .env file');
  }
});
