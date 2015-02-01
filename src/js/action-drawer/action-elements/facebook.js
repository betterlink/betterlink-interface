/**
 * Clickable div to share on Facebook
 *
 */
betterlink_user_interface.createModule("Facebook Element", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "SVG", "Drawer Reset CSS", "LastSubmission", "Share.Facebook"] );

	var FB_CLASS = "betterlink-fb";
	var DISABLED_CLASS = "betterlink-disabled";
	var CSS  =  apiInternal.drawerSelector + "div." + FB_CLASS + " { background-color: #3B5999; color: white; }" +
				apiInternal.drawerSelector + "img." + FB_CLASS + ":hover { background-color: #3B5999; border-radius: 1em; background-clip: content-box; }" +

				apiInternal.drawerSelector + "div." + FB_CLASS + "." + DISABLED_CLASS + " { background-color: #BCBCBC; opacity: 0.6; cursor: default; }" +
				apiInternal.drawerSelector + "img." + FB_CLASS + "." + DISABLED_CLASS + " { background-color: #BCBCBC; opacity: 0.6; cursor: default; border-radius: 1em; background-clip: content-box; }";

	/***************TOOLTIP***************/
	var TOOLTIP_ID = 'betterlink-action-element-tooltip';
	var TOOLTIP_SELECTOR = "#" + TOOLTIP_ID;
	var SHOW_TOOLTIP_CLASS = 'betterlink-tooltip-show';

	var backgroundColor = '#E9E9E9;';
	var backgroundRGB = hexToRGB(backgroundColor.replace(';',''));
	var backgroundRGBa = 'rgba(' + backgroundRGB.join(', ') + ', 0);';

	var borderColor = '#BCBCBC;';
	var borderRGB = hexToRGB(borderColor.replace(';',''));
	var borderRGBa = 'rgba(' + borderRGB.join(', ') + ', 0);';

	var borderWidth = 2;
	var arrowSize = 15; // the 'height' of the arrow from base-to-tip
	var arrowBorder = arrowSize + Math.round(borderWidth * 1.41421356); // cos(PI/4) * 2

	var tooltipCss =
		[   TOOLTIP_SELECTOR + " {",
					"background: " + backgroundColor,
					"border: " + borderWidth + "px solid " + borderColor,
					"box-shadow: 0px 8px 6px -6px rgba(0,0,0,.4);",
					"border-radius: 0;",
					"color: #424242;",
					"clear: none;",
					"font-family: Arial, sans-serif;",
					"font-size: 18px;",
					"font-weight: normal;",
					"letter-spacing: normal;",
					"line-height: normal;",
					"margin: 0;",
					"padding: 5px;",
					"text-align: left;",
					"min-width: " + (2 * (arrowSize+borderWidth)) + "px;", 
					"min-height: " + (2 * (arrowSize+borderWidth)) + "px;",
					"max-width: 300px;",
					"text-shadow: none;",
					"width: auto;",
					"z-index: 2147483647;",

					"display: inline-block;",
					"position: absolute;",
					"visibility: hidden; }",

			// Arrow Definition
			TOOLTIP_SELECTOR + ":after," + TOOLTIP_SELECTOR + ":before {",
					"border: solid transparent;",
					"content: ' ';",
					"height: 0;",
					"width: 0;",
					"position: absolute;",
					"pointer-events: none; }",
			TOOLTIP_SELECTOR + ":after {",
					"border-color: " + backgroundRGBa,
					"border-width: " + arrowSize + "px; }",
			TOOLTIP_SELECTOR + ":before {",
					"border-color: " + borderRGBa,
					"border-width: " + arrowBorder + "px; }",

			// Arrow on Bottom
			TOOLTIP_SELECTOR + ".betterlink-bottom:after {",
					"top: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowSize + "px;",
					"border-top-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".betterlink-bottom:before {",
					"top: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowBorder + "px;",
					"border-top-color: " + borderColor + " }",

			TOOLTIP_SELECTOR + "." + SHOW_TOOLTIP_CLASS + " { visibility: visible; }"
		].join(' ');
	/***************TOOLTIP***************/

	var stylesInitialized = false;
	var lastSuccessful = apiInternal.lastSubmission.lastSuccessful;
	var tooltip;

	apiInternal.facebookElement = {
		create: createElement
	};
	/****************************************************************************************************/

	function createElement() {
		if(!stylesInitialized) {
			insertStyles();
		}

		var element = apiInternal.svg.createElement('facebook');
		apiInternal.util.dom.applyClassToElement(element, "betterlink-action-element " + FB_CLASS + " " + DISABLED_CLASS);
		//triggerSubmissionOnClick(element);

		addTooltipToDrawer(document.createTextNode("foo"));
		apiInternal.mouseboundary.subscribe.mouseenter(element, showTooltip);
		apiInternal.mouseboundary.subscribe.mouseleave(element, hideTooltip);

		return [tooltip, element];
	}

	function triggerSubmissionOnClick(element) {
		apiInternal.addListener(element, 'click', executeSharingAction);
		apiInternal.addListener(element, 'touch', executeSharingAction);
	}

	function executeSharingAction() {
		var link = lastSuccessful.link;

		if(lastSuccessful.exists()) {
			var windowRef = apiInternal.share.facebook.post(link);
			if(!windowRef || windowRef.closed || typeof windowRef.closed == 'undefined') {
				console.log('There was a problem launching the Facebook share dialog. Try disabling popups.');
			}
		}
		else {
			// display there was an error
		}
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(CSS);

		var regex = new RegExp(TOOLTIP_SELECTOR, 'g');
		apiInternal.util.dom.createAndAppendStyleElement(tooltipCss.replace(regex, apiInternal.drawerSelector + TOOLTIP_SELECTOR));
	}

	/***************TOOLTIP***************/
	function createTooltip() {
		var direction = 'betterlink-bottom';

		tooltip = document.createElement('div');
		tooltip.id = TOOLTIP_ID;
		apiInternal.util.dom.applyClassToElement(tooltip, direction);

		return tooltip;
	}

	function addTooltipToDrawer(tooltipContent) {
		createTooltip();
		apiInternal.util.dom.addOrReplaceChild(tooltip, tooltipContent);

		var top = 50 + arrowSize;
		tooltip.style.marginTop = '-' + top + 'px';
	}

	// Returns an array specifying an RGB color from a provided hex color
	// ex: #88b7d5 ==> [136, 183, 213]
	function hexToRGB(h) {
		if ( typeof h !== 'string' || !h.match(/^#([0-9A-F]{3}$)|([0-9A-F]{6}$)/i) ) return [0, 0, 0];
		else if ( h.match(/^(#[0-9a-f]{3})$/i) ) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
		var rgb = [],
			i = 1;

		for(; i < 6; i+=2) {
			rgb.push(parseInt(h.substring(i, i + 2), 16));
		}
		return rgb;
	}

	function showTooltip() {
		apiInternal.util.dom.applyClassToElement(tooltip, SHOW_TOOLTIP_CLASS);
	}

	function hideTooltip() {
		apiInternal.util.dom.removeClassFromElement(tooltip, SHOW_TOOLTIP_CLASS);
	}
});
