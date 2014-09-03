/**
 * Simulates a document listener that triggers a custom event when the user has finished
 * interacting with a particular DOM element.
 *
 */
betterlink_user_interface.createModule("Neglected", function(api, apiInternal) {
	api.requireModules( ["Event Messaging", "Mouseboundary"] );

	var MOUSE_AWAY_TIMEOUT = 300;

	var watchedTargets = [];

	apiInternal.events.registerObserverForRemoveBetterlink(cleanUpReferences);
	apiInternal.neglected = {
		watchTarget: watchTarget,
		actOnTarget: actOnTarget,
		stopWatchingTarget: stopWatchingTarget
	};
	/****************************************************************************************************/

	// A cleanup funtion that lets go of any held references to DOM elements
	// we may have been watching
	function cleanUpReferences() {
		for(var i = watchedTargets.length-1; i >= 0; i--) {
			var watchedTarget = watchedTargets[i];
			if(watchedTarget && !watchedTarget.stopped) {
				watchedTarget.stopWatching();
			}
			watchedTargets[i] = null;
		}
	}

	function getWatchedTarget(target, action) {
		// Look in reverse order so we always check the newest events first
		for(var i = watchedTargets.length-1; i >= 0; i--) {
			var t = watchedTargets[i];
			if(!t.stopped && t.target === target && t.action === action) {
				return t;
			}
		}
	}

	// Begin watching the desired target. No action will be taken until the
	// followup actOnTarget() is called. An optional mouseOnTop parameter
	// informs us whether the user's mouse is already hovering on top of the
	// watched element. Otherwise, we will assume the user is not yet on top
	// of the element.
	//
	// We need to separate watching v. acting to determine mouse placement. At
	// the moment we're allowed (or supposed) to act, we need to determine if
	// the mouse is on top of our target. The problem is that unless the mouse
	// moves, there's no way for us to know its position. By beginning to watch
	// earlier, we can be more confident in the mouse's placement.
	function watchTarget(target, action, opt_mouseOnTop) {
		if(!getWatchedTarget(target, action)) {
			var watchedTarget = new WatchedTarget(target, action);
			if(opt_mouseOnTop) { watchedTarget.mouseOnTop = opt_mouseOnTop; }
			watchedTargets.push(watchedTarget);

			watchedTarget.addWatcherEvents();
		}
	}

	// Alerts us that we can take our desired action when the watched target
	// is neglected.
	function actOnTarget(target, action) {
		var watchedTarget = getWatchedTarget(target, action);
		if(watchedTarget) {
			watchedTarget.takeAction = true;
			if(watchedTarget.isNeglected()) {
				watchedTarget.executeNeglectedAction();
			}
		}
	}

	// Remove event listeners associated with the given target & action
	function stopWatchingTarget(target, action) {
		var watchedTarget = getWatchedTarget(target, action);
		if(watchedTarget) {
			watchedTarget.stopWatching();
		}
	}

	function WatchedTarget(target, action) {
		this.target = target;
		this.action = action;
		this.mouseOnTop = false;
		this.takeAction = false;
	}

	WatchedTarget.prototype = {
		addWatcherEvents: function() {
			this.enterListener = apiInternal.mouseboundary.subscribe.mouseenter(this.target, this.trackMouseenter, this);
			this.leaveListener = apiInternal.mouseboundary.subscribe.mouseleave(this.target, this.trackMouseleave, this);
			// Mouse events don't seem to fire during drag events. This means that we're
			// unable to know if the mouse has entered our target until after the drag
			// event is over. IE specifically seems to fire dragend first, so we need to
			// additionally watch dragenter/leave events.
			// Ideally we'd only watch for drag if dragend fires before the captured mouse
			// events. Not sure what to test against.
			//
			// Where this fails:
			// I start dragging, enter the dropzone, then bring the element back out,
			// dropping in unwatched territory. Then, the drawer stays open (un-neglected).
			// It closes after my mouse enters and leaves the target.
			//
			// This is because we're not relying on dragleave to tell us if we're no longer
			// inside the target.
			this.addDragHandlers();
		},

		removeWatcherEvents: function() {
			apiInternal.mouseboundary.remove.mouseenter(this.target, this.enterListener);
			apiInternal.mouseboundary.remove.mouseleave(this.target, this.leaveListener);
			this.removeDragHandlers();
		},

		stopWatching: function() {
			this.stopped = true;
			this.removeWatcherEvents();
		},

		// On Mouseenter, track that the user is hovering on top of our target
		// and indicate that the target is not neglected.
		trackMouseenter: function() {
			this.mouseOnTop = true;
			if(this.neglectedTimer) {
				clearTimeout(this.neglectedTimer);
				this.neglectedTimer = 0;
			}
		},

		// On Mouseleave, track that the user has left our target. If we're
		// allowed to take action, set a timer to determine if the target is
		// neglected.
		trackMouseleave: function() {
			var target = this;
			this.mouseOnTop = false;
			if(this.takeAction) {
				this.neglectedTimer = setTimeout(function() {
					target.executeNeglectedAction();
				}, MOUSE_AWAY_TIMEOUT);
			}
		},

		executeNeglectedAction: function() {
			this.neglected = true;
			this.stopWatching();
			this.action.call();
		},

		isNeglected: function() {
			return !this.mouseOnTop && this.takeAction;
		},

		// ************ Drag Event Subscription ************
		// We want to avoid some of the automation that the Draggable module
		// provides. Specifically:
		//   - We don't want the watched targets to appear that they're
		//     droppable. But we do want to know when they've hovered over.
		//   - We don't want to add/remove CSS classes to the elements
		//   - We want to make sure we keep references to the listeners so
		//     they can be removed
		//   - We don't want our 'simpledragleave' to also account for the
		//     drop event. That's because the mouse is still over the element
		//     during the drop.
		addDragHandlers: function() {
			var element = this.target;
			var watcher = apiInternal.singleEntryWatcher.getOrCreate(element, this.dragEventFired, this);

			// Reconciles error checks within SingleEntryWatcher that ensure it's firing
			// for the correct element.
			var enter = function(e) { watcher.enter(null, element); };
			var exit = function(e) { watcher.exit(null, element); };

			this.dragenter = apiInternal.addListener(element, 'dragenter', enter, watcher);
			this.dragleave = apiInternal.addListener(element, 'dragleave', exit, watcher);
		},

		removeDragHandlers: function() {
			var element = this.target;
			apiInternal.removeListener(element, 'dragenter', this.dragenter);
			apiInternal.removeListener(element, 'dragleave', this.dragleave);
			apiInternal.singleEntryWatcher.stopWatching(element, this.dragEventFired, this);
		},

		dragEventFired: function(dropTarget, eventType) {
			if(eventType === apiInternal.singleEntryWatcher.SINGLE_ENTRY) {
				this.trackMouseenter();
			}
			// else if(eventType === apiInternal.singleEntryWatcher.SINGLE_EXIT){
				// Don't do anything. The dragleave event also fires on dragend, and we
				// have no way of knowing if that's the situation. However, on dragend
				// we also get our mouse events back, so we should end up in the correct
				// state regardless. We do need to continue listening to the dragleave
				// events in order to properly seed the SingleEntryWatcher.

				// this.trackMouseleave();
			// }
		}
	};
});
