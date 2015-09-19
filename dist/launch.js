(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['launch'] = factory();
  }
}(this, function () {

/*!
 * doc-ready.js
 */
var docReadyDocReady, launch;
docReadyDocReady = function (require) {
  /* -----------------------------------------------------------------------------
   * docReady
   * ---------------------------------------------------------------------------*/
  /**
   * @global
   * @public
   *
   * @desc Browser `document ready` helper.
   *
   * @example
   * docReady(function () {
   *   app.start();
   * });
   *
   * @example
   * docReady(childWindow, function () {
   *   child.doSomething();
   * });
   *
   * @param {object} [doc=document] - Document to check readyState of.
   * @param {string} callback - Function to execute once document is ready. Will
   *   be fired immediately if document is in a ready state.
   */
  var _docReady = function (doc, callback) {
    if (arguments.length === 1) {
      callback = doc;
      doc = document;
    }
    return doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', callback) : callback();
  };
  /* -----------------------------------------------------------------------------
   * expose
   * ---------------------------------------------------------------------------*/
  return _docReady;
}({});
/*!
 * launch.js
 */
launch = function (require) {
  /* -----------------------------------------------------------------------------
   * dependencies
   * ---------------------------------------------------------------------------*/
  var docReady = docReadyDocReady;
  /* -----------------------------------------------------------------------------
   * setup
   * ---------------------------------------------------------------------------*/
  // the following need to be stored on the parent window so that the child
  // window has access to them.
  window.launchJS = {
    intervals: {},
    instances: {},
    handlers: {},
    inject: function (windowDocument, code, name) {
      var id = 'launchjs-script-' + name;
      var scriptTag = document.getElementById(id);
      if (scriptTag) {
        return;
      }
      scriptTag = windowDocument.createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.text = code;
      scriptTag.id = id;
      docReady(windowDocument, function () {
        windowDocument.body.appendChild(scriptTag);
      });
    },
    injectParentInterval: function (name, launch) {
      var script = '(function () {';
      // If this is the first launch then we have access to the child via launchJS
      // instances.
      if (launch) {
        script += 'var child = window.launchJS.instances[\'' + name + '\'];';
      } else {
        script += 'var child = window.open(\'\', \'' + name + '\');';
        script += 'window.launchJS.instances[\'' + name + '\'] = child;';
      }
      script += 'window.launchJS.intervals[\'' + name + '\'] = window.setInterval(function () {';
      script += '  if (!child.launchJS) {';
      script += '    window.launchJS.injectChildInterval(child, ' + name + ');';
      script += '  }';
      script += '  if (child.closed) {';
      script += '    window.launchJS.closeChild(\'' + name + '\');';
      script += '  }';
      script += '}, 10);';
      script += '})();';
      window.launchJS.inject(window.document, script, name);
    },
    injectChildInterval: function (child) {
      var script = '(function () {';
      script += 'var parent = window.opener;';
      script += 'window.launchJS = window.setInterval(function () {';
      script += '  if (parent.launchJS && !parent.launchJS.intervals[window.name]) {';
      script += '    parent.launchJS.injectParentInterval(window.name);';
      script += '  }';
      script += '}, 10);';
      script += '})();';
      window.launchJS.inject(child.document, script, name);
    },
    closeChild: function (name) {
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
  return {
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
      var timeout = session ? 0 : 10;
      setTimeout(function () {
        session = window.launchJS.instances[strWindowName];
        return session ? callback(null, session) : callback(new Error('No session found'));
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
}({});

return launch;


}));