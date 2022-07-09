var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    var hintsActivated = false;
    var hintPrefixActivatedKey = "";
    var allActionableElements = [];
    var activatedHintsSuites = [];
    var HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
    var HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
    var HINT_MARKER_CLASSNAME_DEFAULT = "wayfarer-hint-marker--default";
    var HINT_MARKER_CLASSNAME_FOCUSABLE = "wayfarer-hint-marker--focusable";
    var HINT_MARKER_CLASSNAME_PREFIX = "wayfarer-hint-marker-prefix";
    var HINT_MARKER_CLASSNAME_POSTFIX = "wayfarer-hint-marker-postfix";
    var lastHoveredElement = undefined;
    var ALPHABET_ENGLISH_KEY_OPTIMIZED = "abcdehijklmnopqrsuvwxyztgf";
    var ENGLISH_LETTERS_AMOUNT = ALPHABET_ENGLISH_KEY_OPTIMIZED.length;
    var SINGLE_DIGIT_NUM_AMOUNT = 10;
    var MAX_ALPHA_HINT_AMOUNT = 676;
    var editableInputList = [
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
    var classify = function (className) { return ".".concat(className); };
    var createHintMarkerContainer = function () {
        var hintMarkerContainer = document.createElement("div");
        hintMarkerContainer.classList.add(HINT_MARKER_CONTAINER_CLASSNAME);
        return hintMarkerContainer;
    };
    var removeAllHintMarkerContainer = function () {
        document
            .querySelectorAll(".".concat(HINT_MARKER_CONTAINER_CLASSNAME))
            .forEach(function (el) { return el.remove(); });
    };
    var loadHintMarkerContainer = function () {
        var hintMarkerContainer = createHintMarkerContainer();
        document.body.appendChild(hintMarkerContainer);
        return hintMarkerContainer;
    };
    var createHintMarkerKey = function (_a) {
        var key = _a.key, className = _a.className;
        var hintMarkerKey = document.createElement("span");
        hintMarkerKey.classList.add(className);
        hintMarkerKey.innerText = key;
        return hintMarkerKey;
    };
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isTextNode(node) {
        return node.nodeType === 3;
    }
    function isDocument(node) {
        return node.nodeType === 9;
    }
    function isInputElement(element) {
        return element.tagName === "INPUT";
    }
    function isVisible(elem) {
        var defaultView = elem.ownerDocument.defaultView;
        if (!defaultView) {
            throw new Error("cannot check visibility of non attached element");
        }
        var window = defaultView; // retype as non-null for use in closures
        var isJSDOM = window.navigator.userAgent.match(/jsdom/i);
        function getOpacity(elem) {
            // By default the element is opaque.
            var elemOpacity = 1;
            var opacityStyle = window.getComputedStyle(elem).opacity;
            if (opacityStyle) {
                elemOpacity = Number(opacityStyle);
            }
            // Let's apply the parent opacity to the element.
            var parentElement = elem.parentElement;
            if (parentElement) {
                elemOpacity = elemOpacity * getOpacity(parentElement);
            }
            return elemOpacity;
        }
        function getOverflowState(elem) {
            var region = elem.getBoundingClientRect();
            var ownerDoc = elem.ownerDocument;
            var htmlElem = ownerDoc.documentElement;
            var bodyElem = ownerDoc.body;
            var htmlOverflowStyle = window.getComputedStyle(htmlElem).overflow;
            var treatAsFixedPosition;
            // Return the closest ancestor that the given element may overflow.
            function getOverflowParent(e) {
                var position = window.getComputedStyle(e).position;
                if (position == "fixed") {
                    treatAsFixedPosition = true;
                    // Fixed-position element may only overflow the viewport.
                    return e == htmlElem ? null : htmlElem;
                }
                else {
                    var parent_1 = e.parentElement;
                    while (parent_1 && !canBeOverflowed(parent_1)) {
                        parent_1 = parent_1.parentElement;
                    }
                    return parent_1;
                }
                function canBeOverflowed(container) {
                    // The HTML element can always be overflowed.
                    if (container == htmlElem) {
                        return true;
                    }
                    // An element cannot overflow an element with an inline display style.
                    var containerDisplay = window.getComputedStyle(container).display;
                    if (containerDisplay.match(/^inline/)) {
                        return false;
                    }
                    // An absolute-positioned element cannot overflow a static-positioned one.
                    if (position == "absolute" &&
                        window.getComputedStyle(container).position == "static") {
                        return false;
                    }
                    return true;
                }
            }
            // Return the x and y overflow styles for the given element.
            function getOverflowStyles(e) {
                // When the <html> element has an overflow style of 'visible', it assumes
                // the overflow style of the body, and the body is really overflow:visible.
                var overflowElem = e;
                if (htmlOverflowStyle == "visible") {
                    // Note: bodyElem will be null/undefined in SVG documents.
                    if (e == htmlElem && bodyElem) {
                        overflowElem = bodyElem;
                    }
                    else if (e == bodyElem) {
                        return { x: "visible", y: "visible" };
                    }
                }
                var overflow = {
                    x: window.getComputedStyle(overflowElem).overflowX,
                    y: window.getComputedStyle(overflowElem).overflowY
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
            function getScroll(e) {
                var _a, _b;
                if (isDocument(e)) {
                    return {
                        x: ((_a = e.defaultView) === null || _a === void 0 ? void 0 : _a.pageXOffset) || 0,
                        y: ((_b = e.defaultView) === null || _b === void 0 ? void 0 : _b.pageYOffset) || 0
                    };
                }
                else {
                    return { x: e.scrollLeft, y: e.scrollTop };
                }
            }
            // Check if the element overflows any ancestor element.
            for (var container = getOverflowParent(elem); !!container; container = getOverflowParent(container)) {
                var containerOverflow = getOverflowStyles(container);
                // If the container has overflow:visible, the element cannot overflow it.
                if (containerOverflow.x == "visible" &&
                    containerOverflow.y == "visible") {
                    continue;
                }
                var containerRect = container.getBoundingClientRect();
                // Zero-sized containers without overflow:visible hide all descendants.
                if (containerRect.width == 0 || containerRect.height == 0) {
                    return "hidden";
                }
                // Check "underflow": if an element is to the left or above the container
                var underflowsX = region.right < containerRect.left;
                var underflowsY = region.bottom < containerRect.top;
                if ((underflowsX && containerOverflow.x == "hidden") ||
                    (underflowsY && containerOverflow.y == "hidden")) {
                    return "hidden";
                }
                else if ((underflowsX && containerOverflow.x != "visible") ||
                    (underflowsY && containerOverflow.y != "visible")) {
                    // When the element is positioned to the left or above a container, we
                    // have to distinguish between the element being completely outside the
                    // container and merely scrolled out of view within the container.
                    var containerScroll = getScroll(container);
                    var unscrollableX = region.right < containerRect.left - containerScroll.x;
                    var unscrollableY = region.bottom < containerRect.top - containerScroll.y;
                    if ((unscrollableX && containerOverflow.x != "visible") ||
                        (unscrollableY && containerOverflow.x != "visible")) {
                        return "hidden";
                    }
                    var containerState = getOverflowState(container);
                    return containerState == "hidden" ? "hidden" : "scroll";
                }
                // Check "overflow": if an element is to the right or below a container
                var overflowsX = region.left >= containerRect.left + containerRect.width;
                var overflowsY = region.top >= containerRect.top + containerRect.height;
                if ((overflowsX && containerOverflow.x == "hidden") ||
                    (overflowsY && containerOverflow.y == "hidden")) {
                    return "hidden";
                }
                else if ((overflowsX && containerOverflow.x != "visible") ||
                    (overflowsY && containerOverflow.y != "visible")) {
                    // If the element has fixed position and falls outside the scrollable area
                    // of the document, then it is hidden.
                    if (treatAsFixedPosition) {
                        var docScroll = getScroll(container);
                        if (region.left >= htmlElem.scrollWidth - docScroll.x ||
                            region.right >= htmlElem.scrollHeight - docScroll.y) {
                            return "hidden";
                        }
                    }
                    // If the element can be scrolled into view of the parent, it has a scroll
                    // state; unless the parent itself is entirely hidden by overflow, in
                    // which it is also hidden by overflow.
                    var containerState = getOverflowState(container);
                    return containerState == "hidden" ? "hidden" : "scroll";
                }
            }
            // Does not overflow any ancestor.
            return "none";
        }
        function isDisplayed(e) {
            if (window.getComputedStyle(e).display == "none") {
                return false;
            }
            var parent = e.parentElement;
            return !parent || isDisplayed(parent);
        }
        function isVisibleInner(elem, ignoreOpacity) {
            if (ignoreOpacity === void 0) { ignoreOpacity = false; }
            // By convention, BODY element is always shown: BODY represents the document
            // and even if there's nothing rendered in there, user can always see there's
            // the document.
            if (elem.tagName === "BODY") {
                return true;
            }
            // Option or optgroup is shown iff enclosing select is shown (ignoring the
            // select's opacity).
            if (elem.tagName === "OPTION" || elem.tagName === "OPTGROUP") {
                var select = elem.closest("select");
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
            var visibility = window.getComputedStyle(elem).visibility;
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
            function positiveSize(e) {
                var rect = e.getBoundingClientRect();
                if (rect.height > 0 && rect.width > 0) {
                    return true;
                }
                // Zero-sized elements should still be considered to have positive size
                // if they have a child element or text node with positive size, unless
                // the element has an 'overflow' style of 'hidden'.
                return (window.getComputedStyle(e).overflow != "hidden" &&
                    Array.from(e.childNodes).some(function (n) {
                        return isTextNode(n) || (isElement(n) && positiveSize(n));
                    }));
            }
            if (!isJSDOM && !positiveSize(elem)) {
                return false;
            }
            // Elements that are hidden by overflow are not shown.
            function hiddenByOverflow(e) {
                return (getOverflowState(e) == "hidden" &&
                    Array.from(e.childNodes).every(function (n) {
                        return !isElement(n) || hiddenByOverflow(n) || !positiveSize(n);
                    }));
            }
            if (!isJSDOM && hiddenByOverflow(elem)) {
                return false;
            }
            return true;
        }
        return isVisibleInner(elem);
    }
    function elementVisible(elem) {
        if (!(elem instanceof Element))
            throw Error("DomUtil: elem is not an element.");
        var style = getComputedStyle(elem);
        if (style.display === "none")
            return false;
        if (style.visibility !== "visible")
            return false;
        if (Number(style.opacity) < 0.1)
            return false;
        if (elem.offsetWidth +
            elem.offsetHeight +
            elem.getBoundingClientRect().height +
            elem.getBoundingClientRect().width ===
            0) {
            return false;
        }
        var elemCenter = {
            x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
            y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
        };
        if (elemCenter.x < 0) {
            return false;
        }
        if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) {
            return false;
        }
        if (elemCenter.y < 0)
            return false;
        if (elemCenter.y >
            (document.documentElement.clientHeight || window.innerHeight)) {
            return false;
        }
        var _a = getCoords(elem), left = _a.left, top = _a.top, right = _a.right, bottom = _a.bottom;
        var pointCenterContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
        var pointTopLeftContainer = document.elementFromPoint(left, top);
        var pointTopRightContainer = document.elementFromPoint(right, top);
        var pointBottomLeftContainer = document.elementFromPoint(left, bottom);
        var pointBottomRightContainer = document.elementFromPoint(right, bottom);
        do {
            if ([
                pointCenterContainer,
                pointBottomRightContainer,
                pointTopRightContainer,
                pointTopLeftContainer,
                pointBottomLeftContainer,
            ].includes(elem))
                return true;
        } while ((pointCenterContainer = pointCenterContainer === null || pointCenterContainer === void 0 ? void 0 : pointCenterContainer.parentNode));
        return false;
    }
    var createHintMarker = function (_a) {
        var markKey = _a.markKey, topPos = _a.topPos, leftPos = _a.leftPos, element = _a.element;
        var hintMarker = document.createElement("div");
        if ((element instanceof HTMLInputElement &&
            editableInputList.includes(element === null || element === void 0 ? void 0 : element.type)) ||
            element instanceof HTMLTextAreaElement ||
            ((element === null || element === void 0 ? void 0 : element.isContentEditable) && element instanceof HTMLSelectElement)) {
            hintMarker.classList.add(HINT_MARKER_CLASSNAME_FOCUSABLE);
        }
        else {
            hintMarker.classList.add(HINT_MARKER_CLASSNAME_DEFAULT);
        }
        hintMarker.classList.add(HINT_MARKER_CLASSNAME);
        var _b = markKey.split(""), prefixKey = _b[0], postfixKey = _b[1];
        var prefixElement = createHintMarkerKey({
            key: prefixKey,
            className: HINT_MARKER_CLASSNAME_PREFIX
        });
        hintMarker.appendChild(prefixElement);
        if (postfixKey) {
            var postfixElement = createHintMarkerKey({
                key: postfixKey,
                className: HINT_MARKER_CLASSNAME_POSTFIX
            });
            hintMarker.appendChild(postfixElement);
        }
        hintMarker.style.top = "".concat(topPos, "px");
        hintMarker.style.left = "".concat(leftPos, "px");
        return hintMarker;
    };
    var isElementInViewport = function (el) {
        var rect = el.getBoundingClientRect();
        return (rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth));
    };
    var getAllActionableElements = function () {
        return Array.from(document.querySelectorAll("a, button, input, select, textarea"))
            .filter(isVisible)
            .filter(elementVisible)
            .filter(isElementInViewport);
    };
    var getCoords = function (elem) {
        var rect = elem.getBoundingClientRect();
        var left = rect.left + window.scrollX;
        var top = rect.top + window.scrollY;
        return {
            left: left,
            top: top,
            right: left + rect.width,
            bottom: top + rect.height
        };
    };
    var getAlphaKeys = function (_a) {
        var _b = _a.start, start = _b === void 0 ? 0 : _b, _c = _a.end, end = _c === void 0 ? ENGLISH_LETTERS_AMOUNT : _c;
        return ALPHABET_ENGLISH_KEY_OPTIMIZED.split("").slice(start, end);
    };
    var getChunkNumberByTotal = function (total) {
        return Math.ceil(total / ENGLISH_LETTERS_AMOUNT) - 1;
    };
    var generateExtraHintKeys = function (extraHintKeysTotal) {
        return Array(extraHintKeysTotal <= MAX_ALPHA_HINT_AMOUNT
            ? extraHintKeysTotal
            : MAX_ALPHA_HINT_AMOUNT)
            .fill(0)
            .map(function (_, index) {
            var currentChunkPrefixLetter = ALPHABET_ENGLISH_KEY_OPTIMIZED[ENGLISH_LETTERS_AMOUNT - getChunkNumberByTotal(index + 1) - 1];
            return "".concat(currentChunkPrefixLetter).concat(ALPHABET_ENGLISH_KEY_OPTIMIZED[index % ENGLISH_LETTERS_AMOUNT]);
        });
    };
    var generateAlphaHintMarks = function (alphaHintsTotal) {
        if (!alphaHintsTotal) {
            return [];
        }
        var initialChucks = getAlphaKeys({ end: alphaHintsTotal });
        if (ENGLISH_LETTERS_AMOUNT >= alphaHintsTotal) {
            return initialChucks;
        }
        var extraChunksAmount = getChunkNumberByTotal(alphaHintsTotal);
        var initialChunksRefined = getAlphaKeys({
            end: ENGLISH_LETTERS_AMOUNT - extraChunksAmount
        });
        var extraHintKeysTotal = alphaHintsTotal - initialChunksRefined.length;
        var extraChunksKeys = generateExtraHintKeys(extraHintKeysTotal);
        return __spreadArray(__spreadArray([], getAlphaKeys({ end: ENGLISH_LETTERS_AMOUNT - extraChunksAmount }), true), extraChunksKeys, true);
    };
    var generateHintKeys = function (totalHints) {
        if (!totalHints) {
            return [];
        }
        var firstTenHintKeys = Array.from(Array(totalHints > SINGLE_DIGIT_NUM_AMOUNT
            ? SINGLE_DIGIT_NUM_AMOUNT
            : totalHints), function (d, i) { return String(i); });
        if (totalHints <= SINGLE_DIGIT_NUM_AMOUNT) {
            return firstTenHintKeys;
        }
        return __spreadArray(__spreadArray([], firstTenHintKeys, true), generateAlphaHintMarks(totalHints - SINGLE_DIGIT_NUM_AMOUNT), true);
    };
    var renderHintMarkers = function (_a) {
        var renderPredicate = _a.renderPredicate;
        var hintMarkerContainer = loadHintMarkerContainer();
        var hintKeys = generateHintKeys(allActionableElements.length);
        var renderableHintMarks = allActionableElements
            .map(function (actionableElement, index) {
            var coords = getCoords(actionableElement);
            return {
                sourceElement: actionableElement,
                hintKey: hintKeys[index],
                hintMark: createHintMarker({
                    markKey: hintKeys[index],
                    topPos: coords.top,
                    leftPos: coords.left,
                    element: actionableElement
                })
            };
        })
            .filter(function (_, index) {
            if (renderPredicate) {
                return renderPredicate({ hintKey: hintKeys[index] });
            }
            return true;
        });
        activatedHintsSuites = renderableHintMarks;
        renderableHintMarks.forEach(function (_a) {
            var hintMark = _a.hintMark;
            return hintMarkerContainer.appendChild(hintMark);
        });
    };
    var simulateMouseEvent = function (event, element, modifiers) {
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
        }
        else if (event === "mouseover") {
            simulateMouseEvent("mouseout", undefined, modifiers);
            lastHoveredElement = element;
        }
        var mouseEvent = new MouseEvent(event, {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            detail: 1,
            ctrlKey: modifiers.ctrlKey,
            altKey: modifiers.altKey,
            shiftKey: modifiers.shiftKey,
            metaKey: modifiers.metaKey
        });
        return element.dispatchEvent(mouseEvent);
    };
    var simulateClick = function (element, modifiers) {
        if (modifiers === void 0) { modifiers = {}; }
        if (modifiers == null) {
            modifiers = {};
        }
        var eventSequence = ["mouseover", "mousedown", "mouseup", "click"];
        var result = [];
        for (var _i = 0, eventSequence_1 = eventSequence; _i < eventSequence_1.length; _i++) {
            var event_1 = eventSequence_1[_i];
            var defaultActionShouldTrigger = simulateMouseEvent(event_1, element, modifiers);
            result.push(defaultActionShouldTrigger);
        }
        return result;
    };
    var openHyperlink = function (_a) {
        var hyperlink = _a.hyperlink, event = _a.event;
        var href = hyperlink === null || hyperlink === void 0 ? void 0 : hyperlink.href;
        var isShift = event.shiftKey;
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
    var clickButton = function (_a) {
        var button = _a.button;
        button.click();
    };
    var dismissHints = function () {
        removeAllHintMarkerContainer();
        hintsActivated = false;
        hintPrefixActivatedKey = "";
        activatedHintsSuites = [];
        allActionableElements = [];
    };
    var isPostfixKey = function (_a) {
        var hintKey = _a.hintKey;
        if (hintKey.length < 2) {
            return false;
        }
        return hintKey.startsWith(hintPrefixActivatedKey);
    };
    var highlightPostfixKey = function () {
        var prefixKeys = document.querySelectorAll(classify(HINT_MARKER_CLASSNAME_PREFIX));
        prefixKeys.forEach(function (prefixKeyElement) {
            prefixKeyElement.style.opacity = "0.3";
        });
    };
    var activateThePrefixKey = function (_a) {
        var prefixKey = _a.prefixKey;
        hintPrefixActivatedKey = prefixKey;
        removeAllHintMarkerContainer();
        renderHintMarkers({
            renderPredicate: isPostfixKey
        });
        if (activatedHintsSuites.length === 0) {
            dismissHints();
        }
        else {
            highlightPostfixKey();
        }
    };
    var handleInputAction = function (_a) {
        var input = _a.input;
        var type = input.type;
        if ([
            "button",
            "submit",
            "color",
            "checkbox",
            "radio",
            "file",
            "image",
            "reset",
        ].includes(type)) {
            input.click();
            return;
        }
        if (editableInputList.includes(type)) {
            setTimeout(function () {
                input.focus();
            }, 0);
        }
    };
    var handleSelectAction = function (_a) {
        var select = _a.select;
        select.focus();
    };
    var handleTextAreaAction = function (_a) {
        var textarea = _a.textarea;
        textarea.focus();
    };
    var triggerClickOnElement = function (_a) {
        var element = _a.element, event = _a.event;
        if (element instanceof HTMLAnchorElement) {
            openHyperlink({
                hyperlink: element,
                event: event
            });
        }
        else if (element instanceof HTMLButtonElement) {
            clickButton({ button: element });
        }
        else if (element instanceof HTMLInputElement) {
            handleInputAction({ input: element });
        }
        else if (element instanceof HTMLSelectElement) {
            handleSelectAction({ select: element });
        }
        else if (element instanceof HTMLTextAreaElement) {
            handleTextAreaAction({ textarea: element });
        }
    };
    var handlePostfixHintKey = function (_a) {
        var postfixKey = _a.postfixKey, event = _a.event;
        var hintKeyChosen = "".concat(hintPrefixActivatedKey).concat(postfixKey);
        var activatedHintSuite = activatedHintsSuites.find(function (_a) {
            var hintKey = _a.hintKey;
            return hintKey === hintKeyChosen;
        });
        if (activatedHintSuite) {
            triggerClickOnElement({
                element: activatedHintSuite.sourceElement,
                event: event
            });
        }
        dismissHints();
    };
    var getHintIndex = function (chosenHintKey) {
        return generateHintKeys(allActionableElements.length).findIndex(function (hintKey) { return hintKey === chosenHintKey; });
    };
    var keyCodeToHintKey = function (keyCode) {
        if (keyCode === void 0) { keyCode = ""; }
        if (keyCode.startsWith("Digit")) {
            var _a = keyCode.split("Digit"), _ = _a[0], hintKey = _a[1];
            return hintKey;
        }
        if (keyCode.startsWith("Key")) {
            var _b = keyCode.split("Key"), _ = _b[0], hintKey = _b[1];
            return hintKey.toLowerCase();
        }
        return keyCode.toLowerCase();
    };
    var isUserInEditingMode = function (_a) {
        var _b;
        var event = _a.event;
        var element = event === null || event === void 0 ? void 0 : event.target;
        var tagName = (_b = element === null || element === void 0 ? void 0 : element.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        if (tagName === "input") {
            if (editableInputList.includes(element === null || element === void 0 ? void 0 : element.type)) {
                return true;
            }
        }
        if (tagName === "textarea") {
            return true;
        }
        return Boolean(element === null || element === void 0 ? void 0 : element.isContentEditable);
    };
    document.addEventListener("click", function (event) {
        dismissHints();
    });
    document.addEventListener("keydown", function (event) {
        if (!event.isTrusted) {
            return false;
        }
        if (isUserInEditingMode({ event: event })) {
            return;
        }
        var chosenHintKey = keyCodeToHintKey(event.code);
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
            handlePostfixHintKey({ postfixKey: chosenHintKey, event: event });
            return;
        }
        var selectedHintIndex = getHintIndex(chosenHintKey);
        if (selectedHintIndex === -1) {
            activateThePrefixKey({ prefixKey: chosenHintKey });
            return;
        }
        var actionableElement = allActionableElements[selectedHintIndex];
        if (actionableElement) {
            triggerClickOnElement({
                element: actionableElement,
                event: event
            });
        }
        dismissHints();
    });
})();
