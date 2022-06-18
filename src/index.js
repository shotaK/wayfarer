(function () {
    console.log("clock");
    // document.addEventListener("load", function () {
    var HINT_MARKER_CONTAINER_CLASSNAME = "wayfarer-hint-marker-container";
    var HINT_MARKER_CLASSNAME = "wayfarer-hint-marker";
    var createHintMarkerContainer = function () {
        var hintMarkerContainer = document.createElement("div");
        hintMarkerContainer.classList.add(HINT_MARKER_CONTAINER_CLASSNAME);
        return hintMarkerContainer;
    };
    var loadHintMarkerIntoBody = function () {
        var hintMarkerContainer = createHintMarkerContainer();
        document.body.appendChild(hintMarkerContainer);
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
    var getAllHyperlinks = function () {
        return Array.from(document.querySelectorAll("a"));
    };
    var getCoords = function (elem) {
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docEl = document.documentElement;
        var scrollTop = window.scrollY || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.scrollY || docEl.scrollLeft || body.scrollLeft;
        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return { top: Math.round(top), left: Math.round(left) };
    };
    var renderHintMarkers = function () {
        getAllHyperlinks()
            .filter(isVisible)
            .forEach(function (hyperlink, index) {
            var coords = getCoords(hyperlink);
            var hintMarkerContainer = document.querySelector(".".concat(HINT_MARKER_CONTAINER_CLASSNAME));
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
        if (event.key === "f") {
            var allHyperlinks = getAllHyperlinks();
            if (allHyperlinks.length > 0) {
                loadHintMarkerIntoBody();
                renderHintMarkers();
            }
        }
    });
    // });
})();
