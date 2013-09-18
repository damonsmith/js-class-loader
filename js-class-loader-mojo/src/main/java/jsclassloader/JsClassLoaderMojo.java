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
import java.util.Properties;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.project.MavenProject;

/**
 * @goal generate-js-bundle
 * @phase process-resources
 */
public class JsClassLoaderMojo extends AbstractMojo {

	/**
	 * @parameter default-value="${project}"
	 */
	private MavenProject mavenProject;

	/**
	 * Location of the config file.
	 * 
	 * @parameter expression="${project.build.directory}/classes/js-class-loader.properties"
	 */
	private File configPath;

	public void execute() throws MojoExecutionException {

		OutputStream out = null;
		try {

			Properties properties = new Properties();
			properties.load(new FileInputStream(configPath));
			
			Config config = new Config(mavenProject.getProperties());

			File outputFile = new File(
					config.getProperty(Config.PROP_BUNDLE_FILE));
			if (!outputFile.getParentFile().exists()) {
				outputFile.getParentFile().mkdirs();
			}

			out = new BufferedOutputStream(new FileOutputStream(outputFile));

			Bundler bundler = new Bundler(config);
			bundler.write(out);

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
