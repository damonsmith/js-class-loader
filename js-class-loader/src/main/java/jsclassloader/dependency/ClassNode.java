package jsclassloader.dependency;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ClassNode implements Comparable<ClassNode> {
	private Map<String, ClassNode> runtimeDependencies;
	private Map<String, ClassNode> staticDependencies;
	private Set<ClassNode> reverseDependencies;

	private ClassNode() {
		runtimeDependencies = new HashMap<String, ClassNode>();
		staticDependencies = new HashMap<String, ClassNode>();
		reverseDependencies = new HashSet<ClassNode>();
	}

	private String value;

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	private boolean processed;

	public boolean isProcessed() {
		return processed;
	}
	
	public void setProcessed(boolean processed) {
		this.processed = processed;
	}

	public ClassNode(String value) {
		this();
		this.value = value;
	}

	public Collection<ClassNode> getRunTimeDependencies() {
		return runtimeDependencies.values();
	}

	public Collection<ClassNode> getStaticDependencies() {
		return staticDependencies.values();
	}

	public void addDependency(ClassNode classNode, boolean isStatic) {

		String className = classNode.getValue();

		if (isStatic) {
			if (this.staticDependencies.get(className) == null) {
				// if it was a static but is now a runtime dep, move it from
				// runtime to static.
				if (this.runtimeDependencies.get(className) != null) {
					this.staticDependencies.put(className, this.runtimeDependencies.get(className));
					this.runtimeDependencies.remove(className);
				} else {
					addStaticDependency(classNode);
				}
			}
		} else {
			if (this.runtimeDependencies.get(className) == null && this.staticDependencies.get(className) == null) {
				addRuntimeDependency(classNode);
			}
		}
	}

	public void addStaticDependency(ClassNode classNode) {
		staticDependencies.put(classNode.getValue(), classNode);
		classNode.addReverseDependency(this);
	}

	public void addRuntimeDependency(ClassNode classNode) {
		runtimeDependencies.put(classNode.getValue(), classNode);
		classNode.addReverseDependency(this);
	}

	public void addReverseDependency(ClassNode classNode) {
		reverseDependencies.add(classNode);
	}

	public void removeDependency(ClassNode classNode) {
		String className = classNode.getValue();
		boolean found = false;
		if (this.staticDependencies.get(className) != null) {
			this.staticDependencies.remove(className);
			found = true;
		} else if (this.runtimeDependencies.get(className) != null) {
			this.runtimeDependencies.remove(className);
			found = true;
		}
		if (found == false) {
			throw new RuntimeException("Can't remove dependency that doesn't exist: Trying to remove dependency: "
					+ "[" + className + "] from: [" + this.getValue() + "]");
		}
	}
	
	public void destroy() {
		for (ClassNode node : this.reverseDependencies) {
			node.removeDependency(this);
		}
	}

	public boolean hasRuntimeDependency(String className) {
		return runtimeDependencies.containsKey(className);
	}

	public boolean hasStaticDependency(String className) {
		return staticDependencies.containsKey(className);
	}

	public boolean hasDependency(String value) {
		if (hasStaticDependency(value)) {
			return true;
		}
		return hasRuntimeDependency(value);
	}

	@Override
	public boolean equals(Object obj) {
		if (((ClassNode) obj).getValue().equals(getValue())) {
			return true;
		}
		return false;
	}

	@Override
	public int compareTo(ClassNode o) {
		return value.compareTo(o.value);
	}
}
