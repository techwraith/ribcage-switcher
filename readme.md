Ribcage Switcher
================

A left and right swiping view switcher for `ribcage-ui`.

## Install

```
npm install ribcage-switcher
```

## Use

```javascript

  var Switcher = require('ribcage-switcher')
    , ribcage = require('ribcage-view')
    , FirstView
    , NextView = require('NextView')

  FirstView = ribcage.extend({
    events: {'click a': 'push'}
  , template: '<a href="#">Push</a>'
  , push: function () {
      this.trigger('push', new NextView({rootView: this}))
    }
  })

  var switcher = new Switcher({
    rootView: new FirstView()
  })

  // See tests for a more complex example

```

### Events

Triggering these events on a pane will cause the switcher to respond

 * `push` - Pass a view as the first argument, and the switcher will push it onto the stack and move to the new view
 * `pop` - Goes to the previous view and pops the last one off the stack
 * `goToView` - Pass a view as the first argument, and the switcher will backtrack there, popping off views as it goes

## Legacy Use

```javascript

  var Switcher = require('ribcage-switcher')

  var switcher = new Switcher({
    depth: 2
  })

  switcher.setPane(0, myView)
  switcher.setPane(1, myOtherView)

  switcher.goToPane(0)
  switcher.next()
  switcher.previous()

```

## Transition Events

The switcher will send panes `transition:start` and `transition:end` events.

```js
  // Fires `transition:start` immediately, and `transition:end` approx. 270-300ms later.
  switcher.next()

  // You can disable these events on a per-call basis
  switcher.goToPane(0, true)
  switcher.next(true)
  switcher.prev(true)
```

The switcher itself also emits `transition:start` and `transition:end` events.

```
  switcher.on('transition:end', function (paneIndex, paneView) {
    // Do something
  })
```

### Throttling Pane Renders

Rendering subviews in the middle of a transition can result in interface lag. Avoiding this issue is easy with panes that extend from `ribcage-view`.

```javascript
  var myPane = require('ribcage-view').extend({
    throttle: true  // Defaults to false
  })

  switcher.setPane(1, myPane)

  myPane.render() // Will run immediately

  switcher.next() // Start moving to the next pane

  setTimeout(function () {
    myPane.render() // Will run only after the switcher has transitioned
  }, 100)
```
