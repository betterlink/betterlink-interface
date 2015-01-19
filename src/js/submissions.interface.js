/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.CreationInterface", function(api, apiInternal) {
	api.requireModules( ["Submissions", "Span Highlighter", "Anchor Highlighter", "Draggable", "Action Drawer"] );

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
		initializeActionDrawer();
	}

	function initializeHighlighters() {
		// Functionally, IE 7 & 6 get the spanHighlighter.
		if(supportsCssInherit && "%%build:highlighter_override%%" !== "true") {
			elementHighlighter = apiInternal.anchorHighlighter;
			// Set events that should occur for each element that gets created
			// as part of the highlight process
			elementHighlighter.decorationCallback = function(element) {
				suppressClickHandlers(element);
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

	function initializeActionDrawer() {
		if(supportsCssInherit && "%%build:highlighter_override%%" !== "true") {
			apiInternal.drawer.create(submitSelectionFromElement);
		}
	}

	// Execute sendSubmission() when the provided element is clicked
	function addSubmissionClickHandlers(element) {
		// NOTE: We could alternatively try finding the associated element at time
		// of creation, storing it, then simply executing sendSubmission() at time
		// of click. Instead, we'll do everything at time of click.
		// There are two benefits to deferring the search until the point of click:
		//  1. It allows us to only write the submitSelectionFromElement() function
		//     once and send to any necessary clients. Otherwise, we would need a
		//     duplicate version that only sends the sendSubmission() into the event
		//     callback.
		//  2. It actually defers the longer work to a point when the user is more
		//     willing to wait. By searching at element creation, we're doing the
		//     hard work *every* time we create an element -- even if we don't end
		//     up submitting it. It also happens while the user is interacting with
		//     the page. If we wait, the user is expecting the system to wait and
		//     process.
		apiInternal.addListener(element, "touchstart", triggerSubmitSelection, element);
		apiInternal.addListener(element, "click", triggerSubmitSelection, element);
	}

	function suppressClickHandlers(element) {
		apiInternal.addListener(element, "touchstart", preventClick);
		apiInternal.addListener(element, "click", preventClick);
	}

	// Executed as a callback on a click event
	function preventClick(e) {
		e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
	}

	// Executed as a callback on a click event
	function triggerSubmitSelection(e) {
		e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

		var element = e.currentTarget || this;
		submitSelectionFromElement(element);
	}

	// When provided with an HTML element, find an associated Highlighter and
	// submit its most recent selection
	function submitSelectionFromElement(element) {
		var highlighter = elementHighlighter.getHighlighterForElement(element);
		if(highlighter) {
			highlighter.sendSubmission();
		}
		else {
			displayHighlighterNotFound();
		}
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
		apiInternal.draggable.fireRemainingDragEvents(elements);
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

	function displayHighlighterNotFound() {
		apiInternal.warn("Unable to find the active highlighter and submission associated with this element");
	}
});
