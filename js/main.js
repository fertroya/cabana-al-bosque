document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHeroSlider();
  initFaq();
  initGalleryCarousel();
  initGalleryFilters();
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

  const images = hero.dataset.slides.split(",");
  const slides = hero.querySelectorAll(".hero-slide");
  const bg = hero.querySelector(".hero-bg");
  const prev = hero.querySelector(".hero-prev");
  const next = hero.querySelector(".hero-next");
  let current = 0;

  function show(index) {
    current = (index + slides.length) % slides.length;
    bg.style.backgroundImage = `url('${images[current] || images[0]}')`;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === current);
    });
  }

  show(0);
  if (slides.length > 1) {
    setInterval(() => show(current + 1), 7000);
  }

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

function initGalleryCarousel() {
  const carousel = document.querySelector(".gallery-carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".gallery-carousel-track");
  const slides = [...carousel.querySelectorAll(".gallery-carousel-slide")];
  const prev = carousel.querySelector(".gallery-carousel-prev");
  const next = carousel.querySelector(".gallery-carousel-next");
  const dotsWrap = carousel.querySelector(".gallery-carousel-dots");
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "gallery-carousel-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `Ir a diapositiva ${i + 1}`);
    dot.addEventListener("click", () => goTo(i, true));
    dotsWrap?.appendChild(dot);
  });

  const dots = dotsWrap ? [...dotsWrap.querySelectorAll(".gallery-carousel-dot")] : [];

  function goTo(index, pauseAuto) {
    current = (index + slides.length) % slides.length;
    const slide = slides[current];
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
    if (pauseAuto) resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 6000);
  }

  prev?.addEventListener("click", () => goTo(current - 1, true));
  next?.addEventListener("click", () => goTo(current + 1, true));

  track.addEventListener("scroll", () => {
    const midpoint = track.scrollLeft + track.clientWidth / 2;
    const nearest = slides.reduce((best, slide, i) => {
      const center = slide.offsetLeft + slide.clientWidth / 2;
      return Math.abs(center - midpoint) < Math.abs(best.dist) ? { i, dist: center - midpoint } : best;
    }, { i: 0, dist: Infinity });
    if (nearest.i !== current) {
      current = nearest.i;
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
    }
  }, { passive: true });

  resetTimer();
}

function initGalleryFilters() {
  const filters = document.querySelectorAll(".gallery-filter");
  const items = document.querySelectorAll(".gallery-item");
  if (!filters.length || !items.length) return;

  function applyFilter(filter) {
    filters.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    });

    items.forEach((item) => {
      const match = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("is-hidden", !match);
    });

    if (filter !== "all") {
      history.replaceState(null, "", `#${filter}`);
    } else {
      history.replaceState(null, "", location.pathname);
    }
  }

  filters.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  const hash = location.hash.replace("#", "");
  if (hash && [...filters].some((btn) => btn.dataset.filter === hash)) {
    applyFilter(hash);
  }
}

function initGallery() {
  const loadBtn = document.querySelector(".load-more");
  if (!loadBtn) return;

  const items = document.querySelectorAll(".gallery-card");
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
    if (shown >= items.length) loadBtn.style.display = "none";
  });
}

function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const img = lightbox.querySelector("img");
  const caption = lightbox.querySelector(".lightbox-caption");
  const counter = lightbox.querySelector(".lightbox-counter");
  const close = lightbox.querySelector(".lightbox-close");
  const prev = lightbox.querySelector(".lightbox-prev");
  const next = lightbox.querySelector(".lightbox-next");

  const triggers = [
    ...document.querySelectorAll(".gallery-item-btn"),
    ...document.querySelectorAll(".gallery-thumb"),
  ];

  if (!triggers.length) return;

  function getActiveTriggers() {
    return triggers.filter((el) => {
      const item = el.closest(".gallery-item");
      return !item || !item.classList.contains("is-hidden");
    });
  }

  function buildSources(list) {
    return list.map((el) => {
      const image = el.tagName === "IMG" ? el : el.querySelector("img");
      return {
        src: image?.src || "",
        alt: image?.alt || "",
        caption: el.dataset.caption || image?.alt || "",
      };
    });
  }

  let sources = buildSources(getActiveTriggers());
  let index = 0;

  function render(i) {
    sources = buildSources(getActiveTriggers());
    if (!sources.length) return;
    index = ((i % sources.length) + sources.length) % sources.length;
    const item = sources[index];
    img.src = item.src;
    img.alt = item.alt;
    if (caption) caption.textContent = item.caption;
    if (counter) counter.textContent = `${index + 1} / ${sources.length}`;
    lightbox.setAttribute("aria-hidden", "false");
  }

  function openFromTrigger(trigger) {
    sources = buildSources(getActiveTriggers());
    const start = sources.findIndex((item) => item.src === trigger.querySelector("img")?.src);
    render(start >= 0 ? start : 0);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLb() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openFromTrigger(trigger));
  });

  close?.addEventListener("click", closeLb);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLb();
  });

  prev?.addEventListener("click", (e) => {
    e.stopPropagation();
    render((index - 1 + sources.length) % sources.length);
  });

  next?.addEventListener("click", (e) => {
    e.stopPropagation();
    render((index + 1) % sources.length);
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") render((index - 1 + sources.length) % sources.length);
    if (e.key === "ArrowRight") render((index + 1) % sources.length);
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
