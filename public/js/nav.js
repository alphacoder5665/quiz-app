// Navigation Logic

export function goHome() {
  ["home-screen", "main-container", "create-quiz-screen"].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    el.style.display = "none";
  });

  const home = document.getElementById("home-screen");
  home.style.display = "block";
  setTimeout(() => home.classList.remove("hidden"), 50);
}

export function showSection(name) {
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
    document.querySelector('#category-list li[data-category="HTML"]')?.click();
  }
}
