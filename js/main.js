document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHeroSlider();
  initFaq();
  initGallery();
  initLightbox();
  initScrollTop();
});

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.setAttribute(
      "aria-expanded",
      nav.classList.contains("open") ? "true" : "false"
    );
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function initHeroSlider() {
  const hero = document.querySelector(".hero[data-slides]");
  if (!hero) return;

  const slides = hero.dataset.slides.split(",");
  let current = 0;
  const bg = hero.querySelector(".hero-bg");
  const prev = hero.querySelector(".hero-prev");
  const next = hero.querySelector(".hero-next");

  function show(index) {
    current = (index + slides.length) % slides.length;
    bg.style.backgroundImage = `url('${slides[current]}')`;
  }

  show(0);
  setInterval(() => show(current + 1), 6000);

  prev?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));
}

function initFaq() {
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });
}

function initGallery() {
  const grid = document.querySelector(".gallery-grid");
  const loadBtn = document.querySelector(".load-more");
  if (!grid || !loadBtn) return;

  const items = grid.querySelectorAll(".gallery-item");
  const batch = 6;
  let shown = batch;

  items.forEach((item, i) => {
    if (i >= shown) item.classList.add("hidden");
  });

  if (items.length <= batch) {
    loadBtn.style.display = "none";
    return;
  }

  loadBtn.addEventListener("click", () => {
    for (let i = shown; i < shown + batch && i < items.length; i++) {
      items[i].classList.remove("hidden");
    }
    shown += batch;
    if (shown >= items.length) {
      loadBtn.style.display = "none";
    }
  });
}

function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const img = lightbox.querySelector("img");
  const close = lightbox.querySelector(".lightbox-close");
  const prev = lightbox.querySelector(".lightbox-prev");
  const next = lightbox.querySelector(".lightbox-next");
  const sources = [...document.querySelectorAll(".gallery-item img")].map(
    (el) => el.src
  );
  let index = 0;

  function open(i) {
    index = i;
    img.src = sources[index];
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLb() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".gallery-item").forEach((item, i) => {
    item.addEventListener("click", () => open(i));
  });

  close?.addEventListener("click", closeLb);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLb();
  });

  prev?.addEventListener("click", (e) => {
    e.stopPropagation();
    open((index - 1 + sources.length) % sources.length);
  });

  next?.addEventListener("click", (e) => {
    e.stopPropagation();
    open((index + 1) % sources.length);
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") open((index - 1 + sources.length) % sources.length);
    if (e.key === "ArrowRight") open((index + 1) % sources.length);
  });
}

function initScrollTop() {
  const btn = document.querySelector(".scroll-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
