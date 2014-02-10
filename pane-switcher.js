/* global $ */

var Base = require('ribcage-view')
  , wrap = require('lodash.wrap')
  , bind = require('lodash.bind')
  , debounce = require('lodash.debounce')
  , ScrollFix = require('scrollfix');

var PaneSwitcher = Base.extend({

  afterInit: function (opts) {
    this.options = opts;

    this.currentPane = this.options.currentPane || 0;

    if(opts.rootView) {
      this.options.depth = 1;
      this.options.rootView = opts.rootView;

      // Can't setPane now because render hasn't happened yet
      // Will setPane in afterRender
    }

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

    this.push = bind(this.push, this);
    this.pop = bind(this.pop, this);
    this.goToView = bind(this.goToView, this);

    this.resize = bind(this.resize, this);

    this.resizeAndOffset = debounce(bind(function () {
      this.resize();
      // Don't fire transition events
      this.goToPane(this.currentPane, false);
    }, this), 300);

    this.supportsTransitions = this._supportsTransitions();
  }

, resize: function () {
    this.paneWidth = this.$el.width();
    this.$('.pane').width(this.paneWidth);
    this.$holder.width(this.paneWidth * this.options.depth);
  }

, afterRender: function () {
    $(window).off('resize orientationchange', this.resizeAndOffset);

    // Pane Switchers should always have overflow hidden on them
    // no matter what the target element is
    this.$el.css('overflow', 'hidden');

    // Cache this for later, we'll need it all over the place.
    this.$holder = $('<div class="pane-holder">');

    this.paneWidth = this.$el.width();

    for (var i=0; i<this.options.depth; i++) {
      var pane = this['view' + i];

      // Wrap panes in a div so that the 110% height mobile hack doesn't affect subview elements
      this['$pane'+i] = $('<div class="pane pane-'+i+'">').append($('<div class="inner-pane">'));
      this.$holder.append(this['$pane'+i]);

      if(pane)
        this.setPane(i, pane, {render: false});
    }

    this.$el.empty().append(this.$holder);

    // Set the root view once
    if(this.options.rootView && !this.view0) {
      this.setPane(0, this.options.rootView);
    }

    $(window).on('resize orientationchange', this.resizeAndOffset);
    this.resize();
  }

, bindPaneEvents: function (pane) {
    this.stopListening(pane, 'previous');
    this.stopListening(pane, 'next');
    this.stopListening(pane, 'push');
    this.stopListening(pane, 'pop');
    this.stopListening(pane, 'goToView');
    this.listenTo(pane, 'previous', bind(this.previous, this));
    this.listenTo(pane, 'next', bind(this.next, this));
    this.listenTo(pane, 'push', this.push);
    this.listenTo(pane, 'pop', this.pop);
    this.listenTo(pane, 'goToView', this.goToView);
  }

, push: function (view) {
    this.options.depth = this.currentPane + 2;

    // Need to create the new pane
    this.render();

    this.setPane(this.currentPane + 1, view);
    this.goToPane(this.currentPane + 1);
  }

, pop: function () {
    var self = this
      , afterTransition
      , transitionEnded = false;

    afterTransition = function () {
      if(transitionEnded)
        return;

      transitionEnded = true;

      self.removeView('view' + (self.currentPane + 1));
      self.options.depth = (self.currentPane + 1);

      self.render();
    };

    this.once('transition:end', afterTransition);
    setTimeout(afterTransition, 400);

    this.goToPane(this.currentPane - 1);
  }

, goToView: function (view) {
    for(var i=0, ii=this.options.depth; i<ii; ++i) {
      if(this['view' + i] === view) {
        this.goToPane(i);
        return;
      }
    }

    throw new Error('View not found');
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
    var target = this['$pane'+num]
      , targetInnerPane = target.children(':first')
      , innerPane;

    if (this['view'+num]) {
      this.detachSubview(this['view'+num]);
    }

    // There already is an inner pane
    if(targetInnerPane.length) {
      pane.setElement(targetInnerPane);
      pane.render();
      this.appendSubview(pane, target);
    }
    // If we are re-attaching an existing pane
    else if(pane.$el.hasClass('inner-pane')) {
      this.appendSubview(pane, target);
    }
    // It is possible that the inner pane was removed
    // with a detached view
    else {
      innerPane = $('<div class="inner-pane"></div>');
      pane.setElement(innerPane);
      pane.render();
      this.appendSubview(pane, target);
    }

    this['view'+num] = pane;

    this.bindPaneEvents(pane);

    new ScrollFix(this['$pane'+num][0]);
  }

, beforeClose: function () {
    for(var i=0, ii=this.options.depth; i<ii; ++i) {
      this.removeView('view' + i);
    }

    $(window).off('resize orientationchange', this.resizeAndOffset);
  }

, removeView: function (key) {
    if(this[key]) {
      this.detachSubview(this[key]);
      this[key].close();
      delete this[key];
    }
  }

});

module.exports = PaneSwitcher;
