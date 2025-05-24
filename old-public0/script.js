const form = document.getElementById("quiz-form");
const quizArea = document.getElementById("quiz-area");
const categoryList = document.getElementById("category-list");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = document.getElementById("category").value.toLowerCase(); // ✅ lowercase
  const question = document.getElementById("question").value;
  const code = document.getElementById("code").value;
  const answers = Array.from(document.querySelectorAll(".answer"))
    .map((a) => a.value)
    .filter(Boolean);
  const correct = parseInt(document.getElementById("correct").value) - 1;
  const explanation = document.getElementById("explanation").value;

  const quiz = {
    question,
    answers,
    correct,
    code: code || null,
    explanation: explanation || null,
  };

  const btn = form.querySelector("button");
  btn.disabled = true;
  btn.innerText = "Saving...";

  await fetch("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, quiz }),
  });

  alert("Quiz saved!");
  form.reset();
  document.querySelectorAll(".answer").forEach((a) => (a.value = ""));

  btn.disabled = false;
  btn.innerText = "💾 Save Quiz";
});

categoryList.addEventListener("click", async (e) => {
  if (e.target.tagName !== "LI") return;

  const category = e.target.dataset.category.toLowerCase();
  console.log("Clicked category:", category);

  showSection("take");

  const res = await fetch("/api/quizzes");
  if (!res.ok) {
    console.error("Failed to fetch quizzes", res.status);
    return;
  }
  const data = await res.json();
  console.log("Data from server:", data);

  const quizzes = data[category] || [];
  console.log(`Quizzes for '${category}':`, quizzes);

  if (quizzes.length === 0) {
    const questionList = document.getElementById("question-list");
    questionList.innerHTML =
      '<li style="font-style: italic; color: #888;">No questions added yet.</li>';
    quizArea.innerHTML =
      '<p style="font-style: italic; color: #888;">Please add quizzes to this category.</p>';
    return;
  }

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

  document
    .querySelectorAll("#category-list li")
    .forEach((li) => li.classList.remove("active"));
  e.target.classList.add("active");
});
  

function renderQuestion(category, index) {
  fetch("/api/quizzes")
    .then((res) => res.json())
    .then((data) => {
      const quizList = data[category];
      if (!quizList || !quizList[index]) {
        quizArea.innerHTML =
          "<p style='color: red;'>Quiz not found or has been deleted.</p>";
        return;
      }

      const quiz = quizList[index];
      quizArea.innerHTML = `
      <div class="quiz-question-block">
        <h3>Q${index + 1} of ${quizList.length}: ${quiz.question}</h3>
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
    
        <button onclick="deleteQuiz('${category}', ${index})" title="Delete this quiz">🗑️</button>

      </div>
    `;
    });
}

function revealAnswer(el, selected, correct) {
  const options = el.parentElement.querySelectorAll(".quiz-option");

  options.forEach((opt, i) => {
    const isCorrect = i === correct;
    const isSelected = i === selected;

    if (isCorrect) {
      opt.style.background = "#c8e6c9";
      opt.innerHTML += " ✅";
    } else if (isSelected) {
      opt.style.background = "#ffcdd2";
      opt.innerHTML += " ❌";
    }
    opt.style.pointerEvents = "none";
  });

  const explanationBlock = el
    .closest(".quiz-question-block")
    ?.querySelector(".explanation-block");
  if (explanationBlock) {
    setTimeout(() => {
      explanationBlock.style.display = "block";
      explanationBlock.classList.add("fade-in");
    }, 500);
  }
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
  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("show"));
  document.getElementById("home-screen").style.display = "block";
  document.getElementById("main-container").style.display = "none";
  document.getElementById("create-quiz-screen").style.display = "none";
}

function showSection(name) {
  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("show"));

  document.getElementById("home-screen").style.display =
    name === "home" ? "block" : "none";

  if (name === "create") {
    document.getElementById("create-quiz-screen").classList.add("show");
    document.getElementById("main-container").style.display = "none";
  } else if (name === "take") {
    document.getElementById("create-quiz-screen").classList.remove("show");
    document.getElementById("main-container").classList.add("show");
    document.getElementById("main-container").style.display = "flex";
  }
}

// Initial state: show home screen only
goHome();
