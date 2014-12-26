/**
 * Simplified handling of SVG elements.
 *
 */
betterlink_user_interface.createModule("SVG", function(api, apiInternal) {

	var SVG_FOLDER = getSvgDirectoryLocation(),
		DEFS_FILE = SVG_FOLDER + "defs.svg",

		SVG_NAMESPACE = "http://www.w3.org/2000/svg",
		XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

	// test outlined by Chris Coyer: http://css-tricks.com/test-support-svg-img/
	var supportsSvg = document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Image', '1.1'),
		supportsExternalDefs = false;

	apiInternal.svg = {
		createElement: createElement,
		supported: supportsSvg
	};
	/****************************************************************************************************/

	function createElement(imageId, opt_fallbackText) {
		if(supportsSvg) {
			return createSvgFileElement(imageId, opt_fallbackText);
			// TODO: test if able to use SVG with external defs file
		}
		else {
			// use the image filename if nothing is specifially provided for fallback text
			return createFallbackElement(opt_fallbackText || imageId);
		}
	}

	// NOTE: To properly fallback to individual SVG files per image, the
	// filename of the icon must match the ID of the corresponding element
	// within the defs.svg file.

	// Creates an SVG element, pulling the source from a shared defiintions
	// file. Pros: allows the browser to make a single request and cache all
	// used SVG images.
	//
	// ex: <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
	//       <use xlink:href="http://example.org/defs.svg#foo"></use>
	//     </svg>
	//
	// Compatibility: loses IE support
	function createDefsSvgElement(imageId) {
		var svg = document.createElementNS(SVG_NAMESPACE, 'svg');
		svg.setAttribute('xmlns:xlink', XLINK_NAMESPACE);

		var svgUse = document.createElementNS(SVG_NAMESPACE, 'use');
		svgUse.setAttributeNS(XLINK_NAMESPACE, 'xlink:href', DEFS_FILE + '#' + imageId);

		svg.appendChild(svgUse);

		return svg;
	}

	// Creates an <img> element, displaying an SVG image as the source.
	//
	// ex: <img src="http://example.org/foo.svg"></img>
	//
	// Compatibility: http://caniuse.com/#feat=svg-img
	function createSvgFileElement(imageId, opt_fallbackText) {
		var element = document.createElement('img');
		element.src = SVG_FOLDER + imageId + ".svg";
		element.setAttribute('alt', opt_fallbackText || imageId);
		element.setAttribute('title', opt_fallbackText || imageId);

		return element;
	}

	// Creates a simple <div> containing a text node
	function createFallbackElement(fallbackText) {
		var element = document.createElement('div');
		element.appendChild(document.createTextNode(fallbackText));

		return element;
	}

	// *****************************************************************************

	// Return the location that should be used to access SVG files
	function getSvgDirectoryLocation() {
		if(isRunningLocally()) {
			return "src/img/";
		}
		else {
			return ("https:" == window.document.location.protocol ? "https://" : "http://") + "%%build:svg_directory%%";
		}
	}

	// Specifically checks if our build variable has been replaced with anything
	function isRunningLocally() {
		return /(%%build:([^%]+)%%|^undefined$)/.test("%%build:svg_directory%%");
	}
});
