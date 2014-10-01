/*global thing,stuff,$,etc */
//#this a single line code comment

namespace("obj.name.space");

/**
 * Class header text.
 * 
 * @param param1 is a p//aram
 * @param /*/*clearly invalid thing here.
 *
 */
 
obj.name.space.Spaceship = function(/*optional*/a, /*optional*/b, c,foo,egg) {//this is the constructor
	 
	var stringText = "/* this stuff in here// isn't a code \" comment";
	var string2 = '// nor is this stuff /* it\'s a string with commenty stuff\'" in it';
	 
	/* whole commented out section:
	 *
	 
	function testFuntion1() {
		var stringInFunc = " 		this string is mainly here to dem\"onstrate // double quoting /* and \\ \! ";
	}
	 //another comment inside the comment

	*/
	
	var test = foo
	
	function actual() {
		doSomethingElse();
	}
	 
};//end of file