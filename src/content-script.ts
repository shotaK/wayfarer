(function () {
  let hintsActivated = false;
  let hintPrefixActivatedKey: string = "";
  let activatedHintsSuites: {
    sourceElement: HTMLElement;
    hintMark: HTMLDivElement;
    hintKey: string;
  }[] = [];

  const HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
  const HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
  const HINT_MARKER_CLASSNAME_PREFIX = "wayfarer-hint-marker-prefix";
  const HINT_MARKER_CLASSNAME_POSTFIX = "wayfarer-hint-marker-postfix";

  const ALPHABET_ENGLISH_KEY_OPTIMIZED = "abcdehijklmnopqrsuvwxyztgf";
  const ENGLISH_LETTERS_AMOUNT = ALPHABET_ENGLISH_KEY_OPTIMIZED.length;
  const SINGLE_DIGIT_NUM_AMOUNT = 10;

  const MAX_ALPHA_HINT_AMOUNT = 676;

  const classify = (className: string) => `.${className}`;

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

  function isVisible(elem: HTMLElement) {
    if (!(elem instanceof Element))
      throw Error("DomUtil: elem is not an element.");
    const style = getComputedStyle(elem);
    if (style.display === "none") return false;
    if (style.visibility !== "visible") return false;
    if (Number(style.opacity) < 0.1) return false;
    if (
      elem.offsetWidth +
        elem.offsetHeight +
        elem.getBoundingClientRect().height +
        elem.getBoundingClientRect().width ===
      0
    ) {
      return false;
    }
    const elemCenter = {
      x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
      y: elem.getBoundingClientRect().top + elem.offsetHeight / 2,
    };
    if (elemCenter.x < 0) return false;
    if (
      elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)
    )
      return false;
    if (elemCenter.y < 0) return false;
    if (
      elemCenter.y >
      (document.documentElement.clientHeight || window.innerHeight)
    )
      return false;
    let pointContainer: ParentNode | null | undefined =
      document.elementFromPoint(elemCenter.x, elemCenter.y);
    do {
      if (pointContainer === elem) return true;
    } while ((pointContainer = pointContainer?.parentNode));
    return false;
  }

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
    const [prefixKey, postfixKey] = markKey.split("");

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

  const getAllActionableElements = () => {
    return Array.from(document.querySelectorAll<HTMLElement>("a, button"))
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

    const allHyperlinks = getAllActionableElements();
    const hintKeys = generateHintKeys(allHyperlinks.length);

    const renderableHintMarks = allHyperlinks
      .map((hyperlink, index) => {
        const coords = getCoords(hyperlink);
        return {
          sourceElement: hyperlink,
          hintKey: hintKeys[index],
          hintMark: createHintMarker({
            markKey: hintKeys[index],
            topPos: coords.top,
            leftPos: coords.left,
          }),
        };
      })
      .filter((_, index) => {
        if (renderPredicate) {
          return renderPredicate({ hintKey: hintKeys[index] });
        }
        return true;
      });

    activatedHintsSuites = renderableHintMarks;

    renderableHintMarks.forEach(({ hintMark }) =>
      hintMarkerContainer.appendChild(hintMark)
    );
  };

  const openHyperlink = ({
    hyperlink,
    event,
  }: {
    hyperlink: HTMLAnchorElement;
    event: KeyboardEvent;
  }) => {
    const href = hyperlink?.href;
    const isShift = event.shiftKey;

    if (!href || href.startsWith("javascript") || href.startsWith("#")) {
      hyperlink.click();
      return;
    }

    if (href) {
      window.open(href, isShift ? "_blank" : "_self")?.focus();
    }
  };

  const dismissHints = () => {
    removeAllHintMarkerContainer();
    hintsActivated = false;
    hintPrefixActivatedKey = "";
    activatedHintsSuites = [];
  };

  const isPostfixKey = ({ hintKey }: { hintKey: string }) => {
    if (hintKey.length < 2) {
      return false;
    }

    return hintKey.startsWith(hintPrefixActivatedKey);
  };

  const highlightPostfixKey = () => {
    const prefixKeys = document.querySelectorAll<HTMLSpanElement>(
      classify(HINT_MARKER_CLASSNAME_PREFIX)
    );

    prefixKeys.forEach((prefixKeyElement) => {
      prefixKeyElement.style.opacity = "0.3";
    });
  };

  const activateThePrefixKey = ({ prefixKey }: { prefixKey: string }) => {
    hintPrefixActivatedKey = prefixKey;
    removeAllHintMarkerContainer();
    renderHintMarkers({
      renderPredicate: isPostfixKey,
    });
    if (activatedHintsSuites.length === 0) {
      dismissHints();
    } else {
      highlightPostfixKey();
    }
  };

  const handlePostfixHintKey = ({
    postfixKey,
    event,
  }: {
    postfixKey: string;
    event: KeyboardEvent;
  }) => {
    const hintKeyChosen = `${hintPrefixActivatedKey}${postfixKey}`;
    const activatedHintSuite = activatedHintsSuites.find(
      ({ hintKey }) => hintKey === hintKeyChosen
    );

    if (activatedHintSuite) {
      openHyperlink({
        hyperlink: activatedHintSuite?.sourceElement as HTMLAnchorElement,
        event,
      });
    }

    dismissHints();
  };

  const getHintIndex = (chosenHintKey: string) => {
    const allHyperlinks = getAllActionableElements();

    return generateHintKeys(allHyperlinks.length).findIndex(
      (hintKey) => hintKey === chosenHintKey
    );
  };

  const keyCodeToHintKey = (keyCode: string = "") => {
    if (keyCode.startsWith("Digit")) {
      const [_, hintKey] = keyCode.split("Digit");
      return hintKey;
    }
    if (keyCode.startsWith("Key")) {
      const [_, hintKey] = keyCode.split("Key");
      return hintKey.toLowerCase();
    }
    return keyCode.toLowerCase();
  };

  document.addEventListener("keydown", (event) => {
    const chosenHintKey = keyCodeToHintKey(event.code);

    if (["ShiftLeft", "ShiftRight"].includes(event.code) || event.ctrlKey) {
      return;
    }

    const allActionableElements = getAllActionableElements();

    if (!hintsActivated) {
      if (chosenHintKey === "f") {
        if (allActionableElements.length > 0) {
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

    if (hintPrefixActivatedKey) {
      handlePostfixHintKey({ postfixKey: chosenHintKey, event });
      return;
    }

    const selectedHintIndex = getHintIndex(chosenHintKey);

    if (selectedHintIndex === -1) {
      activateThePrefixKey({ prefixKey: chosenHintKey });
      return;
    }

    const actionableElement = allActionableElements[selectedHintIndex];
    console.log(actionableElement);
    openHyperlink({ hyperlink, event });
    dismissHints();
  });
})();
