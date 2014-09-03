/**
 * Defines a DOM element that will display the result of the most
 * recent Betterlink submission.
 *
 */
betterlink_user_interface.createModule("Link Viewer", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Util.Ranges", "LastSubmission", "Drawer Dropzone"] );

	var LINK_VIEWER_ID = 'betterlink-link-display';
	var LAST_LINK_ID = 'betterlink-last-link';
	var LAST_TEXT_ID = 'betterlink-last-link-text';

	var NO_LINK = "betterlink-no-link";
	var SUCCESS = "betterlink-link-success";
	var ERROR = "betterlink-link-error";
	var ELLIPSIS = "betterlink-ellipsis";

	var LINK_DISPLAYER_CSS = 
		[   "#" + LINK_VIEWER_ID + " { width: auto; }",
			"#" + LAST_LINK_ID + " { font-size: 13px; }",
			"#" + LAST_TEXT_ID + " { color: #333; font-style: italic; font-size: 70%; }",
			"." + NO_LINK + " { font-style: italic; width: auto; }",
			"." + ELLIPSIS + " { width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; -o-text-overflow: ellipsis; }"].join(' ');

	var linkDropzone;
	var lastLinkElement;
	var lastTextElement;

	apiInternal.linkViewer = {
		create: initializeLinkViewer,
		selectLastLink: selectLastLink
	};
	/****************************************************************************************************/

	function initializeLinkViewer(submissionFn) {
		if(!apiInternal.linkViewer.initialized) {
			apiInternal.linkViewer.initialized = true;

			insertStyles();
			createLinkViewer();
			selectTextOnClick(lastLinkElement);
			triggerSubmissionOnDrop(linkDropzone, submissionFn);

			apiInternal.lastSubmission.subscribeAll.onsuccess(displaySubmissionResult);
			apiInternal.lastSubmission.subscribeAll.onfailed(displaySubmissionError);
		}

		return linkDropzone.element;
	}

	function insertStyles() {
		apiInternal.util.dom.createAndAppendStyleElement(LINK_DISPLAYER_CSS);
	}

	// Create the HTML elements that will serve to display the user's last link
	function createLinkViewer() {
		linkDropzone = apiInternal.dropzone.create('Last Link');
		linkDropzone.element.id = LINK_VIEWER_ID;

		lastTextElement = document.createElement('div');
		lastTextElement.id = LAST_TEXT_ID;
		lastTextElement.className = "betterlink-reset " + ELLIPSIS;

		lastLinkElement = document.createElement('div');
		lastLinkElement.id = LAST_LINK_ID;
		lastLinkElement.className = "betterlink-reset " + NO_LINK;
		lastLinkElement.appendChild(document.createTextNode('no recent submissions'));

		linkDropzone.element.appendChild(lastTextElement);
		linkDropzone.element.appendChild(lastLinkElement);
	}

	function triggerSubmissionOnDrop(dropzone, submissionFn) {
		dropzone.subscribeToDrop(submissionFn);
	}

	function displaySubmissionError() {
		var lastSub = apiInternal.lastSubmission.last;
		var message = lastSub.message;

		apiInternal.util.dom.removeClassFromElement(linkDropzone.element, SUCCESS);
		apiInternal.util.dom.applyClassToElement(linkDropzone.element, ERROR);
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
		apiInternal.util.dom.removeClassFromElement(linkDropzone.element, ERROR);
		apiInternal.util.dom.applyClassToElement(linkDropzone.element, SUCCESS);

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
