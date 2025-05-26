const form = document.getElementById("quiz-form");
const quizArea = document.getElementById("quiz-area");
const categoryList = document.getElementById("category-list");


function formatExplanation(explanation) {
  const parts = explanation.split(/```/g);
  let html = "";

  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      // Code block
      html += `<pre><code>${part.trim()}</code></pre>`;
    } else {
      // Paragraph block
      const wrapped = part
        .trim()
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");
      html += wrapped;
    }
  });

  return html;
}

document.getElementById("explanation").addEventListener("input", (e) => {
  const html = formatExplanation(e.target.value);
  document.getElementById("preview-content").innerHTML = html;
});



async function  getQuizzes() {
  const res = await fetch("/api/quizzes");
  return res.json();
}

async function updateCategoryCounts() {
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
    updateCategoryCounts();

    editMode = null;
    form.reset();
    document.querySelectorAll(".answer").forEach((a) => (a.value = ""));
    document.getElementById("preview-content").innerHTML = "";
    return;
  }

  await fetch("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, quiz }),
  });

  alert("Quiz saved!");
  updateCategoryCounts();
  form.reset();
  document.querySelectorAll(".answer").forEach((a) => (a.value = ""));
  document.getElementById("preview-content").innerHTML = "";

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
    document.querySelectorAll("#question-list li")[0]?.classList.add("active");
  } else {
    quizArea.innerHTML = `
      <div class="quiz-question-block">
        <h3>No questions added yet for this category.</h3>
        <p>You can add one using the "Create Quiz" section.</p>
      </div>`;
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
        <div class="timer-bar"><div class="timer-fill"></div></div>
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
            ${formatExplanation(quiz.explanation)}
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
          const fill = document.querySelector(".timer-fill");
          if (fill) fill.style.width = `${(time / 30) * 100}%`;
          if (el) el.innerText = time;

          if (time <= 0) {
            clearInterval(quizTimer);
            const correct = data[category][index].correct; // ✅ FIXED
            console.log("⏱️ Time's up! Auto-revealing answer...");
            autoReveal(category, index, correct);
          }
        }, 1000);
      }, 100);

      quizArea.style.opacity = 0; // fade out first

      setTimeout(() => {
        const quiz = data[category][index];
        const total = data[category].length;

        quizArea.innerHTML = `
    <div class="progress-bar">Question ${index + 1} of ${total}</div>
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
          ? `<div class="explanation-block" style="display:none;">
               <strong>Reason/Explanation:</strong>
               ${formatExplanation(quiz.explanation)}
             </div>`
          : ""
      }
      <div class="question-actions">
        <button onclick="editQuiz('${category}', ${index})">✏️ Edit</button>
        <button onclick="deleteQuiz('${category}', ${index})">🗑️ Delete</button>
      </div>
    </div>`;

        quizArea.style.opacity = 1; // fade in after injecting content
      }, 100);


    });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function revealAnswer(el, selected, correct) {
  const options = el.parentElement.querySelectorAll(".quiz-option");
  if (quizTimer) clearInterval(quizTimer);

  options.forEach((opt) =>
    opt.classList.remove("selected", "correct", "wrong")
  );
  options[selected]?.classList.add("selected");

  setTimeout(() => {
    options.forEach((opt, i) => {
      opt.classList.remove("selected");
      if (i === correct) {
        opt.classList.add("correct");
      } else if (i === selected) {
        opt.classList.add("wrong");
      }
      opt.style.pointerEvents = "none"; // prevent more clicks
    });

    const questionBlock = el.closest(".quiz-question-block");
    const explanationBlock = questionBlock
      ? questionBlock.querySelector(".explanation-block")
      : null;
    if (explanationBlock) explanationBlock.style.display = "block";
  }, 300);
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
    updateCategoryCounts();

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
  ["home-screen", "main-container", "create-quiz-screen"].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    el.style.display = "none";
  });

  const home = document.getElementById("home-screen");
  home.style.display = "block";
  setTimeout(() => home.classList.remove("hidden"), 50);
}



function showSection(name) {
  ["home-screen", "main-container", "create-quiz-screen"].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    el.style.display = "none";
  });

  const target =
    name === "create"
      ? "create-quiz-screen"
      : name === "take"
      ? "main-container"
      : "home-screen";

  const section = document.getElementById(target);
  section.style.display = name === "take" ? "flex" : "block";

  // ✨ Slight delay to allow transition
  setTimeout(() => section.classList.remove("hidden"), 50);
  // ✅ Auto-load HTML category if "take"
  if (name === "take") {
    document
      .querySelector('#category-list li[data-category="HTML"]')
      ?.click();
  }
}


function autoReveal(category, index, correct) {
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


document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const keyMap = {
    1: 0,
    a: 0,
    2: 1,
    b: 1,
    3: 2,
    c: 2,
    4: 3,
    d: 3,
  };

  if (key in keyMap) {
    const index = keyMap[key];
    const opt = document.querySelectorAll(".quiz-option")[index];
    if (opt) opt.click();
  }
});


function toggleTheme() {
  const current = document.body.dataset.theme;
  const next = current === "dark" ? "light" : "dark";
  document.body.dataset.theme = next;
  document.getElementById("theme-toggle").textContent =
    next === "dark" ? "☀️" : "🌙";
}
document.body.dataset.theme = "light";


window.addEventListener("beforeunload", (e) => {
  const isFormFilled =
    document.getElementById("question").value.trim().length > 0;
  if (isFormFilled && !editMode) {
    e.preventDefault();
    e.returnValue = "";
  }
});




// Initial state: show home screen only
goHome();

updateCategoryCounts(); // ✅ auto badge update on load
