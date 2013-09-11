package jsclassloader.classes;

public class LetterNode {
	private char letter;
	private LetterNode[] kids = new LetterNode[40];
	private boolean classend = false;
	
	LetterNode(char letter){
		this.letter = letter;
	}
	
	LetterNode addChild(char child){
		
		LetterNode result = null; 
		for(int i = 0 ; i < kids.length ; i++ ){
			
			if(kids[i] == null){
				kids[i] = new LetterNode(child); 
				return kids[i];
			}
			if(kids[i].letter == child){
				result = kids[i];
				break;
			}
			
		}
		return result;
	}
	
	public LetterNode find(char target){
		for(int i = 0 ; i < kids.length ; i++ ){
			if(kids[i] == null){
				return null;
			}
			if(kids[i].letter == target){
				return  kids[i];
			}
		}
		return null;
	}
	
	public boolean isLeaf(){
		return kids[0] == null; 
	}
	
	public boolean isClassEnd(){
		return classend; 
	}

	public void setClassEnd() {
		this.classend  = true;
		
	}
	
}
