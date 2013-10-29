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
	
	var tocContent = $("#toc-content");
	tocContent.html(HTML5Outline(document.body).asHTML(true));
	$(".toc button").click(function() {
		if (tocContent.is(":visible")) {
			tocContent.slideUp();
		}
		else {
			tocContent.slideDown();
		}
	});
	
};

document.addEventListener("DOMContentLoaded", Roller.load, false);