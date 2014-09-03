/**
 * Share a post on Facebook
 *
 */
betterlink_user_interface.createModule("Share.Facebook", function(api, apiInternal) {

	var FB_SHARE = "https://www.facebook.com/dialog/share?";
	var APP_ID = "1473432896225805";
	var REDIRECT = encodeURIComponent("http://betterlink.io/");

	apiInternal.share = apiInternal.share || {};
	apiInternal.share.facebook = {
		post: launchShareDialog
	};
	/****************************************************************************************************/

	function launchShareDialog(shareLink) {
		var destinationUrl = generateDestinationUrl(shareLink);
		var windowReference = openPopup(destinationUrl, 340, 670);

		return windowReference;
	}

	function generateDestinationUrl(shareLink) {
		// Facebook documentation:
		// https://developers.facebook.com/docs/sharing/reference/share-dialog

		// Example URL:
		/*
			https://www.facebook.com/dialog/share?
				app_id=1473432896225805&display=popup
				&href=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D9cHLoHou8uY
				&redirect_uri=http%3A%2F%2Fbetterlink.io
		*/
		shareLink = sanitizeInput(shareLink);
		var fbPost = FB_SHARE + "display=popup&app_id=" + APP_ID + "&href=" + shareLink + "&redirect_uri=" + REDIRECT;
		return fbPost;
	}

	function sanitizeInput(shareLink) {
		// Facebook will return an error if it can't resolve the share destination
		var link = isLocalhost(shareLink) ? "http://example.org/" : shareLink;
		return encodeURIComponent(link);
	}

	function isLocalhost(url) {
		return /^https?:\/\/localhost:/.test(url);
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
