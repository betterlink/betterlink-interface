/**
 * Animates the page so that the Action Drawer slides in and out.
 * By default, the drawer will be hidden.
 *
 */
betterlink_user_interface.createModule("Drawer Slider", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS"] );

	var BODY_DRAWER_CLASS = "betterlink-drawer";
	var BODY_DISPLACED_CLASS = "betterlink-displaced";

	var DRAWER_SLIDING_CLASS = "betterlink-drawer-slider";
	var DRAWER_OPEN_CLASS = "betterlink-drawer-open";
	var DRAWER_OFFPAGE_CLASS = 'betterlink-drawer-offpage';

	var DRAWER_WIDTH = '230px';

	var DRAWER_CSS =
		[   "." + DRAWER_SLIDING_CLASS + " { visibility: hidden; }",
			"." + DRAWER_OPEN_CLASS + " { visibility: visible; }",
			"." + DRAWER_OFFPAGE_CLASS + " { right: -230px !important; }"
		].join(' ');

	var BODY_CSS =
		[   "body." + BODY_DRAWER_CLASS + " { right: 0; }",
			"body." + BODY_DISPLACED_CLASS + " { right: 230px !important; position: absolute !important; }"
		].join(' ');

	var html = document.getElementsByTagName("html")[0];
	var body = document.body;
	var stylesInitialized = false;
	var bodyWidth;
	var drawer;

	apiInternal.slider = {
		initialize: initializeSlider,
		slideDrawerIn: slideDrawerIn,
		slideDrawerAway: slideDrawerAway
	};
	/****************************************************************************************************/

	function initializeSlider(drawerElement) {
		if(!stylesInitialized) {
			addBodyWidthToCss();
			initializeStyles();
		}

		drawer = drawerElement;
		apiInternal.util.dom.applyClassToElement(body, BODY_DRAWER_CLASS);
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_SLIDING_CLASS);
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OFFPAGE_CLASS);
	}

	// Display the drawer on the page and displace the body to make room. The body
	// needs to be displaced in the event that there are elements added to the page
	// that have a z-index applied. Otherwise, those elements may appear to cover
	// the drawer.
	function slideDrawerIn() {
		html.style.overflowX = 'hidden';

		apiInternal.util.dom.applyClassToElement(body, BODY_DISPLACED_CLASS);
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OPEN_CLASS);
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_OFFPAGE_CLASS);
	}

	// Hide the drawer and move the body back into position
	function slideDrawerAway() {
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OFFPAGE_CLASS);
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_OPEN_CLASS);
		apiInternal.util.dom.removeClassFromElement(body, BODY_DISPLACED_CLASS);
		html.style.overflowX = '';
	}

	// Gets the width of the body and adds it as a CSS attribute that will be added to
	// the page. Applying the width as a class seems more consistent than attempting
	// to apply as an inline style using 'body.style.width'.
	//
	// The width needs to be added to the body so that when it is displaced (via position:
	// absolute) the whole page appears to shift, instead of contracting.
	function addBodyWidthToCss() {
		bodyWidth = getBodyWidth();
		BODY_CSS = BODY_CSS.replace("position:", "width: " + bodyWidth + "px; position:");
	}

	function getBodyWidth() {
		return Math.max(body.scrollWidth, body.offsetWidth, body.clientWidth);
	}

	function initializeStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(DRAWER_CSS + ' ' + BODY_CSS);
	}
});
