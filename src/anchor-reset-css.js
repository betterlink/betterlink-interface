/**
 * Defines a Reset CSS for anchor elements. Webpages may have arbitrary adjustments
 * to the default rendering of <a> links. Applying the 'inherit' value to each
 * property is intended to make the anchors appear as if they are no different
 * than any of the surrounding text (sort of like if the elements were wrapped in
 * <span>s instead).
 *
 */
betterlink_user_interface.createModule("Anchor CSS", function(api, apiInternal) {
	apiInternal.anchorResetCss = 
		[ "{ background: inherit;",
			"color: inherit;",
			"cursor: inherit;",
			"direction: inherit;",
			"display: inline !important;", // note: inline
			"font: inherit;",
			"letter-spacing: inherit;",
			"line-height: inherit;",
			"opacity: inherit;",
			"outline: inherit;",
			"text-align: inherit;",
			"text-decoration: inherit;",
			"vertical-align: inherit;",
			"word-spacing: inherit;",
			"word-wrap: inherit;",
			"z-index: inherit;",
			"zoom: inherit;",
			"-moz-opacity: inherit;",
			"-moz-outline: inherit; }"].join(' ');
});
