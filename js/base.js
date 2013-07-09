window.onload = function() {

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
		var context = canvasInput.getContext("2d");
		
		var canvasCoefficient = document.getElementById("canvas-coefficient");
		var contextCoefficient = canvasCoefficient.getContext("2d");
		
		var canvasOutput = document.getElementById("canvas-output");
		var contextOutput = canvasOutput.getContext("2d");
		
		var img = new Image();
		img.src = dataURI;
		
		//context.clearRect(0,0, 400, 400);
		
		//canvas.height = img.height;
		//canvas.width = img.width;
		
		// wait till image is loaded
		img.onload = function() {
			canvasInput.height = img.height;
			canvasInput.width = img.width;
			
			canvasCoefficient.height = img.height;
			canvasCoefficient.width = img.width;
			
			canvasOutput.height = img.height;
			canvasOutput.width = img.width;
			
			context.drawImage(img, 0, 0);
			
			var imageData = context.getImageData(0, 0, img.width, img.height);
			var pixelArray = imageData.data;
			var outputData = context.createImageData(img.width, img.height);
			var outputPixelArray = outputData.data;
		
			/*for (var i = 0; i < 200; i++) {
				var text = "R: " + pixelArray[i] + " G: " + pixelArray[i+1] +
					" B: " + pixelArray[i+2] + " A: " + pixelArray[i+3];
					i += 3;
				console.log(text);
			}*/
			
			
			
			for (var i = 0; i < pixelArray.length; i += 4) {
				var avg = (pixelArray[i] + pixelArray[i+1] + pixelArray[i+2]) / 3;
				outputPixelArray[i] = avg;
				outputPixelArray[i+1] = avg;
				outputPixelArray[i+2] = avg;
				
				// write transparency
				outputPixelArray[i+3] = 255;
				
			}
			
			contextOutput.putImageData(outputData,0,0);
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
