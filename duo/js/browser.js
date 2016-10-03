/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Duo = __webpack_require__(1);

	var imgs = Array.from(document.querySelectorAll('.img'));

	var start = function(){
		imgs.map(handleImg);
	}

	var handleImg = function(img){
		var options = {
			tone1: img.getAttribute('data-tone1'),
			tone2: img.getAttribute('data-tone2')
		}
		var dataUrl = Duo.applyDuotone(img, options);
		/*
		img.parentNode.insertBefore(img.canvas, img);
		img.style.display='none';
		*/
		img.src = dataUrl;
	}

	window.onload = start;



/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = {
		applyDuotone: function(img, options){
			img.canvas = options.canvas || document.createElement('canvas');
			img.ctx = img.canvas.getContext('2d');

			img.canvas.height = img.height;
			img.canvas.width = img.width;

			img.ctx.drawImage(img,0,0)
			img.imgData = img.ctx.getImageData(0,0,img.canvas.width,img.canvas.height);
			img.data = img.imgData.data;

			var gradient = this.gradientMap(options.tone1, options.tone2);
			for (var i = 0; i < img.data.length; i += 4) {
				img.data[i] = gradient[img.data[i]*4];
				img.data[i+1] = gradient[img.data[i+1]*4 + 1];
				img.data[i+2] = gradient[img.data[i+2]*4 + 2];
			}

			img.ctx.clearRect(0, 0, img.canvas.width, img.canvas.height);
			img.ctx.putImageData(img.imgData, 0, 0);

			return img.canvas.toDataURL();
		},

		gradientMap: function (tone1, tone2) {
			var rgb1 = this.hexToRgb(tone1);
			var rgb2 = this.hexToRgb(tone2);
			var gradient = [];
			for (var i = 0; i < (256*4); i += 4) {
				gradient[i] = ((256-(i/4))*rgb1.r + (i/4)*rgb2.r)/256;
				gradient[i+1] = ((256-(i/4))*rgb1.g + (i/4)*rgb2.g)/256;
				gradient[i+2] = ((256-(i/4))*rgb1.b + (i/4)*rgb2.b)/256;
				gradient[i+3] = 255;
			}
			return gradient;
		},

		hexToRgb: function(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}

	}


/***/ }
/******/ ]);