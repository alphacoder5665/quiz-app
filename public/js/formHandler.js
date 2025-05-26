// Quiz Form Submission & Editing

import { updateCategoryCounts } from "./categoryHandler.js";

let editMode = null;
window.editMode = editMode; // Expose to global scope for external check (beforeunload)

export async function handleFormSubmit(e) {
  e.preventDefault();

  const category = document.getElementById("category").value.trim();
  const question = document.getElementById("question").value.trim();
  const code = document.getElementById("code").value.trim();
  const answers = Array.from(document.querySelectorAll(".answer"))
    .map((a) => a.value.trim())
    .filter(Boolean);
  const correct = parseInt(document.getElementById("correct").value) - 1;
  const explanation = document.getElementById("explanation").value.trim();

  const quiz = { question, answers, correct };
  if (code) quiz.code = code;
  if (explanation) quiz.explanation = explanation;

  if (answers.length < 2) {
    alert("Please provide at least two answer options.");
    return;
  }
  if (correct < 0 || correct >= answers.length) {
    alert(
      "Correct answer index must be within the number of answers provided."
    );
    return;
  }

  if (window.editMode) {
    await fetch("/api/quizzes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: window.editMode.category,
        index: window.editMode.index,
        quiz,
      }),
    });

    alert("Quiz updated!");
    window.editMode = null;
  } else {
    await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, quiz }),
    });

    alert("Quiz saved!");
  }

  updateCategoryCounts();
  document.getElementById("quiz-form").reset();
  document.querySelectorAll(".answer").forEach((a) => (a.value = ""));
  document.getElementById("preview-content").innerHTML = "";
}
