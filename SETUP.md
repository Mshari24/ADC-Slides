# OpenAI Integration Setup

This project now uses OpenAI's API to generate presentation slides.

## Setup Instructions

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   Create a `.env` file in the project root with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=3000
   ```

   To get an OpenAI API key:
   - Visit https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key
   - Copy the key and paste it in your `.env` file

3. **Start the Server**:
   ```bash
   npm start
   ```
   
   The server will start on http://localhost:3000

4. **Use the AI Generator**:
   - Open http://localhost:3000 in your browser
   - Click the AI Generator button in the top bar
   - Enter a topic, select number of slides, theme, and language (English/Arabic)
   - Click "Generate Presentation"

## API Endpoint

The backend provides a POST endpoint at `/api/ai/generate-slides`:

**Request:**
```json
{
  "topic": "Introduction to Machine Learning",
  "slideCount": 8,
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "slides": [
    {
      "title": "Introduction",
      "bullets": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}
```

## Notes

- The API key is stored in `.env` and never exposed to the frontend
- The server uses OpenAI's `gpt-4o-mini` model
- Supports both English and Arabic language generation
- All Aramco colors, fonts, and UI design remain unchanged

