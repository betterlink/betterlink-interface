/**
 * Watches submissions. Can provide clients with the last and last
 * successful submission.
 *
 */
betterlink_user_interface.createModule("LastSubmission", function(api, apiInternal) {
	api.requireModules( ["Event Messaging"] );

	apiInternal.lastSubmission = {
		exists: false,
		successful: null,
		text: '',
		link: '',
		message: '',
		lastSuccessful: {
			exists: false,
			text: '',
			link: '',
		}
	};
	var lastSub = apiInternal.lastSubmission;
	/****************************************************************************************************/

	apiInternal.events.registerObserverForSubmissionDisplay(storeSubmission);

	// Expects an object { success: true, message: "my message here", text: "Example text...", selection: custom_obj }
	function storeSubmission(result) {
		var success = result['success'];
		var text = result['text'];
		var message = result['message'];

		lastSub.exists = true;
		lastSub.successful = success;
		lastSub.text = text;
		if(success) {
			lastSub.link = message;
			lastSub.message = '';

			lastSub.lastSuccessful.exists = true;
			lastSub.lastSuccessful.text = text;
			lastSub.lastSuccessful.link = message;
		}
		else {
			lastSub.link = '';
			lastSub.message = message;
		}
	}
});
