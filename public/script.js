const form = document.getElementById("quiz-form");
const quizArea = document.getElementById("quiz-area");
const categoryList = document.getElementById("category-list");

async function getQuizzes() {
  const res = await fetch("/api/quizzes");
  return res.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = document.getElementById("category").value;
  const question = document.getElementById("question").value;
  const code = document.getElementById("code").value;
  const answers = Array.from(document.querySelectorAll(".answer"))
    .map((a) => a.value)
    .filter(Boolean);
  const correct = parseInt(document.getElementById("correct").value) - 1; // 1-based input
  const explanation = document.getElementById("explanation").value;

  const quiz = { question, answers, correct };
  if (code.trim()) quiz.code = code;
  if (explanation.trim()) quiz.explanation = explanation;

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

  if (editMode) {
    await fetch("/api/quizzes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: editMode.category.toLowerCase(),
        index: editMode.index,
        quiz,
      }),
    });

    alert("Quiz updated!");
    editMode = null;
    form.reset();
    document.querySelectorAll(".answer").forEach((a) => (a.value = ""));
    return;
  }

  await fetch("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, quiz }),
  });

  alert("Quiz saved!");
  form.reset();
  document.querySelectorAll(".answer").forEach((a) => (a.value = ""));
});

categoryList.addEventListener("click", async (e) => {
  if (e.target.tagName !== "LI") return;

  const category = e.target.dataset.category.toLowerCase();

  // 👇 Jump to take quiz layout
  showSection("take");
  const data = await getQuizzes();
  const quizzes = data[category] || [];
  //   const quizzes = (data[category] || []).slice().reverse(); // newest first

  document.getElementById("selected-category").innerText = category;
  const questionList = document.getElementById("question-list");
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
    document
      .querySelectorAll("#question-list li")
      .forEach((li) => li.classList.remove("active"));
    document.querySelectorAll("#question-list li")[0]?.classList.add("active"); // ✅ USE 0 directly
  }
});

let quizTimer = null;
function renderQuestion(category, index) {
  fetch("/api/quizzes")
    .then((res) => res.json())
    .then((data) => {
      const quiz = data[category][index];
      const total = data[category].length;
      quizArea.innerHTML = `
      <div class="progress-bar">
        Question ${index + 1} of ${total}
      </div>

      <div class="quiz-question-block">
        <div id="question-timer" class="timer">⏱️ Time Left: <span id="time-left">30</span>s</div>
        <h3>Q${index + 1}. ${quiz.question}</h3>
        ${quiz.code ? `<pre><code>${quiz.code}</code></pre>` : ""}
        <div class="quiz-options">
          ${quiz.answers
            .map(
              (a, i) => `
              <div class="quiz-option" onclick="revealAnswer(this, ${i}, ${
                quiz.correct
              })">
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
              <pre>${quiz.explanation}</pre>
            </div>`
            : ""
        }
        <div class="question-actions">
          <button onclick="editQuiz('${category}', ${index})">✏️ Edit</button>
          <button onclick="deleteQuiz('${category}', ${index})">🗑️ Delete</button>
        </div>
      </div>`;

      setTimeout(() => {
        if (quizTimer) clearInterval(quizTimer);
        let time = 30;
        const timerEl = document.getElementById("time-left");
        if (timerEl) timerEl.innerText = time;

        quizTimer = setInterval(() => {
          time--;
          const el = document.getElementById("time-left");
          if (el) el.innerText = time;

          if (time <= 0) {
            clearInterval(quizTimer);
            const correct = data[category][index].correct; // ✅ FIXED
            console.log("⏱️ Time's up! Auto-revealing answer...");
            autoReveal(category, index, correct);
          }
        }, 1000);
      }, 100);
    });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function revealAnswer(el, selected, correct) {
  const options = el.parentElement.querySelectorAll(".quiz-option");
  if (quizTimer) clearInterval(quizTimer);

  options.forEach((opt) => opt.classList.remove("selected"));
  options[selected]?.classList.add("selected");

  options.forEach((opt, i) => {
    if (i === correct) {
      opt.style.background = "#c8e6c9"; // green for correct
    } else if (i === selected) {
      opt.style.background = "#ffcdd2"; // red for wrong
    }
    opt.style.pointerEvents = "none"; // prevent more clicks
  });
  const questionBlock = el.closest(".quiz-question-block");
  const explanationBlock = questionBlock
    ? questionBlock.querySelector(".explanation-block")
    : null;
  if (explanationBlock) explanationBlock.style.display = "block";
}

async function deleteQuiz(category, index) {
  const confirmDelete = confirm("Are you sure you want to delete this quiz?");
  if (!confirmDelete) return;

  const res = await fetch("/api/quizzes/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, index }),
  });

  if (res.ok) {
    alert("Quiz deleted.");
    location.reload();
  }
}

let editMode = null; // ⬅️ Track if we’re editing

async function editQuiz(category, index) {
  const data = await getQuizzes();
  const quiz = data[category][index];
  editMode = { category: category.toLowerCase(), index }; // ⬅️ store for PUT

  // Switch to create quiz view
  showSection("create");

  // Pre-fill form
  document.getElementById("category").value = category.toLowerCase();
  document.getElementById("question").value = quiz.question;
  document.getElementById("correct").value = quiz.correct + 1;

  document.querySelectorAll(".answer").forEach((el, i) => {
    el.value = quiz.answers[i] || "";
  });

  document.getElementById("code").value = quiz.code || "";
  document.getElementById("explanation").value = quiz.explanation || "";

  // Scroll to form
  document.getElementById("category").focus();
}

function goHome() {
  document.getElementById("home-screen").style.display = "block";
  document.getElementById("main-container").style.display = "none";
  document.getElementById("create-quiz-screen").style.display = "none";
}

function showSection(name) {
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("main-container").style.display = "none";
  document.getElementById("create-quiz-screen").style.display = "none";

  if (name === "create") {
    document.getElementById("create-quiz-screen").style.display = "block";
  } else if (name === "take") {
    document.getElementById("main-container").style.display = "flex";
  }
}

function autoReveal(category, index, correct) {
  const options = document.querySelectorAll(".quiz-option");

  options.forEach((opt, i) => {
    if (i === correct) {
      opt.style.background = "#c8e6c9"; // green
      opt.classList.add("correct");
    } else {
      opt.style.background = "#ffcdd2"; // red
      opt.classList.add("wrong");
    }
    opt.style.pointerEvents = "none";
  });

  const explanationBlock = document.querySelector(".explanation-block");
  if (explanationBlock) explanationBlock.style.display = "block";
}

// Initial state: show home screen only
goHome();
