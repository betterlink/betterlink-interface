// This is a modified version of the script within betterlink/betterlink-distribution
// https://github.com/betterlink/betterlink-distribution/blob/master/chrome-extension/injector.js
//
// Adjustments necessary:
//   - load betterlink-no-interface.js
//   - load all locally-hosted files (requires web server running)
//   - initialize betterlink and betterlink_user_interface on completion
//   - uses a script loader to make all of the above possible (blocking when necessary)
//   - needs all local files explicity listed
//   - won't support https:// sites
var betterlink;
if(!betterlink){
  (function(d,s,src){
    function loadBetterlink() {
      var js,fjs = d.getElementsByTagName(s)[0];
      js=d.createElement(s);
      js.innerHTML = '\
          var dir = "http://localhost:1000/src/js/";\
          var modules = ["stubs.js", "util.dom.js", "custom-events/mouseboundary.js", "custom-events/single-entry-watcher.js", "custom-events/neglected.js", "custom-events/draggable.js", "smooth-scroller.js", "creation-interface/anchor-reset-css.js", "custom-events/multiclick.js", "highlighter-proxy.js", "creation-interface/selection-toggle.js", "creation-interface/inplace-span-highlighter.js", "creation-interface/inplace-anchor-highlighter.js", "action-drawer/action-drawer-dropzone.js", "action-drawer/link-viewer.js", "action-drawer/action-drawer.js", "submissions.interface.js", "submissions.result.js", "submissions.viewer.js"];\
          modules = modules.map(function(f){return dir+f;});\
          $LAB.script("//code.betterlink.io/betterlink-no-interface.js").wait().script(modules).wait(function(){\
            betterlink.init({ setScriptSource: "chrome extension" });\
            document.readyState === "complete" && betterlink_user_interface.initializeModules();\
            setTimeout(betterlink_user_interface.executeInitListeners, 100);\
          });\
      ';
      // For some reason I *cannot* understand, executeInitListeners always runs before initializeModules.
      // So, we just wait 100 miliseconds to run it.
      fjs.parentNode.insertBefore(js,fjs);
    }

    // We can't inject relative to the first script on the page because
    // there may not be any. This javascript is run in an isolated world.
    var scripts = d.getElementsByTagName(s);
    var node = d.getElementsByTagName('head')[0] || d.body;
    if(!scriptsInDomWithBetterlinkSource(scripts)) {
      var js=d.createElement(s); js.src=src;
      js.onload=loadBetterlink;
      node.appendChild(js);
    }
  }(document,'script','//cdnjs.cloudflare.com/ajax/libs/labjs/2.0.3/LAB.min.js'));

  // Chrome Extensions run in an 'isolated world' and cannot
  // interact with JavaScript variables or functions created
  // by the page.
  // http://developer.chrome.com/extensions/content_scripts.html
  // Instead, we can check against the source files for Betterlink
  function scriptsInDomWithBetterlinkSource(scripts) {
    var foundScripts = false;
    // match against a Betterlink script (ex: /betterlink-bespoke.js),
    // excluding poorly-named scripts on the Betterlink homepage
    var scriptInSource = /\/betterlink(?!-site)[^\/]*\.js/;
    for(var i = 0, len = scripts.length; i < len; i++) {
      if(scriptInSource.test(scripts[i].src)) {
        foundScripts = true;
        break;
      }
    }
    return foundScripts;
  }
}
