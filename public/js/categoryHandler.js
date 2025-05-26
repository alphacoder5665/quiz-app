// Category Clicks & Badge Updates

import { showSection } from "./nav.js";
import { renderQuestion } from "./quizRenderer.js";
import { getEditMode, setEditMode, clearEditMode } from "./editMode.js";


// Fetch all quizzes from API
export async function getQuizzes() {
  const res = await fetch("/api/quizzes");
  return res.json();
}

// Update badge counts next to each category
export async function updateCategoryCounts() {
  const data = await getQuizzes();

  document.querySelectorAll("#category-list li").forEach((li) => {
    const category = li.dataset.category?.toLowerCase();
    if (!category) return;

    const count = data[category]?.length || 0;
    const badge = li.querySelector(".badge");
    if (badge) {
      badge.textContent = count;
      badge.classList.add("updated");
      setTimeout(() => badge.classList.remove("updated"), 300);
    }
  });
}

// When a category is clicked, show its quizzes
export async function handleCategoryClick(e) {
  const li = e.target.closest("li");
  if (!li || !li.dataset.category) return;

  const category = li.dataset.category.toLowerCase();
  showSection("take");

  const data = await getQuizzes();
  const quizzes = data[category] || [];

  const selectedCategory = document.getElementById("selected-category");
  const questionList = document.getElementById("question-list");
  selectedCategory.innerText = category;
  questionList.innerHTML = "";

  quizzes.forEach((q, i) => {
    const li = document.createElement("li");
    li.textContent = `Q${i + 1}. ${q.question.slice(0, 25)}...`;
    li.addEventListener("click", () => {
      renderQuestion(category, i);
      document
        .querySelectorAll("#question-list li")
        .forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
    });
    questionList.appendChild(li);
  });

  if (quizzes.length) {
    renderQuestion(category, 0);
    document.querySelectorAll("#question-list li")[0]?.classList.add("active");
  } else {
    const quizArea = document.getElementById("quiz-area");
    quizArea.innerHTML = `
      <div class="quiz-question-block">
        <h3>No questions added yet for this category.</h3>
        <p>You can add one using the "Create Quiz" section.</p>
      </div>`;
  }
}
