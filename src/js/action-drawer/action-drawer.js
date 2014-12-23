/**
 * Defines a drawer that will 'pop out' of the side of the browser window
 * and provide ways for the user to interact with the content they have
 * selected.
 *
 */
betterlink_user_interface.createModule("Action Drawer", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Neglected", "Draggable", "Drawer Dropzone", "Dropzone.Nexus"] );

	var HTML5_CSS = "article, aside, footer, header, nav, section { display: block; }";
	var DRAWER_ID = "betterlink-drawer";
	var DRAWER_HEADER_ID = DRAWER_ID + "-header";
	var DRAWER_CENTER_ID = DRAWER_ID + "-center";
	var DRAWER_FOOTER_ID = DRAWER_ID + "-footer";

	var DRAWER_HIDDEN_CLASS = "betterlink-drawer-hidden";
	var DROPZONES_LIST_ID = "betterlink-dropzones";

	// Drawer Animation
	// http://www.berriart.com/sidr/
	// http://jpanelmenu.com/

	// Drawer CSS
	var DRAWER_CSS = 
		[   ".betterlink-row, .betterlink-col { overflow: hidden; position: absolute; }",
			".betterlink-row { width: 100%; }",
			".betterlink-col { top: 0; bottom: 0; }",
			".betterlink-scroll-x { overflow-x: auto; }",
			".betterlink-scroll-y { overflow-y: auto; }",

			".betterlink-left.betterlink-col { width: 230px; }",
			".betterlink-right.betterlink-col { width: 230px; right: 0; }",

			".betterlink-header.betterlink-row { height: 75px; line-height: 75px; }",
			".betterlink-center.betterlink-row { top: 75px; bottom: 50px; }",
			".betterlink-footer.betterlink-row { height: 50px; bottom: 0; line-height: 50px; }",

			".betterlink-top-to-bottom { width: 100%; }",
			".betterlink-bottom-to-top { bottom: 0; position: absolute; width: 100%; }",
			"div.betterlink-reset { padding: 0; margin: 0; border: none; background: inherit; border-radius: 0; }",

			"#" + DRAWER_HEADER_ID + " { text-align: center; border-bottom: 1px solid black; }",
			"#" + DRAWER_FOOTER_ID + " { text-align: center; border-top: 1px solid black; }",

			"#" + DROPZONES_LIST_ID + " { margin: 0; padding: 0; }",
			"#" + DROPZONES_LIST_ID + ">li { list-style: none; }",

			"#" + DRAWER_ID + " { background: lightcoral; position: fixed; }",
			"." + DRAWER_HIDDEN_CLASS + " { display: none; }"].join(' ');

	var drawer;
	var submissionFunction;

	apiInternal.drawer = {
		create: initializeDrawer,
		show: showDrawer,
		hide: hideDrawer
	};

	/****************************************************************************************************/

	function initializeDrawer(submissionFn) {
		if(apiInternal.drawer.initialized)
			return;

		apiInternal.drawer.initialized = true;
		submissionFunction = submissionFn;

		insertDrawerStyles();
		createDrawer();
		toggleDrawerOnDrag();
	}

	function insertDrawerStyles() {
		apiInternal.util.dom.createAndAppendStyleElement(HTML5_CSS);
		apiInternal.util.dom.createAndAppendStyleElement(DRAWER_CSS);
	}

	// Use the Neglected event to indicate when the user has stopped interacting
	// with the drawer. We'll start watching once the drawer is open (to keep
	// accurate track of the mouse position), but only allow the drawer to close
	// once the user has stopped dragging their element and is no longer interacting
	// with the drawer.
	function showDrawer() {
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_HIDDEN_CLASS);
		apiInternal.neglected.watchTarget(drawer, hideDrawer);
	}

	function hideDrawer() {
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_HIDDEN_CLASS);
		apiInternal.neglected.stopWatchingTarget(drawer, hideDrawer);
	}

	function allowDrawerToClose() {
		apiInternal.neglected.actOnTarget(drawer, hideDrawer);
	}

	// Show and hide the Action Drawer when the user starts/stops dragging selected
	// content
	function toggleDrawerOnDrag() {
		apiInternal.draggable.subscribeGlobal.dragstart(showDrawer);
		apiInternal.draggable.subscribeGlobal.dragend(allowDrawerToClose);
	}

	function createDrawer() {
		drawer = document.createElement('aside');
		drawer.id = DRAWER_ID;
		drawer.className = 'betterlink-right betterlink-col';

		var header = document.createElement('section');
		header.id = DRAWER_HEADER_ID;
		header.className = 'betterlink-header betterlink-row';
		header.appendChild(document.createTextNode('My Header'));

		var center = document.createElement('section');
		center.id = DRAWER_CENTER_ID;
		center.className = 'betterlink-center betterlink-row';
		var center_top = document.createElement('div');
		var center_bottom = document.createElement('div');
		center_top.className = 'betterlink-top-to-bottom betterlink-reset';
		center_bottom.className = 'betterlink-bottom-to-top betterlink-reset';

		addDropzones(center_top);
		// center_bottom.appendChild();
		center.appendChild(center_top);
		center.appendChild(center_bottom);

		var footer = document.createElement('section');
		footer.id = DRAWER_FOOTER_ID;
		footer.className = 'betterlink-footer betterlink-row';
		footer.appendChild(document.createTextNode('My Footer'));

		drawer.appendChild(header);
		drawer.appendChild(center);
		drawer.appendChild(footer);

		hideDrawer();
		apiInternal.util.dom.registerAndAppend(document.body, drawer);
	}

	// Add a list of Dropzone elements to the provide parent element
	function addDropzones(element) {
		var list = document.createElement('ul');
		list.id = DROPZONES_LIST_ID;
		list.appendChild(createNexus());

		element.appendChild(list);
	}

	function createNexus() {
		var li = document.createElement('li');

		var nexus = apiInternal.dropzone.sharingNexus.create(submissionFunction);
		li.appendChild(nexus);

		return li;
	}
});
