/**
 * Clickable div to share on Facebook
 *
 */
betterlink_user_interface.createModule("Facebook Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission", "Share.Facebook"] );

	var FB_CLASS = "fb";
	var CSS = apiInternal.drawerSelector + "div." + FB_CLASS + " { background-color: #3B5999; color: white; }";

	var stylesInitialized = false;
	var lastSuccessful = apiInternal.lastSubmission.lastSuccessful;

	apiInternal.facebookElement = {
		create: createElement
	};
	/****************************************************************************************************/

	function createElement() {
		if(!stylesInitialized) {
			insertStyles();
		}

		var element = apiInternal.svg.createElement('facebook');
		apiInternal.util.dom.applyClassToElement(element, "betterlink-action-element " + FB_CLASS);
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
			var windowRef = apiInternal.share.facebook.post(link);
			if(!windowRef || windowRef.closed || typeof windowRef.closed == 'undefined') {
				console.log('There was a problem launching the Facebook share dialog. Try disabling popups.');
			}
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
