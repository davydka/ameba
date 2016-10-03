# Duotone Effect
Example of server-side and client-side duotone effect on image files using html-canvas and [node-canvas](https://github.com/Automattic/node-canvas).

* [server-side](https://github.com/davydka/ameba/blob/master/duo/js/cli.js)
* [in-browser](https://github.com/davydka/ameba/blob/master/duo/js/browser.js)

##Getting Started
* Clone the repo: `https://github.com/davydka/ameba.git`
* Enter the `duo` directory in the repo: `cd ameba/duo`
* Install dependencies: `npm install`
* `webpack --watch js/browser.js bundle/js/browser.js` for client-side dev.

##Usage
Include the file [duo.js](https://github.com/davydka/ameba/blob/master/duo/js/duo.js).
```
var Duo = require('./duo');
var options = {
	tone1: '112233',
	tone2: '445566',
	canvas: new Canvas || document.createElement('canvas');
}
var dataUrl = Duo.applyDuotone(img, options);
console.log(dataUrl);
```

[Live Example - Client Side](http://107.170.100.207:8091/duo/)
