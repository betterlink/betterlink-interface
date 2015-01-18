/**
 * Creates a <div> that can serve as a tooltip.
 * Math and styles derived from hojberg/cssarrowplease, MIT License
 *
 */
betterlink_user_interface.createModule("FTE Tooltip", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS"] );

	var TOOLTIP_ID = 'betterlink-tooltip';
	var TOOLTIP_SELECTOR = "#" + TOOLTIP_ID;

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
					"max-width: 250px;",
					"width: auto;",
					"z-index: 2147483647;",

					// Temporary attributes
					"position: absolute;",
					"left: -279px;", // arrowSize + element.offsetWidth
					"top: 75px; }",

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

			// Arrow on Right
			TOOLTIP_SELECTOR + ".betterlink-right:after {",
					"left: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowSize + "px;",
					"border-left-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".betterlink-right:before {",
					"left: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowBorder + "px;",
					"border-left-color: " + borderColor + " }",

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

			// Arrow on Left
			TOOLTIP_SELECTOR + ".betterlink-left:after {",
					"right: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowSize + "px;",
					"border-right-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".betterlink-left:before {",
					"right: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowBorder + "px;",
					"border-right-color: " + borderColor + " }",

			// Arrow on Top
			TOOLTIP_SELECTOR + ".betterlink-top:after {",
					"bottom: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowSize + "px;",
					"border-bottom-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".betterlink-top:before {",
					"bottom: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowBorder + "px;",
					"border-bottom-color: " + borderColor + " }",
		].join(' ');

	var stylesInitialized = false;

	apiInternal.fteTooltip = {
		create: createTooltip
	};
	/****************************************************************************************************/

	// Accepts an optional direction (right, left, top, bottom) to
	// indicate which direction the tooltip should point. If not
	// provided, the tooltip will just be a rectangle, no pointer.
	function createTooltip(opt_direction) {
		initializeStyles();

		var tooltip = document.createElement('div');
		tooltip.id = TOOLTIP_ID;

		if(opt_direction) {
			apiInternal.util.dom.applyClassToElement(tooltip, "betterlink-" + opt_direction);
		}

		tooltip.appendChild(document.createTextNode('Your new link takes you right back to the highlighted text.'));
		return tooltip;
	}

	function initializeStyles() {
		if(!stylesInitialized) {
			stylesInitialized = true;

			// Writes the styles twice. Once when positioned inside of the drawer. The
			// other when positioned outside of the drawer.
			var regex = new RegExp(TOOLTIP_SELECTOR, 'g');
			apiInternal.util.dom.createAndAppendStyleElement(tooltipCss + tooltipCss.replace(regex, apiInternal.drawerSelector + TOOLTIP_SELECTOR));
		}
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
});
