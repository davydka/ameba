#Ripple Effect
Example of rippling effect on an image that increases as you scroll. Dependant on [pixi.js](http://www.pixijs.com/).

[Live example](http://107.170.100.207:8021/ripple/).

##Usage
Include [pixi](https://cdnjs.com/libraries/pixi.js) and the file [ripple.js](js/ripple.js).
```javascript
// Initialize the Ripple.
var options = {
	width: window.innerWidth,
	height: window.innerHeight,
	target: document.body,
	filterSource: 'filter_NRM.jpg',
	image: 'img.jpg',
}
Ripple.create(options);

/*
If you have your own requestAnimationFrame system you tell Ripple to not animate itself by passing animateSelf: false into the create options and then call Ripple.renderer.render(Ripple.stage) within your animation loop.
*/


//Here's an example using scrollTop to change Ripple.amount.
//Ripple.amount expects values between 0.0 to 1.0.
var targetEl = document.querySelector('body');
var targetHeight = targetEl.clientHeight - window.innerHeight;
var amount = targetEl.scrollTop / targetHeight;
var animateAmount = function() {
	amount = targetEl.scrollTop / targetHeight;
	Ripple.setAmount(amount);
	requestAnimationFrame( animateAmount );
}
requestAnimationFrame( animateAmount );

//Resize the renderer and fit the target image onresize.
window.onresize = function (event){
	var w = window.innerWidth;
	var h = window.innerHeight;

	Ripple.resizeRenderer(w, h);
	Ripple.fitImage(Ripple.sprite.width, Ripple.sprite.height, window.innerWidth, window.innerHeight);
}

//Change the Ripple image.
Ripple.setImage('http://image.jpg');

//Do stuff to the Ripple's canvas element.
Ripple.renderer.view.style.display = 'none';

//Destroy the Ripple
Ripple.destroy();
```
