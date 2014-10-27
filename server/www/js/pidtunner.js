var pidtunner = (function () {
	var updateButton;
	init = function () {
		$("#elem").progressbar({
			value : 20
		});
		$("#slider-vertical1").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 40,
			slide : function (event, ui) {
				$("#amount1").val((ui.value/100*0.5).toFixed(2));
			}
		});
		$("#slider-vertical2").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 40,
			slide : function (event, ui) {
				$("#amount2").val((ui.value/100).toFixed(2));
			}
		});
		$("#slider-vertical3").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 65,
			slide : function (event, ui) {
				$("#amount3").val((ui.value/100*40).toFixed(2));
			}
		});
		$("#amount1").val(($("#slider-vertical1").slider("value")/100*0.5).toFixed(2));
		$("#amount2").val(($("#slider-vertical2").slider("value")/100).toFixed(2));
		$("#amount3").val(($("#slider-vertical3").slider("value")/100*40).toFixed(2));

		updateButton = $("#setvalue")

	}
	getupdateButton = function () {
		return updateButton;
	}
	newPID = function () {
		return [$("#slider-vertical1").slider("value"), $("#slider-vertical2").slider("value"), $("#slider-vertical3").slider("value")]
	}
	return {
		updateButton : getupdateButton,
		init : init,
		newPID : newPID
	}
})();
