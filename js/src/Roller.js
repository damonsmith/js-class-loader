var Roller = {};

Roller.load = function() {
	$(".litree li").click(function() {
		var ul = $("> ul", this);
		if (ul.is(":visible")) {
			$(this).addClass("rolledUp");
			ul.slideUp();
		}
		else {
			$(this).removeClass("rolledUp");
			ul.slideDown();
		}
		return false;
	}); 
	
};

document.addEventListener("DOMContentLoaded", Roller.load, false);