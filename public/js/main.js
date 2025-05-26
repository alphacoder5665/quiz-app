import { goHome, showSection } from "./nav.js";
import { toggleTheme, initTheme } from "./theme.js";
import { handleFormSubmit } from "./formHandler.js";
import {
  handleCategoryClick,
  updateCategoryCounts,
} from "./categoryHandler.js";
import { handleKeyPress, formatExplanation } from "./utils.js";
import { getEditMode } from "./editMode.js";

window.goHome = goHome;
window.showSection = showSection;
window.toggleTheme = toggleTheme;

document.addEventListener("DOMContentLoaded", () => {
  goHome();
  updateCategoryCounts();
  initTheme();

  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  document
    .getElementById("quiz-form")
    ?.addEventListener("submit", handleFormSubmit);
  document
    .getElementById("category-list")
    ?.addEventListener("click", handleCategoryClick);

  const explanationInput = document.getElementById("explanation");
  if (explanationInput) {
    explanationInput.addEventListener("input", (e) => {
      const html = formatExplanation(e.target.value);
      document.getElementById("preview-content").innerHTML = html;
    });
  }

  document.addEventListener("keydown", handleKeyPress);

  window.addEventListener("beforeunload", (e) => {
    const questionInput = document.getElementById("question");
    if (
      questionInput &&
      questionInput.value.trim().length > 0 &&
      !getEditMode()
    ) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
});
