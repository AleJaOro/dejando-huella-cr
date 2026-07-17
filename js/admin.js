// Admin panel — CRUD animales + auth
import {
  auth,
  db,
  ANIMALS_COLLECTION,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "./firebase-config.js";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ========== LOGIN PAGE ========== */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  // If already logged in, go to dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const errEl = document.getElementById("login-error");
    const btn = loginForm.querySelector('button[type="submit"]');

    errEl?.classList.remove("show");
    btn.disabled = true;
    btn.textContent = "Ingresando...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      let msg = "No se pudo iniciar sesión. Verificá tus datos.";
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        msg = "Correo o contraseña incorrectos. Revisá que no haya espacios de más.";
      } else if (err.code === "auth/user-not-found") {
        msg = "Usuario no encontrado. Creá la cuenta en Firebase Authentication.";
      } else if (err.code === "auth/invalid-email") {
        msg = "El correo no es válido.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Demasiados intentos. Esperá un momento.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Sin conexión. Revisá internet o que el sitio no se abra como file://";
      } else if (err.message) {
        msg = err.message;
      }
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add("show");
      }
      btn.disabled = false;
      btn.textContent = "Ingresar al panel";
    }
  });
}

/* ========== DASHBOARD ========== */
const tableBody = document.getElementById("animals-table-body");
if (tableBody) {
  let editingId = null;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const userEl = document.getElementById("admin-user-email");
    if (userEl) userEl.textContent = user.email || "Admin";
    loadTable();
  });

  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  document.getElementById("btn-add")?.addEventListener("click", () => {
    openFormModal();
  });

  document.getElementById("animal-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveAnimal();
  });

  document.getElementById("btn-cancel-form")?.addEventListener("click", closeFormModal);

  document.getElementById("form-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "form-modal" || e.target.closest(".modal-close")) {
      closeFormModal();
    }
  });

  document.getElementById("imagen")?.addEventListener("input", (e) => {
    const prev = document.getElementById("img-preview");
    if (prev && e.target.value) {
      prev.src = e.target.value;
      prev.classList.add("show");
      prev.onerror = () => prev.classList.remove("show");
    } else if (prev) {
      prev.classList.remove("show");
    }
  });

  async function loadTable() {
    tableBody.innerHTML = `
      <tr><td colspan="7" class="empty-admin">
        <div class="spinner" style="margin:0 auto 1rem;width:36px;height:36px;border:3px solid var(--mint);border-top-color:var(--mint-deep);border-radius:50%;animation:spin .8s linear infinite"></div>
        Cargando animales...
      </td></tr>
    `;

    try {
      // Sin orderBy: Firestore oculta docs que no tienen el campo createdAt
      const snap = await getDocs(collection(db, ANIMALS_COLLECTION));
      let animals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      animals.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
        return tb - ta;
      });

      if (!animals.length) {
        tableBody.innerHTML = `
          <tr><td colspan="7">
            <div class="empty-admin">
              <div class="emoji">🐶🐱</div>
              <p><strong>Aún no hay animalitos registrados.</strong></p>
              <p>Hacé clic en “Agregar animalito” para empezar.</p>
            </div>
          </td></tr>
        `;
        return;
      }

      tableBody.innerHTML = animals
        .map(
          (a) => `
        <tr data-id="${escapeHtml(a.id)}">
          <td><img class="animal-thumb" src="${escapeHtml(a.imagen || PLACEHOLDER_IMG)}" alt="" onerror="this.src='${PLACEHOLDER_IMG}'" /></td>
          <td><strong>${escapeHtml(a.nombre)}</strong></td>
          <td><span class="badge-tipo ${escapeHtml((a.tipo || "").toLowerCase())}">${escapeHtml(a.tipo || "—")}</span></td>
          <td>${escapeHtml(a.edad || "—")}</td>
          <td>${escapeHtml(a.sexo || "—")}</td>
          <td><span class="badge-estado ${escapeHtml((a.estado || "disponible").toLowerCase())}">${escapeHtml(a.estado || "disponible")}</span></td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon btn-edit" title="Editar" data-action="edit" data-id="${escapeHtml(a.id)}">✏️</button>
              <button type="button" class="btn-icon btn-delete" title="Eliminar" data-action="delete" data-id="${escapeHtml(a.id)}">🗑️</button>
            </div>
          </td>
        </tr>
      `
        )
        .join("");

      // Store data on rows for edit
      window.__animalsCache = Object.fromEntries(animals.map((a) => [a.id, a]));

      tableBody.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (btn.dataset.action === "edit") {
            openFormModal(window.__animalsCache[id]);
          } else if (btn.dataset.action === "delete") {
            deleteAnimal(id);
          }
        });
      });
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr><td colspan="7" class="empty-admin">
          <p><strong>Error al cargar:</strong> ${escapeHtml(err.message)}</p>
          <p style="margin-top:0.5rem;font-size:0.9rem">Verificá las reglas de Firestore y que la colección “animales” exista.</p>
        </td></tr>
      `;
    }
  }

  function openFormModal(animal = null) {
    editingId = animal?.id || null;
    const modal = document.getElementById("form-modal");
    const title = document.getElementById("form-title");
    const form = document.getElementById("animal-form");

    if (title) {
      title.textContent = animal ? "Editar animalito" : "Agregar animalito";
    }

    form.reset();
    document.getElementById("nombre").value = animal?.nombre || "";
    document.getElementById("tipo").value = animal?.tipo || "perro";
    document.getElementById("edad").value = animal?.edad || "";
    document.getElementById("sexo").value = animal?.sexo || "Macho";
    document.getElementById("tamaño").value = animal?.tamaño || "Mediano";
    document.getElementById("estado").value = animal?.estado || "disponible";
    document.getElementById("imagen").value = animal?.imagen || "";
    document.getElementById("personalidad").value = animal?.personalidad || "";
    document.getElementById("descripcion").value = animal?.descripcion || "";

    const prev = document.getElementById("img-preview");
    if (prev) {
      if (animal?.imagen) {
        prev.src = animal.imagen;
        prev.classList.add("show");
      } else {
        prev.classList.remove("show");
      }
    }

    modal?.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeFormModal() {
    document.getElementById("form-modal")?.classList.remove("open");
    document.body.style.overflow = "";
    editingId = null;
  }

  async function saveAnimal() {
    const btn = document.querySelector('#animal-form button[type="submit"]');
    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      tipo: document.getElementById("tipo").value,
      edad: document.getElementById("edad").value.trim(),
      sexo: document.getElementById("sexo").value,
      tamaño: document.getElementById("tamaño").value,
      estado: document.getElementById("estado").value,
      imagen: document.getElementById("imagen").value.trim(),
      personalidad: document.getElementById("personalidad").value.trim(),
      descripcion: document.getElementById("descripcion").value.trim(),
    };

    if (!data.nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      if (editingId) {
        await updateDoc(doc(db, ANIMALS_COLLECTION, editingId), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, ANIMALS_COLLECTION), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      closeFormModal();
      await loadTable();
    } catch (err) {
      console.error(err);
      alert("Error al guardar: " + (err.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = "Guardar";
    }
  }

  async function deleteAnimal(id) {
    const animal = window.__animalsCache?.[id];
    const name = animal?.nombre || "este animalito";
    if (!confirm(`¿Seguro que querés eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, ANIMALS_COLLECTION, id));
      await loadTable();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar: " + (err.message || err));
    }
  }
}
