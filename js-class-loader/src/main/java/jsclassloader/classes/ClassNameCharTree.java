package jsclassloader.classes;

import java.util.List;


/**
 * Generates a tree of letter nodes from each class in the list added.
 */

public class ClassNameCharTree {
	
	private LetterNode root = new LetterNode(' ');
	
	ClassNameCharTree(){
	}
	
	public ClassNameCharTree(ClassFileSet finder){
		List<String> allJsClasses = finder.getAllJsClasses();
		for (String classname : allJsClasses) {
			addClass(classname);
		}
	}
	
	public void addClass(String classname){
		
		LetterNode node = root;
		char[] chars = classname.toCharArray();
		for(int i = 0; i < chars.length; i++ ){
			node = node.addChild(chars[i]);
		}
		node.setClassEnd();
	}
	
	public LetterNode getRootNode(){
		return root;
	}
}