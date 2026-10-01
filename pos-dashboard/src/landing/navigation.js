export function goTo(id) {
  const target = document.getElementById(id);
  if (!target) return;

  if (window.__lenis) {
    window.__lenis.scrollTo(target, { offset: -56 });
  } else {
    target.scrollIntoView({ behavior: "smooth" });
  }
}
