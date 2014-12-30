/**
 * Defines a drawer that will 'pop out' of the side of the browser window
 * and provide ways for the user to interact with the content they have
 * selected.
 *
 */
betterlink_user_interface.createModule("Action Drawer", function(api, apiInternal) {
	api.requireModules( ["Util", "Util.DOM", "Drawer Reset CSS", "Mouseboundary", "Neglected", "Draggable", "Drawer Slider", "Drawer Dropzone", "Dropzone.Nexus"] );

	var HTML5_CSS = "article, aside, footer, header, nav, section { display: block; }";
	var DRAWER_ID = extractId(apiInternal.drawerSelector);
	var DRAWER_HEADER_ID = DRAWER_ID + "-header";
	var DRAWER_CENTER_ID = DRAWER_ID + "-center";
	var DRAWER_FOOTER_ID = DRAWER_ID + "-footer";

	var TOP_LIST_ID = "betterlink-top-list";
	var HEADER_PROP_ID = 'betterlink-header-prop';
	var FOOTER_LINKS_ID = 'betterlink-footer-links';
	var FOOTER_ACTIVE_CLASS = 'betterlink-footer-active';
	var GITHUB_CLASS = 'betterlink-footer-github';

	// Drawer CSS
	// Full-height layout dervied from Steven Sanderson
	// http://blog.stevensanderson.com/2011/10/05/full-height-app-layouts-a-css-trick-to-make-it-easier/
	var DRAWER_CSS =
		[   ".betterlink-row, .betterlink-col { overflow: hidden; position: absolute; }",
			".betterlink-row { width: 100%; }",
			".betterlink-col { top: 0; bottom: 0; }",
			".betterlink-scroll-x { overflow-x: auto; }",
			".betterlink-scroll-y { overflow-y: auto; }",

			".betterlink-left.betterlink-col { width: 230px; }",
			".betterlink-right.betterlink-col { width: 230px; right: 0; }",

			apiInternal.drawerSelector + ".betterlink-header.betterlink-row { height: 75px; }",
			apiInternal.drawerSelector + ".betterlink-center.betterlink-row { top: 75px; bottom: 50px; }",
			apiInternal.drawerSelector + ".betterlink-footer.betterlink-row { height: 50px; bottom: 0; }",

			apiInternal.drawerSelector + ".betterlink-top-to-bottom { width: 100%; }",
			apiInternal.drawerSelector + ".betterlink-bottom-to-top { bottom: 0; position: absolute; width: 100%; }",

			apiInternal.drawerSelector + "#" + TOP_LIST_ID + " { margin: 0; padding: 0; }",
			apiInternal.drawerSelector + "#" + TOP_LIST_ID + ">li { list-style: none; }",

			"#" + DRAWER_ID + " { background: #E9E9E9; position: fixed; }",
			"#" + DRAWER_ID + ":after { content: ''; position: absolute; width: 1px; height: 100%; top: 75px; background: #DDD; }"
		].join(' ');

	var HEADER_CSS =
		[   apiInternal.drawerSelector + "#" + DRAWER_HEADER_ID + ">h1 { margin: 10px 0 3px 10px; }",
			apiInternal.drawerSelector + "#" + DRAWER_HEADER_ID + ">p { margin: 0 0 5px 10px; font-size: 80%; }",
			apiInternal.drawerSelector + "#" + HEADER_PROP_ID + " { height: 100%; float: left; width: 5px; background: #3299BB; }"].join(' ');

	var FOOTER_CSS =
		[	apiInternal.drawerSelector + "#" + DRAWER_FOOTER_ID + " { font-size: 70%; font-family: 'Open Sans', Arial, sans-serif; }",
			apiInternal.drawerSelector + "#" + FOOTER_LINKS_ID + " { position: absolute; margin-top: 5px; margin-right: 5px; right: 0; text-align: right; width: auto; }",
			apiInternal.drawerSelector + "#" + FOOTER_LINKS_ID + ">a { display: block; color: #424242; opacity: .5; text-decoration: none; -webkit-transition: opacity 0.3s ease; transition: opacity 0.3s ease; }",
			apiInternal.drawerSelector + "#" + FOOTER_LINKS_ID + ">a:hover { text-decoration: underline; }",
			apiInternal.drawerSelector + "#" + FOOTER_LINKS_ID + "." + FOOTER_ACTIVE_CLASS + ">a { opacity: 1; }",
			apiInternal.drawerSelector + "." + GITHUB_CLASS + " { width: 14px; height: 14px; margin-left: 3px; vertical-align: text-bottom; border: none; }"].join(' ');

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
		addDrawerToDOM();
	}

	function insertDrawerStyles() {
		var fullCss = apiInternal.drawerResetCss + ' ' + DRAWER_CSS + ' ' + HEADER_CSS + ' ' + FOOTER_CSS;

		apiInternal.util.dom.createAndAppendStyleElement(HTML5_CSS);
		apiInternal.util.dom.createAndAppendStyleElement(fullCss);
	}

	function addDrawerToDOM() {
		apiInternal.slider.initialize(drawer);
		apiInternal.util.dom.registerAndAppend(document.body, drawer);
	}

	// Use the Neglected event to indicate when the user has stopped interacting
	// with the drawer. We'll start watching once the drawer is open (to keep
	// accurate track of the mouse position), but only allow the drawer to close
	// once the user has stopped dragging their element and is no longer interacting
	// with the drawer.
	function showDrawer() {
		apiInternal.slider.slideDrawerIn();
		apiInternal.neglected.watchTarget(drawer, hideDrawer);
	}

	function hideDrawer() {
		apiInternal.slider.slideDrawerAway();
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

		var header = createHeader();

		var center = document.createElement('section');
		center.id = DRAWER_CENTER_ID;
		center.className = 'betterlink-center betterlink-row';
		var center_top = document.createElement('div');
		var center_bottom = document.createElement('div');
		center_top.className = 'betterlink-top-to-bottom';
		center_bottom.className = 'betterlink-bottom-to-top';

		addTopList(center_top);
		// center_bottom.appendChild();
		center.appendChild(center_top);
		center.appendChild(center_bottom);

		var footer = createFooter();

		drawer.appendChild(header);
		drawer.appendChild(center);
		drawer.appendChild(footer);
	}

	// Add a list of elements to the provided parent element
	function addTopList(element) {
		var list = document.createElement('ul');
		list.id = TOP_LIST_ID;
		list.appendChild(createNexus());

		element.appendChild(list);
	}

	function createNexus() {
		var li = document.createElement('li');

		var nexus = apiInternal.dropzone.sharingNexus.create(submissionFunction);
		li.appendChild(nexus);

		return li;
	}

	function createHeader() {
		var header = document.createElement('section');
		header.id = DRAWER_HEADER_ID;
		header.className = 'betterlink-header betterlink-row';

		var prop = document.createElement('div');
		prop.id = HEADER_PROP_ID;
		var h1 = document.createElement('h1');
		h1.appendChild(document.createTextNode("Betterlink"));
		var subtitle = document.createElement('p');
		subtitle.appendChild(document.createTextNode("drag & drop to share content"));

		header.appendChild(prop);
		header.appendChild(h1);
		header.appendChild(subtitle);

		return header;
	}

	function createFooter() {
		var footer = document.createElement('section');
		footer.id = DRAWER_FOOTER_ID;
		footer.className = 'betterlink-footer betterlink-row';

		var links = document.createElement('div');
		links.id = FOOTER_LINKS_ID;

		var homeLink = apiInternal.util.dom.createAnchorElement('http://betterlink.io', 'http://betterlink.io', '_blank');
		var contributeLink = apiInternal.util.dom.createAnchorElement('Open Source on GitHub', 'https://github.com/betterlink/betterlink-interface', '_blank');
		appendGithubLogo(contributeLink);

		links.appendChild(homeLink);
		links.appendChild(contributeLink);
		footer.appendChild(links);

		apiInternal.mouseboundary.subscribe.mouseenter(footer, activateFooter);
		apiInternal.mouseboundary.subscribe.mouseleave(footer, deactivateFooter);

		return footer;
	}

	function appendGithubLogo(element) {
		if(apiInternal.svg.supported) {
			var githubImg = apiInternal.svg.createElement('github');
			apiInternal.util.dom.applyClassToElement(githubImg, GITHUB_CLASS);
			element.appendChild(githubImg);
		}
	}

	function activateFooter() {
		var links = document.getElementById(FOOTER_LINKS_ID);
		apiInternal.util.dom.applyClassToElement(links, FOOTER_ACTIVE_CLASS);
	}

	function deactivateFooter() {
		var links = document.getElementById(FOOTER_LINKS_ID);
		apiInternal.util.dom.removeClassFromElement(links, FOOTER_ACTIVE_CLASS);
	}

	// selector is assumed to be a simple CSS ID selector
	// ex: "#betterlink-drawer "
	function extractId(selector) {
		return selector.replace(/[#\s]/g, '');
	}
});
