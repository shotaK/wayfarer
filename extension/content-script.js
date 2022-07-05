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
    var activatedHintsSuites = [];
    var HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
    var HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
    var HINT_MARKER_CLASSNAME_PREFIX = "wayfarer-hint-marker-prefix";
    var HINT_MARKER_CLASSNAME_POSTFIX = "wayfarer-hint-marker-postfix";
    var ALPHABET_ENGLISH_KEY_OPTIMIZED = "abcdehijklmnopqrsuvwxyztgf";
    var ENGLISH_LETTERS_AMOUNT = ALPHABET_ENGLISH_KEY_OPTIMIZED.length;
    var SINGLE_DIGIT_NUM_AMOUNT = 10;
    var MAX_ALPHA_HINT_AMOUNT = 676;
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
    function isVisible(elem) {
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
        if (elemCenter.x < 0)
            return false;
        if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth))
            return false;
        if (elemCenter.y < 0)
            return false;
        if (elemCenter.y >
            (document.documentElement.clientHeight || window.innerHeight))
            return false;
        var pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
        do {
            if (pointContainer === elem)
                return true;
        } while ((pointContainer = pointContainer === null || pointContainer === void 0 ? void 0 : pointContainer.parentNode));
        return false;
    }
    var createHintMarker = function (_a) {
        var markKey = _a.markKey, topPos = _a.topPos, leftPos = _a.leftPos;
        var hintMarker = document.createElement("div");
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
        return Array.from(document.querySelectorAll("a, button, input"))
            .filter(isVisible)
            .filter(isElementInViewport);
    };
    var getCoords = function (elem) {
        var rect = elem.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY
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
        var allHyperlinks = getAllActionableElements();
        var hintKeys = generateHintKeys(allHyperlinks.length);
        var renderableHintMarks = allHyperlinks
            .map(function (hyperlink, index) {
            var coords = getCoords(hyperlink);
            return {
                sourceElement: hyperlink,
                hintKey: hintKeys[index],
                hintMark: createHintMarker({
                    markKey: hintKeys[index],
                    topPos: coords.top,
                    leftPos: coords.left
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
    var openHyperlink = function (_a) {
        var _b;
        var hyperlink = _a.hyperlink, event = _a.event;
        var href = hyperlink === null || hyperlink === void 0 ? void 0 : hyperlink.href;
        var isShift = event.shiftKey;
        if (!href || href.startsWith("javascript") || href.startsWith("#")) {
            hyperlink.click();
            return;
        }
        if (href) {
            (_b = window.open(href, isShift ? "_blank" : "_self")) === null || _b === void 0 ? void 0 : _b.focus();
        }
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
        if (type === "button") {
            input.click();
        }
        if (type === "submit") {
            input.click();
        }
        if (["text", "email", "number", "search", "tel", "url", "password"].includes(type)) {
            setTimeout(function () {
                input.focus();
            }, 0);
        }
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
        var allHyperlinks = getAllActionableElements();
        return generateHintKeys(allHyperlinks.length).findIndex(function (hintKey) { return hintKey === chosenHintKey; });
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
    document.addEventListener("keydown", function (event) {
        var chosenHintKey = keyCodeToHintKey(event.code);
        if (["ShiftLeft", "ShiftRight"].includes(event.code) || event.ctrlKey) {
            return;
        }
        var allActionableElements = getAllActionableElements();
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
            handlePostfixHintKey({ postfixKey: chosenHintKey, event: event });
            return;
        }
        var selectedHintIndex = getHintIndex(chosenHintKey);
        if (selectedHintIndex === -1) {
            activateThePrefixKey({ prefixKey: chosenHintKey });
            return;
        }
        var actionableElement = allActionableElements[selectedHintIndex];
        triggerClickOnElement({
            element: actionableElement,
            event: event
        });
        dismissHints();
    });
})();
