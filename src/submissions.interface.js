/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.CreationInterface", function(api, apiInternal) {
	api.requireModules( ["Submissions", "Span Highlighter", "Anchor Highlighter", "Draggable"] );

	var supportsCssInherit = canUseCssInherit(document);
	var elementHighlighter;

	apiInternal.submissions.creationInterface = {};

	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	function initializeInterface() {
		if(apiInternal.submissions.creationInterface.initialized) {
			return;
		}

		apiInternal.submissions.creationInterface.initialized = true;
		initializeHighlighters();
	}

	function initializeHighlighters() {
		// Functionally, IE 7 & 6 get the spanHighlighter.
		if(supportsCssInherit && "%%build:highlighter_override%%" !== "true") {
			elementHighlighter = apiInternal.anchorHighlighter;
			// Set events that should occur for each element that gets created
			// as part of the highlight process
			elementHighlighter.decorationCallback = function(element) {
				addSubmissionClickHandlers(element);
				addDragHandlers(element);
			};
			// Set events that should happen for all highlighted elements as
			// they are about to be removed
			elementHighlighter.decorationRemovalCallback = function(elements) {
				subscribeDragHandlerRemoval(elements);
			};
		}
		else {
			elementHighlighter = apiInternal.spanHighlighter;
			elementHighlighter.decorationCallback = function(element) {
				addSubmissionClickHandlers(element);
			};
		}

		apiInternal.submissions.creationInterface.cleanupSubmittedHighlighters = elementHighlighter.cleanupSubmittedHighlighters;
		elementHighlighter.initialize();
	}

	// Execute sendSubmission() when the provided element is clicked
	function addSubmissionClickHandlers(element) {
		var highlighter = elementHighlighter.getHighlighterForElement(element);
		var callback = highlighter ? highlighter.sendSubmission : displayCallbackWarning;

		apiInternal.addListener(element, "touchstart", callback, highlighter);
		apiInternal.addListener(element, "click", callback, highlighter);
	}

	// When each highlighted element is created, markup the element with event
	// listeners to handle Drag events
	function addDragHandlers(element) {
		apiInternal.draggable.addDragHandlers(element);
	}

	// When our highlight elements are going to be removed, ensure that the drag
	// handlers are removed first as well. Specifically, ensure that any added
	// classnames to our elements are removed first.
	function subscribeDragHandlerRemoval(elements) {
		apiInternal.draggable.remove(elements);
	}

	// Test if the browser supports the 'inherit' CSS value by creating a
	// child and parent element with the display attribute (not inherited)
	function canUseCssInherit(doc) {
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

	function displayCallbackWarning() {
		apiInternal.warn("Unable to find the active highlighter and submission associated with this element");
	}
});
