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

/********* Entropy, MSE, Crop *************/

function getHistogram(pixelArray) {
	var frequencies = new Uint32Array(256);

	for (var i = 0; i < pixelArray.length; i++) {
			frequencies[pixelArray[i]]++;
	}
	
	return frequencies;
}

function getMse(errorPixel) {
	var histogram = getHistogram(errorPixel);
	
	return getSquareStandardVariance(histogram);
	
}

function getArithmeticAverage(histogram) {
	var arithmeticAverage = 0;
	var values = 0;
	
	for (var i = 0; i < histogram.length; i++) {
		values += histogram[i];
	}
	
	for (var i = 0; i < histogram.length; i++) {
		if (histogram[i] != 0) {
			arithmeticAverage += i * (histogram[i] / values);
		}
	}
	
	return  Math.round(arithmeticAverage * 100) / 100;
}

function getSquareStandardVariance(histogram) {
	var avg = getArithmeticAverage(histogram);
	var values = 0;
	var variance = 0;
	
	for (var i = 0; i < histogram.length; i++) {
		values += histogram[i];
	}
	
	for (var i = 0; i < histogram.length; i++) {
		if (histogram[i] != 0) {
			variance += (Math.pow((i - avg), 2)) * (histogram[i] / values);
		}
	}
	
	
	return Math.round(variance * 100) / 100;
}

function getErrorPattern(orgPixelArray, modPixelArray, offset) {
	var errorPattern = new Array(orgPixelArray.length);
	
	for (var i = 0; i < orgPixelArray.length; i++) {
		errorPattern[i] = orgPixelArray[i] - modPixelArray[i] + offset;
	}
	
	return errorPattern;
}

function getEntropy(pixelArray) {
	var entropy = 0;
	var frequencies = new Float32Array(256);
	
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
	
	return Math.round(-entropy * 100000) / 100000;
}

function logPixelArray(pixelArray) {
	for (var i = 0; i < pixelArray.length || 200; i++) {
		var text = "R: " + pixelArray[i] + " G: " + pixelArray[i+1] +
			" B: " + pixelArray[i+2] + " A: " + pixelArray[i+3];
			i += 3;
		console.log(text);
	}
}

function getCroppedArray(pixelArray, orgWidth, orgHeight) {
	var width = orgWidth - (orgWidth % 8);
	var height = orgHeight - (orgHeight % 8);
		
	var croppedImage = new Uint8ClampedArray(width * height);
	
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			croppedImage[y * width + x] = pixelArray[y * width + x];
		}
	}
	
	return croppedImage;
}

/********* 2D-DCT ********************/

function dctBasisFunction(l, k, n, m) {
	return Math.cos( ((2*m + 1) * k * Math.PI) / 16) * Math.cos( ((2*n + 1) * l * Math.PI) / 16);	
}


/**
 * Split the array into blocks of 8 x 8 pixels
 * @param {number} width - Image width, must be a multiple of 8
 * @param {number} height - Image height, must be a multiple of 8
 * @return {array} - Array containing the blocks, each one itself an array
 */
function getBlocks(pixelArray, width, height) {

	var blocks = new Array((width / 8) * (height / 8));
	
	// loop over all blocks
	for (var y = 0; y < (height / 8); y++) {
		for (var x = 0; x < (width / 8); x++) {
			var blockNo = y * (width / 8) + x;
			
			blocks[blockNo] = new Array(64);
			
			// loop over single bock
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < 8; j++) {
					// pixPos = block position + position inside of the block
					var pixPos = (y * 8 * width) + (i * width) + (x * 8) + j; 
					blocks[blockNo][i * 8 + j] = pixelArray[pixPos];
				}
			}
		}
	}	 
	
	return blocks;	
}

/**
 * Join the blocks together into one single array
 * @param {array} blocks - Array of blocks, each containing 8x8 pixels
 * @param {number} width - Width of the image, must be multiple of 8
 * @param {number} height - Height of the image, must be multiple of 8
 * @param {boolean} offset - Whether an offset is added or not
 */
function getPixelArrayFromBlocks(blocks, width, height, offset) {
	
	var pixelArray = new Uint8ClampedArray(width * height);
	
	// loop over all blocks
	for (var y = 0; y < (height / 8); y++) {
		for (var x = 0; x < (width / 8); x++) {
			var blockNo = y * (width / 8) + x;
			
			// loop over single bock
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < 8; j++) {
					// pixPos = block position + position inside of the block
					var pixPos = (y * 8 * width) + (i * width) + (x * 8) + j; 
					
					// OFFSET
					if (offset) {
						pixelArray[pixPos] = blocks[blockNo][i * 8 + j] / 8 + 128;
					} else {
						pixelArray[pixPos] = blocks[blockNo][i * 8 + j];
					}
				}
			}
		}
	}	 
	
	return pixelArray;	
}

function normFactor(l, k) {
	if (l == 0 && k == 0) {
		return (Math.sqrt(1 / 8) * Math.sqrt(1 / 8));
	} else if (l == 0 || k == 0) {
		return (Math.sqrt(1 / 8) * 0.5);
	} else {
		return 0.25;
	}
}

/**
 * Get a single dct coefficient block
 */
function getDctCoefficientBlock(pixelBlock, sizeLimit) {
	var coefficientBlock = new Array(64);
	
	// loop over coefficient block
	for (var l = 0; l < 8; l++) {
		for (var k = 0; k < 8; k++) {
			
			coefficientBlock[l * 8 + k] = 0;
			
			// calculate coefficient, loop over pixelBlock
			for (var n = 0; n < 8; n++) {
				for (var m = 0; m < 8; m++) {
					// TODO: implement zigzag scan instead of naive approach
					if (l * 8 + k > sizeLimit) {
						coefficientBlock[l * 8 + k] = 0;
					} else {
						coefficientBlock[l * 8 + k] += pixelBlock[n * 8 + m] * dctBasisFunction(l, k, n, m);
					}
				}
			}
			
			coefficientBlock[l * 8 + k] *= normFactor(l, k);
		}
	}
	
	return coefficientBlock;
}

/**
 * Transform dct block back into pixel block
 */
function getPixelBlock(coefficientBlock) {
	var pixelBlock = new Array(64);

	// loop over pixelBlock
	for (var n = 0; n < 8; n++) {
		for (var m = 0; m < 8; m++) {
			pixelBlock[n * 8 + m] = 0;
			
			// loop over coefficient block, calculate pixel value
			for (var l = 0; l < 8; l++) {
				for (var k = 0; k < 8; k++) {
					pixelBlock[n * 8 + m] += normFactor(l, k) * coefficientBlock[l * 8 + k] * dctBasisFunction(l, k, n, m);
				}
			}
		}
	}
	
	return pixelBlock;
}


/********* Process *****************/

function processImage(greyscaleArray, width, height, dctBlockSizeLimit) {
	
	// split image into 8 x 8 blocks
	var blocks = getBlocks(greyscaleArray, width, height);
	
	// calculate coefficient block for each block
	var coefficientBlocks = new Array();
	for (var i = 0; i < blocks.length; i++) {
		coefficientBlocks[i] = getDctCoefficientBlock(blocks[i], dctBlockSizeLimit);
	}
	
	// join coefficient blocks together again and add offset
	var coefficientPixelArray = getPixelArrayFromBlocks(coefficientBlocks, width, height, true);
			
	// calculate pixel blocks from coefficient block
	var pixelBlocks = new Array();
	for (var i = 0; i < coefficientBlocks.length; i++) {
		pixelBlocks[i] = getPixelBlock(coefficientBlocks[i]);
	}
	
	// join reconverted pixel blocks together again
	var reconvertedPixelArray = getPixelArrayFromBlocks(pixelBlocks, width, height, false);
	
	return [greyscaleArray, coefficientPixelArray, reconvertedPixelArray];
}

/************ App ******************/

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
		
		var dctBlockSizeLimit = document.getElementById("dctblocksize-slider").value - 1;
		
		// wait till image is loaded
		img.onload = function() {
			
			// get cropped width & heights: multiples of 8
			var width = img.width - (img.width % 8);
			var height = img.height - (img.height % 8);
			
			
			// set canvas widths & heights according to image width & height
			canvasInput.height = height;
			canvasInput.width = width;
			
			canvasCoefficient.height = height;
			canvasCoefficient.width = width;
			
			canvasOutput.height = height;
			canvasOutput.width = width;
			
			contextInput.drawImage(img, 0, 0);
			
			// get raw image data
			var inputData = contextInput.getImageData(0, 0, width, height);
			var inputRgbaArray = inputData.data;
			
			// create image data objects for coefficient canvas and output canvas
			var coefficientData = contextInput.createImageData(width, height);
			var coefficientRgbaArray = coefficientData.data;
			
			var outputData = contextInput.createImageData(width, height);
			var outputRgbaArray = outputData.data;
			
			// clear input canvas
			contextInput.clearRect(0, 0, width, height);
			
			// get cropped, into greyscale converted image
			var greyscalePixelArray = getCroppedArray(getGreyValueArray(inputRgbaArray), img.width, img.height);
			
			// process greyscale array
			var resultArrays = processImage(greyscalePixelArray, width, height, dctBlockSizeLimit);
			
			// convert into rgba arrays
			getRgbaArray(resultArrays[0], inputRgbaArray);
			getRgbaArray(resultArrays[1], coefficientRgbaArray);
			getRgbaArray(resultArrays[2], outputRgbaArray);
			
			
			// write data to canvas
			contextInput.putImageData(inputData, 0, 0);
			contextCoefficient.putImageData(coefficientData, 0, 0);
			contextOutput.putImageData(outputData, 0, 0);
			
			// save image buttons
			document.getElementById("save-coefficient").onclick = function() {
				var saveImg = canvasCoefficient.toDataURL("image/png").replace("image/png", "image/octet-stream");
				window.location.href = saveImg;
			}
			
			document.getElementById("save-output").onclick = function() {
				var saveImg = canvasOutput.toDataURL("image/png").replace("image/png", "image/octet-stream");
				window.location.href = saveImg;
			}
				
			/************ stats *********/
			var histogramInput = getHistogram(resultArrays[0]);
			var histogramCoefficient = getHistogram(resultArrays[1]);
			var histogramOutput = getHistogram(resultArrays[2]);
			
			var testHistogram = [0,0,1,2,0,1,0,1];
			
			console.debug(getSquareStandardVariance(histogramInput));
			console.debug(getSquareStandardVariance(histogramCoefficient));
			console.debug(getSquareStandardVariance(histogramOutput));
			
			// print entropy
			document.getElementById("entropy-input").innerHTML = getEntropy(inputRgbaArray);
			document.getElementById("entropy-coefficient").innerHTML = getEntropy(coefficientRgbaArray);
			document.getElementById("entropy-output").innerHTML = getEntropy(outputRgbaArray);
			
			// print avg pixel value
			document.getElementById("avg-input").innerHTML = getArithmeticAverage(histogramInput);
			document.getElementById("avg-coefficient").innerHTML = getArithmeticAverage(histogramCoefficient);
			document.getElementById("avg-output").innerHTML = getArithmeticAverage(histogramOutput);
			
			// print mse
			document.getElementById("mse-output").innerHTML = getMse(getErrorPattern(resultArrays[0], resultArrays[2], 0));
			
		};
		
		// set up slider for dctblocksize
		document.getElementById("dctblocksize-slider").onchange = function() {
			document.getElementById("slider-value").innerHTML = (this).value;
		}
		
		document.getElementById("dctblocksize-slider").onmouseup = function() {
			// - 1 because first block starts at index 0
			dctBlockSizeLimit = (this).value - 1;
			img.onload();
		}
	};
	
	reader.onerror = function(event) {
		console.error("File could not be read! Code " + event.target.error.code);
	};
}
