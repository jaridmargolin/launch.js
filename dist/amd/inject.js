/*!
 * inject.js
 */


define(function (require) {


/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var docReady = require('doc-ready/doc-ready');


/* -----------------------------------------------------------------------------
 * inject
 * ---------------------------------------------------------------------------*/

return {

  injected: {},

  /**
   * @public
   * @memberof inject
   *
   * @desc
   *
   * @example
   * var id = inject.tagID('my-script');
   *
   * @param {string} name -
   *
   * @returns
   */
  tagID: function (name) {
    return "injectjs-script-" + name;
  },

  /**
   * @public
   * @memberof inject
   *
   * @desc
   *
   * @example
   * var id = inject.tagID('my-script');
   *
   * @param {string} name -
   *
   * @returns
   */
  injectedTag: function (doc, name) {
    return doc.getElementById(this.tagID(name));
  },

  /**
   * @public
   * @memberof inject
   *
   * @desc
   *
   * @example
   * var id = inject.tagID('my-script');
   *
   * @param {string} name -
   *
   * @returns
   */
  inject: function (doc, name, code) {
    return !this.injected[name]
      ? this.injectNew(doc, name, code)
      : null;
  },

  /**
   * @public
   * @memberof inject
   *
   * @desc
   *
   * @example
   * var id = inject.tagID('my-script');
   *
   * @param {string} name -
   *
   * @returns
   */
  remove: function (doc, name) {
    var tag = this.injectedTag(name);

    return tag
      ? doc.body.removeChild(tag)
      : null;
  },

  /**
   * @private
   * @memberof inject
   *
   * @desc
   *
   * @param {string} name -
   *
   * @returns
   */
  _injectNew: function (doc, name, code) {
    var tag = this.createTag(doc, name, code);
    this.appendTag(doc, name, tag);
  },

  /**
   * @private
   * @memberof inject
   *
   * @desc
   *
   * @param {string} name -
   *
   * @returns
   */
  _createTag: function (doc, name, code) {
    var tag = doc.createElement('script');
    tag.type = "text/javascript";
    tag.id = this.tagID(name);
    tag.text = code;

    return tag;
  },

  /**
   * @private
   * @memberof inject
   *
   * @desc
   *
   * @param {string} name -
   *
   * @returns
   */
  _appendTag: function (doc, name, tag) {
    this.injected[name] = true;

    docReady(doc, function () {
      doc.body.appendChild(tag);
    });
  }

};


// the following need to be stored on the parent window so that the child
// window has access to them.
window.launchJS = {

  intervals: {},
  instances: {},
  handlers: {},

  injectParentInterval: function (name, launch) {
    inject(window.document, name, parentTmpl({
      'name': name,
      'launch': launch
    }));
  },

  injectChildInterval: function () {
    inject(window.document, name, childTmpl());
  },

  closeChild: function (name) {
    inject.remove(window.document, name);

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


});