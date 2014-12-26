/**
 * Defines a DOM element that will display the result of the most
 * recent Betterlink submission.
 *
 */
betterlink_user_interface.createModule("Link Viewer", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS", "LastSubmission"] );

	var LAST_VIEWER_CLASS = 'betterlink-link-display';
	var LAST_TEXT_CLASS = 'betterlink-last-link-text';
	var LAST_ERROR_CLASS = 'betterlink-last-error';

	var SUCCESS = "betterlink-link-success";
	var ERROR = "betterlink-link-error";
	var ELLIPSIS = "betterlink-ellipsis";

	var LINK_DISPLAYER_CSS = apiInternal.drawerSelector +
		[   "." + LAST_VIEWER_CLASS + " { width: auto; }",
			"." + LAST_TEXT_CLASS + " { font-style: italic; font-size: 11px; }",
			"." + LAST_ERROR_CLASS + " { font-size: 13px; margin-top: 10px; width: auto; }",

			// Break text at 3 lines (line-height 1.3em * 3 = 3.9em) and use ellipsis for the overflow
			// Derived via http://www.mobify.com/blog/multiline-ellipsis-in-pure-css/
			// (also requires a <div> and <p> within the wrapper .ellipsis <div>)
			"." + ELLIPSIS + " { width: auto; overflow: hidden; line-height: 1.3em; max-height: 3.9em; }",
			"." + ELLIPSIS + ":before { content: ''; float: left; width: 5px; height: 3.9em; }",
			"." + ELLIPSIS + "> *:first-child { float: right; width: 100%; margin-left: -5px; }",
			"." + ELLIPSIS + ":after { content: '\u2026\"'; box-sizing: content-box; float: right; position: relative; top: -1.3em; left: 100%; width: 3em; margin-left: -3em; padding-right: 5px; text-align: right; background: linear-gradient(to right, rgba(255, 255, 255, 0), #E9E9E9 50%, #E9E9E9); }"
		].join(' ' + apiInternal.drawerSelector);

	var linkViewer;
	var lastErrorElement;
	var lastTextTarget;

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
		linkViewer.className = LAST_VIEWER_CLASS;

		var lastTextWrapper = document.createElement('div');
		var lastTextEllipsisInner = document.createElement('div');
		lastTextTarget = document.createElement('p');

		lastTextTarget.appendChild(document.createTextNode('no recent submissions'));
		lastTextEllipsisInner.appendChild(lastTextTarget);
		lastTextWrapper.appendChild(lastTextEllipsisInner);
		lastTextWrapper.className = LAST_TEXT_CLASS + " " + ELLIPSIS;

		lastErrorElement = document.createElement('div');
		lastErrorElement.className = LAST_ERROR_CLASS;

		linkViewer.appendChild(lastTextWrapper);
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
			apiInternal.util.dom.addOrReplaceChild(lastTextTarget, document.createTextNode(selectedText));
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
			apiInternal.util.dom.addOrReplaceChild(lastTextTarget, document.createTextNode(selectedText));
		}
	}

	function collapseWhitespace(text) {
		return text.replace(/\s+/g,' ');
	}
});
