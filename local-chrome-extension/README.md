Chrome Extension: betterlink-interface
====================

This chrome extension can be loaded and run locally in order to demo the `betterlink-interface` implementation on external websites (anything other than the provided `example_site.html`).

This implementation is derived from betterlink/betterlink-distribution.

Extension Setup
--------

1. Within chrome, go to `chrome://extensions`
2. Select 'Developer mode' checkbox
3. Select 'Load unpacked extension...'
4. Choose directory at `betterlink-interface/local-chrome-extension/`
5. Navigate to any webpage to test the interface
  - `http://` sites only because secure (`https://`) sites will not load the local files

A webserver is required in order to host the local files for the Extension. This can be accomplished using the simple Rack (Ruby) application provided. From the root directory of this repository, run the following command:

```
rackup -p 1000
```
