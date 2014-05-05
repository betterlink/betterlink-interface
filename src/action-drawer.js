/**
 * Defines a drawer that will 'pop out' of the side of the browser window
 * and provide ways for the user to interact with the content they have
 * selected.
 *
 */
betterlink_user_interface.createModule("Action Drawer", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Draggable"] );

	var HTML5_CSS = "article, aside, footer, header, nav, section { display: block; }";
	var DRAWER_ID = "betterlink-drawer";
	var DROPPABLE_CLASS = "betterlink-droppable";
	var DROPPABLE_HOVER_CLASS = "betterlink-droppable-hover";
	var DRAWER_HIDDEN_CLASS = "betterlink-drawer-hidden";
	var DRAWER_HIDDEN_CSS = "{ display: none; }"

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

			"." + DROPPABLE_CLASS + " { padding: 10px; width: initial; border: 1px solid black; background: inherit; border-radius: 0; margin: 0; }",
			"." + DROPPABLE_CLASS + "." + DROPPABLE_HOVER_CLASS + " { background-color: darkgray; }",

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
		addDropHandler();
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
		apiInternal.draggable.subscribe.dragstart(showDrawer);
		apiInternal.draggable.subscribe.dragend(hideDrawer);
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
		body.innerHTML = '<div class="betterlink-droppable">Drop Here</div>';

		var footer = document.createElement('section');
		footer.className = 'footer row';
		footer.appendChild(document.createTextNode('My Footer'));

		drawer.appendChild(header);
		drawer.appendChild(body);
		drawer.appendChild(footer);

		hideDrawer();
		apiInternal.util.dom.registerAndAppend(document.body, drawer);
	}

	function addDropHandler() {
		var nodes = apiInternal.util.dom.getElementsByClassName(DROPPABLE_CLASS);
		apiInternal.draggable.addDropHandlers(nodes);
		apiInternal.draggable.subscribe.drop(dropCallback);
	}

	function dropCallback(item, dropzone) {
		console.log(item);
		console.log("just dropped in");
		console.log(dropzone);
	}
});
