package jsclassloader;

/**
 * Maven plugin for JS-Class-Loader
 */

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;

/**
 * @goal generate-js-bundle
 */
public class JsClassLoaderMojo extends AbstractMojo {

	/**
	 * Base path that all the other path parameters will be relative to. 
	 * 
	 * @parameter default-value="${basedir}/src/main/webapp"
	 */
	private String basePath;
	
	
	/**
	 * Path to a js-class-loader.properties config file to use. You can use a properties
	 * file for some or all of the settings, however the properties file can't expand 
	 * maven properties so you should configure the path settings in the plugin config
	 * rather than in a config file so it can survive being moved, renamed or refactored. 
	 * 
	 * @parameter default-value="${basedir}/src/main/resources/js-class-loader.properties"
	 */
	private String configFile;
	
	/**
	 * A comma separated list of text files to parse for js class entries,
	 * each comma separated section can use full wildcards. Any class found
	 * will be used as a seed class of the dependency tree.
	 * 
	 * @parameter
	 */
	private String seedFiles;
	
	/**
	 * A comma separated list of fully qualified package.class names to use
	 * as seed classes for the dependency tree.
	 * 
	 * @parameter
	 */
	private String seedClasses;
	
	/**
	 * Location of the script sources 
	 * @parameter
	 */
	private String sourceFolders;
	
	/**
	 * Where to write the bundle
	 * @parameter
	 */
	private String bundleFile;
	
	/**
	 * Where to write the script tags file
	 * @parameter
	 */
	private String scriptTagsFile;
	
	/**
	 * Where each script tag src will be relative to
	 * @parameter
	 */
	private String scriptTagsBasePath;
	
	

	public void execute() throws MojoExecutionException {

		OutputStream out = null;
		try {

			Config config = new Config();
			System.out.println("Config path: " + configFile);
			if ((new File(configFile)).exists()) {
				config.loadPropertiesFromStream(new FileInputStream(configFile));
			}
			else {
				throw new MojoExecutionException("Can't find the config file in JS-Class-Loader plugin config: " + configFile);
			}
			
			System.out.println("Base path parameter: " + basePath);
			if (basePath != null) {
				config.setProperty(Config.PROP_BASE_FOLDER, basePath);
			}		
			if (seedFiles != null) {
				config.setProperty(Config.PROP_SEED_FILES, seedFiles);
			}
			if (seedClasses != null) {
				config.setProperty(Config.PROP_SEED_CLASSES, seedClasses);
			}
			if (sourceFolders != null) {
				config.setProperty(Config.PROP_SOURCE_FOLDERS, sourceFolders);
			}
			if (bundleFile != null) {
				config.setProperty(Config.PROP_BUNDLE_FILE, bundleFile);
			}
			if (scriptTagsFile != null) {
				config.setProperty(Config.PROP_SCRIPT_TAGS, scriptTagsFile);
			}
			if (scriptTagsBasePath != null) {
				config.setProperty(Config.PROP_SCRIPT_TAG_BASE_PATH, scriptTagsBasePath);
			}
			
			File outputFile = new File(
					config.getProperty(Config.PROP_BASE_FOLDER) + 
					File.separator + 
					config.getProperty(Config.PROP_BUNDLE_FILE));
			if (!outputFile.getParentFile().exists()) {
				outputFile.getParentFile().mkdirs();
			}

			out = new BufferedOutputStream(new FileOutputStream(outputFile));
			
			Bundler bundler = new Bundler(config);
			bundler.write(out);
			
			out.close();
			System.out.println();
			File scriptOutputFile = new File(
					config.getProperty(Config.PROP_BASE_FOLDER) + 
					File.separator + 
					config.getProperty(Config.PROP_SCRIPT_TAGS));
			
			if (!scriptOutputFile.getParentFile().exists()) {
				scriptOutputFile.getParentFile().mkdirs();
			}
			out = new BufferedOutputStream(new FileOutputStream(scriptOutputFile));
			
			bundler.writeScriptTags(out, config);
			
			out.close();

		} catch (FileNotFoundException e1) {
			throw new RuntimeException(e1);
		} catch (IOException e) {
			throw new MojoExecutionException(
					"Error creating js-class-loader bundle file: ", e);
		} finally {
			if (out != null) {
				try {
					out.close();
				} catch (IOException e) {
					// ignore
				}
			}
		}
	}
}
