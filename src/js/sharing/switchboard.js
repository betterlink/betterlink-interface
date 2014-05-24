/**
 * Manages a Window that is used to direct a user to their next action.
 *
 */
betterlink_user_interface.createModule("Switchboard", function(api, apiInternal) {
	api.requireModules( ["Event Messaging"] );
	
	var FIRST_DESTINATION = removeSubmissionParams(window.location.href);
	var SAFE_TO_CLOSE = 'http://purple.com/purple.html';
	var WINDOW_PARAMS = "width=1,height=1";
	var WIDTH = 670;
	var HEIGHT = 340;

	var closeListeners = {};
	var closeListenersInitialized = false;

	var winRef;

	apiInternal.switchboard = {
		initializeOnElement: initializeOnElement,
		removeElementWatcher: removeElementWatcher,
		routeTo: routeTo
	};
	/****************************************************************************************************/

	/*	CONTEXT

		Within our sharing-actions, we may want to open a popup window that allows
		the user to take an additional action. For Example: Open the Facebook Share
		Dialog.

		By default, all popup windows are blocked by browsers *unless* the window is
		opened as a result of a user action. Specifically: a 'click', 'mousedown',
		or 'mouseup' event. Drag events do not bypass this restriction. Additionally,
		Drag events fire *in place of* the standard mouse events. So a 'mouseup' never
		fires if 'dragend' fires.

		In our case, the share actions would be taken as a result of a 'dragend' or 'drop'
		event. However, we can get around this restriction by opening a window as the
		result of a user 'mousedown', and then update the location of the window on the
		following 'drop'.

		A complication: not all browsers support a popup on 'mousedown'. Specifically,
		Firefox doesn't.
	 */

	// Opens a new window that the user will be able to interact with. If a
	// window is already open, attempt to close it first.
	function initialize() {
		if(!closeListenersInitialized) {
			setCloseListeners();
			apiInternal.events.registerObserverForRemoveBetterlink(removeCloseListeners);
		}

		attemptToClose(winRef);
		winRef = window.open(FIRST_DESTINATION, "_blank", WINDOW_PARAMS);
	}

	// Triggers a re-initialization of the switchboard whenever the user
	// begins to click on the provided element
	function initializeOnElement(element) {
		apiInternal.addListener(element, 'mousedown', initialize);
	}

	// Globally listen to events that indicate our switchboard can definitely be
	// closed
	function setCloseListeners() {
		closeListenersInitialized = true;
		var closeFunction = function(e) { attemptToClose(); };

		// ASSUMPTION: We only plan on updating the switchboard on the 'drop' event.
		//
		// Because 'mouseup' and 'dragend' do not fire during 'drop' (or at the very
		// least, fire afterwards), it is safe to globally listen to these events to
		// close the window.
		//
		// Note: We're not using the Draggable 'dragend' listener here. That is
		// because we want to ensure we catch as many edge cases as possible in
		// order to close the window. The Draggable module technically only fires
		// events for certain objects that finish dragging.
		closeListeners['mouseup'] = apiInternal.addListener(document, 'mouseup', closeFunction);
		closeListeners['dragend'] = apiInternal.addListener(document, 'dragend', closeFunction);
	}

	function removeCloseListeners() {
		apiInternal.removeListener(document, 'mouseup', closeListeners['mouseup']);
		apiInternal.removeListener(document, 'dragend', closeListeners['dragend']);
	}

	function removeElementWatcher(element) {
		apiInternal.removeListener(element, 'mousedown', initialize);
	}

	// Update the location of the switchboard to the provided destination. Alert
	// the client if we were able to update the window.
	function routeTo(destination) {
		if(windowIsAvailable()) {
			repositionWindow();
			winRef.location.href = destination;
			return true;
		}
		else {
			return false;
		}
	}

	// Attempt to close the provided window. If no window is provided,
	// use the global winRef
	function attemptToClose(opt_win) {
		var win = opt_win || winRef;
		if(windowIsAvailable(win)) {
			try {
				win.close();
			}
			catch (e) {
				win.location.href = SAFE_TO_CLOSE;
			}
		}
	}

	// Return if a window is open and availble to route users. Use the global
	// winRef if no window is provided.
	function windowIsAvailable(opt_win) {
		var win = opt_win || winRef;
		return win && !win.closed;
	}

	// Reposition and resize the window so that it is in an accessible
	// location for the user
	function repositionWindow(opt_win) {
		var win = opt_win || winRef;
		var width = WIDTH,
			height = HEIGHT,
			screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
	        screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
	        outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.body.clientWidth,
	        outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.body.clientHeight - 22),
	        left = parseInt(screenX + ((outerWidth - width) / 2), 10),
	        top = parseInt(screenY + ((outerHeight - height) / 2.5), 10);

	    win.resizeTo(width, height);
	    win.moveTo(left, top);
	}

	// Sanitize the provided URL so that it can be revisited. Specifically,
	// remove Betterlink submission params so that we don't track fake views
	// on a submission when we open the switchboard.
	function removeSubmissionParams(url) {
		var hl = api['config']['highlightQueryParam'];

		// /[?&]hl=[^&#!]+([&#!]?)/
		// Matches the 'hl' param, stopping at the next '&', '#', or '!'
		// Additionally matches the first character (if exists) of the stopping
		// boundary
		var hl_existance = new RegExp("[?&]" + hl + "=[^&#!]+([&#!]?)");

		return url.replace(hl_existance, safelyRemoveHighlightParam);
	}

	// Handles the edge case that our highlight parameter is the first query
	// parameter, preserving the leading '?' when necessary
	function safelyRemoveHighlightParam(match, p1, offset, string) {
		// 'match' contains the full 'hl' parameter and the first
		// character of the next param
		// 'p1' is specifically that first character
		// ex: ?hl=23&
		var isFirstParam = match.charAt(0) === '?';
		var isLastParam = p1 !== '&';

		return isFirstParam && !isLastParam ? '?' : p1;
	}
});
