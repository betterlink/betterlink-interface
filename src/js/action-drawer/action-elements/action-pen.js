/**
 * Holds links to all of the clickable divs that will be
 * used to share content
 *
 */
betterlink_user_interface.createModule("Action Pen", function(api, apiInternal) {
	api.requireModules( ["Util.DOM", "Facebook Element", "Twitter Element"] );

	var PEN_ID = 'betterlink-pen';
	var ACTION_ELEMENT_CLASS = 'betterlink-action-element';

	var CSS = [
		"#" + PEN_ID + " { list-style: none; padding: 5px; margin: 0; }",
		"#" + PEN_ID + ">li { display: inline-block; padding: 0; margin: 0; }",
		"." + ACTION_ELEMENT_CLASS + ' { cursor: pointer; padding: 5px; margin: 2px 3px; width: auto; border: none; background: inherit; border-radius: 0; }',
		"img." + ACTION_ELEMENT_CLASS + ',svg.' + ACTION_ELEMENT_CLASS + ' { width: 57px; height: 57px; }'
	].join(' ');

	var sharers = [apiInternal.facebookElement, apiInternal.twitterElement];
	var pen;

	apiInternal.actionPen = {
		create: createPen
	};
	/****************************************************************************************************/

	function createPen() {
		insertStyles();

		pen = document.createElement('ul');
		pen.id = PEN_ID;

		addElements(pen);

		return pen;
	}

	// Add each sharing element to the Pen
	function addElements(list) {
		for(var i  = 0, len = sharers.length; i < len; i++) {
			var li = document.createElement('li');
			li.appendChild(sharers[i].create());
			list.appendChild(li);
		}
		return list;
	}

	function insertStyles() {
		apiInternal.util.dom.createAndAppendStyleElement(CSS);
	}
});
