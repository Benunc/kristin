const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Function to recursively find all HTML files
async function findHtmlFiles(dir) {
  const files = await readdir(dir);
  const htmlFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const subDirFiles = await findHtmlFiles(filePath);
      htmlFiles.push(...subDirFiles);
    } else if (file.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  }

  return htmlFiles;
}

// Function to fix the Home menu item links in HTML files
function fixHomeLinks(html) {
  // Replace the absolute file:/// URLs with relative URLs for the Home menu item
  const fixedHtml = html.replace(
    /href="file:\/\/\/Users\/benmeredith\/Local%20Sites\/kristin\/app\/public\/wp-content\/uploads\/simply-static\/temp-files\/simply-static-1-1745595610\/">/g, 
    'href="./../index.html">'
  );

  // Also fix the Categories menu link
  return fixedHtml.replace(
    /href="file:\/\/\/Users\/benmeredith\/Local%20Sites\/kristin\/app\/public\/wp-content\/uploads\/simply-static\/temp-files\/simply-static-1-1745595610\/categories\/">/g, 
    'href="./../categories/index.html">'
  );
}

async function main() {
  try {
    // Start from current directory
    const htmlFiles = await findHtmlFiles('.');
    console.log(`Found ${htmlFiles.length} HTML files to process`);
    
    let modifiedCount = 0;
    for (const filePath of htmlFiles) {
      try {
        const content = await readFile(filePath, 'utf8');
        const newContent = fixHomeLinks(content);
        
        if (content !== newContent) {
          await writeFile(filePath, newContent, 'utf8');
          modifiedCount++;
          console.log(`Modified: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }
    
    console.log(`Fixed Home menu links in ${modifiedCount} files`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 