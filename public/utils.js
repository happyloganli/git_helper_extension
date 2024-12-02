const utils = {
    escapeHtml: function(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    },
    
    formatMarkdown: function(text) {
      text = this.escapeHtml(text);
      
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
  };
  
  window.utils = utils;