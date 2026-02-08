# 📋 GUÍA DE CONFIGURACIÓN CROSS KARAOKE

## 1️⃣ CONFIGURACIÓN DE FIREBASE CONSOLE

### 1.1 Crear o seleccionar proyecto
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto o seleccionar "karaoke-cross"
3. Habilitar Google Analytics (recomendado)

### 1.2 Configurar Autenticación
1. **Authentication > Sign-in providers**
2. Habilitar:
   - ✅ **Google**
     - Agregar correo de soporte
   - ✅ **Email/Password**
   - (Opcional) ✅ **Teléfono**

3. En **Settings > Authorized domains**, agregar:
   - `localhost` (desarrollo local)
   - Tu dominio productivo (ej: `karaoke.ejemplo.com`)

### 1.3 Configurar Firestore Database
1. **Firestore Database > Create Database**
2. Seleccionar:
   - ✅ Start in **production mode**
   - Región: **nam5** (América del Norte)
3. Las reglas ya están en `firestore.rules`

### 1.4 Configurar Cloud Functions
1. **Cloud Functions > Getting Started**
2. Habilitar API (si solicita)
3. Cambiar región en `firebase.json` si es necesario:
   ```json
   "functions": {
     "source": "functions",
     "runtime": "nodejs18"
   }
   ```

### 1.5 Configurar Hosting
1. **Hosting > Get Started**
2. Seguir instrucciones (generalmente automático)

---

## 2️⃣ CONFIGURACIÓN LOCAL

### 2.1 Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2.2 Autenticar Firebase CLI
```bash
firebase login
firebase use karaoke-cross  # o seleccionar tu proyecto
```

### 2.3 Instalar Dependencias
```bash
# Backend
cd functions
npm install

# Volver a raíz (si es necesario)
cd ..
```

### 2.4 Variables de Entorno (funciones)

En `functions/.env.local` (crear si no existe):
```env
PROJECT_ID=karaoke-cross
YOUTUBE_API_KEY=tu_clave_api_youtube
# Agregar más variables según necesites
```

---

## 3️⃣ PRIMEROS PASOS

### 3.1 Crear Usuario AdminUser

**Opción A: Desde Firebase Console**
1. Ir a **Authentication > Users**
2. Crear usuario con email y contraseña
3. Copiar UID
4. Ir a **Firestore > users**
5. Crear documento con ID = UID:
```json
{
  "uid": "XXXXXXX",
  "email": "admin@example.com",
  "displayName": "Administrador",
  "role": "AdminUser",
  "expirationDate": null,
  "maxSessions": 999,
  "createdAt": 1707000000000
}
```

**Opción B: Programáticamente**
```javascript
// Desde Cloud Console
const admin = require('firebase-admin');
admin.initializeApp();

const uid = "new_user_uid";
await admin.firestore().collection('users').doc(uid).set({
  uid: uid,
  email: "admin@example.com",
  displayName: "Admin",
  role: "AdminUser",
  expirationDate: null,
  maxSessions: 999,
  createdAt: Date.now()
});
```

### 3.2 Probar Cloud Functions Localmente
```bash
# Terminal 1: Emulador
firebase emulators:start

# Terminal 2: En otra terminal
curl http://localhost:5001/karaoke-cross/us-central1/createSession \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"Test"}'
```

### 3.3 Probar Hosting Localmente
```bash
firebase serve
# Acceder a: http://localhost:5000
```

---

## 4️⃣ DEPLOY A PRODUCCIÓN

### 4.1 Pre-deploy Checklist
- [ ] Firestore rules actualizadas (`firestore.rules`)
- [ ] Cloud Functions compiladas (`npm run build` en functions)
- [ ] Variables de entorno configuradas
- [ ] Firebase CLI autenticado
- [ ] Proyecto correcto seleccionado (`firebase use`)

### 4.2 Paso a paso
```bash
# 1. Build frontend (si es necesario)
npm run build

# 2. Deploy Cloud Functions
cd functions
npm run deploy
# Esperar a que termine...

# 3. Deploy Hosting
cd ..
firebase deploy --only hosting

# 4. (Opcional) Deploy todo junto
firebase deploy
```

### 4.3 Verificar Deploy
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. **Cloud Functions**: Ver funciones desplegadas
3. **Hosting**: Ver sitio en vivo
4. **Firestore**: Verificar datos de prueba

---

## 5️⃣ CONFIGURACIÓN DE DOMINIO PERSONALIZADO

### 5.1 Con Firebase Hosting
1. **Hosting > Custom domain**
2. Agregar dominio
3. Seguir instrucciones para DNS
4. Esperar validación (5-48 horas)

### 5.2 Con proveedor externo (Cloudflare, Namecheap)
1. Apuntar DNS A a IP de Firebase
2. Configurar CNAME según Firebase indique
3. Agregar a authorized domains en Auth

---

## 6️⃣ CONFIGURACIÓN DE SEGURIDAD

### 6.1 Firestore Security Rules
Las reglas están en `firestore.rules` y restringen:
- ❌ Escritura directa desde frontend
- ✅ Solo lectura de datos propios
- ✅ AdminUser puede leer todo

Para actualizar:
```bash
firebase deploy --only firestore:rules
```

### 6.2 CORS y Headers
Cloud Functions ya incluyen `cors` habilitado. Para producción:

En `functions/src/index.ts`:
```typescript
const corsHandler = cors({
  origin: ["https://tudominio.com"],
  credentials: true
});
```

### 6.3 Variables Sensibles
Nunca commitear:
- API keys en frontend (usar emulator en desarrollo)
- Secret keys
- Credenciales de servicio

Usar:
- Firebase Secrets Manager para funciones
- Environment variables en `.env.local`

---

## 7️⃣ MONITOREO Y LOGS

### 7.1 Cloud Functions Logs
```bash
firebase functions:log
```

O en Firebase Console:
- **Cloud Functions > Logs**

### 7.2 Firestore Monitoring
- **Firestore > Monitor**
- Ver lecturas/escrituras en tiempo real
- Alertas de cuota

### 7.3 Analytics
- **Analytics > Dashboard**
- Seguimiento de eventos personalizados

---

## 8️⃣ SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Missing or insufficient permissions"
**Solución:**
1. Verificar `firestore.rules` está deployada
2. Usuario debe existir en `users` collection
3. Completar `checkUserAccess()` en app.js

### Error: "Cloud Functions not available"
**Solución:**
```bash
# Redeployar funciones
cd functions
npm run deploy
```

### Error: "Quota exceeded"
**Solución:**
1. Habilitar facturación en Firebase Console
2. Revisar uso en **Firestore > Monitor**
3. Implementar paginación en queries

### Error: "CORS policy"
**Solución:**
- Usar `cors()` en Cloud Functions (ya implementado)
- Agregar dominio a authorized domains

### Emulator no conecta
**Solución:**
```bash
# Limpiar y reiniciar
rm -rf ~/.config/firebase
firebase emulators:start --force
```

---

## 9️⃣ INTEGRACIÓN CON YOUTUBE DATA API

Para búsqueda real de canciones (no incluida por defecto):

### 9.1 Obtener API Key
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto
3. Habilitar **YouTube Data API v3**
4. Crear API key
5. Guardar en `.env`

### 9.2 Usar en Cloud Functions
```typescript
import axios from 'axios';

async function searchYouTube(query: string) {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      q: query,
      part: 'snippet',
      type: 'video',
      key: process.env.YOUTUBE_API_KEY
    }
  });
  return response.data.items;
}
```

### 9.3 Crear Cloud Function para búsqueda
```typescript
export const searchSongs = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Unauthenticated');
  const results = await searchYouTube(data.query);
  return results;
});
```

---

## 🔟 ESCALADO Y OPTIMIZACIÓN

### 10.1 Índices de Firestore
Ya defini los índices necesarios. Si agregaas queries complejas:
1. Firebase sugerirá crear índices automáticamente
2. O crear en `firestore.indexes.json`

### 10.2 Cache
Implementar Redis/Memcached para:
- Cache de búsquedas YouTube
- Sessions activas
- Metadata de videos

### 10.3 Load Testing
```bash
npm install -g artillery
artillery quick --count 100 --num 1000 https://tu-app.com
```

---

## 📞 SOPORTE

Para problemas:
1. Revisar [Firebase Docs](https://firebase.google.com/docs)
2. Verificar logs en Firebase Console
3. Revisar console.log en navegador (F12)
4. Stack Overflow tag: `firebase`

---

**Última actualización:** Feb 8, 2026
**Versión:** 1.0.0
