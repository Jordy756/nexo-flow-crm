import Lenis from "lenis";

let lenis: Lenis | undefined;

document.addEventListener("astro:page-load", () => {
  if (lenis) lenis.destroy();

  lenis = new Lenis({
    autoRaf: true,
  });
});
