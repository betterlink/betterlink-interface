/**
 * This file stubs out the core utilities that are used to initialize Betterlink
 * modules and access their private API.
 *
 * You should not need to modify this file.
 *
 * This is not included in the public Betterlink build and is used specifically
 * to glue the localy-defined modules into the core library.
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
	function addListener (obj, eventType, listener) {
		if(isHostMethod(document, "addEventListener")) {
			obj.addEventListener(eventType, listener, false);
		} else if (isHostMethod(document, "attachEvent")) {
			obj.attachEvent("on" + eventType, listener);
		} else {
			console.log("cannot add events");
		}
	}

	function executeListeners (listeners) {
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
			ret.initializeModules();
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

		warn: function(reason) {
			console.log("Betterlink warning: " + reason);
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

	// 'Util.DOM'
	apiInternal.util.dom = {
		// Designed to be executed when adding a top-level HTML element
		// to the DOM. In addition to adding the element to the DOM, we
		// will register the element internally. This provides later
		// access if we need to detach Betterlink.
		registerAndAppend: function(target, new_node) {
			betterlink.exports.registerDomElements(new_node);
			target.appendChild(new_node);
		},

		// Designed to be executed when inserting a top-level HTML element
		// to the DOM. In addition to adding the element to the DOM, we
		// will register the element internally. This provides later
		// access if we need to detach Betterlink.
		registerAndInsertBefore: function(newElement, referenceElement) {
			betterlink.exports.registerDomElements(newElement);
			referenceElement.parentNode.insertBefore(newElement, referenceElement);
		},

		// Designed to be executed when inserting a top-level HTML element
		// to the DOM. In addition to adding the element to the DOM, we
		// will register the element internally. This provides later
		// access if we need to detach Betterlink.
		registerAndInsertAfter: function(newElement, referenceElement) {
			betterlink.exports.registerDomElements(newElement);
			referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
		},

		// Adds a style element that defines the style for a particular class
		// ex: <style>div.highlight { background: yellow; }</style>
		addCssByClass: function (cssClass, cssStyle, optElement) {
			var css = '.' + cssClass + ' ' + cssStyle;
			if(optElement) { css = optElement + css; }

			return apiInternal.util.dom.createAndAppendStyleElement(css);
		},

		// Adds a style element that defines the style for a particular element
		// ex: <style>#my_button { background: yellow; }</style>
		addCssById: function (elementId, cssStyle) {
			var css = '#' + elementId + ' ' + cssStyle;

			return apiInternal.util.dom.createAndAppendStyleElement(css);
		},

		// The result of this function is that the parent should
		// have a single child node (the one supplied by param)
		addOrReplaceChild: function(parent, newNode) {
			var nodeCount = parent.childNodes.length;
			if(nodeCount === 0) {
				parent.appendChild(newNode);
			}
			else if(nodeCount === 1) {
				parent.replaceChild(newNode, parent.childNodes[0]);
			}
			else {
				while(parent.hasChildNodes()) {
					parent.removeChild(parent.lastChild);
				}
				parent.appendChild(newNode);
			}
		},

		// Creates and returns a new anchor <a> element
		createAnchorElement: function (linkText, href, optTarget) {
			var a = window.document.createElement("a");
			var textNode = document.createTextNode(linkText);
			a.appendChild(textNode);
			a.href = href;
			if(optTarget) { 
				a.target = optTarget;
			}

			return a;
		},

		createAndAppendStyleElement: function(cssText) {
			var head = document.head || document.getElementsByTagName('head')[0];
			var style = document.createElement('style');

			style.type = 'text/css';
			if (style.styleSheet){
				style.styleSheet.cssText = cssText;
			}
			else {
				style.appendChild(document.createTextNode(cssText));
			}

			apiInternal.util.dom.registerAndAppend(head, style);
			return style;
		}
	};

	// 'Util.Ranges'
	apiInternal.util.ranges = {
		currentSelectionIsEmpty: function () {
			// simple version for modern browsers + IE9
			if(window.getSelection) {
				return window.getSelection().isCollapsed;
			}
			else {
				return false;
			}
		},

		removeCurrentSelection: function() {
			betterlink.exports.removeCurrentSelection();
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
		
		fireNewSubmission: function () {
			betterlink.exports.fireNewSubmission();
		},
		
		registerObserverForReadyToDecorate: function (fn) {
			betterlink.exports.registerObserverForReadyToDecorate(fn);
		},

		fireHighlighterStylesInitialized: function () {
			betterlink.exports.fireHighlighterStylesInitialized();
		}
	};

	// 'Selection Highlighter'
	apiInternal.highlighters = {
		add: function(highlighterIdentifier, highlightOptions) {
			return betterlink.exports.addNewHighlighter(highlighterIdentifier, highlightOptions);
		},

		highlightSelection: function(highlighterIdentifier, selection) {
			return betterlink.exports.decorateSelection(highlighterIdentifier, selection);
		},

		highlightRanges: function(highlighterIdentifier, ranges) {
			return betterlink.exports.decorateRanges(highlighterIdentifier, ranges);
		},

		removeAllHighlights: function(highlighterIdentifier) {
			betterlink.exports.removeAllDecoration(highlighterIdentifier);
		},

		removeHighlightFromRanges: function(highlighterIdentifier, ranges) {
			return betterlink.exports.removeDecorationFromRanges(highlighterIdentifier, ranges);
		}
	};

	// 'Submissions'
	apiInternal.submissions = {};

	return ret;
})();
