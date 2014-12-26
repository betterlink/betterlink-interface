/**
 * Defines a DOM element that can serve as a dropzone for other elements
 * that are dragged around the page. Intended as a component of the
 * Action Drawer.
 *
 */
betterlink_user_interface.createModule("Drawer Dropzone", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS", "Draggable"] );

	var DROPZONE_CLASS = "betterlink-dropzone";
	var DROPZONE_HOVER_CLASS = "betterlink-dropzone-hover";

	var DROPZONE_CSS = apiInternal.drawerSelector +
		[   "." + DROPZONE_CLASS + " { padding: 10px; width: auto; border-width: 1px; border-style: solid; border-radius: 0; margin: 0; }",
			"." + DROPZONE_HOVER_CLASS + " { background-color: darkgray; }"].join(' ' + apiInternal.drawerSelector);

	var stylesInitialized = false;
	apiInternal.dropzone = {
		create: createDropzone,
		CLASS: DROPZONE_CLASS,
		HOVER_CLASS: DROPZONE_HOVER_CLASS
	};
	/****************************************************************************************************/

	// Creates a new Dropzone object that will be returned to the client
	function createDropzone(opt_text) {
		var dropzone = new Dropzone(opt_text || '');
		dropzone.initialize();
		return dropzone;
	}

	function Dropzone(textContent) {
		var dropzone = this;
		dropzone.text = textContent;
	}

	Dropzone.prototype = {
		initialize: function() {
			if(!this.initialized) {
				this.initialized = true;

				this.element = createDropzoneElement(this);
				addDropHandlers(this);
				subscribeToDragEvents(this);
				if(!stylesInitialized) {
					insertDropzoneStyles();
				}
			}
		},

		// Update the UI to indiate something is hovering over the dropzone
		highlight: function(dragItem, dropTarget) {
			apiInternal.util.dom.applyClassToElement(this.element, DROPZONE_HOVER_CLASS);
		},

		// Update the UI to indiate there is no longer anything hovering over the
		// dropzone
		unhiglight: function(dragItem, dropTarget) {
			apiInternal.util.dom.removeClassFromElement(this.element, DROPZONE_HOVER_CLASS);
		},

		// A suite of events that can be subscribed to. This passed-in function will
		// be notified when the event fires on this dropzone. Each callback will
		// receive two parameters (both DOM elements):
		//   currentDragitem, dropTarget

		// Occurs once when an element enters the dropzone
		subscribeToDragenter: function(fn, thisContext) {
			apiInternal.draggable.subscribeToElement.simpledragenter(this.element, fn, thisContext);
		},

		// Occurs once when an element leave the dropzone.
		// NOTE: Unlike the standard HTML spec, this will also fire on the drop event.
		//       This is because the drop event also indicates when an element is no
		//       longer being dragged over the dropzone.
		subscribeToDragleave: function(fn, thisContext) {
			apiInternal.draggable.subscribeToElement.simpledragleave(this.element, fn, thisContext);
		},

		// Occurs once if an element is dropped
		subscribeToDrop: function(fn, thisContext) {
			apiInternal.draggable.subscribeToElement.drop(this.element, fn, thisContext);
		}
	};

	function insertDropzoneStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(DROPZONE_CSS);
	}

	// Create the HTML element that will represent the Dropzone on the DOM
	function createDropzoneElement(dropzone) {
		var element = document.createElement('div');
		apiInternal.util.dom.applyClassToElement(element, DROPZONE_CLASS);
		if(dropzone.text) { element.appendChild(document.createTextNode(dropzone.text)); }
		return element;
	}

	// Allow this element to be droppable on the DOM
	function addDropHandlers(dropzone) {
		apiInternal.draggable.addDropHandlers(dropzone.element);
	}

	// Get notified when elements are dragged or dropped onto of this dropzone
	function subscribeToDragEvents(dropzone) {
		dropzone.subscribeToDragenter(dropzone.highlight, dropzone);
		dropzone.subscribeToDragleave(dropzone.unhiglight, dropzone);
	}
});
