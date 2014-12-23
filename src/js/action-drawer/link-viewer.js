/**
 * Defines a DOM element that will display the result of the most
 * recent Betterlink submission.
 *
 */
betterlink_user_interface.createModule("Link Viewer", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Util.Ranges", "LastSubmission"] );

	var LAST_VIEWER_CLASS = 'betterlink-link-display';
	var LAST_LINK_CLASS = 'betterlink-last-link';
	var LAST_TEXT_CLASS = 'betterlink-last-link-text';

	var NO_LINK = "betterlink-no-link";
	var SUCCESS = "betterlink-link-success";
	var ERROR = "betterlink-link-error";
	var ELLIPSIS = "betterlink-ellipsis";

	var LINK_DISPLAYER_CSS = 
		[   "." + LAST_VIEWER_CLASS + " { width: auto; }",
			"." + LAST_LINK_CLASS + " { font-size: 13px; }",
			"." + LAST_TEXT_CLASS + " { color: #333; font-style: italic; font-size: 70%; }",
			"." + NO_LINK + " { font-style: italic; width: auto; }",
			"." + ELLIPSIS + " { width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; -o-text-overflow: ellipsis; }"].join(' ');

	var linkViewer;
	var lastLinkElement;
	var lastTextElement;

	var stylesInitialized = false;

	apiInternal.linkViewer = {
		create: initializeLinkViewer,
		selectLastLink: selectLastLink
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
			selectTextOnClick(lastLinkElement);

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
		lastTextElement.className = "betterlink-reset " + LAST_TEXT_CLASS + " " + ELLIPSIS;

		lastLinkElement = document.createElement('div');
		lastLinkElement.className = "betterlink-reset " + LAST_LINK_CLASS + " " + NO_LINK;
		lastLinkElement.appendChild(document.createTextNode('no recent submissions'));

		linkViewer.appendChild(lastTextElement);
		linkViewer.appendChild(lastLinkElement);
	}

	function displaySubmissionError() {
		var lastSub = apiInternal.lastSubmission.last;
		var message = lastSub.message;

		apiInternal.util.dom.removeClassFromElement(linkViewer, SUCCESS);
		apiInternal.util.dom.applyClassToElement(linkViewer, ERROR);
		apiInternal.util.dom.removeClassFromElement(lastLinkElement, ELLIPSIS);
		apiInternal.util.dom.applyClassToElement(lastLinkElement, NO_LINK);

		apiInternal.util.dom.addOrReplaceChild(lastLinkElement, document.createTextNode(message));
		apiInternal.util.dom.removeAllChildren(lastTextElement);
	}

	function displaySubmissionResult() {
		var lastSub = apiInternal.lastSubmission.last;
		var link = lastSub.link;
		var selectedText = lastSub.text;

		apiInternal.util.dom.removeClassFromElement(lastLinkElement, NO_LINK);
		apiInternal.util.dom.applyClassToElement(lastLinkElement, ELLIPSIS);
		apiInternal.util.dom.removeClassFromElement(linkViewer, ERROR);
		apiInternal.util.dom.applyClassToElement(linkViewer, SUCCESS);

		apiInternal.util.dom.addOrReplaceChild(lastLinkElement, document.createTextNode(link));
		if(selectedText) {
			selectedText = '"' + collapseWhitespace(selectedText) + '"';
			apiInternal.util.dom.addOrReplaceChild(lastTextElement, document.createTextNode(selectedText));
		}
	}

	// When the user selects the area where the last link is displayed, select
	// the text content
	function selectTextOnClick(element) {
		apiInternal.addListener(element, 'click', _selectText);

		function _selectText(e) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

			selectLastLink();
		}
	}

	function selectLastLink() {
		apiInternal.util.ranges.selectNodeContents(lastLinkElement);
	}

	function collapseWhitespace(text) {
		return text.replace(/\s+/g,' ');
	}
});
