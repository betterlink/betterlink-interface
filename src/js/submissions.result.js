/**
 * Display the results of a new link submission
 *
 */
betterlink_user_interface.createModule("Submissions.Result", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Anchor CSS", "Submissions", "Submissions.CreationInterface", "Selection Highlighter", "Event Messaging", "Action Drawer"] );

	var SELECTED_TEXT_CSS_CLASS = "betterlink-selected";

	// The below styles need to be applied as '!important' in order to override
	// the styles of the Anchor Reset CSS
	var SELECTED_TEXT_CSS_PARAMS = {
		background:     "background: #BBECC5 !important;",
		color:          "color: #424242 !important;",
		cursor:         "cursor: pointer !important;",
		textDecoration: "text-decoration: underline !important;"
	};

	// This is updated below via insertStyles()
	var selectedTextCss  =  "." + SELECTED_TEXT_CSS_CLASS + ", " +
							"." + SELECTED_TEXT_CSS_CLASS + ":link, " +
							"." + SELECTED_TEXT_CSS_CLASS + ":hover, " +
							"." + SELECTED_TEXT_CSS_CLASS + ":active " +
							apiInternal.anchorResetCss;

	var highlighterIdentifier = 'newSubmission';
	var highlighterInitialized = false;

	apiInternal.submissions.results = {};
	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	apiInternal.events.registerObserverForRemoveBetterlink(removeDecorationFromLoadedSubmission);

	function initializeInterface() {
		if(apiInternal.submissions.results.interfaceInitialized) {
			return;
		}

		apiInternal.submissions.results.interfaceInitialized = true;
		insertHighlightStyle();

		apiInternal.events.registerObserverForSubmissionDisplay(displaySubmissionResult);
	}

	// Expects an object { success: true, message: "my message here", selection: custom_obj }
	function displaySubmissionResult(result) {
		if(result['success']) {
			var newUrl = result['message'];
			console.log(newUrl);

			createSubmissionResultHighlighter(highlighterIdentifier, newUrl);
			apiInternal.highlighters.highlightRanges(highlighterIdentifier, result['selection']);

			// Alert Submissions.creationInterface that the submission has completed.
			apiInternal.submissions.creationInterface.cleanupSubmittedHighlighters();
		}
		else {
			var message = result['message'];

			console.log(message);
			// Display message for why the submission could not be completed
			// Occurs if the server returns an error on submission, or the server
			// response is invalid.
			//
			// example message:
			// "There was a problem building your share link"
		}
	}

	function insertHighlightStyle() {
		selectedTextCss = selectedTextCss.replace(/background: [^;]+;/, SELECTED_TEXT_CSS_PARAMS.background);
		selectedTextCss = selectedTextCss.replace(/color: [^;]+;/, SELECTED_TEXT_CSS_PARAMS.color);
		selectedTextCss = selectedTextCss.replace(/cursor: [^;]+;/g, SELECTED_TEXT_CSS_PARAMS.cursor);
		selectedTextCss = selectedTextCss.replace(/text-decoration: [^;]+;/, SELECTED_TEXT_CSS_PARAMS.textDecoration);

		apiInternal.util.dom.createAndAppendStyleElement(selectedTextCss);
	}

	function removeDecorationFromLoadedSubmission() {
		if(!highlighterInitialized) {
			return;
		}

		apiInternal.highlighters.removeAllHighlights(highlighterIdentifier);
	}

	function createSubmissionResultHighlighter(identifier, url) {
		if(highlighterInitialized) {
			return;
		}

		highlighterInitialized = true;
		var highlightOptions = {

			// any element that's highlighted should have the following properties
			'elementProperties': {
				'href': url,
				'title': 'Your custom link'
			},

			// elements that we will apply our CSS class to, instead of creating
			// a new container element. ex:
			// <span class="myclass">this is my text</span> v.
			// <span><mark class="myclass">this is my text</mark></span>
			//
			// Note: if the existing element doesn't have all of the properties
			// specified above, we'll create a new container element anyways.
			'tagsToPreserve': ['a'],

			// element type that we will wrap around the selected content when
			// splitting text nodes or when we can't apply our class name to
			// an existing element
			'elementTagName': 'a',

			// CSS class name that will be applied to each element that is
			// highlighted
			'cssClass': SELECTED_TEXT_CSS_CLASS
		};
		if(apiInternal.drawer.initialized) {
			highlightOptions = updateHighlighterToToggleDrawer(highlightOptions);
		}

		apiInternal.highlighters.add(identifier, highlightOptions);
	}

	function updateHighlighterToToggleDrawer(highlightOptions) {
		// callback function that will get executed for each HTML element
		// that is created. Will be passed a single parameter for the element
		// created.
		highlightOptions['onElementCreate'] = openDrawerOnClick;
		highlightOptions['elementProperties']['href'] = '#';
		highlightOptions['elementProperties']['title'] = 'Click to reopen Betterlink';

		return highlightOptions;
	}

	// Executed for each element that is created during the decoration process
	function openDrawerOnClick(element) {
		apiInternal.addListener(element, "touchstart", displayDrawer);
		apiInternal.addListener(element, "click", displayDrawer);
	}

	function displayDrawer(e) {
		e.preventDefault ? e.preventDefault() : window.event.returnValue = false;

		apiInternal.drawer.display();
	}
});
