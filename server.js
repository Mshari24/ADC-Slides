// Minimal static server with SPA fallback to index.html
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API Routes (must be before static file serving)
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// AI Generate Slides endpoint
app.post('/api/ai/generate-slides', async (req, res) => {
  console.log('POST /api/ai/generate-slides - Request received');
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  
  try {
    const { topic, slideCount, language } = req.body;

    // Validate input
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ 
        error: 'Topic is required and must be a non-empty string' 
      });
    }

    if (!slideCount || typeof slideCount !== 'number' || slideCount < 1 || slideCount > 50) {
      return res.status(400).json({ 
        error: 'slideCount must be a number between 1 and 50' 
      });
    }

    if (!language || !['ar', 'en'].includes(language)) {
      return res.status(400).json({ 
        error: 'language must be either "ar" or "en"' 
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file' 
      });
    }

    // Build the prompt based on language
    const languageInstruction = language === 'ar' 
      ? 'Generate content in Arabic. All titles and bullet points must be in Arabic.'
      : 'Generate content in English. All titles and bullet points must be in English.';

    const systemPrompt = `You are a professional presentation generator. Generate structured slide content as JSON.

${languageInstruction}

Return exactly ${slideCount} slides in the following JSON format:
{
  "slides": [
    {
      "title": "Slide title",
      "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    }
  ]
}

Requirements:
- Return exactly ${slideCount} slides
- Each slide must have a title and at least 2 bullet points
- Content should be relevant, accurate, and professional
- Use proper ${language === 'ar' ? 'Arabic' : 'English'} grammar and formatting
- Return ONLY valid JSON, no markdown, no code blocks, no explanations`;

    const userPrompt = `Generate a presentation about: "${topic}"

Create exactly ${slideCount} slides with titles and bullet points.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON safely
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response content:', responseContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate structure
    if (!parsedResponse.slides || !Array.isArray(parsedResponse.slides)) {
      throw new Error('Invalid response structure: missing slides array');
    }

    // Ensure we have exactly slideCount slides
    const slides = parsedResponse.slides.slice(0, slideCount);
    
    // Validate each slide
    const validatedSlides = slides.map((slide, index) => {
      if (!slide.title || typeof slide.title !== 'string') {
        throw new Error(`Slide ${index + 1} is missing a valid title`);
      }
      if (!slide.bullets || !Array.isArray(slide.bullets) || slide.bullets.length < 1) {
        throw new Error(`Slide ${index + 1} must have at least one bullet point`);
      }
      return {
        title: slide.title.trim(),
        bullets: slide.bullets.map(b => typeof b === 'string' ? b.trim() : String(b).trim()).filter(b => b.length > 0)
      };
    });

    // If we have fewer slides than requested, pad with placeholder slides
    while (validatedSlides.length < slideCount) {
      validatedSlides.push({
        title: language === 'ar' 
          ? `شريحة ${validatedSlides.length + 1}: ${topic}`
          : `Slide ${validatedSlides.length + 1}: ${topic}`,
        bullets: language === 'ar'
          ? ['نقطة رئيسية', 'نقطة إضافية']
          : ['Key point', 'Additional point']
      });
    }

    // Return the response
    res.json({
      success: true,
      slides: validatedSlides.slice(0, slideCount)
    });

  } catch (error) {
    console.error('Error generating slides:', error);
    
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

// Static file serving (must be after API routes)
// Only serve static files for non-API GET requests
app.use((req, res, next) => {
  // Skip static serving for API routes or non-GET requests
  if (req.path.startsWith('/api/') || req.method !== 'GET') {
    return next();
  }
  next();
}, express.static('.'));

// Catch-all handler for SPA routing (GET requests only, excludes API routes)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile('index.html', { root: '.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in .env file');
  }
});
