/**
 * Defines a Reset CSS for Action Drawer elements. Webpages may have
 * specialized styling for <div>, <p>, or other types of elements.
 * This set will essentially reset the styles that are applied to
 * elements underneath the root Action Drawer.
 *
 * If there were more adoption, this would be the same as applying a
 * scoped <style> element. That would also allow us to avoid prefixing
 * all selectors with the drawer ID to have higher specificity.
 *
 * The convention in the related modules will be to start the CSS
 * declaration with the drawerSelector, and to join each subsequent
 * line with a space and the drawerSelector.
 *
 * This assumes that each line holds a single selector, and that
 * selectors are not split between lines. Exceptions to this format
 * should be handled individually.
 *
 * (Formatting the CSS this way reduces the clutter of having the
 *  same text repeated constantly)
 *
 */
betterlink_user_interface.createModule("Drawer Reset CSS", function(api, apiInternal) {
	var drawerSelector = "#betterlink-drawer ";
	var elements = drawerSelector + ["div","span","h1","h2","p","article","aside","footer","header","nav","section"].join(',' + drawerSelector);
	apiInternal.drawerResetCss =
			// Reset & New Defaults: Properties that don't inherit
		[   elements  +  " { background: transparent;",
							"border: none;",
							"border-radius: 0;",
							"border-color: #BCBCBC;",
							"clear: none;",
							"margin: 0;",
							"padding: 0;",
							"vertical-align: baseline; }",

			// Reset: Inherited properties
			elements  +  " { color: inherit;",
							"font-family: inherit;",
							"letter-spacing: inherit;",
							"line-height: inherit;",
							"text-align: inherit;",
							"text-indent: inherit; }",

			// New Defaults: Inherited properties
			drawerSelector + " { color: #424242;",
								"font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;",
								"letter-spacing: normal;",
								"line-height: normal;",
								"text-align: left;",
								"text-indent: 0; }"
		].join(' ');

			// New Defaults: Inherited properties (tag overrides)
			// ....can't happen here. If we wanted to make all <div> elements
			// center-align their text, we would break the ability to have
			// children inherit overrides from a closer parent. This is because
			// the {text-align:center;} would match the element exactly, and
			// the CSS engine would not look up the tree to its parents.
			//
			// *However*, this trade-off can be made for elements that are not
			// expected to have children inheriting styles. <p> and <h1> may be
			// candidates depending on the property (because child <span>
			// elements would not inherit that property from their closest
			// parent).

	apiInternal.drawerSelector = drawerSelector;
});
