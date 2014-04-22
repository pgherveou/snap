
;(function(){

/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("component~emitter@1.1.2", function (exports, module) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});

require.register("component~event@0.1.3", function (exports, module) {
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});

require.register("component~query@0.0.3", function (exports, module) {
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});

require.register("component~matches-selector@0.1.2", function (exports, module) {
/**
 * Module dependencies.
 */

var query = require("component~query@0.0.3");

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});

require.register("discore~closest@0.1.2", function (exports, module) {
var matches = require("component~matches-selector@0.1.2")

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return  
  }
}
});

require.register("component~delegate@0.2.1", function (exports, module) {
/**
 * Module dependencies.
 */

var closest = require("discore~closest@0.1.2")
  , event = require("component~event@0.1.3");

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

});

require.register("component~events@1.0.6", function (exports, module) {

/**
 * Module dependencies.
 */

var events = require("component~event@0.1.3");
var delegate = require("component~delegate@0.2.1");

/**
 * Expose `Events`.
 */

module.exports = Events;

/**
 * Initialize an `Events` with the given
 * `el` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} el
 * @param {Object} obj
 * @api public
 */

function Events(el, obj) {
  if (!(this instanceof Events)) return new Events(el, obj);
  if (!el) throw new Error('element required');
  if (!obj) throw new Error('object required');
  this.el = el;
  this.obj = obj;
  this._events = {};
}

/**
 * Subscription helper.
 */

Events.prototype.sub = function(event, method, cb){
  this._events[event] = this._events[event] || {};
  this._events[event][method] = cb;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 * Examples:
 *
 *  Direct event handling:
 *
 *    events.bind('click') // implies "onclick"
 *    events.bind('click', 'remove')
 *    events.bind('click', 'sort', 'asc')
 *
 *  Delegated event handling:
 *
 *    events.bind('click li > a')
 *    events.bind('click li > a', 'remove')
 *    events.bind('click a.sort-ascending', 'sort', 'asc')
 *    events.bind('click a.sort-descending', 'sort', 'desc')
 *
 * @param {String} event
 * @param {String|function} [method]
 * @return {Function} callback
 * @api public
 */

Events.prototype.bind = function(event, method){
  var e = parse(event);
  var el = this.el;
  var obj = this.obj;
  var name = e.name;
  var method = method || 'on' + name;
  var args = [].slice.call(arguments, 2);

  // callback
  function cb(){
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // bind
  if (e.selector) {
    cb = delegate.bind(el, e.selector, name, cb);
  } else {
    events.bind(el, name, cb);
  }

  // subscription for unbinding
  this.sub(name, method, cb);

  return cb;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 * Examples:
 *
 *  Unbind direct handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * Unbind delegate handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * @param {String|Function} [event]
 * @param {String|Function} [method]
 * @api public
 */

Events.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);

  // no bindings for this event
  var bindings = this._events[event];
  if (!bindings) return;

  // no bindings for this method
  var cb = bindings[method];
  if (!cb) return;

  events.unbind(this.el, event, cb);
};

/**
 * Unbind all events.
 *
 * @api private
 */

Events.prototype.unbindAll = function(){
  for (var event in this._events) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

Events.prototype.unbindAllOf = function(event){
  var bindings = this._events[event];
  if (!bindings) return;

  for (var method in bindings) {
    this.unbind(event, method);
  }
};

/**
 * Parse `event`.
 *
 * @param {String} event
 * @return {Object}
 * @api private
 */

function parse(event) {
  var parts = event.split(/ +/);
  return {
    name: parts.shift(),
    selector: parts.join(' ')
  }
}

});

require.register("component~bind@0.0.1", function (exports, module) {

/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = [].slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});

require.register("component~transform-property@0.0.1", function (exports, module) {

var styles = [
  'webkitTransform',
  'MozTransform',
  'msTransform',
  'OTransform',
  'transform'
];

var el = document.createElement('p');
var style;

for (var i = 0; i < styles.length; i++) {
  style = styles[i];
  if (null != el.style[style]) {
    module.exports = style;
    break;
  }
}

});

require.register("component~has-translate3d@0.0.2", function (exports, module) {

var prop = require("component~transform-property@0.0.1");
if (!prop) return module.exports = false;

var map = {
  webkitTransform: '-webkit-transform',
  OTransform: '-o-transform',
  msTransform: '-ms-transform',
  MozTransform: '-moz-transform',
  transform: 'transform'
};

// from: https://gist.github.com/lorenzopolidori/3794226
var el = document.createElement('div');
el.style[prop] = 'translate3d(1px,1px,1px)';
document.body.insertBefore(el, null);
var val = window.getComputedStyle(el).getPropertyValue(map[prop]);
document.body.removeChild(el);
module.exports = null != val && val.length && 'none' != val;

});

require.register("component~translate@0.1.0", function (exports, module) {

/**
 * Module dependencies.
 */

var transform = require("component~transform-property@0.0.1");
var has3d = require("component~has-translate3d@0.0.2");


/**
 * Regexp to check "End with %"
 */

var percentRegexp = /%$/;


/**
 * Expose `translate`.
 */

module.exports = translate;


/**
 * Translate `el` by `(x, y)`.
 *
 * @param {Element} el
 * @param {Number|String} x
 * @param {Number|String} y 
 * @api public
 */


function translate(el, x, y){
  
  if (!percentRegexp.test(x)) x += 'px';
  if (!percentRegexp.test(y)) y += 'px';

  if (transform) {
    if (has3d) {
      el.style[transform] = 'translate3d(' + x + ', ' + y + ', 0)';
    } else {
      el.style[transform] = 'translate(' + x + ',' + y + ')';
    }
  } else {
    el.style.left = x;
    el.style.top = y;
  }
};

});

require.register("component~indexof@0.0.3", function (exports, module) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});

require.register("component~classes@1.2.1", function (exports, module) {
/**
 * Module dependencies.
 */

var index = require("component~indexof@0.0.3");

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});

require.register("pgherveou~angle@master", function (exports, module) {
/**
 * calculate the angle between two points
 * @param  {Number} x1
 * @param  {Number} y1
 * @param  {Number} x2
 * @param  {Number} y2
 *
 * @return {Number}    angle in degree
 */

module.exports = function(x1, y1, x2, y2) {
  var theta = Math.atan2(-(y1 - y2), (x1 - x2));
  if (theta < 0) theta += 2 * Math.PI;

  var degrees = Math.floor(theta * (180 / Math.PI) - 180);
  if (degrees < 0 && degrees > -180) degrees = 360 - Math.abs(degrees);

  return Math.abs(degrees);
};
});

require.register("yields~prevent@0.0.2", function (exports, module) {

/**
 * prevent default on the given `e`.
 * 
 * examples:
 * 
 *      anchor.onclick = prevent;
 *      anchor.onclick = function(e){
 *        if (something) return prevent(e);
 *      };
 * 
 * @param {Event} e
 */

module.exports = function(e){
  e = e || window.event
  return e.preventDefault
    ? e.preventDefault()
    : e.returnValue = false;
};

});

require.register("pgherveou~prefix@master", function (exports, module) {
// module globals

var prefixes = ['webkit','Moz','ms','O']
  , len = prefixes.length
  , p = document.createElement('p')
  , style = p.style
  , capitalize = function (str) {return str.charAt(0).toUpperCase() + str.slice(1);}
  , dasherize = function(str) {
      return str.replace(/([A-Z])/g, function(str,m1) {
        return '-' + m1.toLowerCase();
      });
    };

// nullify p to release dom node
p = null;

/**
 * get prefix for dom style
 *
 * example
 *   prefix('transform') // webkitTransform
 *   prefix('transform', true) // -webkit-transform
 *
 * @param  {String}   ppty dom style
 * @param  {Boolean}  dasherize
 * @return {String}   prefixed ppty
 * @api public
 */

module.exports = function(ppty, dasherized) {
  var Ppty, name, Name;

  // test without prefix
  if (style[ppty] !== undefined) {
    if (!dasherized) return ppty;
    return dasherize(ppty);
  }

  // test with prefix
  Ppty = capitalize(ppty);
  for (i = 0; i < len; i++) {
    name = prefixes[i] + Ppty;
    if (style[name] !== undefined) {
      if (!dasherized) return name;
      return '-' + prefixes[i].toLowerCase() + '-' + dasherize(ppty);
    }
  }

  // not found return empty string
  return '';
};

});

require.register("pgherveou~transitionend@master", function (exports, module) {
/**
 * module dependencies
 */

var prefix = require("pgherveou~prefix@master");

// transitionend mapping
// src: https://github.com/twitter/bootstrap/issues/2870

var transEndEventNames = {
    'webkitTransition' : 'webkitTransitionEnd',
    'WebkitTransition' : 'webkitTransitionEnd',
    'MozTransition'    : 'transitionend',
    'OTransition'      : 'oTransitionEnd',
    'msTransition'     : 'MSTransitionEnd',
    'transition'       : 'transitionend'
};

module.exports = transEndEventNames[prefix('transition')];
});

require.register("snap", function (exports, module) {
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

var angle = require("pgherveou~angle@master"),
    ev = require("component~event@0.1.3"),
    events  = require("component~events@1.0.6"),
    classes = require("component~classes@1.2.1"),
    emitter = require("component~emitter@1.1.2"),
    prevent = require("yields~prevent@0.0.2"),
    prefix  = require("pgherveou~prefix@master"),
    translate = require("component~translate@0.1.0"),
    transitionend = require("pgherveou~transitionend@master");

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


});

if (typeof exports == "object") {
  module.exports = require("snap");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("snap"); });
} else {
  this["Snap"] = require("snap");
}
})()
