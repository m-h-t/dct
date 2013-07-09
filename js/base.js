function getGreyscaleImg(inputPixelArray, outputPixelArray) {
	for (var i = 0; i < inputPixelArray.length; i +=4) {
		var avg = (inputPixelArray[i] + inputPixelArray[i+1] + inputPixelArray[i+2]) / 3;
		outputPixelArray[i] = avg;
		outputPixelArray[i+1] = avg;
		outputPixelArray[i+2] = avg;
		
		// write transparency
		outputPixelArray[i+3] = inputPixelArray[i+3];
	}
}

function getGreyscaleArray(inputPixelArray) {
	var resultPixels = new Uint8ClampedArray(inputPixelArray.length / 4);
	
	for (var i = 0; i < resultPixels.length; i++) {
		var avg = (inputPixelArray[(4 * i)] + inputPixelArray[(4 * i) + 1] + inputPixelArray[(4 * i) + 2]) / 3;
		resultPixels[i] = avg;
	}
	
	return resultPixels;
}

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


/***** 8 * 8 DCT ********/

function dctBasicFunction(l, k, n, m) {
	return Math.cos( ((2*m + l) * k * Math.PI) / 16) * Math.cos( ((2*n + l) * l * Math.PI) / 16);	
}

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
		var dataURI = event.target.result;
		
		var canvasInput = document.getElementById("canvas-input");
		var contextInput = canvasInput.getContext("2d");
		
		var canvasCoefficient = document.getElementById("canvas-coefficient");
		var contextCoefficient = canvasCoefficient.getContext("2d");
		
		var canvasOutput = document.getElementById("canvas-output");
		var contextOutput = canvasOutput.getContext("2d");
		
		var img = new Image();
		img.src = dataURI;
		
		// wait till image is loaded
		img.onload = function() {
			// set canvas widths & heights
			canvasInput.height = img.height;
			canvasInput.width = img.width;
			
			canvasCoefficient.height = img.height;
			canvasCoefficient.width = img.width;
			
			canvasOutput.height = img.height;
			canvasOutput.width = img.width;
			
			contextInput.drawImage(img, 0, 0);
			
			var imageData = contextInput.getImageData(0, 0, img.width, img.height);
			var pixelArray = imageData.data;
			var outputData = contextInput.createImageData(img.width, img.height);
			var outputPixelArray = outputData.data;
			
			getGreyscaleImg(pixelArray, outputPixelArray);
			
			console.debug(outputPixelArray);
			console.debug(getGreyscaleArray(pixelArray));
			
			// write data to canvas
			contextOutput.putImageData(outputData,0,0);
			
			// print entropy
			document.getElementById("entropy-input").innerHTML = getEntropy(pixelArray) + " (red channel)";
			document.getElementById("entropy-output").innerHTML = getEntropy(outputPixelArray);
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
