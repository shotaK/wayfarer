(function () {
  console.log("clock");
  // document.addEventListener("load", function () {

  let hintsActivated = false;

  const HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
  const HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
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

  const getAllHyperlinks = () => {
    return Array.from(document.querySelectorAll("a")).filter(isVisible);
  };

  const getCoords = (elem: HTMLElement) => {
    const box = elem.getBoundingClientRect();

    const body = document.body;
    const docEl = document.documentElement;

    const scrollTop = window.scrollY || docEl.scrollTop || body.scrollTop;
    const scrollLeft = window.scrollY || docEl.scrollLeft || body.scrollLeft;

    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;

    const top = box.top + scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
  };

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
