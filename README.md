# Fork Diff

This project is a fork of http://github.com/jakiestfu/Snap.js/ (Forked from 1.6.x )

# main differences
- use  component module dependencies
- bodyclasses snap-left-opening, snap-left-expand, snap-left-open, snap-right-expand, snap-right-open, snap-right-opening,  snap-closed
- mixin with emitter. events are animate, animated, ignore, start, drag, end
- public api
  	- constructor new Snap(el, opts)
	- setOpts(opts)
	- startListening(opts)
	- stopListening()
	- open(side)
	- toggle(side)
	- close()
	- expand(side)
	- getState()