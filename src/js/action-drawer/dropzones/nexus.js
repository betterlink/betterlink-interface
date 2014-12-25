/**
 * Dropzone div that initiates all sharing actions
 *
 */
betterlink_user_interface.createModule("Dropzone.Nexus", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "LastSubmission", "Drawer Reset CSS", "Link Viewer", "Draggable", "Drawer Dropzone", "Action Pen"] );

	var LABEL_TEXT = document.createTextNode("dropzone"),
		LOADING_TEXT = document.createTextNode("Loading...");

	var NEXUS_CLASS = "betterlink-nexus",
		DRAGGING_CLASS = "betterlink-nexus-dragging",
		HAS_SUBMISSION_CLASS = "betterlink-nexus-has-submission",
		HAS_ERROR_CLASS = "betterlink-nexus-has-error",
		LABEL_CLASS = "betterlink-nexus-label",
		LOADING_CLASS = "betterlink-nexus-loading";

	// Nexus selectors need at least two classes to beat the default
	// dropzone specificity. Prefixing the dropzone class is an easy
	// way to add extra classes.
	var NEXUS_CSS =
		[   "@-webkit-keyframes pulse { 50% {background-color: #ccc;} } @keyframes pulse { 50% {background-color: #ccc;} }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + " { margin: 20px 7px 10px 7px; border-radius: 1em; -webkit-transition: padding 0.3s ease; transition: padding 0.3s ease; }",
			"." + NEXUS_CLASS + "." + HAS_SUBMISSION_CLASS + " { border-color: #FF9900; }",
			"." + NEXUS_CLASS + "." + HAS_ERROR_CLASS + " { background-color: #F32E2E; color: #eee; }",
			"." + NEXUS_CLASS + "." + DRAGGING_CLASS + " { border-color: inherit; padding-bottom: 200px; -webkit-animation: pulse 2s infinite; animation: pulse 2s infinite; }",
			"." + apiInternal.dropzone.HOVER_CLASS + "." + NEXUS_CLASS + " { background-color: #ccc; -webkit-animation: none; animation: none; }",
			"." + LABEL_CLASS + " { font-size: 80%; color: #BCBCBC; text-align: right; width: auto; background-color: transparent; }"].join(' ' + apiInternal.drawerSelector);

	var stylesInitialized = false;
	var nexusDropzone;
	var dropzoneLabel;
	var loadingLabel;
	var linkViewer;
	var actionPen;

	apiInternal.dropzone.sharingNexus = {
		create: createDropzone
	};
	/****************************************************************************************************/

	function createDropzone(submissionFn) {
		if(!stylesInitialized) {
			insertStyles();
		}

		nexusDropzone = apiInternal.dropzone.create();
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, NEXUS_CLASS);

		dropzoneLabel = document.createElement('div');
		loadingLabel = document.createElement('div');
		actionPen = apiInternal.actionPen.create();
		linkViewer = apiInternal.linkViewer.create();
		hide(actionPen);
		hide(linkViewer);
		hide(loadingLabel);

		triggerChangeOnDrag();
		triggerSubmissionOnDrop(submissionFn);
		triggerLoadingOnSubmission();
		triggerChooseOnSuccess();
		triggerFailureDisplay();

		dropzoneLabel.appendChild(LABEL_TEXT);
		dropzoneLabel.className = LABEL_CLASS;

		loadingLabel.appendChild(LOADING_TEXT);
		loadingLabel.className = LABEL_CLASS;

		nexusDropzone.element.appendChild(dropzoneLabel);
		nexusDropzone.element.appendChild(loadingLabel);
		nexusDropzone.element.appendChild(linkViewer);
		nexusDropzone.element.appendChild(actionPen);

		return nexusDropzone.element;
	}

	// **************************
	// Event Triggers
	// **************************

	// When the user is dragging a potential submission, alter the display of
	// the div to highlight where to drop the content
	function triggerChangeOnDrag() {
		apiInternal.draggable.subscribeGlobal.dragstart(alertToDrop);
		apiInternal.draggable.subscribeGlobal.dragend(revertDraggingChange);
	}

	// When the user drops a potential submission on this element, submit it
	function triggerSubmissionOnDrop(submissionFn) {
		nexusDropzone.subscribeToDrop(submissionFn);
	}

	// When the user makes a new submission, display that we are processing
	function triggerLoadingOnSubmission() {
		apiInternal.lastSubmission.subscribeAll.onsubmitted(alertLoading);
	}

	// When the user has a successful submission, show them options to share their
	// submission
	function triggerChooseOnSuccess() {
		apiInternal.lastSubmission.subscribeSuccess.onsuccess(alertToChoose);
	}

	// When the user's last attemped submission failed and there is no prior
	// submission to use, display an error state
	function triggerFailureDisplay() {
		apiInternal.lastSubmission.subscribeSuccess.onfailed(alertNoLastSubmission);
	}

	// **************************
	// Event Actions
	// **************************

	// Inform the user that they should drop their submission in this dropzone to
	// start their share action.
	function alertToDrop() {
		hide(actionPen);
		hide(linkViewer);
		hide(loadingLabel);

		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, DRAGGING_CLASS);
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_ERROR_CLASS);
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);

		show(dropzoneLabel);
	}

	// Set the content of the dropzone back to where it was before dragging
	function revertDraggingChange() {
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, DRAGGING_CLASS);

		if(apiInternal.lastSubmission.lastSuccessful.exists()) {
			alertToChoose();
		}
		else if(apiInternal.lastSubmission.last.exists()) {
			alertNoLastSubmission();
		}
		else {
			show(dropzoneLabel);
		}
	}

	// Inform the user that we're generating their link
	function alertLoading() {
		hide(actionPen);
		hide(linkViewer);
		hide(dropzoneLabel);

		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_ERROR_CLASS);
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);

		show(loadingLabel);
	}

	// Inform the user they should choose the service to use to copmlete their share
	// action.
	function alertToChoose() {
		hide(dropzoneLabel);
		hide(loadingLabel);

		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_ERROR_CLASS);
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);

		show(actionPen);
		show(linkViewer);
	}

	function alertNoLastSubmission() {
		hide(actionPen);
		hide(dropzoneLabel);
		hide(loadingLabel);

		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, HAS_ERROR_CLASS);

		show(linkViewer);
	}

	// **************************
	// Utilities
	// **************************

	function hide(element) {
		element.style.display = 'none';
	}

	function show(element) {
		element.style.display = '';
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(NEXUS_CSS);
	}
});
