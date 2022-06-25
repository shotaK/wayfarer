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
    var hintFirstActivatedKey;
    var HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
    var HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
    var HINT_MARKER_CLASSNAME_PREFIX = "wayfarer-hint-marker-prefix";
    var HINT_MARKER_CLASSNAME_POSTFIX = "wayfarer-hint-marker-postfix";
    var ALPHABET_ENGLISH_KEY_OPTIMIZED = "abcdehijklmnopqrsuvwxyztgf";
    var ENGLISH_LETTERS_AMOUNT = ALPHABET_ENGLISH_KEY_OPTIMIZED.length;
    var SINGLE_DIGIT_NUM_AMOUNT = 10;
    var MAX_ALPHA_HINT_AMOUNT = 676;
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
    var isVisible = function (element) {
        return (element.offsetWidth > 0 ||
            element.offsetHeight > 0 ||
            element.getClientRects().length > 0);
    };
    var createHintMarker = function (_a) {
        var markKey = _a.markKey, topPos = _a.topPos, leftPos = _a.leftPos;
        var hintMarker = document.createElement("div");
        hintMarker.classList.add(HINT_MARKER_CLASSNAME);
        var prefixKey = markKey[0], postfixKey = markKey[1];
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
        var allHyperlinks = getAllHyperlinks();
        var hintKeys = generateHintKeys(allHyperlinks.length);
        allHyperlinks.forEach(function (hyperlink, index) {
            var coords = getCoords(hyperlink);
            if (hintMarkerContainer) {
                var hintMarker = createHintMarker({
                    markKey: hintKeys[index],
                    topPos: coords.top,
                    leftPos: coords.left
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
    var dismissHints = function () {
        removeAllHintMarkerContainer();
    };
    var activateThePrefixKey = function (_a) {
        var prefixKey = _a.prefixKey;
        hintFirstActivatedKey = prefixKey;
        removeAllHintMarkerContainer();
        renderHintMarkers({
            renderPredicate: function (_a) {
                var hintKey = _a.hintKey;
                return true;
            }
        });
    };
    document.addEventListener("keydown", function (event) {
        var _a;
        var chosenHintKey = event.key;
        if (!hintsActivated) {
            if (chosenHintKey === "f") {
                var allHyperlinks_1 = getAllHyperlinks();
                if (allHyperlinks_1.length > 0) {
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
        var allHyperlinks = getAllHyperlinks();
        if (hintFirstActivatedKey) {
        }
        var selectedHintIndex = generateHintKeys(allHyperlinks.length).findIndex(function (hintKey) { return hintKey === chosenHintKey; });
        if (selectedHintIndex === -1) {
            activateThePrefixKey({ prefixKey: chosenHintKey });
        }
        else {
            var hyperlink = allHyperlinks[selectedHintIndex];
            var href = hyperlink === null || hyperlink === void 0 ? void 0 : hyperlink.href;
            if (href) {
                (_a = window.open(href, "_blank")) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }
        // const hyperlink = allHyperlinks[Number(event.key)];
        // const href = hyperlink?.href;
        // if (href) {
        //   window.open(href, "_blank")?.focus();
        // }
    });
})();
