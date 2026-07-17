// Public animals listing — Huellas que Esperan
import {
  db,
  ANIMALS_COLLECTION,
  collection,
  getDocs,
} from "./firebase-config.js";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80";

let allAnimals = [];
let currentFilter = "todos";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAnimalCard(animal, index) {
  const tipo = (animal.tipo || "perro").toLowerCase();
  const img = animal.imagen || PLACEHOLDER_IMG;
  const delay = Math.min(index * 0.06, 0.4);

  return `
    <article class="animal-card" style="animation-delay: ${delay}s" data-id="${escapeHtml(animal.id)}" data-tipo="${escapeHtml(tipo)}">
      <div class="animal-img-wrap">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(animal.nombre)}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'" />
        <span class="animal-badge ${escapeHtml(tipo)}">${escapeHtml(tipo)}</span>
      </div>
      <div class="animal-body">
        <h3>${escapeHtml(animal.nombre)}</h3>
        <div class="animal-meta">
          ${animal.edad ? `<span>🎂 ${escapeHtml(animal.edad)}</span>` : ""}
          ${animal.sexo ? `<span>⚧ ${escapeHtml(animal.sexo)}</span>` : ""}
          ${animal.tamaño ? `<span>📏 ${escapeHtml(animal.tamaño)}</span>` : ""}
        </div>
        <p>${escapeHtml(animal.descripcion || "Un compañero especial esperando un hogar lleno de amor.")}</p>
        <button type="button" class="btn btn-primary btn-sm btn-ver-mas" data-id="${escapeHtml(animal.id)}">
          Conocerme 🐾
        </button>
      </div>
    </article>
  `;
}

function renderAnimals(animals) {
  const grid = document.getElementById("animals-grid");
  if (!grid) return;

  const visibles = animals.filter(
    (a) => !a.estado || a.estado === "disponible" || a.estado === "reservado"
  );

  const filtered =
    currentFilter === "todos"
      ? visibles
      : visibles.filter((a) => (a.tipo || "").toLowerCase() === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <p style="font-size:2.5rem;margin-bottom:0.5rem">🐾</p>
        <p><strong>Por ahora no hay animalitos en esta categoría.</strong></p>
        <p>Volvé pronto — siempre hay nuevas huellas esperando un hogar.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((a, i) => formatAnimalCard(a, i)).join("");

  grid.querySelectorAll(".btn-ver-mas").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
}

function openModal(id) {
  const animal = allAnimals.find((a) => a.id === id);
  if (!animal) return;

  const overlay = document.getElementById("animal-modal");
  const body = document.getElementById("modal-content");
  if (!overlay || !body) return;

  const tipo = (animal.tipo || "perro").toLowerCase();
  const img = animal.imagen || PLACEHOLDER_IMG;

  body.innerHTML = `
    <img class="modal-img" src="${escapeHtml(img)}" alt="${escapeHtml(animal.nombre)}" onerror="this.src='${PLACEHOLDER_IMG}'" />
    <div class="modal-body">
      <span class="animal-badge ${escapeHtml(tipo)}" style="position:static;display:inline-block;margin-bottom:0.75rem">${escapeHtml(tipo)}</span>
      <h2>${escapeHtml(animal.nombre)}</h2>
      <div class="animal-meta" style="margin-bottom:1rem">
        ${animal.edad ? `<span>🎂 ${escapeHtml(animal.edad)}</span>` : ""}
        ${animal.sexo ? `<span>⚧ ${escapeHtml(animal.sexo)}</span>` : ""}
        ${animal.tamaño ? `<span>📏 ${escapeHtml(animal.tamaño)}</span>` : ""}
        ${animal.estado ? `<span>📋 ${escapeHtml(animal.estado)}</span>` : ""}
      </div>
      <p style="color:var(--text-muted);margin-bottom:1.25rem;white-space:pre-line">${escapeHtml(animal.descripcion || "")}</p>
      ${
        animal.personalidad
          ? `<p style="margin-bottom:1.25rem"><strong>Personalidad:</strong> ${escapeHtml(animal.personalidad)}</p>`
          : ""
      }
      <a href="contacto.html?adopcion=${encodeURIComponent(animal.nombre)}" class="btn btn-primary">
        Quiero adoptarlo/a 💕
      </a>
    </div>
  `;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("animal-modal");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function sortByCreatedAt(animals) {
  return [...animals].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
    return tb - ta;
  });
}

/** Carga TODOS los documentos (sin orderBy: evita ocultar docs sin createdAt). */
async function fetchAllAnimals() {
  const snap = await getDocs(collection(db, ANIMALS_COLLECTION));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return sortByCreatedAt(list);
}

async function loadAnimals() {
  const grid = document.getElementById("animals-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Cargando huellitas...</p>
    </div>
  `;

  try {
    allAnimals = await fetchAllAnimals();
    console.log(`[Huellas] ${allAnimals.length} animal(es) desde Firestore`);
    renderAnimals(allAnimals);
  } catch (e) {
    console.error("Error cargando animales:", e);
    grid.innerHTML = `
      <div class="empty-state">
        <p><strong>No pudimos cargar los animalitos.</strong></p>
        <p>Revisá la conexión, que el sitio corra en un servidor local (no file://), y las reglas de Firestore.</p>
        <p style="font-size:0.85rem;margin-top:0.75rem;opacity:0.8">${escapeHtml(e.code || "")} ${escapeHtml(e.message || "")}</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Filters
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter || "todos";
      renderAnimals(allAnimals);
    });
  });

  // Modal close
  const overlay = document.getElementById("animal-modal");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest(".modal-close")) {
        closeModal();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  // Prefill contact if coming from adoption
  const params = new URLSearchParams(window.location.search);
  const adopcion = params.get("adopcion");
  if (adopcion) {
    const asunto = document.getElementById("asunto");
    const mensaje = document.getElementById("mensaje");
    if (asunto) asunto.value = "adopcion";
    if (mensaje) {
      mensaje.value = `Hola, me interesa adoptar a ${adopcion}. ¿Podrían darme más información?`;
    }
  }

  if (document.getElementById("animals-grid")) {
    loadAnimals();
  }

  // Home preview: few animals
  if (document.getElementById("home-animals-grid")) {
    loadHomePreview();
  }
});

async function loadHomePreview() {
  const grid = document.getElementById("home-animals-grid");
  if (!grid) return;

  try {
    const animals = await fetchAllAnimals();
    const disponibles = animals
      .filter((a) => !a.estado || a.estado === "disponible")
      .slice(0, 3);

    if (!disponibles.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Pronto habrá nuevas huellas esperando un hogar. ¡Seguinos!</p>
          <p style="margin-top:0.5rem;font-size:0.9rem">
            Si sos admin, agregá animalitos desde el
            <a href="admin/login.html" style="color:var(--mint-deep);font-weight:700">panel</a>.
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = disponibles.map((a, i) => formatAnimalCard(a, i)).join("");
    grid.querySelectorAll(".btn-ver-mas").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = `adopcion.html`;
      });
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = `
      <div class="empty-state">
        <p>Visitá <a href="adopcion.html" style="color:var(--mint-deep);font-weight:700">Huellas que Esperan</a> para ver a nuestros rescatados.</p>
        <p style="font-size:0.85rem;margin-top:0.5rem;opacity:0.8">${escapeHtml(e.message || "")}</p>
      </div>
    `;
  }
}
