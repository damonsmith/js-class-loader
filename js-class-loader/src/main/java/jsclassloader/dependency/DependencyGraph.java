package jsclassloader.dependency;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
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

	public DependencyGraph(Config config) throws IOException {
		classFileSet = new ClassFileSet(config);

		depParser = new DependencyParser(config);
		
		depParser.setClassFileSet(classFileSet);
		
		nodeMap = new HashMap<String, ClassNode>();
		List<String> classNames = classFileSet.getAllJsClasses();
		Collections.sort(classNames);
		for (String className : classNames) {
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
	
	public ClassNode getNode(String className) {
		return nodeMap.get(className);
	}
	
	public void addFile(File file) {
		if (file.getName().endsWith(".js")) {
			classFileSet.addClassFile(file);
			String className = classFileSet.getClassnameFromFile(file);
			ClassNode node = new ClassNode(className);
			nodeMap.put(className, node);
		}
	}
	
	public void updateFile(File file) throws IOException {
		String className = classFileSet.getClassnameFromFile(file);
		processDependencies(nodeMap.get(className));
	}
	
	public void removeFile(File file) {
		if (classFileSet.containsFile(file)) {
			String className = classFileSet.getClassnameFromFile(file);
			nodeMap.get(className).destroy();
			classFileSet.removeClassFile(file);
			nodeMap.remove(className);
		}
	}
	
	public List<String> getSeedClassesFromFiles(List<File> seedSources) throws IOException {
		
		Collections.sort(seedSources);
		
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
		Collections.sort(results);
		return results;
	}
}
