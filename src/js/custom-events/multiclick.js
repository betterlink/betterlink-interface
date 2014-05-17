/**
 * Simulates a document listener that triggers a custom event when the user has finished
 * making a selection on the page. This is represented by a user double or triple-clicking
 * a section of text, or if the user highlights a portion of the page.
 *
 */
betterlink_user_interface.createModule("Multiclick", function(api, apiInternal) {
	api.requireModules( ["Event Messaging"] );

	var userClickTimeout,
		userClickThreshold = 250;	// milliseconds between a click & double-click

	// Without a more object-oriented approach, we can't allow this click handler to
	// be used for multiple events. Specifically, we would need to store instance-level
	// values for userClickTimeout and eventToExecute.
	var inUse = false;
	var eventToExecute;

	apiInternal.events.registerObserverForRemoveBetterlink(removeDocumentListeners);
	apiInternal.multiclick = {
		insertDocumentListeners: insertDocumentListeners,
		reset: removeDocumentListeners
	};
	/****************************************************************************************************/

	// Turn off the click handler
	function removeDocumentListeners() {
		if(userClickTimeout) {
			clearTimeout(userClickTimeout);
		}

		apiInternal.removeListener(document, 'click', resetUserClickTimeout);
		apiInternal.removeListener(document, 'mouseup', setUserClickTimeout);
		eventToExecute = null;
		inUse = false;
	}

	// Set the document event listeners to execute multiple click handling. Returns
	// 'false' if the listener has already been initialized for another function.
	function insertDocumentListeners(callback) {
		if(inUse) {
			return false;
		}

		inUse = true;
		eventToExecute = callback;

		// We attempt to consolidate multiple click events into a single execution.
		// Complicating this, a 'mouseup' event executes anytime the user lets go of the
		// mouse button. However, a 'click' event only executes when the user depresses and
		// releases the mouse ontop of a single element. We need to handle both situations.
		//
		// General structure is similar to 'debouncing', as outlined by John Hann:
		// http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
		//
		// We execute the event once after we've stopped receiving signals within a
		// predefined threshold. Mouseup events set the first timer. Click events reset
		// the timer until they stop.
		apiInternal.addListener(document, "mouseup", setUserClickTimeout);
		apiInternal.addListener(document, "click", resetUserClickTimeout);
	}

	function setUserClickTimeout() {
		// Set timeout on first mouseup, but don't retrigger on subsequent mouseups
		if(!userClickTimeout) {
			userClickTimeout = setTimeout(executeDelayedAction, userClickThreshold);
		}
	}

	function resetUserClickTimeout() {
		// Another click was registered. If the timeout is still running, reset the
		// counter.
		if(userClickTimeout) {
			clearTimeout(userClickTimeout);
			userClickTimeout = setTimeout(executeDelayedAction, userClickThreshold);
		}

		// A second option is to check if we've achieved three clicks (a triple-click)
		// and immediately execute our action. However, this would no longer allow a
		// user to cycle between triple and double-clicking a word v. paragraph. Since
		// the delay is small enough, we'll just wait the extra time.
		// Note: this behavior is browser-specific (ex: Firefox, not Chrome)
	}

	// This action should be executed only a single time during the consolidation of
	// multiple click events.
	function executeDelayedAction() {
		userClickTimeout = null;
		if(eventToExecute) {
			eventToExecute();
		}
	}
});
