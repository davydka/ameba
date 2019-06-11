# Duotone Effect
Example of server-side and client-side duotone effect on image files using html-canvas and [node-canvas](https://github.com/Automattic/node-canvas).

* [server-side](js/cli.js)
* [in-browser](js/browser.js)

## Getting Started
* Clone the repo: `https://github.com/independentmedia/duo-exploration`
* Enter the `duo` directory in the repo: `cd duo/exploration`
* Install dependencies: `npm install`
* `webpack --watch js/browser.js bundle/js/browser.js` for client-side dev.

## Usage
Include the file [duo.js](js/duo.js).
```javascript
var Duo = require('./duo');
var options = {
	tone1: '112233',
	tone2: '445566',
	canvas: new Canvas || document.createElement('canvas');
}
var dataUrl = Duo.applyDuotone(img, options);
console.log(dataUrl);
```
## TODO
Gifs and Mp4 files support.
