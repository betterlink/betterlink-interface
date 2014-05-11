/**
 * Watches for top-level dragenters and dragleaves. Triggers these events more similarly
 * to mouseenter and mouseleave.
 *
 * Inspired by Dragster by Ben Smithett - MIT License
 * http://bensmithett.github.io/dragster/
 *
 */
betterlink_user_interface.createModule("SingleEntryWatcher", function(api, apiInternal) {

	var SINGLE_ENTRY = 'singleentry';
	var SINGLE_EXIT = 'singleexit';

	var watchers = [];

	apiInternal.singleEntryWatcher = {
		SINGLE_ENTRY: SINGLE_ENTRY,
		SINGLE_EXIT: SINGLE_EXIT,
		getOrCreate: getWatcher,
		findExisting: findExistingWatcher
	};
	/****************************************************************************************************/

	function SingleEntryWatcher(dropTarget, fireEventsFn) {
		var watcher = this;
		watcher.dropTarget = dropTarget;
		watcher.fireEventsFn = fireEventsFn;

		watcher.firstEntry = false;
		watcher.secondEntry = false;
	}

	SingleEntryWatcher.prototype = {
		// Trigger a 'dragenter' event if an element is being dragged into the parent
		// dropTarget. Will not trigger on dragenter of child elements.
		enter: function(currentDragItem, dropTarget) {
			if(dropTarget !== this.dropTarget) {
				apiInternal.warn('SingleEntryWatcher for', this.dropTarget, 'fired for', dropTarget);
			}

			if(this.firstEntry) {
				this.secondEntry = true;
			}
			else {
				this.firstEntry = true;
				this.fireEventsFn(this.dropTarget, SINGLE_ENTRY, currentDragItem, this.dropTarget);
			}
		},

		// Trigger a 'dragleave' event if an element is being dragged out of the parent
		// dropTarget. Will not trigger on dragleave of child elements.
		exit: function(currentDragItem, dropTarget) {
			if(dropTarget !== this.dropTarget) {
				apiInternal.warn('SingleEntryWatcher for', this.dropTarget, 'fired for', dropTarget);
			}

			if(this.secondEntry) {
				this.secondEntry = false;
			}
			else if(this.firstEntry) {
				this.firstEntry = false;
			}

			if(!this.firstEntry && !this.secondEntry) {
				this.fireEventsFn(this.dropTarget, SINGLE_EXIT, currentDragItem, this.dropTarget);
			}
		}
	};

	// Return a SingleEntryWatcher that will be used to monitor a given DOM
	// element. May return an existing watcher if the element is already
	// being watched.
	function getWatcher(dropTarget, fireEventsFn) {
		var watcher = findExistingWatcher(dropTarget);
		if(!watcher) {
			watcher = new SingleEntryWatcher(dropTarget, fireEventsFn);
			watchers.push(watcher);
		}

		return watcher;
	}

	// Return the SingleEntryWatcher that is in place for the provided DOM element
	function findExistingWatcher(element) {
		for(var i = 0, len = watchers.length; i < len; i++) {
			var watcher = watchers[i];
			if(element === watcher.dropTarget) {
				return watcher;
			}
		}
		return false;
	}
});
/**
  Original License:

  The MIT License (MIT)
  Copyright © 2014 Ben Smithett

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
