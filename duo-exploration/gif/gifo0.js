
var url = 'gif.gif';

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var tmpCanvas = document.createElement('canvas');
document.body.appendChild(canvas);
document.body.appendChild(tmpCanvas);

var arrayBufferView = null;
var blob = null;
var urlCreator = null
var imageUrl = null

var hdr;
var stream;
var frame = null;
var frames = [];
var frameOffsets = [];
var transparency = null;
var delay = null;
var lastDisposalMethod = null;
var disposalMethod = null;


var xhr = new XMLHttpRequest();
xhr.onload = function() {
	if (xhr.readyState === 4) {
		if (xhr.status === 200) {
			//callback.apply(xhr, args);
			arrayBufferView = new Uint8Array( xhr.response );
			blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
			urlCreator = window.URL || window.webkitURL;
			imageUrl = urlCreator.createObjectURL( blob );

			var image = new Image();
			image.src = imageUrl;
			image.onload = function() {
				canvas.height = image.height;
				canvas.width = image.width;
				tmpCanvas.height = image.height;
				tmpCanvas.width = image.width;
				handleImage();
			}
		} else {
			console.error(xhr.statusText);
		}
	}
}

xhr.responseType = 'arraybuffer';
xhr.open('GET', url, true);
xhr.timeout = 1000;
xhr.send(null);


var handleImage = function(){
	stream = new Stream(arrayBufferView);
	parseHeader();
	parseBlock();
}


/* weird shit */
var doNothing = function () {};
var doGCE = function (gce) {
	pushFrame();
	clear();
	transparency = gce.transparencyGiven ? gce.transparencyIndex : null;
	delay = gce.delayTime;
	disposalMethod = gce.disposalMethod;
}
var doImg = function (img) {
	if (!frame) frame = tmpCanvas.getContext('2d');

	var currIdx = frames.length;

	//ct = color table, gct = global color table
	var ct = img.lctFlag ? img.lct : hdr.gct; // TODO: What if neither exists?

	/*
	Disposal method indicates the way in which the graphic is to
	be treated after being displayed.

	Values :    0 - No disposal specified. The decoder is
		    not required to take any action.
		1 - Do not dispose. The graphic is to be left
		    in place.
		2 - Restore to background color. The area used by the
		    graphic must be restored to the background color.
		3 - Restore to previous. The decoder is required to
		    restore the area overwritten by the graphic with
		    what was there prior to rendering the graphic.

		    Importantly, "previous" means the frame state
		    after the last disposal of method 0, 1, or 2.
	*/
	if (currIdx > 0) {
	if (lastDisposalMethod === 3) {
	    // Restore to previous
	    // If we disposed every frame including first frame up to this point, then we have
	    // no composited frame to restore to. In this case, restore to background instead.
	    if (disposalRestoreFromIdx !== null) {
		frame.putImageData(frames[disposalRestoreFromIdx].data, 0, 0);
	    } else {
		frame.clearRect(lastImg.leftPos, lastImg.topPos, lastImg.width, lastImg.height);
	    }
	} else {
	    disposalRestoreFromIdx = currIdx - 1;
	}

	if (lastDisposalMethod === 2) {
	    // Restore to background color
	    // Browser implementations historically restore to transparent; we do the same.
	    // http://www.wizards-toolkit.org/discourse-server/viewtopic.php?f=1&t=21172#p86079
	    frame.clearRect(lastImg.leftPos, lastImg.topPos, lastImg.width, lastImg.height);
	}
	}
	// else, Undefined/Do not dispose.
	// frame contains final pixel data from the last frame; do nothing

	//Get existing pixels for img region after applying disposal method
	var imgData = frame.getImageData(img.leftPos, img.topPos, img.width, img.height);

	//apply color table colors
	img.pixels.forEach(function (pixel, i) {
		if (pixel !== transparency) {
			imgData.data[i * 4 + 0] = ct[pixel][0];
			imgData.data[i * 4 + 1] = ct[pixel][1];
			imgData.data[i * 4 + 2] = ct[pixel][2];
			imgData.data[i * 4 + 3] = 255; // Opaque.
		}
	});

	frame.putImageData(imgData, img.leftPos, img.topPos);

	ctx.drawImage(tmpCanvas, 0, 0);
}
var withProgress = function (fn, draw) {
	return function (block) {
		//console.log(fn);
		fn && fn(block);
		//doDecodeProgress(draw);
	};
};
var clear = function () {
	transparency = null;
	delay = null;
	lastDisposalMethod = disposalMethod;
	disposalMethod = null;
	frame = null;
}
var handler = {
	//hdr: withProgress(doHdr),
	gce: withProgress(doGCE),
	com: withProgress(doNothing),
	app: {
		NETSCAPE: withProgress(doNothing)
	},
	img: withProgress(doImg, true),
	eof: function (block) {
		pushFrame();
		//doDecodeProgress(false);
	}
};
var pushFrame = function () {
	if (!frame) return;
	frames.push({
		data: frame.getImageData(0, 0, hdr.width, hdr.height),
		delay: delay
	});
	frameOffsets.push({ x: 0, y: 0 });
}
/* end weird shit */


var parseHeader = function(){
	hdr = {};
	hdr.sig = stream.read(3);
	hdr.ver = stream.read(3);
	if (hdr.sig !== 'GIF'){
		console.log('not a gif');
		return;
	}
	hdr.width = stream.readUnsigned();
	hdr.height = stream.readUnsigned();

	var bits = byteToBitArr(stream.readByte());
	hdr.gctFlag = bits.shift();
	hdr.colorRes = bitsToNum(bits.splice(0, 3));
	hdr.sorted = bits.shift();
	hdr.gctSize = bitsToNum(bits.splice(0, 3));

	hdr.bgColor = stream.readByte();
	hdr.pixelAspectRatio = stream.readByte(); // if not 0, aspectRatio = (pixelAspectRatio + 15) / 64
	if (hdr.gctFlag) {
		hdr.gct = parseCT(1 << (hdr.gctSize + 1));
	}
	console.log(hdr);
	//handler.hdr && handler.hdr(hdr);
}

var parseBlock = function(){
	var block = {};
	block.sentinel = stream.readByte();

	switch (String.fromCharCode(block.sentinel)) { // For ease of matching
		case '!':
			block.type = 'ext';
			parseExt(block);
			break;
		case ',':
			block.type = 'img';
			parseImg(block);
			break;
		case ';':
			block.type = 'eof';
			handler.eof && handler.eof(block);
			break;
		default:
			console.log('Unknown block: 0x' + block.sentinel.toString(16));
			return;
	}
	if (block.type !== 'eof'){
		parseBlock();
	}
}

var parseExt = function (block) {
	var parseGCExt = function (block) {
		var blockSize = stream.readByte(); // Always 4
		var bits = byteToBitArr(stream.readByte());
		block.reserved = bits.splice(0, 3); // Reserved; should be 000.
		block.disposalMethod = bitsToNum(bits.splice(0, 3));
		block.userInput = bits.shift();
		block.transparencyGiven = bits.shift();

		block.delayTime = stream.readUnsigned();

		block.transparencyIndex = stream.readByte();

		block.terminator = stream.readByte();

		//handler.gce && handler.gce(block);
	};

	var parseComExt = function (block) {
		block.comment = readSubBlocks();
		handler.com && handler.com(block);
	};

	var parsePTExt = function (block) {
		// No one *ever* uses this. If you use it, deal with parsing it yourself.
		var blockSize = st.readByte(); // Always 12
		block.ptHeader = st.readBytes(12);
		block.ptData = readSubBlocks();
		handler.pte && handler.pte(block);
	};

	var parseAppExt = function (block) {
		var parseNetscapeExt = function (block) {
			var blockSize = stream.readByte(); // Always 3
			block.unknown = stream.readByte(); // ??? Always 1? What is this?
			block.iterations = stream.readUnsigned();
			block.terminator = stream.readByte();
			handler.app && handler.app.NETSCAPE && handler.app.NETSCAPE(block);
		};

		var parseUnknownAppExt = function (block) {
			block.appData = readSubBlocks();
			// FIXME: This won't work if a handler wants to match on any identifier.
			handler.app && handler.app[block.identifier] && handler.app[block.identifier](block);
		};

		var blockSize = stream.readByte(); // Always 11
		block.identifier = stream.read(8);
		block.authCode = stream.read(3);
		switch (block.identifier) {
			case 'NETSCAPE':
				parseNetscapeExt(block);
				break;
			default:
				parseUnknownAppExt(block);
				break;
		}
	};

	var parseUnknownExt = function (block) {
		block.data = readSubBlocks();
		handler.unknown && handler.unknown(block);
	};

	block.label = stream.readByte();
	switch (block.label) {
		case 0xF9:
			block.extType = 'gce';
			parseGCExt(block);
			break;
		case 0xFE:
			block.extType = 'com';
			parseComExt(block);
			break;
		case 0x01:
			block.extType = 'pte';
			parsePTExt(block);
			break;
		case 0xFF:
			block.extType = 'app';
			parseAppExt(block);
			break;
		default:
			block.extType = 'unknown';
			parseUnknownExt(block);
			break;
	}
};

var parseImg = function (img) {
	var deinterlace = function (pixels, width) {
		// Of course this defeats the purpose of interlacing. And it's *probably*
		// the least efficient way it's ever been implemented. But nevertheless...
		var newPixels = new Array(pixels.length);
		var rows = pixels.length / width;
		var cpRow = function (toRow, fromRow) {
			var fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
			newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
		};

		// See appendix E.
		var offsets = [0, 4, 2, 1];
		var steps = [8, 8, 4, 2];

		var fromRow = 0;
		for (var pass = 0; pass < 4; pass++) {
			for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
				cpRow(toRow, fromRow)
				fromRow++;
			}
		}

		return newPixels;
	};

	img.leftPos = stream.readUnsigned();
	img.topPos = stream.readUnsigned();
	img.width = stream.readUnsigned();
	img.height = stream.readUnsigned();

	var bits = byteToBitArr(stream.readByte());
	img.lctFlag = bits.shift();
	img.interlaced = bits.shift();
	img.sorted = bits.shift();
	img.reserved = bits.splice(0, 2);
	img.lctSize = bitsToNum(bits.splice(0, 3));

	if (img.lctFlag) {
	img.lct = parseCT(1 << (img.lctSize + 1));
	}

	img.lzwMinCodeSize = stream.readByte();

	var lzwData = readSubBlocks();

	img.pixels = lzwDecode(img.lzwMinCodeSize, lzwData);

	if (img.interlaced) { // Move
		img.pixels = deinterlace(img.pixels, img.width);
	}

	handler.img && handler.img(img);
}

var lzwDecode = function (minCodeSize, data) {
	var pos = 0;
	var readCode = function (size) {
		var code = 0;
		for (var i = 0; i < size; i++) {
			if (data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
				code |= 1 << i;
			}
			pos++;
		}
		return code;
	}

	var output = [];

	var clearCode = 1 << minCodeSize;
	var eoiCode = clearCode + 1;

	var codeSize = minCodeSize + 1;

	var dict = [];

	var clear = function () {
		dict = [];
		codeSize = minCodeSize + 1;
		for (var i = 0; i < clearCode; i++) {
			dict[i] = [i];
		}
		dict[clearCode] = [];
		dict[eoiCode] = null;
	}

	var code;
	var last;

	while (true) {
		last = code;
		code = readCode(codeSize);

		if (code === clearCode) {
			clear();
			continue;
		}
		if (code === eoiCode) break;

		if (code < dict.length) {
			if (last !== clearCode) {
				dict.push(dict[last].concat(dict[code][0]));
			}
		} else {
			if (code !== dict.length) throw new Error('Invalid LZW code.');
			dict.push(dict[last].concat(dict[last][0]));
		}
		output.push.apply(output, dict[code]);

		if (dict.length === (1 << codeSize) && codeSize < 12) {
			// If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
			codeSize++;
		}
	}

	return output;
}


/* UTILS */
var bitsToNum = function (ba) {
	return ba.reduce(function (s, n) {
		return s * 2 + n;
	}, 0);
}
var byteToBitArr = function (bite) {
	var a = [];
	for (var i = 7; i >= 0; i--) {
		a.push( !! (bite & (1 << i)));
	}
	return a;
}
/* END UTILS */

/* DATA HOLDER THINGY */
var Stream = function(data){
	this.data = data;
	this.length = this.data.length;
	this.pos = 0;

	this.readByte = function () {
		if (this.pos >= this.data.length) {
			throw new Error('Attempted to read past end of stream.');
		}
		if (data instanceof Uint8Array)
			return data[this.pos++];
		else
			return data.charCodeAt(this.pos++) & 0xFF;
	};

	this.readBytes = function (n) {
		var bytes = [];
		for (var i = 0; i < n; i++) {
			bytes.push(this.readByte());
		}
		return bytes;
	};

	this.read = function (n) {
		var s = '';
		for (var i = 0; i < n; i++) {
			s += String.fromCharCode(this.readByte());
		}
		return s;
	};

	this.readUnsigned = function () { // Little-endian.
		var a = this.readBytes(2);
		return (a[1] << 8) + a[0];
	};
}
/* END DATA HOLDER THINGY */

/* LZW (GIF-specific) */
var parseCT = function (entries) { // Each entry is 3 bytes, for RGB.
	var ct = [];
	for (var i = 0; i < entries; i++) {
		ct.push(stream.readBytes(3));
	}
	return ct;
};

var readSubBlocks = function () {
	var size, data;
	data = '';
	do {
		size = stream.readByte();
		data += stream.read(size);
	} while (size !== 0);
	return data;
}
