package jsclassloader.cli;

import java.io.File;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import jsclassloader.Bundler;
import jsclassloader.Config;
import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraph;


public class JSClassLoader {

	static boolean usePropertiesFile;
	static String propFileName;
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
		
		PrintStream out = System.out;
		
		if (parser.getOutpuTotFile() != null) {
			out = new PrintStream(new FileOutputStream(new File(parser.getOutpuTotFile())));
		}
		
		if (parser.isScriptTagMode()) {
			for (ClassNode item : bundler.getClassList()) {
				File file = dependencyGraph.getClassFileSet().getFileFromClassname(item.getValue());
				
				Path filePath = Paths.get(file.getAbsolutePath());
				
				/* Fix path string because java sees /. or \, as a folder and adds a .. to the relative path. */
				String absoluteBasePath = new File(parser.getBasePath()).getAbsolutePath();
				if (absoluteBasePath.indexOf(File.separator + ".") == absoluteBasePath.length() - 2) {
					absoluteBasePath = absoluteBasePath.substring(0, absoluteBasePath.length() - 2);
				}
				/* ****************************************************************************************** */

				Path basePath = Paths.get(absoluteBasePath);
				out.println("<script type=\"text/javascript\" src=\"" + basePath.relativize(filePath) + "\"></script>");
			}
		}
		else if (parser.isListMode()) {
			for (ClassNode item : bundler.getClassList()) {
				out.println(item.getValue());
			}
		}
		else {
			bundler.write(out);
		}
	}
}
