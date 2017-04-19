var gm = require('gm');
var http = require('http');
var url = require('url');
var path = require('path');

var PORT = 8031;

function handleRequest(request, response){
	var query = url.parse(request.url,true).query;

	if(typeof query.url == 'undefined'){
		return response.end();
	}

	var c1 = query.end && query.end.replace(/^#/, '');
	var c2 = query.start && query.start.replace(/^#/, '');
	var matrix = buildMatrix(c1, c2);

	var callback = function(getResponse) {
		var data = [];

		getResponse.on('data', function(chunk) {
			data.push(chunk);
		}).on('end', function() {
			var basename = path.basename(url.parse(query.url).path);
			var extname = path.extname(basename);
			var buffer = Buffer.concat(data);

			gm(buffer, basename)
			.channel('gray')
			.recolor(matrix)
			.toBuffer(extname, function (err, buffer) {
				if (err) return handle(err);
				response.writeHead(200, {
					'Content-Type': getResponse.headers['content-type']
				});

				response.writeHead(getResponse.statusCode);
				response.write(buffer);
				response.end();
			});
		});

	}

	http.get(query.url, callback);
}

function buildMatrix(c1, c2){
	c1 = (typeof c1 !== 'undefined') ? c1 : '000000';
	c2 = (typeof c2 !== 'undefined') ? c2 : 'ffffff';

	c1 = hexToRGBDecimal(c1);
	c2 = hexToRGBDecimal(c2);

	// http://stackoverflow.com/questions/21977929/match-colors-in-fecolormatrix-filter
	// http://www.graphicsmagick.org/GraphicsMagick.html#details-recolor
	
	var matrixString = (c1[0] - c2[0]) + ' 0 0 0 ' + c2[0] + ' ' +
		(c1[1] - c2[1]) + ' 0 0 0 ' + c2[1] + ' ' +
		(c1[2] - c2[2]) + ' 0 0 0 ' + c2[2] + ' ' +
		'0 0 0 1 0 ' +
		'0 0 0 0 1 ';

	return matrixString;
}

function hexToRGBDecimal(hex){
	if (typeof hex !== 'string') {
		throw new TypeError('Expected a string');
	}

	hex = hex.replace(/^#/, '');

	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}

	var num = parseInt(hex, 16);

	return [
		(num >> 16)/255,
		(num >> 8 & 255)/255,
		(num & 255)/255
	];
}

var server = http.createServer(handleRequest);

server.listen(PORT, function(){
	console.log("Server listening on: http://localhost:%s", PORT);
});
