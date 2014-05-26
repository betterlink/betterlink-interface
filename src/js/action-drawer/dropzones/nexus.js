/**
 * Dropzone div that initiates all sharing actions
 *
 */
betterlink_user_interface.createModule("Dropzone.Nexus", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "LastSubmission", "Draggable", "Drawer Dropzone"] );

	var NO_SUBMISSION_TEXT = document.createTextNode("drag | drop | share"),
		ABOUT_TO_SHARE_TEXT = document.createTextNode("drop to share"),
		LINK_SUBMITTED_TEXT = document.createTextNode("choose where");

	var NEXUS_CLASS = "nexus",
		DRAGGING_CLASS = "dragging",
		HAS_SUBMISSION_CLASS = "has-submission",
		HAS_ERROR_CLASS = "has-error";
	var NEXUS_CSS = 
		[   "." + apiInternal.dropzone.HOVER_CLASS + "." + NEXUS_CLASS + " { background-color: #1CD3A2; color: #333; }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + "." + DRAGGING_CLASS + " { padding-top: 50px; padding-bottom: 50px }",
			"." + apiInternal.dropzone.CLASS + "." + NEXUS_CLASS + " { -webkit-transition: padding 0.3s ease; transition: padding 0.3s ease; }"].join(' ');

	var stylesInitialized = false;
	var nexusDropzone;

	apiInternal.dropzone.sharingNexus = {
		create: createDropzone
	};
	/****************************************************************************************************/

	function createDropzone(submissionFn) {
		if(!stylesInitialized) {
			insertStyles();
		}

		nexusDropzone = apiInternal.dropzone.create(NO_SUBMISSION_TEXT.nodeValue);
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, NEXUS_CLASS);

		triggerChangeOnDrag();
		triggerSubmissionOnDrop(submissionFn);
		triggerChooseOnSubmission();

		return nexusDropzone;
	}

	// When the user is dragging a potential submission, alter the dislplay of
	// the div to highlight where to drop the content
	function triggerChangeOnDrag() {
		apiInternal.draggable.subscribeGlobal.dragstart(alertToDrop);
		apiInternal.draggable.subscribeGlobal.dragend(revertDraggingChange);
	}

	// When the user drops a potential submission on this element, submit it
	function triggerSubmissionOnDrop(submissionFn) {
		nexusDropzone.subscribeToDrop(submissionFn);
	}

	// When the user has a successful submission, show them options to share their
	// submission
	function triggerChooseOnSubmission() {
		apiInternal.lastSubmission.subscribeSuccess(alertToChoose);
	}

	// Inform the user that they should drop their submission in this dropzone to
	// start their share action.
	function alertToDrop() {
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, DRAGGING_CLASS);
		apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, ABOUT_TO_SHARE_TEXT);
	}

	// Set the content of the dropzone back to where it was before dragging
	function revertDraggingChange() {
		apiInternal.util.dom.removeClassFromElement(nexusDropzone.element, DRAGGING_CLASS);

		if(apiInternal.lastSubmission.lastSuccessful.exists) {
			alertToChoose();
		}
		else {
			apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, NO_SUBMISSION_TEXT);
		}
	}

	// Inform the user they should choose the service to use to copmlete their share
	// action.
	function alertToChoose() {
		apiInternal.util.dom.applyClassToElement(nexusDropzone.element, HAS_SUBMISSION_CLASS);
		apiInternal.util.dom.addOrReplaceChild(nexusDropzone.element, LINK_SUBMITTED_TEXT);
	}

	function insertStyles() {
		stylesInitialized = true;
		apiInternal.util.dom.createAndAppendStyleElement(NEXUS_CSS);
	}
});
