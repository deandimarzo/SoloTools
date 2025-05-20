// Lyric Sync Generator Panel
(function (thisObj) {
    var scriptName = "SoloTools Lyrics";

    function buildUI(thisObj) {
        var win =
            thisObj instanceof Panel ? thisObj : new Window("palette", scriptName, undefined, { resizeable: true });

        // === UI Layout Rework ===
        win.orientation = "column";
        win.alignChildren = "fill";

        var lyricToggle = win.add("checkbox", undefined, "▼ Generate Lyric Layers");
        lyricToggle.value = true;

        var mainGroup = win.add("group");
        mainGroup.orientation = "row";
        mainGroup.alignChildren = "top";
        mainGroup.visible = lyricToggle.value;

        lyricToggle.onClick = function () {
            mainGroup.visible = lyricToggle.value;
            lyricToggle.text = lyricToggle.value ? "▼ Generate Lyric Layers" : "▶ Generate Lyric Layers";
        };

        // === Left Column: Workflow ===
        var leftCol = mainGroup.add("group");
        leftCol.orientation = "column";
        leftCol.alignChildren = "left";

        var paddingGroup = leftCol.add("group");
        paddingGroup.add("statictext", undefined, "Padding Frames:");
        var paddingInput = paddingGroup.add("edittext", undefined, "5");
        paddingInput.characters = 4;

        var lyricInputGroup = leftCol.add("group");
        lyricInputGroup.orientation = "column";
        lyricInputGroup.alignChildren = "left";
        lyricInputGroup.add("statictext", undefined, "Paste Full Lyrics (one line per line):");
        var lyricInput = lyricInputGroup.add("edittext", [0, 0, 400, 200], "", { multiline: true, scrollable: true });

        var addMarkerBtn = leftCol.add("button", undefined, "Add Marker");
        var labelMarkersBtn = leftCol.add("button", undefined, "Preview Lyrics");
        var generateBtn = leftCol.add("button", undefined, "Generate Text Layers from Markers");

        // -- Status Group --
        var statusGroup = leftCol.add("group");
        statusGroup.orientation = "column";
        statusGroup.alignChildren = "left";

        var markerCountText = statusGroup.add("statictext", undefined, "Markers: 0");
        var wordCountText = statusGroup.add("statictext", undefined, "Words: 0");
        var currentWordText = statusGroup.add("statictext", [0, 0, 200, 20], "Current Word: -");

        // === Right Column: Animator Settings ===
        var rightCol = mainGroup.add("panel", undefined, "Animator Properties");
        rightCol.orientation = "column";
        rightCol.alignChildren = "left";

        var useOpacity = rightCol.add("checkbox", undefined, "Opacity");
        useOpacity.value = true;

        var posRow = rightCol.add("group");
        var usePosition = posRow.add("checkbox", undefined, "Position");
        posRow.add("statictext", undefined, "X:");
        var posXInput = posRow.add("edittext", undefined, "0");
        posXInput.characters = 4;
        posRow.add("statictext", undefined, "Y:");
        var posYInput = posRow.add("edittext", undefined, "200");
        posYInput.characters = 4;

        var scaleRow = rightCol.add("group");
        var useScale = scaleRow.add("checkbox", undefined, "Scale");
        scaleRow.add("statictext", undefined, "%:");
        var scaleInput = scaleRow.add("edittext", undefined, "0");
        scaleInput.characters = 4;

        var rotRow = rightCol.add("group");
        var useRotation = rotRow.add("checkbox", undefined, "Rotation");
        rotRow.add("statictext", undefined, "°:");
        var rotInput = rotRow.add("edittext", undefined, "-90");
        rotInput.characters = 4;

        var fadeOutCheckbox = rightCol.add("checkbox", undefined, "Fade Out at End");
        fadeOutCheckbox.value = true;

        // === Ease and Smoothness Settings ===
        var smoothRow = rightCol.add("group");
        smoothRow.add("statictext", undefined, "Smoothness:");
        var smoothInput = smoothRow.add("edittext", undefined, "100");
        smoothInput.characters = 4;

        var easeHighRow = rightCol.add("group");
        easeHighRow.add("statictext", undefined, "Ease High:");
        var easeHighInput = easeHighRow.add("edittext", undefined, "50");
        easeHighInput.characters = 4;

        var easeLowRow = rightCol.add("group");
        easeLowRow.add("statictext", undefined, "Ease Low:");
        var easeLowInput = easeLowRow.add("edittext", undefined, "50");
        easeLowInput.characters = 4;

        // ADJUSTMENT LAYER SETTINGS
        var adjToggle = win.add("checkbox", undefined, "▼ Adjustment Layer Tools");
        adjToggle.value = true;

        var adjGroup = win.add("group");
        adjGroup.orientation = "column";
        adjGroup.alignChildren = "left";
        adjGroup.visible = adjToggle.value;

        adjToggle.onClick = function () {
            adjGroup.visible = adjToggle.value;
            adjToggle.text = adjToggle.value ? "▼ Adjustment Layer Tools" : "▶ Adjustment Layer Tools";
        };
        var transStylePanel = adjGroup.add("panel", undefined, "Transition Styles");
        transStylePanel.orientation = "column";
        transStylePanel.alignChildren = "left";

        var zoomCheckbox = transStylePanel.add("checkbox", undefined, "Zoom (Scale)");
        zoomCheckbox.value = true;

        var rotationCheckbox = transStylePanel.add("checkbox", undefined, "Rotation");
        rotationCheckbox.value = false;

        var positionCheckbox = transStylePanel.add("checkbox", undefined, "Position");
        positionCheckbox.value = false;

        var posDirGroup = transStylePanel.add("group");
        posDirGroup.add("statictext", undefined, "Direction:");
        var posDirDropdown = posDirGroup.add("dropdownlist", undefined, ["Up", "Down", "Left", "Right"]);
        posDirDropdown.selection = 0;

        // --- Zoom Amount ---
        var zoomAmtGroup = transStylePanel.add("group");
        zoomAmtGroup.add("statictext", undefined, "Zoom Amt:");
        var zoomAmtInput = zoomAmtGroup.add("edittext", undefined, "100");
        zoomAmtInput.characters = 4;

        // --- Rotation Amount ---
        var rotAmtGroup = transStylePanel.add("group");
        rotAmtGroup.add("statictext", undefined, "Rotation Amt:");
        var rotAmtInput = rotAmtGroup.add("edittext", undefined, "30");
        rotAmtInput.characters = 4;

        // --- Position Amount ---
        var posAmtGroup = transStylePanel.add("group");
        posAmtGroup.add("statictext", undefined, "Position Amt:");
        var posAmtInput = posAmtGroup.add("edittext", undefined, "100");
        posAmtInput.characters = 4;

        var transitionBtn = adjGroup.add("button", undefined, "Create Transition Effect");

        // -- ADD MARKER BUTTON FUNCTIONALITY --
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

        // -- UPDATE STATUS FUNCTION --
        function updateWordStatus() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                markerCountText.text = "Markers: -";
                wordCountText.text = "Words: -";
                currentWordText.text = "Latest Word: -";
                return;
            }

            var markers = comp.markerProperty;
            var markerCount = markers.numKeys;
            markerCountText.text = "Markers: " + markerCount;

            var text = lyricInput.text;
            var words = [];
            if (text && typeof text === "string") {
                var split = text.replace(/\n/g, " ").split(/\s+/);
                for (var i = 0; i < split.length; i++) {
                    if (split[i] !== "") words.push(split[i]);
                }
            }
            wordCountText.text = "Words: " + words.length;

            // Show last labeled word
            var word = "-";
            if (markerCount > 0) {
                var markerVal = markers.keyValue(markerCount);
                if (markerVal && markerVal.comment && typeof markerVal.comment === "string") {
                    word = markerVal.comment;
                }
            }
            currentWordText.text = "Latest Word: " + word;
        }

        // --- MAIN LAYER GENERATION CODE ---
        generateBtn.onClick = function () {
            app.beginUndoGroup("Generate Synced Lyrics");

            // Validate we have an active comp
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select an active composition.");
                return;
            }

            // Make sure we have some markers
            var markers = comp.markerProperty;
            var totalMarkers = markers.numKeys;
            if (totalMarkers === 0) {
                alert("No comp markers found. Please place one marker per word.");
                return;
            }

            // Split the text into lines
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

            // Split the lines into words
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

            // Compare words to markers and complain a lot if they don't match
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
                var entries = lineMap[lineIdx];

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
                var paddingFrames = parseInt(paddingInput.text, 10) || 0;
                var frameDuration = 1.0 / comp.frameRate;
                layer.startTime = entries[0].markerTime - paddingFrames * frameDuration;

                // Apply "Word"-based text anchor grouping
                // Will later make this a dropdown option, but for now you're almost always gonna want Word anchoring anyway
                var moreOptions = layer.property("ADBE Text Properties").property("ADBE Text More Options");
                if (moreOptions) {
                    var anchorPointGrouping = moreOptions.property("ADBE Text Anchor Point Option");
                    if (anchorPointGrouping) {
                        try {
                            anchorPointGrouping.setValue(2); // 0 = Character, 1 = Word, 2 = Line, 3 = All
                        } catch (err) {
                            alert("Failed to set Anchor Point Grouping:\n" + err.toString());
                        }
                    }
                }

                // Add the Animator
                var animator = layer
                    .property("ADBE Text Properties")
                    .property("ADBE Text Animators")
                    .addProperty("ADBE Text Animator");
                animator.name = "AutoSync";

                var animProps = animator.property("ADBE Text Animator Properties");

                // Apply our chosen properties
                if (useOpacity.value) {
                    animProps.addProperty("ADBE Text Opacity").setValue(0);
                }
                if (usePosition.value) {
                    animProps
                        .addProperty("ADBE Text Position 3D")
                        .setValue([parseFloat(posXInput.text) || 0, parseFloat(posYInput.text) || 0]);
                }
                if (useScale.value) {
                    var scaleVal = parseFloat(scaleInput.text) || 0;
                    animProps.addProperty("ADBE Text Scale 3D").setValue([scaleVal, scaleVal]);
                }
                if (useRotation.value) {
                    animProps.addProperty("ADBE Text Rotation").setValue(parseFloat(rotInput.text) || 0);
                }

                // Add a standard Range Selector, using Index/Words functionality instead of the default Percent/Characters
                var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
                var advanced = selector.property("ADBE Text Range Advanced");
                if (advanced) {
                    advanced.property("ADBE Text Range Type2").setValue(3); // Words
                    advanced.property("ADBE Text Range Units").setValue(2); // Index

                    advanced.property("ADBE Text Selector Smoothness").setValue(parseFloat(smoothInput.text) || 0);
                    advanced.property("ADBE Text Levels Max Ease").setValue(parseFloat(easeHighInput.text) || 0);
                    advanced.property("ADBE Text Levels Min Ease").setValue(parseFloat(easeLowInput.text) || 0);
                }

                // Apply our keyframes based on markers, including padding
                var startProp = selector.property("ADBE Text Index Start");

                if (entries.length > 0 && paddingFrames > 0) {
                    var firstTime = entries[0].markerTime;
                    var paddingTime = paddingFrames * frameDuration;
                    var preTime = firstTime - paddingTime;

                    var allowPreKey = true;

                    // Check if there's a previous marker before this line starts
                    var lineStartMarkerIndex = markers.nearestKeyIndex(firstTime);
                    if (lineStartMarkerIndex > 1) {
                        var prevMarkerTime = markers.keyTime(lineStartMarkerIndex - 1);
                        if (firstTime - prevMarkerTime < paddingTime) {
                            allowPreKey = false;
                        }
                    }

                    if (allowPreKey && preTime >= 0) {
                        startProp.setValueAtTime(preTime, 0);
                        layer.startTime = preTime; // also shift layer start time
                    } else {
                        layer.startTime = firstTime;
                    }
                }

                for (var w = 0; w < entries.length; w++) {
                    for (var w = 0; w < entries.length; w++) {
                        var thisTime = entries[w].markerTime;
                        var prevTime = w > 0 ? entries[w - 1].markerTime : null;

                        // Only apply padding if enough time since previous keyframe
                        if (paddingFrames > 0 && prevTime !== null) {
                            var timeBetween = thisTime - prevTime;
                            var paddingTime = paddingFrames * frameDuration;

                            if (timeBetween > paddingTime) {
                                startProp.setValueAtTime(thisTime - paddingTime, w);
                            }
                        }

                        // Always place actual keyframe at marker time
                        startProp.setValueAtTime(thisTime, w + 1);
                    }

                    startProp.setValueAtTime(thisTime, w + 1);
                }
                var nextLineIdx = parseInt(lineIdx) + 1;
                if (lineMap.hasOwnProperty(nextLineIdx)) {
                    layer.outPoint = lineMap[nextLineIdx][0].markerTime;
                } else {
                    layer.outPoint = entries[entries.length - 1].markerTime + 2;
                }

                // Add fade-out to layer opacity if checkbox is checked
                var opacityProp = layer.property("ADBE Transform Group").property("ADBE Opacity");
                if (fadeOutCheckbox.value && opacityProp) {
                    var fadeStart = layer.outPoint - 5 / comp.frameRate;
                    opacityProp.setValueAtTime(fadeStart, 100);
                    opacityProp.setValueAtTime(layer.outPoint, 0);
                }
            }

            updateWordStatus();

            app.endUndoGroup();
        };

        labelMarkersBtn.onClick = function () {
            app.beginUndoGroup("Label Markers with Words");
            // updateWordStatus();
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select an active composition.");
                return;
            }

            var markers = comp.markerProperty;
            var totalMarkers = markers.numKeys;

            if (totalMarkers === 0) {
                alert("No comp markers found. Please place one marker per word.");
                return;
            }

            var rawText = lyricInput.text;
            var lines = rawText.split(/\r?\n/);
            var flatWords = [];

            for (var i = 0; i < lines.length; i++) {
                var lineText = lines[i];
                if (!lineText || typeof lineText !== "string") continue;

                var lineWords = lineText.split(/\s+/);
                for (var j = 0; j < lineWords.length; j++) {
                    flatWords.push(lineWords[j]);
                }
            }

            var count = Math.min(totalMarkers, flatWords.length);
            for (var i = 0; i < count; i++) {
                var time = markers.keyTime(i + 1);
                var word = flatWords[i];
                var marker = new MarkerValue(word);
                markers.setValueAtTime(time, marker);
            }

            if (flatWords.length < totalMarkers) {
                alert("Fewer words than markers. Remaining markers will be unchanged.");
            } else if (flatWords.length > totalMarkers) {
                alert("Not enough markers for all words. Only the first " + totalMarkers + " words were used.");
            }
            updateWordStatus();
            app.endUndoGroup();
        };

        transitionBtn.onClick = function () {
            app.beginUndoGroup("Create Transition Adjustment Layer");

            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select an active composition.");
                return;
            }

            var markers = comp.markerProperty;
            if (markers.numKeys !== 3) {
                alert("Please place exactly 3 markers: In, Transition, Out.");
                return;
            }

            var inTime = markers.keyTime(1);
            var transitionTime = markers.keyTime(2);
            var outTime = markers.keyTime(3);

            // Create adjustment layer
            var layer = comp.layers.addSolid([1, 1, 1], "Transition FX", comp.width, comp.height, 1);
            layer.adjustmentLayer = true;
            layer.startTime = inTime;
            layer.outPoint = outTime;

            // Add Motion Tile
            var motionTile = layer.property("Effects").addProperty("ADBE Tile");
            motionTile("Output Width").setValue(200);
            motionTile("Output Height").setValue(200);
            motionTile("Mirror Edges").setValue(1);

            // Add Transform
            var transform = layer.property("Effects").addProperty("ADBE Geometry");

            var msg = "ADBE Geometry Properties:\n";

            transform("Uniform Scale").setValue(true); // Turn on uniform scaling
            var scaleProp = transform("Scale Height"); // Only need one when uniform is enabled

            var frameDuration = 1 / comp.frameRate;
            var zoomAmt = parseFloat(zoomAmtInput.text) || 100;
            var rotAmt = parseFloat(rotAmtInput.text) || 30;
            var posAmt = parseFloat(posAmtInput.text) || 100;

            var frameDuration = 1 / comp.frameRate;
            var t1 = inTime;
            var t2 = transitionTime - frameDuration;
            var t3 = transitionTime;
            var t4 = outTime;

            if (zoomCheckbox.value) {
                transform("Uniform Scale").setValue(true);
                var scaleProp = transform("Scale Height");

                scaleProp.setValueAtTime(t1, 100);
                scaleProp.setValueAtTime(t2, 100 + zoomAmt);
                scaleProp.setValueAtTime(t3, Math.max(100 - zoomAmt, 10));
                scaleProp.setValueAtTime(t4, 100);

                for (var i = 1; i <= 4; i++) {
                    scaleProp.setInterpolationTypeAtKey(
                        i,
                        KeyframeInterpolationType.BEZIER,
                        KeyframeInterpolationType.BEZIER
                    );
                }

                scaleProp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 100)]);
                scaleProp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 1)], [new KeyframeEase(0, 1)]);
                scaleProp.setTemporalEaseAtKey(3, [new KeyframeEase(0, 1)], [new KeyframeEase(0, 1)]);
                scaleProp.setTemporalEaseAtKey(4, [new KeyframeEase(0, 100)], [new KeyframeEase(0, 33)]);
            }

            if (rotationCheckbox.value) {
                var rotProp = transform("Rotation");
                rotProp.setValueAtTime(t1, 0);
                rotProp.setValueAtTime(t2, rotAmt);
                rotProp.setValueAtTime(t3, -rotAmt);
                rotProp.setValueAtTime(t4, 0);

                for (var i = 1; i <= 4; i++) {
                    rotProp.setInterpolationTypeAtKey(
                        i,
                        KeyframeInterpolationType.BEZIER,
                        KeyframeInterpolationType.BEZIER
                    );
                }

                rotProp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 100)]);
                rotProp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 1)], [new KeyframeEase(0, 1)]);
                rotProp.setTemporalEaseAtKey(3, [new KeyframeEase(0, 1)], [new KeyframeEase(0, 1)]);
                rotProp.setTemporalEaseAtKey(4, [new KeyframeEase(0, 100)], [new KeyframeEase(0, 33)]);
            }

            if (positionCheckbox.value) {
                var dir = posDirDropdown.selection.text;
                var dx = 0,
                    dy = 0;
                if (dir === "Up") dy = -posAmt;
                if (dir === "Down") dy = posAmt;
                if (dir === "Left") dx = -posAmt;
                if (dir === "Right") dx = posAmt;

                var center = [comp.width / 2, comp.height / 2];
                var posProp = transform("Position");

                posProp.setValueAtTime(t1, center);
                posProp.setValueAtTime(t2, [center[0] + dx, center[1] + dy]);
                posProp.setValueAtTime(t3, [center[0] - dx, center[1] - dy]);
                posProp.setValueAtTime(t4, center);

                for (var i = 1; i <= 4; i++) {
                    posProp.setInterpolationTypeAtKey(
                        i,
                        KeyframeInterpolationType.BEZIER,
                        KeyframeInterpolationType.BEZIER
                    );
                }

                posProp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 100)]);
                posProp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 1)], [new KeyframeEase(0, 1)]);
                posProp.setTemporalEaseAtKey(3, [new KeyframeEase(0, 1)], [new KeyframeEase(0, 1)]);
                posProp.setTemporalEaseAtKey(4, [new KeyframeEase(0, 100)], [new KeyframeEase(0, 33)]);
            }

            app.endUndoGroup();
        };

        win.layout.layout(true);

        return win;
    }

    var myScriptPal = buildUI(thisObj);

    if (myScriptPal instanceof Window) myScriptPal.center(), myScriptPal.show();
})(this);
