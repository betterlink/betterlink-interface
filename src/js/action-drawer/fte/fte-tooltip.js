/**
 * Creates a <div> that can serve as a tooltip.
 * Math and styles derived from hojberg/cssarrowplease, MIT License
 *
 */
betterlink_user_interface.createModule("FTE Tooltip", function(api, apiInternal) {
	api.requireModules( ["Util.DOM"] );

	var TOOLTIP_ID = 'betterlink-tooltip';
	var TOOLTIP_SELECTOR = "#" + TOOLTIP_ID;

	var backgroundColor = '#88b7d5;';
	var backgroundRGB = hexToRGB(backgroundColor.replace(';',''));
	var backgroundRGBa = 'rgba(' + backgroundRGB.join(', ') + ', 0);';

	var borderColor = '#c2e1f5;';
	var borderRGB = hexToRGB(borderColor.replace(';',''));
	var borderRGBa = 'rgba(' + borderRGB.join(', ') + ', 0);';

	var borderWidth = 4;
	var arrowSize = 30;
	var arrowBorder = arrowSize + Math.round(borderWidth * 1.41421356); // cos(PI/4) * 2

	var tooltipCss =
		[   TOOLTIP_SELECTOR + " {",
					"background: " + backgroundColor,
					"border: " + borderWidth + "px solid " + borderColor,
					"border-radius: 0;",
					"color: #ddf8c6;",
					"clear: none;",
					"font-family: Arial, sans-serif;",
					"font-size: medium;",
					"font-weight: normal;",
					"letter-spacing: normal;",
					"line-height: normal;",
					"margin: 0;",
					"padding: 5px;",
					"text-align: left;",
					"min-width: " + (2 * (arrowSize+borderWidth)) + "px;", 
					"min-height: " + (2 * (arrowSize+borderWidth)) + "px;",
					"width: auto;",

					"position: fixed;",
					"left: 50px;",
					"top: 50px; }",

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
			TOOLTIP_SELECTOR + ".right:after {",
					"left: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowSize + "px;",
					"border-left-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".right:before {",
					"left: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowBorder + "px;",
					"border-left-color: " + borderColor + " }",

			// Arrow on Bottom
			TOOLTIP_SELECTOR + ".bottom:after {",
					"top: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowSize + "px;",
					"border-top-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".bottom:before {",
					"top: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowBorder + "px;",
					"border-top-color: " + borderColor + " }",

			// Arrow on Left
			TOOLTIP_SELECTOR + ".left:after {",
					"right: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowSize + "px;",
					"border-right-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".left:before {",
					"right: 100%;",
					"top: 50%;",
					"margin-top: -" + arrowBorder + "px;",
					"border-right-color: " + borderColor + " }",

			// Arrow on Top
			TOOLTIP_SELECTOR + ".top:after {",
					"bottom: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowSize + "px;",
					"border-bottom-color: " + backgroundColor + " }",
			TOOLTIP_SELECTOR + ".top:before {",
					"bottom: 100%;",
					"left: 50%;",
					"margin-left: -" + arrowBorder + "px;",
					"border-bottom-color: " + borderColor + " }",
		].join(' ');

	apiInternal.fteTooltip = {
		create: createTooltip
	};
	/****************************************************************************************************/
	apiInternal.util.dom.createAndAppendStyleElement(tooltipCss);

	function createTooltip() {
		var tooltip = document.createElement('div');
		tooltip.id = TOOLTIP_ID;
		apiInternal.util.dom.applyClassToElement(tooltip, "right");

		tooltip.appendChild(document.createTextNode('Foo bar'));
		return tooltip;
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
