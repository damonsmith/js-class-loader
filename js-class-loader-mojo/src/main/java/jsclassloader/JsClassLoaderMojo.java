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
	 * Location of the config file.
	 * 
	 * @parameter default-value="${project.build.outputDirectory}/js-class-loader.properties"
	 */
	private String configFile;
	
	/**
	 * Location of the script sources:
	 * 
	 * @parameter
	 */
	private String scriptSources;
	
	/**
	 * Where to write the bundle (relative to target/${finalName}):
	 * 
	 * @parameter
	 */
	private String bundleFile;
	
	/**
	 * Where to write the script tags file (relative to target/${finalName}):
	 * 
	 * @parameter
	 */
	private String scriptTagsFile;
	

	public void execute() throws MojoExecutionException {

		OutputStream out = null;
		try {

			Config config = new Config();
			System.out.println("Config path: " + configFile);
			if ((new File(configFile)).exists()) {
				config.loadPropertiesFromStream(new FileInputStream(configFile));
			}
			
			
			File outputFile = new File(
					config.getProperty(Config.PROP_BUNDLE_FILE));
			if (!outputFile.getParentFile().exists()) {
				outputFile.getParentFile().mkdirs();
			}

			out = new BufferedOutputStream(new FileOutputStream(outputFile));
			
			Bundler bundler = new Bundler(config);
			bundler.write(out);
			
			out.close();
			
			File scriptOutputFile = new File(
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
