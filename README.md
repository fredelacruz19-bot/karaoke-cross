# 🎤 Cross Karaoke

Una plataforma profesional de karaoke colaborativa y escalable construida con Firebase. Sistema seguro con autenticación, roles de usuario, control remoto DJ y pantalla pública.

## 📋 Características

### Autenticación y Seguridad
- ✅ Autenticación con Gmail y Email
- ✅ Sistema de roles (User, AdminUser)
- ✅ Control de expiración de cuentas
- ✅ Límite de sesiones por usuario
- ✅ Todas las operaciones críticas requieren Cloud Functions (sin acceso directo al DB)

### Funcionalidades Principal
- 🏠 **Home**: Crear sesiones, ver activas, panel admin
- 🎵 **PanelDJ**: Gestionar karaoke, cola, AutoPlay, controles remotos
- 📺 **Display**: Pantalla pública con QR, reproducción, historial
- 🎤 **Request**: Solicitar canciones, búsqueda, confirmación
- 🚫 **AccessDenied**: Control de acceso y expiración

### Características Avanzadas
- 🔐 Validación de rol, expiración y propiedad
- 💾 Sistema de cache de búsquedas YouTube
- 🧹 Limpieza automática de cache (60 y 90 días)
- 📊 Métricas de administración
- 🎬 Gestión de cola con prioridades
- 🔄 AutoPlay con intervalos configurables
- 🔊 Bloqueo/habilitación de solicitudes

## 🏗️ Arquitectura

### Backend (Cloud Functions)
```
functions/
├── src/
│   └── index.ts (Cloud Functions)
│       ├── Autenticación y validación
│       ├── Gestión de usuarios (AdminUser only)
│       ├── Gestión de sesiones
│       ├── Gestión de cola
│       ├── Controles remotos
│       ├── Cache y limpieza automática
│       └── Estadísticas y métricas
```

**Funciones principales:**
- `createSession()` - Crear sesión de karaoke
- `endSession()` - Finalizar sesión
- `addToQueue()` - Agregar canción a la cola
- `removeFromQueue()` - Eliminar canción de la cola
- `toggleRequestsStatus()` - Habilitar/deshabilitar solicitudes
- `updateSessionSettings()` - Configurar autoplay, tiempo entre canciones
- `createUserProfile()` - Crear usuario (AdminUser only)
- `updateUserSettings()` - Editar configuración de usuario (AdminUser only)
- `getCacheStats()` - Ver estadísticas de cache (AdminUser only)
- `cleanupCacheDaily()` - Limpieza automática (scheduled)
- `getUserMetrics()` - Ver métricas generales (AdminUser only)

### Frontend (Vanilla JavaScript + Firebase SDK)
```
public/
├── index.html (Login)
├── home.html (Home + Admin Panel)
├── PanelDJ.html (Control DJ)
├── Display.html (Pantalla Pública)
├── Request.html (Solicitar Canciones)
├── AccessDenied.html (Acceso Denegado)
├── css/
│   └── styles.css (Estilos profesionales)
└── js/
    ├── firebase.js (Configuración Firebase)
    ├── auth.js (Autenticación y gestión de usuarios)
    ├── app.js (Funciones principales de la app)
    └── home.js (Lógica de la página Home)
```

### Base de Datos (Firestore)
```
users/
├── {uid}
│   ├── uid (string)
│   ├── email (string)
│   ├── displayName (string)
│   ├── role (enum: User, AdminUser)
│   ├── expirationDate (timestamp | null)
│   ├── maxSessions (number)
│   └── createdAt (timestamp)

sessions/
├── {sessionId}
│   ├── id (string)
│   ├── owner (string - uid)
│   ├── name (string)
│   ├── status (enum: active, ended)
│   ├── queue (array of QueueItem)
│   ├── currentSong (QueueItem | null)
│   ├── autoPlay (boolean)
│   ├── timeBetweenSongs (number 0-8)
│   ├── requestsEnabled (boolean)
│   ├── history (array of HistoryItem)
│   ├── createdAt (timestamp)
│   └── updatedAt (timestamp)

cache/
├── {videoId}
│   ├── videoId (string)
│   ├── title (string)
│   ├── thumbnail (string)
│   ├── duration (number)
│   ├── url (string)
│   ├── cachedAt (timestamp)
│   └── hits (number)
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Cuenta de Firebase

### Paso 1: Inicializar Firebase
```bash
cd "c:\Users\frede\firebase-proyecto\Karaoke Cross"
firebase init
```

Selecciona:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting
- ✅ Emulators

### Paso 2: Instalar Dependencias

Backend:
```bash
cd functions
npm install
```

Frontend:
```bash
cd ..
npm install
```

### Paso 3: Configurar Cloud Functions

Estructura correcta de `functions/src/index.ts` (ya incluida).

Instalar dependencias de Functions:
```bash
cd functions
npm install firebase-admin firebase-functions cors
```

### Paso 4: Actualizar Firestore Rules

El archivo `firestore.rules` ya está actualizado con:
- ❌ NO permitir updates directos desde frontend
- ✅ Solo lectura para usuarios autenticados
- ✅ Todas las operaciones críticas via Cloud Functions

### Paso 5: Configuración de Autenticación Firebase

En Firebase Console:
1. Ir a **Authentication > Sign-in providers**
2. Habilitar:
   - ✅ Google
   - ✅ Email/Password
3. Copiar credenciales a `public/js/firebase.js`

## 🧪 Ejecución Local

### Modo Desarrollo con Emulator

```bash
# Terminal 1: Backend (Cloud Functions)
cd functions
npm run serve

# Terminal 2: Hosting
firebase serve

# Acceder a: http://localhost:3000
```

## 🌐 Deploy a Producción

### Deploy Cloud Functions
```bash
cd functions
npm run deploy
```

### Deploy Hosting
```bash
firebase deploy --only hosting
```

### Deploy Todo
```bash
firebase deploy
```

## 📋 Flujo de Usuario

### 1. Registro/Login
- Usuario ingresa con Google o Email
- Se crea automáticamente usuario en Firestore (rol: User)
- Redirige a Home

### 2. Home
- Ver tus sesiones activas
- Crear nueva sesión (limitado por maxSessions)
- **Si AdminUser:**
  - Ver todas las sesiones
  - Gestionar usuarios
  - Ver métricas
  - Controlar expiración y límites

### 3. Panel DJ
- Buscar o pegar links de YouTube
- Agregar canciones a la cola
- Ver canción actual y próximas
- Controlar AutoPlay (0-8 segundos)
- Habilitar/deshabilitar solicitudes
- Ver historial
- Generar y mostrar QR

### 4. Display (Pantalla Pública)
- Reproducir video karaoke
- Mostrar próximas canciones
- Mostrar QR para solicitar
- Pantalla intermedia entre canciones

### 5. Request (Solicitar Canciones)
- Escanear QR o acceder directamente
- Búsqueda de canciones (requiere YouTube API backend)
- Pegar URL de YouTube
- Ver mis solicitudes
- Ver canciones reproducidas

## 🔐 Seguridad

### Reglas Firestore
- ❌ **Prohibido** crear/actualizar/borrar documentos desde frontend
- ✅ **Obligatorio** usar Cloud Functions para operaciones críticas
- ✅ **Validación** de rol en cada función
- ✅ **Validación** de expiración de usuario
- ✅ **Validación** de propiedad (solo dueño o AdminUser pueden modificar)

### Validaciones Backend
```typescript
// Cada función valida:
1. ¿Usuario está autenticado?
2. ¿Usuario existe en Firestore?
3. ¿Usuario ha expirado? (menos AdminUser)
4. ¿Usuario tiene rol suficiente?
5. ¿Usuario puede acceder a este recurso?
```

## 🧹 Mantenimiento

### Limpieza Automática de Cache
Se ejecuta diariamente (`cleanupCacheDaily`):
- 🗑️ **Elimina**: entradas de 90+ días sin hits
- 🔄 **Resetea hits**: entradas de 60-90 días

## 📊 Administración

### Panel Admin (AdminUser)

**Métricas:**
- Total de usuarios
- Sesiones activas
- AdminUsers
- Usuarios expirados

**Gestión de Usuarios:**
- Crear usuarios
- Editar maxSessions
- Cambiar fecha de expiración
- Eliminar usuarios (desde Firebase Console)

## 🎯 Próximas Mejoras

- [ ] Integración YouTube Data API para búsqueda
- [ ] Sistema de invitación de usuarios
- [ ] Notificaciones en tiempo real
- [ ] Soporte para múltiples idiomas
- [ ] App móvil nativa
- [ ] Integración con Spotify
- [ ] Sistema de favoritos
- [ ] Ratings y comentarios

## 🐛 Troubleshooting

### Error: "Permission denied"
✅ Asegúrate de:
- Estar autenticado
- Tener rol suficiente (AdminUser si es necesario)
- No estar expirado
- Ser el dueño del recurso

### Error: "Functions not deployed"
✅ Ejecuta:
```bash
cd functions
npm run deploy
```

### Error: "Session not found"
✅ Verifica:
- El sessionId es correcto
- La sesión sigue activa (status: "active")
- No fue eliminada

### QR no genera
✅ Asegúrate que:
- QRCode library está cargada (CDN)
- sessionId es válido
- Internet está disponible

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Verificar que el backend está deployado
2. Revisar console del navegador (F12)
3. Revisar logs de Cloud Functions en Firebase Console
4. Contactar al equipo de desarrollo

## 📄 Licencia

Plataforma propietaria. Prohibida la distribución no autorizada.

---

**Hecho con ❤️ para profesionales de eventos**

🎤 **Cross Karaoke** - La mejor plataforma de karaoke colaborativo
