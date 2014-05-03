/**
 * Exposes a basic API to add Drag & Drop event handlers to HTML
 * elements.
 *
 */
betterlink_user_interface.createModule("Draggable", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM"] );

	var DRAGSTART = 'dragstart',
		DRAG = 'drag',
		DRAGEND = 'dragend',

		DRAGENTER = 'dragenter',
		DRAGOVER = 'dragover',
		DRAGLEAVE = 'dragleave',
		DROP = 'drop';

	var DRAG_CSS_CLASS = 'betterlink-draggable',
		DROP_CSS_CLASS = 'betterlink-droppable';

	var currentDragItem;
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
		// function will be notified when the event fires.
		subscribe: {
			// Occurs once when a watched element is first dragged
			//   callback params: the dragged element
			dragstart: function(fn) {
				subscribe(DRAGSTART, fn);
			},

			// Occurs continuously while an element is dragged
			//   callback params: the dragged element
			drag: function(fn) {
				subscribe(DRAG, fn);
			},

			// Occurs once when a watched element is no longer dragged. If
			// there is a 'drop' event, this will trigger afterwards.
			//   callback params: the dragged element
			dragend: function(fn) {
				subscribe(DRAGEND, fn);
			},

			// Occurs once when an element enters a watched dropzone
			//   callback params: the dragged element, the dropzone
			dragenter: function(fn) {
				subscribe(DRAGENTER, fn);
			},

			// Occurs continuously while an element is over a dropzone
			//   callback params: the dragged element, the dropzone
			dragover: function(fn) {
				subscribe(DRAGOVER, fn);
			},

			// Occurs once if an element is pulled out of a dropzone
			//   callback params: the dragged element, the dropzone
			dragleave: function(fn) {
				subscribe(DRAGLEAVE, fn);
			},

			// Occurs once if an element is dropped
			//   callback params: the dragged element, the dropzone
			drop: function(fn) {
				subscribe(DROP, fn);
			}
		},

		// Turn off Drag & Drop functions on the provided elements
		remove: function(elements) {
			removeClassname(elements);
			// removeHandlers(elements);
			// The difficulty with removing the event listeners is that the listeners are
			// scoped. In order to support 'this' handling for IE, we pass the element
			// into the addListener method. Internally, this creates a new function that
			// wraps the original listener. The side effect is that we cannot easily call
			// removeListener, because a modified version of the listener is used.
		}
	};

	/****************************************************************************************************/

	// Executes a provided function against all members of the 'target'. This is
	// just some shorthand that allows us to easily expose the Draggable API to
	// operate on a single element or array of elements.
	function executeForOneOrMany(target, fn, args) {
		if(target.length) {
			apiInternal.util.forEach(target, function(t) {
				fn.apply(this, [t].concat(args));
			});
		}
		else {
			fn.apply(this, [target].concat(args));
		}
	}

	function addHandlers(elements, isDrag) {
		executeForOneOrMany(elements, _addHandlers, Array.prototype.slice.call(arguments, 1));

		function _addHandlers(element, isDrag) {
			if(isDrag) {
				apiInternal.addListener(element, DRAGSTART, setDragItem, element);
				apiInternal.addListener(element, DRAG, handleDrag);
				apiInternal.addListener(element, DRAGEND, removeDragItem);
			}
			else {
				apiInternal.addListener(element, DRAGENTER, handleDragenter, element);
				apiInternal.addListener(element, DRAGOVER, handleDragover, element);
				apiInternal.addListener(element, DRAGLEAVE, handleDragleave, element);
				apiInternal.addListener(element, DROP, handleDrop, element);
			}
		}
	}

	// Add a classname to the provided elements to indicate that the elements are
	// drag & drop-able.
	function addClassname(elements, classname) {
		executeForOneOrMany(elements, _addClassname, Array.prototype.slice.call(arguments, 1));

		function _addClassname(element, classname) {
			apiInternal.util.dom.applyClassToElement(element, classname);
		}
	}

	// Remove the drag & drop classnames from the provided elements. Because it won't
	// be obvious which need to be removed, we should just attempt to remove both.
	function removeClassname(elements) {
		executeForOneOrMany(elements, _removeClassname, Array.prototype.slice.call(arguments, 1));

		function _removeClassname(element) {
			apiInternal.util.dom.removeClassFromElement(element, DRAG_CSS_CLASS);
			apiInternal.util.dom.removeClassFromElement(element, DROP_CSS_CLASS);
		}
	}

	// If a client subscribes to an event, store the callback associated with the
	// calling context and the event type that's being subscribed to.
	function subscribe(eventType, fn) {
		if(!eventSubscriptions[eventType]) {
			eventSubscriptions[eventType] = [];
		}
		eventSubscriptions[eventType].push({context: this, callback: fn});
	}

	// Alert all clients that the given event has fired. Pass all additional params
	// onto the client callback function.
	function fireEvents(eventType) {
		if(eventSubscriptions[eventType]) {
			var options = Array.prototype.slice.call(arguments, 1);
			apiInternal.util.forEach(eventSubscriptions[eventType], function(subscription) {
				subscription.callback.apply(subscription.context, options);
			});
		}
	}

	// ****** Drag Events ******
	function setDragItem(e) {
		// currentTarget will typically refer to the element on which we placed our
		// event handler. This is what we want (as opposed to target or srcElement),
		// instead of attempting to store the Text Node that's a child of our link.
		//
		// Internet Explorer doesn't support currentTarget, but `this` communicates
		// the same thing if we pass the element into the event handler as the `this`
		// context.
		currentDragItem = e.currentTarget || this;
		fireEvents(DRAGSTART, currentDragItem);
	}

	function handleDrag(e) {
		fireEvents(DRAG, currentDragItem);
	}

	function removeDragItem(e) {
		var formerDragItem = currentDragItem;
		currentDragItem = null;
		fireEvents(DRAGEND, formerDragItem);
	}

	// ****** Drop Events ******
	function handleDragenter(e) {
		if(watchedItemIsBeingDragged()) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

			var dropTarget = e.currentTarget || this;
			fireEvents(DRAGENTER, currentDragItem, dropTarget);
		}
	}

	function handleDragover(e) {
		if(watchedItemIsBeingDragged()) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

			var dropTarget = e.currentTarget || this;
			fireEvents(DRAGOVER, currentDragItem, dropTarget);
		}
	}

	function handleDragleave(e) {
		if(watchedItemIsBeingDragged()) {
			var dropTarget = e.currentTarget || this;
			fireEvents(DRAGLEAVE, currentDragItem, dropTarget);
		}
	}

	function handleDrop(e) {
		if(watchedItemIsBeingDragged()) {
			var dropTarget = e.currentTarget || this;
			fireEvents(DROP, currentDragItem, dropTarget);
		}
	}

	// Check if the element triggering the drop events is one of our elements
	// that we set drag handlers on
	function watchedItemIsBeingDragged() {
		return currentDragItem && apiInternal.util.dom.elementHasClass(currentDragItem, DRAG_CSS_CLASS);
	}
});