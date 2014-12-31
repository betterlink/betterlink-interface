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

	var TRANSITION_LENGTH = 400; // assumed less than 1000 and an even hundred

	var transitionString = "right 0." + TRANSITION_LENGTH/100 + "s linear;";
	var fullTransitionString = "-webkit-transition: " + transitionString + " transition: " + transitionString;

	var drawerCss =
		[   "." + DRAWER_SLIDING_CLASS + " { visibility: hidden; " + fullTransitionString + "}",
			"." + DRAWER_OPEN_CLASS + " { visibility: visible; }"
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
	var animateDrawer;
	var bodyWidth;
	var drawer;

	apiInternal.slider = {
		initialize: initializeSlider,
		slideDrawerIn: slideDrawerIn,
		slideDrawerAway: slideDrawerAway
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

		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OPEN_CLASS);
		apiInternal.util.dom.applyClassToElement(body, BODY_POSITION_CLASS);
		apiInternal.util.dom.applyClassToElement(body, BODY_DISPLACED_CLASS);
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_OFFPAGE_CLASS);
	}

	// Hide the drawer and move the body back into position
	function slideDrawerAway() {
		apiInternal.util.dom.applyClassToElement(drawer, DRAWER_OFFPAGE_CLASS);
		apiInternal.util.dom.removeClassFromElement(body, BODY_DISPLACED_CLASS);

		if(animateDrawer) {
			window.setTimeout(runReplacement, TRANSITION_LENGTH);
		}
		else {
			runReplacement();
		}
	}

	function runReplacement() {
		apiInternal.util.dom.removeClassFromElement(body, BODY_POSITION_CLASS);
		apiInternal.util.dom.removeClassFromElement(drawer, DRAWER_OPEN_CLASS);
		html.style.overflowX = '';
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

	function initializeStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(drawerCss + ' ' + bodyCss);
	}
});
