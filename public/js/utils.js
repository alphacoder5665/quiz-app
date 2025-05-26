// Utilities

// Format explanation text with markdown-style code blocks (``` syntax)
export function formatExplanation(explanation) {
    const parts = explanation.split(/```/g);
    let html = "";
  
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
      	// Code block
        html += `<pre><code>${part.trim()}</code></pre>`;
      } else {
      	// Paragraph block
        const wrapped = part
          .trim()
          .split("\n")
          .map((line) => `<p>${line}</p>`)
          .join("");
        html += wrapped;
      }
    });
  
    return html;
  }
  
  // Handle keyboard shortcuts: 1/A, 2/B, etc.
  export function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    const keyMap = {
      1: 0,
      a: 0,
      2: 1,
      b: 1,
      3: 2,
      c: 2,
      4: 3,
      d: 3,
    };
  
    if (key in keyMap) {
      const index = keyMap[key];
      const opt = document.querySelectorAll(".quiz-option")[index];
      if (opt) opt.click();
    }
  }
  
