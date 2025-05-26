// Theme Toggler

export function toggleTheme() {
  const current = document.body.dataset.theme;
  const next = current === "dark" ? "light" : "dark";
  document.body.dataset.theme = next;

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = next === "dark" ? "☀️" : "🌙";
  }
}

export function initTheme() {
  document.body.dataset.theme = "light";
}
