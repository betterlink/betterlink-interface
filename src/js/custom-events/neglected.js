/**
 * Simulates a document listener that triggers a custom event when the user has finished
 * interacting with a particular DOM element.
 *
 */
betterlink_user_interface.createModule("Neglected", function(api, apiInternal) {
	api.requireModules( ["Mouseboundary"] );

	var MOUSE_AWAY_TIMEOUT = 300;

	var watchedTargets = [];

	apiInternal.neglected = {
		watchTarget: watchTarget,
		actOnTarget: actOnTarget,
		stopWatchingTarget: stopWatchingTarget
	};
	/****************************************************************************************************/

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
	function watchTarget(target, action, opt_mouseOnTop) {
		if(!getWatchedTarget(target, action)) {
			var watchedTarget = new WatchedTarget(target, action);
			if(opt_mouseOnTop) { watchedTarget.mouseOnTop = opt_mouseOnTop; }
			watchedTargets.push(watchedTarget);

			watchedTarget.enterListener = apiInternal.mouseboundary.subscribe.mouseenter(target, watchedTarget.trackMouseenter, watchedTarget);
			watchedTarget.leaveListener = apiInternal.mouseboundary.subscribe.mouseleave(target, watchedTarget.trackMouseleave, watchedTarget);
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
			watchedTarget.stopped = true;
			apiInternal.mouseboundary.remove.mouseenter(watchedTarget.target, watchedTarget.enterListener);
			apiInternal.mouseboundary.remove.mouseleave(watchedTarget.target, watchedTarget.leaveListener);
		}
	}

	function WatchedTarget(target, action) {
		this.target = target;
		this.action = action;
		this.mouseOnTop = false;
		this.takeAction = false;
	}

	WatchedTarget.prototype = {
		// On Mouseenter, track that the user is hovering on top of our target
		// and indicate that the target is not neglected.
		trackMouseenter: function() {
			console.log('enter');
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
			target = this;
			this.mouseOnTop = false;
			if(this.takeAction) {
				this.neglectedTimer = setTimeout(function() {
					target.executeNeglectedAction();
				}, MOUSE_AWAY_TIMEOUT);
			}
		},

		executeNeglectedAction: function() {
			this.neglected = true;
			stopWatchingTarget(this.target);
			this.action();
		},

		isNeglected: function() {
			return !this.mouseOnTop && this.takeAction;
		}
	};
});
