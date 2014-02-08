var ribcage = require('ribcage-view')
  , ThirdView = require('./ThirdView');

module.exports = ribcage.extend({
  afterInit: function (opts) {
    this.rootView = opts.rootView;
  }
, events: {
    'click a.push-third': 'push'
  , 'click a.pop-third': 'pop'
  }
, template: function () { return '<a href="#" class="push-third">Push</a> <a href="#" class="pop-third">Pop</a>'; }
, push: function () {
    this.trigger('push', new ThirdView({rootView: this.rootView}));
  }
, pop: function () {
    this.trigger('pop');
  }
});
