var Ripple = {
	renderer: null,
	stage: null,
	filter: null,
	filterSripte: null,
	texture: null,
	sprite: null,
	counter: 1,
	amount: 1,
	paused: false,
	animateSelf: true,

	animate: function(){
		this.counter = this.counter + (this.amount * .5);
		this.filter.scale.x = this.amount * 100;
		this.filter.scale.y = this.amount * 100;
		this.filterSprite.position.y = -(this.counter*10) % 512;
		this.filterSprite.position.x = (this.counter*10) % 512;

		if(!this.paused){
			this.renderer.render(this.stage);
		}
		if(this.animateSelf){
			requestAnimationFrame(this.animate.bind(this));
		}
	},

	create: function(options){
		var width = options.width || window.innerWidth;
		var height = options.height || window.innerHeight;
		var target = options.target || document.body;

		this.renderer = new PIXI.WebGLRenderer(width, height);
		this.renderer.plugins.interaction.autoPreventDefault = false;
		this.renderer.view.style.position = 'fixed';
		this.renderer.view.style.top = '0px';
		this.renderer.view.style.left = '0px';

		target.appendChild(this.renderer.view);

		this.stage = new PIXI.Container();

		if(typeof options.filterSource == 'undefined'){
			console.log('Filter source image is required.');
			return;
		}
		var texture = PIXI.Texture.fromImage(options.filterSource);
		texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT
		this.filterSprite = new PIXI.Sprite(texture);
		this.filterSprite.texture.baseTexture.on('loaded', function(){
			this.stage.addChild(this.filterSprite);
			this.filter = new PIXI.filters.DisplacementFilter(this.filterSprite, 0);

			if(typeof options.image != 'undefined'){
				this.setImage(options.image);
			}
			
			if(this.animateSelf){
				requestAnimationFrame(this.animate.bind(this));
			}
		}.bind(this));
	},

	destroy: function(){
		this.renderer.destroy(true);
	},

	setImage: function(image){
		if(typeof image == 'undefined'){
			console.log('An image to apply the effect to is required.');
			return;
		}
		var texture = PIXI.Texture.fromImage(image);
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.texture.baseTexture.on('loaded', function(){
			this.fitImage(this.sprite.width, this.sprite.height, window.innerWidth, window.innerHeight);
		}.bind(this));
		this.sprite.filters = [this.filter];
		this.stage.addChild(this.sprite);
	},

	setAmount: function(value){
		this.amount = value;
	},

	fitImage: function(srcWidth, srcHeight, maxWidth, maxHeight){
		var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
		this.sprite.width = srcWidth*ratio;
		this.sprite.height = srcHeight*ratio;
	},

	resizeRenderer: function(width, height){
		//this part resizes the canvas but keeps ratio the same
		this.renderer.view.style.width = width + "px";
		this.renderer.view.style.height = height + "px";
		//this part adjusts the ratio:   
		this.renderer.resize(width, height);
	}
}
