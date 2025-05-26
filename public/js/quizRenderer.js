// 📄 public/js/quizRenderer.js

import { getQuizzes, updateCategoryCounts } from "./categoryHandler.js";
import { formatExplanation } from "./utils.js";
import { editQuiz } from "./editQuiz.js";

let quizTimer = null;

export async function renderQuestion(category, index) {
  const data = await getQuizzes();
  const quiz = data[category][index];
  const total = data[category].length;
  const quizArea = document.getElementById("quiz-area");

  quizArea.style.opacity = 0;

  setTimeout(() => {
    quizArea.innerHTML = `
      <div class="progress-bar">Question ${index + 1} of ${total}</div>
      <div class="quiz-question-block">
        <div id="question-timer" class="timer">⏱️ Time Left: <span id="time-left">30</span>s</div>
        <div class="timer-bar"><div class="timer-fill"></div></div>
        <h3>Q${index + 1}. ${quiz.question}</h3>
        ${quiz.code ? `<pre><code>${quiz.code}</code></pre>` : ""}
        <div class="quiz-options">
          ${quiz.answers
            .map(
              (a, i) => `
            <div class="quiz-option" data-index="${i}">
              ${String.fromCharCode(65 + i)}. ${a}
            </div>`
            )
            .join("")}
        </div>
        ${
          quiz.explanation
            ? `
          <div class="explanation-block" style="display:none;">
            <strong>Reason/Explanation:</strong>
            ${formatExplanation(quiz.explanation)}
          </div>`
            : ""
        }
        <div class="question-actions">
          <button data-edit>✏️ Edit</button>
          <button data-delete>🗑️ Delete</button>
        </div>
      </div>
    `;

    setupAnswerHandlers(quiz.correct);
    setupActionButtons(category, index);
    startTimer(() => autoReveal(category, index, quiz.correct));

    quizArea.style.opacity = 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 100);
}

function setupAnswerHandlers(correct) {
  document.querySelectorAll(".quiz-option").forEach((opt, i) => {
    opt.addEventListener("click", () => revealAnswer(opt, i, correct));
  });
}

function setupActionButtons(category, index) {
  document
    .querySelector("[data-edit]")
    ?.addEventListener("click", () => editQuiz(category, index));
  document
    .querySelector("[data-delete]")
    ?.addEventListener("click", () => deleteQuiz(category, index));
}

function startTimer(callback) {
  let time = 30;
  const el = document.getElementById("time-left");
  const fill = document.querySelector(".timer-fill");
  if (el) el.innerText = time;

  if (quizTimer) clearInterval(quizTimer);

  quizTimer = setInterval(() => {
    time--;
    if (el) el.innerText = time;
    if (fill) fill.style.width = `${(time / 30) * 100}%`;

    if (time <= 0) {
      clearInterval(quizTimer);
      callback();
    }
  }, 1000);
}

function revealAnswer(el, selected, correct) {
  const options = el.parentElement.querySelectorAll(".quiz-option");
  if (quizTimer) clearInterval(quizTimer);

  // 1. Mark selected first
  options.forEach((opt) =>
    opt.classList.remove("selected", "correct", "wrong")
  );
  options[selected]?.classList.add("selected");

  // 2. Then after short delay, reveal
  setTimeout(() => {
    options.forEach((opt, i) => {
      opt.classList.remove("selected");
      if (i === correct) {
        opt.classList.add("correct");
      } else if (i === selected) {
        opt.classList.add("wrong");
      }
      opt.style.pointerEvents = "none";
    });

    const questionBlock = el.closest(".quiz-question-block");
    const explanationBlock = questionBlock?.querySelector(".explanation-block");
    if (explanationBlock) explanationBlock.style.display = "block";
  }, 300);
}


export async function deleteQuiz(category, index) {
  const confirmDelete = confirm("Are you sure you want to delete this quiz?");
  if (!confirmDelete) return;

  const res = await fetch("/api/quizzes/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, index }),
  });

  if (res.ok) {
    alert("Quiz deleted.");
    updateCategoryCounts();
    location.reload();
  }
}

export function autoReveal(category, index, correct) {
  const options = document.querySelectorAll(".quiz-option");

  options.forEach((opt, i) => {
    opt.classList.remove("correct", "wrong");
    if (i === correct) {
      opt.classList.add("correct");
    } else {
      opt.classList.add("wrong");
    }
    opt.style.pointerEvents = "none";
  });

  const explanationBlock = document.querySelector(".explanation-block");
  if (explanationBlock) explanationBlock.style.display = "block";
}
