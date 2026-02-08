# ✅ DEPLOYMENT CHECKLIST - PRODUCCIÓN

Use esta lista para garantizar que todo está listo antes de desplegar a producción.

---

## 📋 PRE-DEPLOYMENT (1-2 semanas antes)

### Configuración Firebase
- [ ] Proyecto creado en Firebase Console
- [ ] Stripe/facturación habilitado (si es necesario)
- [ ] Región seleccionada (nam5 recomendada)
- [ ] Scheduled Functions habilitadas
- [ ] Secret Manager configurado

### Seguridad
- [ ] HTTPS habilitado en Firebase Hosting
- [ ] Dominio personalizado configurado
- [ ] Authorized domains agregados en Auth
- [ ] CORS configurado en Cloud Functions
- [ ] Variables sensibles en Secret Manager (no en .env)

### Testing
- [ ] Pruebas unitarias del backend (functions)
- [ ] Pruebas de seguridad de Firestore rules
- [ ] Testing en emulator local completado
- [ ] Happy path testeado en staging
- [ ] Error cases testeados

### Documentación
- [ ] README actualizado
- [ ] API documentation verificada
- [ ] Database schema confirmado
- [ ] Runbooks creados para errores comunes

---

## 🔍 VERIFICACIÓN TÉCNICA (1 semana antes)

### Cloud Functions
- [ ] `npm run build` en functions compila sin errores
- [ ] Todas las funciones tienen permiso checks
- [ ] Error handling completo
- [ ] Logs informativos configurados
- [ ] Timeout aumentado si es necesario (default: 60s)

**Comando:**
```bash
cd functions
npm run build
# Verificar que compila sin errores
```

### Firestore Rules
- [ ] `firestore.rules` revisado por seguridad
- [ ] No permite create/update/delete directo desde frontend
- [ ] Read rules limitan acceso apropiadamente
- [ ] Índices definidos en `firestore.indexes.json`

**Verificar:**
```bash
firebase deploy --only firestore:rules --dry-run
```

### Frontend
- [ ] `firebase.js` tiene configuración correcta
- [ ] Sin API keys o secretos hardcodeados
- [ ] Error messages en español
- [ ] Responsive design testeado
- [ ] Browser compatibility verificado (Chrome, Edge, Firefox, Safari)
- [ ] Performance: < 3 segundos initial load

**Test:**
```bash
firebase serve
# Probar en navegador
```

### Performance
- [ ] Imágenes optimizadas
- [ ] JS minificado
- [ ] CSS minificado
- [ ] Lazy loading configurado (si es necesario)
- [ ] Service Worker instalado (opcional)

---

## 🔐 SEGURIDAD (5 días antes)

### OWASP Top 10
- [ ] ✅ No hay SQL injection (no hay SQL, pero validar inputs)
- [ ] ✅ Autenticación segura (Firebase Auth)
- [ ] ✅ Sensitive data exposure (HTTPS, no logs)
- [ ] ✅ XML External Entities (no aplicable)
- [ ] ✅ Broken access control (validar en backend)
- [ ] ✅ Security misconfiguration (revisar todas las reglas)
- [ ] ✅ Cross Site Scripting (sanitize user input)
- [ ] ✅ Insecure deserialization (no aplicable)
- [ ] ✅ Using components with XXX (usar versiones actualizadas)
- [ ] ✅ Insufficient logging (logs en Cloud Functions)

### Firebase Security
- [ ] Firestore rules bloqueadas (no .createdByAnyone = true)
- [ ] Storage rules configuradas (si usa Storage)
- [ ] Cloud Functions validación de auth en cada function
- [ ] Secrets no en código fuente
- [ ] Service account keys almacenadas seguramente

**Checklist:**
```bash
# Revisar cada rule
cat firestore.rules | grep "allow"

# No deberías ver:
# allow create: if true;
# allow update: if true;
# allow delete: if true;
```

### Datos Publicos
- [ ] No hay emails expuestos sin necesidad
- [ ] No hay UIDs visibles en URLs (solo en contexto seguro)
- [ ] Metadata no revela información sensible
- [ ] Logs no contienen tokens o contraseñas

---

## 📊 CAPACIDAD Y SCALING (3 días antes)

### Estimación de Carga
- [ ] Usuarios esperados por mes: ___
- [ ] Picos simultáneos: ___
- [ ] Lectura/escritura estimada: ___
- [ ] Almacenamiento esperado: ___

**Ejemplo:**
```
- 1000 usuarios activos
- 100 sesiones simultáneas
- Máximo 5000 escrituras/día
- Cache 10000 videos ≈ 5 MB
```

### Cuotas Firestore
- [ ] Lectura/escritura por segundo está dentro de límite
- [ ] Almacenamiento dentro del plan
- [ ] Transacciones contabilizadas
- [ ] Índices evaluados para costo

**Cálculos:**
```
Lectura típica: 1 KB = 1 lectura
Escritura típica: 1 KB = 1 escritura
100 usuarios * 10 operaciones/hora = 1000 ops/hora = 0.3 ops/seg
```

### Auto-scaling Cloud Functions
- [ ] Memory asignada (default: 256 MB, recomendado: 512 MB)
- [ ] Timeout asignado (default: 60s, recomendado: 120s)
- [ ] Máximo de instancias (si es necesario)
- [ ] Concurrencia configurada

---

## 🧪 TESTING FINAL (2 días antes)

### Smoke Testing
- [ ] ✅ Login con Google funciona
- [ ] ✅ Login con Email funciona
- [ ] ✅ Crear sesión funciona
- [ ] ✅ Agregar canción a cola funciona
- [ ] ✅ Mostrar Display funciona
- [ ] ✅ Solicitar canción funciona
- [ ] ✅ Panel admin funciona
- [ ] ✅ Expiración de usuario funciona
- [ ] ✅ Límite de sesiones funciona

### Cross-browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Edge (desktop)

### Performance Testing
- [ ] Página carga en < 3 segundos
- [ ] Interactividad < 2 segundos
- [ ] Scroll smooth (60 fps)
- [ ] Sin memory leaks (F12 > Memory)

**Herramientas:**
```
Lighthouse: chrome devtools (F12 > Lighthouse)
gtmetrix.com: Performance report
webpagetest.org: Detailed metrics
```

### Load Testing (opcional)
```bash
npm install -g artillery

artillery quick --count 100 --num 1000 https://staging-app.com
```

---

## 📚 BACKUPS Y RECOVERY (Semana antes)

### Firestore Backup
```bash
# Crear backup automático
gsutil mb gs://backup-karaoke-prod
gcloud firestore export gs://backup-karaoke-prod/backup-$(date +%Y%m%d)
```

- [ ] Backup automático programado
- [ ] Retention policy configurada (30 días mínimo)
- [ ] Procedimiento de restore testeado

### Code Backup
- [ ] Código en Git (GitHub, Bitbucket, etc.)
- [ ] Branch main protegido
- [ ] Todos los cambios commiteados
- [ ] Tags de versión creadas (v1.0.0)

---

## 🚀 DEPLOYMENT CHECKLIST (Día D)

### Antes de Desplegar
- [ ] Último backup creado
- [ ] Todos los logs limpios
- [ ] Todos los TODOs resueltos
- [ ] Versión bumpada (vX.Y.Z)
- [ ] Changelog actualizado

### Pasos de Deployment

**Paso 1: Cloud Functions**
```bash
cd functions
npm run build
npm run deploy
# Esperar que termine (5-10 min)
```

- [ ] Deploy exitoso (sin errores)
- [ ] Ver en Firebase Console > Cloud Functions
- [ ] Al menos 1 función respondiendo

**Paso 2: Firestore Rules**
```bash
firebase deploy --only firestore:rules
# Esperar que termine (2-5 min)
```

- [ ] Deploy exitoso
- [ ] Verificar en Firebase Console > Firestore > Rules

**Paso 3: Hosting**
```bash
firebase deploy --only hosting
# O: firebase deploy para todo
```

- [ ] Deploy exitoso
- [ ] Sitio accesible en dominio
- [ ] Mostrar loading spinner mientras carga

### Post-Deployment
- [ ] Acceder al sitio en vivo
- [ ] Probar login (Google y Email)
- [ ] Crear sesión de prueba
- [ ] Verificar Cloud Functions logs (sin errores)
- [ ] Verificar Firestore Monitor (sin spikes anómalos)

---

## 📱 POST-DEPLOYMENT (Primeras 24h)

### Monitoreo Hiper-Activo
- [ ] Logs de Cloud Functions cada 15 min
- [ ] Firestore Monitor cada 15 min
- [ ] Hosting analytics cada hora
- [ ] User feedback channels monitoreados

**Canales monitorear:**
- Slack/Discord de soporte
- Correo de soporte@karaoke-cross.com
- Firebase Console > Crashes (si aplica)

### Métricas a Revisar
- [ ] Errores en Cloud Functions: 0%
- [ ] Latencia normal (< 500ms)
- [ ] Lectura/escritura dentro de límites
- [ ] No hay bloqueos de usuarios
- [ ] Load balancing normal

### Rollback Plan (si es necesario)
```bash
# Si hay problema crítico:
git checkout v{version-anterior}
firebase deploy
```

- [ ] Versión anterior testeada
- [ ] Rollback script preparado
- [ ] Equipo informado

---

## 🎉 POST-DEPLOYMENT (Semana 1)

- [ ] Sin reportes de bugs críticos
- [ ] Rendimiento estable
- [ ] Usuarios activos contentos
- [ ] Documentación de deployment hecha
- [ ] Runbook de troubleshooting actualizado

---

## 📋 DOCUMENTACIÓN PARA EQUIPO

Crear estos documentos:

```markdown
📁 /docs/
├── DEPLOYMENT.md (este archivo)
├── RUNBOOK.md (cómo responder a errores comunes)
├── ROLLBACK.md (cómo revertir si hay problema)
├── MONITORING.md (qué monitorear y cuándo)
└── CONTACT.md (a quién contactar para cada tipo de problema)
```

**RUNBOOK.md ejemplo:**
```markdown
# Error: "Permission denied"

## Síntomas
- Usuarios no pueden crear sesiones
- Console error: "permission-denied"

## Causa probable
- Firestore rules mal deployadas

## Solución
1. ssh a Firebase Console
2. Ir a Firestore > Rules
3. Verificar está bien
4. Firebase deploy --only firestore:rules

## Prevención
- Pull request review antes de deploy
- Test en staging antes de prod
```

---

## 🚨 COMPLICACIONES COMUNES

### Cloud Functions no responden
```bash
firebase functions:log
# Buscar errores en logs
firebase deploy --only functions
```

### Firestore bloqueado
```bash
# Verificar reglas
firebase deploy --only firestore:rules --dry-run
# Ver qué cambiaría
firebase deploy --only firestore:rules
```

### Sitio no carga
```bash
# Verificar hosting
firebase deploy --only hosting
# Limpiar cache del navegador (Ctrl+Shift+Delete)
```

### Demasiado tráfico
```bash
# Aumentar instancias de Cloud Functions:
# en functions/package.json o con gcloud:
gcloud functions deploy functionName --max-instances 100
```

---

## ✨ DESPUÉS DEL ÉXITO

- [ ] Celebrar 🎉
- [ ] Documentar todo lo aprendido
- [ ] Agradecer al equipo
- [ ] Planificar v1.1 con mejoras
- [ ] Configurar monitoreo automático permanente

---

**Versión:** 1.0.0  
**Última actualización:** Feb 8, 2026  
**Por:** Equipo Cross Karaoke
