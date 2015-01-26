/**
 * Controls the First Time Experience for the user interface.
 *
 */
betterlink_user_interface.createModule("FTE", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "FTE Tooltip", "LastSubmission", "Drawer Slider", "Action Drawer", "Util.HTTP", "HTTP", "Smooth Scrolling", "Event Messaging"] );

	// Element Selectors. These should be dynamic to make the FTE
	// resilient.
	var TOOLTIP_SELECTOR = "#betterlink-tooltip";
	var DRAWER_ID = "betterlink-drawer";
	var NEXUS_CLASS = "betterlink-nexus";
	var PEN_CLASS = "betterlink-pen";
	var SELECTED_CLASS = "betterlink-selected";
	var DRAWER_BACKGROUND = "#E9E9E9";

	var BUTTON_CLASS = "betterlink-tooltip-btn";
	var BUTTON_CLASS_SECONDARY = "betterlink-tooltip-btn-secondary";
	var BUTTONS_CLASS = "betterlink-tooltip-btns";
	var MASK_CLASS = "betterlink-fte-mask";
	var MASK_OVERRIDE_CLASS = "betterlink-fte-mask-override";

	var CSS =
		[   TOOLTIP_SELECTOR + " ." + BUTTON_CLASS + " { background-color: #3299BB; border: 1px solid #277799; color: #FFF; font-size: 14px; margin: 5px; padding: 6px 12px; border-radius: .4em; display: inline-block; text-align: center; white-space: nowrap; vertical-align: middle; touch-action: manipulation; cursor: pointer; }",
			TOOLTIP_SELECTOR + " ." + BUTTON_CLASS + ":hover { background-color: #277799; }",
			TOOLTIP_SELECTOR + " ." + BUTTON_CLASS_SECONDARY + " { background-color: #BCBCBC; border: 1px solid #9B9B9B; }",
			TOOLTIP_SELECTOR + " ." + BUTTON_CLASS_SECONDARY + ":hover { background-color: #9B9B9B; }",
			TOOLTIP_SELECTOR + " ." + BUTTONS_CLASS + " { text-align: right; width: auto; margin-top: 5px }",
			TOOLTIP_SELECTOR + " p { margin-bottom: 6px; }",

			// The mask has a z-index one less than the maximum
			// Any overrides have a z-index that's the maximum value
			"." + MASK_CLASS + ":after { content: ''; background-color: #000; opacity: 0.6; display: block; position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 2147483646; }",
			"." + MASK_OVERRIDE_CLASS + "{ position: relative !important; box-shadow: 0 0 5px 2px #BCBCBC; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25); }"

		].join(' ');

	var stylesInitialized = false;
	var fteRun = false;
	var drawerLock;

	/****************************************************************************************************/

	apiInternal.events.registerObserverForRemoveBetterlink(closeFTE);
	apiInternal.addInitListener(loadFTE);

	// Register the FTE to run with the next successful submission
	function loadFTE() {
		if(api['config']['enableFTE']) {
			// Queries the server to determine if the user has already
			// viewed the FTE, based on registerFTE()
			apiInternal.checkFTE(decideToLoadFTE);

			// Everytime there is a new submission, refresh that the user
			// doesn't need the FTE. In the event the user *has not* seen
			// it, this will get called along with runIntro the first time.
			apiInternal.lastSubmission.subscribeSuccess.onsuccess(apiInternal.registerFTE);
		}
	}

	// Asynchronous check for whether we should load the FTE for this
	// user
	function decideToLoadFTE(errorInfo, response) {
		// If we can't get a response from the server, assume the user
		// *has not* seen the FTE. Rationale: we're currently only
		// displaying the FTE on the Betterlink landing page.
		if(errorInfo) {
			apiInternal.lastSubmission.subscribeSuccess.onsuccess(runIntro);
		}
		else {
			// Asynchronously parse the response JSON. Expected result:
			// { fte: '1' } indicates the user has seen the FTE
			apiInternal.util.http.parseJSONServerResponseAsync(response, function(parsedResponse) {
				if(Object.hasOwnProperty.call(parsedResponse, 'fte')) {
					if(parsedResponse['fte'] !== '1') {
						apiInternal.lastSubmission.subscribeSuccess.onsuccess(runIntro);
					}
				}
			});
		}
	}

	// STEP 1
	// This explains that a new link was created and allows the user
	// to demo visiting their new link
	function runIntro() {
		if(!fteRun) {
			// The core interface gets loaded via an init listener, just
			// like loadFTE(). This means we can't guarantee that the
			// drawer won't load *after* we attempt to subscribe the
			// onSuccess event listener. Therefore, we have to run the
			// initialization check here.
			if(!apiInternal.drawer.initialized) {
				fteRun = true;
				return;
			}

			fteRun = true;
			initializeStyles();

			var nexus = apiInternal.util.dom.getElementsByClassName(NEXUS_CLASS)[0];
			var tooltipContent = buildIntroTooltip();

			var drawer = document.getElementById(DRAWER_ID);
			drawerLock = apiInternal.slider.lockDrawerOpen();
			apiInternal.util.dom.applyClassToElement(drawer, MASK_CLASS);

			applyMaskOverrides(nexus, DRAWER_BACKGROUND);
			apiInternal.fteTooltip.addTooltipToDrawer(nexus, tooltipContent);
		}
	}

	// STEP 2
	// This highlights the next steps that are available to the user.
	// Specifically, sharing or saving the link.
	function runActionElements() {
		var pen = apiInternal.util.dom.getElementsByClassName(PEN_CLASS)[0];
		var tooltipContent = buildActionTooltip();

		removeMaskOverrides();
		applyMaskOverrides(pen, DRAWER_BACKGROUND);
		apiInternal.fteTooltip.addTooltipToDrawer(pen, tooltipContent);
	}

	// STEP 3
	// This communicates that the user can click on the previous submission
	// text to re-open the drawer
	function runReopenDrawer() {
		var selectedText = apiInternal.util.dom.getElementsByClassName(SELECTED_CLASS);
		if(selectedText && selectedText.length) {
			var firstSelectedText = selectedText[0];
			var tooltipContent = buildReopenTooltip();

			removeMaskOverrides();
			applyMaskOverrides(selectedText);
			apiInternal.fteTooltip.addTooltipToPage(firstSelectedText, tooltipContent);

			apiInternal.smoothScroll(TOOLTIP_SELECTOR.substr(1), {pixelBuffer: 125});
		}
	}

	function closeFTE(e) {
		if(e) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
		}

		var drawer = document.getElementById(DRAWER_ID);
		apiInternal.fteTooltip.remove();
		removeMaskOverrides();
		apiInternal.util.dom.removeClassFromElement(drawer, MASK_CLASS);
		apiInternal.slider.releaseDrawerLock(drawerLock);
	}

	/* ========================================================== */

	// Build the content for the tooltip for the Intro step
	function buildIntroTooltip() {
		var div = document.createElement('div');
		var btns = document.createElement('div');
		var primaryBtn = apiInternal.util.dom.createAnchorElement('Follow Your Link', apiInternal.lastSubmission.lastSuccessful.link, "_blank");
		var secondaryBtn = document.createElement('button');

		btns.className = BUTTONS_CLASS;
		primaryBtn.className = BUTTON_CLASS;
		secondaryBtn.className = BUTTON_CLASS + " " + BUTTON_CLASS_SECONDARY;
		secondaryBtn.type = 'button';
		secondaryBtn.appendChild(document.createTextNode('Not Now'));

		btns.appendChild(primaryBtn);
		btns.appendChild(secondaryBtn);

		var p1 = document.createElement('p');
		var p2 = document.createElement('p');
		p1.appendChild(document.createTextNode('You just created a new link!'));
		p2.appendChild(document.createTextNode('Following it will take you right back to the highlighted text.'));

		div.appendChild(p1);
		div.appendChild(p2);
		div.appendChild(btns);

		div.style.width = 'auto';

		apiInternal.addListener(secondaryBtn, "click", runActionElements);
		apiInternal.addListener(secondaryBtn, "touch", runActionElements);

		apiInternal.addListener(primaryBtn, "click", runActionElements);
		apiInternal.addListener(primaryBtn, "touch", runActionElements);

		return div;
	}

	// Build the content for the tooltip for the sharing/saving
	// links
	function buildActionTooltip() {
		var div = document.createElement('div');
		var btns = document.createElement('div');
		var primaryBtn = document.createElement('button');

		btns.className = BUTTONS_CLASS;
		primaryBtn.className = BUTTON_CLASS;
		primaryBtn.type = 'button';
		primaryBtn.appendChild(document.createTextNode('Continue'));

		btns.appendChild(primaryBtn);

		div.appendChild(document.createTextNode('Use these buttons to share or save your link.'));
		div.appendChild(btns);

		div.style.width = 'auto';

		apiInternal.addListener(primaryBtn, "click", runReopenDrawer);
		apiInternal.addListener(primaryBtn, "touch", runReopenDrawer);

		return div;
	}

	// Build the content for the tooltip for reopening the drawer
	function buildReopenTooltip() {
		var div = document.createElement('div');
		var btns = document.createElement('div');
		var primaryBtn = document.createElement('button');

		btns.className = BUTTONS_CLASS;
		primaryBtn.className = BUTTON_CLASS;
		primaryBtn.type = 'button';
		primaryBtn.appendChild(document.createTextNode('Done'));

		btns.appendChild(primaryBtn);

		div.appendChild(document.createTextNode('When the sidebar closes, you can reopen it by clicking on your selection.'));
		div.appendChild(btns);

		div.style.width = 'auto';

		apiInternal.addListener(primaryBtn, "click", closeFTE);
		apiInternal.addListener(primaryBtn, "touch", closeFTE);

		return div;
	}

	// Apply a class to the provided list of elements that will make them
	// 'pop out' of the background and display on top of the FTE mask.
	function applyMaskOverrides(elements, opt_background) {
		if(!elements.length) { elements = [elements]; }

		for(var i = 0, len = elements.length; i < len; i++) {
			apiInternal.util.dom.applyClassToElement(elements[i], MASK_OVERRIDE_CLASS);
			elements[i].style.setProperty("z-index", "2147483647", "important");
			if(opt_background) {
				elements[i].style.setProperty("background-color", opt_background, "important");
			}
		}
	}

	// Remove all instances of the MASK_OVERRIDE_CLASS
	function removeMaskOverrides() {
		var overrides = apiInternal.util.dom.getElementsByClassName(MASK_OVERRIDE_CLASS);
		for(var i = overrides.length-1; i >= 0; i--) {
			var override = overrides[i];
			apiInternal.util.dom.removeClassFromElement(override, MASK_OVERRIDE_CLASS);
			override.style.zIndex = '';
			override.style.backgroundColor = '';
		}
	}

	function initializeStyles() {
		if(!stylesInitialized) {
			stylesInitialized = true;
			apiInternal.util.dom.createAndAppendStyleElement(CSS);
		}
	}
});
