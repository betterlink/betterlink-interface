/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.Interface", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Util.Ranges", "Submissions", "Selection Highlighter", "Event Messaging"] );

	var LOADING_MESSAGE = "Generating your link...";
	var HIGHLIGHTER_ID_PREFIX = "prospectiveSubmission";

	var PROSPECTIVE_SUBMISSION_CSS_CLASS = "betterlink-prospective-submission";
	var PROSPECTIVE_SUBMISSION_CSS = "." + PROSPECTIVE_SUBMISSION_CSS_CLASS + ":hover" +
							[" { background: #DADADA;",
								"text-decoration: underline;",
								"cursor: pointer; }"].join(' ');

	// ********************   ARROW CSS   ********************
	var ARROW_CSS = [" { position: absolute;",
						"width: 0;",
						"height: 0;",
						"margin-top: -5px;",
						"margin-left: -5px;",
						"border-left: 5px solid transparent;",
						"border-right: 5px solid transparent;",
						// ie6 height fix
						"font-size: 0;",
						"line-height: 0;",
						// ie6 transparent fix
						"_border-right-color: pink;",
						"_border-left-color: pink;",
						"_filter: chroma(color=pink); }"].join(' ');

	var ARROW_DOWN_CSS_CLASS = "betterlink-arrow-down";
	var ARROW_DOWN_CSS = ARROW_CSS.replace("{", "{ border-top: 5px solid #4169E1;");

	var ARROW_UP_CSS_CLASS = "betterlink-arrow-up";
	var ARROW_UP_CSS = ARROW_CSS.replace("{", "{ border-bottom: 5px solid #4169E1;")
								.replace(/margin-top:[^;]*;/, "margin-top: inherit;");

	// ******************** L-Shape CSS ********************
	var l_shared_css = [" { position: absolute;",
					"width: 12px;",
					"height: 5px;",
					// ie6 height fix
					"font-size: 0;",
					"line-height: 0; }"].join(' ');

	var l_top_addition =      [ "margin-top: -5px;",
								"border-top: 2px solid #4169E1;",
								"border-left: 2px solid #4169E1;"].join(' ');

	var l_bottom_addition =   [ "margin-top: inherit;",
								"margin-left: -12px;",
								"border-bottom: 2px solid #4169E1;",
								"border-right: 2px solid #4169E1;"].join(' ');

	var L_TOP_CSS_CLASS = "betterlink-l-top";
	var L_TOP_CSS = l_shared_css.replace("{", "{ " + l_top_addition);

	var L_BOTTOM_CSS_CLASS = "betterlink-l-bottom";
	var L_BOTTOM_CSS = l_shared_css.replace("{", "{ " + l_bottom_addition);

	// ************************************************************

	var activeHighlighters = [];
	var submittedHighlighters = [];

	var userClickTimeout,
		userClickThreshold = 250;	// milliseconds between a click & double-click

	var identifierAttributeName = "data-identifier";
	var highlightBookends = {};

	apiInternal.submissions.interface = {
		cleanupSubmittedHighlighters: cleanupSubmittedHighlighters
	};
	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	apiInternal.events.registerObserverForRemoveBetterlink(removeExistingHighlighters);
	function initializeInterface() {
		if(apiInternal.submissions.interface.initialized) {
			return;
		}

		apiInternal.submissions.interface.initialized = true;

		insertProspectiveSubmissionStyle();
		insertBookendStyles();
		insertDocumentListeners();
	}

	// The 'prospective submission' style is used to markup a selection that could
	// be submitted to Betterlink as a new link.
	function insertProspectiveSubmissionStyle() {
		apiInternal.util.dom.createAndAppendStyleElement(PROSPECTIVE_SUBMISSION_CSS);
	}

	// Bookends will be added to the DOM to enclose the prospective submission, so
	// that it is clear to the user that they can interact with the content there.
	function insertBookendStyles() {
		apiInternal.util.dom.addCssByClass(ARROW_DOWN_CSS_CLASS, ARROW_DOWN_CSS);
		apiInternal.util.dom.addCssByClass(ARROW_UP_CSS_CLASS, ARROW_UP_CSS);

		apiInternal.util.dom.addCssByClass(L_TOP_CSS_CLASS, L_TOP_CSS);
		apiInternal.util.dom.addCssByClass(L_BOTTOM_CSS_CLASS, L_BOTTOM_CSS);
	}

	// When the user finishes a click (on mouseup), toggle the display of prospective
	// submissions. Remove previously highlighted sections and mark the new selection.
	function insertDocumentListeners() {
		// Because we are highlighting the prospective submission and turning the result
		// into a click-handler, a triple-click (selecting a full paragraph of text) will
		// end up executing the result of a double-click (selecting a word of text).
		//
		// Instead, we attempt to consolidate multiple click events into a single execution.
		// Complicating this, a 'mouseup' event executes anytime the user lets go of the
		// mouse button. However, a 'click' event only executes when the user depresses and
		// releases the mouse ontop of a single element. We need to handle both situations.
		//
		// General structure is similar to 'debouncing', as outlined by John Hann:
		// http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
		//
		// We execute the event once after we've stopped receiving signals within a
		// predefined threshold. Mouseup events set the first timer. Click events reset
		// the timer until they stop.
		apiInternal.addListener(document, "mouseup", setUserClickTimeout);
		apiInternal.addListener(document, "click", resetUserClickTimeout);
	}

	function setUserClickTimeout() {
		if(!userClickTimeout) { // don't retrigger on subsequent mouseups
			userClickTimeout = setTimeout(executeDelayedAction, userClickThreshold);
		}
	}

	function resetUserClickTimeout() {
		if(userClickTimeout) {
			clearTimeout(userClickTimeout);
			userClickTimeout = setTimeout(executeDelayedAction, userClickThreshold);
		}

		// A second option is to check if we've achieved three clicks (a triple-click)
		// and immediately execute our action. However, this would no longer allow a
		// user to cycle between triple and double-clicking a word v. paragraph. Since
		// the delay is small enough, we'll just wait the extra time.
		// Note: this behavior is browser-specific (ex: Firefox, not Chrome)
	}

	// This action should be executed only a single time during the consolidation of
	// multiple click events.
	function executeDelayedAction() {
		userClickTimeout = null;
		toggleDisplayOfProspectiveSubmissions();
	}

	// ****** Highlighter Proxy Object ******
	function HighlighterProxy(highlighterName, identifier) {
		highlighter = this;
		highlighter.name = highlighterName;
		highlighter.identifier = identifier;
	}

	HighlighterProxy.prototype = {
		// Store the last ranges that were associated with our highlighter API. Because
		// these ranges are invalidated after any subsequent changes to the DOM, we
		// only ever need the last set that was returned.
		//
		// A rangeEvent can be used as a reference for which action created the range.
		storeLastRanges: function(ranges, rangeEvent) {
			this.lastActiveRanges = ranges;
			this.lastActiveRangeType = rangeEvent;
		},

		sendSubmission: function() {
			this.removeExistingDecorations();
			apiInternal.events.fireNewSubmission(this.lastActiveRanges);
			submittedHighlighters.push(this);
		},

		// Remove any highlights from the document associated with this highlighter.
		removeExistingDecorations: function() {
			var rangesToRemove = this.lastActiveRanges;

			if(rangesToRemove) {
				var undoneRanges = this.removeHighlightFromRanges(rangesToRemove);
				this.storeLastRanges(undoneRanges, 'afterUndo');
			}

			removeSelectionBookends(this.identifier);
		},

		// Fully remove any traces of this highlighter from the document and remove
		// its associated bookends
		nuclearRemoveFromDocument: function() {
			this.removeAllHighlights();
			removeSelectionBookends(this.identifier);
		},

		highlightSelection: function() {
			return apiInternal.highlighters.highlightSelection(this.name);
		},

		highlightRanges: function(rangesToHighlight) {
			return apiInternal.highlighters.highlightRanges(this.name, rangesToHighlight);
		},

		removeAllHighlights: function() {
			apiInternal.highlighters.removeAllHighlights(this.name);
		},

		removeHighlightFromRanges: function(rangesToRemove) {
			return apiInternal.highlighters.removeHighlightFromRanges(this.name, rangesToRemove);
		},

		// Signal that all decorations associated with this highlighter have been
		// removed and that the highlighter shouldn't be used for anything else
		detach: function() {
			if(!this.detached) {
				this.detached = true;
				this.nuclearRemoveFromDocument();
			}
		}
	};
	// ****** Highlighter Proxy Object ******

	function cleanupSubmittedHighlighters() {
		// When we are submitting the result of a highlighter, we want to make
		// sure everything about that highlighter is cleaned up once the submission
		// is successful. However, there may be multiple submissions happening in
		// parallel.
		//
		// Because of that, we can't just detach every highlighter that's been
		// submitted. When we call detach(), we end up modifying the DOM, which
		// will invalidate the previous range and make it more difficult to
		// highlight the submitted result.
		//
		// We can fake it by cleaning up the oldest highlighter in the array. Ideally
		// we could just attach an event listenter (or something) that would alert
		// this particular object to clean itself up.
		for(var i = 0, len = submittedHighlighters.length; i < len; i++) {
			var highlighter = submittedHighlighters[i];
			if(!highlighter.detached) {
				highlighter.detach();
				break;
			}
		}
	}

	// Triggered on a mouseup event. If the user is finishing their click with part of
	// the document selected, then markup the document to identify the prospective
	// Betterlink submission. Also, remove any prior submission markups.
	function toggleDisplayOfProspectiveSubmissions() {
		if(!selectionIsEmpty()) {
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
		var uniqueIdentifier = Math.floor(1E8 * Math.random());
		var highlighterName = HIGHLIGHTER_ID_PREFIX + "|" + uniqueIdentifier;

		var success = createProspectiveSubmissionHighlighter(highlighterName, uniqueIdentifier);

		if(success) {
			var highlighter = new HighlighterProxy(highlighterName, uniqueIdentifier);
			activeHighlighters.push(highlighter);

			var highlightedRanges = highlighter.highlightSelection();
			highlighter.storeLastRanges(highlightedRanges, 'afterHighlight');

			insertSelectionBookends(uniqueIdentifier);
		}
		else {
			apiInternal.warn('There was a problem adding a highlighter to markup prospective submissions');
		}
	}

	// Insert bookend elements before and after the area that was highlighted. These indicate
	// the range of the highlight to the user.
	// The start and end elements are saved via a callback function that runs when each of the
	// elements are created.
	function insertSelectionBookends(highlighterId) {
		if(highlightBookends[highlighterId]) {
			var startElement = highlightBookends[highlighterId].start;
			var endElement = highlightBookends[highlighterId].end;

			var startBookend = document.createElement('b');
			startBookend.className = L_TOP_CSS_CLASS;

			var endBookend = document.createElement('b');
			endBookend.className = L_BOTTOM_CSS_CLASS;

			apiInternal.util.dom.registerAndInsertBefore(startBookend, startElement);
			apiInternal.util.dom.registerAndInsertAfter(endBookend, endElement);

			highlightBookends[highlighterId].startBookend = startBookend;
			highlightBookends[highlighterId].endBookend = endBookend;
		}
	}

	// Remove the bookends associated with a particular highlighter identifier. When removing
	// the elements from the DOM, we don't need to 'unregister' them with Betterlink. If
	// Betterlink needs to be detached, it will silently skip over registered elements that
	// have already been removed from the DOM.
	function removeSelectionBookends(highlighterId) {
		if(highlightBookends[highlighterId]) {
			var startBookend = highlightBookends[highlighterId].startBookend;
			var endBookend = highlightBookends[highlighterId].endBookend;

			if(startBookend) {
				if(startBookend.parentNode) {
					startBookend.parentNode.removeChild(startBookend);
				}
			}
			if(endBookend) {
				if(endBookend.parentNode) {
					endBookend.parentNode.removeChild(endBookend);
				}
			}
			delete highlightBookends[highlighterId];
		}
	}

	// Return if the document has any text that is currently selected
	function selectionIsEmpty() {
		return apiInternal.util.ranges.currentSelectionIsEmpty();
	}

	// Create a new Highlighter (referenced by a provided identifier) and register
	// it with Betterlink. If successful, will return the highlighter identifier.
	// Otherwise, will return false.
	function createProspectiveSubmissionHighlighter(identifier, highlighterId) {
		// Define this up here so that we can call the element attribute by
		// reference (so that we only need to define it once). For the sake
		// of JS compilers, we need to ensure the object keys are referenced
		// by string, instead of by symbol.
		var elementAttributes = {};
		elementAttributes[identifierAttributeName] = highlighterId;

		var highlightOptions = {

			// any element that's highlighted should have the following properties
			'elementProperties': {
				'title': 'Click to create your personal link'
			},

			// any element that's highlighted should have these non-standard
			// attributes
			'elementAttributes': elementAttributes,

			// elements that we will apply our CSS class to, instead of creating
			// a new container element. ex:
			// <span class="myclass">this is my text</span> v.
			// <span><mark class="myclass">this is my text</mark></span>
			//
			// Note: if the existing element doesn't have all of the properties
			// specified above, we'll create a new container element anyways.
			'tagsToPreserve': ['span'],

			// element type that we will wrap around the selected content when
			// splitting text nodes or when we can't apply our class name to
			// an existing element
			'elementTagName': 'span',

			// CSS class name that will be applied to each element that is
			// highlighted
			'cssClass': PROSPECTIVE_SUBMISSION_CSS_CLASS,

			// callback function that will get executed for each HTML element
			// that is created. Will be passed a single parameter for the element
			// created.
			'onElementCreate': decorationCallback
		};

		return apiInternal.highlighters.add(identifier, highlightOptions);
	}

	// Executed for each element that is created during the decoration process
	function decorationCallback(element) {
		storeReferencesForBookends(element);
		addClickHandlers(element);
	}

	// Store references to the elements that are created, so that we can wrap the
	// elements in visual bookends (to mark the range). The elements that are created
	// each contain an identifier attribute to tell us which highlighter was used
	// to create the element.
	function storeReferencesForBookends(element) {
		var identifier = element.getAttribute(identifierAttributeName);
		if(identifier) {
			storeBookends(identifier, element);
		}
	}

	// Store references to the first and last HTML elements that are created. The
	// intent is that we'll use these references to place our bookend elements
	function storeBookends(identifier, mostRecentElement) {
		if(highlightBookends[identifier]) {
			highlightBookends[identifier].end = mostRecentElement;
		}
		else {
			highlightBookends[identifier] = {
				start: mostRecentElement,
				end: mostRecentElement
			};
		}
	}

	// Execute sendSubmission() when the provided element is clicked
	function addClickHandlers(element) {
		var identifier = element.getAttribute(identifierAttributeName);
		var highlighter = getHighlighterWithIdentifier(identifier);

		var callback = highlighter ? highlighter.sendSubmission : displayCallbackWarning;

		apiInternal.addListener(element, "touchstart", callback, highlighter);
		apiInternal.addListener(element, "click", callback, highlighter);
	}

	// Return the active highlighter associated with a particular identifier
	function getHighlighterWithIdentifier(identifier) {
		if(identifier) {
			for(var i = 0, len = activeHighlighters.length; i < len; i++) {
				var highlighter = activeHighlighters[i];
				if(highlighter.identifier+'' === identifier) {
					return highlighter;
				}
			}
		}
		return null;
	}

	function displayCallbackWarning() {
		apiInternal.warn("Unable to find the active highlighter and submission associated with this element");
	}
});
