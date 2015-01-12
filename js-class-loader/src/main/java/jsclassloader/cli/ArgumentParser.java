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

	// General config parameters
	private final Argument seedFilesArg;
	private final Argument seedClassesArg;
	private final Argument sourcePathArg;
	private final Argument basePathArg;
	private final Argument bundleFilePathArg;
	private final Argument sourceMapFilePathArg;
	private final Argument graphArg;
	private final Argument scriptTagsArg;
	private final Argument watchFilesArg;

	// Params that only apply to the command line
	private final Argument configFileArg;
	private final Argument helpArg;
	private final Argument listArg;

	public ArgumentParser() {
		seedFilesArg = new Argument(Config.PROP_SEED_FILES, "sf");
		seedClassesArg = new Argument(Config.PROP_SEED_CLASSES, "sc");
		sourcePathArg = new Argument(Config.PROP_SOURCE_PATHS, "sp");
		basePathArg = new Argument(Config.PROP_BASE_FOLDER, "b");
		bundleFilePathArg = new Argument(Config.PROP_BUNDLE_FILE, "o");
		sourceMapFilePathArg = new Argument(Config.PROP_SOURCE_MAP_FILE, "m");
		graphArg = new Argument(Config.PROP_GRAPH_FILE, "g");
		scriptTagsArg = new Argument(Config.PROP_SCRIPT_TAGS, "t");
		watchFilesArg = new Argument(Config.PROP_WATCH_FILES, "w");

		// Params that only apply to the command line
		configFileArg = new Argument("config", "c");
		helpArg = new Argument("help", "h");
		listArg = new Argument("list", "l");
	}

	public Config parseArgs(String[] args) {

		for (String arg : args) {
			if (!seedFilesArg.checkAndSet(arg)
					&& !seedClassesArg.checkAndSet(arg)
					&& !sourcePathArg.checkAndSet(arg)
					&& !basePathArg.checkAndSet(arg)
					&& !configFileArg.checkAndSet(arg)
					&& !helpArg.checkAndSet(arg) && !listArg.checkAndSet(arg)
					&& !scriptTagsArg.checkAndSet(arg)
					&& !graphArg.checkAndSet(arg)
					&& !bundleFilePathArg.checkAndSet(arg)
					&& !sourceMapFilePathArg.checkAndSet(arg)
					&& !watchFilesArg.checkAndSet(arg)) {

				System.out.println("Error, unknown argument: " + arg);
				System.exit(1);
			}
		}

		if (helpArg.isSet()) {
			printHelp();
			System.exit(0);
		}

		Config jsClassLoaderConfig = new Config();

		if (configFileArg.isSet()) {
			try {
				jsClassLoaderConfig
						.loadPropertiesFromStream(new FileInputStream(
								configFileArg.getValue()));
			} catch (IOException e) {
				System.err
						.println("Error, the specified config file does not exist: "
								+ configFileArg.getValue());
			}
		}

		if (basePathArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_BASE_FOLDER,
					basePathArg.getValue());
		}

		if (sourcePathArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_SOURCE_PATHS,
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

		if (watchFilesArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_WATCH_FILES,
					watchFilesArg.getValue());
		}

		if (bundleFilePathArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_BUNDLE_FILE,
					bundleFilePathArg.getValue());
		}
		if (sourceMapFilePathArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_SOURCE_MAP_FILE,
					sourceMapFilePathArg.getValue());
		}
		if (graphArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_GRAPH_FILE,
					graphArg.getValue());
		}
		if (scriptTagsArg.isSet()) {
			jsClassLoaderConfig.setProperty(Config.PROP_SCRIPT_TAGS,
					scriptTagsArg.getValue());
		}

		if (!configFileArg.isSet() && !seedFilesArg.isSet()
				&& !seedClassesArg.isSet()) {
			System.out
					.println("\nError, you must either specify a config file, like this:\n"
							+ configFileArg.getLongText()
							+ "=js-class-loader.properties\n\n"
							+ "or specify the seedClasses/seedFiles and other options on the command line, like this:\n"
							+ "\t" + seedClassesArg.getLongText()
							+ "=com.mine.MyApp \\\n"
							+ "\t" + sourcePathArg.getLongText()
							+ "=js/modules/*/src \\\n"
							+ "\t" + bundleFilePathArg.getLongText() 
							+ "=gen/bundle.js \\\n"
							+ "\t" + sourceMapFilePathArg.getLongText() 
							+ "=gen/bundle.map\n\n"
							+ "use --help to see all the options, or even better,\n"
							+ "read the Getting Started section here: at\n"
							+ "http://github.com/damonsmith/js-class-loader/wiki.\n\n");
			System.exit(1);
		}

		return jsClassLoaderConfig;
	}

	public boolean isListMode() {
		return listArg.isSet();
	}

	public boolean isscriptTagFileEnabled() {
		return scriptTagsArg.isSet();
	}

	public boolean isGraphOutputEnabled() {
		return graphArg.isSet();
	}

	public String getGraphOutputFilePath() {
		return graphArg.getValue();
	}

	public String getBasePath() {
		return basePathArg.getValue();
	}

	public String getBundleFileFilePath() {
		return bundleFilePathArg.getValue();
	}

	private void printHelp() {
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
						+ bundleFilePathArg.getLongText()
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
						+ graphArg.getLongText()
						+ "= - path of the dot file graph to generate.\n"
						+ "-g=, "
						+ bundleFilePathArg.getLongText()
						+ "= - File to write the bundle to, if not set then print to stdout.\n"
						+ sourceMapFilePathArg.getLongText()
						+ "= - File to write the source map to.");
	}
}
