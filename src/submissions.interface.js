/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.CreationInterface", function(api, apiInternal) {
	api.requireModules( ["Submissions", "Span Highlighter", "Anchor Highlighter"] );

	var supportsCssInherit = canUseCssInherit(document);

	apiInternal.submissions.creationInterface = {};

	/****************************************************************************************************/

	apiInternal.addInitListener(initializeInterface);
	function initializeInterface() {
		if(apiInternal.submissions.creationInterface.initialized) {
			return;
		}

		apiInternal.submissions.creationInterface.initialized = true;
		initializeHighlighters();
	}

	function initializeHighlighters() {
		// Functionally, IE 7 & 6 get the spanHighlighter.
		var highlighter = supportsCssInherit ? apiInternal.anchorHighlighter : apiInternal.spanHighlighter;
		if("%%build:highlighter_override%%" === "true") {
			highlighter = apiInternal.spanHighlighter;
		}

		apiInternal.submissions.creationInterface.cleanupSubmittedHighlighters = highlighter.cleanupSubmittedHighlighters;
		highlighter.initialize();
	}

	// Test if the browser supports the 'inherit' CSS value by creating a
	// child and parent element with the display attribute (not inherited)
	function canUseCssInherit(doc) {
		var parent = doc.createElement('div');
		var child = doc.createElement('p');
		try {
			parent.style.display = 'none';
			child.style.display = 'inherit';
		}
		catch (e) {
			return false;
		}

		parent.appendChild(child);
		var body = doc.body || doc.getElementsByTagName('body')[0];
		body.appendChild(parent);

		var display = child.style.display;
		var supported = display === 'inherit' || display === 'none';
		body.removeChild(parent);

		return supported;
	}
});
