betterlink-interface
====================

Full user interaction for [Betterlink](http://betterlink.io/) (`betterlink.js`). Defines the user interface for:
- generating a new, personalized link
- communicating the URL after a successful submission
- highlighting the selected content after re-visiting a link

Use
--------

1. Clone the repository
2. In a browser, navigate to `file:///path/to/example_site.html`
  - the `betterlink` and `betterlink_user_interface` global variables will automatically load with the page
3. Select content on the page and 'share' as you normally would

Webserver + Chrome Extension
--------
A Chrome Extension is provided to demo the local user interface on any webpage.

A webserver is required in order to host the local files for the Extension. This can be accomplished using the simple Rack (Ruby) application provided. Simply run the following command from the root directory:

```
rackup -p 1000
```

While the webserver is running, `example_site.html` can also be loaded via `http://localhost:1000/`.

**Extension Setup**

1. Within chrome, go to `chrome://extensions`
2. Select 'Developer mode' checkbox
3. Select 'Load unpacked extension...'
4. Choose directory at `betterlink-interface/local-chrome-extension/`
5. Navigate to any webpage to test the interface
  - `http://` sites only because secure (`https://`) sites will not load the local files

Details
----------

This repository uses a special Betterlink build, `betterlink-no-interface.js`. This script contains all of the core functionality of `betterlink.js`, with a few main tweaks:
- The script isn't initialized on page load
- All requests to the server default to 'test mode' (this can be overriden)
- No user interface (duh -- that's the point of this repo)

**Script Initialization**

In order to allow custom styles and interaction to be defined, these have to be configured within Betterlink before initialization. If a Betterlink Selection ID is present in the URL, we'd normally try to highlight that content immediately (but we can't without any styles!).

To initialize Betterlink, the following two methods must be executed:
- `betterlink.init()`
- `betterlink_user_interface.executeInitListeners()`

These are executed in the final script tag defined in `example_site.html`.

**Test Mode**

To demo basic selections and highlighting on the example site, 'test mode' should be sufficient for most tasks. This pings the production server, but won't persist a new selection to the database.

This will even work for testing new selections on third-party webpages. Eventually though, you'll need to view examples of real, highlighted content. To do this, you'll need to disable 'test mode', and this can only be done during initialization.

To do this, replace `betterlink.init();` with 

```
initializationOptions = { enableHttpRequests: true };
betterlink.init(initializationOptions);
```

You'll need to execute this initialization option on any new page load for selecting content **or** displaying highlighted content.

**Defining a user interface**

The betterlink-interface code interacts with the core `betterlink-no-interface.js` script through a simple Observer eventing system. The full contract is detailed in our wiki: [Event Details](https://github.com/betterlink/betterlink-interface/wiki/Event-Details)

Platform Support
------

With Betterlink, we strive to allow anyone to share content with anyone else \-\- the same way anyone can share a regular URL. To that end, we have wider platform support than most modern web services.

We **do not** expect every feature to be available in every browser. However, three basic features are priority:

**For everyone**
- The ability to jump-to, highlight, or somehow distinguish the requested content on the page

**For _almost_ everyone**
- The ability to select content to share
- The ability to access the new link

Within the core Betterlink library, we already handle most of the heavy-lifting to find selections and reconcile differences across browsers (using feature detection). **Generally**, this repository supports IE8+ and modern browsers.

The core `betterlink.js` library has support for IE6+, and a few files in this repository create a minimal feature set for those users (`dom/`, `creation-interface/`, `highlighter-proxy.js`, `submissions.*.js`, and `multiclick.js`).

Please consider the experience for mobile users and users with disabilities (ex: using a screenreader) in your contributions.

Contributing
---------

Pull Requests welcome.

License
---------

This library is distributed under the Apache 2.0 License found in the [LICENSE](https://github.com/betterlink/betterlink-interface/blob/master/LICENSE.txt) file.
