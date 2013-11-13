Ribcage Switcher
================

A left and right swiping view switcher for `ribcage-ui`.

## install

```
npm install ribcage-switcher
```

## Use

```javascript

  var Switcher = require('ribcage-switcher')

  var switcher = new Switcher({
    depth: 2
  })

  switcher.setPane(0, myView)
  switcher.setPane(1, myOtherView)

  switcher.goToPane(0)
  switcher.next()
  switcher.pervious()

```
