/**
 * Exposes a basic API to add Drag & Drop event handlers to HTML
 * elements.
 *
 */
betterlink_user_interface.createModule("Draggable", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Event Messaging", "SingleEntryWatcher"] );

	var DRAGSTART = 'dragstart',
		DRAG = 'drag',
		DRAGEND = 'dragend',

		DRAGENTER = 'dragenter',
		DRAGOVER = 'dragover',
		DRAGLEAVE = 'dragleave',
		DROP = 'drop',
		SINGLE_ENTRY = apiInternal.singleEntryWatcher.SINGLE_ENTRY,
		SINGLE_EXIT = apiInternal.singleEntryWatcher.SINGLE_EXIT;
	var ALL_EVENTS = [DRAGSTART, DRAG, DRAGEND, DRAGENTER, DRAGOVER, DRAGLEAVE, DROP, SINGLE_ENTRY, SINGLE_EXIT];

	var DRAG_CSS_CLASS = 'betterlink-draggable',
		DROP_CSS_CLASS = 'betterlink-droppable';

	var currentDragItem;
	var dragGloballyRequested = false;
	var watchedElements = [];
	var eventSubscriptions = {};

	apiInternal.draggable = {
		addDragHandlers: function(elements) {
			addHandlers(elements, true);
			addClassname(elements, DRAG_CSS_CLASS);
		},

		addDropHandlers: function(elements) {
			addHandlers(elements, false);
			addClassname(elements, DROP_CSS_CLASS);
		},

		// Exposes a suite of events that can be subscribed to. The passed-in
		// function will be notified when the event fires on any application
		// element.
		subscribeGlobal: {
			// Occurs once when a watched element is first dragged
			//   callback params: the dragged element
			dragstart: function(fn, thisContext) {
				subscribe(null, DRAGSTART, fn, thisContext);
			},

			// Occurs continuously while an element is dragged
			//   callback params: the dragged element
			drag: function(fn, thisContext) {
				subscribe(null, DRAG, fn, thisContext);
			},

			// Occurs once when a watched element is no longer dragged. If
			// there is a 'drop' event, this will trigger afterwards.
			//   callback params: the dragged element
			dragend: function(fn, thisContext) {
				subscribe(null, DRAGEND, fn, thisContext);
			},

			// Occurs once when an element enters a watched dropzone
			//   callback params: the dragged element, the dropzone
			dragenter: function(fn, thisContext) {
				subscribe(null, DRAGENTER, fn, thisContext);
			},

			// Occurs continuously while an element is over a dropzone
			//   callback params: the dragged element, the dropzone
			dragover: function(fn, thisContext) {
				subscribe(null, DRAGOVER, fn, thisContext);
			},

			// Occurs once if an element is pulled out of a dropzone
			//   callback params: the dragged element, the dropzone
			dragleave: function(fn, thisContext) {
				subscribe(null, DRAGLEAVE, fn, thisContext);
			},

			// Occurs once if an element is dropped
			//   callback params: the dragged element, the dropzone
			drop: function(fn, thisContext) {
				subscribe(null, DROP, fn, thisContext);
			}
		},

		// Exposes a suite of events that can be subscribed to. The passed-in
		// function will be notified when the event fires on the specifically
		// provided element.
		subscribeToElement: {
			dragstart: function(element, fn, thisContext) {
				subscribe(element, DRAGSTART, fn, thisContext);
			},

			drag: function(element, fn, thisContext) {
				subscribe(element, DRAG, fn, thisContext);
			},

			dragend: function(element, fn, thisContext) {
				subscribe(element, DRAGEND, fn, thisContext);
			},

			dragenter: function(element, fn, thisContext) {
				subscribe(element, DRAGENTER, fn, thisContext);
			},

			dragover: function(element, fn, thisContext) {
				subscribe(element, DRAGOVER, fn, thisContext);
			},

			dragleave: function(element, fn, thisContext) {
				subscribe(element, DRAGLEAVE, fn, thisContext);
			},

			drop: function(element, fn, thisContext) {
				subscribe(element, DROP, fn, thisContext);
			},

			// A custom dragenter event. Fires when an element enters a watched
			// dropzone. Will not fire additional times for children of the
			// dropzone.
			simpledragenter: function(element, fn, thisContext) {
				var watcher = apiInternal.singleEntryWatcher.getOrCreate(element, fireEvents);

				subscribe(element, SINGLE_ENTRY, fn, thisContext);
				subscribe(element, DRAGENTER, watcher.enter, watcher);
			},

			// A custom dragleave event. Fires when an element leaves a watched
			// dropzone. Will not fire additional times for children of the
			// dropzone.
			simpledragleave: function(element, fn, thisContext) {
				var watcher = apiInternal.singleEntryWatcher.findExisting(element, fireEvents);
				if(!watcher) {
					apiInternal.warn("Could not find an existing watcher for", element);
				}

				subscribe(element, SINGLE_EXIT, fn, thisContext);
				subscribe(element, DRAGLEAVE, watcher.exit, watcher);
				subscribe(element, DROP, watcher.exit, watcher);
			}
		},

		// Turn off Drag & Drop functions on the provided elements
		remove: function(elements) {
			removeClassname(elements);
			stopFiringEvents(elements);
			removeSubscribedListeners(elements);
		},

		// If the provided element is currently being dragged, but for some reason
		// cannot finish its drag events (ex: the element will be removed before
		// dragend fires), then proactively fire the final event to alert clients
		// that the drag event is over.
		fireRemainingDragEvents: function(elements) {
			for(var i = 0, len = elements.length; i < len; i++) {
				if(elements[i] === currentDragItem) {
					handleDragend();
					break;
				}
			}
		}
	};

	/****************************************************************************************************/

	apiInternal.events.registerObserverForRemoveBetterlink(turnOffAllEvents);
	function turnOffAllEvents() {
		stopFiringEvents();
		removeSubscribedListeners();
	}

	function addHandlers(elements, isDrag) {
		if(!elements.length) { elements = [elements]; }

		for(var i = 0, len = elements.length; i < len; i++) {
			var element = elements[i];
			var alreadyWatched = getWatchedElement(element);
			// Note: As written, this prevents us from assigning both drag *and* drop listeners to the
			// same element.
			if(!alreadyWatched) {
				if(isDrag) {
					var watchedElement = { element: element };
					watchedElement[DRAGSTART] = apiInternal.addListener(element, DRAGSTART, handleDragstart, element);
					watchedElement[DRAGEND] = apiInternal.addListener(element, DRAGEND, handleDragend);
					if(dragGloballyRequested) { addDragEvent(watchedElement); }

					watchedElements.push(watchedElement);
				}
				else {
					var watchedElement = { element: element };
					watchedElement[DRAGENTER] = apiInternal.addListener(element, DRAGENTER, handleDragenter, element);
					watchedElement[DRAGOVER] = apiInternal.addListener(element, DRAGOVER, handleDragover, element);
					watchedElement[DRAGLEAVE] = apiInternal.addListener(element, DRAGLEAVE, handleDragleave, element);
					watchedElement[DROP] = apiInternal.addListener(element, DROP, handleDrop, element);

					watchedElements.push(watchedElement);
				}
			}
		}
	}

	// Treat 'drag' separately. It fires continuously while an item is dragging,
	// and there is no reason for this module to constantly handle it until
	// requested. Ideally, we'd do the same for 'dragover', but it's necessary for
	// us to cancel the default action for that event.
	//
	// If an element is provided, this indicates that an event is being subscribed
	// to the particular element. If not, this indicates the event is being
	// subscribed globally (for any element that fires the event).
	function ensureEventActivated(eventType, opt_element) {
		if(eventType === DRAG && !dragGloballyRequested) {
			if(opt_element) {
				var watchedElement = getWatchedElement(opt_element);
				if(watchedElement) {
					addDragEvent(watchedElement);
				}
				else {
					apiInternal.warn("Can't subscribe to", eventType, "event.", opt_element, "isn't firing events.");
				}
			}
			else {
				dragGloballyRequested = true;
				for(var i = 0, len = watchedElements.length; i < len; i++) {
					addDragEvent(watchedElements[i]);
				}
			}
		}
	}

	function addDragEvent(watchedElement) {
		if(!watchedElement[DRAG]) {
			watchedElement[DRAG] = apiInternal.addListener(watchedElement.element, DRAG, handleDrag);
		}
	}

	// Stop responding to drag events on the provided elements. If no elements
	// are provided, then stop responding to all drag events. Clean up
	// references to the watched elements to free up resources.
	function stopFiringEvents(elements) {
		if(elements) {
			// Remove handlers for the provided elements
			if(!elements.length) { elements = [elements]; }

			for(var i = 0, len = elements.length; i < len; i++) {
				var watchedElement = getWatchedElement(elements[i]);
				if(watchedElement) {
					removeHandlers(watchedElement);
					removeWatchedElement(elements[i]);
				}
			}
		}
		else {
			// Remove all handlers
			for(var i = 0, len = watchedElements.length; i < len; i++) {
				var watchedElement = watchedElements[i];
				if(watchedElement) {
					removeHandlers(watchedElement);
					watchedElements[i] = null;
				}
			}
		}
	}

	// Check the stored event listeners on the watched element and turn them off
	function removeHandlers(watchedElement) {
		for(var i = 0, len = ALL_EVENTS.length; i < len; i++) {
			var evt = ALL_EVENTS[i];
			if(watchedElement[evt]) {
				apiInternal.removeListener(watchedElement.element, evt, watchedElement[evt]);
			}
		}
	}

	// Remove all listeners that have subscribed specifically to drag events on the
	// provided elements. If no elements are provided, then remove all listeners.
	function removeSubscribedListeners(elements) {
		if(elements && !elements.length) { elements = [elements]; }

		// for each event type
		for(var i = 0, len = ALL_EVENTS.length; i < len; i++) {
			var eventType = ALL_EVENTS[i];
			if(eventSubscriptions[eventType]) {
				var subs = eventSubscriptions[eventType];
				// check each subscription
				// Run in reverse order because that's where there's more likely to be
				// events. While we *will* cover everything, this let's us address the
				// ones that matter first.
				for(var j = subs.length-1; j >= 0; j--) {
					if(elements && subs[j]) {
						var subscription = subs[j];
						if(subscription.watchedTarget) {
							// if the subscriptions's target matches a provided element,
							// remove the subscription
							for(var k = 0, kLen = elements.length; k < kLen; k++) {
								if(elements[k] === subscription.watchedTarget) {
									subs[j] = null;
								}
							}
						}
					}
					// if we're not targeting specific elements, remove the subscription
					else {
						subs[j] = null;
					}
				}
			}
		}
	}

	// Add a classname to the provided elements to indicate that the elements are
	// drag & drop-able.
	function addClassname(elements, classname) {
		if(!elements.length) { elements = [elements]; }

		for(var i = 0, len = elements.length; i < len; i++) {
			apiInternal.util.dom.applyClassToElement(elements[i], classname);
		}
	}

	// Remove the drag & drop classnames from the provided elements. Because it won't
	// be obvious which need to be removed, we should just attempt to remove both.
	function removeClassname(elements) {
		if(!elements.length) { elements = [elements]; }

		for(var i = 0, len = elements.length; i < len; i++) {
			apiInternal.util.dom.removeClassFromElement(elements[i], DRAG_CSS_CLASS);
			apiInternal.util.dom.removeClassFromElement(elements[i], DROP_CSS_CLASS);
		}
	}

	// If a client subscribes to an event, store the callback associated with the
	// calling context and the event type that's being subscribed to.
	function subscribe(element, eventType, fn, thisContext) {
		ensureEventActivated(eventType, element);

		if(!eventSubscriptions[eventType]) {
			eventSubscriptions[eventType] = [];
		}
		eventSubscriptions[eventType].push({context: thisContext || this, callback: fn, watchedTarget: element});
	}

	// Alert all clients that the given event has fired. Pass all additional params
	// onto the client callback function.
	function fireEvents(currentTarget, eventType) {
		if(eventSubscriptions[eventType]) {
			var options = Array.prototype.slice.call(arguments, 2);
			apiInternal.util.forEach(eventSubscriptions[eventType], function(subscription) {
				// Alert all global subscribers or any subscribers for this currentTarget
				if(subscription && (!subscription.watchedTarget || subscription.watchedTarget === currentTarget)) {
					subscription.callback.apply(subscription.context, options);
				}
			});
		}
	}

	// ****** Drag Events ******
	function handleDragstart(e) {
		// currentTarget will typically refer to the element on which we placed our
		// event handler. This is what we want (as opposed to target or srcElement),
		// instead of attempting to store the Text Node that's a child of our link.
		//
		// Internet Explorer doesn't support currentTarget, but `this` communicates
		// the same thing if we pass the element into the event handler as the `this`
		// context.
		currentDragItem = e.currentTarget || this;
		fireEvents(currentDragItem, DRAGSTART, currentDragItem);
	}

	function handleDrag(e) {
		fireEvents(currentDragItem, DRAG, currentDragItem);
	}

	function handleDragend(e) {
		var formerDragItem = currentDragItem;
		currentDragItem = null;
		fireEvents(formerDragItem, DRAGEND, formerDragItem);
	}

	// ****** Drop Events ******
	function handleDragenter(e) {
		if(watchedItemIsBeingDragged()) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

			var dropTarget = e.currentTarget || this;
			fireEvents(dropTarget, DRAGENTER, currentDragItem, dropTarget);
		}
	}

	function handleDragover(e) {
		if(watchedItemIsBeingDragged()) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

			var dropTarget = e.currentTarget || this;
			fireEvents(dropTarget, DRAGOVER, currentDragItem, dropTarget);
		}
	}

	function handleDragleave(e) {
		if(watchedItemIsBeingDragged()) {
			var dropTarget = e.currentTarget || this;
			fireEvents(dropTarget, DRAGLEAVE, currentDragItem, dropTarget);
		}
	}

	function handleDrop(e) {
		if(watchedItemIsBeingDragged()) {
			var dropTarget = e.currentTarget || this;
			fireEvents(dropTarget, DROP, currentDragItem, dropTarget);
		}
	}

	// Check if the element triggering the drop events is one of our elements
	// that we set drag handlers on
	function watchedItemIsBeingDragged() {
		return currentDragItem && apiInternal.util.dom.elementHasClass(currentDragItem, DRAG_CSS_CLASS);
	}

	// ************ Element Administration ************
	// Return the object that's holding references to event listeners
	// for the provided element.
	// The first elements will be the dropzones that are created on page load. Draggable
	// items will continuously be pushed to the end of the array (which are likely the
	// elements we're trying to access), so we should traverse in reverse order.
	function getWatchedElement(element) {
		for(var i = watchedElements.length-1; i >= 0; i--) {
			if(watchedElements[i] && watchedElements[i].element === element) {
				return watchedElements[i];
			}
		}
	}

	function removeWatchedElement(element) {
		for(var i = watchedElements.length-1; i >= 0; i--) {
			if(watchedElements[i] && watchedElements[i].element === element) {
				watchedElements[i] = null;
				break;
			}
		}
	}
});
