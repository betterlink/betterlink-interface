/**
 * Exposes a basic API to add Drag & Drop event handlers to HTML
 * elements.
 *
 */
betterlink_user_interface.createModule("Draggable", function(api, apiInternal) {
	api.requireModules( ["Util"] );

	var currentDragItem;

	apiInternal.draggable = {
		addDragHandlers: function(elements) {
			addHandlers(elements, true);
		},

		addDropHandlers: function(elements, dropCallback) {
			addHandlers(elements, false, dropCallback);
		}
	};

	/****************************************************************************************************/

	function addHandlers(elements, isDrag, opt_callback) {
		if(elements.length) {
			apiInternal.util.forEach(elements, function(el) {
				_addHandlers(el, isDrag, opt_callback);
			});
		}
		else {
			_addHandlers(elements, isDrag, opt_callback);
		}

		function _addHandlers(element, isDrag, opt_callback) {
			if(isDrag) {
				apiInternal.addListener(element, "dragstart", setDragItem, element);
				apiInternal.addListener(element, "drag", handleDrag);
				apiInternal.addListener(element, "dragend", removeDragItem);
			}
			else {
				apiInternal.addListener(element, "dragenter", handleDragenter);
				apiInternal.addListener(element, "dragover", handleDragover);
				apiInternal.addListener(element, "dragleave", handleDragleave);
				apiInternal.addListener(element, "drop", handleDrop);
			}

			// Will execute a custom callback function, passing in the HTML element
			// that is dropped. Relies on a closure to the addDropHandlers() method
			// as well as a shared reference to the item that is being dragged.
			function handleDrop(e) {
				var dropCallback = opt_callback;
				dropCallback(currentDragItem);
			}
		}
	}

	// **** Drag Events ****
	function setDragItem(e) {
		// currentTarget will typically refer to the element on which we placed our
		// event handler. This is what we want, instead of attempting to store the
		// Text Node that's a child of our link.
		// Internet Explorer doesn't support currentTarget, but `this` communicates
		// the same thing if we pass the element into the event handler as the `this`
		// context.
		currentDragItem = e.currentTarget || this;
	}

	function handleDrag(e) {

	}

	function removeDragItem(e) {
		currentDragItem = null;
	}

	// **** Drop Events ****
	function handleDragenter(e) {
		e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
	}

	function handleDragover(e) {
		e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
	}

	function handleDragleave(e) {
		
	}
});
