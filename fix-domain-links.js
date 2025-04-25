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

// Function to fix domain links in an HTML file
function fixDomainLinks(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Calculate the relative path to root based on the file's location
  const relativeToRoot = path.relative(path.dirname(filePath), process.cwd());
  // Convert Windows backslashes to forward slashes if needed
  const rootPrefix = relativeToRoot.replace(/\\/g, '/');
  // Add trailing slash if not empty
  const rootPath = rootPrefix === '' ? '' : rootPrefix + '/';
  
  // Fix all anchor links
  document.querySelectorAll('a').forEach(link => {
    if (link.href && (
        link.href.includes('kristinology.com') ||
        link.href.includes('www.kristinology.com')
      )) {
      // Extract path from the URL
      try {
        const url = new URL(link.href);
        let pathname = url.pathname;
        
        // Remove leading slash if present
        if (pathname.startsWith('/')) {
          pathname = pathname.substring(1);
        }
        
        // If it's the homepage, point to root level
        if (pathname === '' || pathname === '/') {
          link.href = rootPath || './';
        } else {
          // Otherwise, use relative path from root
          link.href = rootPath + pathname;
        }
        
        console.log(`  Fixed link: ${link.href}`);
      } catch (e) {
        console.log(`  Skipping invalid URL: ${link.href}`);
      }
    }
  });
  
  // Fix image sources
  document.querySelectorAll('img').forEach(img => {
    if (img.src && (
        img.src.includes('kristinology.com') ||
        img.src.includes('www.kristinology.com')
      )) {
      // Extract path from the URL
      try {
        const url = new URL(img.src);
        let pathname = url.pathname;
        
        // Remove leading slash if present
        if (pathname.startsWith('/')) {
          pathname = pathname.substring(1);
        }
        
        // Use relative path
        img.src = rootPath + pathname;
        console.log(`  Fixed image: ${img.src}`);
      } catch (e) {
        console.log(`  Skipping invalid URL: ${img.src}`);
      }
    }
  });
  
  // Fix meta tags
  document.querySelectorAll('meta').forEach(meta => {
    if (meta.content && (
        meta.content.includes('kristinology.com') ||
        meta.content.includes('www.kristinology.com')
      )) {
      try {
        const url = new URL(meta.content);
        let pathname = url.pathname;
        
        // Remove leading slash if present
        if (pathname.startsWith('/')) {
          pathname = pathname.substring(1);
        }
        
        // Use relative path
        meta.content = rootPath + pathname;
        console.log(`  Fixed meta: ${meta.content}`);
      } catch (e) {
        // If not a valid URL, just continue
      }
    }
  });
  
  // Look for kristinology.com in any javascript or data attributes
  const htmlContent = dom.serialize();
  const fixedHtmlContent = htmlContent.replace(/http:\/\/(www\.)?kristinology\.com\//g, rootPath);
  
  // Write the fixed HTML back to the file
  fs.writeFileSync(filePath, fixedHtmlContent);
}

// Main function
function main() {
  const currentDir = process.cwd();
  const htmlFiles = findHtmlFiles(currentDir);
  
  console.log(`Found ${htmlFiles.length} HTML files to process`);
  
  htmlFiles.forEach(file => {
    fixDomainLinks(file);
  });
  
  console.log('Domain link fixing complete!');
}

main(); 