package jsclassloader.dependency;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import jsclassloader.Config;
import jsclassloader.classes.ClassFileSet;
import jsclassloader.classes.ClassNameCharTree;
import jsclassloader.classes.LetterNode;

public class DependencyParser {

	private final LetterNode root;
	private StringBuffer sinceStartOfLine;
	private List<Match> possibleMatches;
	
	private String forceLoadRegex;
	private String implementRegex;
	private String extendRegex;
	private String startOfWholeLineForceLoadRegex;
	private String wholeLineForceLoadRegex;
	
	private static String jsdocLinkRegex = ".*\\{ *@link.*";
	
	private int readAheadLimit = 1000;

	public DependencyParser(ClassFileSet fileSet, Config config) {
		root = new ClassNameCharTree(fileSet).getRootNode();
		
		sinceStartOfLine = new StringBuffer();
		possibleMatches = new ArrayList<Match>();
		
		this.forceLoadRegex = config.getForceLoadRegex();
		this.implementRegex = config.getImplementRegex();
		this.extendRegex = config.getExtendRegex();
		this.startOfWholeLineForceLoadRegex = config.getStartOfWholeLineForceLoadRegex();
		this.wholeLineForceLoadRegex = config.getWholeLineForceLoadRegex();
		
	}

	public List<Match> parse(InputStream in) throws IOException {
		
		sinceStartOfLine.setLength(0);
		int latest;
		List<Match> results = new ArrayList<Match>();
		while((latest = in.read()) !=  -1)
		{
			Match matched = next((char)latest);
			if(matched != null){
				if (matched.isReadAheadRequired()) {
					in.mark(readAheadLimit);
					StringBuffer restOfLine = new StringBuffer();
					int nextAhead = in.read();
					while(nextAhead != -1 && nextAhead != 10 && nextAhead != 13) {
						restOfLine.append((char)nextAhead);
						nextAhead = in.read();
					}
					in.reset();
					checkWholeLineForceLoad(sinceStartOfLine + restOfLine.toString(), matched);
				}
				results.add(matched);
			}
		}
		return results;
	}	
	
	private Match next(char latest) {
		if(latest == '\n'){
			sinceStartOfLine.setLength(0);
		}else{
			sinceStartOfLine.append(latest);
		}
		Match result = null;
		LetterNode rootFound = root.find(latest);
		List<Match> toRemove = new ArrayList<Match>();
		
		for (Match match : possibleMatches) {
			LetterNode found = match.node.find(latest);
			if (found == null) {
				toRemove.add(match);
				if(match.lastPartial != null){
					if(!isJsDocLink()){
						detectStatic(match);
						result =  match;
					}
				}
			} else {
				match.buffer.append(latest);
				match.node = found;
				if (found.isLeaf()) {
					if(!isJsDocLink()){
						detectStatic(match);
						result = match;
					}
					toRemove.add(match);
				}else {
					if (found.isClassEnd()){
						match.lastPartial = match.buffer.toString();
					}
				}
			}
		}

		if (rootFound != null) {
			possibleMatches.add(new Match(latest, rootFound));
		}
		possibleMatches.removeAll(toRemove);
		return result;
	}
	
	public void checkWholeLineForceLoad(String line, Match match) {
		if (line.matches(wholeLineForceLoadRegex)) {
			match.setStaticDependency(true);
		}
		
	}

	private boolean isJsDocLink() {
		 String line = sinceStartOfLine.toString();
		 boolean result =  line.matches(jsdocLinkRegex);
		 return result;
	}

	private void detectStatic(Match match) {
		
		String line = sinceStartOfLine.toString();
		
		if(line.matches(startOfWholeLineForceLoadRegex)) {
			match.setReadAheadRequired(true);
		}
		else if(line.matches(implementRegex)){
			match.setStaticDependency(true);
		}
		else if(line.matches(extendRegex)){
			match.setStaticDependency(true);
		}
		else if (line.matches(forceLoadRegex)) {
			match.setStaticDependency(true);
		}
	}

	public class Match {
		private StringBuffer buffer = new StringBuffer();
		private LetterNode node;
		private String lastPartial;
		private boolean staticDependency = false;
		private boolean readAheadRequired = false;

		private Match(char first, LetterNode root) {
			buffer.append(first);
			node = root;
		}
		
		public String getClassname(){
			return buffer.toString();
		}

		public void setStaticDependency(boolean staticDependency) {
			this.staticDependency = staticDependency;
		}

		public boolean isStaticDependency() {
			return staticDependency;
		}
		
		public void setReadAheadRequired(boolean readAheadRequired) {
			this.readAheadRequired = readAheadRequired;
		}
		
		public boolean isReadAheadRequired() {
			return readAheadRequired;
		}
		
	}

}
