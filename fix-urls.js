const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Function to recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix relative URLs in an HTML file
function fixRelativeUrls(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Fix CSS links
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (link.href && link.href.startsWith('/wp-')) {
      link.href = link.href.replace(/^\//, '');
      console.log(`  Fixed CSS: ${link.href}`);
    }
  });
  
  // Fix script sources
  document.querySelectorAll('script').forEach(script => {
    if (script.src && script.src.startsWith('/wp-')) {
      script.src = script.src.replace(/^\//, '');
      console.log(`  Fixed JS: ${script.src}`);
    }
  });
  
  // Fix image sources
  document.querySelectorAll('img').forEach(img => {
    if (img.src && img.src.startsWith('/wp-')) {
      img.src = img.src.replace(/^\//, '');
      console.log(`  Fixed Image: ${img.src}`);
    }
  });
  
  // Write the fixed HTML back to the file
  fs.writeFileSync(filePath, dom.serialize());
}

// Main function
function main() {
  const currentDir = process.cwd();
  const htmlFiles = findHtmlFiles(currentDir);
  
  console.log(`Found ${htmlFiles.length} HTML files to process`);
  
  htmlFiles.forEach(file => {
    fixRelativeUrls(file);
  });
  
  console.log('URL fixing complete!');
}

main(); 