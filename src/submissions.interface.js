/**
 * JS for building an interface to to create and share new links
 *
 */
betterlink_user_interface.createModule("Submissions.CreationInterface", function(api, apiInternal) {
	api.requireModules( ["Submissions", "Span Highlighter"] );

	var supportsCssInherit = supportsCssInherit(document);
	var cleanupSubmittedHighlighters;

	apiInternal.submissions.creationInterface = {
		cleanupSubmittedHighlighters: cleanupSubmittedHighlighters
	};

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

		cleanupSubmittedHighlighters = highlighter.cleanupSubmittedHighlighters;
		highlighter.initialize();
	}

	// Test if the browser supports the 'inherit' CSS value by creating a
	// child and parent element with the display attribute (not inherited)
	function supportsCssInherit(doc) {
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
