/**
 * Clickable div to share on Twitter
 *
 */
betterlink_user_interface.createModule("Twitter Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "LastSubmission", "Share.Twitter"] );

	var TW_CLASS = "tw";
	var CSS = ".betterlink-action-element" + "." + TW_CLASS + " { background-color: #55acee; color: #fff; }";

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

		var element = document.createElement('div');
		element.appendChild(document.createTextNode('twitter'));
		element.className = "betterlink-action-element " + TW_CLASS;
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