const form = document.querySelector("#workshop-form");
const result = document.querySelector("#result");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.followUp = form.elements.followUp.checked;
  result.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  result.hidden = false;
  result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});
