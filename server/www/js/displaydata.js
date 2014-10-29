var displaydata = (function () {
	console.log("inside displaydata")
	var totalPoints = 1000;
	var typesOfData = 4;
	var resArray = []; //3 dimension array that hold all the display data, right now it is set to display 3 data in a plot so it is a 3 x 1000 *2 array
	var plot;
	var saveButton;
	getInitData = function () {
		// zip the generated y values with the x values

		for (var j = 0; j < typesOfData; j++) {
			resArray[j] = [];
			for (var i = 0; i < totalPoints; ++i) {
				resArray[j].push([i, 0]);
			}
		}
		return resArray;
	}
	// Options for Flot plot
	var options = {
		series : {
			shadowSize : 0
		}, // drawing is faster without shadows
		yaxis : {
			min : -180,
			max : 180
		},
		xaxis : {
			show : false
		}
	};
	//generate the string to save to a file
	var generateSaveString = function () {
		var fileString = "";
		for (var i = 0; i < totalPoints; ++i) {
			fileString = fileString + i + "\t";
			for (var j = 0; j < typesOfData; j++) {
				fileString = fileString + resArray[j][i][1] + "\t";
			}
			fileString = fileString + "\r\n"
		}
		return fileString;
	};
	//Save plot data to a file
	var saveDatatoFile = function () {
		var fileString = generateSaveString();
		var blob = new Blob([fileString], {
				type : "text/plain;charset=utf-8"
			});
		saveAs(blob, "hello world.txt");
	};
	// Initialize function
	init = function () {
		plot = $.plot($("#placeholder"), getInitData(), options);
		saveButton = $("#savebutton")
			saveButton.click(function () {
				console.log("Save button onclick");
				saveDatatoFile();
			});
	}
	updatedisplay = function (vals) {

		// Push new value to Flot Plot
		var j = 0;
		for (j = 0; j < typesOfData; j++) {
			resArray[j].push([totalPoints, vals[j]]);
			resArray[j].shift();
		}

		// reinitialize the x axis data points
		for (j = 0; j < typesOfData; j++) {
			for (var i = 0; i < totalPoints; ++i) {
				resArray[j][i][0] = i;
			}
		}
		// Redraw the plot
		plot.setData(resArray);
		plot.draw();

	}
	return {
		init : init,
		updatedisplay : updatedisplay
	}
})();
