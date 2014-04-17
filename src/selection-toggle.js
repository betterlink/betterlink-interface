/**
 * Manages a system that toggles the display of page highlights so that the
 * highlight always covers the most-recently selected text.
 *
 */
betterlink_user_interface.createModule("Selection Toggle", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.Ranges", "Highlighter Proxy"] );

	var HIGHLIGHTER_ID_PREFIX = "prospectiveSubmission";

	var activeHighlighters = [];
	var initialized = false;

	var highlighterCreateFunc;
	var highlighterRemovalFunc;

	apiInternal.selectionToggle = {
		initialize: initialize,
		toggleDisplay: toggleDisplayOfProspectiveSubmissions,
		getHighlighterWithIdentifier: getHighlighterWithIdentifier
	};
	/****************************************************************************************************/

	apiInternal.events.registerObserverForRemoveBetterlink(removeExistingHighlighters);

	// Two functions are required before using this module:
	//   highlighterCreateFunc: identifier (string), highlighterId (string)
	//     Used to create the highlighter object that will decorate the DOM. 'identifier'
	//     is the unique name for the highlighter that will be used as an internal
	//     identifier. 'highlighterId' is a related unique identifier that will display
	//     within the DOM.
	//
	//   highlighterRemovalFunc
	//     Function to remove any CSS classes or additional attributes that have been
	//     added ontop of our highlighted elements. Will be passed into a HighlighterProxy
	function initialize(createFunc, removalFunc) {
		highlighterCreateFunc = createFunc;
		highlighterRemovalFunc = removalFunc;
		initialized = true;
	}

	// Triggered on a mouseup event. If the user is finishing their click with part of
	// the document selected, then markup the document to identify the prospective
	// Betterlink submission. Also, remove any prior submission markups.
	function toggleDisplayOfProspectiveSubmissions() {
		if(initialized && !selectionIsEmpty()) {
			// A simple remove-and-redecorate will fail if the user is selecting text
			// that intersects an already-highlighted section. This is because the
			// highlighter removal will adjust the DOM and change the ranges that are
			// being selected.
			//
			// Saving and restoring the selection allows us to recreate the selection
			// after the DOM has been modified.
			var savedSelection = apiInternal.util.ranges.saveSelection();
			removeExistingHighlighters();
			apiInternal.util.ranges.restoreSelection(savedSelection);
			decorateProspectiveSubmission();
		}
	}

	// Remove any highlights that might already be on the page for previous selections
	function removeExistingHighlighters() {
		apiInternal.util.forEach(activeHighlighters, function(highlighter, index) {
			highlighter.detach();
		});
		activeHighlighters.length = 0;
	}

	// Highlight the current selection to indicate what would be saved if the selection
	// were submitted to create a new link. We append an identifier to the highlighter
	// name so that we can distinguish the multiple selections we'll end up creating.
	function decorateProspectiveSubmission() {
		var uniqueIdentifier = Math.floor(1E8 * Math.random()).toString(10);
		var highlighterName = HIGHLIGHTER_ID_PREFIX + "|" + uniqueIdentifier;

		var success = highlighterCreateFunc(highlighterName, uniqueIdentifier);

		if(success) {
			var highlighter = new apiInternal.HighlighterProxy(highlighterName, uniqueIdentifier, highlighterRemovalFunc);
			activeHighlighters.push(highlighter);

			var highlightedRanges = highlighter.highlightSelection();
			highlighter.storeLastRanges(highlightedRanges, 'afterHighlight');
		}
		else {
			apiInternal.warn('There was a problem adding a highlighter to markup prospective submissions');
		}
	}

	// Return if the document has any text that is currently selected
	function selectionIsEmpty() {
		return apiInternal.util.ranges.currentSelectionIsEmpty();
	}

	// Return the active highlighter associated with a particular identifier
	function getHighlighterWithIdentifier(identifier) {
		if(identifier) {
			for(var i = 0, len = activeHighlighters.length; i < len; i++) {
				var highlighter = activeHighlighters[i];
				if(highlighter.identifier === identifier) {
					return highlighter;
				}
			}
		}
		return null;
	}
});
