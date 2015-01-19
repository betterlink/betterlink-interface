/**
 * Controls the First Time Experience for the user interface.
 *
 */
betterlink_user_interface.createModule("FTE", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "FTE Tooltip", "LastSubmission", "Drawer Slider"] );

	var TOOLTIP_SELECTOR = "betterlink-tooltip";

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
		apiInternal.lastSubmission.subscribeSuccess.onsuccess(testFTE);
	}

	function testFTE() {
		if(!fteRun) {
			fteRun = true;

			var nexus = document.getElementsByClassName('betterlink-nexus')[0];
			var drawer = document.getElementById('betterlink-drawer');
			var tooltipContent = getIntroTooltip();

			drawerLock = apiInternal.slider.lockDrawerOpen();
			apiInternal.fteTooltip.addTooltipToDrawer(nexus, tooltipContent);
		}
	}

	function closeFTE(e) {
		if(e) {
			e.preventDefault ? e.preventDefault() : window.event.returnValue = false;
		}

		apiInternal.fteTooltip.remove();
		apiInternal.slider.releaseDrawerLock(drawerLock);
	}

	function getIntroTooltip() {
		var div = document.createElement('div');
		var btns = document.createElement('div');
		var primaryBtn = apiInternal.util.dom.createAnchorElement('Try It', apiInternal.lastSubmission.lastSuccessful.link, "_blank");
		var secondaryBtn = apiInternal.util.dom.createAnchorElement('Not Now', '#');

		btns.className = BUTTONS_CLASS;
		primaryBtn.className = BUTTON_CLASS;
		secondaryBtn.className = BUTTON_CLASS + " " + BUTTON_CLASS_SECONDARY;

		btns.appendChild(primaryBtn);
		btns.appendChild(secondaryBtn);

		div.appendChild(document.createTextNode('Your new link takes you right back to the highlighted text.'));
		div.appendChild(btns);

		div.style.width = 'auto';

		apiInternal.addListener(secondaryBtn, "click", closeFTE);
		apiInternal.addListener(secondaryBtn, "touch", closeFTE);

		return div;
	}

	function initializeStyles() {
		if(!stylesInitialized) {
			stylesInitialized = true;
			apiInternal.util.dom.createAndAppendStyleElement(CSS);
		}
	}
});
