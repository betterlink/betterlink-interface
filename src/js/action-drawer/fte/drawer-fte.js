/**
 * Controls the First Time Experience for the user interface.
 *
 */
betterlink_user_interface.createModule("FTE", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "FTE Tooltip", "LastSubmission", "Drawer Slider"] );

	// Element Selectors. These should be dynamic to make the FTE
	// resilient.
	var TOOLTIP_SELECTOR = "#betterlink-tooltip";
	var NEXUS_CLASS = "betterlink-nexus";
	var PEN_CLASS = "betterlink-pen";
	var SELECTED_CLASS = "betterlink-selected";

	var BUTTON_CLASS = "betterlink-tooltip-btn";
	var BUTTON_CLASS_SECONDARY = "betterlink-tooltip-btn-secondary";
	var BUTTONS_CLASS = "betterlink-tooltip-btns";

	var CSS =
		[   TOOLTIP_SELECTOR + " ." + BUTTON_CLASS + " { background-color: #3299BB; border: 1px solid #277799; color: #FFF; font-size: 14px; margin: 5px; padding: 6px 12px; border-radius: .4em; display: inline-block; text-align: center; white-space: nowrap; vertical-align: middle; touch-action: manipulation; cursor: pointer; }",
			TOOLTIP_SELECTOR + " ." + BUTTON_CLASS + ":hover { background-color: #277799; }",
			TOOLTIP_SELECTOR + " ." + BUTTON_CLASS_SECONDARY + " { background-color: #BCBCBC; border: 1px solid #9B9B9B; }",
			TOOLTIP_SELECTOR + " ." + BUTTON_CLASS_SECONDARY + ":hover { background-color: #9B9B9B; }",
			TOOLTIP_SELECTOR + " ." + BUTTONS_CLASS + " { text-align: right; width: auto; margin-top: 5px }"
		].join(' ');

	var stylesInitialized = false;
	var fteRun = false;
	var drawerLock;

	/****************************************************************************************************/

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

			var nexus = document.getElementsByClassName(NEXUS_CLASS)[0];
			var tooltipContent = buildIntroTooltip();

			drawerLock = apiInternal.slider.lockDrawerOpen();
			apiInternal.fteTooltip.addTooltipToDrawer(nexus, tooltipContent);
		}
	}

	// STEP 2
	// This highlights the next steps that are available to the user.
	// Specifically, sharing or saving the link.
	function runActionElements() {
		var pen = document.getElementsByClassName(PEN_CLASS)[0];
		var tooltipContent = buildActionTooltip();

		apiInternal.fteTooltip.addTooltipToDrawer(pen, tooltipContent);
	}

	// STEP 3
	// This communicates that the user can click on the previous submission
	// text to re-open the drawer
	function runReopenDrawer(e) {
		//
	}

	function closeFTE(e) {
		if(e) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
		}

		apiInternal.fteTooltip.remove();
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

		apiInternal.addListener(primaryBtn, "click", closeFTE);
		apiInternal.addListener(primaryBtn, "touch", closeFTE);

		return div;
	}

	function initializeStyles() {
		if(!stylesInitialized) {
			stylesInitialized = true;
			apiInternal.util.dom.createAndAppendStyleElement(CSS);
		}
	}
});
