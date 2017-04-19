var Duo = require('./duo.js');

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

	//just adding the canvas and hiding the image might be faster than setting the image source to a dataurl
	/*
	img.parentNode.insertBefore(img.canvas, img);
	img.style.display='none';
	*/
	img.src = dataUrl;
}

window.onload = start;

