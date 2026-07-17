// Shared UI: nav mobile, reveal animations, active link
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      links.classList.toggle("open");
      document.body.style.overflow = links.classList.contains("open")
        ? "hidden"
        : "";
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.classList.remove("open");
        links.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  // Active nav link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // Contact form: URL params + client-side feedback
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const params = new URLSearchParams(window.location.search);
    const asuntoParam = params.get("asunto");
    const adopcionParam = params.get("adopcion");
    const asuntoEl = document.getElementById("asunto");
    const mensajeEl = document.getElementById("mensaje");

    if (asuntoParam && asuntoEl) {
      const opt = Array.from(asuntoEl.options).find((o) => o.value === asuntoParam);
      if (opt) asuntoEl.value = asuntoParam;
    }
    if (adopcionParam) {
      if (asuntoEl) asuntoEl.value = "adopcion";
      if (mensajeEl) {
        mensajeEl.value = `Hola, me interesa adoptar a ${adopcionParam}. ¿Podrían darme más información?`;
      }
    }

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = document.getElementById("form-message");
      const nombre = contactForm.nombre?.value?.trim();
      const email = contactForm.email?.value?.trim();
      const mensaje = contactForm.mensaje?.value?.trim();

      if (!nombre || !email || !mensaje) {
        if (msg) {
          msg.className = "form-message error";
          msg.textContent = "Por favor completá todos los campos requeridos.";
        }
        return;
      }

      if (msg) {
        msg.className = "form-message success";
        msg.textContent =
          "¡Gracias por escribirnos! Te contactaremos pronto. 🐾";
      }
      contactForm.reset();
    });
  }
});
