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

// Function to roll back file path changes in an HTML file
function rollbackFilePaths(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Fix links that start with ./
  document.querySelectorAll('a').forEach(link => {
    if (link.href && link.href.startsWith('./')) {
      // Replace ./ with / to go back to root-relative path
      link.href = link.href.replace('./', '/');
      console.log(`  Rolled back link: ${link.href}`);
    }
  });
  
  // Fix image sources that start with ./
  document.querySelectorAll('img').forEach(img => {
    if (img.src && img.src.startsWith('./')) {
      // Replace ./ with / to go back to root-relative path
      img.src = img.src.replace('./', '/');
      console.log(`  Rolled back image: ${img.src}`);
    }
  });
  
  // Fix CSS, JS links that start with ./
  document.querySelectorAll('link[rel="stylesheet"], script').forEach(resource => {
    const attrName = resource.hasAttribute('href') ? 'href' : 'src';
    const attrValue = resource.getAttribute(attrName);
    
    if (attrValue && attrValue.startsWith('./')) {
      // Replace ./ with / to go back to root-relative path
      resource.setAttribute(attrName, attrValue.replace('./', '/'));
      console.log(`  Rolled back ${attrName}: ${resource.getAttribute(attrName)}`);
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
    rollbackFilePaths(file);
  });
  
  console.log('Path rollback complete!');
}

main(); 