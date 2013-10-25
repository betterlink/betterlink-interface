/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.Interface", function(api, apiInternal, module) {
	api.requireModules( ["Util.DOM", "Util.Ranges", "Event Messaging"] );

	var SELECTION_DIV_ID = "betterlink_selection";
	var SELECTION_DIV_CLASS = "betterlink_selection";
	var SUBMIT_BUTTON_TEXT = "Share Selection";

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

	// via http://css-tricks.com/snippets/css/fixed-footer/
	// Creates a 'sticky' footer at the bottom of the visible window.
	//
	// This is not a maintainable solution because I can't add a footer
	// to pages that *already* have a persistent footer.
	var URL_DIV_ID = "betterlink_url";
	var RESPONSE_TEXT = "Your personal link: ";
	var LOADING_MESSAGE = "Generating your link...";
	var URL_CSS_TEXT = "#" + URL_DIV_ID +
						 ["{ margin:0;",
							"padding:0;",
							"border:0;",
							"border-radius:0;",
							"position:fixed;",
							"left:0px;",
							"bottom:0px;",
							"height:30px;",
							"width:auto;",
							"background:lightslategray;",
							"color:whitesmoke; }"].join(' ') + 
						"\n#" + URL_DIV_ID + " span" +
						 ["{ padding:10px;",
							"line-height:2; }"].join(' ') +
						"\n#" + URL_DIV_ID + " a" +
						 ["{ color:whitesmoke;",
							"text-decoration:underline; }"].join(' ') +
						"\n/* IE 6 */\n" +
						"* html #" + URL_DIV_ID +
						 ["{ position:absolute;",
							"top:expression((0-(footer.offsetHeight)+(document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight)+(ignoreMe = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop))+'px');"
							].join(' ');

	var selectionDiv;
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
		//urlDiv = buildUrlDiv();
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
		document.body.appendChild(selectionDiv);
		return selectionDiv;
	}

	function buildUrlDiv() {
		insertFooterStyle();

		var urlDiv = document.createElement("div");
		urlDiv.id = URL_DIV_ID;
		urlDiv.style.display = "none";

		document.body.appendChild(urlDiv);
		return urlDiv;
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

	function insertFooterStyle() {
		apiInternal.util.dom.createAndAppendStyleElement(URL_CSS_TEXT);
	}

	function sendSubmission() {
		displayLoadingMessage();
		apiInternal.events.fireNewSubmission();
	}

	// Expects an object { success: true, message: "my message here" }
	function displaySubmissionResult(result) {
		if(result['success']) {
			var newUrl = result['message'];
			console.log(newUrl);
			
			if(urlDiv) {
				var span = document.createElement("span");
				var anchor_element = apiInternal.util.dom.createAnchorElement(newUrl, newUrl, "_blank");
				
				span.appendChild(document.createTextNode(RESPONSE_TEXT));
				span.appendChild(anchor_element);
				apiInternal.util.dom.addOrReplaceChild(urlDiv, span);

				urlDiv.style.display = "";
			}
			else {
				var highlighterIdentifier = 'newSubmission';
				createHighlighter(highlighterIdentifier, newUrl);
				apiInternal.highlighters.highlightSelection(highlighterIdentifier, result['selection']);
			}
		}
		else {
			var message = result['message'];
			
			console.log(message);
			if(urlDiv) {
				var span = document.createElement("span");
				span.appendChild(document.createTextNode(message));
				apiInternal.util.dom.addOrReplaceChild(urlDiv, span);
				
				urlDiv.style.display = "";
			}
		}
	}

	function displayLoadingMessage() {
		if(urlDiv) {
			var span = document.createElement("span");
			span.appendChild(document.createTextNode(LOADING_MESSAGE));
			apiInternal.util.dom.addOrReplaceChild(urlDiv, span);

			urlDiv.style.display = "";
		}
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
