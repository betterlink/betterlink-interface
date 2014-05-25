/**
 * Watches submissions. Can alert clients with the last and last
 * successful submission.
 *
 */
betterlink_user_interface.createModule("LastSubmission", function(api, apiInternal) {
	api.requireModules( ["Event Messaging"] );

	var eventSubscriptions = {};

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
		},
		subscribeAll: function(fn, thisContext) {
			subscribe('all', fn, thisContext);
		},
		subscribeSuccess: function(fn, thisContext) {
			subscribe('success', fn, thisContext);
		}
	};
	var lastSub = apiInternal.lastSubmission;
	/****************************************************************************************************/

	apiInternal.events.registerObserverForSubmissionDisplay(storeAndAlert);

	// Expects an object { success: true, message: "my message here", text: "Example text...", selection: custom_obj }
	function storeAndAlert(result) {
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

			fireEvents('success');
		}
		else {
			lastSub.link = '';
			lastSub.message = message;
		}

		fireEvents('all');
	}

	// If a client subscribes to an event, store the callback associated with the
	// calling context and the event type that's being subscribed to.
	function subscribe(eventType, fn, thisContext) {
		if(!eventSubscriptions[eventType]) {
			eventSubscriptions[eventType] = [];
		}
		eventSubscriptions[eventType].push({context: thisContext || this, callback: fn});
	}

	// Alert all clients that the given event has fired. Pass all additional params
	// onto the client callback function.
	function fireEvents(eventType) {
		if(eventSubscriptions[eventType]) {
			var options = Array.prototype.slice.call(arguments, 1);
			apiInternal.util.forEach(eventSubscriptions[eventType], function(subscription) {
				if(subscription) {
					subscription.callback.apply(subscription.context, options);
				}
			});
		}
	}
});
