function createFeedbackPanel() {
  if (!document.getElementById('ai-feedback-panel')) {
    const panel = document.createElement('div');
    panel.id = 'ai-feedback-panel';
    panel.style.cssText = `
      position: fixed;
      right: 0;
      top: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 1px solid #e1e4e8;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      z-index: 9999;
      overflow-y: auto;
      padding: 20px;
      transition: transform 0.3s ease;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      right: 10px;
      top: 10px;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 50%;
      background: #f6f8fa;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #57606a;
      transition: background-color 0.2s;
      padding: 0;
      line-height: 1;
    `;

    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#e1e4e8';
    };
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = '#f6f8fa';
    };

    const iconContainer = document.createElement('div');
    iconContainer.id = 'ai-feedback-icon';
    iconContainer.style.cssText = `
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      background: white;
      border: 1px solid #d0d7de;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      z-index: 10000;
      display: none;
      justify-content: center;
      align-items: center;
      font-size: 20px;
    `;
    iconContainer.innerHTML = `<img src="${chrome.runtime.getURL("icon48.png")}" alt="icon" style="width: 48px; height: 48px;">`;
    
    iconContainer.onmouseover = () => {
      iconContainer.style.transform = 'translateY(-50%) scale(1.1)';
    };
    iconContainer.onmouseout = () => {
      iconContainer.style.transform = 'translateY(-50%) scale(1)';
    };

    let isPanelExpanded = true;
    
    const togglePanel = () => {
      isPanelExpanded = !isPanelExpanded;
      if (isPanelExpanded) {
        panel.style.transform = 'translateX(0)';
        iconContainer.style.display = 'none';
      } else {
        panel.style.transform = 'translateX(100%)';
        setTimeout(() => {
          iconContainer.style.display = 'flex';
        }, 300);
      }
    };

    closeButton.onclick = () => {
      isPanelExpanded = false;
      panel.style.transform = 'translateX(100%)';
      setTimeout(() => {
        iconContainer.style.display = 'flex';
      }, 300);
    };

    iconContainer.onclick = () => {
      isPanelExpanded = true;
      panel.style.transform = 'translateX(0)';
      iconContainer.style.display = 'none';
    };

    const content = document.createElement('div');
    content.id = 'ai-feedback-content';
    content.style.marginTop = '40px'; 
    panel.appendChild(closeButton);
    panel.appendChild(content);
    
    document.body.appendChild(iconContainer);
    document.body.appendChild(panel);

    return content;
  }
  return document.getElementById('ai-feedback-content');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
}

function formatMarkdown(text) {

  text = escapeHtml(text);
  
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\d\. (.*$)/gm, '<ol><li>$1</li></ol>')
    .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
    .replace(/`(.*?)`/g, '<code style="background-color: #f6f8fa; padding: 2px 4px; border-radius: 3px;">$1</code>')
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

function displayError(message) {
  const content = document.getElementById('ai-feedback-content');
  if (content) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      padding: 16px;
      margin: 16px 0;
      color: #cf222e;
      background-color: #ffebe9;
      border: 1px solid #ff8182;
      border-radius: 6px;
      font-size: 14px;
    `;
    errorDiv.textContent = message;
    content.innerHTML = '';
    content.appendChild(errorDiv);
  }
}

function displayLoading() {
  const content = document.getElementById('ai-feedback-content');
  if (content) {
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      padding: 16px;
      margin: 16px 0;
      color: #0969da;
      background-color: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 14px;
      text-align: center;
    `;
    loadingDiv.innerHTML = `
      <div style="margin-bottom: 8px;"> The AI helper is analysing, please wait...</div>
    `;
    content.innerHTML = '';
    content.appendChild(loadingDiv);
  }
}

async function getAIFeedback(originalCode, currentCode) {
  const { available } = await ai.languageModel.capabilities();
  if (available === "no") {
    throw new Error("AI model not available");
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
  if (diffEntries.length === 0) {
    throw new Error("No code changes found to analyze");
  }

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
    
    try {
      const aiFeedback = await getAIFeedback(originalText, currentText);
      filesContent.push({
        fileName: filePath,
        originalCode: originalText,
        currentCode: currentText,
        feedback: aiFeedback
      });
    } catch (error) {
      throw new Error(`Error analyzing ${filePath}: ${error.message}`);
    }
  }

  return filesContent;
}

function checkSplitMode() {
  const splitRadio = document.querySelector('input[type="radio"][value="split"]');
  return splitRadio && splitRadio.checked;
}

function addExtractButton() {
  const observer = new MutationObserver((mutations, obs) => {
    const headerActions = document.querySelector('.ml-2.hide-sm.hide-md');
    if (headerActions && !document.getElementById('extract-diff-btn')) {
      const button = document.createElement('button');
      button.id = 'extract-diff-btn';
      button.className = 'btn btn-sm';
      button.textContent = 'Get AI Review';
      button.onclick = async () => {
        const content = createFeedbackPanel();
        
        if (!checkSplitMode()) {
          displayError("Please click the setting button on the left side of get AI review button, and choose split mode, this reviewer can only work under split mode");
          return;
        }

        button.textContent = 'Analyzing...';
        button.disabled = true;
        displayLoading();
        
        try {
          const files = await extractDiffContent();
          displayFeedback(files);
        } catch (error) {
          console.error('Error during analysis:', error);
          displayError(error.message);
        } finally {
          button.textContent = 'Get AI Review';
          button.disabled = false;
        }
      };
      headerActions.appendChild(button);
      obs.disconnect(); 
    }
  });

  observer.observe(document, { childList: true, subtree: true });
}

function initialize() {
  addExtractButton();
}

initialize();

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    initialize();
  }
}).observe(document, { subtree: true, childList: true });