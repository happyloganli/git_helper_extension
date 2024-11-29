function extractDiffContent() {
  // Find all diff entries
  const diffEntries = document.querySelectorAll('copilot-diff-entry');
  const filesContent = [];

  diffEntries.forEach(entry => {
    const filePath = entry.getAttribute('data-file-path');
    
    // Get all code lines within this file
    const codeLines = entry.querySelectorAll('.blob-code-inner.blob-code-marker');
    
    let originalCode = [];
    let currentCode = [];
    
    // Process lines alternately for original and current code
    codeLines.forEach((line, index) => {
      // Get the text content, removing any extra whitespace
      const lineContent = line.textContent.trimRight();
      
      // Even indices are original code, odd indices are current code
      if (index % 2 === 0) {
        originalCode.push(lineContent);
      } else {
        currentCode.push(lineContent);
      }
    });

    filesContent.push({
      fileName: filePath,
      originalCode: originalCode.join('\n'),
      currentCode: currentCode.join('\n')
    });
  });

  return filesContent;
}

function addExtractButton() {
  const headerActions = document.querySelector('.ml-2.hide-sm.hide-md');
  if (headerActions && !document.getElementById('extract-diff-btn')) {
    const button = document.createElement('button');
    button.id = 'extract-diff-btn';
    button.className = 'btn btn-sm';
    button.textContent = 'Extract Changes';
    button.onclick = () => {
      const files = extractDiffContent();
      console.log('Extracted files:', files);
      files.forEach(file => {
        console.log(`\nFile: ${file.fileName}`);
        console.log('Original Code:');
        console.log(file.originalCode);
        console.log('\nCurrent Code:');
        console.log(file.currentCode);
      });
    };
    headerActions.appendChild(button);
  }
}

// Run when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addExtractButton);
} else {
  addExtractButton();
}