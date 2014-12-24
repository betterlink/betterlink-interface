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
		[   elements +"{ border: none;",
						"border-radius: 0;",
						"margin: 0;",
						"padding: 0;",
						"vertical-align: baseline;",

						"color: #424242;",
						"border-color: #BCBCBC;",
						"font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; }",

			drawerSelector +  "div { background: inherit; ",
									"color: inherit; }"].join(' ');

	apiInternal.drawerSelector = drawerSelector;
});
