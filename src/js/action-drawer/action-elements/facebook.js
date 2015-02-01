/**
 * Clickable div to share on Facebook
 *
 */
betterlink_user_interface.createModule("Facebook Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission", "Share.Facebook"] );

	var FB_CLASS = "betterlink-fb";
	var DISABLED_CLASS = "betterlink-disabled";
	var CSS  =  apiInternal.drawerSelector + "div." + FB_CLASS + " { background-color: #3B5999; color: white; }" +
				apiInternal.drawerSelector + "img." + FB_CLASS + ":hover { background-color: #3B5999; border-radius: 1em; background-clip: content-box; }" +

				apiInternal.drawerSelector + "div." + FB_CLASS + "." + DISABLED_CLASS + " { background-color: #BCBCBC; opacity: 0.6; cursor: default; }" +
				apiInternal.drawerSelector + "img." + FB_CLASS + "." + DISABLED_CLASS + " { background-color: #BCBCBC; opacity: 0.6; cursor: default; border-radius: 1em; background-clip: content-box; }";

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
		apiInternal.util.dom.applyClassToElement(element, "betterlink-action-element " + FB_CLASS + " " + DISABLED_CLASS);
		//triggerSubmissionOnClick(element);

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
