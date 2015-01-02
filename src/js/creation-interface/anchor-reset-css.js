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
	// The below properties need to be set with the '!important' flag. These
	// styles are applied to <a> elements embedded throughout the source page.
	// This makes it impossible to target any of them via ID, which means
	// page styles are naturally going to be more specific than what we can
	// specify via a classname alone.

			// Inherited Properties
		[ "{ color: inherit !important;",
			"direction: inherit !important;",
			"font: inherit !important;",
			"letter-spacing: inherit !important;",
			"line-height: inherit !important;",
			"text-align: inherit !important;",
			"word-spacing: inherit !important;",
			"word-wrap: inherit !important;",

			// Non-inherited Properties
			"background: inherit !important;",
			"cursor: pointer !important;",
			"display: inline !important;",
			"font-size: inherit !important;",
			"opacity: inherit !important;",
			"outline: inherit !important;",
			"padding: 0 !important;",
			"margin: 0 !important;",
			"text-decoration: inherit !important;",
			"z-index: inherit !important;",
			"zoom: inherit !important;",
			"-moz-opacity: inherit !important;",
			"-moz-outline: inherit !important; }"].join(' ');
});
