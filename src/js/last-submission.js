/**
 * Watches submissions. Can alert clients with the last and last
 * successful submission.
 *
 */
betterlink_user_interface.createModule("LastSubmission", function(api, apiInternal) {
	api.requireModules( ["Event Messaging", "State Machine"] );

	// Shared State Machine States
	// NOTE: Do not name events and states the same
	//   Otherwise, the onEVENT and onSTATE callbacks will both fire
	var INITIAL = 'none',
		SUBMITTED = 'submitted',
		FAILED = 'failed',
		SUCCESS = 'success';

	// The 'all' state machine tracks the progress of each successive submission
	var lastSubmissionSM = apiInternal.stateMachine.create({
		initial: INITIAL,
		events: [
			{ name: 'submit',   from: [INITIAL,FAILED,SUCCESS], to: SUBMITTED },
			{ name: 'error',    from: SUBMITTED,                to: FAILED },
			{ name: 'complete', from: SUBMITTED,                to: SUCCESS }
		],
		callbacks: {
			onerror:   function(evt, from, to, msg)        { storeError(lastSub.last, msg); fireEvents('all'); },
			onsuccess: function(evt, from, to, link, text) { storeSuccess(lastSub.last, link, text); fireEvents('all'); }
		}
	});

	// The 'success' state machine stays never moves to a failure state once it's hit
	// success
	var lastSuccessfulSM = apiInternal.stateMachine.create({
		initial: INITIAL,
		events: [
			{ name: 'submit',   from: [INITIAL,FAILED,SUCCESS], to: SUBMITTED },
			{ name: 'error',    from: SUBMITTED,                to: FAILED },
			{ name: 'complete', from: SUBMITTED,                to: SUCCESS }
		],
		callbacks: {
			onsuccess: function(evt, from, to, link, text) { storeSuccess(lastSub.lastSuccessful, link, text); fireEvents('success'); }
		}
	});

	var eventSubscriptions = {};

	apiInternal.lastSubmission = {
		last: {
			exists: function() { return !lastSubmissionSM.is(INITIAL); },
			successful: function() { return lastSubmissionSM.is(SUCCESS); },
			text: '',
			link: '',
			message: '',
		},
		lastSuccessful: {
			exists: function() { return !lastSuccessfulSM.is(INITIAL); },
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

	// ============== Manage Event Listeners to trigger State Machine Transitions ==============

	apiInternal.events.registerObserverForNewSubmission(storeNewSubmission);
	apiInternal.events.registerObserverForSubmissionDisplay(storeAndAlert);

	function storeNewSubmission() {
		lastSuccessfulSM.submit();
		lastSubmissionSM.submit();
	}

	// Expects an object { success: true, message: "my message here", text: "Example text...", selection: custom_obj }
	function storeAndAlert(result) {
		var success = result['success'];
		var text = result['text'] || '';
		var message = result['message'];

		if(success) {
			lastSuccessfulSM.complete(message, text);
			lastSubmissionSM.complete(message, text);
		}
		else {
			lastSubmissionSM.error(message);
		}
	}

	// =========================================================================================
	// ============== Handle State Transitions ==============

	function storeError(obj, message) {
		obj.link = '';
		obj.text = '';
		obj.message = message;
	}

	function storeSuccess(obj, link, text) {
		obj.link = link;
		obj.text = text;
		obj.message = '';
	}
	// =========================================================================================
	// ============== Manage Event Subscriptions ==============

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
