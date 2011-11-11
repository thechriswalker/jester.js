# jester.js

An extensible Javascript Touch Device gesture recogniser

see the index.html for an example of the current built in recognisers.

# usage

```
jester.bind(
    [DOMElement], //the element to list on, e.g. `document`
    [Recogniser Function], // a function which will determine if this is a gesture (see source)
    { // an optional object containing optional callbacks to fire once this gesture is recognised,
      // for the rest of the touch, and on touch end.
        start: fn,
        move: fn,
        end: fn
    }
);
```
