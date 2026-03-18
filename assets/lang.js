const currentLang = document.querySelector(".current-lang");
const selector = document.querySelector(".lang-selector");
  if (currentLang && selector) {
currentLang.addEventListener("click", () => {
    if (selector.classList.contains("active")) {
        selector.classList.remove("active");
    } else {
        selector.classList.add("active");
    };
});
  }