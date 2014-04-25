/**
 * Apply an in-place highlight that always covers the most-recently
 * selected text. Use <a>s to surround the highlighted elements. This
 * would be idiomatic because the elements are clickable (leveraging
 * native support for screen readers). Additionally, this allows us
 * to rely on native support for draggable elements. By default, links
 * are draggable (although HTML5 provides the ability to add draggable
 * support to arbitrary elements).
 *
 * Apply event handlers on the highlighted elements so that they
 * trigger a submission on 'click'.
 *
 */
betterlink_user_interface.createModule("Anchor Highlighter", function(api, apiInternal) {
	//
});
