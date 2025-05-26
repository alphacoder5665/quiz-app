// Main Entry Point

import { goHome, showSection } from "./nav.js";
import { toggleTheme, initTheme } from "./theme.js";
import { handleFormSubmit } from "./formHandler.js";
import {
  handleCategoryClick,
  updateCategoryCounts,
} from "./categoryHandler.js";
import { handleKeyPress } from "./utils.js";

// Setup global DOM events
document.addEventListener("DOMContentLoaded", () => {
  // Initial UI state
  goHome();
  updateCategoryCounts();
  initTheme();

  // Theme toggle button
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);

  // Quiz form submission
  const form = document.getElementById("quiz-form");
  if (form) form.addEventListener("submit", handleFormSubmit);

  // Category click (left nav)
  const categoryList = document.getElementById("category-list");
  if (categoryList) categoryList.addEventListener("click", handleCategoryClick);

  // Explanation live preview
  const explanationInput = document.getElementById("explanation");
  if (explanationInput) {
    explanationInput.addEventListener("input", (e) => {
      import("./utils.js").then(({ formatExplanation }) => {
        const html = formatExplanation(e.target.value);
        document.getElementById("preview-content").innerHTML = html;
      });
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyPress);

  // Before leaving
  window.addEventListener("beforeunload", (e) => {
    const questionInput = document.getElementById("question");
    if (
      questionInput &&
      questionInput.value.trim().length > 0 &&
      !window.editMode
    ) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
});
