/**
 * Defines a DOM element that will display the result of the most
 * recent Betterlink submission.
 *
 */
betterlink_user_interface.createModule("Link Viewer", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Dropzone", "Event Messaging"] );

	var LINK_VIEWER_ID = 'betterlink-link-display';
	var LAST_LINK_ID = 'betterlink-last-link';

	var LINK_DISPLAYER_CSS = "#" + LINK_VIEWER_ID + " { width: auto; }";

	var linkDropzone;
	var lastLinkElement;

	apiInternal.linkViewer = {
		create: initializeLinkViewer
	};
	/****************************************************************************************************/

	function initializeLinkViewer(submissionFn) {
		if(!apiInternal.linkViewer.initialized) {
			apiInternal.linkViewer.initialized = true;

			insertStyles();
			createLinkViewer();
			selectTextOnClick(lastLinkElement);
			triggerSubmissionOnDrop(linkDropzone, submissionFn);

			apiInternal.events.registerObserverForSubmissionDisplay(displaySubmissionResult);
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

		lastLinkElement = document.createElement('input');
		lastLinkElement.id = LAST_LINK_ID;
		lastLinkElement.type = 'text';
		lastLinkElement.setAttribute('placeholder', 'my placeholder');
		lastLinkElement.setAttribute('readonly', '');

		linkDropzone.element.appendChild(lastLinkElement);
	}

	function triggerSubmissionOnDrop(dropzone, submissionFn) {
		dropzone.subscribeToDrop(submissionFn);
	}

	// Expects an object { success: true, message: "my message here", text: "Example text...", selection: custom_obj }
	function displaySubmissionResult(result) {
		var message = result['message'];
		var selectedText = result['text'];

		var lastLink = document.getElementById(LAST_LINK_ID);
		if(lastLink) {
			lastLink.value = message;
		}
	}

	// When the user selects the area where the last link is displayed, select
	// the text content
	function selectTextOnClick(element) {
		apiInternal.addListener(element, 'click', _selectText);

		function _selectText(e) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

			element.select();
		}
	}
});
