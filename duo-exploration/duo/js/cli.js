var Duo = require('./duo');
var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

fs.readFile(__dirname + '/../assets/bw1.jpg', function(err, item){
	if (err) throw err;
	img = new Image;
	img.src = item;
	
	var options = {
		tone1: '112233',
		tone2: '445566',
		canvas: new Canvas
	}
	var dataUrl = Duo.applyDuotone(img, options);
	var base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

	fs.writeFile(__dirname + '/../assets/out.png', base64Data, 'base64', function(err) {
		if (err) throw err;
		console.log('file saved', __dirname + '/../assets/out.png');
	});
});
