/**
 * Creates a <div> that can serve as a tooltip.
 * Math and styles derived from hojberg/cssarrowplease, MIT License
 *
 */
betterlink_user_interface.createModule("FTE Tooltip", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS", "Event Messaging"] );

	var TOOLTIP_ID = 'betterlink-tooltip';
	var TOOLTIP_SELECTOR = "#" + TOOLTIP_ID;
	var SHOW_TOOLTIP_CLASS = 'betterlink-tooltip-show';
	var MEASURE_CLASS = 'betterlink-tooltip-measure-drawer';

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

			TOOLTIP_SELECTOR + "." + SHOW_TOOLTIP_CLASS + " { visibility: visible; }",

			// This class is used to get an accurate measurement of the tooltip
			// when it's placed on the DOM. It needs to be sufficiently far from
			// the end of the page for an accurate measurement.
			TOOLTIP_SELECTOR + "." + MEASURE_CLASS + " { left: -" + 100 + "px; }"
		].join(' ');

	var stylesInitialized = false;
	var tooltip;

	apiInternal.fteTooltip = {
		addTooltipToDrawer: addTooltipToDrawer,
		addTooltipToPage: addTooltipToPage,
		remove: removeTooltipFromDom
	};
	/****************************************************************************************************/

	apiInternal.events.registerObserverForRemoveBetterlink(removeTooltipFromDom);

	// If the tooltip is present in the DOM, remove it
	function removeTooltipFromDom() {
		if(tooltip.parentNode) {
			tooltip.parentNode.removeChild(tooltip);
		}
	}

	// Accepts an optional direction (right, left, top, bottom) to
	// indicate which direction the tooltip should point. If not
	// provided, the tooltip will just be a rectangle, no pointer.
	//
	// If the tooltip has already been created, this resets the content
	// and styles.
	function createTooltip(opt_direction) {
		initializeStyles();

		if(!tooltip) {
			tooltip = document.createElement('div');
			tooltip.id = TOOLTIP_ID;
		}
		else {
			removeTooltipFromDom();
			apiInternal.util.dom.removeAllChildren(tooltip);
			tooltip.className = '';
			tooltip.style.left = '';
			tooltip.style.top = '';
			tooltip.style.marginLeft = '';
			tooltip.style.marginTop = '';
		}

		if(opt_direction) {
			apiInternal.util.dom.applyClassToElement(tooltip, "betterlink-" + opt_direction);
		}

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

	// Create and position the tooltip appropriately as an element
	// nested within the drawer. This means applying the 'left' and
	// 'top' attributes to get the right distances.
	//
	// This assumes that drawerElement has been appended to the DOM
	// already.
	function addTooltipToDrawer(drawerElement, tooltipContent) {
		createTooltip('right');
		apiInternal.util.dom.addOrReplaceChild(tooltip, tooltipContent);
		
		// Append the tooltip as the first child of the provided element.
		// This ensures that the 'top' of the tooltip will be the top of
		// the drawerElement.
		//
		// The tooltip needs to be on the DOM before checking its
		// dimensions.
		appendAsFirstChild(tooltip, drawerElement);

		apiInternal.util.dom.applyClassToElement(tooltip, MEASURE_CLASS);
		var left = arrowSize + tooltip.offsetWidth;
		tooltip.style.left = '-' + left + 'px';
		apiInternal.util.dom.removeClassFromElement(tooltip, MEASURE_CLASS);

		apiInternal.util.dom.applyClassToElement(tooltip, SHOW_TOOLTIP_CLASS);
	}

	// Create and position the tooltip appropriately as an element
	// nested within the DOM (outside of the drawer). This is likely
	// within a Betterlink-created element (like .betterlink-selected).
	//
	// This assumes that pageElement has been appended to the DOM
	// already.
	function addTooltipToPage(pageElement, tooltipContent) {
		createTooltip('bottom');
		apiInternal.util.dom.addOrReplaceChild(tooltip, tooltipContent);

		// Append the tooltip as the prior sibling of the provided element.
		// This ensures that the tooltip rests at the very beginning and
		// inline with the pageElement. This means we simply move the
		// tooltip up its full height.
		//
		// The tooltip needs to be on the DOM before checking its
		// dimensions.
		pageElement.parentNode.insertBefore(tooltip, pageElement);

		// Make sure we're not going to put the element offpage
		if(tooltip.offsetTop - arrowSize - tooltip.offsetHeight >= 0) {
			var top = tooltip.offsetHeight + arrowSize;
			tooltip.style.marginTop = '-' + top + 'px';
		}
		else {
			// If we can't position it right on top of element, then we'll
			// position it right underneath
			apiInternal.util.dom.removeClassFromElement(tooltip, "betterlink-bottom");
			apiInternal.util.dom.applyClassToElement(tooltip, "betterlink-top");

			// Move the tooltip as the last sibling of the pageElement
			removeTooltipFromDom();
			pageElement.parentNode.insertBefore(tooltip, pageElement.nextSibling);

			var approximateElementLineSize = 30;
			var horizontalOffset = 10;
			var top = arrowSize + approximateElementLineSize;
			var left = (tooltip.offsetWidth / 2) + horizontalOffset;
			tooltip.style.marginTop = top + 'px';
			tooltip.style.marginLeft = '-' + left + 'px';
		}

		apiInternal.util.dom.applyClassToElement(tooltip, SHOW_TOOLTIP_CLASS);
	}

	// Appends the newElement to the DOM as the first child of the
	// provided parentElement
	function appendAsFirstChild(newElement, parentElement) {
		if(parentElement.firstChild) {
			parentElement.insertBefore(newElement, parentElement.firstChild);
		}
		else {
			parentElement.appendChild(newElement);
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
