const form = document.getElementById("quiz-form");
const quizArea = document.getElementById("quiz-area");
const categoryList = document.getElementById("category-list");

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

  const quiz = {
    question,
    answers,
    correct,
    code: code || null,
    explanation: explanation || null,
  };

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

  const category = e.target.dataset.category.toUpperCase();

  // 👇 Jump to take quiz layout
  showSection("take");

  const res = await fetch("/api/quizzes");
  const data = await res.json();
  const quizzes = data[category] || [];
  //   const quizzes = (data[category] || []).slice().reverse(); // newest first

  document.getElementById("selected-category").innerText = category;
  const questionList = document.getElementById("question-list");
  questionList.innerHTML = quizzes
    .map(
      (q, i) =>
        `<li onclick="renderQuestion('${category}', ${i})">Q${
          i + 1
        }. ${q.question.slice(0, 25)}...</li>`
    )
    .join("");

  if (quizzes.length) renderQuestion(category, 0);
});

function renderQuestion(category, index) {
  fetch("/api/quizzes")
    .then((res) => res.json())
    .then((data) => {
      const quiz = data[category][index];
      quizArea.innerHTML = `
      <div class="quiz-question-block">
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
    
        <button onclick="deleteQuiz('${category}', ${index})">🗑️ Delete</button> 
      </div>
    `;
    
    });
}

function revealAnswer(el, selected, correct) {
  const options = el.parentElement.querySelectorAll(".quiz-option");

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

// Initial state: show home screen only
goHome();
