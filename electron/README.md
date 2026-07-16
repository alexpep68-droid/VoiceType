# VoiceType Desktop (Windows)

Wrapper de Electron para VoiceType. Carga la app web (`voice-type-gilt.vercel.app`)
y añade:

- Atajo de teclado global **Alt+Espacio** para iniciar/detener el dictado desde
  cualquier aplicación.
- Pegado automático: al terminar de dictar, el texto pulido (que la web ya
  copia al portapapeles) se pega automáticamente en la app que tenías activa,
  usando `SendKeys` de Windows vía PowerShell — sin módulos nativos de Node.

## Compilar en tu PC (Windows, con Node.js ya instalado)

```
cd electron
npm install
npm run dist
```

El instalador queda en `electron/dist/VoiceType Setup 0.1.0.exe`. Ejecútalo,
y desde entonces el ícono de VoiceType vivirá en la bandeja del sistema.

## Notas

- El atajo por defecto es `Alt+Espacio`. Se eligió para evitar el conflicto
  con `Ctrl+Alt+Shift`, que Windows usa para cambiar el idioma del teclado en
  máquinas con más de un idioma instalado. Se puede cambiar editando la
  constante `SHORTCUT` en `main.js`.
- Requiere que `src/App.tsx` tenga el puente `window.voicetypeDesktop`
  (agregado en este mismo cambio) para que el atajo global controle el
  micrófono y para que la app avise cuándo el texto ya está en el
  portapapeles.
