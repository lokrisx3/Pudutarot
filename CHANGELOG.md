# CHANGELOG

Este archivo registra los cambios, versiones y notas de lanzamiento del proyecto "Pudutarot".

Formato: seguimos una convención tipo "Keep a Changelog" simplificada en español.

## [Unreleased]
- Preparando nuevas correcciones y pequeñas mejoras (pendiente de pruebas y versionado).

## [1.1.0] - 

### Cambios
- Se corrige URL de contactos con error 404
- Se reemplaza cartas por imágenes sin texto

### Agregados
- Se Agrega "Modo Completo" donde usan los arcanos menores del tarot
- Se agrega imagen de luna y sol con animación
- Se agrega modo tarot completo



## [1.0.2] - 16 de septiembre de 2025
### Añadido
- Animación de revelado de carta con expansión horizontal sutil al consultar.
- Renderizado dinámico de la tabla de contactos (2 columnas) a partir de `data/contacts.json`.
- Normalización heurística de URLs de Imgur a enlaces directos `i.imgur.com` cuando es posible.
- Helper `createMeaningTableHTML` para mostrar los significados (Derecho / Invertido) en una tabla de 2 celdas.

### Cambiado
- El botón "Consultar" se deshabilita al iniciar la consulta y se vuelve a habilitar cuando la imagen de la carta termina de cargarse.
- Se removió la transparencia del `h2` de contactos y se aplicó el color sólido `#f0c929`.
- Reemplazo del uso remoto de three.js por `libs/three.min.js` incluido localmente (r128) para cumplir CSP de Manifest V3.
- Disminución de tipografías y espaciados en `styles.css`; ajustes de tabla de significados para una presentación más compacta.
- Se añadieron reglas CSS scoped a `#card-container` para aumentar el ancho horizontal de la tabla de significados en la vista de consulta y reducir el espacio vertical entre el nombre y la descripción.

### Documentación
- JSDoc e comentarios inline añadidos a `script.js` para describir funciones clave y flujos.

### Archivos modificados (resumen)
- `popup.html` — inclusión y ajustes menores de estructura.
- `styles.css` — estilos para `.meaning-table`, contactos, y reglas scoped para `#card-container`.
- `script.js` — lógica de consulta, manejo del botón "Consultar", renderer de contactos, normalización de Imgur y helper de significados.
- `data/contacts.json` — formato consumido por el renderer de contactos (si aplica).
- `libs/three.min.js` — versión local de three.js r128 incluida para CSP.



