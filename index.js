/*
 * Snap.js
 *
 * Copyright 2013, Jacob Kelley - http://jakiestfu.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/jakiestfu/Snap.js/
 * Version: 1.6.3
 */

/**
 * Module dependencies
 */

var bind = require('bind'),
    classes = require('classes'),
    Emitter = require('emitter'),
    Binder  = require('event'),
    prevent = require('prevent'),
    prefix  = require('prefix'),
    translate = require('translate'),
    transitionend = require('transitionend');

// module globals

var $body = classes(document.body),
    transform = prefix('transform'),
    transition = prefix('transition'),
    hasTouch = 'ontouchstart' in window,
    evs = {
      down: hasTouch ? 'touchstart' : 'mousedown',
      move: hasTouch ? 'touchmove' : 'mousemove',
      up: hasTouch ? 'touchend' : 'mouseup',
      out: hasTouch ? 'touchcancel' : 'mouseout'
    },
    defaults = {
      addBodyClasses: true,
      resistance: 0.5,
      flickThreshold: 50,
      transitionSpeed: 0.3,
      easing: 'ease',
      maxPosition: 266,
      minPosition: -266,
      tapToClose: true,
      touchToDrag: true,
      slideIntent: 40, // degrees
      minDragDistance: 5
    },
    snapClasses = [
      'snap-open-left', 'snap-opening-left',  'snap-expand-left',
      'snap-opening-right', 'snap-open-right', 'snap-expand-right',
      'snap-closed'
    ];

/**
 * Expose Snap
 */

module.exports = Snap;

/**
 * Initialize a new `Snap`
 *
 * @api public
 */

function Snap(el, opts) {
  this.el = el;
  this.state = {};
  this.opts = {};

  if (!opts) opts = {};
  for (var opt in defaults) {
    if (opts[opt] !== undefined)
      this.opts[opt] = opts[opt];
    else
      this.opts[opt] = defaults[opt];
  }

  this.$el = new Binder(this.el);
  this.startDrag = bind(this, this.startDrag);
  this.dragging = bind(this, this.dragging);
  this.endDrag = bind(this, this.endDrag);
  this.bindDrag();
}

/**
 * Mixin emitter
 */

Emitter(Snap.prototype);

/**
 * get transform matrix index
 *
 * @param  {Number} index
 * @return {Number}
 * @api private
 */

Snap.prototype.matrix = function(index) {
  var matrix = window.getComputedStyle(this.el)[transform].match(/\((.*)\)/);
  if (matrix) {
    matrix = matrix[1].split(',');
    return parseInt(matrix[index], 10);
  }
  return 0;
};

/**
 * easeTo animation
 *
 * @param  {Number} n
 * @api private
 */

Snap.prototype.easeTo = function(n) {
  var self = this;
  this.easing = true;
  this.el.style[transition] = 'all ' + this.opts.transitionSpeed + 's ' + this.opts.easing;

  var cb = function() {
    self.el.style[transition] = '';
    self.translation = n;
    self.easing = false;

    if (n == window.innerWidth) self.setBodyClass('snap-expand-left');
    else if (n >= self.opts.maxPosition) self.setBodyClass('snap-open-left');
    else if (n == -window.innerWidth) self.setBodyClass('snap-expand-right');
    else if (n <= self.opts.minPosition) self.setBodyClass('snap-open-right');
    else self.setBodyClass('snap-closed');

    self.emit('animated', self.state);
  };

  this.$el.once(transitionend, cb);
  this.emit('animate', self.state);
  this.translate(n);
};

/**
 * set body class
 *
 * @param {String} className
 * @private
 */

Snap.prototype.setBodyClass = function(className) {
  if (!this.opts.addBodyClasses) return;
  for (var i = 0; i < snapClasses.length; i++) {
    $body.remove(snapClasses[i]);
  }
  $body.add(className);
};

/**
 * set opening state
 *
 * @return {String}
 * @api private
 */

Snap.prototype.opening = function(opening) {
  if (this.state.opening !== opening) {
    if (opening === 'left')
      this.setBodyClass('snap-opening-left');
    else if(opening === 'right')
      this.setBodyClass('snap-opening-right');
  }
  return opening;
};

/**
 * translate n px
 *
 * @param  {Number} n
 * @api private
 */

Snap.prototype.translate = function(n) {
  if((this.disableLeft && n > 0) || (this.disableRight && n < 0)) return;
  translate(this.el, parseInt(n, 10), 0);
};

/**
 * Listen Drag events
 *
 * @api private
 */

Snap.prototype.bindDrag = function() {
  this.translation = 0;
  this.easing = false;
  this.unbindDrag()
  this.$el.on(evs.down, this.startDrag);
  this.$el.on(evs.move, this.dragging);
  this.$el.on(evs.up, this.endDrag);
};

/**
 * Stop listening to drag events
 *
 * @api private
 */

Snap.prototype.unbindDrag = function() {
  this.$el.off(evs.down, this.startDrag);
  this.$el.off(evs.move, this.dragging);
  this.$el.off(evs.up, this.endDrag);
};

/**
 * calculate angle of drag
 *
 * @param  {Number} x
 * @param  {Number} y
 * @return {Number}
 * @api @private
 */

Snap.prototype.angleOfDrag = function(x, y) {
  var degrees, theta;
  // Calc Theta
  theta = Math.atan2(-(this.startDragY - y), (this.startDragX - x));
  if (theta < 0) {
    theta += 2 * Math.PI;
  }
  // Calc Degrees
  degrees = Math.floor(theta * (180 / Math.PI) - 180);
  if (degrees < 0 && degrees > -180) {
      degrees = 360 - Math.abs(degrees);
  }
  return Math.abs(degrees);
};

/**
 * Start drag
 * @param  {Event} e
 *
 * @api private
 */

Snap.prototype.startDrag = function(e) {
  // No drag on ignored elements
  var src = e.target ? e.target : e.srcElement;
  if (src.dataset && src.dataset.snapIgnore === "true") {
    return this.emit('ignore');
  }

  this.emit('start', this.state);
  this.el.style[transition] = '';
  this.isDragging = true;
  this.hasIntent = null;
  this.intentChecked = false;
  this.startDragX = hasTouch ? e.touches[0].pageX : e.pageX;
  this.startDragY = hasTouch ? e.touches[0].pageY : e.pageY;
  this.dragWatchers = {
    current: 0,
    last: 0,
    hold: 0,
    state: ''
  };

  this.state = {
    opening: this.opening(null),
    towards: null,
    hyperExtending: null,
    halfway: null,
    flick: null,
    translation: {
      absolute: 0,
      relative: 0,
      sinceDirectionChange: 0,
      percentage: 0
    }
  };
};

/**
 * Dragging
 * @param  {Event} e
 *
 * @api private
 */

Snap.prototype.dragging = function(e) {
  if (!this.isDragging) return;
  var thePageX = hasTouch ? e.touches[0].pageX : e.pageX,
      thePageY = hasTouch ? e.touches[0].pageY : e.pageY,
      translated = this.translation,
      absoluteTranslation = this.matrix(4),
      whileDragX = thePageX - this.startDragX,
      openingLeft = absoluteTranslation > 0,
      translateTo = whileDragX,
      diff;

    if (!this.hasIntent) {
      var deg = this.angleOfDrag(thePageX, thePageY),
          inRightRange = (deg >= 0 && deg <= this.slideIntent) || (deg <= 360 && deg > (360 - this.slideIntent)),
          inLeftRange = (deg >= 180 && deg <= (180 + this.slideIntent)) || (deg <= 180 && deg >= (180 - this.slideIntent));
      if (!inLeftRange && !inRightRange) {
        this.hasIntent = false;
      } else {
        this.hasIntent = true;
      }
      this.intentChecked = true;
    }

    // Has user met minimum drag distance?
    if (this.minDragDistance >= Math.abs(thePageX-this.startDragX)  && !this.hasIntent)
      return;

    prevent(e);
    this.emit('drag', this.state);

    this.dragWatchers.current = thePageX;
    // Determine which direction we are going
    if (this.dragWatchers.last > thePageX) {
        if (this.dragWatchers.state !== 'left') {
            this.dragWatchers.state = 'left';
            this.dragWatchers.hold = thePageX;
        }
        this.dragWatchers.last = thePageX;
    } else if (this.dragWatchers.last < thePageX) {
        if (this.dragWatchers.state !== 'right') {
            this.dragWatchers.state = 'right';
            this.dragWatchers.hold = thePageX;
        }
        this.dragWatchers.last = thePageX;
    }

    if (openingLeft) {
        // Pulling too far to the right
        if (this.opts.maxPosition < absoluteTranslation) {
            diff = (absoluteTranslation - this.opts.maxPosition) * this.opts.resistance;
            translateTo = whileDragX - diff;
        }
        this.state = {
            opening: this.opening('left'),
            towards: this.dragWatchers.state,
            hyperExtending: this.opts.maxPosition < absoluteTranslation,
            halfway: absoluteTranslation > (this.opts.maxPosition / 2),
            flick: Math.abs(this.dragWatchers.current - this.dragWatchers.hold) > this.flickThreshold,
            translation: {
                absolute: absoluteTranslation,
                relative: whileDragX,
                sinceDirectionChange: (this.dragWatchers.current - this.dragWatchers.hold),
                percentage: (absoluteTranslation/this.opts.maxPosition)*100
            }
        };
    } else {
        // Pulling too far to the left
        if (this.opts.minPosition > absoluteTranslation) {
            diff = (absoluteTranslation - this.opts.minPosition) * this.opts.resistance;
            translateTo = whileDragX - diff;
        }
        this.state = {
            opening: this.opening('right'),
            towards: this.dragWatchers.state,
            hyperExtending: this.opts.minPosition > absoluteTranslation,
            halfway: absoluteTranslation < (this.opts.minPosition / 2),
            flick: Math.abs(this.dragWatchers.current - this.dragWatchers.hold) > this.flickThreshold,
            translation: {
                absolute: absoluteTranslation,
                relative: whileDragX,
                sinceDirectionChange: (this.dragWatchers.current - this.dragWatchers.hold),
                percentage: (absoluteTranslation/this.opts.minPosition)*100
            }
        };
    }
    this.translate(translateTo + translated);
};

/**
 * End Drag
 * @param  {Event} e
 *
 * @api private
 */

Snap.prototype.endDrag = function(e) {
  if (!this.isDragging) return;

  this.emit('end', this.state);
  var translated = this.matrix(4);

  // Tap Close
  if (this.dragWatchers.current === 0 && translated !== 0 && this.opts.tapToClose) {
      prevent(e);
      this.easeTo(0);
      this.isDragging = false;
      this.startDragX = 0;
      return;
  }
  // Revealing Left
  if (this.state.opening === 'left') {
      // Halfway, Flicking, or Too Far Out
      if ((this.state.halfway || this.state.hyperExtending || this.state.flick)) {
          if (this.state.flick && this.state.towards === 'left') { // Flicking Closed
              this.easeTo(0);
          } else if (
              (this.state.flick && this.state.towards === 'right') || // Flicking Open OR
              (this.state.halfway || this.state.hyperExtending) // At least halfway open OR hyperextending
          ) {
              this.easeTo(this.opts.maxPosition); // Open Left
          }
      } else {
          this.easeTo(0); // Close Left
      }
      // Revealing Right
  } else if (this.state.opening === 'right') {
      // Halfway, Flicking, or Too Far Out
      if ((this.state.halfway || this.state.hyperExtending || this.state.flick)) {
          if (this.state.flick && this.state.towards === 'right') { // Flicking Closed
              this.easeTo(0);
          } else if (
              (this.state.flick && this.state.towards === 'left') || // Flicking Open OR
              (this.state.halfway || this.state.hyperExtending) // At least halfway open OR hyperextending
          ) {
              this.easeTo(this.opts.minPosition); // Open Right
          }
      } else {
          this.easeTo(0); // Close Right
      }
  }
  this.isDragging = false;
  this.startDragX = hasTouch ? e.touches[0].pageX : e.pageX;
};

/**
 * open a drawer
 *
 *  @param  {String} side
 *  @api public
 */

Snap.prototype.open = function(side) {
  if (side === 'left') {
    this.state.opening = this.opening('left');
    this.state.towards = 'right';
    this.easeTo(this.opts.maxPosition);
  } else if (side === 'right') {
    this.state.opening = this.opening('right');
    this.state.towards = 'left';
    this.easeTo(this.opts.minPosition);
  }
};

/**
 * toggle a drawer
 *
 *  @param  {String} side
 *  @public
 */

Snap.prototype.toggle = function(side) {
  var state = this.getState();
  if (state === 'closed') {
    this.open('side');
  } else {
    this.close();
  }
};

/**
 * close drawer
 *
 * @api public
 */

Snap.prototype.close = function () {
  this.easeTo(0);
};

/**
 * full expand of left or right drawer
 * @param  {String} side
 *
 * @api public
 */

Snap.prototype.expand = function(side) {
  var to = window.innerWidth;
  if (side ==='right') to *= -1;
  this.easeTo(to);
};

/**
 * get drawers state
 *
 * @api public
 */

Snap.prototype.getState = function () {
  var fromLeft = this.matrix(4);
  if (fromLeft >= this.opts.maxPosition) return 'left';
  else if (fromLeft <= this.opts.minPosition) return 'right';
  return 'closed';
};
