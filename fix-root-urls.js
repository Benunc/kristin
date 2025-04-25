const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Define constants
const ROOT_DOMAIN_PATTERN = /https?:\/\/(www\.)?kristinology\.com/g;
const LOCAL_FILE_PATH = 'file:///Users/benmeredith/Local%20Sites/kristin/app/public/wp-content/uploads/simply-static/temp-files/simply-static-1-1745595610';

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

// Function to fix URLs in HTML files
function fixRootUrls(filePath) {
  console.log(`Processing: ${filePath}`);
  
  // Read the file content
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file contains the URLs we're looking for
  if (!html.includes('kristinology.com')) {
    return 0;
  }
  
  // Count the number of instances before replacement
  const originalCount = (html.match(ROOT_DOMAIN_PATTERN) || []).length;
  
  // Parse the HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Fix links
  document.querySelectorAll('a').forEach(anchor => {
    if (anchor.href && anchor.href.match(ROOT_DOMAIN_PATTERN)) {
      const oldHref = anchor.href;
      anchor.href = anchor.href.replace(ROOT_DOMAIN_PATTERN, LOCAL_FILE_PATH);
      console.log(`  Fixed link: ${oldHref} -> ${anchor.href}`);
    }
  });
  
  // Fix images, scripts, stylesheets, etc.
  ['img', 'script', 'link', 'source', 'video', 'audio', 'iframe'].forEach(tagName => {
    document.querySelectorAll(tagName).forEach(element => {
      // Handle src attribute
      if (element.src && element.src.match(ROOT_DOMAIN_PATTERN)) {
        const oldSrc = element.src;
        element.src = element.src.replace(ROOT_DOMAIN_PATTERN, LOCAL_FILE_PATH);
        console.log(`  Fixed ${tagName} src: ${oldSrc} -> ${element.src}`);
      }
      
      // Handle href attribute (for links, etc.)
      if (element.href && element.href.match(ROOT_DOMAIN_PATTERN)) {
        const oldHref = element.href;
        element.href = element.href.replace(ROOT_DOMAIN_PATTERN, LOCAL_FILE_PATH);
        console.log(`  Fixed ${tagName} href: ${oldHref} -> ${element.href}`);
      }
    });
  });
  
  // Serialize the DOM back to HTML
  let newHtml = dom.serialize();
  
  // Replace any remaining instances (in inline scripts, styles, etc.) using string replacement
  newHtml = newHtml.replace(ROOT_DOMAIN_PATTERN, LOCAL_FILE_PATH);
  
  // Write back to the file
  fs.writeFileSync(filePath, newHtml);
  
  // Count the number of instances after replacement
  const newCount = (newHtml.match(ROOT_DOMAIN_PATTERN) || []).length;
  const replacements = originalCount - newCount;
  
  if (replacements > 0) {
    console.log(`  Made ${replacements} replacements in ${filePath}`);
  }
  
  return replacements;
}

// Main function
function main() {
  const currentDir = process.cwd();
  const htmlFiles = findHtmlFiles(currentDir);
  
  console.log(`Found ${htmlFiles.length} HTML files to scan`);
  
  let totalReplacements = 0;
  let filesModified = 0;
  
  htmlFiles.forEach(file => {
    const replacements = fixRootUrls(file);
    if (replacements > 0) {
      totalReplacements += replacements;
      filesModified++;
    }
  });
  
  console.log('\nURL fixing complete!');
  console.log(`Made ${totalReplacements} replacements in ${filesModified} files.`);
}

main(); 