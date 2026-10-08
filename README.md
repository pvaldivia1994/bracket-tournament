# Arena Bracket

Bracket interactivo de eliminación doble para 16 equipos, creado con React, Vite y Firebase Firestore.

## Desarrollo local

```bash
npm install
npm run dev
```

## Activar Firebase

1. En Firebase Console, abre el proyecto `prueba-eliminar-33df2`.
2. En **Build → Firestore Database**, crea la base de datos.
3. Publica el contenido de `firestore.rules` en la pestaña **Rules**.

La app usa el documento `tournaments/main`. Si Firestore no está disponible o rechaza la conexión, sigue funcionando en modo local usando el navegador.

> Las reglas incluidas permiten editar públicamente ese único bracket. Para un torneo abierto en internet se recomienda añadir Firebase Authentication y restringir las escrituras a administradores.

## Publicar en GitHub Pages

El repositorio incluye un workflow en `.github/workflows/deploy.yml` que compila y publica cada push a `main`.

1. Sube el proyecto a un repositorio llamado `bracket-tournament`.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. Haz push a `main` o ejecuta manualmente el workflow **Deploy to GitHub Pages**.

La configuración de Vite usa la ruta `/bracket-tournament/`. Si el repositorio tendrá otro nombre, cambia `base` en `vite.config.js`.

También puedes publicar manualmente con:

```bash
npm run deploy
```
