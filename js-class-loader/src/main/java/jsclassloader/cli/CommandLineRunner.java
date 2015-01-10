package jsclassloader.cli;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.util.List;
import java.util.logging.Logger;

import jsclassloader.Bundler;
import jsclassloader.Config;
import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraphVisualizer;
import jsclassloader.watcher.FileChangeWatcher;
import jsclassloader.watcher.FileChangeWatcher.GraphUpdateListener;


public class CommandLineRunner implements GraphUpdateListener {

	static boolean usePropertiesFile;
	static String propFileName;
	static List<String> seedClassesFromCmdLine;
	static String [] sourcePaths;
	private final static Logger LOG = Logger.getLogger("JS-Class-Loader");
	
	private Bundler bundler;
	private Config config;
	private PrintStream out;
	
	public static void main(String[] args) throws Exception {
		new CommandLineRunner(args, System.out);
	}
	
	public CommandLineRunner(String [] args, PrintStream out) throws Exception {
		ArgumentParser parser = new ArgumentParser();
		config = parser.parseArgs(args);
		bundler = new Bundler(config);
		this.out = out;
		
		if (parser.isListMode()) {
			for (ClassNode item : bundler.getClassList()) {
				out.println(item.getValue());
			}
		}
		else {
			generate();
			
			if (config.getProperty(Config.PROP_WATCH_FILES) != null 
			    && config.getProperty(Config.PROP_WATCH_FILES).equals("true")) {
				
				FileChangeWatcher watcher = new FileChangeWatcher(bundler);
				watcher.addUpdateListener(this);
				watcher.processEvents();
			}
		}
	}
	
	void generate() throws IOException {
		String scriptTagFileConfig = config.getProperty(Config.PROP_SCRIPT_TAGS);
		if (scriptTagFileConfig != null) {
			File scriptTagFile = prepFile(scriptTagFileConfig);
			PrintStream tagsOut = new PrintStream(new FileOutputStream(scriptTagFile));
			bundler.writeScriptTags(tagsOut);
			tagsOut.close();
		}
		
		String graphFileConfig = config.getProperty(Config.PROP_GRAPH_FILE);
		if (graphFileConfig != null) {
			File graphFile = prepFile(graphFileConfig);
			PrintStream graphOut = new PrintStream(new FileOutputStream(graphFile));
			DependencyGraphVisualizer vis = new DependencyGraphVisualizer(bundler.getDependencyGraph());
			
			graphOut.print(vis.renderDotFile(bundler.getSeedClassNameList()));
			graphOut.close();

			File moduleGraphFile = prepFile(graphFileConfig + ".modules");
			PrintStream modGraphOut = new PrintStream(new FileOutputStream(moduleGraphFile));
			modGraphOut.print(vis.renderModuleDotFile());
			modGraphOut.close();
		}
		
		String bundleFileConfig = config.getProperty(Config.PROP_BUNDLE_FILE);
		if (bundleFileConfig != null) {
			File bundleFile = prepFile(bundleFileConfig);
			PrintStream bundleOut = new PrintStream(new FileOutputStream(bundleFile));
			bundler.write(bundleOut);
			bundleOut.close();	
		}
		else {
			bundler.write(out);
		}
		
		String sourceMapFileConfig = config.getProperty(Config.PROP_SOURCE_MAP_FILE);
		if (sourceMapFileConfig != null) {
			File sourceMapFile = prepFile(sourceMapFileConfig);
			PrintStream sourceMapOut = new PrintStream(new FileOutputStream(sourceMapFile));
			bundler.writeSourceMap(sourceMapOut);
		}
	}
	
	public static File prepFile(String path) {
		File file = new File(path);
		if (file.getParentFile() != null && !file.getParentFile().exists()) {
			file.getParentFile().mkdirs();
		}
		return file;
	}

	@Override
	public void graphUpdated() {
		try {
			generate();
		}
		catch (IOException e) {
			throw new RuntimeException(e);
		}
		
	}
}
