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
		var context = document.getElementById("canvas").getContext("2d");
		var img = new Image();
		
		img.onload = function() {
			context.drawImage(img, 100, 100);
		};
		img.src = dataURI;
	};
}
