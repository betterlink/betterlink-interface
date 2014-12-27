/**
 * Clickable div to copy the share link
 *
 */
betterlink_user_interface.createModule("Copy Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission"] );

	var COPY_CLASS = "betterlink-copy";
	var LABEL_CLASS = "betterlink-copy-label";
	var LINK_CLASS = "betterlink-copy-link";
	var LINK_OPEN_CLASS = "betterlnk-copy-link-open";

	var CSS  =  apiInternal.drawerSelector + [
		"div." + COPY_CLASS + " { background-color: #999; color: white; }",
		"img." + LINK_OPEN_CLASS + ", " + apiInternal.drawerSelector + "img." + COPY_CLASS + ":hover { background-color: goldenrod; border-radius: 1em; }",
		"." + LABEL_CLASS + " { cursor: pointer; display: block; font-style: italic; font-size: 75%; margin-top: -8px; }",
		"input." + LINK_CLASS + " { width: 81px; text-overflow: ellipsis; background-color: #f5f5f5; border: 2px solid goldenrod; padding: 3px; margin-top: 3px; font-size: 12px; }"
	].join(' ' + apiInternal.drawerSelector);

	var stylesInitialized = false;
	var lastSuccessful = apiInternal.lastSubmission.lastSuccessful;

	apiInternal.copyLinkElement = {
		create: createElement
	};
	/****************************************************************************************************/

	function createElement() {
		if(!stylesInitialized) {
			insertStyles();
		}

		var copyElement = apiInternal.svg.createElement('copy', 'copy link');
		apiInternal.util.dom.applyClassToElement(copyElement, "betterlink-action-element " + COPY_CLASS);
		triggerSubmissionOnClick(copyElement);
		var ret = [copyElement];

		// Provides a caption to annotate the icon. (would be easier
		// to implement if <img> tags support pseudo ::after elements)
		if(apiInternal.svg.supported) {
			var label = document.createElement('span');
			apiInternal.util.dom.applyClassToElement(label, LABEL_CLASS);
			label.appendChild(document.createTextNode('copy link'));
			triggerSubmissionOnClick(label, copyElement);
			ret.push(label);
		}

		// Provides an input field that can be used to communicate the
		// link
		var linkInput = document.createElement('input');
		apiInternal.util.dom.applyClassToElement(linkInput, LINK_CLASS);
		linkInput.style.display = 'none';
		linkInput.setAttribute('type', 'text');
		linkInput.setAttribute('readonly', 'readonly');
		triggerTextSelectionOnClick(linkInput);
		ret.push(linkInput);

		return ret;
	}

	function triggerSubmissionOnClick(element, opt_target) {
		// The target is supplied to the event listener so that we
		// can easily access it via 'this'. This is so that we don't
		// have to store state to target the elements (making it a
		// singleton).
		apiInternal.addListener(element, 'click', executeSharingAction, opt_target || element);
		apiInternal.addListener(element, 'touch', executeSharingAction, opt_target || element);
	}

	// When the text input is clicked, select the whole text. The
	// side benefit of this being an input element is that highlighting
	// the text doesn't trigger the Betterlink prospective submission
	// code.
	function triggerTextSelectionOnClick(element) {
		apiInternal.addListener(element, 'click', element.select);
		apiInternal.addListener(element, 'touch', element.select);
	}

	// Display an element that contains the new URL, allowing it to
	// be copied
	function executeSharingAction(e) {
		var link = lastSuccessful.link;
		var copyElement = this;
		var linkInput = findLinkInput(copyElement);

		if(lastSuccessful.exists() && linkInput) {
			if(linkInput.style.display) {
				linkInput.value = link;
				apiInternal.util.dom.applyClassToElement(copyElement, LINK_OPEN_CLASS);
				linkInput.style.display = '';
			}
			else {
				linkInput.value = '';
				apiInternal.util.dom.removeClassFromElement(copyElement, LINK_OPEN_CLASS);
				linkInput.style.display = 'none';
			}
		}
		else {
			// display there was an error
		}
	}

	// Traverse the siblings of the clicked Action Element to find
	// where the URL is displayed
	function findLinkInput(firstElement) {
		var el = firstElement.nextSibling;
		while (el) {
			if(el.nodeName.toLowerCase() !== 'input') {
				el = el.nextSibling;
			}
			else {
				return el;
			}
		}
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(CSS);
	}
});
