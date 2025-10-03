const fs = require('fs');
const path = 'script.js';
let code = fs.readFileSync(path, 'utf8');
let lines = code.split(/\r?\n/);

function findLineIndex(predicate) {
  for (let i = 0; i < lines.length; i += 1) {
    if (predicate(lines[i], i)) return i;
  }
  return -1;
}

function insertLines(afterIndex, newLines) {
  lines = lines.slice(0, afterIndex + 1).concat(newLines).concat(lines.slice(afterIndex + 1));
}

function replaceLines(startIndex, endIndex, newLines) {
  lines = lines.slice(0, startIndex).concat(newLines).concat(lines.slice(endIndex));
}

// 1. add fullTarotButton constant
let idx = findLineIndex(line => line.includes("const deckRaiderButton"));
if (idx === -1) throw new Error('deckRaiderButton line not found');
lines[idx] = lines[idx] + "\r\n  const fullTarotButton = document.getElementById('toggle-full-tarot');";

// 2. insert minor arcana structures after deckImageFolders block
idx = findLineIndex(line => line.trim() === 'const deckImageFolders = {');
if (idx === -1) throw new Error('deckImageFolders not found');
insertLines(idx + 3, [
  "  const minorArcanaSource = 'data/minorArcana.json';",
  "  const minorArcanaDeckCache = {",
  "    Marseille: [],",
  "    raider: []",
  "  };",
  "  let minorArcanaRaw = [];",
  "  let minorArcanaLoaded = false;",
  "  let minorArcanaLoadPromise = null;",
  "  let minorArcanaSupportedDecks = new Set(['marseille', 'raider']);",
  ""
]);

// 3. helper functions after normalizeCard
let normStart = findLineIndex(line => line.trim() === 'function normalizeCard(card) {');
if (normStart === -1) throw new Error('normalizeCard not found');
let normEnd = findLineIndex((line, i) => i > normStart && line.trim() === '}');
if (normEnd === -1) throw new Error('normalizeCard end not found');
insertLines(normEnd, [
  "  function normalizeMinorCard(card, deckTags) {",
  "    return {",
  "      id: card.id,",
  "      name: card.name,",
  "      file: card.file,",
  "      suit: card.suit,",
  "      meaning: card.meaning || {},",
  "      description: card.description,",
  "      history: card.history || '',",
  "      deckTags: Array.isArray(deckTags) && deckTags.length ? deckTags : null",
  "    };",
  "  }",
  "",
  "  async function loadMinorArcana() {",
  "    if (minorArcanaLoaded) return minorArcanaRaw;",
  "    if (minorArcanaLoadPromise) return minorArcanaLoadPromise;",
  "",
  "    minorArcanaLoadPromise = (async () => {",
  "      try {",
  "        const response = await fetch(minorArcanaSource);",
  "        if (!response.ok) throw new Error('HTTP ' + response.status);",
  "        const payload = await response.json();",
  "        const entries = Array.isArray(payload) ? payload : [];",
  "        const sanitized = [];",
  "        let sharedDeckTags = null;",
  "",
  "        entries.forEach(entry => {",
  "          if (!entry || typeof entry !== 'object') return;",
  "          if (typeof entry.id !== 'number') {",
  "            if (Array.isArray(entry.TypeCard)) {",
  "              sharedDeckTags = entry.TypeCard.map(type => String(type).toLowerCase());",
  "              minorArcanaSupportedDecks = new Set(sharedDeckTags);",
  "            }",
  "            return;",
  "          }",
  "          const cardDeckTags = Array.isArray(entry.TypeCard)",
  "            ? entry.TypeCard.map(type => String(type).toLowerCase())",
  "            : sharedDeckTags;",
  "          sanitized.push(normalizeMinorCard(entry, cardDeckTags));",
  "        });",
  "",
  "        minorArcanaRaw = sanitized;",
  "      } catch (error) {",
  "        console.warn('Could not load minor arcana data, continuing with major arcana only.', error);",
  "        minorArcanaRaw = [];",
  "      } finally {",
  "        minorArcanaDeckCache.Marseille = [];",
  "        minorArcanaDeckCache.raider = [];",
  "        minorArcanaLoaded = true;",
  "        minorArcanaLoadPromise = null;",
  "      }",
  "      return minorArcanaRaw;",
  "    })();",
  "",
  "    return minorArcanaLoadPromise;",
  "  }",
  "",
  "  function getMinorArcana(deck) {",
  "    if (!minorArcanaLoaded || !minorArcanaRaw.length) return [];",
  "    const deckKey = deck && Object.prototype.hasOwnProperty.call(minorArcanaDeckCache, deck) ? deck : 'Marseille';",
  "    const deckLower = String(deckKey).toLowerCase();",
  "    if (!minorArcanaSupportedDecks.has(deckLower)) return [];",
  "    if (!Array.isArray(minorArcanaDeckCache[deckKey])) {",
  "      minorArcanaDeckCache[deckKey] = [];",
  "    }",
  "    if (minorArcanaDeckCache[deckKey].length) {",
  "      return minorArcanaDeckCache[deckKey];",
  "    }",
  "    const cards = minorArcanaRaw",
  "      .filter(card => !card.deckTags || card.deckTags.includes(deckLower))",
  "      .map(card => ({",
  "        id: card.id,",
  "        name: card.name,",
  "        suit: card.suit,",
  "        file: card.file,",
  "        image: resolveDeckImage(deckKey, card),",
  "        meaning: card.meaning || {},",
  "        description: card.description,",
  "        history: card.history || '',",
  "      }));",
  "    minorArcanaDeckCache[deckKey] = cards;",
  "    return cards;",
  "  }",
  ""
]);

// 4. update pickImagePathForDeckFile
let pickStart = findLineIndex(line => line.includes('function pickImagePathForDeckFile'));
if (pickStart === -1) throw new Error('pickImagePathForDeckFile not found');
replaceLines(pickStart, pickStart + 6, [
  "  function pickImagePathForDeckFile(deck, filePath) {",
  "    if (!filePath) return filePath;",
  "    const lower = filePath.toLowerCase();",
  "    if (lower.includes('arcanosmayores/') || lower.includes('arcanosmenores/')) {",
  "      return filePath.replace(/\\.[a-z0-9]+$/i, '.JPG');",
  "    }",
  "    return filePath;",
  "  }"
]);

// 5. update normalized image extension
let normLineIdx = findLineIndex(line => line.includes('const normalized = (deck === \'Marseille\''));
if (normLineIdx === -1) throw new Error('normalized line not found');
lines[normLineIdx + 1] = "      return normalizePath(${folder}/.JPG);";

// 6. replace random card block
let randomStart = findLineIndex(line => line.trim() === 'let majorArcana = getMajorArcana(currentDeck);');
if (randomStart === -1) throw new Error('majorArcana declaration not found');
let randomEnd = findLineIndex((line, i) => i > randomStart && line.trim() === '');
replaceLines(randomStart, randomEnd, [
  "  let majorArcana = getMajorArcana(currentDeck);",
  "  let includeMinorArcana = false;",
  "  let activeCardPool = majorArcana;",
  "",
  "  function refreshActiveCardPool() {",
  "    if (!includeMinorArcana) {",
  "      activeCardPool = majorArcana;",
  "      return;",
  "    }",
  "    const minorDeck = getMinorArcana(currentDeck);",
  "    activeCardPool = minorDeck.length ? majorArcana.concat(minorDeck) : majorArcana;",
  "  }",
  "",
  "  refreshActiveCardPool();",
  "",
  "  // Función para seleccionar una carta aleatoria",
  "  function getRandomCard() {",
  "    const pool = (activeCardPool && activeCardPool.length) ? activeCardPool : majorArcana;",
  "    if (!pool || !pool.length) {",
  "      return null;",
  "    }",
  "    const randomIndex = Math.floor(Math.random() * pool.length);",
  "    return pool[randomIndex];",
  "  }",
  ""
]);

// 7. ensure refreshActiveCardPool after preload decks
let preloadIdx = findLineIndex(line => line.includes('majorArcana = getMajorArcana(currentDeck);'));
lines.splice(preloadIdx + 1, 0, '    refreshActiveCardPool();');

// 8. refresh in switchDeck
let switchIdx = findLineIndex(line => line.includes('majorArcana = getMajorArcana(deck);'));
lines.splice(switchIdx + 1, 0, '    refreshActiveCardPool();');

// 9. handle empty pool in setTimeout
let timeoutIdx = findLineIndex(line => line.includes('setTimeout(function () {'));
let timeoutEnd = findLineIndex((line, i) => i > timeoutIdx && line.trim() === '});');
replaceLines(timeoutIdx, timeoutEnd, [
  '    setTimeout(function () {',
  '      const selectedCard = getRandomCard();',
  '      if (!selectedCard) {',
  "        console.warn('No hay cartas disponibles para la consulta.');",
  '        consultButton.disabled = false;',
  "        consultButton.classList.remove('disabled');",
  '        puduShufflingContainer.classList.remove(\'visible\');',
  "        puduShufflingContainer.classList.add(\'hidden\');",
  '        puduContainer.classList.remove(\'hidden\');',
  "        puduContainer.classList.add(\'visible\');",
  '        return;',
  '      }',
  '      showCard(selectedCard);',
  '    }, 2000);'
]);

// 10. insert full tarot button UI block after deck button listeners
let deckButtonIdx = findLineIndex(line => line.includes("deckRaiderButton.addEventListener('click'"));
insertLines(deckButtonIdx + 2, [
  '  function updateFullTarotButtonUI(options) {',
  '    if (!fullTarotButton) return;',
  '    const loading = options && options.loading === true;',
  '    if (loading) {',
  '      fullTarotButton.disabled = true;',
  "      fullTarotButton.classList.add('loading');",
  "      fullTarotButton.textContent = 'Cargando...';",
  '      return;',
  '    }',
  '    fullTarotButton.disabled = false;',
  "    fullTarotButton.classList.remove('loading');",
  "    fullTarotButton.classList.toggle('selected', includeMinorArcana);",
  "    fullTarotButton.textContent = includeMinorArcana ? 'Solo Arcanos Mayores' : 'Tarot Completo';",
  "    fullTarotButton.setAttribute('aria-pressed', includeMinorArcana ? 'true' : 'false');",
  '  }',
  '',
  '  if (fullTarotButton) {',
  '    updateFullTarotButtonUI();',
  "    fullTarotButton.addEventListener('click', async function () {",
  '      if (!includeMinorArcana) {',
  "        updateFullTarotButtonUI({ loading: true });",
  '        try {',
  '          await loadMinorArcana();',
  '          const minorDeck = getMinorArcana(currentDeck);',
  '          includeMinorArcana = minorDeck.length > 0;',
  '          if (!includeMinorArcana) {',
  "            console.warn('Minor arcana data is empty; keeping major arcana only.');",
  '          }',
  '        } catch (error) {',
  "          console.warn('Unable to enable full tarot mode.', error);",
  '          includeMinorArcana = false;',
  '        } finally {',
  '          refreshActiveCardPool();',
  '          updateFullTarotButtonUI();',
  '        }',
  '      } else {',
  '        includeMinorArcana = false;',
  '        refreshActiveCardPool();',
  '        updateFullTarotButtonUI();',
  '      }',
  '    });',
  '  }',
  ''
]);

// 11. refreshActiveCardPool when major arcana reload event fires
let eventIdx = findLineIndex(line => line.includes('majorArcana = getMajorArcana(currentDeck);') && lines[line.includes('document.addEventListener') ? false : true]);
let reloadIdx = findLineIndex((line, i) => line.includes('document.addEventListener') && lines[i + 1].includes('majorArcana = getMajorArcana(currentDeck);'));
if (reloadIdx !== -1) {
  lines.splice(reloadIdx + 2, 0, '    refreshActiveCardPool();');
}

fs.writeFileSync(path, lines.join('\r\n'));
