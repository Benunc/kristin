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

// Function to remove Disqus elements from an HTML file
function removeDisqus(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    
    // Skip files without Disqus
    if (!html.includes('disqus')) {
      return false;
    }
    
    console.log(`Processing: ${filePath}`);
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove the disqus_thread div
    const disqusThread = document.getElementById('disqus_thread');
    if (disqusThread) {
      disqusThread.remove();
      console.log(`  Removed disqus_thread div`);
    }
    
    // Remove Disqus scripts
    const disqusScripts = [
      document.getElementById('disqus_count-js-extra'),
      document.getElementById('disqus_count-js'),
      document.getElementById('disqus_embed-js-extra'),
      document.getElementById('disqus_embed-js')
    ];
    
    disqusScripts.forEach(script => {
      if (script) {
        script.remove();
        console.log(`  Removed script: ${script.id}`);
      }
    });
    
    // Remove any remaining scripts containing "disqus"
    const allScripts = document.querySelectorAll('script');
    allScripts.forEach(script => {
      if (script.textContent.includes('disqus') || 
          (script.src && script.src.includes('disqus')) ||
          (script.id && script.id.includes('disqus'))) {
        script.remove();
        console.log(`  Removed additional disqus script`);
      }
    });
    
    // Save the modified HTML
    fs.writeFileSync(filePath, dom.serialize());
    return true;
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const currentDir = process.cwd();
  const htmlFiles = findHtmlFiles(currentDir);
  
  console.log(`Found ${htmlFiles.length} HTML files to scan`);
  
  let filesProcessed = 0;
  
  htmlFiles.forEach(file => {
    if (removeDisqus(file)) {
      filesProcessed++;
    }
  });
  
  console.log(`Disqus removal complete!`);
  console.log(`Processed ${filesProcessed} files with Disqus content`);
}

main(); 