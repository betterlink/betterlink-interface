/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.CreationInterface", function(api, apiInternal) {
	api.requireModules( ["Multiclick", "Util", "Util.DOM", "Util.Ranges", "Submissions", "Selection Highlighter", "Event Messaging"] );

	var supportsCssInherit = supportsCssInherit(document);

	var HIGHLIGHTER_ID_PREFIX = "prospectiveSubmission";

	var PROSPECTIVE_SUBMISSION_CSS_CLASS = "betterlink-prospective-submission";
	var PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS = "betterlink-prospective-hover";
	var PROSPECTIVE_SUBMISSION_HOVER_CSS =
							[" { background: #DADADA;",
								"color: #222;",
								"text-decoration: underline;",
								"cursor: pointer; }"].join(' ');

	var activeHighlighters = [];
	var submittedHighlighters = [];

	var identifierAttributeName = "data-identifier";

	apiInternal.submissions.creationInterface = {
		cleanupSubmittedHighlighters: cleanupSubmittedHighlighters
	};
	/****************************************************************************************************/

	// Test if the browser supports the 'inherit' CSS value by creating a
	// child and parent element with the display attribute (not inherited)
	function supportsCssInherit(doc) {
		var parent = doc.createElement('div');
		var child = doc.createElement('p');
		try {
			parent.style.display = 'none';
			child.style.display = 'inherit';
		}
		catch (e) {
			return false;
		}

		parent.appendChild(child);
		var body = doc.body || doc.getElementsByTagName('body')[0];
		body.appendChild(parent);

		var display = child.style.display;
		var supported = display === 'inherit' || display === 'none';
		body.removeChild(parent);

		return supported;
	}

	apiInternal.addInitListener(initializeInterface);
	apiInternal.events.registerObserverForRemoveBetterlink(removeExistingHighlighters);
	function initializeInterface() {
		if(apiInternal.submissions.creationInterface.initialized) {
			return;
		}

		apiInternal.submissions.creationInterface.initialized = true;

		insertProspectiveSubmissionStyle();
		insertDocumentListeners();
	}

	// The 'prospective submission' style is used to markup a selection that could
	// be submitted to Betterlink as a new link.
	function insertProspectiveSubmissionStyle() {
		apiInternal.util.dom.addCssByClass(PROSPECTIVE_SUBMISSION_HOVER_CSS_CLASS, PROSPECTIVE_SUBMISSION_HOVER_CSS);
	}

	// When the user finishes a click (on mouseup), toggle the display of prospective
	// submissions. Remove previously highlighted sections and mark the new selection.
	function insertDocumentListeners() {
		// Because we are highlighting the prospective submission and turning the result
		// into a click-handler, a triple-click (selecting a full paragraph of text) will
		// end up executing the result of a double-click (selecting a word of text).
		//
		// Instead, we use the multiclick handler to reconcile multiple mouse events.

		apiInternal.multiclick.insertDocumentListeners(toggleDisplayOfProspectiveSubmissions);
	}

	// ****** Highlighter Proxy Object ******
	function HighlighterProxy(highlighterName, identifier) {
		var highlighter = this;
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

		// Submit the prospective submission to the server to create a new link.
		// Clean up the interface in preparation for displaying the result of
		// the submission.
		sendSubmission: function() {
			this.removeExistingDecorations();
			apiInternal.events.fireNewSubmission(this.lastActiveRanges);
			submittedHighlighters.push(this);
		},

		// Remove any highlights from the document associated with this highlighter.
		removeExistingDecorations: function() {
			var rangesToRemove = this.lastActiveRanges;

			if(rangesToRemove) {
				removeAddedAttributesOnHighlightElements();
				var undoneRanges = this.removeHighlightFromRanges(rangesToRemove);
				this.storeLastRanges(undoneRanges, 'afterUndo');
			}
		},

		// Fully remove any traces of this highlighter from the document
		nuclearRemoveFromDocument: function() {
			removeAddedAttributesOnHighlightElements();
			this.removeAllHighlights();
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

	// Remove any CSS classes or additional attributes that have been added ontop of
	// our prospective submission elements. These additional classes will cause the
	// wrapper elements to remain on the page when the highlgihter is removed.
	function removeAddedAttributesOnHighlightElements() {
		// NOTE: An alternative possibility is that when applying the highlighter, we
		// added our custom class ontop of an existing HTML element (assuming it had
		// all of the necessary elementProperties and elementAttributes). In this case,
		// it is correct for the base element to NOT be removed. So we specifically
		// want to remove any classes or attributes that we added to the elements that
		// weren't there previously.
		//
		// Removing the hover CSS is required in the situation where a new prospective
		// submission is being decorated which intersects an existing prospective
		// submission. In that instance, the user's mouse will be ontop of the existing
		// highlight, applying the hover class (and preventing the highlighter from
		// completely being removed).

		removeHoverCss();
	}

	// Highlight the current selection to indicate what would be saved if the selection
	// were submitted to create a new link. We append an identifier to the highlighter
	// name so that we can distinguish the multiple selections we'll end up creating.
	function decorateProspectiveSubmission() {
		var uniqueIdentifier = Math.floor(1E8 * Math.random()).toString(10);
		var highlighterName = HIGHLIGHTER_ID_PREFIX + "|" + uniqueIdentifier;

		var success = createProspectiveSubmissionHighlighter(highlighterName, uniqueIdentifier);

		if(success) {
			var highlighter = new HighlighterProxy(highlighterName, uniqueIdentifier);
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
				if(highlighter.identifier === identifier) {
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
