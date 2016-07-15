/*!
 * launch.js
 */





/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var docReady = require('doc-ready/doc-ready');


/* -----------------------------------------------------------------------------
 * setup
 * ---------------------------------------------------------------------------*/

// the following need to be stored on the parent window so that the child
// window has access to them.
window.launchJS = {

  intervals: {},
  instances: {},
  handlers: {},
  pending: {},

  getScriptId: function (name) {
    return "launchjs-script-" + name;
  },

  getScriptTag: function (windowDocument, name) {
    var id = window.launchJS.getScriptId(name);
    return windowDocument.getElementById(id);
  },

  inject: function (windowDocument, code, name) {
    var scriptTag = window.launchJS.getScriptTag(windowDocument, name);

    if (scriptTag) {
      return;
    }

    scriptTag = windowDocument.createElement('script');
    scriptTag.id = window.launchJS.getScriptId(name);
    scriptTag.type = "text/javascript";
    scriptTag.text = code;

    window.launchJS.pending[name] = true;
    docReady(windowDocument, function () {
      delete window.launchJS.pending[name];
      windowDocument.body.appendChild(scriptTag);
    });
  },

  injectParentInterval: function (name, launch) {
    var script = "(function () {";

    // If this is the first launch then we have access to the child via launchJS
    // instances.
    if (launch) {
      script += "var child = window.launchJS.instances['" + name + "'];";

    // If we are here because the parent was refreshed and the child triggered this
    // method we need to retrieve a reference to the child by calling open with no
    // url.
    } else {
      script += "var child = window.open('', '" + name + "');";
      script += "window.launchJS.instances['" + name + "'] = child;";
    }

    script += "window.launchJS.intervals['" + name + "'] = window.setInterval(function () {";
    script += "  if (!child.launchJSChild && !window.launchJS.pending['" + name + "'] && child.location.host !== '') {";
    script += "    window.launchJS.injectChildInterval(child, '" + name + "');";
    script += "  }";
    script += "  if (child.closed) {";
    script += "    window.launchJS.closeChild('" + name + "');";
    script += "  }";
    script += "}, 10);";
    script += "})();";

    window.launchJS.inject(window.document, script, name);
  },

  injectChildInterval: function (child, name) {
    var script = "(function () {";
    script += "var parent = window.opener;";
    script += "window.launchJSChild = window.setInterval(function () {";
    script += "  if (parent.launchJS && !parent.launchJS.intervals[window.name]) {";
    script += "    parent.launchJS.injectParentInterval(window.name);";
    script += "  }";
    script += "}, 10);";
    script += "})();";

    window.launchJS.inject(child.document, script, name);
  },

  closeChild: function (name) {
    var scriptTag = window.launchJS.getScriptTag(window.document, name);
    window.document.body.removeChild(scriptTag);

    window.clearInterval(window.launchJS.intervals[name]);

    var closeHandler = window.launchJS.handlers[name];
    if (closeHandler) {
      closeHandler();
    }

    delete window.launchJS.handlers[name];
    delete window.launchJS.instances[name];
    delete window.launchJS.intervals[name];
  }

};


/* -----------------------------------------------------------------------------
 * launch
 * ---------------------------------------------------------------------------*/

/**
 * @global
 * @public
 * @namespace launch
 *
 * @desc Open and manage child windows (will persist references even on refresh).
 */
module.exports = {

  /**
   * @public
   * @memberof launch
   *
   * @desc Open a child window.
   *
   * @example
   * child = launch.open('http://url.com', 'window-name');
   *
   * @param {string} strUrl - The URL to be loaded in the newly opened window.
   *   strUrl can be an HTML document on the web, image file or any resource
   *   supported by the browser.
   * @param {string} strWindowName - A string name for the new window. The name
   *   can be used as the target of links and forms using the target attribute
   *   of an <a> or <form> element. The name should not contain any whitespace
   *   characters. Note that strWindowName does not specify the title of the
   *   new window.
   * @param {string} strWindowFeatures - An optional parameter listing the
   *   features (size, position, scrollbars, etc.) of the new window as a string.
   *   The string must not contain any whitespace, and each feature name and its
   *   value must be separated by a comma.
   *
   * @returns {object} Reference to child window.
   */
  open: function (strUrl, strWindowName, strWindowFeatures) {
    var child = window.open.apply(window, arguments);
    window.launchJS.instances[strWindowName] = child;
    window.launchJS.injectParentInterval(strWindowName, true);

    return child;
  },

  /**
   * @public
   * @memberof launch
   *
   * @desc Get a previosly opened Launch instance.
   *
   * @example
   * launch.get('window-name', function (err, child) {
   *   if (!err) { doSomething(child); }
   * });
   *
   * @param {string} strWindowName - The name used to open the child window.
   * @param {function} callback - Nodestyle callback. If no instance is found
   *   the first argument will return an error. If the instance is found the first
   *   paramter will be null and the second paramter will be the requested instance.
   */
  get: function (strWindowName, callback) {
    var session = window.launchJS.instances[strWindowName];
    // We default to 1000 due to browsers buffering interval/timeout events occruing
    // in non active tabs. Attempting to fetch any faster results in the get returning
    // an error because the child element has yet to attach itself on the parent.
    var timeout = session ? 0 : 1000;

    setTimeout(function () {
      session = window.launchJS.instances[strWindowName];
      return session
        ? callback(null, session)
        : callback(new Error('No session found'));
    }, timeout);
  },

  /**
   * @public
   * @memberof launch
   *
   * @desc Adds a close handler to the specified window.
   *
   * @example
   * launch.addCloseHandler('window-name', function () {
   *   doSomeCloseThing();
   * });
   *
   * @param {string} strWindowName - The name used to open the child window.
   * @param {function} handler - Handler to execute once child window has closed. 
   */
  addCloseHandler: function (name, handler) {
    window.launchJS.handlers[name] = handler;
  }

};


