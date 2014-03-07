/**
 * Display the results of a new link submission
 *
 */
betterlink_user_interface.createModule("Submissions.Result", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Submissions", "Submissions.CreationInterface", "Selection Highlighter", "Event Messaging"] );

	var SELECTED_TEXT_CSS_CLASS = "betterlink-selected";
	var SELECTED_TEXT_CSS = "." + SELECTED_TEXT_CSS_CLASS + 
							 [" { background: #F0E68C;",			// background: khaki
								"color: #000080;",					// color: navy
								"text-decoration: underline; }"].join(' ') + 
							"a." + SELECTED_TEXT_CSS_CLASS + ":hover " +
							 ["{ background: #F0E68C;",
							 	"color: #000080;",
							 	"text-decoration: underline; }"].join(' ') +
							"a." + SELECTED_TEXT_CSS_CLASS + ":link " +
							 ["{ background: #F0E68C;",
							 	"color: #000080;",
							 	"text-decoration: underline; }"].join(' ');

	apiInternal.submissions.results = {};
	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
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

			var highlighterIdentifier = 'newSubmission';
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
		apiInternal.util.dom.createAndAppendStyleElement(SELECTED_TEXT_CSS);
	}

	function createSubmissionResultHighlighter(identifier, url) {
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

		apiInternal.highlighters.add(identifier, highlightOptions);
	}
});
