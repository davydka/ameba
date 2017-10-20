# GraphicsMagick
[http://www.graphicsmagick.org/](http://www.graphicsmagick.org/)

## Approach
Using [`recolor`](The last row is required to exist for the purpose of parsing, but is otherwise not used.) you can use the same color matrix transformations instructions used here: [https://jmperezperez.com/duotone-using-fecolormatrix/](https://jmperezperez.com/duotone-using-fecolormatrix/)

```
(r1-r2) 0 0 0 r2
(g1-g2) 0 0 0 g2
(b1-b2) 0 0 0 b2
0 0 0 1 0
0 0 0 0 1
```
The last row is required to exist for the purpose of parsing, but is otherwise not used.

Example: 

```
Pink/Purple from Outline-Styleguide.pdf

Color1
#2C185B
R: 44 / 255
G: 24 / 255
B: 91 / 255

Color2
#FF6B68
R: 255 / 255
G: 107 / 255
B: 104 / 255

-0.8274509804 0 0 0 1
-0.325490196 0 0 0 0.4196078431
-0.0509803922 0 0 0 0.4078431373
0 0 0 1 0
0 0 0 0 1
```

## CLI
Notes: [Convert](http://www.graphicsmagick.org/convert.html) creates a new image. [Mogrify](http://www.graphicsmagick.org/mogrify.html) overwrites the same image. [Benchmark](http://www.graphicsmagick.org/benchmark.html) reports execution metrics at the end. `-monitor` shows verbose output.

1. Create a grey gif. `gm benchmark convert -type grayscale gif.gif grey.gif`
2. Apply some color transformations:

	```
	pink-purple
	gm benchmark convert -monitor -recolor "-0.8274509804 0 0 0 1 -0.325490196 0 0 0 0.4196078431 -0.0509803922 0 0 0 0.4078431373 0 0 0 1 0 0 0 0 0 1" grey.gif pink-purple.gif

	hotpink-mint
	gm benchmark convert -monitor -recolor "0.3137254902 0 0 0 0.6862745098 -0.8392156863 0 0 0 1 -0.5019607843 0 0 0 0.8 0 0 0 1 0 0 0 0 0 1" grey.gif hotpink-mint.gif
	
	blue-mint
	gm benchmark convert -monitor -recolor "-0.6705882353 0 0 0 0.68627450980392 -0.8431372549 0 0 0 1 -0.5098039216 0 0 0 0.8 0 0 0 1 0 0 0 0 0 1" grey.gif blue-mint.gif

	yellow-blue (blue yellow actually)
	gm benchmark convert -monitor -recolor "-0.7215686275 0 0 0 1 -0.631372549 0 0 0 0.9019607843 0.8196078431 0 0 0 0 0 0 0 1 0 0 0 0 0 1" grey.gif yellow-blue.gif

	kanye example from http://codepen.io/jmperez/pen/LGqaxQ
	gm benchmark convert -monitor -recolor "0.83984375 0 0 0 0.09765625 -0.08984375 0 0 0 0.14453125 -0.1328125 0 0 0 0.3125 0 0 0 1 0 0 0 0 0 1" grey.gif kanye.gif
	```
