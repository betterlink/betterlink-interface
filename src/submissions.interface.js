/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.Interface", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Util.Ranges", "Submissions", "Event Messaging"] );

	var SELECTION_DIV_ID = "betterlink_selection";
	var SUBMIT_BUTTON_ID = "betterlink_selection_button";
	var SUBMIT_BUTTON_TEXT = "Share Selection";

	var LOADING_MESSAGE = "Generating your link...";

	var SELECTION_CSS = ["{  margin: 2px;",
							"padding: 3px;",
							"width: auto;",
							"border: 1px solid black;",
							"border-radius: 1em;",
							"background-color: lightskyblue; }"].join(' ');

	var SUBMIT_BUTTON_CSS = ["{  color: #333;",
								"font-size: 14px;",
								"font-weight: bold;",
								"font-family: Arial, Helvetica, sans-serif;",
								"line-height: initial;",
								"margin: 2px;",
								"padding: 2px 6px;",
								"text-shadow: none;",
								"box-shadow: none;",
								"border: 2px outset buttonface;",
								"border-radius: initial;",
								"background: buttonface; }"].join(' ');

	var selectionDiv;
	var selectionDivSubmissionButton;
	var urlDiv;
	var previousMousePosition; // set on each mousedown event
	apiInternal.submissions.interface = {
		updateSubmissionDiv: updateSubmissionDiv,
		resetSubmissionDiv: resetSubmissionDiv
	};
	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	function initializeInterface() {
		if(apiInternal.submissions.interface.initialized) {
			return;
		}

		apiInternal.submissions.interface.initialized = true;

		selectionDiv = buildSelectionDiv();
		attachMousedownEvent(function(e) { previousMousePosition = captureMousePosition(e); });
		attachMouseupEvent(togglePositionAndDisplayOfSelectionDiv);
		// TODO: Support keydown / keyup events for accessibility (when starting a selection)
		// TODO: Handle when keydown event changes the selection (e.g., tabbing away from focus)
	}

	function buildSelectionDiv() {
		insertSelectionDivStyle();

		var selectionDiv = document.createElement("div");
		selectionDiv.id = SELECTION_DIV_ID;
		selectionDiv.style.position = "absolute";
		hideSelectionDiv(selectionDiv);

		var submitButton = document.createElement("input");
		submitButton.type = "button";
		submitButton.id = SUBMIT_BUTTON_ID;
		submitButton.value = SUBMIT_BUTTON_TEXT;
		apiInternal.addListener(submitButton, "touchstart", sendSubmission);
		apiInternal.addListener(submitButton, "click", sendSubmission);

		selectionDiv.appendChild(submitButton);
		selectionDivSubmissionButton = submitButton;
		apiInternal.util.dom.registerAndAppend(document.body, selectionDiv);
		return selectionDiv;
	}

	function attachMousedownEvent(eventName) {
		apiInternal.addListener(document, "mousedown", eventName);
	}

	function attachMouseupEvent(eventName) {
		apiInternal.addListener(document, "mouseup", eventName);
	}

	function togglePositionAndDisplayOfSelectionDiv(e) {
		// BUG: If I click ontop of already-selected text, the selection disappears,
		//      but the button still remains visible
		// TODO: Don't do anything if the mouse is ontop of the <div>
		if(selectionIsNotEmpty()) {
			var mousePosition = captureMousePosition(e);
			var movingDown = (mousePosition.Y - previousMousePosition.Y) >= 0;
			
			var divPosition = getSelectionDivPosition(mousePosition, movingDown);
			showSelectionDiv(selectionDiv, divPosition);
		}
		else {
			hideSelectionDiv(selectionDiv);
		}
	}

	// return the mouse position in relation to the absolute layout
	function captureMousePosition(e) {
		// reference on viewports:
		// http://www.quirksmode.org/mobile/viewports2.html

		// Cross-Compatibility for IE
		var scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
		var scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

		/**
		 * re:Mobile:
		 * clientX/Y - coordinates relative to the visual viewport (what's displayed)
		 * pageX/Y - coordinates relative to the layout viewport (what's rendered)
		 * The difference is based on how zoomed in you are and where you've scrolled to.
		 * 
		 * Note: IE8< doesn't support pageX/Y
		 */
		return { X: e.clientX + scrollX, Y: e.clientY + scrollY };
	}

	// Update the position of the div to generally get out of the way of whatever
	// content is selected. We approximate this by checking which direction the user
	// was selecting content.
	function getSelectionDivPosition(mousePosition, movingDown) {
		var yOffset, xOffset;
		var pixelBuffer = 5;
		if(movingDown) {
			yOffset = pixelBuffer;
			xOffset = pixelBuffer;
		}
		else {
			yOffset = -1 * (selectionDiv.offsetHeight + pixelBuffer);
			xOffset = -1 * (selectionDiv.offsetWidth + pixelBuffer);
		}
		
		return { X: mousePosition.X + xOffset, Y: mousePosition.Y + yOffset };
	}

	function showSelectionDiv(div, divPosition) {
		div.style.display = "";
		div.style.left = divPosition.X + "px";
		div.style.top = divPosition.Y + "px";
	}

	function hideSelectionDiv(div) {
		div.style.display = "none";
		div.style.left = "-999em";
	}

	function selectionIsNotEmpty() {
		return !apiInternal.util.ranges.currentSelectionIsEmpty();
	}

	function insertSelectionDivStyle() {
		apiInternal.util.dom.addCssById(SELECTION_DIV_ID, SELECTION_CSS);
		apiInternal.util.dom.addCssById(SUBMIT_BUTTON_ID, SUBMIT_BUTTON_CSS);
	}

	function sendSubmission() {
		displayLoadingMessage();
		apiInternal.events.fireNewSubmission();
	}

	function displayLoadingMessage() {
		var span = document.createElement("span");
		span.appendChild(document.createTextNode(LOADING_MESSAGE));
		updateSubmissionDiv(span);
	}

	// Update the 'selectionDiv' to contain the provided element
	// Will replace any existing elements contained within the div
	function updateSubmissionDiv(newElement) {
		apiInternal.util.dom.addOrReplaceChild(selectionDiv, newElement);
	}

	// Reset the 'selectionDiv' to contain its original elements
	function resetSubmissionDiv() {
		updateSubmissionDiv(selectionDivSubmissionButton);
	}
});
