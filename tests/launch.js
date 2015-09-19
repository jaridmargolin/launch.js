/*!
 * test/launch.js
 */

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var path = require('path');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var chromedriver = require('chromedriver');
var webdriver = require('selenium-webdriver');


/* -----------------------------------------------------------------------------
 * setup
 * ---------------------------------------------------------------------------*/

var expect = chai.expect;
var By = webdriver.By;
var until = webdriver.until;

chai.should();
chai.use(chaiAsPromised);

// hack required to set should on Driver derived promises
Object.defineProperty(webdriver.promise.Promise.prototype, 'should', {
  get: Object.prototype.__lookupGetter__('should')
});

// add chrome driver to path for run
process.env.PATH += ';' + path.join(chromedriver.path);


/* -----------------------------------------------------------------------------
 * reusable
 * ---------------------------------------------------------------------------*/

var buildDriver = function () {
  driver = new webdriver.Builder()
    // .withCapabilities(webdriver.Capabilities.chrome())
    .withCapabilities(webdriver.Capabilities.firefox())
    .build();

  return driver.getWindowHandle();
};

var wait = function (duration, timeout) {
  var wait = true;
  setTimeout(function () { wait = false; }, duration);

  return driver.wait(function () {
    return !wait;
  }, timeout || 10000);
};

var refreshWindow = function () {
  return driver.navigate().refresh()
    .then(function () {
      return driver.executeScript('document.body.style.background = "red";');
    });
};

var closeWindow = function () {
  return driver.close();
};

var launchWindow = function () {
  return driver.findElement(By.id('launch'))
    .then(function (button) {
      return button.click();
    });
};

var getAllHandles = function () {
  return driver.getAllWindowHandles();
};

var getParentHandle = function () {
  return getAllHandles()
    .then(function (handles) {
      return handles[0];
    }); 
};

var getChildHandle = function () {
  return getAllHandles()
    .then(function (handles) {
      return handles[1];
    }); 
};

var getParentWindow = function () {
  return getParentHandle()
    .then(function (handle) {
      return driver.switchTo().window(handle);
    });
};

var getChildWindow = function () {
  return getChildHandle()
    .then(function (handle) {
      return driver.switchTo().window(handle);
    });
};

var hasChildReference = function () {
  var script = "return !!window.launchJS.instances['child'];";

  return wait(1000).then(function () {
    return driver.executeScript(script)
  });
};

var hasExecutedCallback = function () {
  var script = "return !!window['launchjs-session-closed'];";

  return wait(1000).then(function () {
    return driver.executeScript(script)
  });
};


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('launch.js', function () {

  this.timeout(10000);

  beforeEach(function () {
    return buildDriver().then(function () {
      return driver.get('http://0.0.0.0:9999/tests/parent.html');
    });
  });

  afterEach(function () {
    return driver.quit();
  });

  it('Should launch new window.', function () {
    return launchWindow()
      .then(getAllHandles)
      .then(function (handles) {
        return handles.length;
      }).should.eventually.equal(2);
  });

  it('Should store reference to child on parent window.', function () {
    return launchWindow()
      .then(hasChildReference).should.eventually.be.true;
  });

  it('Should store reference to child on parent refresh.', function () {
    return launchWindow()
      .then(refreshWindow)
      .then(hasChildReference).should.eventually.be.true;
  });

  it('Should keep reference to child on child refresh.', function () {
    return launchWindow()
      .then(getChildWindow)
      .then(refreshWindow)
      .then(getParentWindow)
      .then(hasChildReference).should.eventually.be.true;
  });

  it('Should store reference to child on child refresh and then parent refresh.', function () {
    return launchWindow()
      .then(getChildWindow)
      .then(refreshWindow)
      .then(getParentWindow)
      .then(refreshWindow)
      .then(hasChildReference).should.eventually.be.true;
  });

  it('Should execute onClose handler set after launch.open call.', function () {
    return launchWindow()
      .then(getChildWindow)
      .then(closeWindow)
      .then(getParentWindow)
      .then(hasExecutedCallback).should.eventually.be.true;
  });

  it('Should execute onClose handler set after launch.get call.', function () {
    return launchWindow()
      .then(refreshWindow)
      .then(getChildWindow)
      .then(closeWindow)
      .then(getParentWindow)
      .then(hasExecutedCallback).should.eventually.be.true;
  });

});