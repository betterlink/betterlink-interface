/**
 * Defines a DOM element that will display the result of the most
 * recent Betterlink submission.
 *
 */
betterlink_user_interface.createModule("Link Viewer", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "LastSubmission"] );

	var LAST_VIEWER_CLASS = 'betterlink-link-display';
	var LAST_TEXT_CLASS = 'betterlink-last-link-text';
	var LAST_ERROR_CLASS = 'betterlink-last-error';

	var SUCCESS = "betterlink-link-success";
	var ERROR = "betterlink-link-error";
	var ELLIPSIS = "betterlink-ellipsis";
	// For multiline ellipsis: http://codepen.io/romanrudenko/pen/ymHFh
	// via http://www.mobify.com/blog/multiline-ellipsis-in-pure-css/
	// Will need to address gradiant (and image) for a different background color
	// (especially for changing background colors for errors, etc.)

	var LINK_DISPLAYER_CSS = 
		[   "." + LAST_VIEWER_CLASS + " { width: auto; }",
			"." + LAST_TEXT_CLASS + " { color: #333; font-style: italic; font-size: 70%; }",
			"." + LAST_ERROR_CLASS + " { font-size: 13px; margin-top: 10px; width: auto; }",
			"." + ELLIPSIS + " { width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; -o-text-overflow: ellipsis; }"].join(' ');

	var linkViewer;
	var lastErrorElement;
	var lastTextElement;

	var stylesInitialized = false;

	apiInternal.linkViewer = {
		create: initializeLinkViewer,
	};
	/****************************************************************************************************/

	function initializeLinkViewer() {
		if(!stylesInitialized) {
			insertStyles();
		}

		// Currently only a single instance of Link Viewer is supported. In order
		// to support multiple Link Viewers, we would need to change the way we
		// reference the element divs when making updates.
		if(!apiInternal.linkViewer.initialized) {
			apiInternal.linkViewer.initialized = true;

			createLinkViewer();

			apiInternal.lastSubmission.subscribeAll.onsuccess(displaySubmissionResult);
			apiInternal.lastSubmission.subscribeAll.onfailed(displaySubmissionError);
		}

		return linkViewer;
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(LINK_DISPLAYER_CSS);
	}

	// Create the HTML elements that will serve to display the user's last link
	function createLinkViewer() {
		linkViewer = document.createElement('div');
		linkViewer.className = "betterlink-reset " + LAST_VIEWER_CLASS;

		lastTextElement = document.createElement('div');
		lastTextElement.className = "betterlink-reset " + LAST_TEXT_CLASS + " " + ELLIPSIS
		lastTextElement.appendChild(document.createTextNode('no recent submissions'));

		lastErrorElement = document.createElement('div');
		lastErrorElement.className = "betterlink-reset " + LAST_ERROR_CLASS;

		linkViewer.appendChild(lastTextElement);
		linkViewer.appendChild(lastErrorElement);
	}

	function displaySubmissionError() {
		var lastSub = apiInternal.lastSubmission.last;
		var message = lastSub.message;
		var selectedText = lastSub.text;

		apiInternal.util.dom.removeClassFromElement(linkViewer, SUCCESS);
		apiInternal.util.dom.applyClassToElement(linkViewer, ERROR);

		apiInternal.util.dom.addOrReplaceChild(lastErrorElement, document.createTextNode(message));
		if(selectedText) {
			selectedText = '"' + collapseWhitespace(selectedText) + '"';
			apiInternal.util.dom.addOrReplaceChild(lastTextElement, document.createTextNode(selectedText));
		}
	}

	function displaySubmissionResult() {
		var lastSub = apiInternal.lastSubmission.last;
		var selectedText = lastSub.text;

		apiInternal.util.dom.removeClassFromElement(linkViewer, ERROR);
		apiInternal.util.dom.applyClassToElement(linkViewer, SUCCESS);

		apiInternal.util.dom.removeAllChildren(lastErrorElement);
		if(selectedText) {
			selectedText = '"' + collapseWhitespace(selectedText) + '"';
			apiInternal.util.dom.addOrReplaceChild(lastTextElement, document.createTextNode(selectedText));
		}
	}

	function collapseWhitespace(text) {
		return text.replace(/\s+/g,' ');
	}
});
