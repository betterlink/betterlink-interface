/**
 * Animates the page so that the Action Drawer slides in and out.
 * By default, the drawer will be hidden.
 *
 */
betterlink_user_interface.createModule("Drawer Slider", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS"] );

	var BODY_DRAWER_CLASS = "betterlink-drawer";
	var BODY_DISPLACED_CLASS = "betterlink-displaced";
	var BODY_POSITION_CLASS = "betterlink-position-absolute";

	var DRAWER_SLIDING_CLASS = "betterlink-drawer-slider";
	var DRAWER_OPEN_CLASS = "betterlink-drawer-open";
	var DRAWER_OFFPAGE_CLASS = 'betterlink-drawer-offpage';
	var DRAWER_ZINDEX_CLASS = 'betterlink-drawer-zindex';

	var TRANSITION_LENGTH = 400; // assumed less than 1000 and an even hundred

	var transitionString = "right 0." + TRANSITION_LENGTH/100 + "s linear;";
	var fullTransitionString = "-webkit-transition: " + transitionString + " transition: " + transitionString;

	var drawerCss =
		[   "." + DRAWER_SLIDING_CLASS + " { visibility: hidden; " + fullTransitionString + "}",
			"." + DRAWER_OPEN_CLASS + " { visibility: visible; }",
			"." + DRAWER_ZINDEX_CLASS + " { z-index: 2147483646; }" // max integer value - 1
			/* DRAWER_OFFPAGE_CLASS added below */
		].join(' ');

	var bodyCss =
		[   "body." + BODY_DRAWER_CLASS + " { right: 0; " + fullTransitionString + "}",
			"body." + BODY_POSITION_CLASS + " { position: absolute !important; }"
			/* BODY_DISPLACED_CLASS added below */
		].join(' ');

	var html = document.getElementsByTagName("html")[0];
	var body = document.body;
	var stylesInitialized = false;
	var shouldDisplaceBody = false;
	var useZIndex = true;
	var drawerLocked = false;
	var locks = {};
	var animateDrawer;
	var bodyWidth;
	var drawer;

	apiInternal.slider = {
		initialize: initializeSlider,
		slideDrawerIn: slideDrawerIn,
		slideDrawerAway: slideDrawerAway,
		lockDrawerOpen: lockDrawerOpen,
		releaseDrawerLock: releaseDrawerLock
	};
	/****************************************************************************************************/

	apiInternal.events.registerObserverForRemoveBetterlink(removeBodyStyles);
	function removeBodyStyles() {
		apiInternal.util.dom.removeClassFromElement(body, BODY_POSITION_CLASS);
		apiInternal.util.dom.removeClassFromElement(body, BODY_DISPLACED_CLASS);
		apiInternal.util.dom.removeClassFromElement(body, BODY_DRAWER_CLASS);
		html.style.overflowX = '';
	}

	function initializeSlider(drawerElement, drawerWidth, opt_animate) {
		if(!stylesInitialized) {
			addBodyWidthToCss();
			addDisplacementDistanceToCss(drawerWidth);
			toggleAnimation(opt_animate);
			initializeStyles();
		}

		// Ideally, we would run a test in here to determine if we can
		// displace the body to move elements away from the drawer, or
		// if we need to resort to applying a z-index on the drawer.
		// The issue is related to a bug in WebKit that terminates drag
		// events when they are moved away from the mouse.
		// Bug: https://code.google.com/p/chromium/issues/detail?id=445641

		drawer = drawerElement;
		apiInternal.util.dom.applyClassToElement(body, BODY_DRAWER_CLASS);
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_SLIDING_CLASS);
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OFFPAGE_CLASS);
		if(useZIndex) {
			apiInternal.util.dom.applyClassToElement(drawer, DRAWER_ZINDEX_CLASS);
		}
	}

	// Display the drawer on the page and displace the body to make room. The body
	// needs to be displaced in the event that there are elements added to the page
	// that have a z-index applied. Otherwise, those elements may appear to cover
	// the drawer.
	function slideDrawerIn() {

		if(shouldDisplaceBody) {
			html.style.overflowX = 'hidden';
			apiInternal.util.dom.applyClassToElement(body, BODY_POSITION_CLASS);
			apiInternal.util.dom.applyClassToElement(body, BODY_DISPLACED_CLASS);
		}
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OPEN_CLASS);
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_OFFPAGE_CLASS);
	}

	// Hide the drawer and move the body back into position
	function slideDrawerAway() {
		if(!drawerLocked) {
			apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OFFPAGE_CLASS);
			if(shouldDisplaceBody) {
				apiInternal.util.dom.removeClassFromElement(body, BODY_DISPLACED_CLASS);
			}

			if(animateDrawer) {
				window.setTimeout(runReplacement, TRANSITION_LENGTH);
			}
			else {
				runReplacement();
			}
		}
	}

	function runReplacement() {
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_OPEN_CLASS);
		if(shouldDisplaceBody) {
			apiInternal.util.dom.removeClassFromElement(body, BODY_POSITION_CLASS);
			html.style.overflowX = '';
		}
	}

	// Toggle whether the CSS includes the transition styles. Also sets the
	// global variable.
	function toggleAnimation(shouldAnimate) {
		if(!shouldAnimate) {
			bodyCss = bodyCss.replace(fullTransitionString, '');
			drawerCss = drawerCss.replace(fullTransitionString, '');
		}
		animateDrawer = shouldAnimate;
	}

	// Gets the width of the body and adds it as a CSS attribute that will be added to
	// the page. Applying the width as a class seems more consistent than attempting
	// to apply as an inline style using 'body.style.width'.
	//
	// The width needs to be added to the body so that when it is displaced (via position:
	// absolute) the whole page appears to shift, instead of contracting.
	function addBodyWidthToCss() {
		bodyWidth = getBodyWidth();
		bodyCss = bodyCss.replace("position:", "width: " + bodyWidth + "px; position:");
	}

	function getBodyWidth() {
		return Math.max(body.scrollWidth, body.offsetWidth, body.clientWidth);
	}

	// Using the provided drawerWidth, insert two CSS styles that displace both the
	// body and drawer elements
	function addDisplacementDistanceToCss(drawerWidth) {
		var distance = drawerWidth || "230px";
		bodyCss = bodyCss + " body." + BODY_DISPLACED_CLASS + " { right: " + distance + " !important; }";
		drawerCss = drawerCss + " ." + DRAWER_OFFPAGE_CLASS + " { right: -" + distance + " !important; }";
	}

	// When called, this will prevent the drawer from closing once it is opened.
	// Once releaseDrawerLock is called (and all locks have been released), then
	// the drawer will finally close.
	//
	// This function returns an id that should be held by the client and provided
	// as the input for releaseDrawerLock.
	function lockDrawerOpen() {
		drawerLocked = true;
		var id = "" + Math.floor(1E8 * Math.random()); // arbitrary big number as a string
		locks[id] = 'x';

		return id;
	}

	// Release the provided lock and attempt to close the drawer
	function releaseDrawerLock(id) {
		delete locks[id];
		if(lockIsEmpty()) {
			drawerLocked = false;
			slideDrawerAway();
		}
	}

	// Return if there are any properties on the locks object (if there are
	// any active locks)
	function lockIsEmpty() {
		for(var key in locks) {
			if(locks.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	}

	function initializeStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(drawerCss + ' ' + bodyCss);
	}
});
