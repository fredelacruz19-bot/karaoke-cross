# 🗄️ ESTRUCTURA DE BASE DE DATOS - FIRESTORE

## Colecciones y Documentos

### 1. Colección: `users`
Almacena información de todos los usuarios del sistema.

**Path:** `/users/{uid}`

**Documento de ejemplo:**
```json
{
  "uid": "xYzAbC123...",
  "email": "usuario@gmail.com",
  "displayName": "Juan Pérez",
  "role": "User",
  "expirationDate": 1740514800000,
  "maxSessions": 1,
  "createdAt": 1707000000000
}
```

**Campos:**
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `uid` | string | ✅ | ID de usuario de Firebase Auth |
| `email` | string | ✅ | Email del usuario |
| `displayName` | string | ✅ | Nombre visible |
| `role` | enum | ✅ | "User" o "AdminUser" |
| `expirationDate` | timestamp | ❌ | null = nunca expira |
| `maxSessions` | number | ✅ | Límite de sesiones simultáneas |
| `createdAt` | timestamp | ✅ | Fecha de creación |

**Reglas de acceso:**
- Leer: propietario O AdminUser
- Crear: Cloud Function solamente
- Actualizar: Cloud Function solamente
- Borrar: Cloud Function solamente

**Índices necesarios:**
```
No requiere índices adicionales (queries por ID)
```

---

### 2. Colección: `sessions`
Almacena las sesiones de karaoke.

**Path:** `/sessions/{sessionId}`

**Documento de ejemplo:**
```json
{
  "id": "session_abc123...",
  "owner": "xYzAbC123...",
  "name": "Cumpleaños de Ana",
  "status": "active",
  "createdAt": 1707000000000,
  "updatedAt": 1707010000000,
  "queue": [
    {
      "id": "q_001",
      "title": "Bohemian Rhapsody - Queen",
      "url": "https://www.youtube.com/watch?v=fJ9rUzIMt7o",
      "thumbnail": "https://i.ytimg.com/vi/fJ9rUzIMt7o/default.jpg",
      "duration": 354,
      "requestedBy": "xYzAbC123...",
      "addedAt": 1707005000000,
      "priority": 0
    },
    {
      "id": "q_002",
      "title": "Hotel California - Eagles",
      "url": "https://www.youtube.com/watch?v=...",
      "thumbnail": "https://i.ytimg.com/...",
      "duration": 391,
      "requestedBy": "user_xyz...",
      "addedAt": 1707005500000,
      "priority": 0
    }
  ],
  "currentSong": {
    "id": "q_001",
    "title": "Bohemian Rhapsody - Queen",
    "url": "https://www.youtube.com/watch?v=fJ9rUzIMt7o",
    "thumbnail": "https://i.ytimg.com/vi/fJ9rUzIMt7o/default.jpg",
    "duration": 354,
    "requestedBy": "xYzAbC123...",
    "addedAt": 1707005000000,
    "priority": 0
  },
  "autoPlay": true,
  "timeBetweenSongs": 3,
  "requestsEnabled": true,
  "history": [
    {
      "id": "h_001",
      "title": "Stayin' Alive - Bee Gees",
      "url": "https://www.youtube.com/watch?v=...",
      "playedAt": 1707001000000,
      "duration": 267
    }
  ]
}
```

**Campos:**
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | ✅ | ID de la sesión (mismo que documentId) |
| `owner` | string | ✅ | UID del propietario |
| `name` | string | ✅ | Nombre de la sesión |
| `status` | enum | ✅ | "active" o "ended" |
| `createdAt` | timestamp | ✅ | Creación |
| `updatedAt` | timestamp | ✅ | Última modificación |
| `queue` | array | ✅ | Array de canciones en cola (vacío = []) |
| `currentSong` | object | ❌ | Canción actual (null si no hay) |
| `autoPlay` | boolean | ✅ | True si reproducción automática |
| `timeBetweenSongs` | number | ✅ | 0-8 segundos entre canciones |
| `requestsEnabled` | boolean | ✅ | True si se permiten solicitudes |
| `history` | array | ✅ | Canciones reproducidas (vacío = []) |

**Estructura de QueueItem:**
```typescript
{
  id: string;           // ID único
  title: string;        // "Nombre Canción - Artista"
  url: string;         // Link completo YouTube
  thumbnail: string;   // URL imagen miniatura
  duration: number;    // Duración en segundos
  requestedBy?: string; // UID quien solicitó (opcional)
  addedAt: number;     // Timestamp cuando se añadió
  priority: number;    // 0 = normal, >0 = prioridad
}
```

**Estructura de HistoryItem:**
```typescript
{
  id: string;   // ID único
  title: string; // "Nombre Canción - Artista"
  url: string;  // Link YouTube
  playedAt: number; // Timestamp reproducción
  duration: number; // Duración en segundos
}
```

**Reglas de acceso:**
- Leer: propietario O AdminUser
- Crear: Cloud Function solamente
- Actualizar: Cloud Function solamente
- Borrar: Cloud Function solamente

**Índices necesarios:**
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "owner", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

### 3. Colección: `cache`
Almacena el cache de búsquedas de YouTube (opcional pero recomendado).

**Path:** `/cache/{videoId}`

**Documento de ejemplo:**
```json
{
  "videoId": "fJ9rUzIMt7o",
  "title": "Bohemian Rhapsody - Queen",
  "thumbnail": "https://i.ytimg.com/vi/fJ9rUzIMt7o/default.jpg",
  "duration": 354,
  "url": "https://www.youtube.com/watch?v=fJ9rUzIMt7o",
  "cachedAt": 1707000000000,
  "hits": 5
}
```

**Campos:**
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `videoId` | string | ✅ | ID de video YouTube (PK) |
| `title` | string | ✅ | Título + artista |
| `thumbnail` | string | ✅ | URL miniatura |
| `duration` | number | ✅ | Duración en segundos |
| `url` | string | ✅ | Link completo |
| `cachedAt` | timestamp | ✅ | Fecha de cache |
| `hits` | number | ✅ | Veces utilizado |

**Reglas de acceso:**
- Leer: usuarios autenticados
- Crear: Cloud Functions solamente
- Actualizar: Cloud Functions solamente
- Borrar: Cloud Functions solamente

**Política de limpieza:**
```
- 60 días: Resetear hits a 0
- 90 días: Eliminar si hits = 0
```

---

## Queries Comunes

### Obtener sesiones activas de un usuario
```javascript
db.collection("sessions")
  .where("owner", "==", uid)
  .where("status", "==", "active")
  .orderBy("updatedAt", "desc")
  .limit(10)
```

Índice necesario:
```json
{
  "collectionGroup": "sessions",
  "fields": [
    { "fieldPath": "owner", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}
```

### Obtener usuario por UID
```javascript
db.collection("users").doc(uid).get()
```

### Contar sesiones activas de usuario
```javascript
db.collection("sessions")
  .where("owner", "==", uid)
  .where("status", "==", "active")
  .select() // Solo contar, no traer datos
.get()
```

### Obtener canción actual de sesión
```javascript
db.collection("sessions").doc(sessionId).get()
  .then(doc => doc.data().currentSong)
```

---

## Transacciones (ejemplos de backend)

### Mover canción en cola
```typescript
const docRef = db.collection("sessions").doc(sessionId);
await db.runTransaction(async (transaction) => {
  const session = await transaction.get(docRef);
  const queue = session.data().queue;
  
  // Mover elemento
  const [item] = queue.splice(oldIndex, 1);
  queue.splice(newIndex, 0, item);
  
  transaction.update(docRef, { queue });
});
```

### Reproducir próxima canción
```typescript
const docRef = db.collection("sessions").doc(sessionId);
await db.runTransaction(async (transaction) => {
  const session = await transaction.get(docRef);
  const queue = [...session.data().queue];
  const history = [...session.data().history];
  
  // Guardar actual en historial
  if (session.data().currentSong) {
    history.push({
      ...session.data().currentSong,
      playedAt: Date.now()
    });
  }
  
  // Próxima de cola
  const next = queue.shift();
  
  transaction.update(docRef, {
    currentSong: next || null,
    queue,
    history,
    updatedAt: Date.now()
  });
});
```

---

## Límites y Cuotas

| Límite | Valor | Notas |
|--------|-------|-------|
| Tamaño máximo documento | 1 MB | Dividir si es necesario |
| Tamaño máximo array | Ilimitado | Pero afecta tamaño doc |
| Escrituras/seg por doc | Ilimitado | (Veríficar límites Firebase) |
| Campos en documento | Ilimitado | Pero afecta tamaño |

**Estimaciones:**
- 1 sesión con 100 canciones en cola ≈ 50 KB
- 1000 usuarios = 100 KB de datos
- Cache 10000 videos = 500 KB

---

## Backups y Recuperación

### Exportar datos
```bash
gcloud firestore export gs://bucket-name/backup-name
```

### Restaurar datos
```bash
gcloud firestore import gs://bucket-name/backup-name
```

---

## Monitoreo

**En Firebase Console > Firestore > Monitor:**
- Lecturas/escrituras por segundo
- Datos almacenados (GB)
- Operaciones exitosas/fallidas

**Alertas recomendadas:**
- Lecturas > 50k/día
- Escrituras > 10k/día
- Cuota excedida

---

**Versión:** 1.0.0  
**Última actualización:** Feb 8, 2026
