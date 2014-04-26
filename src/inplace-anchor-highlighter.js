/**
 * Apply an in-place highlight that always covers the most-recently
 * selected text. Use <a>s to surround the highlighted elements. This
 * would be idiomatic because the elements are clickable (leveraging
 * native support for screen readers). Additionally, this allows us
 * to rely on native support for draggable elements. By default, links
 * are draggable (although HTML5 provides the ability to add draggable
 * support to arbitrary elements).
 *
 * Apply event handlers on the highlighted elements so that they
 * trigger a submission on 'click'.
 *
 */
betterlink_user_interface.createModule("Anchor Highlighter", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Multiclick", "Selection Toggle", "Selection Highlighter", "Highlighter Proxy", "Event Messaging"] );

	var PROSPECTIVE_SUBMISSION_CSS_CLASS = "betterlink-prospective-submission";
	var PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS = "betterlink-prospective-hover";
	var PROSPECTIVE_SUBMISSION_HOVER_CSS =
							"." + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS + 
							[" { background: #DADADA;",
								"color: #222;",
								"text-decoration: underline; }"].join(' ') +
							"a." + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS + ":link " +
							[" { background: #DADADA;",
								"color: #222;",
								"text-decoration: underline; }"].join(' ') +
							"a." + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS + ":hover " +
							[" { background: #DADADA;",
								"color: #222;",
								"text-decoration: underline; }"].join(' ') +
							"a." + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS + ":active " +
							[" { background: #DADADA;",
								"color: #222;",
								"text-decoration: underline; }"].join(' ');

	var submittedHighlighters = [];

	var identifierAttributeName = "data-identifier";

	apiInternal.anchorHighlighter = {
		initialize: initializeInterface,
		cleanupSubmittedHighlighters: cleanupSubmittedHighlighters
	};

	/****************************************************************************************************/

	function initializeInterface() {
		insertProspectiveSubmissionStyle();
		insertDocumentListeners();
	}

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

	// The 'prospective submission' style is used to markup a selection that could
	// be submitted to Betterlink as a new link.
	function insertProspectiveSubmissionStyle() {
		apiInternal.util.dom.createAndAppendStyleElement(PROSPECTIVE_SUBMISSION_HOVER_CSS);
	}

	// When the user finishes a click (on mouseup), toggle the display of prospective
	// submissions. Remove previously highlighted sections and mark the new selection.
	function insertDocumentListeners() {
		// Because we are highlighting the prospective submission and turning the result
		// into a click-handler, a triple-click (selecting a full paragraph of text) will
		// end up executing the result of a double-click (selecting a word of text).
		//
		// Instead, we use the multiclick handler to reconcile multiple mouse events.

		initializeSelectionToggle();
		apiInternal.multiclick.insertDocumentListeners(apiInternal.selectionToggle.toggleDisplay);
	}

	function initializeSelectionToggle() {
		apiInternal.selectionToggle.initialize(createProspectiveSubmissionHighlighter, removeAddedAttributesOnHighlightElements);
	}

	// By extending the HighlighterProxy Prototype (instead of creating a separate
	// function), we save ourselves from creating an anonymous function every time
	// we attach the sendSubmission() function as a callback to our links. That's
	// because we'd have to pass the provided highlighter into the function as a
	// parameter.
	apiInternal.util.extend(apiInternal.HighlighterProxyPrototype, {

		// Submit the prospective submission to the server to create a new link.
		// Clean up the interface in preparation for displaying the result of
		// the submission.
		sendSubmission: function(e) {
			e.preventDefault ? e.preventDefault() : event.returnValue = false;

			this.removeExistingDecorations();
			apiInternal.events.fireNewSubmission(this.lastActiveRanges);
			submittedHighlighters.push(this);
		}
	});

	// Passed into the HighlighterProxy constructor
	function removeAddedAttributesOnHighlightElements() {
		// Removing the hover CSS is required in the situation where a new prospective
		// submission is being decorated which intersects an existing prospective
		// submission. In that instance, the user's mouse will be ontop of the existing
		// highlight, applying the hover class (and preventing the highlighter from
		// completely being removed).

		removeHoverCss();
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
				'href': '#',
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
			'tagsToPreserve': ['a'],

			// element type that we will wrap around the selected content when
			// splitting text nodes or when we can't apply our class name to
			// an existing element
			'elementTagName': 'a',

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
		addHoverClickHandlers(element);
		addSubmissionClickHandlers(element);
	}

	// Alert all 'prospective submission' elements that one of the elements is
	// being hovered over.
	function addHoverClickHandlers(element) {
		apiInternal.addListener(element, "mouseover", applyHoverCss);
		apiInternal.addListener(element, "mouseout", removeHoverCss);
	}

	// Add Hover CSS to all elements on the DOM that are part of a prospective submission
	function applyHoverCss() {
		var hasHoverClass = new RegExp('\\b' + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS + '\\b');

		var nodes = apiInternal.util.dom.getElementsByClassName(PROSPECTIVE_SUBMISSION_CSS_CLASS);
		for(var i = 0, len = nodes.length; i < len; i++) {
			var node = nodes[i];
			if(!hasHoverClass.test(node.className)) {
				node.className = node.className + ' ' + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS;
			}
		}
	}

	// Remove the Hover CSS from all elements on the DOM that are part of a prospective submission
	function removeHoverCss() {
		var hasHoverClass = new RegExp('\\s*' + PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS + '\\b');

		var nodes = apiInternal.util.dom.getElementsByClassName(PROSPECTIVE_SUBMISSION_CSS_CLASS);
		for(var i = 0, len = nodes.length; i < len; i++) {
			var node = nodes[i];
			node.className = node.className.replace(hasHoverClass, '');
		}
	}

	// Execute sendSubmission() when the provided element is clicked
	function addSubmissionClickHandlers(element) {
		var identifier = element.getAttribute(identifierAttributeName);
		var highlighter = apiInternal.selectionToggle.getHighlighterWithIdentifier(identifier);

		var callback = highlighter ? highlighter.sendSubmission : displayCallbackWarning;

		apiInternal.addListener(element, "touchstart", callback, highlighter);
		apiInternal.addListener(element, "click", callback, highlighter);
	}

	function displayCallbackWarning() {
		apiInternal.warn("Unable to find the active highlighter and submission associated with this element");
	}
});