(function () {
  let hintsActivated = false;
  let hintFirstActivatedKey: string;

  const HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
  const HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
  const HINT_MARKER_CLASSNAME_PREFIX = "wayfarer-hint-marker-prefix";
  const HINT_MARKER_CLASSNAME_POSTFIX = "wayfarer-hint-marker-postfix";

  const ALPHABET_ENGLISH_KEY_OPTIMIZED = "abcdehijklmnopqrsuvwxyztgf";
  const ENGLISH_LETTERS_AMOUNT = ALPHABET_ENGLISH_KEY_OPTIMIZED.length;
  const SINGLE_DIGIT_NUM_AMOUNT = 10;

  const MAX_ALPHA_HINT_AMOUNT = 676;

  const createHintMarkerContainer = () => {
    const hintMarkerContainer = document.createElement("div");
    hintMarkerContainer.classList.add(HINT_MARKER_CONTAINER_CLASSNAME);
    return hintMarkerContainer;
  };

  const removeAllHintMarkerContainer = () => {
    document
      .querySelectorAll(`.${HINT_MARKER_CONTAINER_CLASSNAME}`)
      .forEach((el) => el.remove());
  };

  const loadHintMarkerContainer = () => {
    const hintMarkerContainer = createHintMarkerContainer();
    document.body.appendChild(hintMarkerContainer);
    return hintMarkerContainer;
  };

  const createHintMarkerKey = ({
    key,
    className,
  }: {
    key: string;
    className: string;
  }) => {
    const hintMarkerKey = document.createElement("span");
    hintMarkerKey.classList.add(className);
    hintMarkerKey.innerText = key;
    return hintMarkerKey;
  };

  const isVisible = (element: HTMLElement) => {
    return (
      element.offsetWidth > 0 ||
      element.offsetHeight > 0 ||
      element.getClientRects().length > 0
    );
  };

  const createHintMarker = ({
    markKey,
    topPos,
    leftPos,
  }: {
    markKey: string;
    topPos: number;
    leftPos: number;
  }) => {
    const hintMarker = document.createElement("div");
    hintMarker.classList.add(HINT_MARKER_CLASSNAME);
    const [prefixKey, postfixKey] = markKey;

    const prefixElement = createHintMarkerKey({
      key: prefixKey,
      className: HINT_MARKER_CLASSNAME_PREFIX,
    });

    hintMarker.appendChild(prefixElement);

    if (postfixKey) {
      const postfixElement = createHintMarkerKey({
        key: postfixKey,
        className: HINT_MARKER_CLASSNAME_POSTFIX,
      });

      hintMarker.appendChild(postfixElement);
    }

    hintMarker.style.top = `${topPos}px`;
    hintMarker.style.left = `${leftPos}px`;
    return hintMarker;
  };

  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  const getAllHyperlinks = () => {
    return Array.from(document.querySelectorAll("a"))
      .filter(isVisible)
      .filter(isElementInViewport);
  };

  const getCoords = (elem: HTMLElement) => {
    const rect = elem.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    };
  };

  const getAlphaKeys = ({
    start = 0,
    end = ENGLISH_LETTERS_AMOUNT,
  }: {
    start?: number;
    end?: number;
  }) => {
    return ALPHABET_ENGLISH_KEY_OPTIMIZED.split("").slice(start, end);
  };

  const getChunkNumberByTotal = (total: number) => {
    return Math.ceil(total / ENGLISH_LETTERS_AMOUNT) - 1;
  };

  const generateExtraHintKeys = (extraHintKeysTotal: number) => {
    return Array(
      extraHintKeysTotal <= MAX_ALPHA_HINT_AMOUNT
        ? extraHintKeysTotal
        : MAX_ALPHA_HINT_AMOUNT
    )
      .fill(0)
      .map((_, index) => {
        const currentChunkPrefixLetter =
          ALPHABET_ENGLISH_KEY_OPTIMIZED[
            ENGLISH_LETTERS_AMOUNT - getChunkNumberByTotal(index + 1) - 1
          ];

        return `${currentChunkPrefixLetter}${
          ALPHABET_ENGLISH_KEY_OPTIMIZED[index % ENGLISH_LETTERS_AMOUNT]
        }`;
      });
  };

  const generateAlphaHintMarks = (alphaHintsTotal: number) => {
    if (!alphaHintsTotal) {
      return [];
    }

    const initialChucks = getAlphaKeys({ end: alphaHintsTotal });

    if (ENGLISH_LETTERS_AMOUNT >= alphaHintsTotal) {
      return initialChucks;
    }

    const extraChunksAmount = getChunkNumberByTotal(alphaHintsTotal);

    const initialChunksRefined = getAlphaKeys({
      end: ENGLISH_LETTERS_AMOUNT - extraChunksAmount,
    });

    const extraHintKeysTotal = alphaHintsTotal - initialChunksRefined.length;

    const extraChunksKeys = generateExtraHintKeys(extraHintKeysTotal);

    return [
      ...getAlphaKeys({ end: ENGLISH_LETTERS_AMOUNT - extraChunksAmount }),
      ...extraChunksKeys,
    ];
  };

  const generateHintKeys = (totalHints: number) => {
    if (!totalHints) {
      return [];
    }
    const firstTenHintKeys = Array.from(
      Array(
        totalHints > SINGLE_DIGIT_NUM_AMOUNT
          ? SINGLE_DIGIT_NUM_AMOUNT
          : totalHints
      ),
      (d, i) => String(i)
    );
    if (totalHints <= SINGLE_DIGIT_NUM_AMOUNT) {
      return firstTenHintKeys;
    }

    return [
      ...firstTenHintKeys,
      ...generateAlphaHintMarks(totalHints - SINGLE_DIGIT_NUM_AMOUNT),
    ];
  };

  const renderHintMarkers = ({
    renderPredicate,
  }: {
    renderPredicate?: ({ hintKey }: { hintKey: string }) => boolean;
  }) => {
    const hintMarkerContainer = loadHintMarkerContainer();

    const allHyperlinks = getAllHyperlinks();
    const hintKeys = generateHintKeys(allHyperlinks.length);
    allHyperlinks.forEach((hyperlink, index) => {
      const coords = getCoords(hyperlink);
      if (hintMarkerContainer) {
        const hintMarker = createHintMarker({
          markKey: hintKeys[index],
          topPos: coords.top,
          leftPos: coords.left,
        });

        if (renderPredicate) {
          if (renderPredicate({ hintKey: hintKeys[index] })) {
            hintMarkerContainer.appendChild(hintMarker);
          }
          return;
        }

        hintMarkerContainer.appendChild(hintMarker);
      }
    });
  };

  const dismissHints = () => {
    removeAllHintMarkerContainer();
  };

  const activateThePrefixKey = ({ prefixKey }: { prefixKey: string }) => {
    hintFirstActivatedKey = prefixKey;
    removeAllHintMarkerContainer();
    renderHintMarkers({
      renderPredicate: ({ hintKey }) => {
        return true;
      },
    });
  };

  document.addEventListener("keydown", (event) => {
    const chosenHintKey = event.key;
    if (!hintsActivated) {
      if (chosenHintKey === "f") {
        const allHyperlinks = getAllHyperlinks();

        if (allHyperlinks.length > 0) {
          renderHintMarkers({});
          hintsActivated = true;
        }
      }

      return;
    }

    if (chosenHintKey === "Escape") {
      hintsActivated = false;
      dismissHints();
      return;
    }

    const allHyperlinks = getAllHyperlinks();

    if (hintFirstActivatedKey) {
    }

    const selectedHintIndex = generateHintKeys(allHyperlinks.length).findIndex(
      (hintKey) => hintKey === chosenHintKey
    );

    if (selectedHintIndex === -1) {
      activateThePrefixKey({ prefixKey: chosenHintKey });
    } else {
      const hyperlink = allHyperlinks[selectedHintIndex];
      const href = hyperlink?.href;

      if (href) {
        window.open(href, "_blank")?.focus();
      }
    }
    // const hyperlink = allHyperlinks[Number(event.key)];
    // const href = hyperlink?.href;
    // if (href) {
    //   window.open(href, "_blank")?.focus();
    // }
  });
})();
