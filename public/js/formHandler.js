import { updateCategoryCounts } from "./categoryHandler.js";
import { getEditMode, clearEditMode } from "./editMode.js";

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

  const currentEdit = getEditMode();
  if (currentEdit) {
    await fetch("/api/quizzes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: currentEdit.category,
        index: currentEdit.index,
        quiz,
      }),
    });

    alert("Quiz updated!");
    clearEditMode();
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
