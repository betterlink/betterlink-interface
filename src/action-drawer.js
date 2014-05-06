/**
 * Defines a drawer that will 'pop out' of the side of the browser window
 * and provide ways for the user to interact with the content they have
 * selected.
 *
 */
betterlink_user_interface.createModule("Action Drawer", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Draggable", "Drawer Dropzone"] );

	var HTML5_CSS = "article, aside, footer, header, nav, section { display: block; }";
	var DRAWER_ID = "betterlink-drawer";
	var DRAWER_HIDDEN_CLASS = "betterlink-drawer-hidden";
	var DRAWER_HIDDEN_CSS = "{ display: none; }"
	var DROPZONES_LIST_ID = "betterlink-dropzones";

	// Drawer Animation
	// http://www.berriart.com/sidr/
	// http://jpanelmenu.com/

	// Drawer CSS
	var DRAWER_CSS = 
		[   ".row, .col { overflow: hidden; position: fixed; }",
			".row { width: 100%; position: absolute; }",
			".col { top: 0; bottom: 0; }",
			".scroll-x { overflow-x: auto; }",
			".scroll-y { overflow-y: auto; }",

			".left.col { width: 230px; }",
			".right.col { width: 230px; right: 0; }",
			".header.row { height: 75px; line-height: 75px; text-align: center; border-bottom: 1px solid black; }",
			".body.row { top: 75px; bottom: 50px; }",
			".footer.row { height: 50px; bottom: 0; line-height: 50px; text-align: center; border-top: 1px solid black; }",

			"#" + DROPZONES_LIST_ID + " { margin: 0; padding: 0; }",
			"#" + DROPZONES_LIST_ID + ">li { list-style: none; }",

			"#" + DRAWER_ID + " { background: lightcoral; }"].join(' ');

	var drawer;
	apiInternal.drawer = {
		show: showDrawer,
		hide: hideDrawer
	};

	/****************************************************************************************************/

	apiInternal.addInitListener(initializeDrawer);
	function initializeDrawer() {
		insertDrawerStyles();
		createDrawer();
		toggleDrawerOnDrag();
	}

	function insertDrawerStyles() {
		apiInternal.util.dom.createAndAppendStyleElement(HTML5_CSS);
		apiInternal.util.dom.createAndAppendStyleElement(DRAWER_CSS);
		apiInternal.util.dom.addCssByClass(DRAWER_HIDDEN_CLASS, DRAWER_HIDDEN_CSS);
	}

	// Display the drawer to the user
	function showDrawer() {
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_HIDDEN_CLASS);
	}

	// Hide the drawer from the user
	function hideDrawer() {
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_HIDDEN_CLASS);
	}

	// Show and hide the Action Drawer when the user starts/stops dragging selected
	// content
	function toggleDrawerOnDrag() {
		apiInternal.draggable.subscribeGlobal.dragstart(showDrawer);
		apiInternal.draggable.subscribeGlobal.dragend(hideDrawer);
	}

	function createDrawer() {
		drawer = document.createElement('aside');
		drawer.id = DRAWER_ID;
		drawer.className = 'right col';

		var header = document.createElement('section');
		header.className = 'header row';
		header.appendChild(document.createTextNode('My Header'));

		var body = document.createElement('section');
		body.className = 'body row';
		addDropzones(body);

		var footer = document.createElement('section');
		footer.className = 'footer row';
		footer.appendChild(document.createTextNode('My Footer'));

		drawer.appendChild(header);
		drawer.appendChild(body);
		drawer.appendChild(footer);

		hideDrawer();
		apiInternal.util.dom.registerAndAppend(document.body, drawer);
	}

	// Add a list of Dropzone elements to the provide parent element
	function addDropzones(element) {
		var list = document.createElement('ul');
		list.id = DROPZONES_LIST_ID;
		list.appendChild(createDropzone());

		element.appendChild(list);
	}

	// Create and return a generic dropzone element
	function createDropzone() {
		var li = document.createElement('li');
		var dropzone = apiInternal.dropzone.create();
		li.appendChild(dropzone.element);

		dropzone.subscribeToDrop(dropCallback);

		return li;
	}

	function dropCallback(draggedItem, dropzone) {
		console.log(draggedItem);
		console.log("just dropped in");
		console.log(dropzone);
	}
});
