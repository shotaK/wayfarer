(function () {
  let hintsActivated = false;
  let hintPrefixActivatedKey = "";
  let allActionableElements: HTMLElement[] = [];
  let activatedHintsSuites: {
    sourceElement: HTMLElement;
    hintMark: HTMLDivElement;
    hintKey: string;
  }[] = [];

  const HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
  const HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
  const HINT_MARKER_CLASSNAME_DEFAULT = "wayfarer-hint-marker--default";
  const HINT_MARKER_CLASSNAME_FOCUSABLE = "wayfarer-hint-marker--focusable";
  const HINT_MARKER_CLASSNAME_PREFIX = "wayfarer-hint-marker-prefix";
  const HINT_MARKER_CLASSNAME_POSTFIX = "wayfarer-hint-marker-postfix";
  type OverflowState = "hidden" | "scroll" | "none";
  let lastHoveredElement = undefined;

  const ALPHABET_ENGLISH_KEY_OPTIMIZED = "abcdehijklmnopqrsuvwxyztgf";
  const ENGLISH_LETTERS_AMOUNT = ALPHABET_ENGLISH_KEY_OPTIMIZED.length;
  const SINGLE_DIGIT_NUM_AMOUNT = 10;

  const MAX_ALPHA_HINT_AMOUNT = 676;

  const editableInputList = [
    "text",
    "email",
    "number",
    "search",
    "tel",
    "url",
    "password",
    "date",
    "datetime-local",
    "month",
    "week",
    "range",
  ];

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

  function isElement(node: Node): node is HTMLElement {
    return node.nodeType === 1;
  }

  function isTextNode(node: Node): node is Text {
    return node.nodeType === 3;
  }

  function isDocument(node: Node): node is Document {
    return node.nodeType === 9;
  }

  function isInputElement(element: HTMLElement): element is HTMLInputElement {
    return element.tagName === "INPUT";
  }

  function isVisible(elem: HTMLElement): boolean {
    let defaultView = elem.ownerDocument.defaultView;
    if (!defaultView) {
      throw new Error("cannot check visibility of non attached element");
    }
    let window = defaultView; // retype as non-null for use in closures
    let isJSDOM = window.navigator.userAgent.match(/jsdom/i);

    function getOpacity(elem: HTMLElement): number {
      // By default the element is opaque.
      let elemOpacity = 1;

      let opacityStyle = window.getComputedStyle(elem).opacity;
      if (opacityStyle) {
        elemOpacity = Number(opacityStyle);
      }

      // Let's apply the parent opacity to the element.
      let parentElement = elem.parentElement;
      if (parentElement) {
        elemOpacity = elemOpacity * getOpacity(parentElement);
      }
      return elemOpacity;
    }

    function getOverflowState(elem: HTMLElement): OverflowState {
      let region = elem.getBoundingClientRect();
      let ownerDoc = elem.ownerDocument;
      let htmlElem = ownerDoc.documentElement;
      let bodyElem = ownerDoc.body;
      let htmlOverflowStyle = window.getComputedStyle(htmlElem).overflow;
      let treatAsFixedPosition;

      // Return the closest ancestor that the given element may overflow.
      function getOverflowParent(e: HTMLElement) {
        let position = window.getComputedStyle(e).position;
        if (position == "fixed") {
          treatAsFixedPosition = true;
          // Fixed-position element may only overflow the viewport.
          return e == htmlElem ? null : htmlElem;
        } else {
          let parent = e.parentElement;
          while (parent && !canBeOverflowed(parent)) {
            parent = parent.parentElement;
          }
          return parent;
        }

        function canBeOverflowed(container: HTMLElement) {
          // The HTML element can always be overflowed.
          if (container == htmlElem) {
            return true;
          }
          // An element cannot overflow an element with an inline display style.
          let containerDisplay = window.getComputedStyle(container).display;
          if (containerDisplay.match(/^inline/)) {
            return false;
          }
          // An absolute-positioned element cannot overflow a static-positioned one.
          if (
            position == "absolute" &&
            window.getComputedStyle(container).position == "static"
          ) {
            return false;
          }
          return true;
        }
      }

      // Return the x and y overflow styles for the given element.
      function getOverflowStyles(e: HTMLElement) {
        // When the <html> element has an overflow style of 'visible', it assumes
        // the overflow style of the body, and the body is really overflow:visible.
        let overflowElem = e;
        if (htmlOverflowStyle == "visible") {
          // Note: bodyElem will be null/undefined in SVG documents.
          if (e == htmlElem && bodyElem) {
            overflowElem = bodyElem;
          } else if (e == bodyElem) {
            return { x: "visible", y: "visible" };
          }
        }
        let overflow = {
          x: window.getComputedStyle(overflowElem).overflowX,
          y: window.getComputedStyle(overflowElem).overflowY,
        };
        // The <html> element cannot have a genuine 'visible' overflow style,
        // because the viewport can't expand; 'visible' is really 'auto'.
        if (e == htmlElem) {
          overflow.x = overflow.x == "visible" ? "auto" : overflow.x;
          overflow.y = overflow.y == "visible" ? "auto" : overflow.y;
        }
        return overflow;
      }

      // Returns the scroll offset of the given element.
      function getScroll(e: HTMLElement | HTMLDocument) {
        if (isDocument(e)) {
          return {
            x: e.defaultView?.pageXOffset || 0,
            y: e.defaultView?.pageYOffset || 0,
          };
        } else {
          return { x: e.scrollLeft, y: e.scrollTop };
        }
      }

      // Check if the element overflows any ancestor element.
      for (
        let container = getOverflowParent(elem);
        !!container;
        container = getOverflowParent(container)
      ) {
        let containerOverflow = getOverflowStyles(container);

        // If the container has overflow:visible, the element cannot overflow it.
        if (
          containerOverflow.x == "visible" &&
          containerOverflow.y == "visible"
        ) {
          continue;
        }

        let containerRect = container.getBoundingClientRect();

        // Zero-sized containers without overflow:visible hide all descendants.
        if (containerRect.width == 0 || containerRect.height == 0) {
          return "hidden";
        }

        // Check "underflow": if an element is to the left or above the container
        let underflowsX = region.right < containerRect.left;
        let underflowsY = region.bottom < containerRect.top;
        if (
          (underflowsX && containerOverflow.x == "hidden") ||
          (underflowsY && containerOverflow.y == "hidden")
        ) {
          return "hidden";
        } else if (
          (underflowsX && containerOverflow.x != "visible") ||
          (underflowsY && containerOverflow.y != "visible")
        ) {
          // When the element is positioned to the left or above a container, we
          // have to distinguish between the element being completely outside the
          // container and merely scrolled out of view within the container.
          let containerScroll = getScroll(container);
          let unscrollableX =
            region.right < containerRect.left - containerScroll.x;
          let unscrollableY =
            region.bottom < containerRect.top - containerScroll.y;
          if (
            (unscrollableX && containerOverflow.x != "visible") ||
            (unscrollableY && containerOverflow.x != "visible")
          ) {
            return "hidden";
          }
          let containerState = getOverflowState(container);
          return containerState == "hidden" ? "hidden" : "scroll";
        }

        // Check "overflow": if an element is to the right or below a container
        let overflowsX =
          region.left >= containerRect.left + containerRect.width;
        let overflowsY = region.top >= containerRect.top + containerRect.height;
        if (
          (overflowsX && containerOverflow.x == "hidden") ||
          (overflowsY && containerOverflow.y == "hidden")
        ) {
          return "hidden";
        } else if (
          (overflowsX && containerOverflow.x != "visible") ||
          (overflowsY && containerOverflow.y != "visible")
        ) {
          // If the element has fixed position and falls outside the scrollable area
          // of the document, then it is hidden.
          if (treatAsFixedPosition) {
            let docScroll = getScroll(container);
            if (
              region.left >= htmlElem.scrollWidth - docScroll.x ||
              region.right >= htmlElem.scrollHeight - docScroll.y
            ) {
              return "hidden";
            }
          }
          // If the element can be scrolled into view of the parent, it has a scroll
          // state; unless the parent itself is entirely hidden by overflow, in
          // which it is also hidden by overflow.
          let containerState = getOverflowState(container);
          return containerState == "hidden" ? "hidden" : "scroll";
        }
      }

      // Does not overflow any ancestor.
      return "none";
    }

    function isDisplayed(e: HTMLElement): boolean {
      if (window.getComputedStyle(e).display == "none") {
        return false;
      }
      let parent = e.parentElement;
      return !parent || isDisplayed(parent);
    }

    function isVisibleInner(elem: HTMLElement, ignoreOpacity = false): boolean {
      // By convention, BODY element is always shown: BODY represents the document
      // and even if there's nothing rendered in there, user can always see there's
      // the document.
      if (elem.tagName === "BODY") {
        return true;
      }

      // Option or optgroup is shown iff enclosing select is shown (ignoring the
      // select's opacity).
      if (elem.tagName === "OPTION" || elem.tagName === "OPTGROUP") {
        let select = elem.closest("select");
        return !!select && isVisibleInner(select, true);
      }

      // Any hidden input is not shown.
      if (isInputElement(elem) && elem.type.toLowerCase() == "hidden") {
        return false;
      }

      // Any NOSCRIPT element is not shown.
      if (elem.tagName === "NOSCRIPT") {
        return false;
      }

      // Any element with hidden/collapsed visibility is not shown.
      let visibility = window.getComputedStyle(elem).visibility;
      if (visibility == "collapse" || visibility == "hidden") {
        return false;
      }

      if (!isDisplayed(elem)) {
        return false;
      }

      // Any transparent element is not shown.
      if (!ignoreOpacity && getOpacity(elem) == 0) {
        return false;
      }

      // Any element without positive size dimensions is not shown.
      function positiveSize(e: HTMLElement): boolean {
        let rect = e.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) {
          return true;
        }
        // Zero-sized elements should still be considered to have positive size
        // if they have a child element or text node with positive size, unless
        // the element has an 'overflow' style of 'hidden'.
        return (
          window.getComputedStyle(e).overflow != "hidden" &&
          Array.from(e.childNodes).some((n: Node) => {
            return isTextNode(n) || (isElement(n) && positiveSize(n));
          })
        );
      }
      if (!isJSDOM && !positiveSize(elem)) {
        return false;
      }

      // Elements that are hidden by overflow are not shown.
      function hiddenByOverflow(e: HTMLElement): boolean {
        return (
          getOverflowState(e) == "hidden" &&
          Array.from(e.childNodes).every(function (n: Node) {
            return !isElement(n) || hiddenByOverflow(n) || !positiveSize(n);
          })
        );
      }
      if (!isJSDOM && hiddenByOverflow(elem)) {
        return false;
      }

      return true;
    }

    return isVisibleInner(elem);
  }

  function elementVisible(elem: HTMLElement) {
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
    if (elemCenter.x < 0) {
      return false;
    }

    if (
      elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)
    ) {
      return false;
    }

    if (elemCenter.y < 0) return false;
    if (
      elemCenter.y >
      (document.documentElement.clientHeight || window.innerHeight)
    ) {
      return false;
    }

    const { left, top, right, bottom } = getCoords(elem);

    let pointCenterContainer: ParentNode | null | undefined =
      document.elementFromPoint(elemCenter.x, elemCenter.y);

    let pointTopLeftContainer: ParentNode | null | undefined =
      document.elementFromPoint(left, top);

    let pointTopRightContainer: ParentNode | null | undefined =
      document.elementFromPoint(right, top);

    let pointBottomLeftContainer: ParentNode | null | undefined =
      document.elementFromPoint(left, bottom);

    let pointBottomRightContainer: ParentNode | null | undefined =
      document.elementFromPoint(right, bottom);

    do {
      if (
        [
          pointCenterContainer,
          pointBottomRightContainer,
          pointTopRightContainer,
          pointTopLeftContainer,
          pointBottomLeftContainer,
        ].includes(elem)
      )
        return true;
    } while ((pointCenterContainer = pointCenterContainer?.parentNode));

    return false;
  }

  const createHintMarker = ({
    markKey,
    topPos,
    leftPos,
    element,
  }: {
    markKey: string;
    topPos: number;
    leftPos: number;
    element: HTMLElement;
  }) => {
    const hintMarker = document.createElement("div");
    if (
      (element instanceof HTMLInputElement &&
        editableInputList.includes(element?.type)) ||
      element instanceof HTMLTextAreaElement ||
      (element?.isContentEditable && element instanceof HTMLSelectElement)
    ) {
      hintMarker.classList.add(HINT_MARKER_CLASSNAME_FOCUSABLE);
    } else {
      hintMarker.classList.add(HINT_MARKER_CLASSNAME_DEFAULT);
    }

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
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        "a, button, input, select, textarea"
      )
    )
      .filter(isVisible)
      .filter(elementVisible)
      .filter(isElementInViewport);
  };

  const getCoords = (elem: HTMLElement) => {
    const rect = elem.getBoundingClientRect();
    const left = rect.left + window.scrollX;
    const top = rect.top + window.scrollY;

    return {
      left,
      top,
      right: left + rect.width,
      bottom: top + rect.height,
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

    const hintKeys = generateHintKeys(allActionableElements.length);

    const renderableHintMarks = allActionableElements
      .map((actionableElement, index) => {
        const coords = getCoords(actionableElement);
        return {
          sourceElement: actionableElement,
          hintKey: hintKeys[index],
          hintMark: createHintMarker({
            markKey: hintKeys[index],
            topPos: coords.top,
            leftPos: coords.left,
            element: actionableElement,
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

  const simulateMouseEvent = (event, element, modifiers) => {
    if (modifiers == null) {
      modifiers = {};
    }
    if (event === "mouseout") {
      if (element == null) {
        element = lastHoveredElement;
      }
      lastHoveredElement = undefined;
      if (element == null) {
        return;
      }
    } else if (event === "mouseover") {
      simulateMouseEvent("mouseout", undefined, modifiers);
      lastHoveredElement = element;
    }

    const mouseEvent = new MouseEvent(event, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      detail: 1,
      ctrlKey: modifiers.ctrlKey,
      altKey: modifiers.altKey,
      shiftKey: modifiers.shiftKey,
      metaKey: modifiers.metaKey,
    });
    return element.dispatchEvent(mouseEvent);
  };

  const simulateClick = (element, modifiers = {}) => {
    if (modifiers == null) {
      modifiers = {};
    }
    const eventSequence = ["mouseover", "mousedown", "mouseup", "click"];
    const result = [];
    for (let event of eventSequence) {
      const defaultActionShouldTrigger = simulateMouseEvent(
        event,
        element,
        modifiers
      );

      result.push(defaultActionShouldTrigger);
    }
    return result;
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

    simulateClick(hyperlink);

    // if (!href || href.startsWith("javascript") || href.startsWith("#")) {
    //   hyperlink.click();
    //   return;
    // }
    //
    // if (typeof hyperlink?.onclick == "function") {
    //   // @ts-ignore
    //   // hyperlink?.onclick?.apply(hyperlink);
    //   return;
    // }
    //
    // if (href) {
    //   window.open(href, isShift ? "_blank" : "_self")?.focus();
    // }
  };

  const clickButton = ({ button }: { button: HTMLButtonElement }) => {
    button.click();
  };

  const dismissHints = () => {
    removeAllHintMarkerContainer();
    hintsActivated = false;
    hintPrefixActivatedKey = "";
    activatedHintsSuites = [];
    allActionableElements = [];
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

  const handleInputAction = ({ input }: { input: HTMLInputElement }) => {
    const { type } = input;

    if (
      [
        "button",
        "submit",
        "color",
        "checkbox",
        "radio",
        "file",
        "image",
        "reset",
      ].includes(type)
    ) {
      input.click();
      return;
    }

    if (editableInputList.includes(type)) {
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  };

  const handleSelectAction = ({ select }: { select: HTMLSelectElement }) => {
    select.focus();
  };

  const handleTextAreaAction = ({
    textarea,
  }: {
    textarea: HTMLTextAreaElement;
  }) => {
    textarea.focus();
  };

  const triggerClickOnElement = ({
    element,
    event,
  }: {
    element: HTMLElement;
    event: KeyboardEvent;
  }) => {
    if (element instanceof HTMLAnchorElement) {
      openHyperlink({
        hyperlink: element,
        event,
      });
    } else if (element instanceof HTMLButtonElement) {
      clickButton({ button: element });
    } else if (element instanceof HTMLInputElement) {
      handleInputAction({ input: element });
    } else if (element instanceof HTMLSelectElement) {
      handleSelectAction({ select: element });
    } else if (element instanceof HTMLTextAreaElement) {
      handleTextAreaAction({ textarea: element });
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
      triggerClickOnElement({
        element: activatedHintSuite.sourceElement,
        event,
      });
    }

    dismissHints();
  };

  const getHintIndex = (chosenHintKey: string) => {
    return generateHintKeys(allActionableElements.length).findIndex(
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

  const isUserInEditingMode = ({ event }: { event: KeyboardEvent }) => {
    const element = event?.target as HTMLInputElement;
    const tagName = element?.tagName?.toLowerCase();

    if (tagName === "input") {
      if (editableInputList.includes(element?.type)) {
        return true;
      }
    }

    if (tagName === "textarea") {
      return true;
    }

    return Boolean(element?.isContentEditable);
  };

  document.addEventListener("click", (event) => {
    dismissHints();
  });

  document.addEventListener("keydown", (event) => {
    if (!event.isTrusted) {
      return false;
    }

    if (isUserInEditingMode({ event })) {
      return;
    }

    const chosenHintKey = keyCodeToHintKey(event.code);

    if (["ShiftLeft", "ShiftRight"].includes(event.code) || event.ctrlKey) {
      return;
    }

    if (!hintsActivated) {
      allActionableElements = getAllActionableElements();

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

    if (actionableElement) {
      triggerClickOnElement({
        element: actionableElement,
        event,
      });
    }

    dismissHints();
  });
})();
