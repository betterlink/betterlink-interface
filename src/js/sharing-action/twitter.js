/**
 * Tweet a link on Twitter
 *
 */
betterlink_user_interface.createModule("Share.Twitter", function(api, apiInternal) {

	var TWEET_LINK = "https://twitter.com/intent/tweet?";
	var TW_URL = "url=",
		TW_VIA = "via=",
		TW_TEXT = "text=",
		TW_HASHTAGS = "hastags=";

	var addTextPreview = true;
	var addHashtags = false;
	var addReferrer = false;

	apiInternal.share = apiInternal.share || {};
	apiInternal.share.twitter = {
		post: launchTweetDialog
	};
	/****************************************************************************************************/

	function launchTweetDialog(shareLink, shareText) {
		var destinationUrl = generateDestinationUrl(shareLink, shareText);
		var windowReference = openPopup(destinationUrl, 420, 550);

		return windowReference;
	}

	function generateDestinationUrl(shareLink, shareText) {
		// Twitter documentation:
		// https://dev.twitter.com/docs/intents#tweet-intent

		// Example URL:
		/*
			https://twitter.com/intent/tweet?
				url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D9cHLoHou8uY
				&text=You've%20got%20to%20watch%20this
		*/
		var twPost = TWEET_LINK + TW_URL + sanitizeLink(shareLink);

		if(addTextPreview) {
			twPost += "&" + TW_TEXT + encodeURIComponent(generateTextPreview(shareText));
		}
		if(addReferrer) {
			twPost += "&" + TW_VIA + "betterlink";
		}
		if(addHashtags) {
			twPost += "&" + TW_HASHTAGS;
		}

		return twPost;
	}

	function sanitizeLink(shareLink) {
		// Twitter will return an error if it can't resolve the share destination
		var link = isLocalhost(shareLink) ? "http://example.org/" : shareLink;
		return encodeURIComponent(link);
	}

	function isLocalhost(url) {
		return /^https?:\/\/localhost:/.test(url);
	}

	// Generate a tweet-friendly preview of the text at the tweeted link
	function generateTextPreview(shareText) {
		// Limit full text preview to xx characters
		var charLimit = 80;
		var extraChars = 2; // for quotes

		// TODO: Break preview at last full word
		if(shareText && shareText.length > charLimit - extraChars) {
			extraChars += 3; // for elipsis
			return '"' + shareText.substring(0, charLimit - extraChars) + '..."';
		}
		else {
			return '"' + shareText + '"';
		}
	}

	function openPopup (destination, height, width) {
		var screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
			screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
			outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.body.clientWidth,
			outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.body.clientHeight - 22),
			left = parseInt(screenX + ((outerWidth - width) / 2), 10),
			top = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
			windowFeatures = ('width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);
		return window.open(destination, '_blank', windowFeatures);
	}
});
