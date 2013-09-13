package jsclassloader.dependency;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jsclassloader.Config;
import jsclassloader.classes.ClassFileSet;

public class DependencyGraph {
	
	private Map<String, ClassNode> nodeMap;
	
	private DependencyParser depParser;
	private ClassFileSet classFileSet;
	
	public ClassFileSet getClassFileSet() {
		return classFileSet;
	}

	public DependencyGraph(List<File> sourceFolders, Config config) throws IOException {
		classFileSet = new ClassFileSet(sourceFolders);
		depParser = new DependencyParser(classFileSet, config);
		nodeMap = new HashMap<String, ClassNode>();
		for (String className : classFileSet.getAllJsClasses()) {
			nodeMap.put(className, new ClassNode(className));
		}
		for (ClassNode node : nodeMap.values()) {
			processDependencies(node);
		}
	}
	
	public void processDependencies(ClassNode node) throws IOException {
		if (!node.isProcessed()) {
			node.setProcessed(true);
			
			File file = classFileSet.getFileFromClassname(node.getValue());
			InputStream in = new BufferedInputStream(new FileInputStream(file));
			for (DependencyParser.Match matched : depParser.parse(in))
			{
				if(matched != null && !matched.getClassname().equals(node.getValue())){
					
					if (nodeMap.get(matched.getClassname()) == null) {
						//logger.warn("Classname not found in classes: " + matched.getClassname());
					}
					else {
						node.addDependency(nodeMap.get(matched.getClassname()), matched.isStaticDependency());
					}
				}
			}
			in.close();
		
			for (ClassNode dep : node.getStaticDependencies()) {
				processDependencies(dep);
			}
			for (ClassNode dep : node.getRunTimeDependencies()) {
				processDependencies(dep);
			}
		}
	}
	
	public String renderDotFile(String className) {
		Map<ClassNode, Boolean> done = new HashMap<ClassNode, Boolean>();
		StringBuffer graph = new StringBuffer("digraph G {\n");
		ClassNode parentNode = getNode(className);
		addNodeToDotFile(parentNode, graph, done);
		
		graph.append("}\n");
		return graph.toString();
	};
	
	private void addNodeToDotFile(ClassNode node, StringBuffer graph, Map<ClassNode, Boolean> done) {
		if (done.get(node) == null) {
			done.put(node, true);
			
			for (ClassNode child : node.getStaticDependencies()) {
				graph.append("edge [color=red];\n");
				graph.append("\"" + node.getValue() + "\" -> \"" + child.getValue() + "\";\n");
				addNodeToDotFile(child, graph, done);
			}
			
			for (ClassNode child : node.getRunTimeDependencies()) {
				graph.append("edge [color=black];\n");
				graph.append("\"" +node.getValue() + "\" -> \"" + child.getValue() + "\";\n");
				addNodeToDotFile(child, graph, done);
			}
		}
	}
	
	public ClassNode getNode(String className) {
		return nodeMap.get(className);
	}
	
	public List<String> getSeedClassesFromFiles(List<File> seedSources) throws IOException {
		
		List<String> results = new ArrayList<String>();
		
		for (File file: seedSources) {
			if (!file.isDirectory() && file.canRead()) {
				BufferedInputStream in = new BufferedInputStream(new FileInputStream(file));
				
				for (DependencyParser.Match match : depParser.parse(in)) {
					results.add(match.getClassname());
				}
				in.close();
			}
		}
		return results;
	}
}
