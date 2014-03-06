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

var angle = require('angle'),
    ev = require('event'),
    events  = require('events'),
    classes = require('classes'),
    emitter = require('emitter'),
    prevent = require('prevent'),
    prefix  = require('prefix'),
    translate = require('translate'),
    transitionend = require('transitionend');

// module globals

var transform = prefix('transform'),
    transition = prefix('transition'),
    hasTouch = 'ontouchstart' in window,
    evs, defaults;

evs = {
  down: hasTouch ? 'touchstart' : 'mousedown',
  move: hasTouch ? 'touchmove' : 'mousemove',
  up: hasTouch ? 'touchend' : 'mouseup',
  out: hasTouch ? 'touchcancel' : 'mouseout'
};

defaults = {
  disableLeft: false,
  disableRight: false,
  tapToClose: true,
  touchToDrag: true,
  hyperextensible: true,
  resistance: 0.5,
  flickThreshold: 50,
  transitionSpeed: 0.3,
  easing: 'ease',
  maxPosition: 266,
  minPosition: -266,
  slideIntent: 40, // degrees
  minDragDistance: 20
};

/**
 * helper function
 * get event pageX or pageY position
 *
 * @param  {String} t type X or Y
 * @param  {Event}  e
 * @return {Number} pageX or Y value
 */

var page = function page(t, e){
  return (hasTouch
      && e.touches.length
      && e.touches[0]) ? e.touches[0]['page'+t] : e['page'+t];
};

/**
 * Initialize a new `Snap`
 *
 * @param {Element} el
 * @param {Object} opts
 * @api public
 */

function Snap(el, opts) {
  this.el = el;
  this.state = {};
  this.opts = {};
  this.events = events(el, this);
  this.$parent = classes(this.el.parentNode),
  this.startListening(opts);
  this.translate(0);
}

/**
 * Expose Snap
 */

module.exports = Snap;


/**
 * set options
 *
 * @param {Object} opts
 * @api public
 */

Snap.prototype.setOpts = function(opts) {
  if (!opts) opts = {};
  for (var opt in defaults) {
    if (opts[opt] !== undefined)
      this.opts[opt] = opts[opt];
    else if (this.opts[opt] === undefined)
      this.opts[opt] = defaults[opt];
  }
};

/**
 * Mixin emitter
 */

emitter(Snap.prototype);

/**
 * get translation left position
 *
 * @return {Number}
 * @api private
 */

Snap.prototype.position = function() {
  var style = window.getComputedStyle(this.el),
      matrix = style[transform].match(/\((.*)\)/);
  if (matrix) {
    matrix = matrix[1].split(',');
    return parseInt(matrix[4], 10);
  } else {
    return +style.left.split('px')[0] || 0;
  }
};

/**
 * easeTo animation
 *
 * @param  {Number} n
 * @api private
 */

Snap.prototype.easeTo = function(n) {
  var _this = this;
  this.easing = true;
  this.el.style[transition] = 'all '
    + this.opts.transitionSpeed + 's ' + this.opts.easing;

  var cb = function() {
    var status;
    ev.unbind(_this.el, transitionend, cb);

    _this.el.style[transition] = '';
    _this.translation = n;
    _this.easing = false;

    if (n === window.innerWidth) {
      status = 'left-expand';
    } else if (n >= _this.opts.maxPosition) {
      status = 'left-open';
    } else if (n === -window.innerWidth) {
      status = 'right-expand';
    } else if (n <= _this.opts.minPosition) {
      status = 'right-open';
    } else {
      status = 'closed';
    }

    _this.setParentClass('snap-'+ status);
    _this.emit('toggle', status);
  };

  ev.bind(this.el, transitionend, cb);
  this.emit('animate', this.state);
  this.translate(n);
};

/**
 * set parent class
 *
 * @param {String} className
 * @private
 */

Snap.prototype.setParentClass = function(className) {
  this.$parent
    .removeMatching(/snap-/)
    .add(className);
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
      this.setParentClass('snap-left-opening');
    else if(opening === 'right')
      this.setParentClass('snap-right-opening');
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
  if((this.opts.disableLeft && n > 0) ||
    (this.opts.disableRight && n < 0)) return;

  if (!this.opts.hyperextensible) {
    if (n > this.opts.maxPosition)
      n = this.opts.maxPosition;
    else if(n < this.opts.minPosition)
      n = this.opts.minPosition;
  }

  translate(this.el, parseInt(n, 10), 0);
};

/**
 * Listen Drag events
 *
 * @param  {Object} opts
 * @api public
 */

Snap.prototype.startListening = function(opts) {
  this.stopListening();
  this.setOpts(opts);
  this.translation = 0;
  this.easing = false;
  if (this.opts.disableRight && this.opts.disableLeft) return;
  if (this.opts.touchToDrag) this.events.bind(evs.move, 'dragging');
  this.events.bind(evs.down, 'startDrag');
  this.events.bind(evs.up, 'endDrag');
};

/**
 * Stop listening to drag events
 *
 * @api public
 */

Snap.prototype.stopListening = function() {
  this.events.unbind();
};

/**
 * check if user can start a drag
 * @param  {Element} el
 * @return {[Element]}
 *
 * @api private
 */

Snap.prototype.ignoreDrag = function(el) {
  while (el.parentNode) {
    if (el === this.el) return null;
    if (el.getAttribute && el.getAttribute('data-snap-ignore')) return el;
    el = el.parentNode;
  }
  return null;
};

/**
 * Start drag
 * @param  {Event} e
 *
 * @api private
 */

Snap.prototype.startDrag = function(e) {
  // No drag on ignored elements
  var target = e.target ? e.target : e.srcElement;

  if (this.ignoreDrag(target)) return;

  this.emit('start', this.state);
  this.el.style[transition] = '';
  this.isDragging = true;
  this.hasIntent = null;
  this.intentChecked = false;

  this.startDragX = page('X', e);
  this.startDragY = page('Y', e);

  this.drag = {
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
  var thePageX = page('X', e),
      thePageY = page('Y', e),
      translated = this.translation,
      absoluteTranslation = this.position(),
      whileDragX = thePageX - this.startDragX,
      openingLeft = absoluteTranslation > 0,
      translateTo = whileDragX,
      diff;

  if (!this.hasIntent) {
    var deg = angle(this.startDragX, this.startDragY, thePageX, thePageY),
        inRightRange = (deg >= 0 && deg <= this.opts.slideIntent)
                    || (deg <= 360 && deg > (360 - this.opts.slideIntent)),

        inLeftRange = (deg >= 180 && deg <= (180 + this.opts.slideIntent))
                   || (deg <= 180 && deg >= (180 - this.opts.slideIntent));

    if (!inLeftRange && !inRightRange) {
      this.hasIntent = false;
    } else {
      this.hasIntent = true;
    }
    this.intentChecked = true;
  }

  // angle in range?
  if (!this.hasIntent) return;

  // prevent default
  prevent(e);

  // Has user met minimum drag distance?
  if (this.opts.minDragDistance >= Math.abs(thePageX-this.startDragX)) return;

  this.emit('drag', this.state);
  this.drag.current = thePageX;

  // Determine which direction we are going
  if (this.drag.last > thePageX) {
    if (this.drag.state !== 'left') {
      this.drag.state = 'left';
      this.drag.hold = thePageX;
    }
    this.drag.last = thePageX;
  } else if (this.drag.last < thePageX) {
    if (this.drag.state !== 'right') {
      this.drag.state = 'right';
      this.drag.hold = thePageX;
    }
    this.drag.last = thePageX;
  }

  if (openingLeft) {

    // Pulling too far to the right
    if (this.opts.maxPosition < absoluteTranslation) {
      diff = (absoluteTranslation - this.opts.maxPosition)
           * this.opts.resistance;

      translateTo = whileDragX - diff;
    }
    this.state = {
      opening: this.opening('left'),
      towards: this.drag.state,
      hyperExtending: this.opts.maxPosition < absoluteTranslation,
      halfway: absoluteTranslation > (this.opts.maxPosition / 2),
      flick: Math.abs(this.drag.current - this.drag.hold) > this.opts.flickThreshold,
      translation: {
        absolute: absoluteTranslation,
        relative: whileDragX,
        sinceDirectionChange: (this.drag.current - this.drag.hold),
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
      towards: this.drag.state,
      hyperExtending: this.opts.minPosition > absoluteTranslation,
      halfway: absoluteTranslation < (this.opts.minPosition / 2),
      flick: Math.abs(this.drag.current - this.drag.hold) > this.opts.flickThreshold,
      translation: {
        absolute: absoluteTranslation,
        relative: whileDragX,
        sinceDirectionChange: (this.drag.current - this.drag.hold),
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
  var translated = this.position();

  // Tap Close
  if (this.drag.current === 0 &&
    translated !== 0 && this.opts.tapToClose) {
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

      // Flicking Closed
      if (this.state.flick && this.state.towards === 'left') {
        this.easeTo(0);

      // Flicking Open OR At least halfway open OR hyperextending
      } else if (
        (this.state.flick && this.state.towards === 'right') ||
        (this.state.halfway || this.state.hyperExtending)
      ) {
        this.easeTo(this.opts.maxPosition); // Open Left
      }

    // Close Left
    } else {
      this.easeTo(0);
    }

  // Revealing Right
  } else if (this.state.opening === 'right') {

    // Halfway, Flicking, or Too Far Out
    if ((this.state.halfway || this.state.hyperExtending || this.state.flick)) {

      // Flicking Closed
      if (this.state.flick && this.state.towards === 'right') {
        this.easeTo(0);

      // Flicking Open OR At least halfway open OR hyperextending
      } else if (
        (this.state.flick && this.state.towards === 'left') ||
        (this.state.halfway || this.state.hyperExtending)
      ) {
        this.easeTo(this.opts.minPosition); // Open Right
      }

    // Close Right
    } else {
      this.easeTo(0);
    }
  }
  this.isDragging = false;
  this.startDragX = page('X', e);
};

/**
 * get drawers state
 *
 * @api public
 */

Snap.prototype.getState = function () {
  var fromLeft = this.position();
  if (fromLeft >= this.opts.maxPosition) return 'left';
  else if (fromLeft <= this.opts.minPosition) return 'right';
  return 'closed';
};

/**
 * open a drawer
 *
 * @param  {String} side
 * @api public
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
    this.open(side);
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

