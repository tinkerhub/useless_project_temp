// Shared hamburger menu — included on every page.
(function () {
  const toggleBtn = document.getElementById("navToggle");
  const menu = document.getElementById("siteMenu");
  const backdrop = document.getElementById("siteMenuBackdrop");
  const closeBtn = document.getElementById("navCloseBtn");
  if (!toggleBtn || !menu || !backdrop) return;

  function openMenu() {
    menu.classList.add("open");
    backdrop.classList.add("open");
    toggleBtn.classList.add("open");
  }
  function closeMenu() {
    menu.classList.remove("open");
    backdrop.classList.remove("open");
    toggleBtn.classList.remove("open");
  }

  toggleBtn.addEventListener("click", () => {
    menu.classList.contains("open") ? closeMenu() : openMenu();
  });
  backdrop.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
})();
