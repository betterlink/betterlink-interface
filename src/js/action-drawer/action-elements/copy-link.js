/**
 * Clickable div to copy the share link
 *
 */
betterlink_user_interface.createModule("Copy Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission"] );

	var COPY_CLASS = "betterlink-copy";
	var LABEL_CLASS = "betterlink-copy-label";
	var CSS  =  apiInternal.drawerSelector + "div." + COPY_CLASS + " { background-color: #999; color: white; } " +
				apiInternal.drawerSelector + "." + LABEL_CLASS + " { cursor: pointer; display: block; font-style: italic; font-size: 75%; margin-top: -8px; }";

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

		var element = apiInternal.svg.createElement('copy', 'copy link');
		apiInternal.util.dom.applyClassToElement(element, "betterlink-action-element " + COPY_CLASS);
		triggerSubmissionOnClick(element);

		// Provides a caption to annotate the icon. (would be easier
		// to implement if <img> tags support pseudo ::after elements)
		var label = document.createElement('span');
		apiInternal.util.dom.applyClassToElement(label, LABEL_CLASS);
		label.appendChild(document.createTextNode('copy link'));
		triggerSubmissionOnClick(label);

		return [element, label];
	}

	function triggerSubmissionOnClick(element) {
		apiInternal.addListener(element, 'click', executeSharingAction);
		apiInternal.addListener(element, 'touch', executeSharingAction);
	}

	function executeSharingAction() {
		var link = lastSuccessful.link;

		if(lastSuccessful.exists()) {
			// do something
		}
		else {
			// display there was an error
		}
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(CSS);
	}
});
