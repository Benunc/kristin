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

// Function to fix file paths in an HTML file
function fixFilePaths(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Fix links that start with a slash
  document.querySelectorAll('a').forEach(link => {
    if (link.href && link.href.startsWith('/')) {
      // Replace leading slash with ./ for relative path
      link.href = '.' + link.href;
      console.log(`  Fixed link: ${link.href}`);
    }
  });
  
  // Fix image sources that start with a slash
  document.querySelectorAll('img').forEach(img => {
    if (img.src && img.src.startsWith('/')) {
      // Replace leading slash with ./ for relative path
      img.src = '.' + img.src;
      console.log(`  Fixed image: ${img.src}`);
    }
  });
  
  // Fix CSS, JS links that start with a slash
  document.querySelectorAll('link[rel="stylesheet"], script').forEach(resource => {
    const attrName = resource.hasAttribute('href') ? 'href' : 'src';
    const attrValue = resource.getAttribute(attrName);
    
    if (attrValue && attrValue.startsWith('/')) {
      // Replace leading slash with ./ for relative path
      resource.setAttribute(attrName, '.' + attrValue);
      console.log(`  Fixed ${attrName}: ${resource.getAttribute(attrName)}`);
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
    fixFilePaths(file);
  });
  
  console.log('Path fixing complete!');
}

main(); 