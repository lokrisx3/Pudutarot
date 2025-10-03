# -*- coding: utf-8 -*-
from pathlib import Path

def main():
    path = Path('script.js')
    lines = path.read_text(encoding='utf-8').splitlines()

    def find_index(predicate):
        for i, line in enumerate(lines):
            if predicate(line, i):
                return i
        return -1

    # ensure fullTarotButton constant
    idx = find_index(lambda line, i: "const deckRaiderButton" in line)
    if idx == -1:
        raise SystemExit('deckRaiderButton line not found')
    if "fullTarotButton" not in lines[idx:idx+2]:
        lines.insert(idx + 1, "  const fullTarotButton = document.getElementById('toggle-full-tarot');")

    # insert minor arcana structures
    idx = find_index(lambda line, i: line.strip() == 'const deckImageFolders = {')
    if idx == -1:
        raise SystemExit('deckImageFolders block not found')
    insert_block = [
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
    ]
    after_block = idx + 4
    if lines[after_block - 1].strip() != "":
        lines[after_block:after_block] = insert_block

    # helper functions after normalizeCard
    norm_start = find_index(lambda line, i: line.strip() == 'function normalizeCard(card) {')
    if norm_start == -1:
        raise SystemExit('normalizeCard start not found')
    norm_end = find_index(lambda line, i: i > norm_start and line.strip() == '}')
    if norm_end == -1:
        raise SystemExit('normalizeCard end not found')
    helper_block = [
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
    ]
    insert_pos = norm_end + 1
    if lines[insert_pos] != '':
        for line in reversed(helper_block):
            lines.insert(insert_pos, line)
    else:
        for line in reversed(helper_block):
            lines.insert(insert_pos + 1, line)

    # 4. update pickImagePathForDeckFile
    pick_idx = find_index(lambda line, i: line.strip() == 'function pickImagePathForDeckFile(deck, filePath) {')
    if pick_idx == -1:
        raise SystemExit('pickImagePathForDeckFile not found')
    lines[pick_idx + 2] = '    const lower = filePath.toLowerCase();'
    lines[pick_idx + 3] = "    if (lower.includes('arcanosmayores/') || lower.includes('arcanosmenores/')) {"
    lines[pick_idx + 4] = "      return filePath.replace(/\\.[a-z0-9]+$/i, '.JPG');"

    # 5. normalized image extension
    norm_line = find_index(lambda line, i: 'const normalized = (deck ===' in line)
    if norm_line == -1:
        raise SystemExit('normalized line missing')
    lines[norm_line + 1] = '      return normalizePath(${folder}/.JPG);'

    # 6. random card block
    random_start = find_index(lambda line, i: line.strip() == 'let majorArcana = getMajorArcana(currentDeck);')
    if random_start == -1:
        raise SystemExit('random block start missing')
    random_end = find_index(lambda line, i: i > random_start and line.strip().startswith('//'))
    replacement = [
        '  let majorArcana = getMajorArcana(currentDeck);',
        '  let includeMinorArcana = false;',
        '  let activeCardPool = majorArcana;',
        '',
        '  function refreshActiveCardPool() {',
        '    if (!includeMinorArcana) {',
        '      activeCardPool = majorArcana;',
        '      return;',
        '    }',
        '    const minorDeck = getMinorArcana(currentDeck);',
        '    activeCardPool = minorDeck.length ? majorArcana.concat(minorDeck) : majorArcana;',
        '  }',
        '',
        '  refreshActiveCardPool();',
        '',
        '  // Funcion para seleccionar una carta aleatoria',
        '  function getRandomCard() {',
        '    const pool = (activeCardPool && activeCardPool.length) ? activeCardPool : majorArcana;',
        '    if (!pool || !pool.length) {',
        '      return null;',
        '    }',
        '    const randomIndex = Math.floor(Math.random() * pool.length);',
        '    return pool[randomIndex];',
        '  }',
        ''
    ]
    replace_end = random_start + len(replacement)
    lines[random_start:random_end] = replacement

    # 7. ensure refresh after preload
    preload_idx = find_index(lambda line, i: line.strip() == 'majorArcana = getMajorArcana(currentDeck);')
    lines.insert(preload_idx + 1, '    refreshActiveCardPool();')

    # 8. ensure refresh in switchDeck
    switch_idx = find_index(lambda line, i: line.strip() == 'majorArcana = getMajorArcana(deck);')
    lines.insert(switch_idx + 1, '    refreshActiveCardPool();')

    # 9. update setTimeout block (first occurrence inside consult listener)
    timeout_start = find_index(lambda line, i: line.strip() == 'setTimeout(function () {')
    timeout_end = find_index(lambda line, i: i > timeout_start and line.strip() == '});')
    timeout_replacement = [
        '    setTimeout(function () {',
        '      const selectedCard = getRandomCard();',
        "      if (!selectedCard) {",
        "        console.warn('No hay cartas disponibles para la consulta.');",
        '        consultButton.disabled = false;',
        "        consultButton.classList.remove('disabled');",
        "        puduShufflingContainer.classList.remove('visible');",
        "        puduShufflingContainer.classList.add('hidden');",
        "        puduContainer.classList.remove('hidden');",
        "        puduContainer.classList.add('visible');",
        '        return;',
        '      }',
        '      showCard(selectedCard);',
        '    }, 2000);'
    ]
    lines[timeout_start - 1:timeout_end + 1] = timeout_replacement

    # 10. insert full tarot button UI block
    deck_idx = find_index(lambda line, i: "deckRaiderButton.addEventListener('click'" in line)
    insert_full = [
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
    ]
    lines[deck_idx + 2:deck_idx + 2] = insert_full

    # 11. refresh within deck-loaded event listener
    event_idx = find_index(lambda line, i: "document.addEventListener('pudutarot:major-arcana-loaded'" in line)
    if event_idx != -1:
        assign_idx = event_idx + 1
        if 'refreshActiveCardPool();' not in lines[assign_idx + 1]:
            lines.insert(assign_idx + 1, '    refreshActiveCardPool();')

    path.write_text('\r\n'.join(lines) + '\r\n', encoding='utf-8')

if __name__ == '__main__':
    main()
