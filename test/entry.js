/* globals mocha, describe, it, after */

var assert = require('assert')
  , fixture = document.getElementById('fixture')
  , SwitcherView = require('../pane-switcher.js')
  , FirstView = require('./fixtures/FirstView')
  , instances = {}; // A temporary holder that we can `delete` to clear leaks

mocha.setup({
  ui: 'bdd',
  globals: []
}).timeout(10000);

describe('A Simple Switcher', function () {
  var nextLink;

  it('should not throw when initialized with a root view', function () {
    instances.viewInstance = new SwitcherView({rootView: new FirstView()});
  });

  it('should append an switcher div', function () {
    var switcher
      , paneHolder
      , firstPane
      , innerPane;

    fixture.appendChild(instances.viewInstance.el);

    // This is the wrapper
    assert.equal(fixture.children.length, 1);

    // This is the switcher
    switcher = fixture.children[0];
    assert.equal(switcher.children.length, 1);
    assert.equal(switcher.children[0].tagName, 'DIV');

    // This is the pane holder
    paneHolder = switcher.children[0];
    assert.equal(paneHolder.className.split(' ').length, 1);
    assert.ok(paneHolder.className.split(' ').indexOf('pane-holder') >= 0);

    // There should be only one pane
    assert.equal(paneHolder.children.length, 1);

    // This is the first (and only pane) in the pane holder
    firstPane = paneHolder.children[0];
    assert.equal(firstPane.className.split(' ').length, 2);
    assert.ok(firstPane.className.split(' ').indexOf('pane') >= 0);
    assert.ok(firstPane.className.split(' ').indexOf('pane-0') >= 0);

    // The inner pane contains the goodies
    innerPane = firstPane.children[0];
    assert.equal(innerPane.className.split(' ').length, 1);
    assert.ok(innerPane.className.split(' ').indexOf('inner-pane') >= 0);

    // Make sure there is a next link inside
    nextLink = innerPane.children[0];
    assert.equal(nextLink.tagName, 'A');
  });

  it('should push the second view', function () {
    var switcher
      , paneHolder
      , firstPane
      , nextLink;

    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    firstPane = paneHolder.children[0];
    nextLink = firstPane.children[0].children[0];

    nextLink.click();

    // There should now be two panes
    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    assert.equal(paneHolder.children.length, 2);

    // There should be two links in the second pane
    assert.equal(paneHolder.children[1].children[0].children.length, 2);
  });

  it('should pop the second view', function () {
    var switcher
      , paneHolder
      , secondPane
      , nextLink;

    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    secondPane = paneHolder.children[1];
    nextLink = secondPane.children[0].children[1];

    nextLink.click();

    // There should now be one pane
    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    assert.equal(paneHolder.children.length, 1);
  });

  it('should push the second view', function () {
    var switcher
      , paneHolder
      , firstPane
      , nextLink;

    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    firstPane = paneHolder.children[0];
    nextLink = firstPane.children[0].children[0];
    nextLink.click();

    // There should now be two panes
    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    assert.equal(paneHolder.children.length, 2);

    // There should be two links in the second pane
    assert.equal(paneHolder.children[1].children[0].children.length, 2);
  });

  it('should push the third view', function () {
    var switcher
      , paneHolder
      , secondPane
      , nextLink;

    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    secondPane = paneHolder.children[1];
    nextLink = secondPane.children[0].children[0];

    nextLink.click();

    // There should now be three panes
    switcher = fixture.children[0];
    paneHolder = switcher.children[0];
    assert.equal(paneHolder.children.length, 3);

    // There should be two links in the third pane
    assert.equal(paneHolder.children[2].children[0].children.length, 2);
  });

  it('should detach when closed', function () {
    instances.viewInstance.close();
    assert.equal(fixture.children.length, 0);
    assert.equal(fixture.innerHTML, '');
  });

  delete instances.viewInstance;
});

// Need this to be leakproof
after(function () {
  for(var k in instances)
    delete instances[k];
});

onload = function(){
  mocha.run();
};
