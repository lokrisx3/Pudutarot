# PuduTarot

Una extensión de Google Chrome para consultar una carta del tarot de arcanos mayores de manera aleatoria, con un pudú como guía espiritual.

## Notas de desarrollo

1) three.js local

	- Por motivos de empaquetado y Content Security Policy de extensiones (Manifest V3) no se recomienda cargar librerías desde CDNs en runtime.
	- Este proyecto referencia `libs/three.min.js` desde `popup.html`. Para que la funcionalidad que dependa de three.js funcione offline/packaged, descarga la versión minificada de Three.js (por ejemplo r128) y guarda el archivo como:

		libs/three.min.js

	- Fuentes válidas para descargar (ejemplo):
		- https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js
		- https://unpkg.com/three@0.128.0/build/three.min.js
		- https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

	- Después de colocar `libs/three.min.js` en la carpeta `libs/`, recarga la extensión en Chrome (ver siguiente sección).

2) Cargar la extensión en Chrome (modo desarrollador)

	- Abre chrome://extensions/
	- Activa "Developer mode" (arriba a la derecha).
	- Haz clic en "Load unpacked" y selecciona la carpeta del proyecto (el folder que contiene `manifest.json`, p.ej. `pudutarot`).
	- Abre el popup de la extensión para probar. Si ves errores en consola relacionados con `three.min.js`, revisa que `libs/three.min.js` exista y sea la build correcta.

3) Reemplazar placeholder

	- Actualmente `libs/three.min.js` puede contener un placeholder. Sustituye ese archivo por la versión minificada real descargada de los enlaces anteriores.

4) Notas adicionales

	- Contactos: los datos se cargan desde `data/contacts.json`. Puedes editar ese JSON para añadir/actualizar contactos.
	- Si quieres que inserte la versión minificada de three.js directamente en el repo, dímelo y la pegaré en `libs/three.min.js` (archivo grande).

## Descripción

PuduTarot es una extensión simple que te permite consultar una carta del tarot de arcanos mayores de manera aleatoria. La interfaz muestra a un pudú disfrazado de mago sosteniendo un mazo de cartas. Al hacer clic en el botón "Consultar", el pudú revolverá las cartas por 2 segundos y luego mostrará la carta seleccionada junto con su nombre y una breve descripción.

## Características

- Interfaz simple y atractiva
- Animación de barajado de cartas
- 22 cartas de arcanos mayores con descripciones

## Instalación

1. Clona o descarga este repositorio
2. Abre Google Chrome y navega a `chrome://extensions/`
3. Activa el "Modo desarrollador" en la esquina superior derecha
4. Haz clic en "Cargar descomprimida" y selecciona la carpeta del proyecto
5. ¡Listo! La extensión debería aparecer en tu barra de herramientas

## Uso

1. Haz clic en el icono de PuduTarot en la barra de herramientas de Chrome
2. Se abrirá una ventana emergente con el pudú mago
3. Haz clic en el botón "Consultar"
4. Observa cómo el pudú revuelve las cartas
5. Después de 2 segundos, se mostrará la carta seleccionada con su nombre y descripción

## Estructura del Proyecto

```
pudutarot/
├── manifest.json        # Configuración de la extensión
├── popup.html          # Interfaz principal
├── styles.css          # Estilos de la interfaz
├── script.js           # Lógica de la aplicación
├── data/               # Datos de las cartas
│   ├── majorArcana.json# Datos de las cartas en Json
├── images/             # Imágenes de la extensión
│   ├── icon128.svg     # Icono 128x128
│   ├── pudu-mago.svg   # Pudú mago con mazo
│   ├── pudu-shuffling.svg # Pudú revolviendo cartas
│   └── cards/          # Cartas del tarot
│       ├── fool.svg    # El Loco
│       ├── magician.svg # El Mago
│       ├── high-priestess.svg # La Sacerdotisa
│       └── ...         # Otras cartas
└── README.md           # Documentación
```

## Personalización

Puedes personalizar la extensión modificando los siguientes archivos:

- `styles.css`: Cambia los colores, tamaños y animaciones
- `script.js`: Modifica las descripciones de las cartas o añade funcionalidades
- `images/`: Reemplaza las imágenes con tus propios diseños

## Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de usar, modificar y distribuir el código como desees.

## Créditos

Creado con ❤️ para todos los amantes de los pudúes y el tarot.