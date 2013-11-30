/**
 * Exposes a function to smoothly navigate to an element on a webpage.
 * Based on smoothscroll.js by Stuart Langridge - MIT License
 * (http://www.kryogenix.org/code/browser/smoothscroll/smoothscroll.js)
 *
 */
betterlink_user_interface.createModule("Smooth Scrolling", function(api, apiInternal, module) {
	api.requireModules( ["Event Messaging"] );

	apiInternal.events.registerObserverForRemoveBetterlink(stopAnyCurrentScrolling);
	var scroller = {
		// Setup and execute smooth scrolling. Assumes this function is called explicitly,
		// not via a click handler.
		// Returns if able to successfully scroll.
		smoothScroll: function(destinationId, options) {
			setOptions(options);
			var destinationLink = document.getElementById(destinationId);

			// If we didn't find a destination, give up and let the browser do
			// its thing
			if (!destinationLink) return false;

			// Find the destination's position
			var destx = destinationLink.offsetLeft; 
			var desty = destinationLink.offsetTop;
			var thisNode = destinationLink;
			while (thisNode.offsetParent && (thisNode.offsetParent != document.body)) {
				thisNode = thisNode.offsetParent;
				destx += thisNode.offsetLeft;
				desty += thisNode.offsetTop;
			}
			if(scroller.PIXEL_BUFFER) desty -= scroller.PIXEL_BUFFER;

			stopAnyCurrentScrolling();

			cypos = scroller.getCurrentYPos();

			scroller_stepsize = parseInt((desty-cypos)/scroller.STEPS);
			// Alternative option is to include an IE polyfill
			// (via https://developer.mozilla.org/en-US/docs/Web/API/Window.setInterval#Callback_arguments)
			scroller.INTERVAL = setInterval(function() {scroller.scrollWindow(scroller_stepsize, desty, destinationId);} ,10);

			return true;
		},

		scrollWindow: function(scramount,dest) {
			wascypos = scroller.getCurrentYPos();
			isAbove = (wascypos < dest);
			window.scrollTo(0,wascypos + scramount);
			iscypos = scroller.getCurrentYPos();
			isAboveNow = (iscypos < dest);
			if ((isAbove != isAboveNow) || (wascypos == iscypos)) {
				// if we've just scrolled past the destination, or
				// we haven't moved from the last scroll (i.e., we're at the
				// bottom of the page) then scroll exactly to the link
				window.scrollTo(0,dest);
				// cancel the repeating timer
				stopAnyCurrentScrolling();
			}
		},

		getCurrentYPos: function() {
			if (document.body && document.body.scrollTop)
				return document.body.scrollTop;
			if (document.documentElement && document.documentElement.scrollTop)
				return document.documentElement.scrollTop;
			if (window.pageYOffset)
				return window.pageYOffset;
			return 0;
		}
	};
	apiInternal.smoothScroll = scroller.smoothScroll;

	function stopAnyCurrentScrolling() {
		clearInterval(scroller.INTERVAL);
	}

	function setOptions(options) {
		// Defaults
		scroller.STEPS = 25;
		scroller.PIXEL_BUFFER = 0;

		if(options) {
			scroller.STEPS = options.steps || scroller.STEPS;
			scroller.PIXEL_BUFFER = options.pixelBuffer || scroller.PIXEL_BUFFER;
		}
	}
});
/**
  Original License:

  The MIT Licence, for code from kryogenix.org

  Code downloaded from the Browser Experiments section of kryogenix.org is licenced under the so-called MIT licence. The licence is below.

  Copyright (c) 1997-date Stuart Langridge

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
