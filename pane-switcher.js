var Base = require('ribcage-view')
  , wrap = require('lodash.wrap')
  , defer = require('lodash.defer')
  , bind = require('lodash.bind')
  , ScrollFix = require('scrollfix')
  , removeProxy = Base.prototype.remove;

var PaneSwitcher = Base.extend({

  afterInit: function () {

    this.currentPane = this.options.currentPane || 0;

    this.next = wrap(this.next, function (fn) {
      if (fn) {
        fn(this._next());
      } else {
        this._next();
      }
    });

    this.previous = wrap(this.previous, function (fn) {
      if (fn) {
        fn(this._previous());
      } else {
        this._previous();
      }
    });

    this.resize = bind(this.resize, this);

    $(window).on('resize', this.resize);
  }

, remove: function () {
    $(window).off('resize', this.resize);
    removeProxy.apply(this, arguments);
  }

, resize: function () {
    this.paneWidth = this.$el.width();
    this.$('.pane').width(this.paneWidth);
    this.$holder.width(this.paneWidth * this.options.depth);
  }

, afterRender: function () {

    // Pane Switchers should always have overflow hidden on them
    // no matter what the target element is
    this.$el.css('overflow', 'hidden');

    // Cache this for later, we'll need it all over the place.
    this.$holder = $('<div class="pane-holder">');

    this.paneWidth = this.$el.width();

    for (var i=0; i<this.options.depth; i++) {
      var pane = this['view' + i]
        , innerPane = $('<div class="inner-pane"></div>');

      // Wrap panes in a div so that the 110% height mobile hack doesn't affect subview elements
      this['$pane'+i] = $('<div class="pane pane-'+i+'"></div>').append(innerPane);
      new ScrollFix(this['$pane'+i][0]);
      this.$holder.append(this['$pane'+i]);

      if(pane) {
        pane.setElement(innerPane);
        pane.render();

        pane.delegateEvents();
        pane.on('previous', bind(this.previous, this))
        pane.on('next', bind(this.next, this))
      }
    }

    this.$el.append(this.$holder);

    this.resize();
  }

, _next: function () {
    //FIXME: This value should be getable via: this.$holder.css('left');
    //       BUT... https://twitter.com/ChrisStumph/status/337364963750469632
    //       Seems to trace to webkit animation css, introduced by changing
    //       order of precedence when CSS files divided up.
    var currentLeft = parseInt( this.$holder.attr('style').split('left: ')[1] );
    if (isNaN(currentLeft)){
      currentLeft = 0
    }
    this.$holder.css('left', currentLeft - this.paneWidth);
    this.resetHolderWidth();
    this.currentPane++;
    this.trigger('switch', this.currentPane, this['view'+this.currentPane]);
    this['$pane'+this.currentPane].scrollTop(0);
  }

, _previous: function () {
    var self = this;
    //FIXME: Same as above regarding this.$holder.css('left');
    var currentLeft = parseInt(this.$holder.attr('style').split('left: ')[1]);
    this.$holder.css('left', currentLeft + this.paneWidth);
    this.resetHolderWidth();
    this.currentPane--;
    this.trigger('switch', this.currentPane, this['view'+this.currentPane]);
  }

, goToPane: function (num) {
    this.$holder.css('left', this.paneWidth * -(num))
    this.resetHolderWidth();
    this.currentPane = num;
    this.trigger('switch', this.currentPane, this['view'+this.currentPane]);
    this['$pane'+this.currentPane].scrollTop(0);
  }

// FIXME: WHY THE HELL DO WE NEED THIS SOMETIMES?!
, resetHolderWidth: function () {
    var self = this
      , width = this.$holder.width();
    this.$holder.width(0);
    defer(function () { self.$holder.width(width);});
  }

, setPane: function (num, pane) {
    var target = this['$pane'+num];
    if (this['view'+num]) {
      this.detachSubview(this['view'+num]);
    }
    this['view'+num] = pane;

    this.appendSubview(pane, target.children(':first'));

    new ScrollFix(this['$pane'+num][0]);
  }

});

module.exports = PaneSwitcher;
