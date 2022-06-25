(function () {
  // document.addEventListener("load", function () {

  let hintsActivated = false;

  const HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
  const HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";

  const ENGLISH_LETTERS_AMOUNT = 26;
  // const WAYFARER_TYPING_INPUT = "wayfarer-typing-input";

  // const createTypingInput = (): HTMLInputElement => {
  //   const typingInput = document.createElement("input");
  //   typingInput.type = "hidden";
  //   typingInput.setAttribute("name", "wayfarer-typing-input");
  //   typingInput.classList.add(WAYFARER_TYPING_INPUT);
  //   document.body.appendChild(typingInput);
  //   return typingInput;
  // };

  // const focusToTypingInput = (typingInput: HTMLInputElement): void => {
  //   if (typingInput) {
  //     typingInput.focus();
  //   }
  // };

  // const listenToTypingInput = (typingInput: HTMLInputElement): void => {
  //   console.log(typingInput);
  //   if (typingInput) {
  //     typingInput.addEventListener("input", (e) => {
  //       console.log("input", e);
  //       e.preventDefault();
  //       e.stopPropagation();
  //     });
  //   }
  // };

  const createHintMarkerContainer = () => {
    const hintMarkerContainer = document.createElement("div");
    hintMarkerContainer.classList.add(HINT_MARKER_CONTAINER_CLASSNAME);
    return hintMarkerContainer;
  };

  const loadHintMarkerContainer = () => {
    const hintMarkerContainer = createHintMarkerContainer();
    document.body.appendChild(hintMarkerContainer);
    return hintMarkerContainer;
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
    hintMarker.innerText = markKey;
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

  const getAlphaKeys = (amount: number) => {
    return "abcdefghijklmnopqrstuvwxyz".split("").slice(0, amount);
  };

  const generateAlphaHintMarks = (alphaHintsTotal: number) => {
    const totalExtraChunks =
      Math.ceil(alphaHintsTotal / ENGLISH_LETTERS_AMOUNT) - 1;

    if (ENGLISH_LETTERS_AMOUNT >= alphaHintsTotal) {
      return getAlphaKeys(alphaHintsTotal);
    }

    const initialChunk = getAlphaKeys(
      ENGLISH_LETTERS_AMOUNT - totalExtraChunks
    );

    const extraHintKeysTotal = alphaHintsTotal - ENGLISH_LETTERS_AMOUNT;

    Array(extraHintKeysTotal)
      .fill(0)
      .map((_, index) => {

      });
  };

  console.log(generateAlphaHintMarks(89));

  const generateHintKeys = (totalHints: number) => {
    if (!totalHints) {
      return [];
    }
    const firstTenHintKeys = Array.from(
      Array(totalHints > 10 ? 10 : totalHints),
      (d, i) => String(i)
    );
    if (totalHints <= 10) {
      return firstTenHintKeys;
    }
    if (totalHints <= 36) {
      return [...firstTenHintKeys, ...getAlphaKeys(totalHints - 10)];
    }
    if (totalHints <= 61) {
      return [
        ...firstTenHintKeys,
        ..."abcdefghijklmnopqrstuvwxyz".split("").slice(0, totalHints - 10),
      ];
    }
  };

  // console.log(generateHintKeys(36));

  const renderHintMarkers = (hintMarkerContainer: HTMLDivElement) => {
    getAllHyperlinks().forEach((hyperlink, index) => {
      const coords = getCoords(hyperlink);
      if (hintMarkerContainer) {
        const hintMarker = createHintMarker({
          markKey: index.toString(),
          topPos: coords.top,
          leftPos: coords.left,
        });

        hintMarkerContainer.appendChild(hintMarker);
      }
    });
  };

  document.addEventListener("keydown", (event) => {
    if (hintsActivated) {
      if (event.key === "Escape") {
        hintsActivated = false;
      } else {
        const hyperlink = getAllHyperlinks()[Number(event.key)];
        const href = hyperlink?.href;
        if (href) {
          window.open(href, "_blank")?.focus();
        }
      }
    }

    if (event.key === "f") {
      const allHyperlinks = getAllHyperlinks();

      if (allHyperlinks.length > 0) {
        const hintMarkerContainer = loadHintMarkerContainer();
        renderHintMarkers(hintMarkerContainer);
        hintsActivated = true;
        // const typingInput = createTypingInput();
        // focusToTypingInput(typingInput);
        // listenToTypingInput(typingInput);
      }
    }
  });
  // });
})();
