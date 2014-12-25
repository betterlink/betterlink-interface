/**
 * Clickable div to share on Twitter
 *
 */
betterlink_user_interface.createModule("Twitter Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission", "Share.Twitter"] );

	var TW_CLASS = "betterlink-tw";
	var CSS  =  apiInternal.drawerSelector + "div." + TW_CLASS + " { background-color: #55acee; color: #fff; } " +
				apiInternal.drawerSelector + "img." + TW_CLASS + ":hover { background-color: #55acee; border-radius: 1em; background-clip: content-box; }";

	var stylesInitialized = false;
	var lastSuccessful = apiInternal.lastSubmission.lastSuccessful;

	apiInternal.twitterElement = {
		create: createElement
	};
	/****************************************************************************************************/

	function createElement() {
		if(!stylesInitialized) {
			insertStyles();
		}

		var element = apiInternal.svg.createElement('twitter');
		apiInternal.util.dom.applyClassToElement(element, "betterlink-action-element " + TW_CLASS);
		triggerSubmissionOnClick(element);

		return element;
	}

	function triggerSubmissionOnClick(element) {
		apiInternal.addListener(element, 'click', executeSharingAction);
		apiInternal.addListener(element, 'touch', executeSharingAction);
	}

	function executeSharingAction() {
		var link = lastSuccessful.link;
		var text = lastSuccessful.text;

		if(lastSuccessful.exists()) {
			var windowRef = apiInternal.share.twitter.post(link, text);
			if(!windowRef || windowRef.closed || typeof windowRef.closed == 'undefined') {
				console.log('There was a problem launching the Twitter share dialog. Try disabling popups.');
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
