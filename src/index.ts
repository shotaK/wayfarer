(function () {
  console.log("clock");
  // document.addEventListener("load", function () {

  const HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
  const HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";

  const createHintMarkerContainer = () => {
    const hintMarkerContainer = document.createElement("div");
    hintMarkerContainer.classList.add(HINT_MARKER_CONTAINER_CLASSNAME);
    return hintMarkerContainer;
  };

  const loadHintMarkerIntoBody = () => {
    const hintMarkerContainer = createHintMarkerContainer();
    document.body.appendChild(hintMarkerContainer);
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
    return Array.from(document.querySelectorAll("a"));
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

  const renderHintMarkers = () => {
    getAllHyperlinks()
      .filter(isVisible)
      .forEach((hyperlink, index) => {
        const coords = getCoords(hyperlink);
        const hintMarkerContainer = document.querySelector(
          `.${HINT_MARKER_CONTAINER_CLASSNAME}`
        );
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
    if (event.key === "f") {
      const allHyperlinks = getAllHyperlinks();

      if (allHyperlinks.length > 0) {
        loadHintMarkerIntoBody();
        renderHintMarkers();
      }
    }
  });
  // });
})();
