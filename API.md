# 🔌 API DE CLOUD FUNCTIONS

Todas las operaciones críticas se realizan a través de Cloud Functions. El frontend NO accede directamente a Firestore.

## Autenticación

Todas las funciones requieren autenticación Firebase. El token se envía automáticamente en los headers.

```javascript
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase.js";

const myFunction = httpsCallable(functions, "functionName");
const response = await myFunction({ /* datos */ });
```

---

## 1️⃣ GESTIÓN DE USUARIOS

### createUserProfile()
Crea el perfil de un usuario existente en Firebase Auth.

**Permisos:** AdminUser only

**Parámetros:**
```javascript
{
  email: string,           // Email existente en Auth
  displayName: string,     // Nombre visible
  role: "User" | "AdminUser",
  maxSessions: number,     // Eg: 1, 3, 10
  expirationDate?: number  // Timestamp (null = nunca expira)
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  uid: string,
  message: string
}
```

**Ejemplo:**
```javascript
import { createUserProfile } from "./app.js";

try {
  const result = await createUserProfile(
    "usuario@gmail.com",
    "Juan Pérez",
    "User",
    3,
    Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 año
  );
  console.log("Usuario creado:", result.uid);
} catch (error) {
  console.error("Error:", error.message);
}
```

**Errores posibles:**
- `unauthenticated` - No estás autenticado
- `permission-denied` - No eres AdminUser
- `invalid-argument` - Email o role inválidos
- `internal` - Email no existe en Auth

---

### updateUserSettings()
Actualiza la configuración de un usuario.

**Permisos:** AdminUser only

**Parámetros:**
```javascript
{
  userId: string,    // UID del usuario
  updates: {
    maxSessions?: number,
    expirationDate?: number | null,
    displayName?: string,
    role?: "User" | "AdminUser"
  }
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  message: string
}
```

**Ejemplo:**
```javascript
import { updateUserSettings } from "./app.js";

try {
  await updateUserSettings("user_uid_123", {
    maxSessions: 5,
    expirationDate: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 días
  });
  console.log("Usuario actualizado");
} catch (error) {
  console.error("Error:", error.message);
}
```

---

## 2️⃣ GESTIÓN DE SESIONES

### createSession()
Crea una nueva sesión de karaoke.

**Permisos:** User autenticado (revisar expiración y límite)

**Parámetros:**
```javascript
{
  sessionName: string  // Eg: "Cumpleaños de Ana"
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  sessionId: string,
  message: string
}
```

**Ejemplo:**
```javascript
import { createSession } from "./app.js";

try {
  const result = await createSession("Fiesta de Despedida");
  console.log("Sesión creada:", result.sessionId);
  window.location.href = `PanelDJ.html?sessionId=${result.sessionId}`;
} catch (error) {
  alert(error.message);
}
```

**Errores posibles:**
- `permission-denied` - Cuenta expirada
- `resource-exhausted` - Límite de sesiones alcanzado
- `invalid-argument` - sessionName no proporcionado

---

### endSession()
Finaliza una sesión de karaoke.

**Permisos:** Propietario o AdminUser

**Parámetros:**
```javascript
{
  sessionId: string
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  message: string
}
```

**Ejemplo:**
```javascript
import { endSession } from "./app.js";

if (confirm("¿Finalizar sesión?")) {
  try {
    await endSession("session_id_123");
    alert("Sesión finalizada");
    window.location.href = "home.html";
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}
```

---

## 3️⃣ GESTIÓN DE COLA

### addToQueue()
Agrega una canción a la cola.

**Permisos:** Propietario de la sesión o AdminUser

**Parámetros:**
```javascript
{
  sessionId: string,
  title: string,           // "Bohemian Rhapsody - Queen"
  url: string,            // "https://www.youtube.com/watch?v=..."
  thumbnail: string,      // URL imagen
  duration: number,       // Segundos (Eg: 354)
  priority?: number       // 0 (default) = normal, >0 = mayor prioridad
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  queueId: string,        // ID para identificar en la cola
  message: string
}
```

**Ejemplo:**
```javascript
import { addToQueue } from "./app.js";

try {
  const result = await addToQueue(
    "session_123",
    "Bohemian Rhapsody - Queen",
    "https://www.youtube.com/watch?v=fJ9rUzIMt7o",
    "https://i.ytimg.com/vi/fJ9rUzIMt7o/default.jpg",
    354,
    0
  );
  console.log("Canción agregada:", result.queueId);
} catch (error) {
  alert(`Error: ${error.message}`);
}
```

---

### removeFromQueue()
Elimina una canción de la cola.

**Permisos:** Propietario de la sesión o AdminUser

**Parámetros:**
```javascript
{
  sessionId: string,
  queueId: string  // ID devuelto por addToQueue()
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  message: string
}
```

**Ejemplo:**
```javascript
import { removeFromQueue } from "./app.js";

try {
  await removeFromQueue("session_123", "q_item_001");
  console.log("Canción removida");
} catch (error) {
  alert(`Error: ${error.message}`);
}
```

---

## 4️⃣ CONTROLES REMOTOS

### toggleRequestsStatus()
Habilita o deshabilita las solicitudes de canciones.

**Permisos:** Propietario de la sesión o AdminUser

**Parámetros:**
```javascript
{
  sessionId: string,
  enabled: boolean  // true = habilitar, false = deshabilitar
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  message: string
}
```

**Ejemplo:**
```javascript
import { toggleRequests } from "./app.js";

const requestsToggle = document.getElementById("requests-toggle");
requestsToggle.addEventListener("change", async (e) => {
  try {
    await toggleRequests("session_123", e.target.checked);
  } catch (error) {
    alert(`Error: ${error.message}`);
    e.target.checked = !e.target.checked; // Revertir
  }
});
```

---

### updateSessionSettings()
Actualiza configuración de la sesión (AutoPlay, tiempo entre canciones).

**Permisos:** Propietario de la sesión o AdminUser

**Parámetros:**
```javascript
{
  sessionId: string,
  autoPlay?: boolean,        // true = reproducción automática
  timeBetweenSongs?: number  // 0-8 segundos
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  message: string
}
```

**Ejemplo:**
```javascript
import { updateSessionSettings } from "./app.js";

try {
  await updateSessionSettings("session_123", true, 5);
  console.log("Configuración actualizada");
} catch (error) {
  alert(`Error: ${error.message}`);
}
```

**Validaciones:**
- `timeBetweenSongs` se fuerza a estar entre 0-8
- Si no se proporciona un parámetro, no se modifica

---

## 5️⃣ ESTADÍSTICAS Y MONITOREO

### getCacheStats()
Obtiene estadísticas del cache de búsquedas.

**Permisos:** AdminUser only

**Parámetros:** Ninguno

**Respuesta:**
```javascript
{
  totalCached: number,        // Total de videos en cache
  totalHits: number,          // Total de búsquedas servidas desde cache
  averageHitsPerEntry: number // Hits promedio por entrada
}
```

**Ejemplo:**
```javascript
import { getCacheStats } from "./app.js";

try {
  const stats = await getCacheStats();
  console.log(`Cache: ${stats.totalCached} videos, ${stats.totalHits} hits`);
} catch (error) {
  console.error("Error:", error.message);
}
```

---

### getUserMetrics()
Obtiene métricas generales del sistema.

**Permisos:** AdminUser only

**Parámetros:** Ninguno

**Respuesta:**
```javascript
{
  totalUsers: number,        // Total de usuarios registrados
  activeSessions: number,    // Sesiones con status: "active"
  adminUsers: number,        // Usuarios con rol AdminUser
  expiredUsers: number       // Usuarios con expiración vencida
}
```

**Ejemplo:**
```javascript
import { getUserMetrics } from "./app.js";

try {
  const metrics = await getUserMetrics();
  console.log(`
    Usuarios: ${metrics.totalUsers}
    Sesiones activas: ${metrics.activeSessions}
    AdminUsers: ${metrics.adminUsers}
    Expirados: ${metrics.expiredUsers}
  `);
} catch (error) {
  console.error("Error:", error.message);
}
```

---

## 🔄 SUSCRIPCIONES (Real-time)

### subscribeToSession()
Se suscribe a cambios en tiempo real de una sesión.

**Sintaxis:**
```javascript
const unsubscribe = subscribeToSession(sessionId, (session) => {
  // session contiene los datos actualizados
  console.log("Sesión actualizada:", session);
});

// Para dejar de escuchar:
// unsubscribe();
```

**Ejemplo:**
```javascript
import { subscribeToSession } from "./app.js";

let currentSession = null;

const unsubscribe = subscribeToSession("session_123", (session) => {
  currentSession = session;
  updateUI(); // Función propia para actualizar la interfaz
});

// Cleanup al salir de la página
window.addEventListener("beforeunload", () => {
  unsubscribe();
});
```

---

## ⚠️ MANEJO DE ERRORES

Todos los errores son de tipo `HttpsError` con code y message.

**Códigos de error comunes:**

| Code | Significado | Ejemplo |
|------|-------------|---------|
| `unauthenticated` | No estás autenticado | Sin token Firebase |
| `permission-denied` | No tienes ese rol/permiso | No eres AdminUser |
| `not-found` | Recurso no existe | Sesión deleteDada |
| `invalid-argument` | Parámetro inválido | Email vacío |
| `resource-exhausted` | Límite excedido | Demasiadas sesiones |
| `internal` | Error del servidor | Problema en BD |

**Ejemplo de manejo:**
```javascript
try {
  await createSession("Mi Sesión");
} catch (error) {
  const messages = {
    "permission-denied": "Tu cuenta ha expirado",
    "resource-exhausted": "Alcanzaste el límite de sesiones",
    "invalid-argument": "Nombre de sesión inválido"
  };
  
  alert(messages[error.code] || error.message);
}
```

---

## 🧪 TESTING

### Con emulador local
```bash
firebase emulators:start
```

### Hacer llamadas desde Node.js
```javascript
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Testear función localmente
const testFunction = require('./functions/src/index').createSession;
```

### Testear desde consola del navegador
```javascript
import { createSession } from "./js/app.js";

// En consola del navegador:
createSession("Test Session").then(r => console.log(r));
```

---

## 📊 LÍMITES DE RATE

Cloud Functions tiene límites por defecto:
- 10 llamadas por segundo por usuario (por defecto)
- Personalizable en configuración de funciones

Para producción con alto volumen, considerar:
- Implementar rate limiting
- Cache en cliente
- Batch operations

---

## 🔐 SEGURIDAD

**Nunca:**
- Exposar API keys en frontend
- Permitir operations sin validación
- Confiar en datos del cliente sin validar

**Siempre:**
- Validar en backend
- Usar roles y permisos
- Loguear operaciones sensibles
- Usar HTTPS en producción

---

**Versión:** 1.0.0  
**Última actualización:** Feb 8, 2026
