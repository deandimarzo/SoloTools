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

        // === Animator Properties Group ===
        var animSettingsGroup = win.add("panel", undefined, "Animator Properties");
        animSettingsGroup.orientation = "column";
        animSettingsGroup.alignChildren = "left";

        var useOpacity = animSettingsGroup.add("checkbox", undefined, "Opacity");
        useOpacity.value = true;

        var usePosition = animSettingsGroup.add("checkbox", undefined, "Position");
        var posGroup = animSettingsGroup.add("group");
        posGroup.add("statictext", undefined, "X:");
        var posXInput = posGroup.add("edittext", undefined, "0");
        posXInput.characters = 4;
        posGroup.add("statictext", undefined, "Y:");
        var posYInput = posGroup.add("edittext", undefined, "-100");
        posYInput.characters = 4;

        var useScale = animSettingsGroup.add("checkbox", undefined, "Scale");
        var scaleInput = animSettingsGroup.add("edittext", undefined, "0"); // percent
        scaleInput.characters = 4;

        var useRotation = animSettingsGroup.add("checkbox", undefined, "Rotation");
        var rotInput = animSettingsGroup.add("edittext", undefined, "-90"); // degrees
        rotInput.characters = 4;

        var lyricInputGroup = win.add("group");
        lyricInputGroup.orientation = "column";
        lyricInputGroup.add("statictext", undefined, "Paste Full Lyrics (one line per line):");
        var lyricInput = lyricInputGroup.add("edittext", [0, 0, 400, 200], "", { multiline: true, scrollable: true });

        var addMarkerBtn = win.add("button", undefined, "Add Marker");

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

        var generateBtn = win.add("button", undefined, "Generate Text Layers from Markers");
        var labelMarkersBtn = win.add("button", undefined, "Preview With Marker Labels");

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
                layer.startTime = entries[0].markerTime;

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
                }

                // Apply our keyframes based on markers, including padding
                var startProp = selector.property("ADBE Text Index Start");
                for (var w = 0; w < entries.length; w++) {
                    var paddingFrames = parseInt(paddingInput.text, 10) || 0;
                    var frameDuration = 1.0 / comp.frameRate;
                 
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
                // Add fade-out to layer opacity
                var opacityProp = layer.property("ADBE Transform Group").property("ADBE Opacity");
                
                if (opacityProp) {
                    var fadeStart = layer.outPoint - 5 / comp.frameRate;
                    opacityProp.setValueAtTime(fadeStart, 100);
                    opacityProp.setValueAtTime(layer.outPoint, 0);
                }

            }

            app.endUndoGroup();
        };

        labelMarkersBtn.onClick = function () {
            app.beginUndoGroup("Label Markers with Words");

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

            app.endUndoGroup();
        };

        win.layout.layout(true);
        return win;
    }

    var myScriptPal = buildUI(thisObj);
    if (myScriptPal instanceof Window) myScriptPal.center(), myScriptPal.show();
})(this);
