var ribcage = require('ribcage-view')
  , SecondView = require('./SecondView');

module.exports = ribcage.extend({
  events: {'click a.push-second': 'push'}
, template: function () { return '<a href="#" class="push-second">Push</a>'; }
, push: function () {
    this.trigger('push', new SecondView({rootView: this}));
  }
});
