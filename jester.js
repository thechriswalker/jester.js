/**
 * jester.js - Touch interface gesture recogniser
 */
var jester = (function(){
    var module = {};
    //the current gesture.
    var gesture = {};
    //reset the current gesture.
    var resetGesture = function(){
        gesture = {
            src: null, //element at the start of the gesture
            srcX: 0, //pageX of the start
            srcY: 0, //pageY of the start
            curX: 0, //pageX of the touch NOW
            curY: 0, //pageY of the touch NOW
            scale: 1, //current scale (pinch amount from 2 finger motion)
            rotation: 0, //current rotation amount from 2 finger motion)
            touches: 0, //number of touches, 1 or more - 0 means touchend.
            known: false, //if we know what this gesture is, then this is true.
            handler: null
        };
    };
    // hold a incr pool;
    var incr = 0;
    //our Built in gesture recognisers.
    // recognisers have access to the current gesture object and they touch event. They choose whether
    // it matches them. If they want more state, they need to record it themselves on "recognise", e.g.
    // a swipe action may want to record time for calucating acceleration (for interia).
    // if they return true, then the "known" will be set to true and the defined handlers
    // will be triggered on subsequent touch events until touchend is fired

    //to use this, you must register it to a DOM element with:
    //  module.bind(el, recogniser_name or function, {start: fn, move: fn, end: fn});
    // where the handler functions are all optional.
    // actually scroll is special as it handle vertical and horizontal scrolling.
    module.scroll = function(vert){
        var direction = vert == 'vertical' ? 'vertical':'horizontal';
        var sensitivity = 10;
        var tolerance = 10;
        return function(e){
            //"this" is the state, e is the source event.
            //OK so a scroll means not much movement in one direction and more in another. Then proceed as usual.
            if(direction === 'vertical'){
                return (Math.abs(this.srcX - this.curX) < tolerance
                    &&
                    Math.abs(this.srcY - this.curY) > sensitivity);
            }else{
                //horizontal
                return (Math.abs(this.srcY - this.curY) < tolerance
                    &&
                    Math.abs(this.srcX - this.curX) > sensitivity);
            }
        };
    }

    module.pinch = function(e){
        return (this.scale < 0.95) || (this.scale > 1.05);
    }

    //the magic binding function.
    module.bind = function(el, recogniser, h){
        var nofn = function(){};
        var handlers = {start:nofn,move:nofn,end:nofn};
        if(typeof h !== 'undefined' && typeof h === 'object'){
            if(typeof h.start === 'function'){ handlers.start = h.start; }
            if(typeof h.move === 'function'){ handlers.move = h.move; }
            if(typeof h.end === 'function'){ handlers.end = h.end; }
        }
        var recog;
        if(typeof recogniser === 'function'){
            recog = recogniser;
        }else if(typeof recogniser === 'string' && typeof module[recogniser] === 'function'){
            recog = module[recogniser];
        }else{
            throw new TypeError('Recogniser must be a function or a known string');
        }
        var bindIndex = incr++;
        //OK, now bind.
        try{
            el.addEventListener('touchstart', handle(handlers, recog, bindIndex));
            el.addEventListener('touchmove', handle(handlers, recog, bindIndex));
            el.addEventListener('touchend', handle(handlers, recog, bindIndex));
            return true;
        }catch(e){
            return false;
        }
    }

    // the even more magic handling function.
    function handle(h,r,idx){
        var handlers = h;
        var recogniser = r;
        var i = idx;
        var stopBubble = function(e){
            e.cancelBubble = true;
            if(e.stopPropagation){ e.stopPropagation(); }
        };
        return function(e){
            e.preventDefault();
            if(e.type == 'touchend'){
                if(gesture.handler === i && gesture.known){
                    //call end gesture handler
                    handlers.end.call(gesture, e);
                    stopBubble(e);
                    return resetGesture();
                }
            }else if(e.type == 'touchstart'){
                //start of a touch, reset the gesture with initial values.
                gesture = {
                    src: e.srcElement,
                    srcX: e.touches[0].pageX,
                    srcY: e.touches[0].pageY,
                    curX: e.touches[0].pageX,
                    curY: e.touches[0].pageY,
                    scale: e.scale,
                    rotation: e.rotation,
                    touches: e.touches.length,
                    known: false,
                    handler: null
                }
            }else{
                //update gesture.
                gesture.curX = e.touches[0].pageX;
                gesture.curY = e.touches[0].pageY;
                gesture.scale = e.scale;
                gesture.rotation = e.rotation;
                gesture.touches = e.touches.length;
                //known?
                if(gesture.known && gesture.handler === i){
                    //call the move handler
                    handlers.move.call(gesture, e);
                    stopBubble(e);
                }else if(!gesture.known && recogniser.call(gesture, e)){
                    //we recognised it!
                    gesture.known = true;
                    gesture.handler = i;
                    //call the start handler
                    handlers.start.call(gesture,e);
                    stopBubble(e);
                }
            }
        }
    }

    //return the module.
    return module;
})();