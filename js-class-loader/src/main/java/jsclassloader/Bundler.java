package jsclassloader;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import jsclassloader.classes.ClassFileSet;
import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraph;


public class Bundler {
	private List<ClassNode> classList;
	private Iterator<ClassNode> iterator;
	private ClassNode currentNode;
	private ClassFileSet classFileSet;
	private int contentLength;
	private Map<String, Boolean> addedClasses;
	
	public List<ClassNode> getClassList() {
		return classList;
	}

	public Bundler(List<String> seedClasses, DependencyGraph dependencyGraph) {
		classList = new LinkedList<ClassNode>();
		
		addedClasses = new HashMap<String, Boolean>();
		
		for (String className : seedClasses) {
			addNode(dependencyGraph.getNode(className), classList);
		}
		
		iterator = classList.listIterator();
		classFileSet = dependencyGraph.getClassFileSet();
		
		contentLength = 0;
		while (iterator.hasNext()) {
			File file = classFileSet.getFileFromClassname(iterator.next().getValue());
			contentLength += file.length();
			contentLength += ("\n\n//File: " + file.getPath() + "\n").length();
		}
	}
	
	public int getContentLength() {
		return contentLength;
	}

	private void addNode(ClassNode node, List<ClassNode> classList) {
		if (addedClasses.get(node.getValue()) == null) {
			
			//Depth first recurse adding static dependencies first:
			for (ClassNode child : node.getStaticDependencies()) {
				addNode(child, classList);
			}
			
			if (addedClasses.get(node.getValue()) == null) {
				classList.add(node);
				addedClasses.put(node.getValue(), true);
			}
		
			//then add runtime dependencies
			for (ClassNode child : node.getRunTimeDependencies()) {
				addNode(child, classList);
			}
		}
	}

	public void write(OutputStream out) throws IOException {
		
		iterator = classList.listIterator();
		
		while(iterator.hasNext()) {
			currentNode = iterator.next();
			File file = classFileSet.getFileFromClassname(currentNode.getValue());
			out.write(("\n\n//File: " + file.getName() + "\n").getBytes());
			Bundler.copy(new FileInputStream(file), out);
		}
	}
	
	private static final int DEFAULT_BUFFER_SIZE = 1024 * 4;

	public static int copy(InputStream input, OutputStream output) throws IOException {
	  long count = copyLarge(input, output);
	  if (count > Integer.MAX_VALUE) {
	    return -1;
	  }
	  return (int) count;
	}

	public static long copyLarge(InputStream input, OutputStream output)
	    throws IOException {
	   byte[] buffer = new byte[DEFAULT_BUFFER_SIZE];
	   long count = 0;
	   int n = 0;
	   while (-1 != (n = input.read(buffer))) {
	     output.write(buffer, 0, n);
	     count += n;
	   }
	   return count;
	}
	
	
}