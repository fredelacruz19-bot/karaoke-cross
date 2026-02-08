import { getCurrentUser, getUserProfile, logoutUser, initializeAuthUI } from "./auth.js";
import {
  createSession,
  getUserSessions,
  subscribeToSession,
  initializePageProtection,
  requireAdminAccess,
  getUserMetrics,
  createUserProfile,
  updateUserSettings
} from "./app.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =====================================================================
// INICIALIZACIÓN DE PÁGINA
// =====================================================================

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const isAuthorized = await initializePageProtection();
    if (!isAuthorized) return;

    const user = await getCurrentUser();
    const profile = await getUserProfile(user.uid);

    // Actualizar interfaz con información del usuario
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) {
      userNameEl.textContent = profile?.displayName || user.email;
    }

    const userRoleEl = document.getElementById("user-role");
    if (userRoleEl) {
      userRoleEl.textContent = profile?.role === "AdminUser" ? "Administrador" : "Usuario";
    }

    // Mostrar panel admin si es AdminUser
    const adminSection = document.getElementById("admin-section");
    if (adminSection) {
      adminSection.style.display = profile?.role === "AdminUser" ? "block" : "none";
    }

    // Inicializar interfaz
    initializeAuthUI();
    loadUserSessions(user.uid, profile?.role);
    setupCreateSessionForm(user.uid);

    // Si es AdminUser, cargar sección de administración
    if (profile?.role === "AdminUser") {
      loadAdminPanel();
    }

  } catch (error) {
    console.error("Error initializing page:", error);
    window.location.href = "Index.html";
  }
});

// =====================================================================
// GESTIÓN DE SESIONES
// =====================================================================

async function loadUserSessions(uid, role) {
  try {
    const sessionsList = document.getElementById("sessions-list");
    if (!sessionsList) return;

    sessionsList.innerHTML = "<p>Cargando sesiones...</p>";

    const sessions = await getUserSessions(uid);

    if (sessions.length === 0) {
      sessionsList.innerHTML = "<p>No tienes sesiones activas</p>";
      return;
    }

    sessionsList.innerHTML = "";

    sessions.forEach((session) => {
      const div = document.createElement("div");
      div.className = "session-item";
      div.innerHTML = `
        <div>
          <h3>${session.name}</h3>
          <p>Creada: ${new Date(session.createdAt).toLocaleString()}</p>
          <p>Cola: ${session.queue?.length || 0} canciones</p>
        </div>
        <div>
          <button onclick="window.location.href='PanelDJ.html?sessionId=${session.id}'" class="btn-primary">
            Panel DJ
          </button>
          <button onclick="window.location.href='Display.html?sessionId=${session.id}'" class="btn-secondary">
            Display
          </button>
          <button onclick="window.location.href='Request.html?sessionId=${session.id}'" class="btn-secondary">
            Solicitar
          </button>
          <button onclick="endSessionHandler('${session.id}')" class="btn-danger">
            Finalizar
          </button>
        </div>
      `;
      sessionsList.appendChild(div);

      // Suscribirse a cambios
      subscribeToSession(session.id, (updatedSession) => {
        console.log("Session updated:", updatedSession);
      });
    });
  } catch (error) {
    console.error("Error loading sessions:", error);
    const sessionsList = document.getElementById("sessions-list");
    if (sessionsList) {
      sessionsList.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
  }
}

function setupCreateSessionForm(uid) {
  const btn = document.getElementById("create-session-btn");
  const input = document.getElementById("session-name-input");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    const sessionName = input?.value?.trim();

    if (!sessionName) {
      alert("Por favor escribe un nombre para la sesión");
      return;
    }

    btn.disabled = true;
    try {
      const result = await createSession(sessionName);
      alert(`Sesión creada: ${result.sessionId}`);
      if (input) input.value = "";
      loadUserSessions(uid, (await getUserProfile(uid))?.role);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

window.endSessionHandler = async (sessionId) => {
  if (!confirm("¿Finalizar esta sesión?")) return;

  try {
    await endSession(sessionId);
    alert("Sesión finalizada");
    const user = await getCurrentUser();
    loadUserSessions(user.uid, (await getUserProfile(user.uid))?.role);
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
};

// =====================================================================
// PANEL ADMIN
// =====================================================================

async function loadAdminPanel() {
  try {
    const metricsDiv = document.getElementById("metrics-container");
    const usersTable = document.getElementById("users-table");

    if (metricsDiv) {
      const metrics = await getUserMetrics();
      metricsDiv.innerHTML = `
        <div class="metric">
          <h3>Usuarios Totales: ${metrics.totalUsers}</h3>
        </div>
        <div class="metric">
          <h3>Sesiones Activas: ${metrics.activeSessions}</h3>
        </div>
        <div class="metric">
          <h3>AdminUsers: ${metrics.adminUsers}</h3>
        </div>
        <div class="metric">
          <h3>Usuarios Expirados: ${metrics.expiredUsers}</h3>
        </div>
      `;
    }

    if (usersTable) {
      loadUsersTable();
    }

    const createUserBtn = document.getElementById("create-user-btn");
    if (createUserBtn) {
      createUserBtn.addEventListener("click", setupCreateUserForm);
    }

  } catch (error) {
    console.error("Error loading admin panel:", error);
  }
}

async function loadUsersTable() {
  try {
    const usersTable = document.getElementById("users-table");
    if (!usersTable) return;

    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    usersTable.innerHTML = "";

    if (snapshot.empty) {
      usersTable.innerHTML = "<tr><td colspan='5'>No hay usuarios</td></tr>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      const expirationDate = user.expirationDate
        ? new Date(user.expirationDate).toLocaleString()
        : "Sin expiración";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.maxSessions}</td>
        <td>${expirationDate}</td>
        <td>
          <button onclick="editUserHandler('${docSnap.id}')" class="btn-small">Editar</button>
          <button onclick="deleteUserHandler('${docSnap.id}')" class="btn-small btn-danger">Eliminar</button>
        </td>
      `;
      usersTable.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading users table:", error);
  }
}

async function setupCreateUserForm() {
  const email = prompt("Email del usuario:");
  if (!email) return;

  const displayName = prompt("Nombre:");
  if (!displayName) return;

  const role = confirm("¿AdminUser? (Cancel = User normal)") ? "AdminUser" : "User";
  const maxSessionsStr = prompt("Máximo de sesiones:", "1");
  const maxSessions = parseInt(maxSessionsStr) || 1;

  try {
    // NOTA: Este endpoint requiere que el usuario exista primero en Auth
    // En producción, necesitarías un sistema de invitación o pre-registro
    alert("En producción, el usuario debe registrarse primero en Auth");
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

window.editUserHandler = async (userId) => {
  const newMaxSessions = prompt("Nuevas sesiones máximas:");
  if (newMaxSessions === null) return;

  const newExpirationDate = prompt("Nueva fecha de expiración (formato: YYYY-MM-DD HH:MM) o dejar en blanco:");

  try {
    const updates = {
      maxSessions: parseInt(newMaxSessions) || 1
    };

    if (newExpirationDate) {
      updates.expirationDate = new Date(newExpirationDate).getTime();
    }

    await updateUserSettings(userId, updates);
    alert("Usuario actualizado");
    loadUsersTable();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
};

window.deleteUserHandler = async (userId) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;
  alert("La eliminación de usuarios debe hacerse desde Firebase Console");
};

async function loadUsersTableForEditing() {
  const usersTable = document.getElementById("users-table");
  if (!usersTable) return;
  
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    usersTable.innerHTML = "";

    snapshot.forEach(docSnap => {
      const u = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td><input type="date" value="${u.expiration ? u.expiration.toDate().toISOString().split("T")[0] : ""}" data-id="${docSnap.id}" class="exp"></td>
        <td><input type="number" value="${u.maxSessions || 3}" data-id="${docSnap.id}" class="max-sessions"></td>
        <td><button data-id="${docSnap.id}" class="save-btn">Guardar</button></td>
      `;
      usersTable.appendChild(tr);
    });

    document.querySelectorAll(".save-btn").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const expInput = document.querySelector(`.exp[data-id="${id}"]`);
        const maxInput = document.querySelector(`.max-sessions[data-id="${id}"]`);

        const userRef = doc(db, "users", id);
        await updateDoc(userRef, {
          expiration: new Date(expInput.value),
          maxSessions: Number(maxInput.value)
        });

        alert("Usuario actualizado ✅");
      };
    });
  } catch (error) {
    console.error("Error loading users table for editing:", error);
  }
}
