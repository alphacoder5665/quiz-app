// Load Quiz for Editing

import { getQuizzes } from "./categoryHandler.js";
import { showSection } from "./nav.js";

export async function editQuiz(category, index) {
  const data = await getQuizzes();
  const quiz = data[category][index];

  // Store current edit context globally
  window.editMode = { category: category.toLowerCase(), index };

  // Show form section
  showSection("create");

  // Populate form
  document.getElementById("category").value = category.toLowerCase();
  document.getElementById("question").value = quiz.question;
  document.getElementById("correct").value = quiz.correct + 1;

  document.querySelectorAll(".answer").forEach((el, i) => {
    el.value = quiz.answers[i] || "";
  });

  document.getElementById("code").value = quiz.code || "";
  document.getElementById("explanation").value = quiz.explanation || "";

  // Focus first input
  document.getElementById("category").focus();
}
