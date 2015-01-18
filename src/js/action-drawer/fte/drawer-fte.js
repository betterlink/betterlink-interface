/**
 * Controls the First Time Experience for the user interface.
 *
 */
betterlink_user_interface.createModule("FTE", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "FTE Tooltip", "LastSubmission", "Drawer Slider"] );

	var fteRun = false;
	var drawerLock;

	/****************************************************************************************************/

	apiInternal.addInitListener(loadFTE);
	window.x = closeFTE;

	// Register the FTE to run with the next successful submission
	function loadFTE() {
		apiInternal.lastSubmission.subscribeSuccess.onsuccess(testFTE);
	}

	function testFTE() {
		if(!fteRun) {
			fteRun = true;

			var nexus = document.getElementsByClassName('betterlink-nexus')[0];
			var drawer = document.getElementById('betterlink-drawer');
			var textNode = document.createTextNode('Your new link takes you right back to the highlighted text.');

			drawerLock = apiInternal.slider.lockDrawerOpen();
			apiInternal.fteTooltip.addTooltipToDrawer(nexus, textNode);
		}
	}

	function closeFTE() {
		apiInternal.fteTooltip.remove();
		apiInternal.slider.releaseDrawerLock(drawerLock);
	}
});
