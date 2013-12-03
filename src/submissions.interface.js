/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.Interface", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Util.Ranges", "Event Messaging"] );

	var SELECTION_DIV_ID = "betterlink_selection";
	var SELECTION_DIV_CLASS = "betterlink_selection";
	var SUBMIT_BUTTON_TEXT = "Share Selection";

	var LOADING_MESSAGE = "Generating your link...";

	var SELECTION_CSS = ["{  margin: 2px;",
							"padding: 3px;",
							"width: auto;",
							"border: 1px solid black;",
							"border-radius: 1em;",
							"background-color: lightskyblue; }"].join(' ');

	var SELECTED_TEXT_CSS_CLASS = "betterlink-selected";
	var SELECTED_TEXT_CSS = "." + SELECTED_TEXT_CSS_CLASS + 
							 [" { background: #F0E68C;",			// background: khaki
								"color: #000080;",					// color: navy
								"text-decoration: underline; }"].join(' ') + 
							"a." + SELECTED_TEXT_CSS_CLASS + ":hover " +
							 ["{ background: #F0E68C;",
							 	"color: #000080;",
							 	"text-decoration: underline; }"].join(' ') +
							"a." + SELECTED_TEXT_CSS_CLASS + ":link " +
							 ["{ background: #F0E68C;",
							 	"color: #000080;",
							 	"text-decoration: underline; }"].join(' ');

	var selectionDiv;
	var selectionDivSubmissionButton;
	var urlDiv;
	var previousMousePosition; // set on each mousedown event
	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	function initializeInterface() {
		if(apiInternal.interfaceInitialized) {
			return;
		}

		apiInternal.interfaceInitialized = true;

		selectionDiv = buildSelectionDiv();
		insertHighlightStyle();
		attachMousedownEvent(function(e) { previousMousePosition = captureMousePosition(e); });
		attachMouseupEvent(togglePositionAndDisplayOfSelectionDiv);
		// TODO: Support keydown / keyup events for accessibility (when starting a selection)
		// TODO: Handle when keydown event changes the selection (e.g., tabbing away from focus)

		apiInternal.events.registerObserverForSubmissionDisplay(displaySubmissionResult);
	}

	function buildSelectionDiv() {
		insertSelectionDivStyle();

		var selectionDiv = document.createElement("div");
		selectionDiv.id = SELECTION_DIV_ID;
		selectionDiv.className = SELECTION_DIV_CLASS;
		selectionDiv.style.position = "absolute";
		hideSelectionDiv(selectionDiv);

		var submitButton = document.createElement("input");
		submitButton.type = "button";
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
		apiInternal.util.dom.addCssByClass(SELECTION_DIV_CLASS, SELECTION_CSS, "div");
	}

	function insertHighlightStyle() {
		apiInternal.util.dom.createAndAppendStyleElement(SELECTED_TEXT_CSS);
	}

	function sendSubmission() {
		displayLoadingMessage();
		apiInternal.events.fireNewSubmission();
	}

	// Expects an object { success: true, message: "my message here", selection: custom_obj }
	function displaySubmissionResult(result) {
		if(result['success']) {
			var newUrl = result['message'];
			console.log(newUrl);
			
			var highlighterIdentifier = 'newSubmission';
			createHighlighter(highlighterIdentifier, newUrl);
			apiInternal.highlighters.highlightSelection(highlighterIdentifier, result['selection']);
			apiInternal.util.ranges.removeCurrentSelection();

			apiInternal.util.dom.addOrReplaceChild(selectionDiv, selectionDivSubmissionButton);
		}
		else {
			var message = result['message'];
			
			console.log(message);
			// Display message for why the submission could not be completed
			// Occurs if the server returns an error on submission, or the server
			// response is invalid
			// example message:
			// "There was a problem building your share link"
		}
	}

	function displayLoadingMessage() {
		var span = document.createElement("span");
		span.appendChild(document.createTextNode(LOADING_MESSAGE));
		apiInternal.util.dom.addOrReplaceChild(selectionDiv, span);
	}

	function createHighlighter(identifier, url) {
		var highlightOptions = {

			// any element that's highlighted should have the following properties
			'elementProperties': {
				'href': url,
				'title': 'Your custom link'
			},

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
			'cssClass': SELECTED_TEXT_CSS_CLASS
		};

		apiInternal.highlighters.add(identifier, highlightOptions);
	}
});
