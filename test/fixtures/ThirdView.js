var ribcage = require('ribcage-view');

module.exports = ribcage.extend({
  afterInit: function (opts) {
    this.rootView = opts.rootView;
  }
, events: {
    'click a.root': 'root'
  , 'click a.pop': 'pop'
  }
, template: function () { return '<a href="#" class="root">Root</a> <a href="#" class="pop">Pop</a>'; }
, root: function () {
    this.trigger('goToView', this.rootView);
  }
, pop: function () {
    this.trigger('pop');
  }
});
