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

    if (
      !parsedSlideCount ||
      Number.isNaN(parsedSlideCount) ||
      parsedSlideCount < 1 ||
      parsedSlideCount > 50
    ) {
      return res.status(400).json({
        error: "slideCount must be a number between 1 and 50",
      });
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

    const systemPrompt = `You are a professional presentation generator. Generate structured slide content as JSON.

${languageInstruction}

Return exactly ${parsedSlideCount} slides in the following JSON format:
{
  "slides": [
    {
      "title": "Slide title",
      "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    },
    {
      "title": "Section Header Title",
      "bullets": []
    }
  ]
}

IMPORTANT SLIDE TYPES:
1. SECTION HEADER SLIDES (Title-only):
   - Use for main sections and sub-sections
   - Set "bullets" to an empty array []
   - Examples: "Introduction", "Chapter 1", "Key Findings", "Conclusion"
   - Generate at least 2-3 section header slides per presentation

2. CONTENT SLIDES:
   - Use for detailed information
   - Must have 2-4 bullet points
   - Examples: slides with explanations, lists, details

Requirements:
- Return exactly ${parsedSlideCount} slides
- Each slide must have a title
- Section headers (main/sub-headings) MUST have "bullets": [] (empty array)
- Content slides MUST have 2-4 bullet points
- Mix section headers and content slides appropriately
- Start with a section header slide
- Use section headers to separate major topics
- Content should be relevant, accurate, and professional
- Use proper ${lang === 'ar' ? 'Arabic' : 'English'} grammar and formatting
- Return ONLY valid JSON, no markdown, no code blocks, no explanations`;

    const userPrompt = `Generate a presentation about: "${topic}"

Create exactly ${parsedSlideCount} slides. Include section header slides (title-only, empty bullets array) for main sections and sub-headings. Mix section headers with content slides that have 2-4 bullet points each.`;

    // Combine system and user prompts into a single input string for Responses API
    const combinedInput = `${systemPrompt}\n\n${userPrompt}`;

    // Call OpenAI API using Responses API format
    let response;
    try {
      response = await client.responses.create({
        model: "gpt-4o-mini",
        input: combinedInput,
        response_format: { type: "json_object" }
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

    // Parse JSON from response.output_text
    if (!response.output_text) {
      throw new Error('No response content from OpenAI');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.output_text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response output_text:', response.output_text);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate structure
    if (!parsedResponse.slides || !Array.isArray(parsedResponse.slides)) {
      throw new Error('Invalid response structure: missing slides array');
    }

    // Ensure we have exactly slideCount slides
    const slides = parsedResponse.slides.slice(0, parsedSlideCount);
    
    // Validate each slide
    const validatedSlides = slides.map((slide, index) => {
      if (!slide.title || typeof slide.title !== 'string') {
        throw new Error(`Slide ${index + 1} is missing a valid title`);
      }
      // Allow title-only slides (0 bullets) or slides with content (1+ bullets)
      if (!slide.bullets || !Array.isArray(slide.bullets)) {
        // If bullets is missing or not an array, treat as title-only slide
        slide.bullets = [];
      }
      return {
        title: slide.title.trim(),
        bullets: slide.bullets.map(b => typeof b === 'string' ? b.trim() : String(b).trim()).filter(b => b.length > 0)
      };
    });

    // If we have fewer slides than requested, pad with placeholder slides
    while (validatedSlides.length < parsedSlideCount) {
      validatedSlides.push({
        title: lang === 'ar' 
          ? `شريحة ${validatedSlides.length + 1}: ${topic}`
          : `Slide ${validatedSlides.length + 1}: ${topic}`,
        bullets: lang === 'ar'
          ? ['نقطة رئيسية', 'نقطة إضافية']
          : ['Key point', 'Additional point']
      });
    }

    // Return the response
    res.json({
      success: true,
      slides: validatedSlides.slice(0, parsedSlideCount)
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in .env file');
  }
});
