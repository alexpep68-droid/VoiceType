# VoiceType Desktop (Windows)

App de bandeja del sistema que añade un atajo global a VoiceType.

## Cómo funciona

Electron **no** incluye el motor de reconocimiento de voz que usa Chrome —
por eso intentar escuchar el micrófono dentro de una ventana de Electron
nunca detecta nada, aunque el permiso del micrófono esté bien concedido.
En vez de pelear con esa limitación, esta app hace lo siguiente:

1. Presionas **Alt+Espacio** en cualquier aplicación.
2. VoiceType recuerda qué ventana tenías activa y abre
   `voice-type-gilt.vercel.app` en tu navegador (Chrome/Edge), donde el
   dictado sí funciona de verdad.
3. Dictas normalmente en la pestaña del navegador. Al terminar, la web ya
   copia el texto pulido al portapapeles automáticamente (esto no cambió).
4. VoiceType detecta ese cambio en el portapapeles, vuelve a poner el foco
   en la aplicación que tenías activa, y pega el texto ahí (Ctrl+V).
5. Presiona **Alt+Espacio** de nuevo antes de terminar si quieres cancelar
   la espera.

## Compilar en tu PC (Windows, con Node.js instalado)

```
cd electron
npm install
npm run dist
```

El instalador queda en `electron\dist\VoiceType Setup 0.1.0.exe`.

> Si `npm run dist` falla con "Cannot create symbolic link", corre la
> terminal como Administrador, o activa el Modo de desarrollador en
> Configuración de Windows → Privacidad y seguridad → Para desarrolladores.

## Notas

- El atajo por defecto es `Alt+Espacio` (constante `SHORTCUT` en
  `main.js`), elegido para evitar el conflicto de `Ctrl+Alt+Shift` con el
  cambio de idioma de teclado de Windows.
- No hay ninguna ventana propia de la app: vive solo en la bandeja del
  sistema. `preload.js` queda en el repo mas no se usa por este diseño
  (era para un intento anterior de dictar dentro de Electron).
