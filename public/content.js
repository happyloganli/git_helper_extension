function createFeedbackPanel() {
  if (!document.getElementById('ai-feedback-panel')) {
    const panel = document.createElement('div');
    panel.id = 'ai-feedback-panel';

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';

    const iconContainer = document.createElement('div');
    iconContainer.id = 'ai-feedback-icon';
    iconContainer.innerHTML = `<img src="${chrome.runtime.getURL("icon48.png")}" alt="icon" style="width: 48px; height: 48px;">`;
    
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
    
    panel.appendChild(closeButton);
    panel.appendChild(content);
    
    document.body.appendChild(iconContainer);
    document.body.appendChild(panel);

    return content;
  }
  return document.getElementById('ai-feedback-content');
}

function displayFeedback(files) {
  const content = document.getElementById('ai-feedback-content');
  content.innerHTML = '';

  files.forEach(file => {
    const fileSection = document.createElement('div');
    fileSection.className = 'file-section';

    const fileName = document.createElement('h3');
    fileName.className = 'file-name';
    fileName.textContent = file.fileName;

    const feedback = document.createElement('div');
    feedback.className = 'feedback-content';
    feedback.innerHTML = utils.formatMarkdown(file.feedback);

    fileSection.appendChild(fileName);
    fileSection.appendChild(feedback);
    content.appendChild(fileSection);
  });
}

function displayError(message) {
  const content = document.getElementById('ai-feedback-content');
  if (content) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    content.innerHTML = '';
    content.appendChild(errorDiv);
  }
}

function displayLoading() {
  const content = document.getElementById('ai-feedback-content');
  if (content) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = `<div>The AI helper is analysing, please wait...</div>`;
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