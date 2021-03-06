/**
 * Holds links to all of the clickable divs that will be
 * used to share content
 *
 */
betterlink_user_interface.createModule("Action Pen", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Drawer Reset CSS", "Facebook Element", "Twitter Element", "Copy Element"] );

	var PEN_CLASS = 'betterlink-pen';
	var ACTION_ELEMENT_CLASS = 'betterlink-action-element';

	var CSS = apiInternal.drawerSelector + [
		"." + PEN_CLASS + " { list-style: none; padding: 5px; margin: 0; text-align: center; }",
		"." + PEN_CLASS + ">li { display: inline-block; padding: 0; margin: 0; vertical-align: top; }",
		"." + ACTION_ELEMENT_CLASS + ' { cursor: pointer; padding: 5px; margin: 2px 3px; width: auto; border: none; background: inherit; border-radius: 0; }',
		"img." + ACTION_ELEMENT_CLASS + ',' + apiInternal.drawerSelector + 'svg.' + ACTION_ELEMENT_CLASS + ' { width: 75px; height: 75px; }'
	].join(' ' + apiInternal.drawerSelector);

	var sharers = [apiInternal.facebookElement, apiInternal.twitterElement, apiInternal.copyLinkElement];
	var pen;

	apiInternal.actionPen = {
		create: createPen
	};
	/****************************************************************************************************/

	function createPen() {
		insertStyles();

		pen = document.createElement('ul');
		apiInternal.util.dom.applyClassToElement(pen, PEN_CLASS);

		addElements(pen);

		return pen;
	}

	// Add each sharing element to the Pen
	function addElements(list) {
		for(var i  = 0, len = sharers.length; i < len; i++) {
			var li = document.createElement('li');

			// Support Action Elements that return an array of elements.
			// Each element gets added to the <li> in order.
			var elements = sharers[i].create();
			if(!elements.length) { elements = [elements]; }
			for(var j = 0, jLen = elements.length; j < jLen; j++) {
				li.appendChild(elements[j]);
			}
			list.appendChild(li);
		}
		return list;
	}

	function insertStyles() {
		apiInternal.util.dom.createAndAppendStyleElement(CSS);
	}
});
