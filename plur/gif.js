var gifCanvas = function(){
	return {
		canvas: null,
		ctx: null,

		hdr: {},
		stream: null,

		disposalMethod: null,
		disposalRestoreFromIdx: null,
		lastDisposalMethod: null,

		frame: null,
		frames: [],
		lastImg: null,

		transparency: null,
		delay: 10, //seems like a good default value

		doGCE: function (gce) {
			this.pushFrame();
			this.clear();
			this.transparency = gce.transparencyGiven ? gce.transparencyIndex : null;
			this.delay = gce.delayTime;
			this.disposalMethod = gce.disposalMethod;
			// We don't have much to do with the rest of GCE.
		},

		doImg: function (img) {
			if(!this.frame) this.frame = this.canvas.getContext('2d');

			var currIdx = this.frames.length;

			//ct = color table, gct = global color table
			var ct = img.lctFlag ? img.lct : this.hdr.gct; // TODO: What ifneither exists?

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
				if (this.lastDisposalMethod === 3) {
					// Restore to previous
					// If we disposed every frame including first frame up to this point, then we have
					// no composited frame to restore to. In this case, restore to background instead.
					if (this.disposalRestoreFromIdx !== null) {
						this.frame.putImageData(this.frames[this.disposalRestoreFromIdx].data, 0, 0);
					} else {
						this.frame.clearRect(this.lastImg.leftPos, this.lastImg.topPos, this.lastImg.width, this.lastImg.height);
					}
				} else {
					this.disposalRestoreFromIdx = currIdx - 1;
				}

				if (this.lastDisposalMethod === 2) {
					// Restore to background color
					// Browser implementations historically restore to transparent; we do the same.
					// http://www.wizards-toolkit.org/discourse-server/viewtopic.php?f=1&t=21172#p86079
					this.frame.clearRect(this.lastImg.leftPos, this.lastImg.topPos, this.lastImg.width, this.lastImg.height);
				}
			}
			// else, Undefined/Do not dispose.
			// frame contains final pixel data from the last frame; do nothing

			//Get existing pixels for img region after applying disposal method
			var imgData = this.frame.getImageData(img.leftPos, img.topPos, img.width, img.height);

			//apply color table colors
			img.pixels.forEach(function (pixel, i) {
				// imgData.data === [R,G,B,A,R,G,B,A,...]
				if(pixel !== this.transparency) {
					imgData.data[i * 4 + 0] = ct[pixel][0];
					imgData.data[i * 4 + 1] = ct[pixel][1];
					imgData.data[i * 4 + 2] = ct[pixel][2];
					imgData.data[i * 4 + 3] = 255; // Opaque.
				}
			}.bind(this));

			this.frame.putImageData(imgData, img.leftPos, img.topPos);
			this.ctx.drawImage(this.canvas, 0, 0);
			this.lastImg = img;
		},

		eof: function () {
			this.pushFrame();
			this.player.parent = this;
			this.player.step();
		},

		load: function (gif) {
			var h = new XMLHttpRequest();
			h.open('GET', gif.src, true);
			h.responseType = 'arraybuffer';

			h.onloadstart = function() {
				this.canvas = document.createElement('canvas');
				this.ctx = this.canvas.getContext('2d');
				document.body.appendChild(this.canvas);
			}.bind(this);
			h.onload = function(e) {
				var data = new Uint8Array(h.response);
				var stream = new this.streamHolder(data);
				this.parseGIF(stream);
			}.bind(this);
			h.send();
		},

		player: {
			i: -1,
			parent: null,

			step: function () {
				this.i = this.i + 1;
				this.putFrame();

				// TODO: RAF polyfill for setTimeout gets out of sync more than plain old setTimeout does
				setTimeout(this.step.bind(this), this.parent.frames[this.i].delay * 10);
				//this.requestTimeout(this.step.bind(this), this.parent.frames[this.i].delay * 10);
			},

			putFrame: function () {
				this.i = parseInt(this.i, 10);

				if(this.i > this.parent.frames.length - 1){
					this.i = 0;
				}

				if(this.i < 0){
					this.i = 0;
				}

				this.parent.ctx.putImageData(this.parent.frames[this.i].data, 0, 0);
			},

			move_to: function ( frame_idx ) {
				this.i = frame_idx;
				this.putFrame();
			},

			requestTimeout: function(fn, delay){
				var start = new Date().getTime();

				function loop(){
					var current = new Date().getTime();
					var delta = current - start;

					delta >= delay ? fn.call() : requestAnimationFrame(loop);
				}

				requestAnimationFrame(loop);
			}
		},

		pushFrame: function () {
			if(!this.frame) return;
			this.frames.push({
				data: this.frame.getImageData(0, 0, this.hdr.width, this.hdr.height),
				delay: this.delay
			});
		},

		setSizes: function(w, h) {
			this.canvas.width = w;
			this.canvas.height = h;
		},

		clear: function () {
			this.transparency = null;
			this.delay = null;
			this.lastDisposalMethod = this.disposalMethod;
			this.disposalMethod = null;
			this.frame = null;
		},

		streamHolder: function (data) {
			this.data = data;
			this.pos = 0;

			this.readByte = function () {
				if(this.pos >= this.data.length) {
					throw new Error('Attempted to read past end of stream.');
				}
				if(data instanceof Uint8Array) {
					return data[this.pos++];
				} else {
					return data.charCodeAt(this.pos++) & 0xFF;
				}
			}

			this.readBytes = function (n) {
				var bytes = [];
				for (var i = 0; i < n; i++) {
					bytes.push(this.readByte());
				}
				return bytes;
			}

			this.read = function (n) {
				var s = '';
				for (var i = 0; i < n; i++) {
					s += String.fromCharCode(this.readByte());
				}
				return s;
			}

			this.readUnsigned = function () { // Little-endian.
				var a = this.readBytes(2);
				return (a[1] << 8) + a[0];
			}
		},

		bitsToNum: function (ba) {
			return ba.reduce(function (s, n) {
				return s * 2 + n;
			}, 0);
		},

		byteToBitArr: function (bite) {
			var a = [];
			for (var i = 7; i >= 0; i--) {
				a.push( !! (bite & (1 << i)));
			}
			return a;
		},

		lzwDecode: function (minCodeSize, data) {
			// TODO: Now that the Gifparser is a bit different, maybe this should get an array of bytes instead of a String?
			var pos = 0; // Maybe this streaming thing should be merged with the Stream?
			var readCode = function (size) {
				var code = 0;
				for (var i = 0; i < size; i++) {
					if(data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
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

				if(code === clearCode) {
					clear();
					continue;
				}

				if(code === eoiCode){
					break;
				}

				if(code < dict.length) {
					if(last !== clearCode) {
						dict.push(dict[last].concat(dict[code][0]));
					}
				} else {
					if(code !== dict.length) throw new Error('Invalid LZW code.');
					dict.push(dict[last].concat(dict[last][0]));
				}
				output.push.apply(output, dict[code]);

				if(dict.length === (1 << codeSize) && codeSize < 12) {
					// if we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
					codeSize++;
				}
			}

			// I don't know if this is technically an error, but some GIFs do it.
			//if(Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
			return output;
		},

		parseGIF: function (st) {
			// LZW (GIF-specific)
			var parseCT = function (entries) { // Each entry is 3 bytes, for RGB.
				var ct = [];
				for (var i = 0; i < entries; i++) {
					ct.push(st.readBytes(3));
				}
				return ct;
			}

			var readSubBlocks = function () {
				var size, data;
				data = '';
				do {
					size = st.readByte();
					data += st.read(size);
				} while (size !== 0);
				return data;
			}

			var parseHeader = function () {
				var hdr = {};
				hdr.sig = st.read(3);
				hdr.ver = st.read(3);
				if(hdr.sig !== 'GIF') throw new Error('Not a Giffile.'); // XXX: This should probably be handled more nicely.
				hdr.width = st.readUnsigned();
				hdr.height = st.readUnsigned();

				var bits = this.byteToBitArr(st.readByte());
				hdr.gctFlag = bits.shift();
				hdr.colorRes = this.bitsToNum(bits.splice(0, 3));
				hdr.sorted = bits.shift();
				hdr.gctSize = this.bitsToNum(bits.splice(0, 3));

				hdr.bgColor = st.readByte();
				hdr.pixelAspectRatio = st.readByte(); // if not 0, aspectRatio = (pixelAspectRatio + 15) / 64
				if(hdr.gctFlag) {
					hdr.gct = parseCT(1 << (hdr.gctSize + 1));
				}

				this.hdr = hdr;
				this.setSizes(this.hdr.width, this.hdr.height);
			}.bind(this);

			var parseExt = function (block) {
				var parseGCExt = function (block) {
					var blockSize = st.readByte(); // Always 4
					var bits = this.byteToBitArr(st.readByte());
					block.reserved = bits.splice(0, 3); // Reserved; should be 000.
					block.disposalMethod = this.bitsToNum(bits.splice(0, 3));
					block.userInput = bits.shift();
					block.transparencyGiven = bits.shift();

					block.delayTime = st.readUnsigned();
					if(block.delayTime == 0){
						block.delayTime = 10;
					}

					block.transparencyIndex = st.readByte();

					block.terminator = st.readByte();

					this.doGCE(block);
				}.bind(this);

				var parseComExt = function (block) {
					block.comment = readSubBlocks();
				}.bind(this);

				var parseAppExt = function (block) {
					var parseNetscapeExt = function (block) {
						var blockSize = st.readByte(); // Always 3
						block.unknown = st.readByte(); // ??? Always 1? What is this?
						block.iterations = st.readUnsigned();
						block.terminator = st.readByte();
					}.bind(this);

					var parseUnknownAppExt = function (block) {
						block.appData = readSubBlocks();
					}.bind(this);

					var blockSize = st.readByte(); // Always 11
					block.identifier = st.read(8);
					block.authCode = st.read(3);
					switch (block.identifier) {
						case 'NETSCAPE':
							parseNetscapeExt(block);
							break;
						default:
							parseUnknownAppExt(block);
							break;
					}
				}.bind(this);

				block.label = st.readByte();
				switch (block.label) {
					case 0xF9:
						block.extType = 'gce';
						parseGCExt(block);
						break;
					case 0xFE:
						block.extType = 'com';
						parseComExt(block);
						break;
					case 0xFF:
						block.extType = 'app';
						parseAppExt(block);
						break;
					default:
						block.extType = 'unknown';
						console.log('unknown');
						break;
				}
			}.bind(this);

			var parseImg = function (img) {
				var deinterlace = function (pixels, width) {
					// Of course this defeats the purpose of interlacing. And it's *probably*
					// the least efficient way it's ever been implemented. But nevertheless...
					var newPixels = new Array(pixels.length);
					var rows = pixels.length / width;
					var cpRow = function (toRow, fromRow) {
						var fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
						newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
					}

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
				}

				img.leftPos = st.readUnsigned();
				img.topPos = st.readUnsigned();
				img.width = st.readUnsigned();
				img.height = st.readUnsigned();

				var bits = this.byteToBitArr(st.readByte());
				img.lctFlag = bits.shift();
				img.interlaced = bits.shift();
				img.sorted = bits.shift();
				img.reserved = bits.splice(0, 2);
				img.lctSize = this.bitsToNum(bits.splice(0, 3));

				if(img.lctFlag) {
					img.lct = parseCT(1 << (img.lctSize + 1));
				}

				img.lzwMinCodeSize = st.readByte();

				var lzwData = readSubBlocks();

				img.pixels = this.lzwDecode(img.lzwMinCodeSize, lzwData);

				if(img.interlaced) { // Move
					img.pixels = deinterlace(img.pixels, img.width);
				}

				this.doImg(img);
			}.bind(this);

			var parseBlock = function () {
				var block = {};
				block.sentinel = st.readByte();

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
						this.eof(block);
						break;
					default:
						throw new Error('Unknown block: 0x' + block.sentinel.toString(16)); // TODO: Pad this with a 0.
				}

				// wrapping this in setTimeout seems to improve loading
				// see: http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
				if(block.type !== 'eof') {
					setTimeout(parseBlock, 0);
				}
			}.bind(this);

			parseHeader();
			parseBlock();
		}
	}
}


var gif0 = new gifCanvas;
gif0.load(document.querySelector('.gif'));

var gif1 = new gifCanvas;
gif1.load(document.querySelector('.gif1'));

var gif2 = new gifCanvas;
gif2.load(document.querySelector('.gif2'));

var gif3 = new gifCanvas;
gif3.load(document.querySelector('.gif3'));