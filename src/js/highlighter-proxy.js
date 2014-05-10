/**
 * Serves as an interface for calling most of the Highlighter API.
 *
 * In part, this simplifies using the API so that we don't pass arbitrary
 * strings around as highligher names. In addition, this allows us to
 * combine steps that result from actually using the API.
 *
 * More importantly, this allows each highlighter object to keep track
 * of which content its currently highlighting. This is useful when
 * multiple versions of the same (or different) highlighter type are
 * applied simultaneously on the document. We can more easily target
 * which ranges need to be modified.
 *
 */
betterlink_user_interface.createModule("Highlighter Proxy", function(api, apiInternal) {
	api.requireModules( ["Selection Highlighter"] );

	apiInternal.HighlighterProxy = HighlighterProxy;
	// Note: Protype exposed below

	function HighlighterProxy(highlighterName, identifier, opt_removalFunction) {
		var highlighter = this;
		highlighter.name = highlighterName;
		highlighter.identifier = identifier;
		highlighter.removalFunction = opt_removalFunction;
	}

	HighlighterProxy.prototype = {
		// Store the last ranges that were associated with our highlighter API. Because
		// these ranges are invalidated after any subsequent changes to the DOM, we
		// only ever need the last set that was returned.
		//
		// A rangeEvent can be used as a reference for which action created the range.
		storeLastRanges: function(ranges, rangeEvent) {
			this.lastActiveRanges = ranges;
			this.lastActiveRangeType = rangeEvent;
		},

		// Remove any highlights from the document associated with this highlighter.
		removeExistingDecorations: function() {
			var rangesToRemove = this.lastActiveRanges;

			if(rangesToRemove) {
				this.removeAddedAttributesOnHighlightElements();
				var undoneRanges = this.removeHighlightFromRanges(rangesToRemove);
				this.storeLastRanges(undoneRanges, 'afterUndo');
			}
		},

		// Fully remove any traces of this highlighter from the document
		nuclearRemoveFromDocument: function() {
			this.removeAddedAttributesOnHighlightElements();
			apiInternal.highlighters.removeAllHighlights(this.name);
		},

		highlightSelection: function() {
			return apiInternal.highlighters.highlightSelection(this.name);
		},

		highlightRanges: function(rangesToHighlight) {
			return apiInternal.highlighters.highlightRanges(this.name, rangesToHighlight);
		},

		removeHighlightFromRanges: function(rangesToRemove) {
			return apiInternal.highlighters.removeHighlightFromRanges(this.name, rangesToRemove);
		},

		// Signal that all decorations associated with this highlighter have been
		// removed and that the highlighter shouldn't be used for anything else
		detach: function() {
			if(!this.detached) {
				this.detached = true;
				this.nuclearRemoveFromDocument();
			}
		},

		// Remove any CSS classes or additional attributes that have been added ontop of
		// our highlighted elements. These additional classes will cause the wrapper
		// elements to remain on the page when the highlighter is removed.
		removeAddedAttributesOnHighlightElements: function () {
			// NOTE: It is possible that when applying the highlighter, we added our custom
			// class ontop of an existing HTML element (assuming it had all of the necessary
			// elementProperties and elementAttributes). In this case, it is correct for the
			// base element to NOT be removed. So we specifically want to remove any classes
			// or attributes that we added to the elements that weren't there previously.

			// Also, the actions we need to take to remove additional attributes depends on
			// how these elements are contructed and used. So we want the clients of the
			// Highlighters to define what needs to happen. The current solution is to inject
			// these actions into the constructor of the HighlighterProxy object.
			if(this.removalFunction) {
				this.removalFunction();
			}
		}
	};

	apiInternal.HighlighterProxyPrototype = HighlighterProxy.prototype;
});
