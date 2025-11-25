# PowerPoint Theme Extraction Guide

This guide explains how to convert PowerPoint files into usable themes for the ADC Slides application.

## Overview

The theme extraction system allows you to:
1. Upload PowerPoint files (.pptx or .ppt)
2. Extract theme information (colors, fonts, layouts)
3. Convert them into the application's theme format
4. Add them to the theme selector

## Quick Start

### Option 1: Using the Web Interface (Recommended)

1. **Start the server:**
   ```bash
   npm install
   npm start
   ```

2. **Open the Theme Admin page:**
   Navigate to `http://localhost:3000/theme-admin.html`

3. **Upload your PowerPoint files:**
   - Drag and drop your .pptx or .ppt files onto the upload area
   - Or click to browse and select files
   - The system will automatically extract theme information

4. **Review extracted themes:**
   - Each theme will show a preview with colors and settings
   - You can download the JSON or copy it to clipboard

5. **Add themes to the application:**
   - Download the JSON file
   - Run the add-themes script:
     ```bash
     node add-themes.js extracted-themes.json
     ```
   - The themes will be added to `ai-generator.js` and available in the theme selector

### Option 2: Using Command Line

1. **Extract themes from PowerPoint files:**
   ```bash
   node theme-extractor.js theme1.pptx theme2.pptx theme3.pptx > extracted-themes.json
   ```

2. **Add themes to the application:**
   ```bash
   node add-themes.js extracted-themes.json
   ```

## What Gets Extracted

The theme extractor extracts the following information from PowerPoint files:

- **Colors:**
  - Primary color (from accent1)
  - Secondary color (from accent2)
  - Accent color (from accent3)
  - Background color
  - Text colors (dark and light)

- **Fonts:**
  - Font family (from major font scheme)
  - Title size (default: 42px)
  - Body size (default: 22px)

- **Layout Settings:**
  - Layout style (corporate, modern, minimal, creative)
  - Title alignment
  - Body alignment
  - Font weight

## Theme Format

Each extracted theme follows this structure:

```json
{
  "id": "theme-id",
  "name": "Theme Name",
  "colors": {
    "primary": "#003e6a",
    "secondary": "#00aae7",
    "accent": "#006c35",
    "background": "#ffffff",
    "text": "#1e293b",
    "textLight": "#475569"
  },
  "fonts": {
    "family": "Inter, system-ui, sans-serif",
    "titleSize": 42,
    "bodySize": 22
  },
  "layoutStyle": "corporate",
  "titleAlign": "center",
  "bodyAlign": "left",
  "fontWeight": "bold"
}
```

## Troubleshooting

### Theme colors not extracted correctly

If colors aren't extracted properly:
1. Make sure your PowerPoint file uses theme colors (not just direct color fills)
2. Check that the file has a proper theme applied
3. You can manually edit the JSON file to adjust colors

### Fonts not detected

If fonts aren't detected:
1. The system defaults to "Inter, system-ui, sans-serif"
2. You can manually edit the JSON file to set the correct font family

### File upload fails

If file upload fails:
1. Check file size (max 50MB)
2. Ensure file is a valid .pptx or .ppt file
3. Check server logs for detailed error messages

## Manual Theme Creation

If you prefer to create themes manually, you can create a JSON file with the theme structure above and use `add-themes.js` to add it to the application.

## API Endpoint

The theme extraction is also available via API:

```bash
POST /api/themes/extract
Content-Type: multipart/form-data

file: <PowerPoint file>
```

Response:
```json
{
  "success": true,
  "theme": {
    "id": "theme-id",
    "name": "Theme Name",
    ...
  }
}
```

## Files Created

- `theme-extractor.js` - Core extraction logic
- `add-themes.js` - Script to add themes to ai-generator.js
- `theme-admin.html` - Web interface for theme extraction
- `server.js` - Updated with theme extraction endpoint

## Next Steps

After adding themes:
1. Restart the server if it's running
2. Themes will appear in the theme selector dropdown
3. Users can select these themes when creating presentations

## Notes

- Extracted themes are clean templates without content
- Original PowerPoint content is not preserved
- Only design/styling information is extracted
- Themes are added to the THEMES object in `ai-generator.js`

