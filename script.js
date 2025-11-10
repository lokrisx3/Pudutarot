/**
 * PuduTarot popup script
 * ----------------------
 * Responsable de la l�gica de la UI del popup:
 * - carga de datos (majorArcana)
 * - selecci�n aleatoria de cartas y renderizado
 * - manejo de la lista de arcanos
 * - renderizado din�mico de la secci�n de contactos (desde data/contacts.json)
 *
 * Dise�o:
 * - usa fetch para cargar JSON local (data/majorArcanaMarseille.json, data/majorArcanaRider.json y data/contacts.json)
 * - mantiene fallbacks locales cuando la carga remota / externa falla
 * - no incluye dependencias externas en runtime (three.js se sirve localmente)
 *
 * Nota: este archivo se ejecuta dentro del popup (document root del popup). Las rutas
 * relativas (p.ej. data/...) est�n relativas al paquete de la extensi�n.
 */

/**
 * M�dulo popup: script.js
 * ----------------------
 * API p�blica (documentada):
 * - getMajorArcana(deck): Array<Object>  � devuelve la lista de arcanos para el mazo solicitado.
 * - getRandomCard(): Object             � retorna una carta aleatoria del mazo actual.
 * - showCard(card): void                � muestra la carta en el UI (maneja imagen y reactivaci�n del bot�n).
 * - loadAndRenderContacts(): Promise<void> � carga `data/contacts.json` y renderiza la tabla de contactos.
 * - renderContactsTable(contacts): void � renderiza tabla de contactos (2 por fila) con logos y enlaces.
 * - applyCellBackgroundWithFallback(cell, logoUrl): void � intenta precargar logo y aplica fallback local si falla.
 * - renderArcanaList(): void            � renderiza el listado lateral de arcanos.
 *
 * Contratos (forma resumida):
 * - Carta: { id:number, name:string, file:string, image:string, meaning?:object, description?:string, history?:string }
 * - Contacto: { name:string, description?:string, logo?:string, links: { [key]: string|{url,icon?,label?} } }
 *
 * Consideraciones de errores:
 * - Las cargas de JSON usan fetch y aplican fallback local si fallan (no interrumpen la UI).
 * - applyCellBackgroundWithFallback tiene timeout y onerror para evitar bloqueos por recursos externos lentos.
 */

document.addEventListener('DOMContentLoaded', function () {
  const consultButton = document.getElementById('consult-button');
  const puduContainer = document.getElementById('pudu-container');
  const puduShufflingContainer = document.getElementById('pudu-shuffling-container');
  const cardContainer = document.getElementById('card-container');
  const tarotCard = document.getElementById('tarot-card');
  const cardName = document.getElementById('card-name');
  const cardDescription = document.getElementById('card-description');
  const textElementoNode = document.getElementById('textElemento');
  const textAstrologyNode = document.getElementById('textAstrology');
  const textYesNoNode = document.getElementById('textyesno') || document.getElementById('textYesNo');
  const listElementNode = document.getElementById('textElementoListado');
  const listAstrologyNode = document.getElementById('textAstrologyListado');
  const listYesNoNode = document.getElementById('textYesNoListado');
  const deckMarseilleButton = document.getElementById('deck-marseille');
  const deckRiderButton = document.getElementById('deck-rider');
  let currentDeck = 'Marseille';

  // Prefer loading the cards from JSON; keep an in-file fallback if fetch fails
  const majorArcanaFallback = [
    { id: 0, name: 'El Loco', file: 'fool', description: 'Nuevos comienzos, espontaneidad, fe en la vida.' },
    { id: 1, name: 'El Mago', file: 'magician', description: 'Manifestaci�n, poder personal, habilidad.' },
    { id: 2, name: 'La Sacerdotisa', file: 'high-priestess', description: 'Intuici�n, sabidur�a inconsciente, misterio.' },
    { id: 3, name: 'La Emperatriz', file: 'empress', description: 'Fertilidad, creatividad, abundancia.' },
    { id: 4, name: 'El Emperador', file: 'emperor', description: 'Autoridad, estructura, control, liderazgo.' },
    { id: 5, name: 'El Hierofante', file: 'hierophant', description: 'Tradici�n, conformidad, moralidad, �tica.' },
    { id: 6, name: 'Los Enamorados', file: 'lovers', description: 'Amor, armon�a, relaciones, valores, elecciones.' },
    { id: 7, name: 'El Carro', file: 'chariot', description: 'Control, voluntad, �xito, determinaci�n.' },
    { id: 8, name: 'La Fuerza', file: 'strength', description: 'Coraje, persuasi�n, influencia, compasi�n.' },
    { id: 9, name: 'El Ermita�o', file: 'hermit', description: 'Introspecci�n, b�squeda, orientaci�n interna.' },
    { id: 10, name: 'La Rueda de la Fortuna', file: 'wheel-of-fortune', description: 'Cambio, ciclos, destino, punto de inflexi�n.' },
    { id: 11, name: 'La Justicia', file: 'justice', description: 'Justicia, equidad, verdad, ley, equilibrio.' },
    { id: 12, name: 'El Colgado', file: 'hanged-man', description: 'Rendici�n, perspectiva, suspensi�n, sacrificio.' },
    { id: 13, name: 'La Muerte', file: 'death', description: 'Fin de un ciclo, cambio, transformaci�n, transici�n.' },
    { id: 14, name: 'La Templanza', file: 'temperance', description: 'Balance, moderaci�n, paciencia, prop�sito.' },
    { id: 15, name: 'El Diablo', file: 'devil', description: 'Sombra, apegos, adicci�n, restricci�n, sexualidad.' },
    { id: 16, name: 'La Torre', file: 'tower', description: 'Cambio repentino, liberaci�n, revelaci�n, despertar.' },
    { id: 17, name: 'La Estrella', file: 'star', description: 'Esperanza, fe, prop�sito, renovaci�n, espiritualidad.' },
    { id: 18, name: 'La Luna', file: 'moon', description: 'Ilusi�n, miedo, ansiedad, subconsciente, intuici�n.' },
    { id: 19, name: 'El Sol', file: 'sun', description: 'Positividad, diversi�n, calidez, �xito, vitalidad.' },
    { id: 20, name: 'El Juicio', file: 'judgement', description: 'Reflexi�n, renacimiento, renovaci�n interna, absoluci�n.' },
    { id: 21, name: 'El Mundo', file: 'world', description: 'Realizaci�n, integraci�n, logro, viaje, armon�a.' }
  ];

  // Fuentes de datos por mazo (Marseille y Rider)
  const deckSources = {
    Marseille: 'data/majorArcanaMarseille.json',
    Rider: 'data/majorArcanaRider.json'
  };
  const deckImageFolders = {
    Marseille: 'images/cards/Marseille',
    Rider: 'images/cards/rider'
  };
  const majorArcanaDeckData = {
    Marseille: [],
    Rider: []
  };
  const majorArcanaDeckHistory = {
    Marseille: '',
    Rider: ''
  };
  const majorArcanaDeckLinks = {
    Marseille: [],
    Rider: []
  };
  const deckLoadState = {
    Marseille: false,
    Rider: false
  };
  const deckLoadPromises = {};

  /**
   * Intenta cargar los listados de arcanos mayores para cada mazo desde sus
   * respectivos archivos JSON. Si falla, se utilizar? el fallback embebido.
   */
  (async function preloadDecks() {
    try {
      await Promise.all(Object.keys(deckSources).map(loadDeckData));
    } catch (error) {
      console.warn('Error preloading decks, using fallback data.', error);
    }
    majorArcana = getMajorArcana(currentDeck);
    document.dispatchEvent(new CustomEvent('pudutarot:major-arcana-loaded', { detail: { deck: currentDeck } }));
    // mostrar la historia del mazo cargado inicialmente
    try { updateHistoryDeck(currentDeck); } catch (e) { /* noop */ }
  })();

  function normalizeCard(card) {
    return {
      id: card.id,
      name: card.name,
      file: card.file,
      meaning: card.meaning || {},
      description: card.description,
      history: card.history || '',
      elemento: card.elemento || card.element || '',
      astrologia: card.astrologia || card.astrology || '',
      respuesta: card.respuesta || card.respuestaSiNo || card.respuestaYesNo || card.respuestaSi || card.respuestaNo || card.siNo || card.yesno || card.yesNo || ''
    };
  }

  function normalizeDeckLinks(rawLinks) {
    if (!rawLinks || typeof rawLinks !== 'object') return [];
    return Object.entries(rawLinks).reduce((acc, [label, value]) => {
      if (!label) return acc;
      let url = '';
      let displayLabel = label;
      if (typeof value === 'string') {
        url = value;
      } else if (value && typeof value === 'object') {
        url = typeof value.url === 'string' ? value.url : '';
        displayLabel = value.label || label;
      }
      if (typeof url === 'string' && url.trim()) {
        acc.push({ label: displayLabel, url: url.trim() });
      }
      return acc;
    }, []);
  }

  async function loadDeckData(deck) {
    if (deckLoadState[deck]) return majorArcanaDeckData[deck];
    if (deckLoadPromises[deck]) return deckLoadPromises[deck];

    const source = deckSources[deck];
    deckLoadPromises[deck] = (async () => {
      try {
        const res = await fetch(source);
        if (!res.ok) throw new Error('JSON not available');
        const data = await res.json();
        // Extract deck-level history if present (HistoryDeck or History) along with deck links
        if (Array.isArray(data) && data.length && typeof data[0] === 'object') {
          majorArcanaDeckHistory[deck] = data[0].HistoryDeck || data[0].History || '';
          majorArcanaDeckLinks[deck] = normalizeDeckLinks(data[0].links || data[0].Links);
        } else {
          majorArcanaDeckHistory[deck] = '';
          majorArcanaDeckLinks[deck] = [];
        }
        // If no deck-level history is present, provide a small default for Marseille
        if ((!majorArcanaDeckHistory[deck] || !majorArcanaDeckHistory[deck].trim()) && deck === 'Marseille') {
          majorArcanaDeckHistory[deck] = 'El Tarot de Marsella es uno de los mazos tradicionales más antiguos y usados en la cartomancia europea. Sus imágenes provienen de estilos renacentistas y folclóricos, enfocadas en símbolos arquetípicos y en una iconografía más sobria que otros mazos modernos.';
        }
        const cards = Array.isArray(data) ? data.filter(item => typeof item.id === 'number').map(normalizeCard) : [];
        if (!cards.length) throw new Error('Empty deck data');
        majorArcanaDeckData[deck] = cards;
      } catch (error) {
        console.warn('Could not load ' + source + ', using fallback data.', error);
        majorArcanaDeckData[deck] = majorArcanaFallback.map(normalizeCard);
        majorArcanaDeckHistory[deck] = '';
        majorArcanaDeckLinks[deck] = [];
      } finally {
        deckLoadState[deck] = true;
        deckLoadPromises[deck] = null;
      }
      return majorArcanaDeckData[deck];
    })();

    return deckLoadPromises[deck];
  }

  function pickImagePathForDeckFile(deck, filePath) {
    if (!filePath) return filePath;
    if (filePath.toLowerCase().includes('arcanosmayores/')) {
      return filePath.replace(/\.jpg$/i, '.JPG');
    }
    return filePath;
  }

  function normalizePath(value) {
    return typeof value === 'string' ? value.split('\\').join('/') : '';
  }

  function resolveDeckImage(deck, card) {
    const folder = deckImageFolders[deck] || deckImageFolders.Rider;
    const fileField = (card && typeof card.file === 'string') ? card.file.trim() : '';
    if (fileField) {
      if (fileField.includes('/') && /\.[a-z0-9]+$/i.test(fileField)) {
        const adjusted = pickImagePathForDeckFile(deck, fileField);
        return normalizePath(`${folder}/${adjusted}`);
      }
      if (/\.[a-z0-9]+$/i.test(fileField)) {
        return normalizePath(`${folder}/${fileField}`);
      }
      const normalized = (deck === 'Marseille' && fileField === 'hermit') ? 'ermitano' : fileField;
      return normalizePath(`${folder}/${normalized}.jpg`);
    }
    return normalizePath(`${folder}/fool.jpg`);
  }

  function getMajorArcana(deck) {
    const rawDeck = (majorArcanaDeckData[deck] && majorArcanaDeckData[deck].length)
      ? majorArcanaDeckData[deck]
      : majorArcanaFallback.map(normalizeCard);

    return rawDeck
      .filter(card => typeof card.id === 'number' && card.name)
      .map(card => ({
        id: card.id,
        name: card.name,
        file: card.file,
        image: resolveDeckImage(deck, card),
        meaning: card.meaning || {},
        description: card.description,
        history: card.history || '',
        elemento: card.elemento || '',
        astrologia: card.astrologia || '',
        respuesta: card.respuesta || ''
      }));
  }
  let majorArcana = getMajorArcana(currentDeck);

  // Funci�n para seleccionar una carta aleatoria
  function getRandomCard() {
    // If full deck mode is enabled include minor arcana when available
    const useFull = fullDeckMode && minorArcanaLoaded;
    const pool = useFull ? getMajorArcana(currentDeck).concat(getMinorArcana(currentDeck)) : getMajorArcana(currentDeck);
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  // --- Minor Arcana support (Tarot Completo) ---
  let fullDeckMode = false;
  const minorArcanaSource = 'data/minorArcana.json';
  let minorArcanaRaw = [];
  let minorArcanaLoaded = false;
  let minorArcanaLoadPromise = null;
  // suit histories (extracted from the first element of minorArcana.json)
  let minorArcanaSuitHistory = { bastos: '', copas: '', espadas: '', oros: '' };

  function normalizeMinorCard(card) {
    return {
      id: card.id,
      name: card.name,
      file: card.file,
      suit: card.suit || null,
      meaning: card.meaning || {},
      description: card.description || '',
      history: card.history || '',
      elemento: card.elemento || card.element || '',
      astrologia: card.astrologia || card.astrology || '',
      respuesta: card.respuesta || card.respuestaSiNo || card.respuestaYesNo || card.respuestaSi || card.respuestaNo || card.siNo || card.yesno || card.yesNo || ''
    };
  }

  async function loadMinorArcana() {
    if (minorArcanaLoaded) return minorArcanaRaw;
    if (minorArcanaLoadPromise) return minorArcanaLoadPromise;

    minorArcanaLoadPromise = (async () => {
      try {
        const res = await fetch(minorArcanaSource);
        if (!res.ok) throw new Error('minorArcana.json not available');
        const data = await res.json();
        // Extract suit-level histories from the descriptor object if present
        if (Array.isArray(data) && data.length && typeof data[0] === 'object') {
          minorArcanaSuitHistory.bastos = data[0].historyBastos || '';
          minorArcanaSuitHistory.copas = data[0].historyCopas || '';
          minorArcanaSuitHistory.espadas = data[0].historyEspadas || '';
          minorArcanaSuitHistory.oros = data[0].historyOros || '';
        }
        const cards = Array.isArray(data) ? data.filter(it => typeof it.id === 'number').map(normalizeMinorCard) : [];
        if (!cards.length) throw new Error('Empty minor arcana data');
        minorArcanaRaw = cards;
        minorArcanaLoaded = true;
      } catch (err) {
        console.warn('Could not load ' + minorArcanaSource + ', minor arcana will be unavailable.', err);
        minorArcanaRaw = [];
        minorArcanaLoaded = false;
      } finally {
        minorArcanaLoadPromise = null;
      }
      return minorArcanaRaw;
    })();

    return minorArcanaLoadPromise;
  }

  function getMinorArcana(deck) {
    if (!minorArcanaRaw || !minorArcanaRaw.length) return [];
    return minorArcanaRaw.map(card => ({
      id: card.id,
      name: card.name,
      file: card.file,
      suit: card.suit,
      image: resolveDeckImage(deck, card),
      meaning: card.meaning || {},
      description: card.description || '',
      history: card.history || '',
      elemento: card.elemento || '',
      astrologia: card.astrologia || '',
      respuesta: card.respuesta || ''
    }));
  }

  function getCombinedDeck(deck) {
    return getMajorArcana(deck).concat(getMinorArcana(deck));
  }

  /**
   * showCard(card)
   * ----------------
   * Muestra la carta seleccionada en el popup: actualiza la imagen, el t�tulo
   * y la descripci�n. Adem�s gestiona la reactivaci�n del bot�n de "Consultar"
   * cuando la imagen haya terminado de cargarse para evitar m�ltiples clics
   * durante la animaci�n de revelado.
   *
   * Par�metros:
   * - card: objeto con al menos { image, name, meaning?, description? }
   */

  /**
   * Muestra la carta seleccionada en el popup.
   *
   * @param {Object} card - Carta con al menos { image, name, meaning?, description? }
   * @returns {void}
   */
  function applyCardMetaValue(node, label, value) {
    if (!node) return;
    const sanitized = (value && String(value).trim()) ? String(value).trim() : 'No definido';
    node.textContent = `${label}: ${sanitized}`;
  }

  function resolveYesNoValue(baseValue, inverted) {
    if (!baseValue && baseValue !== 0) return baseValue;
    const raw = String(baseValue).trim();
    if (!raw) return raw;
    if (!inverted) return raw;
    const normalized = raw.toLowerCase();
    if (normalized === 'si' || normalized === 'sí') return 'No';
    if (normalized === 'no') return 'Si';
    return raw;
  }

  function showCard(card) {
    tarotCard.src = card.image;
    cardName.textContent = card.name;
    const showReversedImage = Math.random() < 0.5;
    tarotCard.classList.toggle('reversed', showReversedImage);
    applyCardMetaValue(textElementoNode, 'Elemento', card.elemento);
    applyCardMetaValue(textAstrologyNode, 'Astrologia', card.astrologia);
    const yesNoValue = resolveYesNoValue(card.respuesta, showReversedImage);
    applyCardMetaValue(textYesNoNode, 'Respuesta Si/No', yesNoValue);

    // Reactivar el bot�n de consultar cuando la imagen haya terminado de cargarse y la carta est� visible
    function enableConsultButton() {
      consultButton.disabled = false;
      consultButton.classList.remove('disabled');
    }

    // Si la imagen se carga correctamente, aseguramos reactivar el bot�n
    // usamos 'load' porque garantiza que la imagen se ha renderizado y las dimensiones son conocidas
    tarotCard.addEventListener('load', function () {
      // peque�a espera para garantizar que las transiciones de visibilidad hayan terminado
      setTimeout(function () {
        if (cardContainer.classList.contains('visible')) enableConsultButton();
      }, 90);
    });
    // show meanings (derecho / invertido) when available
    const upright = (card.meaning && card.meaning.upright) ? card.meaning.upright : (card.description || '');
    const reversed = (card.meaning && card.meaning.reversed) ? card.meaning.reversed : '';
    // Mostrar la tabla horizontal de Derecho / Invertido
    cardDescription.innerHTML = createMeaningTableHTML(upright, reversed);
    // aplicar estilo igual que history-deck para la descripción de la consulta
    if (cardDescription && !cardDescription.classList.contains('history-deck-paragraph')) {
      cardDescription.classList.add('history-deck-paragraph');
    }
    // Nota: la historia de cada carta NO se muestra en la sección de consulta.
    // Se mantiene solo la tabla de Derecho/Invertido (cardDescription).
    puduShufflingContainer.classList.remove('visible');
    puduShufflingContainer.classList.add('hidden');
    cardContainer.classList.remove('hidden');
    cardContainer.classList.add('visible');
    // Nota visual: al hacer visible #card-container se activa el selector CSS
    // "#card-container.visible #tarot-card", que es el que estira/agranda la imagen.
    // ensure arcana detail is hidden when showing a random card
    const arcanaDetail = document.getElementById('arcana-detail');
    if (arcanaDetail) arcanaDetail.classList.add('hidden');
  }

  // Evento al hacer clic en el bot�n de consulta
  consultButton.addEventListener('click', function () {
    // deshabilitar el bot�n para evitar m�ltiples consultas mientras se procesa
    consultButton.disabled = true;
    consultButton.classList.add('disabled');

    puduContainer.classList.remove('visible');
    puduContainer.classList.add('hidden');
    puduShufflingContainer.classList.remove('hidden');
    puduShufflingContainer.classList.add('visible');
    cardContainer.classList.remove('visible');
    cardContainer.classList.add('hidden');
    setTimeout(function () {
      const selectedCard = getRandomCard();
      showCard(selectedCard);
    }, 2000);
  });

  // Alternar mazo
  async function switchDeck(deck) {
    if (!deckSources[deck]) return;
    currentDeck = deck;
    await loadDeckData(deck);
    majorArcana = getMajorArcana(deck);
    if (deck === 'Marseille') {
      deckMarseilleButton.classList.add('selected');
      deckRiderButton.classList.remove('selected');
    } else {
      deckRiderButton.classList.add('selected');
      deckMarseilleButton.classList.remove('selected');
    }
    if (typeof renderArcanaList === 'function' && arcanaSection && !arcanaSection.classList.contains('hidden')) {
      renderArcanaList();
    }
    // actualizar el párrafo de historia del mazo
    try { updateHistoryDeck(deck); } catch (e) { /* noop */ }
    document.dispatchEvent(new CustomEvent('pudutarot:deck-changed', { detail: { deck } }));
  }

  // conectar botones físicos del UI al cambio de mazo
  if (deckMarseilleButton) {
    deckMarseilleButton.addEventListener('click', function () { switchDeck('Marseille'); });
  }
  if (deckRiderButton) {
    deckRiderButton.addEventListener('click', function () { switchDeck('Rider'); });
  }

  // --- Lista de Arcanos: renderizar y manejar clicks ---
  const arcanaListContainer = document.getElementById('arcana-list');
  const arcanaDetail = document.getElementById('arcana-detail');
  const arcanaDetailName = document.getElementById('arcana-detail-name');
  const arcanaDetailDesc = document.getElementById('arcana-detail-desc');
  const arcanaDetailHistory = document.getElementById('arcana-detail-history');
  const historyDeckEl = document.getElementById('history-deck');

  function updateHistoryDeck(deck) {
    if (!historyDeckEl) return;
    const text = majorArcanaDeckHistory[deck] || '';
    const links = majorArcanaDeckLinks[deck] || [];
    // Limpiar contenido previo
    historyDeckEl.innerHTML = '';
    // Si no hay texto, ocultar usando la clase 'hidden' (estilo provisto en styles.css)
    if (!text || !text.trim()) {
      historyDeckEl.classList.add('hidden');
      return;
    }
    // Mostrar y delegar todo el estilo a CSS (.history-deck-paragraph)
    historyDeckEl.classList.remove('hidden');
    const p = document.createElement('p');
    p.className = 'history-deck-paragraph';
    p.textContent = text;
    historyDeckEl.appendChild(p);

    if (Array.isArray(links) && links.length) {
      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'history-links-toggle';
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.setAttribute('aria-label', 'Mostrar enlaces del mazo');

      const icon = document.createElement('img');
      icon.src = 'images/link.svg';
      icon.alt = 'Ver enlaces del mazo';
      toggleButton.appendChild(icon);

      const list = document.createElement('ul');
      list.className = 'history-links-list history-deck-paragraph hidden';
      list.setAttribute('aria-label', 'Enlaces relacionados al mazo');

      links.forEach(({ label, url }) => {
        const li = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = label;
        li.appendChild(anchor);
        list.appendChild(li);
      });

      p.appendChild(document.createTextNode(' '));
      p.appendChild(toggleButton);
      toggleButton.addEventListener('click', () => {
        const expanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          list.classList.add('hidden');
        } else {
          list.classList.remove('hidden');
        }
      });

      historyDeckEl.appendChild(list);
    }
  }

  const showArcanaListButton = document.getElementById('show-arcana-list');
  const arcanaSection = document.getElementById('arcana-section');
  const toggleFullTarotButton = document.getElementById('toggle-full-tarot');

  document.addEventListener('pudutarot:major-arcana-loaded', function () {
    majorArcana = getMajorArcana(currentDeck);
    if (typeof renderArcanaList === 'function' && arcanaSection && !arcanaSection.classList.contains('hidden')) {
      renderArcanaList();
    }
    try { updateHistoryDeck(currentDeck); } catch (e) { /* noop */ }
  });


  function generateHistoryText(card) {
    // Prefer an explicit history field from JSON when available
    if (card.history && card.history.trim().length > 0) return card.history;
    const desc = (card.description && typeof card.description === 'string') ? card.description : ((card.meaning && card.meaning.upright) ? card.meaning.upright : 'significados tradicionales');
    return `Historia (prueba): La carta "${card.name}" tiene ra�ces simb�licas que se remontan a tradiciones antiguas; representa ${desc.toLowerCase()} y su iconograf�a ha variado seg�n las escuelas.`;
  }

  /**
   * Crea el HTML de una tabla de 2 celdas (horizontal) con Derecho / Invertido.
   * Devuelve una cadena con marcado seguro para su uso en innerHTML. Conserva
   * enlaces/formatos que vengan en los textos (el proyecto ya usa innerHTML en
   * otros lugares) � si se requiere sanitizaci�n m�s adelante, aplicar una
   * librer�a de sanitizaci�n.
   *
   * @param {string} upright - texto o HTML para la lectura en posici�n normal
   * @param {string} reversed - texto o HTML para la lectura invertida
   * @returns {string} HTML de una tabla responsiva con dos celdas
   */
  function createMeaningTableHTML(upright, reversed) {
    const u = upright || '';
    const r = reversed || '';
    return `
      <table class="meaning-table" style="width:100%;border-collapse:collapse;">
        <tr>
          <td class="meaning-cell meaning-cell-left">
            <div class="meaning-heading">Derecho</div>
            <div class="meaning-text meaning-upright">${u}</div>
          </td>
          <td class="meaning-cell meaning-cell-right">
            <div class="meaning-heading">Invertido</div>
            <div class="meaning-text meaning-reversed">${r}</div>
          </td>
        </tr>
      </table>
    `;
  }

  function renderArcanaList() {
    if (!arcanaListContainer) return;
    const arcanaSectionTitle = document.getElementById('arcana-section-title');
    // build list using current deck images when available
    const majors = getMajorArcana(currentDeck);
    const minors = (minorArcanaLoaded && fullDeckMode) ? getMinorArcana(currentDeck) : [];
    arcanaListContainer.innerHTML = '';

    // helper to create a card button and attach click handler
    function createCardButton(c) {
      const btn = document.createElement('button');
      btn.className = 'arcana-item';
      btn.type = 'button';
      btn.innerHTML = `<img src="${c.image}" alt="${c.name}" class="arcana-thumb"><div class="arcana-label">${c.name}</div>`;
      btn.addEventListener('click', function () {
        if (arcanaDetail) {
          arcanaDetailName.textContent = c.name;
          const upright = (c.meaning && c.meaning.upright) ? c.meaning.upright : (c.description || '');
          const reversed = (c.meaning && c.meaning.reversed) ? c.meaning.reversed : '';
          arcanaDetailDesc.innerHTML = createMeaningTableHTML(upright, reversed);
          // aplicar estilo igual que history-deck para la descripción
          if (arcanaDetailDesc && !arcanaDetailDesc.classList.contains('history-deck-paragraph')) {
            arcanaDetailDesc.classList.add('history-deck-paragraph');
          }
          // Mostrar la historia sólo para Arcanos Mayores (no mostrar para Arcanos Menores)
          if (c && c.suit) {
            // arcanos menores: ocultar/limpiar historia
            if (arcanaDetailHistory) {
              arcanaDetailHistory.textContent = '';
              arcanaDetailHistory.classList.add('hidden');
              arcanaDetailHistory.classList.remove('history-deck-paragraph');
            }
          } else {
            if (arcanaDetailHistory) {
              const h = (c.history && c.history.trim()) ? c.history : generateHistoryText(c);
              arcanaDetailHistory.textContent = h;
              arcanaDetailHistory.classList.remove('hidden');
              if (!arcanaDetailHistory.classList.contains('history-deck-paragraph')) {
                arcanaDetailHistory.classList.add('history-deck-paragraph');
              }
            }
          }
          const imgEl = document.getElementById('arcana-detail-image');
          if (imgEl) {
            imgEl.src = c.image;
            imgEl.alt = c.name;
          }
          applyCardMetaValue(listElementNode, 'Elemento', c.elemento);
          applyCardMetaValue(listAstrologyNode, 'Astrologia', c.astrologia);
          applyCardMetaValue(listYesNoNode, 'Respuesta Si/No', c.respuesta);
          arcanaDetail.classList.remove('hidden');
          arcanaDetail.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return btn;
    }

    if (!fullDeckMode || !minorArcanaLoaded) {
      // only majors
      if (arcanaSectionTitle) arcanaSectionTitle.textContent = 'Arcanos Mayores';
      majors.forEach(c => arcanaListContainer.appendChild(createCardButton(c)));
      return;
    }

    // When full deck is active, render groups in the order: Majors, Bastos, Copas, Espadas, Oros
    // Normalize suits to expected Spanish names
    function normalizeSuit(s) {
      if (!s) return 'otros';
      const t = String(s).toLowerCase();
      if (t.includes('basto') || t.includes('wands')) return 'bastos';
      if (t.includes('copa') || t.includes('cups')) return 'copas';
      if (t.includes('espada') || t.includes('sword')) return 'espadas';
      if (t.includes('oro') || t.includes('pentacle') || t.includes('coin') || t.includes('pent')) return 'oros';
      return 'otros';
    }

    const minorsBySuit = { bastos: [], copas: [], espadas: [], oros: [], otros: [] };
    minors.forEach(m => {
      const s = normalizeSuit(m.suit || m.suitName || m.suit_name);
      minorsBySuit[s] = minorsBySuit[s] || [];
      minorsBySuit[s].push(m);
    });

    // function to render a titled group (optionally with a suitKey to attach suit history)
    function renderGroup(title, cards, suitKey) {
      if (!cards || !cards.length) return;
      const group = document.createElement('div');
      group.className = 'arcana-group';

      const titleEl = document.createElement('div');
      titleEl.className = 'arcana-group-title';
      titleEl.textContent = title;
      group.appendChild(titleEl);

      // If we have suit-level history for this group, render it as a paragraph
      if (suitKey && minorArcanaSuitHistory && typeof minorArcanaSuitHistory[suitKey] === 'string' && minorArcanaSuitHistory[suitKey].trim()) {
        const p = document.createElement('p');
        // reuse the same visual style as the deck history paragraph
        p.className = 'history-deck-paragraph arcana-suit-history';
        p.textContent = minorArcanaSuitHistory[suitKey];
        group.appendChild(p);
      }

      // grid wrapper to keep items in rows of 4
      const grid = document.createElement('div');
      grid.className = 'arcana-grid';
      cards.forEach(c => grid.appendChild(createCardButton(c)));
      group.appendChild(grid);

      arcanaListContainer.appendChild(group);
    }

    // Render groups
    if (arcanaSectionTitle) arcanaSectionTitle.textContent = 'Listado de Arcanos';
    renderGroup('Arcanos Mayores', majors, null);
    renderGroup('Bastos', minorsBySuit.bastos, 'bastos');
    renderGroup('Copas', minorsBySuit.copas, 'copas');
    renderGroup('Espadas', minorsBySuit.espadas, 'espadas');
    renderGroup('Oros', minorsBySuit.oros, 'oros');
    // any other suits last
    if (minorsBySuit.otros && minorsBySuit.otros.length) renderGroup('Otros', minorsBySuit.otros);
  }

  // small helper: truncate text safely
  function truncateText(s, max) {
    if (!s) return '';
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '�';
  }






  // show/hide arcana list vs consultation
  if (showArcanaListButton) {
    showArcanaListButton.addEventListener('click', function () {
      // toggle arcana section visibility without hiding the consultation UI
      const hidden = arcanaSection.classList.contains('hidden');
      if (hidden) {
        arcanaSection.classList.remove('hidden');
        renderArcanaList();
        this.textContent = 'Ocultar Listado';
        // optionally focus the list
        arcanaSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        arcanaSection.classList.add('hidden');
        this.textContent = fullDeckMode ? 'Listado de Arcanos' : 'Listado de Arcanos Mayores';
      }
    });
  }

  // Tarot Completo toggle handler
  if (toggleFullTarotButton) {
    toggleFullTarotButton.addEventListener('click', async function () {
      fullDeckMode = !fullDeckMode;
      // load minor arcana lazily when enabling full deck
      if (fullDeckMode && !minorArcanaLoaded) {
        await loadMinorArcana();
      }
      // update button visual
      if (fullDeckMode) {
        this.classList.add('selected');
      } else {
        this.classList.remove('selected');
      }
      // update show list button text if arcana section hidden
      if (showArcanaListButton) {
        showArcanaListButton.textContent = arcanaSection.classList.contains('hidden') ? (fullDeckMode ? 'Listado de Arcanos' : 'Listado de Arcanos Mayores') : 'Ocultar Listado';
      }
      // if the section is visible, re-render to include minors
      if (!arcanaSection.classList.contains('hidden')) renderArcanaList();
    });
  }

  // ---------------------- Contactos din�micos ----------------------
  const contactsButton = document.getElementById('contacts-socials-boton');
  const contactsSection = document.getElementById('contacts-section');
  const contactsContainer = document.getElementById('contacts-container');

  // �conos simples inline por red (se pueden ampliar)
  const socialIcons = {
    whatsapp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.373 0 .003 5.373 0 12c0 2.12.557 4.17 1.616 5.98L0 24l6.29-1.604A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.2-1.25-6.2-3.48-8.52z" fill="#25D366"/><path d="M17.472 14.382c-.297-.149-1.76-.867-2.033-.966-.273-.099-.472-.148-.672.15-.198.297-.768.966-.942 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.884-.787-1.48-1.761-1.652-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.447-.52.149-.174.198-.298.297-.497.099-.198.05-.372-.025-.52-.074-.148-.672-1.62-.92-2.219-.243-.58-.49-.5-.672-.51l-.573-.01c-.198 0-.52.074-.793.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487 2.982 1.287 2.982.858 3.517.806.536-.05 1.76-.717 2.005-1.409.247-.692.247-1.285.173-1.409-.074-.124-.273-.198-.57-.347z" fill="#fff"/></svg>',
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#f58529"/><stop offset="0.5" stop-color="#dd2a7b"/><stop offset="1" stop-color="#515bd4"/></linearGradient><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" stroke="url(#g1)" stroke-width="1.6" fill="none"/><circle cx="12" cy="12" r="3.2" stroke="url(#g1)" stroke-width="1.6" fill="none"/><circle cx="18.2" cy="5.8" r="0.6" fill="#dd2a7b"/></svg>',
    tiktok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v12.5A4.5 4.5 0 1 1 9 10V6h3z" fill="#010101"/></svg>',
    youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a2.88 2.88 0 0 0-2.027-2.036C19.427 3.5 12 3.5 12 3.5s-7.427 0-9.471.65A2.88 2.88 0 0 0 .502 6.186 30.19 30.19 0 0 0 0 12a30.19 30.19 0 0 0 .502 5.814 2.88 2.88 0 0 0 2.027 2.036C4.573 20.5 12 20.5 12 20.5s7.427 0 9.471-.65a2.88 2.88 0 0 0 2.027-2.036A30.19 30.19 0 0 0 24 12a30.19 30.19 0 0 0-.502-5.814z" fill="#FF0000"/><path d="M10 15.5l5.5-3.5L10 8.5v7z" fill="#fff"/></svg>',
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.3V12h2.3V9.8c0-2.3 1.4-3.6 3.4-3.6.98 0 2 .18 2 .18v2.2h-1.12c-1.1 0-1.45.69-1.45 1.4V12h2.46l-.39 2.9h-2.07v7A10 10 0 0 0 22 12z" fill="#1877F2"/></svg>',
    linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 8.97h4v12H3v-12zM9 8.97h3.84v1.64h.05c.54-1.02 1.86-2.1 3.84-2.1 4.11 0 4.87 2.7 4.87 6.21v7.25H20V15.7c0-2.12-.04-4.85-3-4.85-3 0-3.46 2.34-3.46 4.66v7.46H9v-12z" fill="#0077B5"/></svg>'
    ,
    catalogo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#f0c929" stroke-width="1.4" fill="none"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#f0c929" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /**
   * loadAndRenderContacts
   * ----------------------
   * Lee `data/contacts.json` y llama a renderContactsTable(). Si la carga falla,
   * muestra un mensaje alternativo en el contenedor.
   */

  // Render contacts in a table with 2 per row
  async function loadAndRenderContacts() {
    try {
      const res = await fetch('data/contacts.json');
      const contacts = await res.json();
      renderContactsTable(contacts);
    } catch (e) {
      console.warn('No se pudo cargar data/contacts.json', e);
      contactsContainer.innerHTML = '<p class="contact-empty">No hay contactos disponibles.</p>';
    }
  }

  function renderContactsTable(contacts) {
    if (!contacts || !contacts.length) {
      contactsContainer.innerHTML = '<p class="contact-empty">No hay contactos disponibles.</p>';
      return;
    }

    // create a responsive table layout: 2 columns per row
    const table = document.createElement('div');
    table.className = 'contacts-table';

    let row;
    contacts.forEach((c, idx) => {
      if (idx % 2 === 0) {
        row = document.createElement('div');
        row.className = 'contacts-row';
        table.appendChild(row);
      }

      const cell = document.createElement('div');
      cell.className = 'contacts-cell';

      // detectar campo logo (puede venir dentro de links.logo o como c.logo)
      const logoUrl = (c.logo) ? c.logo : (c.links && c.links.logo) ? c.links.logo : null;
      if (logoUrl) {
        // aplicar background con comprobaci�n: si la imagen externa no carga, usar fallback local
        applyCellBackgroundWithFallback(cell, logoUrl);
      }

      const title = document.createElement('div');
      title.className = 'contact-title';
      title.textContent = c.name;
      cell.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'contact-desc';
      desc.textContent = c.description || '';
      cell.appendChild(desc);

      const linksWrap = document.createElement('div');
      linksWrap.className = 'contact-links';

      // iterate over known keys; preserve any arbitrary keys present. Skip 'logo' so it isn't rendered as a link
      Object.keys(c.links || {}).forEach(key => {
        if (key === 'logo') return;
        let raw = c.links[key];
        if (!raw) return;
        // soportar dos formatos: string URL o { url, icon, label }
        let url, iconKey, label;
        if (typeof raw === 'string') {
          url = raw;
          iconKey = key;
          label = key.charAt(0).toUpperCase() + key.slice(1);
        } else if (typeof raw === 'object' && raw.url) {
          url = raw.url;
          iconKey = raw.icon || key;
          label = raw.label || (key.charAt(0).toUpperCase() + key.slice(1));
        } else {
          return;
        }

        // Normalizar enlaces de imgur: si detectamos una URL de galer�a o imgur.com/ID,
        // intentamos convertirla a i.imgur.com/ID.jpg (si ya es directa no la tocamos).
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
          try {
            const u = new URL(url);
            const parts = u.pathname.split('/').filter(Boolean);
            const last = parts[parts.length - 1];
            if (last && !last.includes('a') && !last.includes('gallery')) {
              url = `https://i.imgur.com/${last}.jpg`;
            }
          } catch (e) {
            // noop
          }
        }

        // Construcci�n del enlace (<a>) con icono y texto
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'contact-link';
        // accesibilidad: title y aria-label
        a.title = `${label} de ${c.name}`;
        a.setAttribute('aria-label', `Abrir ${label} de ${c.name}`);
        // icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'contact-icon';
        iconSpan.innerHTML = socialIcons[iconKey] || '';
        a.appendChild(iconSpan);
        // label text after icon as hyperlink text
        const text = document.createElement('span');
        text.className = 'contact-link-text';
        text.textContent = label;
        a.appendChild(text);
        linksWrap.appendChild(a);
      });

      cell.appendChild(linksWrap);
      row.appendChild(cell);
      // animaci�n de entrada: staggered
      setTimeout(() => cell.classList.add('entered'), 80 * (idx % 2 === 0 ? Math.floor(idx / 2) : Math.floor(idx / 2) + 1));
    });

    contactsContainer.innerHTML = '';
    contactsContainer.appendChild(table);
  }

  /**
   * Intenta precargar una URL de logo; si falla o tiempo agotado, aplica un fallback local.
   * Se aplica como background con un overlay sutil para preservar legibilidad del texto.
   *
   * @param {HTMLElement} cell - Elemento donde aplicar el background
   * @param {string} logoUrl - URL del logo a precargar
   */
  function applyCellBackgroundWithFallback(cell, logoUrl) {
    const testImg = new Image();
    let settled = false;
    const applyBg = (url) => {
      // usar un overlay sutil para atenuar la imagen y mantener legibilidad
      cell.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.16), rgba(0,0,0,0.9)), url('${url}')`;
      cell.style.backgroundSize = 'cover';
      cell.style.backgroundPosition = 'center';
    };

    // onload / onerror gestionan �xito o fallo de carga
    testImg.onload = function () {
      if (settled) return;
      settled = true;
      applyBg(logoUrl);
    };
    testImg.onerror = function () {
      if (settled) return;
      settled = true;
      // fallback a imagen local incluida en el repo
      applyBg('images/app-icon.png');
    };

    // timeout: si no responde en 2500ms, usar fallback para evitar bloqueos de UI
    setTimeout(function () {
      if (settled) return;
      settled = true;
      applyBg('images/app-icon.png');
    }, 2500);

    // iniciar carga
    testImg.src = logoUrl;
  }

  function scrollFirstContactIntoView() {
    if (!contactsContainer) return;
    requestAnimationFrame(() => {
      const firstContact = contactsContainer.querySelector('.contacts-cell');
      const target = firstContact || contactsContainer;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof window !== 'undefined' && typeof window.scrollBy === 'function') {
        setTimeout(() => window.scrollBy({ top: -20, behavior: 'smooth' }), 250);
      }
    });
  }

  // toggle display from button
  if (contactsButton && contactsSection) {
    contactsButton.addEventListener('click', function () {
      const hidden = contactsSection.classList.contains('hidden');
      if (hidden) {
        contactsSection.classList.remove('hidden');
        loadAndRenderContacts().then(scrollFirstContactIntoView);
        contactsButton.textContent = 'Ocultar Contactos';
        // marcar visualmente el bot�n como seleccionado
        contactsButton.classList.add('selected');
      } else {
        contactsSection.classList.add('hidden');
        contactsButton.textContent = '�Quieres conocer mas sobre el Tarot?';
        contactsButton.classList.remove('selected');
      }
    });
  }

  // --- Fallback de logo: si la URL externa no carga, usar imagen local por defecto ---
  // Comprobaci�n por cada celda en renderContactsTable: intentamos precargar la imagen y
  // si falla, reemplazamos el background con un fallback est�tico.

  const sunLogo = document.querySelector(".sun-logo");
  const moonLogo = document.querySelector(".header-brand-icon");

  // background toggle state (persisted)
  const bgImageEl = document.querySelector('.background img');
  let isNight = false;
  try {
    const saved = localStorage.getItem('pudutarot:isNight');
    if (saved === null) {
      // first run: default to sunny (day)
      isNight = false;
    } else {
      isNight = saved === '1';
    }
  } catch (e) {
    isNight = false;
  }
  // helper to set background with fade
  const backgroundDiv = document.querySelector('.background');
  function setBackgroundImage(src) {
    if (bgImageEl) {
      // fade out
      bgImageEl.style.opacity = '0';
      setTimeout(() => {
        bgImageEl.src = src;
        // force reflow then fade in
        void bgImageEl.offsetWidth;
        bgImageEl.style.opacity = '1';
      }, 220);
    }
    if (backgroundDiv) {
      backgroundDiv.style.transition = 'background-image 0.4s ease-in-out';
      backgroundDiv.style.backgroundImage = `url('${src}')`;
    }
  }

  function applyCelestialButtonTheme() {
    document.body.classList.toggle('celestial-theme', !isNight);
  }

  // ensure initial background matches state
  if (bgImageEl) { bgImageEl.style.opacity = '1'; }
  // If there's no saved preference (first run), set sunny immediately without fade.
  try {
    const saved = localStorage.getItem('pudutarot:isNight');
    if (saved === null) {
      if (bgImageEl) bgImageEl.src = 'images/fondo-day.svg';
      if (backgroundDiv) backgroundDiv.style.backgroundImage = `url('${'images/fondo-day.svg'}')`;
    } else {
      // respect saved preference (use fade)
      setBackgroundImage(isNight ? 'images/fondo-night.svg' : 'images/fondo-day.svg');
    }
  } catch (e) {
    setBackgroundImage(isNight ? 'images/fondo-night.svg' : 'images/fondo-day.svg');
  }
  applyCelestialButtonTheme();

  // sync icon classes with current state so UI matches background
  if (sunLogo && moonLogo) {
    // when isNight is true, sun should be hidden (animate-sun), moon visible (animate-moon)
    sunLogo.classList.toggle('animate-sun', isNight);
    moonLogo.classList.toggle('animate-moon', isNight);
  }

  if (sunLogo && moonLogo) {
    const toggleCelestialBodies = () => {
      // toggle sun hidden class; when sunHidden is true => night mode
      const sunHidden = sunLogo.classList.toggle('animate-sun');
      moonLogo.classList.toggle('animate-moon', sunHidden);
      // derive isNight directly from sunHidden
      isNight = !!sunHidden;
      setBackgroundImage(isNight ? 'images/fondo-night.svg' : 'images/fondo-day.svg');
      applyCelestialButtonTheme();
      try { localStorage.setItem('pudutarot:isNight', isNight ? '1' : '0'); } catch (e) { /* ignore */ }
    };

    // allow clicking the whole toggle area
    const celestialToggleWrap = document.querySelector('.celestial-toggle');
    if (celestialToggleWrap) celestialToggleWrap.addEventListener('click', toggleCelestialBodies);
    sunLogo.addEventListener('click', toggleCelestialBodies);
    moonLogo.addEventListener('click', toggleCelestialBodies);
  }

  // resilient toggle: ensure the container wrap also toggles background even if icons missing
  const celestialToggleWrapFallback = document.querySelector('.celestial-toggle');
  if (celestialToggleWrapFallback) {
    celestialToggleWrapFallback.addEventListener('click', function () {
      // If icons exist, mirror their toggling logic to keep state coherent
      if (sunLogo && moonLogo) {
        const sunHiddenNow = sunLogo.classList.toggle('animate-sun');
        moonLogo.classList.toggle('animate-moon', sunHiddenNow);
        isNight = !!sunHiddenNow;
      } else {
        // fallback: flip boolean
        isNight = !isNight;
      }
      setBackgroundImage(isNight ? 'images/fondo-night.svg' : 'images/fondo-day.svg');
      applyCelestialButtonTheme();
      try { localStorage.setItem('pudutarot:isNight', isNight ? '1' : '0'); } catch (e) { }
    });
  }

});









