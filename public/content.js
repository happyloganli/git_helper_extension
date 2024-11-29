function createFeedbackPanel() {
  if (!document.getElementById('ai-feedback-panel')) {
    const panel = document.createElement('div');
    panel.id = 'ai-feedback-panel';
    panel.style.cssText = `
      position: fixed;
      right: 0;  /* Changed from left: 0 */
      top: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 1px solid #e1e4e8;  /* Changed from border-right */
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);  /* Changed shadow direction */
      z-index: 9999;
      overflow-y: auto;
      padding: 20px;
      transition: transform 0.3s ease;
    `;

    // Add shrink/expand button
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = '◀'; 
    toggleButton.style.cssText = `
      position: absolute;
      left: -30px;  /* Position button outside panel */
      top: 50%;
      transform: translateY(-50%);
      width: 30px;
      height: 60px;
      border: none;
      border-radius: 4px 0 0 4px;
      background: white;
      box-shadow: -2px 0 4px rgba(0,0,0,0.1);
      cursor: pointer;
      z-index: 9999;
    `;

    let isPanelExpanded = true;
    toggleButton.onclick = () => {
      isPanelExpanded = !isPanelExpanded;
      panel.style.transform = isPanelExpanded ? 'translateX(0)' : 'translateX(100%)';
      toggleButton.innerHTML = isPanelExpanded ? '◀' : '▶';
    };

    // Add content container
    const content = document.createElement('div');
    content.id = 'ai-feedback-content';
    content.style.marginTop = '20px';

    panel.appendChild(toggleButton);
    panel.appendChild(content);
    document.body.appendChild(panel);
  }
}

function formatMarkdown(text) {
  // Convert markdown to HTML
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\d\. (.*$)/gm, '<ol><li>$1</li></ol>')
    .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
    // Code blocks
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // New lines
    .replace(/\n/g, '<br>');
}

function displayFeedback(files) {
  const panel = document.getElementById('ai-feedback-panel');
  const content = document.getElementById('ai-feedback-content');
  content.innerHTML = '';

  files.forEach(file => {
    const fileSection = document.createElement('div');
    fileSection.style.marginBottom = '30px';
    fileSection.style.backgroundColor = '#f6f8fa';
    fileSection.style.padding = '15px';
    fileSection.style.borderRadius = '6px';

    const fileName = document.createElement('h3');
    fileName.textContent = file.fileName;
    fileName.style.cssText = `
      margin: 0 0 10px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e1e4e8;
      font-size: 16px;
      font-weight: 600;
      color: #24292e;
    `;

    const feedback = document.createElement('div');
    feedback.style.fontSize = '14px';
    feedback.style.lineHeight = '1.5';
    feedback.style.color = '#24292e';
    feedback.innerHTML = formatMarkdown(file.feedback);

    fileSection.appendChild(fileName);
    fileSection.appendChild(feedback);
    content.appendChild(fileSection);
  });

  panel.style.display = 'block';
}

async function getAIFeedback(originalCode, currentCode) {
  const { available } = await ai.languageModel.capabilities();
  if (available === "no") {
    return "AI model not available";
  }

  const session = await ai.languageModel.create();
  const prompt = `Please analyze this code change and provide feedback on:
1. Is the current code syntactically correct?
2. Summary of modifications
3. Advice on the modifications

Original code:
${originalCode}

Current code:
${currentCode}`;

  const feedback = await session.prompt(prompt);
  return feedback;
}

async function extractDiffContent() {
  const diffEntries = document.querySelectorAll('copilot-diff-entry');
  const filesContent = [];

  for (const entry of diffEntries) {
    const filePath = entry.getAttribute('data-file-path');
    const codeLines = entry.querySelectorAll('.blob-code-inner.blob-code-marker');
    
    let originalCode = [];
    let currentCode = [];
    
    codeLines.forEach((line, index) => {
      const lineContent = line.textContent.trimRight();
      if (index % 2 === 0) {
        originalCode.push(lineContent);
      } else {
        currentCode.push(lineContent);
      }
    });

    const originalText = originalCode.join('\n');
    const currentText = currentCode.join('\n');

    // Log the extracted details
    console.log(`Processing file: ${filePath}`);
    console.log(`Original Code:\n${originalText}`);
    console.log(`Current Code:\n${currentText}`);
    
    try {
      const aiFeedback = await getAIFeedback(originalText, currentText);
      
      filesContent.push({
        fileName: filePath,
        originalCode: originalText,
        currentCode: currentText,
        feedback: aiFeedback
      });
    } catch (error) {
      filesContent.push({
        fileName: filePath,
        originalCode: originalText,
        currentCode: currentText,
        feedback: `Error getting AI feedback: ${error.message}`
      });
    }
  }

  return filesContent;
}

// Modified button addition to handle page loads better
function addExtractButton() {
  const observer = new MutationObserver((mutations, obs) => {
    const headerActions = document.querySelector('.ml-2.hide-sm.hide-md');
    if (headerActions && !document.getElementById('extract-diff-btn')) {
      const button = document.createElement('button');
      button.id = 'extract-diff-btn';
      button.className = 'btn btn-sm';
      button.textContent = 'Get AI Review';
      button.onclick = async () => {

        button.textContent = 'Analyzing...';
        button.disabled = true;
        
        try {
          createFeedbackPanel();
          const files = await extractDiffContent();
          displayFeedback(files);
        } catch (error) {
          console.error('Error during analysis:', error);
          const content = document.getElementById('ai-feedback-content');
          if (content) {
            content.innerHTML = `<div style="color: red">Error: ${error.message}</div>`;
          }
        } finally {
          button.textContent = 'Get AI Review';
          button.disabled = false;
        }
      };
      headerActions.appendChild(button);
      obs.disconnect(); 
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document, { childList: true, subtree: true });
}

// Initialize when page loads and when URL changes
function initialize() {
  addExtractButton();
}

// Listen for page loads
initialize();

// Listen for URL changes (for single-page app navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    initialize();
  }
}).observe(document, { subtree: true, childList: true });