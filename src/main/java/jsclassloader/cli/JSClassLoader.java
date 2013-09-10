package jsclassloader.cli;

import java.util.ArrayList;
import java.util.List;

import jsclassloader.Bundler;
import jsclassloader.Config;
import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraph;


public class JSClassLoader {

	static boolean usePropertiesFile;
	static String propFileName;
	static String basePath;
	static List<String> seedClassesFromCmdLine;
	static String [] sourceFolders;
	
	
	
	public static void main(String[] args) throws Exception {
		ArgumentParser parser = new ArgumentParser();
		Config jsClassLoaderConfig = parser.parseArgs(args);
		DependencyGraph dependencyGraph = new DependencyGraph(jsClassLoaderConfig.getSourceFolderList(), jsClassLoaderConfig);
		
		List<String> seedClassList = new ArrayList<String>(); 
		
		if (jsClassLoaderConfig.getSeedFileList() != null) {
			seedClassList.addAll(dependencyGraph.getSeedClassesFromFiles(jsClassLoaderConfig.getSeedFileList()));
		}
		
		if (jsClassLoaderConfig.getSeedClassList() != null) {
			seedClassList.addAll(jsClassLoaderConfig.getSeedClassList());
		}
		
		Bundler bundler = new Bundler(seedClassList, dependencyGraph);
		if (parser.isListMode()) {
			for (ClassNode item : bundler.getClassList()) {
				System.out.println(item.getValue());
			}
		}
		else {
			bundler.write(System.out);
		}
	}
}
