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
		SUBMITTED = 'submitted',   // when submit first hits us; allows us to store submission for later matching
		SENT = 'sent',             // immediately after submit; means we're waiting on server
		PROCESSING = 'processing', // got response from server; figuring out what to do
		FAILED = 'failed',         // terminal state; we matched last submission with a response
		SUCCESS = 'success';       // terminal state; we matched last submission with a response

	// States for 'success' state machine
	var SUBMITTED_AGAIN = 'submittedAgain';

	// The 'all' state machine tracks the progress of each successive submission
	var lastSubmissionSM = apiInternal.stateMachine.create({
		initial: INITIAL,
		events: [
			{ name: 'submit',    from: [INITIAL,SENT,FAILED,SUCCESS], to: SUBMITTED },
			{ name: 'ready',     from: SUBMITTED,                     to: SENT },
			{ name: 'responded', from: SENT,                          to: PROCESSING },
			{ name: 'responded', from: FAILED,                        to: FAILED },
			{ name: 'responded', from: SUCCESS,                       to: SUCCESS },
			{ name: 'ignore',    from: PROCESSING,                    to: SENT },
			{ name: 'fail',      from: PROCESSING,                    to: FAILED },
			{ name: 'complete',  from: PROCESSING,                    to: SUCCESS },
		],
		callbacks: {
			onsubmit:   function(evt, from, to)             { lastSuccessfulSM.submit(); fireEvents('all-submit'); },
			onfail:     function(evt, from, to, msg)        { lastSuccessfulSM.fail(); storeError(lastSub.last, msg); fireEvents('all-fail'); },
			oncomplete: function(evt, from, to, link, text) { lastSuccessfulSM.complete(link, text); storeSuccess(lastSub.last, link, text); fireEvents('all-complete'); }
		}
	});

	// The 'success' state machine stays never moves to a failure state once it's hit
	// success
	var lastSuccessfulSM = apiInternal.stateMachine.create({
		initial: INITIAL,
		events: [
			{ name: 'submit',   from: [INITIAL,FAILED],             to: SUBMITTED },
			{ name: 'submit',   from: SUCCESS,                      to: SUBMITTED_AGAIN },
			{ name: 'fail',     from: SUBMITTED,                    to: FAILED },
			{ name: 'fail',     from: SUBMITTED_AGAIN,              to: SUCCESS },
			{ name: 'complete', from: [SUBMITTED, SUBMITTED_AGAIN], to: SUCCESS }
		],
		callbacks: {
			onsubmit:   function(eft, from, to)             { fireEvents('success-submit'); },
			onfail:     function(eft, from, to)             { fireEvents('success-fail'); },
			oncomplete: function(evt, from, to, link, text) { storeSuccess(lastSub.lastSuccessful, link, text); fireEvents('success-complete'); }
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
			exists: function() { return !lastSuccessfulSM.is(INITIAL) && !lastSuccessfulSM.is(FAILED); },
			text: '',
			link: '',
		},

		subscribeAll: {
			onsubmit: function(fn, thisContext) { subscribe('all-submit', fn, thisContext); },
			onfail: function(fn, thisContext) { subscribe('all-fail', fn, thisContext); },
			oncomplete: function(fn, thisContext) { subscribe('all-complete', fn, thisContext); },
		},

		subscribeSuccess: {
			onsubmit: function(fn, thisContext) { subscribe('success-submit', fn, thisContext); },
			onfail: function(fn, thisContext) { subscribe('success-fail', fn, thisContext); },
			oncomplete: function(fn, thisContext) { subscribe('success-complete', fn, thisContext); },
		}
	};
	var lastSub = apiInternal.lastSubmission;
	/****************************************************************************************************/

	// ============== Manage Event Listeners to trigger State Machine Transitions ==============

	apiInternal.events.registerObserverForNewSubmission(storeNewSubmission);
	apiInternal.events.registerObserverForSubmissionDisplay(storeSubmissionResult);

	function storeNewSubmission() {
		lastSubmissionSM.submit();

		// do some processing to store our last submission

		lastSubmissionSM.ready();
	}

	// Expects an object { success: true, message: "my message here", text: "Example text...", selection: custom_obj }
	function storeSubmissionResult(result) {
		lastSubmissionSM.responded();

		var success = result['success'];
		var text = result['text'] || '';
		var message = result['message'];

		// if this isn't the last submission
		// lastSubmissionSM.ignore();

		if(success) {
			lastSubmissionSM.complete(message, text);
		}
		else {
			lastSubmissionSM.fail(message);
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
