/**
 * Controls the First Time Experience for the user interface.
 *
 */
betterlink_user_interface.createModule("FTE", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "FTE Tooltip", "LastSubmission", "Drawer Slider", "Event Messaging"] );

	// Element Selectors. These should be dynamic to make the FTE
	// resilient.
	var TOOLTIP_SELECTOR = "#betterlink-tooltip";
	var NEXUS_CLASS = "betterlink-nexus";
	var PEN_CLASS = "betterlink-pen";
	var SELECTED_CLASS = "betterlink-selected";

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

			// The mask has a z-index two less than the drawer (which has the maximum value)
			// Any overrides have a z-index that's one less
			"body." + MASK_CLASS + ":after { content: ''; background-color: #000; opacity: 0.6; display: block; position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 2147483645; }",
			"." + MASK_OVERRIDE_CLASS + "{ position: relative !important; }"

		].join(' ');

	var stylesInitialized = false;
	var fteRun = false;
	var drawerLock;

	/****************************************************************************************************/

	apiInternal.events.registerObserverForRemoveBetterlink(closeFTE);
	apiInternal.addInitListener(loadFTE);

	// Register the FTE to run with the next successful submission
	function loadFTE() {
		initializeStyles();
		apiInternal.lastSubmission.subscribeSuccess.onsuccess(runIntro);
	}

	// STEP 1
	// This explains that a new link was created and allows the user
	// to demo visiting their new link
	function runIntro() {
		if(!fteRun) {
			fteRun = true;

			var nexus = apiInternal.util.dom.getElementsByClassName(NEXUS_CLASS)[0];
			var tooltipContent = buildIntroTooltip();

			drawerLock = apiInternal.slider.lockDrawerOpen();
			apiInternal.util.dom.applyClassToElement(document.body, MASK_CLASS);
			apiInternal.fteTooltip.addTooltipToDrawer(nexus, tooltipContent);
		}
	}

	// STEP 2
	// This highlights the next steps that are available to the user.
	// Specifically, sharing or saving the link.
	function runActionElements() {
		var pen = apiInternal.util.dom.getElementsByClassName(PEN_CLASS)[0];
		var tooltipContent = buildActionTooltip();

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

			applyMaskOverrides(selectedText);
			apiInternal.fteTooltip.addTooltipToPage(firstSelectedText, tooltipContent);
		}
	}

	function closeFTE(e) {
		if(e) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
		}

		apiInternal.fteTooltip.remove();
		removeMaskOverrides();
		apiInternal.util.dom.removeClassFromElement(document.body, MASK_CLASS);
		apiInternal.slider.releaseDrawerLock(drawerLock);
	}

	/* ========================================================== */

	// Build the content for the tooltip for the Intro step
	function buildIntroTooltip() {
		var div = document.createElement('div');
		var btns = document.createElement('div');
		var primaryBtn = apiInternal.util.dom.createAnchorElement('Try It', apiInternal.lastSubmission.lastSuccessful.link, "_blank");
		var secondaryBtn = document.createElement('button');

		btns.className = BUTTONS_CLASS;
		primaryBtn.className = BUTTON_CLASS;
		secondaryBtn.className = BUTTON_CLASS + " " + BUTTON_CLASS_SECONDARY;
		secondaryBtn.type = 'button';
		secondaryBtn.appendChild(document.createTextNode('Not Now'));

		btns.appendChild(primaryBtn);
		btns.appendChild(secondaryBtn);

		div.appendChild(document.createTextNode('Your new link takes you right back to the highlighted text.'));
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

		div.appendChild(document.createTextNode('You can use these buttons to share or save your link.'));
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

		div.appendChild(document.createTextNode('When the sidebar closes, you can click on your selection to reopen it.'));
		div.appendChild(btns);

		div.style.width = 'auto';

		apiInternal.addListener(primaryBtn, "click", closeFTE);
		apiInternal.addListener(primaryBtn, "touch", closeFTE);

		return div;
	}

	// Apply a class to the provided list of elements that will make them
	// 'pop out' of the background and display on top of the FTE mask.
	function applyMaskOverrides(elements) {
		for(var i = 0, len = elements.length; i < len; i++) {
			apiInternal.util.dom.applyClassToElement(elements[i], MASK_OVERRIDE_CLASS);
			elements[i].style.setProperty("z-index", "2147483646", "important");
		}
	}

	// Remove all instances of the MASK_OVERRIDE_CLASS
	function removeMaskOverrides() {
		var overrides = apiInternal.util.dom.getElementsByClassName(MASK_OVERRIDE_CLASS);
		for(var i = overrides.length-1; i >= 0; i--) {
			var override = overrides[i];
			apiInternal.util.dom.removeClassFromElement(override, MASK_OVERRIDE_CLASS);
			override.style.zIndex = '';
		}
	}

	function initializeStyles() {
		if(!stylesInitialized) {
			stylesInitialized = true;
			apiInternal.util.dom.createAndAppendStyleElement(CSS);
		}
	}
});
