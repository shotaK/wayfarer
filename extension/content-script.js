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
    // document.addEventListener("load", function () {
    var hintsActivated = false;
    var HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
    var HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
    var ENGLISH_LETTERS_AMOUNT = 26;
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
    var createHintMarkerContainer = function () {
        var hintMarkerContainer = document.createElement("div");
        hintMarkerContainer.classList.add(HINT_MARKER_CONTAINER_CLASSNAME);
        return hintMarkerContainer;
    };
    var loadHintMarkerContainer = function () {
        var hintMarkerContainer = createHintMarkerContainer();
        document.body.appendChild(hintMarkerContainer);
        return hintMarkerContainer;
    };
    var isVisible = function (element) {
        return (element.offsetWidth > 0 ||
            element.offsetHeight > 0 ||
            element.getClientRects().length > 0);
    };
    var createHintMarker = function (_a) {
        var markKey = _a.markKey, topPos = _a.topPos, leftPos = _a.leftPos;
        var hintMarker = document.createElement("div");
        hintMarker.classList.add(HINT_MARKER_CLASSNAME);
        hintMarker.innerText = markKey;
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
    var getAllHyperlinks = function () {
        return Array.from(document.querySelectorAll("a"))
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
    var getAlphaKeys = function (amount) {
        return "abcdefghijklmnopqrstuvwxyz".split("").slice(0, amount);
    };
    var generateAlphaHintMarks = function (alphaHintsTotal) {
        var totalExtraChunks = Math.ceil(alphaHintsTotal / ENGLISH_LETTERS_AMOUNT) - 1;
        if (ENGLISH_LETTERS_AMOUNT >= alphaHintsTotal) {
            return getAlphaKeys(alphaHintsTotal);
        }
        var initialChunk = getAlphaKeys(ENGLISH_LETTERS_AMOUNT - totalExtraChunks);
        var extraHintKeysTotal = alphaHintsTotal - ENGLISH_LETTERS_AMOUNT;
        Array(extraHintKeysTotal)
            .fill(0)
            .map(function (_, index) {
        });
    };
    console.log(generateAlphaHintMarks(89));
    var generateHintKeys = function (totalHints) {
        if (!totalHints) {
            return [];
        }
        var firstTenHintKeys = Array.from(Array(totalHints > 10 ? 10 : totalHints), function (d, i) { return String(i); });
        if (totalHints <= 10) {
            return firstTenHintKeys;
        }
        if (totalHints <= 36) {
            return __spreadArray(__spreadArray([], firstTenHintKeys, true), getAlphaKeys(totalHints - 10), true);
        }
        if (totalHints <= 61) {
            return __spreadArray(__spreadArray([], firstTenHintKeys, true), "abcdefghijklmnopqrstuvwxyz".split("").slice(0, totalHints - 10), true);
        }
    };
    // console.log(generateHintKeys(36));
    var renderHintMarkers = function (hintMarkerContainer) {
        getAllHyperlinks().forEach(function (hyperlink, index) {
            var coords = getCoords(hyperlink);
            if (hintMarkerContainer) {
                var hintMarker = createHintMarker({
                    markKey: index.toString(),
                    topPos: coords.top,
                    leftPos: coords.left
                });
                hintMarkerContainer.appendChild(hintMarker);
            }
        });
    };
    document.addEventListener("keydown", function (event) {
        var _a;
        if (hintsActivated) {
            if (event.key === "Escape") {
                hintsActivated = false;
            }
            else {
                var hyperlink = getAllHyperlinks()[Number(event.key)];
                var href = hyperlink === null || hyperlink === void 0 ? void 0 : hyperlink.href;
                if (href) {
                    (_a = window.open(href, "_blank")) === null || _a === void 0 ? void 0 : _a.focus();
                }
            }
        }
        if (event.key === "f") {
            var allHyperlinks = getAllHyperlinks();
            if (allHyperlinks.length > 0) {
                var hintMarkerContainer = loadHintMarkerContainer();
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
