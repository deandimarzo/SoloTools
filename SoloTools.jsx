// Lyric Sync Generator Panel
(function (thisObj) {
    var scriptName = "SoloTools Lyrics";

    function buildUI(thisObj) {
        var win =
            thisObj instanceof Panel ? thisObj : new Window("palette", scriptName, undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = "left";
        var paddingGroup = win.add("group");
        paddingGroup.add("statictext", undefined, "Padding Frames:");
        var paddingInput = paddingGroup.add("edittext", undefined, "5");
        paddingInput.characters = 4;

        var lyricInputGroup = win.add("group");
        lyricInputGroup.orientation = "column";
        lyricInputGroup.add("statictext", undefined, "Paste Full Lyrics (one line per line):");
        var lyricInput = lyricInputGroup.add("edittext", [0, 0, 400, 200], "", { multiline: true, scrollable: true });

        var addMarkerBtn = win.add("button", undefined, "Add Marker at Current Time");

        addMarkerBtn.onClick = function () {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select an active composition.");
                return;
            }
            var markers = comp.markerProperty;
            var time = comp.time;
            markers.setValueAtTime(time, new MarkerValue(""));
        };

        var generateBtn = win.add("button", undefined, "Generate Synced Layers from Markers");

        generateBtn.onClick = function () {
            app.beginUndoGroup("Generate Synced Lyrics");
            // alert("Generating synced lyrics");

            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select an active composition.");
                return;
            }

            // alert("Composition active.");

            var markers = comp.markerProperty;
            var totalMarkers = markers.numKeys;
            if (totalMarkers === 0) {
                alert("No comp markers found. Please place one marker per word.");
                return;
            }

            var rawText = lyricInput.text;
            var lines = rawText.split(/\r?\n/);
            var words = [];
            for (var i = 0; i < lines.length; i++) {
                var lineText = lines[i];
                if (!lineText || typeof lineText !== "string") continue;

                var lineWords = lineText.split(/\s+/);
                if (lineWords.length > 0) {
                    words.push({ lineIndex: i, words: lineWords });
                }
            }

            var flatWords = [];
            for (var i = 0; i < words.length; i++) {
                for (var j = 0; j < words[i].words.length; j++) {
                    flatWords.push({
                        word: words[i].words[j],
                        lineIndex: words[i].lineIndex,
                        wordIndex: j
                    });
                }
            }

            if (flatWords.length > totalMarkers) {
                alert(
                    "Not enough markers for all words. Found " +
                        flatWords.length +
                        " words and only " +
                        totalMarkers +
                        " markers."
                );
                return;
            }

            // Group words by line index using running marker index
            var lineMap = {};
            var markerIndex = 1;

            for (var i = 0; i < words.length; i++) {
                var line = words[i];
                lineMap[i] = [];

                for (var j = 0; j < line.words.length; j++) {
                    if (markerIndex > markers.numKeys) break;

                    lineMap[i].push({
                        word: line.words[j],
                        markerTime: markers.keyTime(markerIndex)
                    });

                    markerIndex++;
                }
            }

            // Generate one text layer per line
            for (var lineIdx in lineMap) {
                alert("Generating " + lineIdx);
                var entries = lineMap[lineIdx];
                alert("Type of entries: " + Object.prototype.toString.call(entries));

                var words = [];
                for (var i = 0; i < entries.length; i++) {
                    var e = entries[i];
                    if (!e || typeof e.word !== "string") {
                        alert("Bad entry at line " + lineIdx + ", word " + i + ": " + e);
                        continue;
                    }
                    words.push(e.word);
                }
                var text = words.join(" ");

                var layer = comp.layers.addText(text);
                layer.startTime = entries[0].markerTime;

                var animator = layer
                    .property("ADBE Text Properties")
                    .property("ADBE Text Animators")
                    .addProperty("ADBE Text Animator");
                animator.name = "AutoSync";

                animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
                var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");

                var advanced = selector.property("ADBE Text Range Advanced");
                if (advanced) {
                    advanced.property("ADBE Text Range Type2").setValue(3); // Words
                    advanced.property("ADBE Text Range Units").setValue(2); // Index
                }

                var startProp = selector.property("ADBE Text Index Start");

                for (var w = 0; w < entries.length; w++) {
                    var paddingFrames = parseInt(paddingInput.text, 10) || 0;
                    var frameDuration = 1.0 / comp.frameRate;

                    if (paddingFrames > 0 && w > 0) {
                        startProp.setValueAtTime(entries[w].markerTime - paddingFrames * frameDuration, w);
                    }
                    var t = entries[w].markerTime;
                    startProp.setValueAtTime(t, w + 1);
                }
                var nextLineIdx = parseInt(lineIdx) + 1;
                if (lineMap.hasOwnProperty(nextLineIdx)) {
                    layer.outPoint = lineMap[nextLineIdx][0].markerTime;
                    //  alert("Out point set");
                } else {
                    layer.outPoint = entries[entries.length - 1].markerTime + 2;
                }
                // Add fade-out to layer opacity
                var opacityProp = layer.property("ADBE Transform Group").property("ADBE Opacity");

                if (opacityProp) {
                    //  alert("Opacity acquired");
                    var fadeStart = layer.outPoint - 5 / comp.frameRate;
                    //   alert("fadeStart set at " + fadeStart);
                    opacityProp.setValueAtTime(fadeStart, 100);
                    opacityProp.setValueAtTime(layer.outPoint, 0);
                }
                //  alert("Keyframes entered");

                //selector.property("ADBE Text Selector End").setValue(0);
                //selector.property("ADBE Text Selector Offset").setValue(0);
            }

            app.endUndoGroup();
        };

        win.layout.layout(true);
        return win;
    }

    var myScriptPal = buildUI(thisObj);
    if (myScriptPal instanceof Window) myScriptPal.center(), myScriptPal.show();
})(this);
