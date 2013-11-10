package jsclassloader.dependency;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DependencyGraphVisualizer {
	
	DependencyGraph dependencyGraph;
	
	public DependencyGraphVisualizer(DependencyGraph dependencyGraph) {
		this.dependencyGraph = dependencyGraph;
	}
	
	public String renderDotFile(List<String> classNames) {
		Map<ClassNode, Boolean> done = new HashMap<ClassNode, Boolean>();
		StringBuffer graph = new StringBuffer("digraph G {\n");
		
		for (String className : classNames) {
			ClassNode parentNode = dependencyGraph.getNode(className);
			addNodeToDotFile(parentNode, graph, done);
		}
		graph.append("}\n");
		return graph.toString();
	};
	
	private void addNodeToDotFile(ClassNode node, StringBuffer graph, Map<ClassNode, Boolean> done) {
		if (done.get(node) == null) {
			done.put(node, true);
 
			graph.append("\"" + node.getValue() + "\";\n");
			
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

	public String renderModuleDotFile() {
		Map<String, Boolean> moduleDone = new HashMap<String, Boolean>();
		Map<String, Boolean> linkDone = new HashMap<String, Boolean>();
		Map<ClassNode, Boolean> classDone = new HashMap<ClassNode, Boolean>();
		
		StringBuffer graph = new StringBuffer("digraph G {\n");
		
		for (String className : dependencyGraph.getClassFileSet().getAllJsClasses()) {
			addModuleDependencyToDotFile(dependencyGraph.getNode(className), graph, classDone, moduleDone, linkDone);
		}
		graph.append("}\n");
		return graph.toString();
	};
	
	private void addModuleDependencyToDotFile(ClassNode node, StringBuffer graph, Map<ClassNode, Boolean> classDone, Map<String, Boolean> moduleDone, Map<String, Boolean> linkDone) {
		String moduleName = dependencyGraph.getClassFileSet().getSrcDirFromClassname(node.getValue());
		
		//put in the modules on their own just in case there are no links:
		if (moduleDone.get(moduleName) == null) {
			moduleDone.put(moduleName, true);
			graph.append("  \"" + moduleName.replace("\\", ".") +"\";\n");
		}
		
		if (classDone.get(node) == null) {
			classDone.put(node, true);
			
			for (ClassNode child : node.getStaticDependencies()) {
				String childModuleName = dependencyGraph.getClassFileSet().getSrcDirFromClassname(child.getValue());
				addModuleLinkToDotFile(moduleName, childModuleName, graph, linkDone);
				addModuleDependencyToDotFile(child, graph, classDone, moduleDone, linkDone);
			}
			for (ClassNode child : node.getRunTimeDependencies()) {
				String childModuleName = dependencyGraph.getClassFileSet().getSrcDirFromClassname(child.getValue());
				addModuleLinkToDotFile(moduleName, childModuleName, graph, linkDone);
				addModuleDependencyToDotFile(child, graph, classDone, moduleDone, linkDone);
			}
		}
	}
	
	private void addModuleLinkToDotFile(String parentModule, String childModule, StringBuffer graph, Map<String, Boolean> linkDone) {
		
		if (!parentModule.equals(childModule)) {
			
			String link = parentModule + "&" + childModule;
			
			parentModule = parentModule.replace("\\", ".");
			childModule = childModule.replace("\\", ".");
			
			if (linkDone.get(link) == null) {
				linkDone.put(link, true);
				graph.append("  \"" + parentModule + "\" -> \"" + childModule + "\";\n");
			}
		}
	}
}
