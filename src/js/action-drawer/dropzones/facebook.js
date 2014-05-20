/**
 * Dropzone div to share on Facebook
 *
 */
betterlink_user_interface.createModule("Dropzone.Facebook", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Dropzone", "Share.Facebook", "Event Messaging"] );

	var FB_CLASS = "fb";
	var CSS = "." + apiInternal.dropzone.HOVER_CLASS + "." + FB_CLASS + " { background-color: #3B5999; color: white; }";

	var stylesInitialized = false;
	var lastSubmittedText;

	apiInternal.dropzone.facebook = {
		create: createDropzone
	};
	/****************************************************************************************************/

	function createDropzone(submissionFn) {
		if(!stylesInitialized) {
			insertStyles();
		}

		var dropzone = apiInternal.dropzone.create("facebook");
		apiInternal.util.dom.applyClassToElement(dropzone.element, FB_CLASS);
		triggerSubmissionOnDrop(dropzone, submissionFn);

		apiInternal.events.registerObserverForSubmissionDisplay(executeSharingAction);

		return dropzone;
	}

	function triggerSubmissionOnDrop(dropzone, submissionFn) {
		registerDropzoneAsSubmitter(); // MOVE
		dropzone.subscribeToDrop(submissionFn);
	}

	function registerDropzoneAsSubmitter() {
		lastSubmittedText = "Domain";
	}

	// Expects an object { success: true, message: "my message here", text: "Example text...", selection: custom_obj }
	function executeSharingAction(result) {
		var success = result['success'];
		var text = result['text'];
		var message = result['message'];

		if(lastSubmittedText && text === lastSubmittedText) {
			if(success) {
				var windowRef = apiInternal.share.facebook.post(message);
				if(!windowRef || windowRef.closed || typeof windowRef.closed == 'undefined') {
					console.log('There was a problem launching the Facebook share dialog. Try disabling popups.');
				}
			}
			else {
				// display there was an error
			}
		}
		lastSubmittedText = null;
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(CSS);
	}
});
