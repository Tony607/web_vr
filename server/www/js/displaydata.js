var displaydata = (function () {
	console.log("inside displaydata")
	var totalPoints = 1000;
	var typesOfData = 3;
	var resArray =[];//3 dimension array that hold all the display data, right now it is set to display 3 data in a plot so it is a 3 x 1000 *2 array
	var plot;
	getInitData = function () {
		// zip the generated y values with the x values
		
		for (var j = 0; j< typesOfData; j++){
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

	// Update the JQuery UI Progress Bar
	init = function () {
		plot = $.plot($("#placeholder"), getInitData(), options);
	}
	updatedisplay = function (vals) {

		// Push new value to Flot Plot
		var j =0;
		for (j = 0; j< typesOfData; j++){
			resArray[j].push([totalPoints, vals[j]]);
			resArray[j].shift();
		}
		
		// reinitialize the x axis data points
		for (j = 0; j< typesOfData; j++){
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
