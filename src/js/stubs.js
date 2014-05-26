/**
 * This file stubs out the core utilities that are used to initialize Betterlink
 * modules and access their private API.
 *
 * You should not need to modify this file.
 *
 * This is not included in the public Betterlink build and is used specifically
 * to glue the locally-defined modules into the core library.
 */
var betterlink_user_interface;
betterlink_user_interface = window['betterlink_user_interface'] || (function() {
	var modules = [];
	var initListeners = [];

	var ret = {
		createModule: function (name, fn) {
			if(!modules[name]) {
				modules[name] = fn;
			}
		},

		initializeModules: function () {
			for(var moduleName in modules) {
				modules[moduleName](api, apiInternal, {});
			}
		},

		executeInitListeners: function () {
			executeListeners(initListeners);
		}
	};

	//******************** Helper Functions ********************//

	// Trio of functions taken from Peter Michaux's article:
	// http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
	var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";
	function isHostMethod (o, p) {
		var t = typeof o[p];
		return t == FUNCTION || (!!(t == OBJECT && o[p])) || t == "unknown";
	}

	function isHostObject (o, p) {
		return !!(typeof o[p] == OBJECT && o[p]);
	}

	function isHostProperty (o, p) {
		return typeof o[p] != UNDEFINED;
	}

	// Event Listener
	// Very simple event handler wrapper function that attempts to solve "this" handling for
	// callbacks, but does not address event property normalization.
	function addListener(obj, eventType, listener, scope) {
		var scopedHandler = scope ? function(e) { return listener.apply(scope, [e]); } : listener;
		if(isHostMethod(document, "addEventListener")) {
			obj.addEventListener(eventType, scopedHandler, false);
			return scopedHandler;
		} else if (isHostMethod(document, "attachEvent")) {
			obj.attachEvent("on" + eventType, scopedHandler);
			return scopedHandler; // so can be removed
		} else {
			apiInternal.warn("cannot add events");
		}
	}

	function removeListener(obj, eventType, listener) {
		if(isHostMethod(document, "removeEventListener")) {
			obj.removeEventListener(eventType, listener, false);
		} else if (isHostMethod(document, "detachEvent")) {
			obj.detachEvent("on" + eventType, listener);
		} else {
			apiInternal.warn("cannot remove events");
		}
	}

	function executeListeners(listeners) {
		for (var i = 0, len = listeners.length; i < len; ++i) {
			try {
				listeners[i]();
			} catch (ex) {
				var errorMessage = "listener threw an exception. Continuing. Detail: " + getErrorDesc(ex);
				console.log(errorMessage);
			}
		}
	}

	function getErrorDesc(ex) {
		return ex.message || ex.description || String(ex);
	}

	//******************** DOM Ready ********************//

	var docReady = false;
	var docReadyCallback = function(e) {
		if (!docReady) {
			docReady = true;

			// Compiled together, we'd have no issue initializing all modules based
			// on their dependencies. Here, we need to ensure the core library is
			// loaded first and exposes the necessary API. IE 7 & 8 seem to need a
			// bit more time.
			if(betterlink.exports) {
				ret.initializeModules();
			}
			else {
				window.setTimeout(ret.initializeModules, 100);
			}
		}
	};

	if (isHostMethod(document, "addEventListener")) {
		document.addEventListener("DOMContentLoaded", docReadyCallback, false);
	}

	// Fallback
	addListener(window, "load", docReadyCallback);

	//******************** 'api' Functions ********************//

	var api = {
		config: betterlink['config'],
		requireModules: function () { } // no-op
	};

	//******************** 'apiInternal' Functions ********************//

	var apiInternal = {
		addInitListener: function (fn) {
			initListeners.push(fn);
		},

		addListener: addListener,
		removeListener: removeListener,

		warn: function(reason) {
			if(Function.prototype.bind) {
				var log = Function.prototype.bind.call(console.log, console);
				log.apply(console, ["Betterlink warning: "].concat(Array.prototype.slice.call(arguments, 0)));
			}
			else {
				console.log("Betterlink warning: " + reason);
			}
		}
	};

	//******************** 'apiInternal' Sub-Modules ********************//

	// 'Util'
	apiInternal.util = {
		extend: function (target) {
			apiInternal.util.forEach(
				Array.prototype.slice.call(arguments, 1),
				function (obj) {
					for (var item in obj) {
						if(!apiInternal.util.isUndefined(obj[item])) {
							target[item] = obj[item];
						}
					}
				});
			return target;
		},

		forEach: function (myArray, callback, thisArg) {
			if (myArray !== null) {
				if (Array.prototype.forEach && myArray.forEach === Array.prototype.forEach) {
					myArray.forEach(callback, thisArg);
				}

				else if (myArray.length === +myArray.length) {
					for (var i = 0, len = myArray.length; i < len; i++) {
						callback.call(thisArg, myArray[i], i, myArray);
					}
				}
				else {
					for (var prop in myArray) {
						if (Object.prototype.hasOwnProperty.call(myArray, prop)){
							callback.call(thisArg, myArray[prop], prop, myArray);
						}
					}
				}
			}
		},

		isArray: Array.isArray || function (obj) {
			return "[object Array]" === Object.prototype.toString.call(obj);
		},

		isUndefined: function (a) {
			return void 0 === a;
		}
	};

	// 'Util.Ranges'
	apiInternal.util.ranges = {
		// Return whether there is any text that is selected on
		// the current document.
		currentSelectionIsEmpty: function () {
			// Functionally equivalent to the below script, with
			// additional feature testing and support for older browsers.
			//
			// return window.getSelection && window.getSelection.isCollapsed;
			return betterlink.exports.currentSelectionIsEmpty();
		},

		// Create invisible bookends within the DOM that bound the active
		// user selection. This function will return an object that can
		// be used within restoreSelection() to recreate the previous
		// selection.
		//
		// This method is useful when subsequent changes to the DOM will
		// invalidate a saved range or remove the user selection. The
		// selection can usually be recovered after these changes.
		saveSelection: function() {
			return betterlink.exports.saveSelection();
		},

		// Restores a previously saved selection created via saveSelection().
		// Upon restoring the selection, the bookends in the DOM will be removed
		// and cannot be reused.
		restoreSelection: function(savedSelection) {
			betterlink.exports.restoreSelection(savedSelection);
		},

		// Enclose the provided array of ranges in bookend DOM elements. The
		// elements will be added to the beginning and end of each range.
		//
		// By default, new <span> elements will be appended to the DOM. If a
		// custom element is provided, clones of that node will enclose the
		// range. If classnames are provided in addition to the custom element,
		// then class1 and class2 will be applied to the beginning and ending
		// bookends, respectively.
		//
		// Returns an object that can be used within removeRangeEnclosures() to
		// remove the created bookends.
		encloseRanges: function(ranges, opt_element, class1, class2) {
			return betterlink.exports.encloseRanges(ranges, opt_element, class1, class2);
		},

		// Removes the bookends that were created via encloseRanges(). Upon
		// completion, the DOM elements will be completely removed.
		removeRangeEnclosures: function(savedRangeEnclosure) {
			betterlink.exports.removeRangeEnclosures(savedRangeEnclosure);
		},

		// Removes the current selection from the document. Functionally,
		// this means that a user selection (e.g., highlighting a portion
		// of the document) will be undone.
		removeCurrentSelection: function() {
			betterlink.exports.removeCurrentSelection();
		},

		// Selects all of the content contained within the provided node.
		// As a consequence, this will remove any current user selection.
		selectNodeContents: function(node) {
			betterlink.exports.selectNodeContents(node);
		}
	};

	// 'Event Messaging'
	apiInternal.events = {
		registerObserverForRemoveBetterlink: function (fn) {
			betterlink.exports.registerObserverForRemoveBetterlink(fn);
		},

		registerObserverForSubmissionDisplay: function (fn) {
			betterlink.exports.registerObserverForSubmissionDisplay(fn);
		},

		fireNewSubmission: function (rangesToSubmit) {
			betterlink.exports.fireNewSubmission(rangesToSubmit);
		},

		registerObserverForNewSubmission: function(fn) {
			betterlink.exports.registerObserverForNewSubmission(fn);
		},

		registerObserverForReadyToDecorate: function (fn) {
			betterlink.exports.registerObserverForReadyToDecorate(fn);
		},

		fireHighlighterStylesInitialized: function () {
			betterlink.exports.fireHighlighterStylesInitialized();
		}
	};

	// 'Version Manager'
	apiInternal.versions = {
		// Hold a reference to elements added to the DOM. Accepts either
		// a single element, or an array of elements.
		registerDomElements: function (elements) {
			betterlink.exports.registerDomElements(elements);
		}
	};

	// 'Selection Highlighter'
	apiInternal.highlighters = {
		// Creates and internally stores a new 'highlighter' that will be used
		// to decorate the DOM. The highlighter can be accessed by clients using
		// a user-provided identifier.
		// In addition to an identifer, the following parameters are required
		// to define how the highlighter will function:
		//
		// elementProperties: array of properties; any element that's highlighted
		//                    should have the provided properties
		//
		// elementAttributes: array of non-standard element attributes (ex: HTML5
		//                    data attributes); any element that's highlighted should
		//                    have the provided attributes
		//
		// tagsToPreserve:    elements that we will apply our CSS class to, instead
		//                    of creating a new container element. ex:
		//                    <span class="myclass">this is my text</span> v.
		//                    <span><mark class="myclass">this is my text</mark></span>
		//
		//                    Note: if the existing element doesn't have all of the
		//                    properties specified above, we'll create a new container
		//                    element anyways.
		//
		// elementTagName:    element type that we will wrap around the selected
		//                    content when splitting text nodes or when we can't apply
		//                    our class name to an existing element
		//
		// cssClass:          CSS class name that will be applied to each element that
		//                    is highlighted
		//
		// Optional:
		// onElementCreate:   callback function that should be executed after the new
		//                    elements are created
		//
		// If successful, this function will return the highlightIdentifier used to create
		// the highlighter. Otherwise, the function will return `false`.
		add: function(highlighterIdentifier, highlightOptions) {
			return betterlink.exports.addNewHighlighter(highlighterIdentifier, highlightOptions);
		},

		// Highlight the provided selection using a particular highlighter. If
		// no selection is provided, use the active user selection on the document.
		// After highlight, will ensure that the user selection is still selected.
		//
		// Will return an array of ranges which enclose the highlighted content.
		highlightSelection: function(highlighterIdentifier, selection) {
			return betterlink.exports.decorateSelection(highlighterIdentifier, selection);
		},

		// Highlight the provided array of ranges using a particular highlighter.
		//
		// Will return a new array of ranges that match the initial input, but with
		// the added highlighted markup.
		highlightRanges: function(highlighterIdentifier, ranges) {
			return betterlink.exports.decorateRanges(highlighterIdentifier, ranges);
		},

		// Remove any highlights that have been added to the page using the
		// provided highlighter.
		removeAllHighlights: function(highlighterIdentifier) {
			betterlink.exports.removeAllDecoration(highlighterIdentifier);
		},

		// Remove any highlights that are contained within the provided array
		// of ranges. In order to be removed, the range must be valid (not modified
		// since creation) and must fully enclose the highlighted section.
		//
		// Will return a new array of ranges that match the initial input, but
		// without the prior highlighted markup.
		removeHighlightFromRanges: function(highlighterIdentifier, ranges) {
			return betterlink.exports.removeDecorationFromRanges(highlighterIdentifier, ranges);
		}
	};

	// 'Submissions'
	apiInternal.submissions = {
		errorCodes: {
			// ** Occur during betterlink.highlightRequestedSelections() -- happens on page load with bl-sid provided**

			NO_ID: "no_id", // no highlight ID was passed into the URL or function
			UNKNOWN_ID: "unknown_id", // unable to pull selection data from the server for the specified ID
			CONTENT_NOT_FOUND: "content_not_found", // unable to find the requested selection's content on the current page
			DOM_ERROR: "dom_error", // there was an error creating the Selection object after finding the requested content
			DECORATE_ERROR: "decorate_error" // there was an error error calling interface code, decorating the selection on the DOM
		}
	};

	return ret;
})();
