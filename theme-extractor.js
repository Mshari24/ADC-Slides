/**
 * PowerPoint Theme Extractor
 * Extracts theme information (colors, fonts, layouts) from PowerPoint files
 * and converts them into the application's theme format
 */

import JSZip from 'jszip';
import { parseString } from 'xml2js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse XML string to JavaScript object
 */
function parseXML(xmlString) {
  return new Promise((resolve, reject) => {
    parseString(xmlString, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Extract color from PowerPoint color format
 * PowerPoint uses formats like: "FF003E6A" (ARGB hex) or theme references
 */
function extractColor(colorValue) {
  if (!colorValue) return null;
  
  // Handle hex colors (remove alpha channel if present)
  if (typeof colorValue === 'string' && colorValue.startsWith('FF')) {
    return '#' + colorValue.substring(2);
  }
  
  // Handle theme color references
  if (typeof colorValue === 'object') {
    // Try to find actual color value
    if (colorValue.val) {
      const val = colorValue.val;
      if (typeof val === 'string' && val.startsWith('FF')) {
        return '#' + val.substring(2);
      }
    }
  }
  
  return null;
}

/**
 * Extract theme colors from PowerPoint theme file
 */
async function extractThemeColors(themeXml) {
  const colors = {
    primary: null,
    secondary: null,
    accent: null,
    background: '#ffffff',
    text: '#1e293b',
    textLight: '#475569'
  };
  
  try {
    const theme = await parseXML(themeXml);
    
    // Navigate through XML structure - handle various namespace formats
    const root = theme?.theme || theme?.['a:theme'] || theme || {};
    const themeElements = root?.['a:themeElements'] || root?.['themeElements'] || root?.themeElements || root || {};
    const clrScheme = themeElements?.['a:clrScheme'] || themeElements?.['clrScheme'] || themeElements?.clrScheme || {};
    
    // Helper function to extract color value from various XML structures
    const getColorValue = (colorElement) => {
      if (!colorElement) return null;
      
      // Try different possible structures
      const srgbClr = colorElement?.['a:srgbClr'] || colorElement?.['srgbClr'] || colorElement?.srgbClr;
      if (srgbClr) {
        const val = srgbClr?.['$']?.['val'] || srgbClr?.['val'] || srgbClr?.val;
        if (val && typeof val === 'string') {
          return val.startsWith('#') ? val : '#' + val;
        }
      }
      
      // Try sysClr (system colors)
      const sysClr = colorElement?.['a:sysClr'] || colorElement?.['sysClr'] || colorElement?.sysClr;
      if (sysClr) {
        const lastClr = sysClr?.['$']?.['lastClr'] || sysClr?.['lastClr'] || sysClr?.lastClr;
        if (lastClr && typeof lastClr === 'string') {
          return lastClr.startsWith('#') ? lastClr : '#' + lastClr;
        }
      }
      
      return null;
    };
    
    // PowerPoint theme color scheme typically has:
    // - dk1, dk2 (dark colors)
    // - lt1, lt2 (light colors)
    // - accent1-6 (accent colors)
    // - hlink, folHlink (hyperlink colors)
    
    const accent1 = clrScheme?.['a:accent1'] || clrScheme?.['accent1'] || clrScheme?.accent1 || {};
    const accent2 = clrScheme?.['a:accent2'] || clrScheme?.['accent2'] || clrScheme?.accent2 || {};
    const accent3 = clrScheme?.['a:accent3'] || clrScheme?.['accent3'] || clrScheme?.accent3 || {};
    const dk1 = clrScheme?.['a:dk1'] || clrScheme?.['dk1'] || clrScheme?.dk1 || {};
    const lt1 = clrScheme?.['a:lt1'] || clrScheme?.['lt1'] || clrScheme?.lt1 || {};
    
    // Extract colors
    const accent1Color = getColorValue(accent1);
    if (accent1Color) {
      colors.primary = accent1Color;
    }
    
    const accent2Color = getColorValue(accent2);
    if (accent2Color) {
      colors.secondary = accent2Color;
    }
    
    const accent3Color = getColorValue(accent3);
    if (accent3Color) {
      colors.accent = accent3Color;
    }
    
    const dk1Color = getColorValue(dk1);
    if (dk1Color) {
      colors.text = dk1Color;
    }
    
    const lt1Color = getColorValue(lt1);
    if (lt1Color) {
      colors.textLight = lt1Color;
    }
    
  } catch (error) {
    console.warn('Error extracting theme colors:', error.message);
  }
  
  return colors;
}

/**
 * Extract font information from PowerPoint theme
 */
async function extractThemeFonts(themeXml) {
  const fonts = {
    family: 'Inter, system-ui, sans-serif',
    titleSize: 42,
    bodySize: 22
  };
  
  try {
    const theme = await parseXML(themeXml);
    
    // Navigate through XML structure
    const root = theme?.theme || theme?.['a:theme'] || theme || {};
    const themeElements = root?.['a:themeElements'] || root?.['themeElements'] || root?.themeElements || root || {};
    const fontScheme = themeElements?.['a:fontScheme'] || themeElements?.['fontScheme'] || themeElements?.fontScheme || {};
    
    // PowerPoint typically has majorFont (for headings) and minorFont (for body)
    const majorFont = fontScheme?.['a:majorFont'] || fontScheme?.['majorFont'] || fontScheme?.majorFont || {};
    const minorFont = fontScheme?.['a:minorFont'] || fontScheme?.['minorFont'] || fontScheme?.minorFont || {};
    
    // Try to extract font family from Latin font
    const majorLatin = majorFont?.['a:latin']?.['$']?.['typeface'] || 
                       majorFont?.['latin']?.['$']?.['typeface'] ||
                       majorFont?.['a:latin']?.['typeface'] ||
                       majorFont?.['latin']?.['typeface'] ||
                       majorFont?.latin?.['$']?.['typeface'] ||
                       majorFont?.latin?.typeface;
    
    if (majorLatin && typeof majorLatin === 'string') {
      fonts.family = majorLatin + ', system-ui, sans-serif';
    }
    
  } catch (error) {
    console.warn('Error extracting theme fonts:', error.message);
  }
  
  return fonts;
}

/**
 * Analyze slide layouts to determine layout style
 */
function analyzeLayoutStyle(slides) {
  // Analyze slide content to determine layout style
  // This is a simplified analysis - you can enhance it based on actual slide content
  let hasImages = false;
  let hasBullets = false;
  let hasTitleOnly = false;
  
  slides.forEach(slide => {
    if (slide.includes('image') || slide.includes('pic')) hasImages = true;
    if (slide.includes('bullet') || slide.includes('list')) hasBullets = true;
    if (slide.match(/title/i) && !slide.match(/content|body/i)) hasTitleOnly = true;
  });
  
  if (hasImages && hasBullets) return 'creative';
  if (hasTitleOnly) return 'minimal';
  if (hasBullets) return 'corporate';
  return 'modern';
}

/**
 * Extract theme from PowerPoint file
 */
export async function extractThemeFromPowerPoint(filePath) {
  try {
    // Read the PowerPoint file
    const fileBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(fileBuffer);
    
    // Extract theme information
    let themeXml = null;
    let presentationXml = null;
    
    // Try to find theme file
    const themeFiles = Object.keys(zip.files).filter(name => 
      name.includes('theme/theme') || name.includes('theme1.xml')
    );
    
    if (themeFiles.length > 0) {
      themeXml = await zip.files[themeFiles[0]].async('string');
    }
    
    // Get presentation XML to analyze layouts
    const presentationFiles = Object.keys(zip.files).filter(name => 
      name === 'ppt/presentation.xml' || name.includes('presentation.xml')
    );
    
    if (presentationFiles.length > 0) {
      presentationXml = await zip.files[presentationFiles[0]].async('string');
    }
    
    // Extract colors
    const colors = themeXml ? await extractThemeColors(themeXml) : {
      primary: '#003e6a',
      secondary: '#00aae7',
      accent: '#006c35',
      background: '#ffffff',
      text: '#1e293b',
      textLight: '#475569'
    };
    
    // Extract fonts
    const fonts = themeXml ? await extractThemeFonts(themeXml) : {
      family: 'Inter, system-ui, sans-serif',
      titleSize: 42,
      bodySize: 22
    };
    
    // Analyze layout style from presentation
    const layoutStyle = presentationXml ? analyzeLayoutStyle(presentationXml) : 'corporate';
    
    // Generate theme name from filename
    const fileName = path.basename(filePath, path.extname(filePath));
    const themeId = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const themeName = fileName.split(/[-_\s]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return {
      id: themeId,
      name: themeName,
      colors,
      fonts,
      layoutStyle,
      titleAlign: layoutStyle === 'corporate' ? 'center' : 'left',
      bodyAlign: 'left',
      fontWeight: layoutStyle === 'corporate' ? 'bold' : '600'
    };
    
  } catch (error) {
    console.error('Error extracting theme from PowerPoint:', error);
    throw error;
  }
}

/**
 * Extract multiple themes from PowerPoint files
 */
export async function extractThemesFromPowerPointFiles(filePaths) {
  const themes = [];
  
  for (const filePath of filePaths) {
    try {
      const theme = await extractThemeFromPowerPoint(filePath);
      themes.push(theme);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  return themes;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePaths = process.argv.slice(2);
  
  if (filePaths.length === 0) {
    console.log('Usage: node theme-extractor.js <path-to-pptx> [<path-to-pptx> ...]');
    process.exit(1);
  }
  
  extractThemesFromPowerPointFiles(filePaths)
    .then(themes => {
      console.log(JSON.stringify(themes, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

