/**
 * DOM Utility functions
 *
 */
betterlink_user_interface.createModule("Util.DOM", function(api, apiInternal) {
	api.requireModules( ["Util", "Version Manager"] );

	apiInternal.util.dom = {

		// Designed to be executed when adding a top-level HTML element
		// to the DOM. In addition to adding the element to the DOM, we
		// will register the element internally. This provides later
		// access if we need to detach Betterlink.
		registerAndAppend: function(target, new_node) {
			apiInternal.versions.registerDomElements(new_node);
			target.appendChild(new_node);
		},

		// Designed to be executed when inserting a top-level HTML element
		// to the DOM. In addition to adding the element to the DOM, we
		// will register the element internally. This provides later
		// access if we need to detach Betterlink.
		registerAndInsertBefore: function(newElement, referenceElement) {
			apiInternal.versions.registerDomElements(newElement);
			referenceElement.parentNode.insertBefore(newElement, referenceElement);
		},

		// Designed to be executed when inserting a top-level HTML element
		// to the DOM. In addition to adding the element to the DOM, we
		// will register the element internally. This provides later
		// access if we need to detach Betterlink.
		registerAndInsertAfter: function(newElement, referenceElement) {
			apiInternal.versions.registerDomElements(newElement);
			referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
		},

		// The result of this function is that the parent should
		// have a single child node (the one supplied by param)
		addOrReplaceChild: function(parent, new_node) {
			var node_count = parent.childNodes.length;
			if(node_count === 0) {
				parent.appendChild(new_node);
			}
			else if(node_count === 1) {
				parent.replaceChild(new_node, parent.childNodes[0]);
			}
			else {
				while(parent.hasChildNodes()) {
					parent.removeChild(parent.lastChild);
				}
				parent.appendChild(new_node);
			}
		},

		// Remove all nodes that are children of the provided element
		removeAllChildren: function(parent) {
			while(parent.hasChildNodes()) {
				parent.removeChild(parent.lastChild);
			}
		},

		// Return a new anchor element (not yet appended to the DOM)
		createAnchorElement: function(link_text, href, opt_target) {
			var a = window.document.createElement("a");
			var text_node = document.createTextNode(link_text);
			a.appendChild(text_node);
			a.href = href;
			if(opt_target) { 
				a.target = opt_target;
			}

			return a;
		},

		// Return a new style element that has been appeneded to the DOM
		addCssByClass: function(css_class, css_style, opt_element) {
			var css = '.' + css_class + ' ' + css_style;
			if(opt_element) { css = opt_element + css; }

			return apiInternal.util.dom.createAndAppendStyleElement(css);
		},

		// Return a new style element that has been appeneded to the DOM
		addCssById: function(element_id, css_style) {
			var css = '#' + element_id + ' ' + css_style;

			return apiInternal.util.dom.createAndAppendStyleElement(css);
		},

		// Creates and returns a new <style> element that has been added
		// to the DOM, containing the provided CSS text.
		createAndAppendStyleElement: function(css_text) {
			var head = document.head || document.getElementsByTagName('head')[0];
			var style = document.createElement('style');

			style.type = 'text/css';
			if (style.styleSheet){
				style.styleSheet.cssText = css_text;
			}
			else {
				style.appendChild(document.createTextNode(css_text));
			}

			apiInternal.util.dom.registerAndAppend(head, style);
			return style;
		},

		// Test if the provided element has the given class name
		elementHasClass: (function() {
			// Use a IIFE to keep a memoization cache of previously-generated
			// regular expressions.
			var cache = {};
			return function(element, className) {
				var elementClass = apiInternal.util.dom.isSvg(element) ? element.className.baseVal : element.className;
				var hasClass = cache[className] || 
					(cache[className] = new RegExp('\\b' + className + '\\b'));
				return hasClass.test(elementClass);
			};
		})(),

		// Apply the given class name to the provided element. Don't re-apply
		// if the class name is already applied.
		applyClassToElement: function(element, className) {
			if(!apiInternal.util.dom.elementHasClass(element, className)) {
				if(!apiInternal.util.dom.isSvg(element)) {
					element.className = element.className + (element.className ? ' ' : '') + className;
				}
				else {
					element.className.baseVal = element.className.baseVal + (element.className.baseVal ? ' ' : '') + className;
				}
			}
		},

		// If the provided element has the given class name, remove the class
		removeClassFromElement: (function() {
			// Use a IIFE to keep a memoization cache of previously-generated
			// regular expressions.
			var cache = {};
			return function(element, className) {
				if(element.className) {
					var hasClass = cache[className] || 
						(cache[className] = new RegExp('\\s*' + className + '\\b'));
					if(!apiInternal.util.dom.isSvg(element)) {
						element.className = element.className.replace(hasClass, '');
					}
					else {
						element.className.baseVal = element.className.baseVal.replace(hasClass, '');
					}
				}
			};
		})(),

		// Return if the provided element is an SVG element
		isSvg: function(element) {
			var svgNamespace = "http://www.w3.org/2000/svg";
			return element.namespaceURI && element.namespaceURI === svgNamespace;
		},

		// Private function for getElementsByClassName for IE8- compatibility
		// Derived from Eike Send, MIT License
		// https://gist.github.com/eikes/2299607
		getElementsByClassName: function(search) {
			if(document.getElementsByClassName) {
				return document.getElementsByClassName(search);
			}

			var d = document, elements, pattern, i, results = [];

			if (d.querySelectorAll) { // IE8
				return d.querySelectorAll("." + search);
			}
			if (d.evaluate) { // IE6, IE7
				pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
				elements = d.evaluate(pattern, d, null, 0, null);
				while ((i = elements.iterateNext())) {
					results.push(i);
				}
			} else {
				elements = d.getElementsByTagName("*");
				pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
				for (i = 0; i < elements.length; i++) {
					if ( pattern.test(elements[i].className) ) {
						results.push(elements[i]);
					}
				}
			}
			return results;
		}
	};
});
