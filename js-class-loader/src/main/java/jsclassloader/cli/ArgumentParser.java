package jsclassloader.cli;

import java.io.FileInputStream;
import java.io.IOException;

import jsclassloader.Config;

/**
 * Converts a set of command line arguments into a Config object, also handles
 * printing help and error messages.
 * 
 * @author damon
 * 
 */
public class ArgumentParser {

	private static final Argument seedFilesArg = new Argument("seed.files",
			"sf");
	private static final Argument seedClassesArg = new Argument("seed.classes",
			"sc");
	private static final Argument sourcePathArg = new Argument("source.paths",
			"sp");
	private static final Argument basePathArg = new Argument("base.path", "b");
	private static final Argument configFileArg = new Argument("config.file",
			"c");
	private static final Argument bundleOutputPathArg = new Argument(
			"bundle.output", "o");
	private static final Argument helpArg = new Argument("help", "h");
	private static final Argument listArg = new Argument("list", "l");
	private static final Argument scriptTagsArg = new Argument(
			"script.tag.output", "t");

	public Config parseArgs(String[] args) {

		for (String arg : args) {
			seedFilesArg.checkAndSet(arg);
			seedClassesArg.checkAndSet(arg);
			sourcePathArg.checkAndSet(arg);
			basePathArg.checkAndSet(arg);
			configFileArg.checkAndSet(arg);
			helpArg.checkAndSet(arg);
			listArg.checkAndSet(arg);
			scriptTagsArg.checkAndSet(arg);
			bundleOutputPathArg.checkAndSet(arg);
		}

		if (helpArg.isSet()) {
			printHelp();
			System.exit(0);
		}

		Config jsClassLoaderConfig = new Config();

		if (configFileArg.isSet()) {
			try {
				jsClassLoaderConfig.loadPropertiesFromStream(new FileInputStream(
					configFileArg.getValue()));
			}
			catch(IOException e) {
				System.err.println("Error, the specified config file does not exist: " + configFileArg.getValue());
			}
		}

		if (basePathArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_BASE_FOLDER,
					basePathArg.getValue());
		}

		if (sourcePathArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_SOURCE_FOLDERS,
					sourcePathArg.getValue());
		}

		if (seedFilesArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_SEED_FILES,
					seedFilesArg.getValue());
		}

		if (seedClassesArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_SEED_CLASSES,
					seedClassesArg.getValue());
		}

		if (!seedFilesArg.isSet() && !seedClassesArg.isSet()) {
			System.out
					.println("Error, no seed classes or files were specified.\n"
							+ "You can either specify some classes directly on the command line, e.g: \n"
							+ ""
							+ seedClassesArg.getLongText()
							+ "=com.my.stuff.Class1,com.my.things.Class2\n"
							+ "\n"
							+ "Or you can specify some files to parse for class names, e.g: \n"
							+ ""
							+ seedFilesArg.getLongText()
							+ "=\"baseClassesList.txt,others.xml\" \n"
							+ "\n"
							+ "Or you can point to a properties config file, e.g: \n--"
							+ configFileArg
							+ "=\"conf/js-class-loader.properties\"");
			System.exit(1);
		}

		return jsClassLoaderConfig;
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
		return bundleOutputPathArg.getValue();
	}

	private static void printHelp() {
		System.out
				.println("Javascript class loader - see http://github.com/damonsmith/js-class-loader for more info.\n\n"
						+ "Usage: \n\n"
						+ "Either specify a properties file with all the configuration in it, like this:\n"
						+ "java -jar js-class-loader.jar "
						+ configFileArg.getLongText()
						+ "=conf/my-js-class-loader.properties\n\n"
						+ "or specify each config option:\n"
						+ "java -jar js-class-loader.jar "
						+ "\\\n     "
						+ sourcePathArg.getLongText()
						+ "=\"modules/module1/src,module/module2/src\" "
						+ "\\\n     "
						+ seedFilesArg.getLongText()
						+ "=\"classList.txt,types.xml,src/stuff/BaseClass.js\"\n"
						+ "\\\n     "
						+ scriptTagsArg.getLongText()
						+ "=gen/script-tag-list.html\n"
						+ "\\\n     "
						+ bundleOutputPathArg.getLongText()
						+ "=gen/bundle.js\n"
						+ "\n"
						+ "or you can both specify a config file and then override it with options.\n"
						+ "\n"
						+ "Options: \n"
						+ "-b=, "
						+ basePathArg.getLongText()
						+ "= - All input command paths and output script paths will be based from here.\nDefaults to the current location\n"
						+ "-sp=, "
						+ sourcePathArg.getLongText()
						+ "= - Comma separated list of source folders containing class files and folders.\n"
						+ "-sc=, "
						+ seedClassesArg.getLongText()
						+ "= - Comma separated list of fully qualified class names to use as seeds.\n"
						+ "-sf=, "
						+ seedFilesArg.getLongText()
						+ "= - Comma separated list of files containing text that matches fully qualified classes.\n"
						+ "-l, "
						+ listArg.getLongText()
						+ " - list the files instead of generating anything\n"
						+ "-c=, "
						+ configFileArg.getLongText()
						+ "= - path of a config properties file to use instead of all these other arguments.\n"
						+ "-t=, "
						+ scriptTagsArg.getLongText()
						+ "= - path of the script tag list file to generate.\n"
						+ "-o=, "
						+ bundleOutputPathArg.getLongText()
						+ "= - File to write the bundle to, if not set then print to stdout.\n");
	}
}
