/**
 * JS for building the styles to apply to highlighted content
 *
 */
betterlink_user_interface.createModule("Submissions.Viewer", function(api, apiInternal, module) {
	api.requireModules( ["Util", "Util.DOM", "Event Messaging"] );

	var DEFAULT_HIGHLIGHT_CUSTOM_ELEMENT = "mark";				//the element type that will wrap the selections
	var DEFAULT_HIGHLIGHT_CSS_CLASS = "highlight";				//the CSS class that will be applied to all highlight elements
	var DEFAULT_HIGHLIGHT_ELEMENT_ID = "highlighted_element";	//an ID that will be applied to all highlight wrapper elements
	var HIGHLIGHT_CSS = "{ background: lightskyblue; }";

	// always refer to config via index-notation so the symbol isn't obfuscated
	api['config'] = api['config'] || {};
	var highlightConfig = {
		'highlightCustomElement' : DEFAULT_HIGHLIGHT_CUSTOM_ELEMENT,
		'highlightCssClass' : DEFAULT_HIGHLIGHT_CSS_CLASS,
		'highlightCustomCssClass' : '',
		'highlightElementId' : DEFAULT_HIGHLIGHT_ELEMENT_ID
	};
	apiInternal.util.extend(api['config'], highlightConfig);

	apiInternal.events.registerObserverForHighlighterInitialized(initializeHighlighterStyles);

	function initializeHighlighterStyles() {
		if(apiInternal.highlights && apiInternal.highlights.styles && apiInternal.highlights.styles.initialized) {
			return;
		}

		var highlightOptions = {

			// any element that's highlighted should have the following properties
			'elementProperties': {
				'id': api['config']['highlightElementId']
			},

			// elements that we will apply our CSS class to, instead of creating
			// a new container element. ex:
			// <span class="myclass">this is my text</span> v.
			// <span><mark class="myclass">this is my text</mark></span>
			//
			// Note: if the existing element doesn't have all of the properties
			// specified above, we'll create a new container element anyways.
			'tagsToPreserve': ["span", "a", "mark"],

			// element type that we will wrap around the selected content when
			// splitting text nodes or when we can't apply our class name to
			// an existing element
			'elementTagName': api['config']['highlightCustomElement'],

			// CSS class name that will be applied to each element that is
			// highlighted
			'cssClass': getHighlightCSSClass()
		};

		apiInternal.events.registerObserverForSelectionHighlighted(jumpToHighlightedContent);

		insertHighlightStyle();
		apiInternal.events.fireHighlighterStylesInitialized(highlightOptions);
	}

	function jumpToHighlightedContent() {
		if(!window.location.hash || !api['config']['preserveHash']) {
			window.location.hash = api['config']['highlightElementId'];
		}
	}

	function insertHighlightStyle() {
		// always add the default CSS style with the default class name
		// allow a custom class name to be applied to ignore this style
		apiInternal.util.dom.addCssByClass(api['config']['highlightCssClass'], HIGHLIGHT_CSS, api['config']['highlightCustomElement']);
	}

	// checks if the client has defined a custom CSS class name to override
	// the default name that is provided
	function getHighlightCSSClass() {
		if(api['config']['highlightCustomCssClass'])
			return api['config']['highlightCustomCssClass'];
		else
			return api['config']['highlightCssClass'];
	}
});
