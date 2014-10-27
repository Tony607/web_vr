var remotecontroller = (function () {
	var controllerValue;
	var $theDragger;
	var initialValue =  {x:0,y:0};
	var contollerValue =  {x:0,y:0};
	init = function () {
		$(function() {
			$theDragger = $( "#draggable" )
			$('#dragX').html(0);
			$('#dragY').html(0);
			$theDragger.draggable({ revert: true,
				start: function() {
					updateInitialValue();
				  },
				drag: function() {
					updateControllerValue();
				},
				stop: function() {
					resetControllerValue();
				},
			});
			$( "#upBtn" ).button();
			$( "#leftBtn" ).button();
			$( "#downBtn" ).button();
			$( "#rightBtn" ).button();
			
			$( "#upBtn" ).mousedown(function() {
				console.log(">>mousedown <up>");
				fireContollerValueEvent(0,200);
			});
			$( "#upBtn" ).mouseup(function() {
			  console.log(">>mouseup <up>");
				fireContollerValueEvent(0,0);
			});
			$( "#downBtn" ).mousedown(function() {
				console.log(">>mousedown <up>");
				fireContollerValueEvent(0,-200);
			});
			$( "#downBtn" ).mouseup(function() {
			  console.log(">>mouseup <up>");
				fireContollerValueEvent(0,0);
			});
			$( "#leftBtn" ).mousedown(function() {
				console.log(">>mousedown <up>");
				fireContollerValueEvent(25,0);
			});
			$( "#leftBtn" ).mouseup(function() {
			  console.log(">>mouseup <up>");
				fireContollerValueEvent(0,0);
			});
			$( "#rightBtn" ).mousedown(function() {
				console.log(">>mousedown <up>");
				fireContollerValueEvent(-25,0);
			});
			$( "#rightBtn" ).mouseup(function() {
			  console.log(">>mouseup <up>");
				fireContollerValueEvent(0,0);
			});
		});
	}
	fireContollerValueEvent = function (x, y) {
		contollerValue.x = x;
		contollerValue.y = y;
		$('#dragX').html(contollerValue.x);
		$('#dragY').html(contollerValue.y);
		$('#dragY').trigger( "contollerValueEvent", [contollerValue] );
	}
	updateInitialValue = function () {
		initialValue.x = $theDragger.position().left;
		initialValue.y = $theDragger.position().top;
	}
	updateControllerValue = function () {
		var diff_x = -$theDragger.position().left + initialValue.x;
		if(diff_x<500){
			diff_x = Math.round(diff_x/10);
		}
		contollerValue.x = diff_x;
		contollerValue.y = initialValue.y - $theDragger.position().top;
		$('#dragX').html(contollerValue.x);
		$('#dragY').html(contollerValue.y);
		$('#dragY').trigger( "contollerValueEvent", [contollerValue] );
	}
	resetControllerValue = function () {
		contollerValue.x = 0;
		contollerValue.y = 0;
		$('#dragX').html(0);
		$('#dragY').html(0);
		$('#dragY').trigger( "contollerValueEvent", [contollerValue] );
	}
	getControllerValue = function () {
		return controllerValue;
	}
	return {
		getControllerValue : getupdateButton,
		init : init
	}
})();
