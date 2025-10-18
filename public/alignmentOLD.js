export function initAlignment(targetContent) {
    const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]
    const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))
    const wordRegex = /[a-zA-Z'_]+/g;
    
    const getTextWords = (text) => {
        let match = null;
        const words = [];
        while ((match = wordRegex.exec(text.toLowerCase())) !== null) {
            words.push(match[0]);
        }
        return words;
    };
    
    const getElementWords = (el) => {
        if (!el) return [];
        
        let match = null;
        const words = [];
        const text = el.innerText.trim().toLowerCase(); // Get the text content of the element
        while ((match = wordRegex.exec(text)) !== null) {
            words.push(match[0]);
        }
        return words;
    };
    
    const fetchHomonyms = async () => {
        try {
            const response = await fetch('./homonyms.json'); // Or full URL if remote
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const homonyms = await response.json();
            // console.log("Homonym list loaded:", homonyms);
            return homonyms;
        } catch (error) {
            console.error("Failed to load homonyms:", error);
            return [];
        }
    }
    
    const userPrompt = document.getElementById("user-prompt");
    // const userPrompt = document.getElementsByClassName("result").item(0); //document.getElementById("user-prompt");
    const targetPrompt = document.getElementById("target-prompt");
    const targetWords = getTextWords(targetContent); // Static
    const field = document.getElementById("field"); // Output field where words are matched to fill blanks
    let cursorIdx = 0; // Cursor index for the current position in the field
    
    const matches = Array(targetWords.length).fill(null); // Reset matches for each update
    const order = Array(targetWords.length).fill(false); // Reset order for each update
    order[0] = true; // First word is always in the correct order
    const matchOverrides = new Set();
    let homonyms = []
    fetchHomonyms().then((h) => { // Work around for async junk
        homonyms = h;
    });
    
    const getTextTokens = (text) => {
        // Match words (letters, hyphens, apostrophes) or anything else (including spaces, punctuation, line breaks)
        
        let words = [];
        let separators = [];
        let lastIndex = 0;
        let match;
        
        while ((match = wordRegex.exec(text)) !== null) {
            // Separator is from lastIndex to match.index
            separators.push(text.slice(lastIndex, match.index));
            words.push(match[0]);
            lastIndex = match.index + match[0].length;
        }
        // Add trailing separator (after last word)
        separators.push(text.slice(lastIndex));
        return { words, separators };
    };
    
    const getFuzzyThreshold = (word) => {
        return Math.max(2, Math.ceil(word.length * 0.30))
    }
    
    const levenshtein = (a, b) => {
        const dp = Array(a.length + 1)
            .fill(null)
            .map(() => Array(b.length + 1).fill(0));
        
        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;
        
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1, // deletion
                        dp[i][j - 1] + 1, // insertion
                        dp[i - 1][j - 1] + 1.5 // substitution (hold a higher cost)
                    );
                }
            }
        }
        
        /* PRINT THE DP TABLE
        // Determine max word length for padding
        const allWords = [' '].concat(b, a);
        const colWidth = Math.max(...allWords.map(w => w.length), 2) + 2;
        // Prepare header row
        const header = [' '].concat(["", ...b]).map(word => word.padEnd(colWidth)).join('');
        console.log("Levenshtein Table:");
        console.log(header);
        // Print each row with corresponding a[i] label
        for (let i = 0; i < dp.length; i++) {
            const rowLabel = i === 0 ? ' ' : a[i - 1];
            const row = [rowLabel.padEnd(colWidth)];
            for (let j = 0; j < dp[i].length; j++) {
                row.push(String(dp[i][j]).padEnd(colWidth));
            }
            console.log(row.join(''));
        }*/
        
        return dp[a.length][b.length];
    };
    
    const splitUserWords = (userWords, userWordsSplitters, subRecs) => {
        // Split userWords into chunks at each splitter index
        let lastIndex = 0;
        const userWordsChunks = [];
        userWordsSplitters.map(splitIndex => {
            userWordsChunks.push(userWords.slice(lastIndex, splitIndex));
            lastIndex = splitIndex;
        });
        userWordsChunks.push(userWords.slice(lastIndex)); // Add the last chunk
        
        // Verify chunk sizes
        if (userWordsChunks.length === 1)
            return userWordsChunks; // If only one chunk, return as is
        userWordsChunks.map((chunk, i) => {
            if (chunk.length < 2) { // If chunk is too small, merge with a neighboring chunk
                if (i > 0)
                    userWordsChunks[i - 1] = userWordsChunks[i - 1].concat(userWordsChunks[i]); // Add to previous chunk
                else if (userWordsChunks[i + 1])
                    userWordsChunks[i + 1] = userWordsChunks[i].concat(userWordsChunks[i + 1]); // Add to next chunk
                userWordsChunks.splice(i, 1); // Remove the chunk
            }
        });
        
        // console.log("userWordsChunks:", userWordsChunks);
        
        return userWordsChunks;
    }
    
    const updateMatches = (userWords, matchedUserWords, subRecs) => {
        console.log("call updateMatches:", subRecs)
        // Find all correct matches between userWords and targetWords
        const userWordsSplitters = [];
        let prevUnrecognizedIdx = 0;
        // const fuzzyThreshold = 2; // Levenshtein distance to be considered correct
        const splitThreshold = 3; // Forward distance between correct matches to be considered outliers
        const levens = Array(userWords.length).fill(null).map(() => Array(targetWords.length).fill(0)); // Track levenshtein distances for optimization
        userWords.map((userWord, i) => {
            // Find all possible matches for the current user word
            targetWords.map((targetWord, j) => {
                const fuzzyThreshold = getFuzzyThreshold(targetWord);
                const leven = (homonyms.includes(userWord) && homonyms.includes(targetWord)) ? fuzzyThreshold : levenshtein(userWord, targetWord); // Levenshtein distance OR is homonym
                if (leven <= fuzzyThreshold) { // NOTE: Do not use (... && !matches[j])
                    matches[j] = "M"; // Correct match
                    matchedUserWords[i].push(j); // Track matched user words
                    order[j] = order[j] || ( i > 0 && j > 0 && levens[i - 1][j - 1] <= fuzzyThreshold); // Correct order
                }
                levens[i][j] = leven; // Store for order checking optimization
                
                if (subRecs.has(targetWord) && subRecs.get(targetWord).includes(userWord)) { // Unrecognized word
                    console.log("NEW UNREC FOUND");
                    matchedUserWords[i].push(j)
                    prevUnrecognizedIdx = i;
                }
            });
            
            // console.log(matchedUserWords[i].map(currIdx => {
            //     console.log(targetWords[currIdx - 1])
            //     return subRecs.has(targetWords[currIdx - 1])
            // }))
            console.log("PREV:", prevUnrecognizedIdx, matchedUserWords[i])
            
            // Check for outliers
            if (
                i > 0 &&
                matchedUserWords[i].length > 0 &&
                matchedUserWords[i - 1].length > 0 &&
                !matchedUserWords[i].some(currIdx => 
                    matchedUserWords[i - 1].some(prevIdx => 
                        (currIdx - prevIdx) <= splitThreshold && currIdx > prevIdx // Check if current index is 3 words ahead of previous index
                    ) 
                ) &&
                i > prevUnrecognizedIdx + 2
            ) {
                userWordsSplitters.push(i); // Track split index   
            }
        });
        
        // Split userWords into chunks at each splitter index
        const userWordsChunks = splitUserWords(userWords, userWordsSplitters, subRecs);
        
        // Match chunks with targetWords
        userWordsChunks.map((userWordsChunk, i) => {
            // Find levenshtein distance for each window
            const levenshteins = matches.map((state, j) => { // ISSUE: this checks for all matches in targetWords, not just the current chunk
                if (state) { // Not just "M"
                    let window = targetWords.slice(j, j + userWordsChunk.length); // NOTE: adding +1 to fixes mismatching at the end of targetWords
                    if (j + userWordsChunk.length >= targetWords.length)
                        window = [...window, ""]; // Add end string to better fit chunk to the window
                    return levenshtein(userWordsChunk, window) - (window[0] === userWordsChunk[0] ? 1 : 0); // Prefer matches that start with the same word
                } else {
                    return Infinity; // Ignore unmatched words
                }
            });
            
            // Process levenshtein distances to find the nearest match
            let nearestMatchLength = Math.ceil(Math.min(...levenshteins)) + 1; // Store the levenshtein distance to size target window
            if (nearestMatchLength === Infinity)
                nearestMatchLength = 0; // No matches found
            const nearestMatchIndex = argMin(levenshteins);
            
            // Initialize slice to be incorrect
            const windowLength = userWordsChunk.length + nearestMatchLength; // Local window for matching
            const matchesSlice = Array(windowLength).fill("I"); // Default all not correct with incorrect matches    (state === "C") ? "C" : 
            
            // Match chunk with window
            let p = 0; // Previous index for user words
            userWordsChunk.map((userWord) => {
                targetWords.slice(nearestMatchIndex + p, nearestMatchIndex + windowLength).some((targetWord, j, targetSlice) => {
                    console.log(targetWord, (subRecs.has(targetWord)))
                    if (subRecs.has(targetWord) && subRecs.get(targetWord).includes(userWord)) { // Unrecognized word
                        console.log("UNRECOGNIZED");
                        matchesSlice[j + p] = "C"; // Correct match
                        
                        order[nearestMatchIndex + j + p] = true;
                        order[nearestMatchIndex + j + p + 1] = true;
                        p += Math.max(0, j - 1); // Update index
                        return true // Stop searching when found
                    }
                    
                    const fuzzyThreshold = 2;//getFuzzyThreshold(targetWord);
                    const leven = (homonyms.includes(userWord) && homonyms.includes(targetWord)) ? fuzzyThreshold : levenshtein(userWord, targetWord); // Levenshtein distance OR is homonym
                    if (leven <= fuzzyThreshold) { // && (j == nearestMatchIndex || matches[j - 1] == "I" || userWords[i - 1] == targetWords[j - 1])) {
                        matchesSlice[j + p] = "C"; // Correct match
                        p += Math.max(0, j - 1); // Update index
                        return true // Stop searching when found
                    }
                    if (j <= 0) return false
                    
                    
                    // Check for implied, insignificant or unrecognized words
                    // if (matchesSlice[j - 1] !== "C" && (targetSlice[j - 1].length <= 2)) {//subRecs.some((u) => u.includes(targetSlice[j - 1]))) { 
                    //     matchesSlice[j - 1] = "O"; // Make previous word an implied match
                    //     console.log("imp:", targetSlice[j - 1])
                    //     order[nearestMatchIndex + p - 1] = true;
                    //     order[nearestMatchIndex + p + 1] = true;
                    // }

                    // `console.log(`if ("${matchesSlice[j - 1]}" !== "C" (${matchesSlice[j - 1] !== "C"}) && ${targetSlice[j - 1].length} <= 2 (${targetSlice[j - 1].length <= 2}))`)
                    // if (matchesSlice[j - 1] !== "C" && (targetSlice[j - 1].length <= 2 || subRecs.includes(targetSlice[j - 1]))) { // Previous word is incorrect and is 2 or less characters
                    // console.log("m?")
                    // console.log(subRecs, targetSlice[j - 1])
                    // if (subRecs.includes(targetSlice[j - 1])) {//subRecs.some((u) => u.includes(targetSlice[j - 1]))) { 
                    //     matchesSlice[j - 1] = "O"; // Make previous word an implied match
                    //     console.log("imp:", targetSlice[j - 1])
                    //     order[nearestMatchIndex + p - 1] = true;
                    //     order[nearestMatchIndex + p + 1] = true;
                    // }
                });
            });
            
            // Clip matchesSlice to the last correct match
            const lastCorrectIdx = matchesSlice.lastIndexOf("C");
            const matchesSliceClipped = lastCorrectIdx !== -1
                ? matchesSlice.slice(0, lastCorrectIdx + 1 + 1) // CHANGED
                : matchesSlice.slice();
            
            // Update matches with the new matchesSlice
            matchesSliceClipped.map((state, k) => {
                matches[nearestMatchIndex + k] = state;
            });
        });
        
        // Override revealed words
        [...matchOverrides].map(l => {
            if (matches[l] !== "C")
                matches[l] = "O"; // Only override for non-correct matches
            order[l] = true; // Keep order regardless
        });
        
        // console.log("Matched User Words:", matchedUserWords);
        // console.log("Display Words:", displayWords);
        // console.log("Display Separators:", displaySeparators);
        // console.log("User Words:", userWords);
        // console.log("Target Words:", targetWords);
        // console.log("Matches:", matches);
        // console.log("Order:", order);
        
        return { matches, order };
    }
    
    const updateField = (matches, order=null, cursorIdx=0) => {
        // Initialize the field and display words
        if (!field) return
        field.innerHTML = "";
        const { words: displayWords, separators: displaySeparators } = getTextTokens(targetPrompt.innerText);
        
        const cursorSpan = document.createElement("span");
        cursorSpan.className = "cursor";
        // cursorSpan.innerText = "▼";
        // cursorSpan.appendChild(textCursor);
        
        // Display the paragraph elements in the field
        matches.map((state, i) => {
            // Display separators
            if (displaySeparators[i]) {
                const separatorSpan = document.createElement("span");
                separatorSpan.className = "separator"; // Class for separators
                separatorSpan.innerText = displaySeparators[i];
                field.append(separatorSpan);
            }
            
            // Display order indicators
            if (order && i > 0 && !order[i] && matches[i] !== null && matches[i] !== "M") {
                // If the word is not correct match or order, add an order indicator
                const orderSpan = document.createElement("span");
                orderSpan.className = "order"; // Class for order
                // orderSpan.style.color = "red"; // Color for order indicators
                orderSpan.innerText = ".."; //"•"
                field.append(orderSpan);
            }
            
            // Display the word with its state
            const wordSpan = document.createElement("span");
            wordSpan.id = i; // Set id to the index of the word
            
            wordSpan.innerText = displayWords[i]; // Use the matched word
            if (state === "C") {
                // wordSpan.style.color = "green"; // Change color to green for matched words
                wordSpan.className = "correct"; // Update class to matched
                wordSpan.innerText = displayWords[i];
            } else if (state === "O") {
                // wordSpan.style.color = "blue"; // Change color to green for matched words
                wordSpan.className = "overridden"; // Update class to matched
                wordSpan.innerText = displayWords[i];
            } else if (state === "I") {
                // wordSpan.style.color = "red"; // Change color to yellow for inserted words
                wordSpan.className = "incorrect"; // Update class to matched
                const wordLen = displayWords[i] ? displayWords[i].length : 1;
                wordSpan.innerText = /*displayWords[i];/*/"_".repeat(wordLen);//*/
            } /*else if (state === "M") {
                wordSpan.style.backgroundColor = "yellow"; // Change color to yellow for inserted words
                wordSpan.className = "matched"; // Update class to matched 
            }*/
            else {
                // Use underscores matching the word length, or 1 if word is undefined
                const wordLen = displayWords[i] ? displayWords[i].length : 1;
                wordSpan.innerText = displayWords[i];/*/"_".repeat(wordLen);//*/
                wordSpan.style.color = "lightgray"; // Default color for unmatched words
            }
            
            // Append word and cursor if applicable
            field.append(wordSpan);
            if (cursorIdx === 0)
                field.prepend(cursorSpan);
            else if (i === cursorIdx)
                wordSpan.after(cursorSpan); // Place cursor after the current word
        });
        
        if (displaySeparators[displaySeparators.length - 1]) {
            const separatorSpan = document.createElement("span");
            separatorSpan.className = "separator"; // Class for separators
            separatorSpan.innerText = displaySeparators[displaySeparators.length - 1];
            field.append(separatorSpan);
        }
        return { field, matches, order }
    }

    const updateCursor = (matches) => {
        const correctPercentage = 0.80;
        let correctCount = 0;
        let cursorIdx = 0;
        
        matches.some((state, j) => {
            if (!cursorIdx && (!state || state == "M")) { // This insures the user can start from anywhere
                correctCount++;
                return false; // Continue iterating
            }
            if (state === "C" || state === "O") {
                correctCount++;
                cursorIdx = j; // Update cursor index to the last correct match
            }
            if (correctCount / (j + 1) < correctPercentage)
                return true; // Stop iterating once we find a mismatch
        });
        
        // console.log("idx:", cursorIdx);
        return cursorIdx;
    }
    
    const updateDisplay = (subRecs) => {
        // console.log("call updateDisplay:", subRecs)
        // Declare variables
        const userWords = getElementWords(userPrompt);
        const matchedUserWords = Array(userWords.length) // Track matched user words
            .fill(null)
            .map(() => Array()); // Initialize as empty arrays for each user word
        
        // Update variables
        matches.fill(null);
        order.fill(false);
        order[0] = true;
        
        // Update field
        const { matches: updatedMatches, order: updatedOrder } = updateMatches(userWords, matchedUserWords, subRecs); // Find matches and order
        cursorIdx = updateCursor(updatedMatches); // Update cursor position
        updateField(updatedMatches, updatedOrder, cursorIdx); // Display to the screen
    };
    
    const showNextWord = (subRecs) => {
        // if (matches[0] || matches[1]) { // Only run if the user has started
            // Mark the next word as matched
            matchOverrides.add(cursorIdx + 1);
            console.log("Overrides", matchOverrides);
            updateDisplay(subRecs);
        // }
    }
    
    updateDisplay(new Map()); // Initial call to set up the field
    
    // return { updateDisplay, showNextWord, targetWords }
    return { updateDisplay, showNextWord, targetWords }
}
