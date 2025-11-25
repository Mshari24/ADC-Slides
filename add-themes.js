/**
 * Script to add extracted themes to ai-generator.js
 * Usage: node add-themes.js <theme-json-file>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addThemesToGenerator(themeJsonPath) {
  // Read the theme JSON file
  const themesData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf8'));
  const themes = Array.isArray(themesData) ? themesData : [themesData];
  
  // Read ai-generator.js
  const generatorPath = path.join(__dirname, 'ai-generator.js');
  let generatorContent = fs.readFileSync(generatorPath, 'utf8');
  
  // Find the THEMES object
  const themesStart = generatorContent.indexOf('const THEMES = {');
  if (themesStart === -1) {
    throw new Error('Could not find THEMES object in ai-generator.js');
  }
  
  // Find the closing brace of THEMES object
  let braceCount = 0;
  let inThemes = false;
  let themesEnd = themesStart;
  
  for (let i = themesStart; i < generatorContent.length; i++) {
    if (generatorContent[i] === '{') {
      braceCount++;
      inThemes = true;
    } else if (generatorContent[i] === '}') {
      braceCount--;
      if (inThemes && braceCount === 0) {
        themesEnd = i + 1;
        break;
      }
    }
  }
  
  // Extract existing themes
  const themesSection = generatorContent.substring(themesStart, themesEnd);
  
  // Generate new theme entries with "Aramco 1", "Aramco 2", "Aramco 3" naming
  const newThemeEntries = themes.map((theme, index) => {
    const aramcoNumber = index + 1;
    const themeId = `aramco-${aramcoNumber}`;
    const themeName = `Aramco ${aramcoNumber}`;
    
    return `    '${themeId}': {
      name: '${themeName}',
      primary: '${theme.colors.primary}',
      secondary: '${theme.colors.secondary}',
      accent: '${theme.colors.accent}',
      background: '${theme.colors.background}',
      text: '${theme.colors.text}',
      textLight: '${theme.colors.textLight}',
      fontFamily: '${theme.fonts.family}',
      layoutStyle: '${theme.layoutStyle}',
      titleAlign: '${theme.titleAlign}',
      bodyAlign: '${theme.bodyAlign}',
      fontWeight: '${theme.fontWeight}',
    },`;
  }).join('\n');
  
  // Insert new themes before the closing brace
  const updatedThemesSection = themesSection.replace(/\n  \};/, `\n${newThemeEntries}\n  };`);
  
  // Replace in original content
  const updatedContent = generatorContent.substring(0, themesStart) + 
                        updatedThemesSection + 
                        generatorContent.substring(themesEnd);
  
  // Write back to file
  fs.writeFileSync(generatorPath, updatedContent, 'utf8');
  
  console.log(`✅ Successfully added ${themes.length} theme(s) to ai-generator.js`);
  themes.forEach((theme, index) => {
    const aramcoNumber = index + 1;
    console.log(`   - Aramco ${aramcoNumber} (aramco-${aramcoNumber})`);
  });
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const themeJsonPath = process.argv[2];
  
  if (!themeJsonPath) {
    console.log('Usage: node add-themes.js <theme-json-file>');
    console.log('Example: node add-themes.js extracted-themes.json');
    process.exit(1);
  }
  
  if (!fs.existsSync(themeJsonPath)) {
    console.error(`Error: File not found: ${themeJsonPath}`);
    process.exit(1);
  }
  
  try {
    addThemesToGenerator(themeJsonPath);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { addThemesToGenerator };

