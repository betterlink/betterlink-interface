/**
 * Watches for top-level mouseenters and mouseleaves. While supported in many browsers at
 * this point, this was IE-specific for a long time.
 *
 */
betterlink_user_interface.createModule("Mouseboundary", function(api, apiInternal) {

	var mouseenterSupported = isMouseEventSupported('mouseenter') && isMouseEventSupported('mouseleave');
	var pairs = {
		mouseenter: 'mouseover',
		mouseleave: 'mouseout'
	};

	apiInternal.mouseboundary = {
		subscribe: {
			mouseenter: subscribeMouseenter,
			mouseleave: subscribeMouseleave
		}
	};
	/****************************************************************************************************/
	
	// via http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
	function isMouseEventSupported(eventName) {
		var el = document.createElement('div');
		eventName = 'on' + eventName;
		var isSupported = (eventName in el);
		if (!isSupported) {
			el.setAttribute(eventName, 'return;');
			isSupported = typeof el[eventName] == 'function';
		}
		el = null;
		return isSupported;
	}

	function subscribeMouseenter(element, fn, thisContext) {
		subscribe('mouseenter', element, fn, thisContext);
	}

	function subscribeMouseleave(element, fn, thisContext) {
		subscribe('mouseleave', element, fn, thisContext);
	}

	function subscribe(eventType, element, fn, thisContext) {
		if(mouseenterSupported) {
			return apiInternal.addListener(element, eventType, fn, thisContext);
		}
		else {
			var simulatedEventType = pairs[eventType];
			return apiInternal.addListener(element, simulatedEventType, _handleMouseboundary, element);
		}

		// If the event is being called on the element we're watching, trigger our function.
		// Otherwise, the event is not a top-level 'enter' or 'leave'.
		// Influenced by Stephen Stchur:
		// http://blog.stchur.com/2007/03/15/mouseenter-and-mouseleave-events-for-firefox-and-other-non-ie-browsers/
		function _handleMouseboundary(e) {
			var target = this;
			var relatedTarget = e.relatedTarget;
			// mouseover: relatedTarget is element moused *from*
			// mouseout: relatedTarget is element moused *to*

			if(!relatedTarget || (relatedTarget !== target && !containsChild(target, relatedTarget))) {
				fn.call(thisContext, e);
			}
		}
	}

	// Return if the parent element contains the child element somewhere
	// within its structure
	function containsChild(parent, child) {
		if (parent === child) {
			return false;
		}
		while (child && child !== parent) {
			child = child.parentNode;
		}

		return child === parent;
	}
});
