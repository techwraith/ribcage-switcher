/* global $ */

var Base = require('ribcage-view')
  , wrap = require('lodash.wrap')
  , bind = require('lodash.bind')
  , debounce = require('lodash.debounce')
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

    this.resizeAndOffset = debounce(bind(function () {
      this.resize();
      // Don't fire transition events
      this.goToPane(this.currentPane, false);
    }, this), 300);

    this.supportsTransitions = this._supportsTransitions();
  }

, remove: function () {
    $(window).off('resize', this.resizeAndOffset);
    removeProxy.apply(this, arguments);
  }

, resize: function () {
    this.paneWidth = this.$el.width();
    this.$('.pane').width(this.paneWidth);
    this.$holder.width(this.paneWidth * this.options.depth);
  }

, afterRender: function () {
    $(window).off('resize', this.resizeAndOffset);

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
        pane.on('previous', bind(this.previous, this));
        pane.on('next', bind(this.next, this));
      }
    }

    this.$el.append(this.$holder);

    $(window).on('resize', this.resizeAndOffset);

    this.resize();
  }

, _next: function (noThrottle) {
    var currentLeft = this.getCurrentLeft();

    if (isNaN(currentLeft)){
      currentLeft = 0;
    }

    if(!noThrottle)
      this.throttleViews();

    this.setHolderLeft(currentLeft - this.paneWidth);
    this.currentPane++;
    this.trigger('switch', this.currentPane, this['view'+this.currentPane]);
    this['$pane'+this.currentPane].scrollTop(0);
  }

, _previous: function (noThrottle) {
    var currentLeft = this.getCurrentLeft();

    if(!noThrottle)
      this.throttleViews();

    this.setHolderLeft(currentLeft + this.paneWidth);
    this.currentPane--;
    this.trigger('switch', this.currentPane, this['view'+this.currentPane]);
  }

, goToPane: function (num, noThrottle) {
    if(!noThrottle && this.currentPane != num)
      this.throttleViews();

    this.setHolderLeft(this.paneWidth * -(num));
    this.currentPane = num;
    this.trigger('switch', this.currentPane, this['view'+this.currentPane]);
    this['$pane'+this.currentPane].scrollTop(0);
  }

, getCurrentLeft: function () {
    //FIXME: This value should be getable via: this.$holder.css('left');
    //       BUT... https://twitter.com/ChrisStumph/status/337364963750469632
    //       Seems to trace to webkit animation css, introduced by changing
    //       order of precedence when CSS files divided up.
    if(this.supportsTransitions) {
      return parseInt( this.$holder.attr('style').split('translate3d(')[1], 10 );
    }
    else {
      return parseInt( this.$holder.attr('style').split('left: ')[1], 10 );
    }
  }

  // Detect transition support
  // http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
, _supportsTransitions: function () {
    var b = document.body || document.documentElement
      , s = b.style
      , p = 'transition'
      , v;

    if(typeof s[p] == 'string') {return true; }

    // Tests for vendor specific prop
    v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
    p = p.charAt(0).toUpperCase() + p.substr(1);
    for(var i=0; i<v.length; i++) {
      if(typeof s[v[i] + p] == 'string') { return true; }
    }
    return false;
  }

, setHolderLeft: function (leftAmount) {
    if(this.supportsTransitions) {
      this.$holder.css({
        '-webkit-transform': 'translate3d(' + leftAmount + 'px, 0, 0)'
      , '-moz-transform': 'translate3d(' + leftAmount + 'px, 0, 0)'
      , '-o-transform': 'translate3d(' + leftAmount + 'px, 0, 0)'
      , 'transform': 'translate3d(' + leftAmount + 'px, 0, 0)'
      });
    }
    else {
      this.$holder.css('left', leftAmount + 'px');
    }
  }

, throttleViews: function () {
    var self = this
      , animationDuration = 300
      , animationEndEvents = [  'transitionend'
                              , 'webkitTransitionEnd'
                              , 'oTransitionEnd'
                              , 'otransitionend'
                              , 'MSTransitionEnd']
      , animationEvents = animationEndEvents.join(' ')
      , disableThrottling
      , animationTimeout
      , eachPane;

    eachPane = function (cb) {
      for (var i=0, ii=self.options.depth; i<ii; ++i) {
        if(self['view'+i])
          cb(self['view'+i]);
      }
    };

    disableThrottling = function () {
      clearTimeout(animationTimeout);

      self.trigger('transition:end', self.currentPane, self['view'+self.currentPane]);

      eachPane(function (subview) {
        subview.trigger('transition:end');
      });

      self.$holder.off(animationEvents, disableThrottling);
    };

    self.trigger('transition:start', self.currentPane, self['view'+self.currentPane]);

    eachPane(function (subview) {
      subview.trigger('transition:start');
    });

    self.$holder.one(animationEndEvents, disableThrottling);
    animationTimeout = setTimeout(disableThrottling, animationDuration);
  }

// FIXME: WHY THE HELL DO WE NEED THIS SOMETIMES?!
// Seriously, why the hell do we even need this?
/*
, resetHolderWidth: function () {
    var self = this
      , width = this.$holder.width();
    this.$holder.width(0);
    defer(function () {self.$holder.width(width);});
  }
*/

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
