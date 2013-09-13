package jsclassloader.cli;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import jsclassloader.Config;



/**
 * Converts a set of command line arguments into a Config object,
 * also handles printing help and error messages.
 * @author damon
 *
 */
public class ArgumentParser {
	
	private static final Argument seedFilesArg = new Argument("seed.files", "sf");
	private static final Argument seedClassesArg = new Argument("seed.classes", "sc");
	private static final Argument sourcePathArg = new Argument("source.paths", "sp");
	private static final Argument basePathArg = new Argument("base.path", "b");
	private static final Argument configFileArg =  new Argument("config.file", "c");
	private static final Argument outputToFileArg = new Argument("output", "o");
	private static final Argument helpArg =  new Argument("help", "h");
	private static final Argument listArg =  new Argument("list", "l");
	private static final Argument scriptTagsArg =  new Argument("scriptTags", "t");
	
	public Config parseArgs(String [] args) {
		Config jsClassLoaderConfig;
		
		basePathArg.setSet(true);
		basePathArg.setValue(".");
		
		for (String arg : args) {
			seedFilesArg.checkAndSet(arg);
			seedClassesArg.checkAndSet(arg);
			sourcePathArg.checkAndSet(arg);
			basePathArg.checkAndSet(arg);
			configFileArg.checkAndSet(arg);
			helpArg.checkAndSet(arg);
			listArg.checkAndSet(arg);
			scriptTagsArg.checkAndSet(arg);
			outputToFileArg.checkAndSet(arg);
		}
		
		if (helpArg.isSet()) {	
			printHelp();
			System.exit(0);
		}
		
		try {
			if (configFileArg.isSet()) {
				jsClassLoaderConfig = new Config(new FileInputStream(configFileArg.getValue()), basePathArg.getValue());
			}
			else {
				
				jsClassLoaderConfig = new Config();
				jsClassLoaderConfig.setBaseFolder(basePathArg.getValue());
				
				if (!sourcePathArg.isSet()
				 && !seedFilesArg.isSet()
				 && !seedClassesArg.isSet()) {
					printHelp();
					System.exit(1);
				}
			}
			
			if (sourcePathArg.isSet()) {
				jsClassLoaderConfig.setSourceFolders(sourcePathArg.getValue());
			}
			
			if (seedFilesArg.isSet()) {
				jsClassLoaderConfig.setSeedFiles(seedFilesArg.getValue());
			}
			
			if (seedClassesArg.isSet()) {
				List<String> seedClassesFromCmdLine = new ArrayList<String>();
				
				String[] seeds = seedClassesArg.getValue().split(",");
				for (String sClass : seeds) {
					seedClassesFromCmdLine.add(sClass);
				}
				jsClassLoaderConfig.setSeedClassList(seedClassesFromCmdLine);
			}
				
			if (jsClassLoaderConfig.getSeedFiles() == null && !seedClassesArg.isSet()) {
				System.out.println("Error, no seed classes were specified.\n" + 
								   "You can either specify some classes directly on the command line, e.g: \n" +
								   "" + seedClassesArg.getLongText() + "=com.my.stuff.Class1,com.my.things.Class2\n" +
								   "\n" +
								   "Or you can specify some files to parse for class names, e.g: \n" +
								   "" + seedFilesArg.getLongText() + "=\"baseClassesList.txt,others.xml\" \n" + 
								   "\n" +
								   "Or you can point to a properties config file, e.g: \n--" + configFileArg + "=\"conf/js-class-loader.properties\"");
				System.exit(1);
			}
			
			return jsClassLoaderConfig;
			
		}
		catch (IOException ioe) {
			System.err.println("Error reading properties file: " + configFileArg.getValue() + ",\n" + ioe.getMessage());
		}
		
		return null;
	}
	
	public boolean isListMode() {
		return listArg.isSet();
	}
	
	public boolean isScriptTagMode() {
		return scriptTagsArg.isSet();
	}
	
	public String getBasePath() {
		return basePathArg.getValue();
	}
	
	public String getOutpuTotFile() {
		return outputToFileArg.getValue();
	}
	
	
	private static void printHelp() {
		System.out.println(
				"Javascript class loader - see www.jscl.testorg.com for more info.\n\n" +
				"Usage: \n\n" +
				"Specify a properties file with all the configuration in it:\n" +
				"java -jar js-class-loader.jar " + configFileArg.getLongText() + "=conf/my-js-class-loader.properties\n\n" +
				"or specify each config option:\n" +
				"java -jar js-class-loader.jar " +
				"\\\n     " + sourcePathArg.getLongText() + "=\"modules/module1/src,module/module2/src\" " +
				"\\\n     " + seedFilesArg.getLongText() + "=\"classList.txt,types.xml,src/stuff/BaseClass.js\"\n" +
				"\n" +
				"or you can both specify a config file and then override it with options.\n" +
				"\n" +
				"Options: \n" +
				"-l, " + listArg.getLongText() + " - causes the bundler to list classes instead of outputting their contents\n" +
				"-sp=, " + sourcePathArg.getLongText() + "= - Comma separated list of base folders containing class files and folders.\n" +
				"-f=, " + seedFilesArg.getLongText() + "= - Comma separated list of files containing text that matches fully qualified classes.\n" + 
				"-sc=, " + seedClassesArg.getLongText() + "= - Comma separated list of fully qualified class names to use as seeds on top of any seed files.\n" + 
				"-c=, " + configFileArg.getLongText() + "= - path to config properties file.\n" + 
				"-b=, " + basePathArg.getLongText() + "= - Alternative base path to base all relative paths from.\n" +
				"-o=, " + outputToFileArg.getLongText() + "= - File to write to, if not set then print to stdout.\n"
		);
	}
}
