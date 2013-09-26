betterlink-interface
====================

Full user interaction for `betterlink.js`. Defines the user interface for:
- generating a new, personalized link
- communicating the URL after a successful submission
- highlighting the selected content after re-visiting a link

Use
--------

1. Clone the repository
2. In a browser, navigate to `file:///path/to/example_site.html`
  - the `betterlink` and `betterlink_user_interface` global variables will automatically load with the page \-\- **not initialized**
3. Click the 'Initialize Betterlink' button on the page
  - This executes the `finishBetterlinkInitialization()` function to initialize the core Betterlink script and the custom, locally-defined user interface
4. Select content on the page and 'share' as you normally would

Details
----------

This repository uses a special Betterlink build, `betterlink-no-interface.js`. This script contains all of the core functionality of `betterlink.js`, with a few main tweaks:
- The script isn't initialized on page load
- All requests to the server default to 'test mode' (this can be overriden)
- No user interface (duh -- that's the point of this repo)

**Script Initialization**

In order to allow custom styles and interaction to be defined, these have to be configured within Betterlink before initialization. If a Betterlink Highlight ID is present in the URL, we'd normally try to highlight that content immediately (but we can't without any styles!).

To initialize Betterlink, the following two methods must be executed:
- `betterlink.init()`
- `betterlink_user_interface.executeInitListeners()`

These are executed in the `finishBetterlinkInitialization()` function defined in `example_site.html`.

**Test Mode**

To demo basic selections and highlighting on the example site, 'test mode' should be sufficient for most tasks. This will even work for testing new selections on third-party webpages. Eventually though, you'll need to view examples of real, highlighted content. To do this, you'll need to disable 'test mode', and this can only be done during initialization.

To do this, replace `betterlink.init();` with 

```
initializationOptions = { enableHttpRequests: true };
betterlink.init(initializationOptions);
```

You'll need to execute this initialization option on any new page load for selecting content **or** displaying highlighted content.

**Defining a user interface**

The betterlink-interface code interacts with the core `betterlink-no-interface.js` script through a simple Observer eventing system. The full contract is detailed in our [wiki](https://github.com/betterlink/betterlink-interface/wiki/_pages).

Platform Support
------

With Betterlink, we strive to allow anyone to share content with anyone else \-\- the same way anyone can share a regular URL. To that end, we have wider platform support than most modern web services.

Yes, that means IE6.

Over 20% (and decreasing) of the Internet population in China still uses IE6. We'll continue to watch the numbers (http://www.ie6countdown.com/) and remove this support when appropriate.

We **do not** expect every feature to be available in every browser. However, three basic features are priority:

**For everyone**
- The ability to jump-to, highlight, or somehow distinguish the requested content on the page

**For _almost_ everyone**
- The ability to select content to share
- The ability to store your new link

Please consider the experience for mobile users and users with disabilities (ex: using a screenreader) in your contributions.

Contributing
---------

Pull Requests welcome.