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
