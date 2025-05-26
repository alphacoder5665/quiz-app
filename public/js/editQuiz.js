import { getQuizzes } from "./categoryHandler.js";
import { showSection } from "./nav.js";
import { setEditMode } from "./editMode.js";

export async function editQuiz(category, index) {
  const data = await getQuizzes();
  const quiz = data[category][index];

  setEditMode({ category: category.toLowerCase(), index });

  showSection("create");

  document.getElementById("category").value = category.toLowerCase();
  document.getElementById("question").value = quiz.question;
  document.getElementById("correct").value = quiz.correct + 1;

  document.querySelectorAll(".answer").forEach((el, i) => {
    el.value = quiz.answers[i] || "";
  });

  document.getElementById("code").value = quiz.code || "";
  document.getElementById("explanation").value = quiz.explanation || "";

  document.getElementById("category").focus();
}
