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

// Function to fix kristinology.com URLs in an HTML file
function fixKristinologyUrls(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file contains the URL we're looking for
  if (!html.includes('www.kristinology.com')) {
    return; // Skip this file if it doesn't contain the URL
  }
  
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Fix anchor href attributes
  document.querySelectorAll('a').forEach(anchor => {
    if (anchor.href && anchor.href.includes('www.kristinology.com')) {
      const oldHref = anchor.href;
      // Convert absolute URL to relative URL
      anchor.href = anchor.href.replace(/https?:\/\/www\.kristinology\.com\//g, '/');
      console.log(`  Fixed link: ${oldHref} -> ${anchor.href}`);
    }
  });
  
  // Handle URLs in other attributes and inline styles
  const htmlWithFixedUrls = dom.serialize().replace(/https?:\/\/www\.kristinology\.com\//g, '/');
  
  // Write the fixed HTML back to the file
  fs.writeFileSync(filePath, htmlWithFixedUrls);
  
  // Count replacements
  const originalMatches = (html.match(/www\.kristinology\.com/g) || []).length;
  const newMatches = (htmlWithFixedUrls.match(/www\.kristinology\.com/g) || []).length;
  console.log(`  Replaced ${originalMatches - newMatches} occurrences in ${filePath}`);
}

// Main function
function main() {
  const currentDir = process.cwd();
  const htmlFiles = findHtmlFiles(currentDir);
  
  console.log(`Found ${htmlFiles.length} HTML files to scan`);
  
  let totalFixed = 0;
  let filesFixed = 0;
  
  htmlFiles.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    const originalMatches = (originalContent.match(/www\.kristinology\.com/g) || []).length;
    
    if (originalMatches > 0) {
      fixKristinologyUrls(file);
      filesFixed++;
      totalFixed += originalMatches;
    }
  });
  
  console.log('URL fixing complete!');
  console.log(`Fixed ${totalFixed} URLs in ${filesFixed} files.`);
}

main(); 