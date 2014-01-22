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

	var identifierAttributeName = "data-identifier";
	var highlightBookends = {};

	apiInternal.submissions.interface = {};
	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	apiInternal.events.registerObserverForRemoveBetterlink(removeExistingDecorations);
	function initializeInterface() {
		if(apiInternal.submissions.interface.initialized) {
			return;
		}

		apiInternal.submissions.interface.initialized = true;

		insertProspectiveSubmissionStyle();
		insertBookendStyles();
		attachMouseupEvent(toggleDisplayOfProspectiveSubmissions);
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

	// Triggered on a mouseup event. If the user is finishing their click with part of
	// the document selected, then markup the document to identify the prospective
	// Betterlink submission. Also, remove any prior submission markups.
	function toggleDisplayOfProspectiveSubmissions() {
		if(!selectionIsEmpty()) { // only change if something else is being selected
			removeExistingDecorations();
			decorateProspectiveSubmission();
		}
	}

	// Remove any highlights that might already be on the page for previous selections
	function removeExistingDecorations() {
		apiInternal.util.forEach(activeHighlighters, function(highlighterName, index) {
			apiInternal.highlighters.removeAllHighlights(highlighterName);

			var highlighterId = /\|(.*)/.exec(highlighterName)[1];
			removeSelectionBookends(highlighterId)
		});
		activeHighlighters.length = 0;
	}

	// Highlight the current selection to indicate what would be saved if the selection
	// were submitted to create a new link. We append an identifier to the highlighter
	// name so that we can distinguish the multiple selections we'll end up creating.
	function decorateProspectiveSubmission() {
		var uniqueIdentifier = Math.floor(1E8 * Math.random());
		var highlighterName = HIGHLIGHTER_ID_PREFIX + "|" + uniqueIdentifier;
		var activeSelection = apiInternal.util.ranges.getCurrentSelection();

		activeHighlighters.push(highlighterName);
		var success = createProspectiveSubmissionHighlighter(highlighterName, uniqueIdentifier);

		if(success) {
			apiInternal.highlighters.highlightSelection(highlighterName, activeSelection);
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
	// the elements from the DOM, we don't need to 'unregister' them with Betterlink. If\
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

	// Submit the selection to the server
	function sendSubmission() {
		// displayLoadingMessage();
		apiInternal.events.fireNewSubmission(); // needs to pass the previous selection
		removeExistingDecorations();
	}

	function attachMousedownEvent(eventName) {
		apiInternal.addListener(document, "mousedown", eventName);
	}

	function attachMouseupEvent(eventName) {
		apiInternal.addListener(document, "mouseup", eventName);
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

			// Callback function that will get executed for each HTML element
			// that is created. Will be passed a single parameter for the element
			// created.
			'onElementCreate': decorationCallback
		};

		return apiInternal.highlighters.add(identifier, highlightOptions);
	}

	// Executed for each element that is created during the decoration process
	function decorationCallback(element) {
		var identifier = element.getAttribute(identifierAttributeName);
		if(identifier) {
			storeBookends(identifier, element);
		}

		apiInternal.addListener(element, "touchstart", sendSubmission);
		apiInternal.addListener(element, "click", sendSubmission);
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
});
