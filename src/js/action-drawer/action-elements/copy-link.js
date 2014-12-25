/**
 * Clickable div to copy the share link
 *
 */
betterlink_user_interface.createModule("Copy Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission"] );

	var COPY_CLASS = "betterlink-copy";
	var CSS = apiInternal.drawerSelector + "div." + COPY_CLASS + " { background-color: #999; color: white; }";

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

		return element;
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
