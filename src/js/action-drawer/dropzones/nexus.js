/**
 * Dropzone div that initiates all sharing actions
 *
 */
betterlink_user_interface.createModule("Dropzone.Nexus", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "LastSubmission", "Drawer Reset CSS", "Link Viewer", "Draggable", "Drawer Dropzone", "Action Pen"] );

	var NO_SUBMISSION_TEXT = document.createTextNode("drag | drop | share"),
		LOADING_TEXT = document.createTextNode("Loading..."),
		ABOUT_TO_SHARE_TEXT = document.createTextNode("drop to share"),
		LINK_SUBMITTED_TEXT = document.createTextNode("choose where");

	var NEXUS_CLASS = "nexus",
		DRAGGING_CLASS = "dragging",
		HAS_SUBMISSION_CLASS = "has-submission",
		HAS_ERROR_CLASS = "has-error";
	var NEXUS_CSS = apiInternal.drawerSelector +
		[   "." + apiInternal.dropzone.HOVER_CLASS + "." + NEXUS_CLASS + " { background-color: #1CD3A2; color: #333; }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + "." + HAS_SUBMISSION_CLASS + " { border-color: #FF9900; }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + "." + HAS_ERROR_CLASS + " { background-color: #F32E2E; color: #eee; }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + "." + DRAGGING_CLASS + " { border-color: inherit; padding-top: 50px; padding-bottom: 50px; }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + " { margin: 20px 7px 10px 7px; border-radius: 1em; -webkit-transition: padding 0.3s ease; transition: padding 0.3s ease; }"].join(' ' + apiInternal.drawerSelector);

	var stylesInitialized = false;
	var nexusDropzone;
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

		actionPen = apiInternal.actionPen.create();
		linkViewer = apiInternal.linkViewer.create();
		hide(actionPen);
		hide(linkViewer);

		triggerChangeOnDrag();
		triggerSubmissionOnDrop(submissionFn);
		triggerLoadingOnSubmission();
		triggerChooseOnSuccess();
		triggerFailureDisplay();

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

		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, DRAGGING_CLASS);
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_ERROR_CLASS);
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);
		//apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, ABOUT_TO_SHARE_TEXT);
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
			//apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, NO_SUBMISSION_TEXT);
		}
	}

	// Inform the user that we're generating their link
	function alertLoading() {
		hide(actionPen);
		hide(linkViewer);

		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_ERROR_CLASS);
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);

		//apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, LOADING_TEXT);
	}

	// Inform the user they should choose the service to use to copmlete their share
	// action.
	function alertToChoose() {
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, HAS_ERROR_CLASS);
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);
		//apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, LINK_SUBMITTED_TEXT);

		show(actionPen);
		show(linkViewer);
	}

	function alertNoLastSubmission() {
		hide(actionPen);

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
