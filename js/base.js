/********* Array conversion ***********/ 

/**
 * Calculates the greyscale avarage and writes it into the output array.
 * @param {array} inputPixelArray - Array containing sequential rgba values
 * @param {array} outputPixelArray - Result array containgin sequential rgba values
 */
function rgbaColorToRgbaGreyscaleArray(inputPixelArray, outputPixelArray) {
	for (var i = 0; i < inputPixelArray.length; i +=4) {
		var avg = (inputPixelArray[i] + inputPixelArray[i+1] + inputPixelArray[i+2]) / 3;
		outputPixelArray[i] = avg;
		outputPixelArray[i+1] = avg;
		outputPixelArray[i+2] = avg;
		
		// write transparency
		outputPixelArray[i+3] = inputPixelArray[i+3];
	}
}

/**
 * Get grey values from rgba color array.
 * @param {array} rgbaArray - Array containing squential rgba values
 * @return {array} - Array containing grey values
 */
function getGreyValueArray(rgbaArray) {
	var resultPixels = new Uint8ClampedArray(rgbaArray.length / 4);
	
	for (var i = 0; i < resultPixels.length; i++) {
		var avg = (rgbaArray[(4 * i)] + rgbaArray[(4 * i) + 1] + rgbaArray[(4 * i) + 2]) / 3;
		resultPixels[i] = avg;
	}
	
	return resultPixels;
}

/**
 * Converts the greyscale value array into a rgba array.
 */
function getRgbaArray(greyscaleArray, outputPixelArray) {
	var rgbaArray = new Uint8ClampedArray(greyscaleArray.length * 4);
	
	for (var i = 0; i < greyscaleArray.length; i++) {
		outputPixelArray[(4 * i)] = greyscaleArray[i];
		outputPixelArray[(4 * i) + 1] = greyscaleArray[i];
		outputPixelArray[(4 * i) + 2] = greyscaleArray[i];
		
		outputPixelArray[(4 * i) + 3] = 255;
	}
}

/********* Entropy, MSE *************/

function getEntropy(pixelArray) {
	var entropy = 0;
	var frequencies = new Float32Array(265);
	
	// histogram
	for (var i = 0; i < pixelArray.length; i += 4) {
		frequencies[pixelArray[i]]++;
	}
	
	var sum = 0;
	for (var i = 0; i < frequencies.length; i++) {
		sum += frequencies[i];
	}
	
	for (var i = 0; i < frequencies.length; i++) {
		frequencies[i] /= sum;
	}
	
	for (var i = 0; i < frequencies.length; i++) {
		if (frequencies[i] > 0) {
			entropy += frequencies[i] * (Math.log(frequencies[i]) / Math.log(2));
		}
	}
	
	return Math.round(-entropy * 1000) / 1000;
}

function logPixelArray(pixelArray) {
	for (var i = 0; i < pixelArray.length || 200; i++) {
		var text = "R: " + pixelArray[i] + " G: " + pixelArray[i+1] +
			" B: " + pixelArray[i+2] + " A: " + pixelArray[i+3];
			i += 3;
		console.log(text);
	}
}


/********* 2D-DCT ********************/

function dctBasisFunction(l, k, n, m) {
	return Math.cos( ((2*m + l) * k * Math.PI) / 16) * Math.cos( ((2*n + l) * l * Math.PI) / 16);	
}

function getBlocks(pixelArray, width, height) {
	// ignore border, e.g. only multiplies of eight
	var width8 = width - (width % 8);
	var height8 = height - (height % 8);
	
	var blocks = new Array((width8 / 8) * (height8 / 8));
	
	// loop over all blocks
	for (var y = 0; y < (height8 / 8); y++) {
		for (var x = 0; x < (width8 / 8); x++) {
			var blockNo = y * (width8 / 8) + x;
			
			blocks[blockNo] = new Array(64);
			
			// loop over single bock
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < 8; j++) {
					// pixPos = block position + position inside of the block
					var pixPos = (y * 8 * width8) + (i * width8) + (x * 8) + j; 
					blocks[blockNo][i * 8 + j] = pixelArray[pixPos];
				}
			}
		}
	}	 
	
	return blocks;	
}

function getPixelArrayFromBlocks(blocks, width, height) {
	var pixelArray = new Uint32Array(width * height);
	
	var width8 = width - (width % 8);
	var height8 = height - (height % 8);
	
	// loop over all blocks
	for (var y = 0; y < (height8 / 8); y++) {
		for (var x = 0; x < (width8 / 8); x++) {
			var blockNo = y * (width8 / 8) + x;
			
			//dctBlocks[blockNo] = new Array(64);
			
			// loop over single bock
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < 8; j++) {
					// pixPos = block position + position inside of the block
					var pixPos = (y * 8 * width8) + (i * width8) + (x * 8) + j; 
					
					// OFFSET
					pixelArray[pixPos] = blocks[blockNo][i * 8 + j] + 128;
				}
			}
		}
	}	 
	
	return pixelArray;	
}

function normFactor(ci) {
	if (ci == 0) {
		return (Math.sqrt(2) / 2);
	}
	return 1 / 2;
}

function getDctCoefficientBlock(pixelBlock) {
	var coefficientBlock = new Array(64);
	for (var l = 0; l < 8; l++) {
		for (var k = 0; k < 8; k++) {
			
			coefficientBlock[l * 8 + k] = 0;
			
			for (var n = 0; n < 8; n++) {
				for (var m = 0; m < 8; m++) {
					var dctBasis = dctBasisFunction(l, k, n, m);
				
					coefficientBlock[l * 8 + k] += (1/64) * pixelBlock[n * 8 + m] * dctBasis;
				}
			}
		}
	}
	
	return coefficientBlock;
}


/********* App *****************/

window.onload = function() {

	// read files
	var control = document.getElementById("files");
	control.addEventListener("change", function(event) {
		var i = 0,
			files = control.files,
			len  = files.length;
	
		for (; i < files.length; i++) {
			console.log("Filename: " + files[i].name);
			console.log("Type: " + files[i].type);
			console.log("Size: " + files[i].size + " bytes");
			reader.readAsDataURL(files[i]);
		}
	}, false);
	
	var reader = new FileReader();
	reader.onload = function(event) {
		// get the image
		var dataURI = event.target.result;
		var img = new Image();
		img.src = dataURI;
		
		// get canvas
		var canvasInput = document.getElementById("canvas-input");
		var contextInput = canvasInput.getContext("2d");
		
		var canvasCoefficient = document.getElementById("canvas-coefficient");
		var contextCoefficient = canvasCoefficient.getContext("2d");
		
		var canvasOutput = document.getElementById("canvas-output");
		var contextOutput = canvasOutput.getContext("2d");
		
		// wait till image is loaded
		img.onload = function() {
			// set canvas widths & heights according to image width & height
			canvasInput.height = img.height;
			canvasInput.width = img.width;
			
			canvasCoefficient.height = img.height;
			canvasCoefficient.width = img.width;
			
			canvasOutput.height = img.height;
			canvasOutput.width = img.width;
			
			contextInput.drawImage(img, 0, 0);
			
			// get raw image data
			var inputData = contextInput.getImageData(0, 0, img.width, img.height);
			var inputRgbaArray = inputData.data;
			
			// create image data objects for coefficient canvas and output canvas
			var coefficientData = contextInput.createImageData(img.width, img.height);
			var coefficientRgbaArray = coefficientData.data;
			
			var outputData = contextInput.createImageData(img.width, img.height);
			var outputRgbaArray = outputData.data;
			
			
			rgbaColorToRgbaGreyscaleArray(inputRgbaArray, outputRgbaArray);
			
			
			var greyscaleValueArray = getGreyValueArray(outputRgbaArray);
			
			// split image into 8 x 8 blocks
			var blocks = getBlocks(greyscaleValueArray, img.width, img.height);
			
			// calculate coefficient block for each block
			var coefficientBlocks = new Array();
			for (var i = 0; i < blocks.length; i++) {
				coefficientBlocks[i] = getDctCoefficientBlock(blocks[i]);
			}
			
			var coefficientValues = getPixelArrayFromBlocks(coefficientBlocks, img.width, img.height);

			
			 getRgbaArray(coefficientValues, coefficientRgbaArray);
			
			// write data to canvas
			contextOutput.putImageData(outputData,0,0);
			contextCoefficient.putImageData(coefficientData, 0, 0);

			
			// print entropy
			document.getElementById("entropy-input").innerHTML = getEntropy(inputRgbaArray) + " (red channel)";
			document.getElementById("entropy-output").innerHTML = getEntropy(outputRgbaArray);
			document.getElementById("entropy-coefficient").innerHTML = getEntropy(coefficientRgbaArray);
		};
		
		
	};
	
	/*var reader = new FileReader();
	reader.onload = function(event) {
    		var dataUri = event.target.result,
        	img = document.createElement("img");

    		img.src = dataUri;
		document.body.appendChild(img);
	};*/

	reader.onerror = function(event) {
		console.error("File could not be read! Code " + event.target.error.code);
	};
}
