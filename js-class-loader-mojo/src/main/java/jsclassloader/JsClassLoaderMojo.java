package jsclassloader;

/*
 * Copyright (c) 2012 Caplin Systems, http://www.caplin.com/
 * see README file for license.
 */

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

import jsclassloader.dependency.DependencyGraph;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.project.MavenProject;

/**
 * Goal which touches a timestamp file.
 *
 * @goal generate-js-bundle
 * @phase process-resources
 */
public class JsClassLoaderMojo
        extends AbstractMojo {
    /**
     * The folder where web application context resides useful for locating resources relative to servletContext .
     *
     * @parameter default-value="${basedir}/src/main/webapp/"
     */
    private File basePath;


    /**
     * @parameter default-value="${project}"
     */
    private MavenProject mavenProject;

    /**
     * Location of the file.
     *
     * @parameter expression="${project.build.directory}/${project.build.finalName}/js"
     */
    private File outputPath;

    /**
     * Location of the file.
     *
     * @parameter default-value="bundle.js"
     */
    private String outputFileName;

    public void execute()
            throws MojoExecutionException {
        File path = outputPath;

        if (!path.exists()) {
            path.mkdirs();
        }

        File bundleFile = new File(path, outputFileName);

        OutputStream out;
        try {
            out = new BufferedOutputStream(new FileOutputStream(bundleFile));
        } catch (FileNotFoundException e1) {
            throw new RuntimeException(e1);
        }

        try {
            Config jsClassLoaderConfig = new Config(
                    mavenProject.getProperties(),
                    basePath.getAbsolutePath());

            DependencyGraph dependencyGraph = new DependencyGraph(jsClassLoaderConfig.getSourceFolderList(), jsClassLoaderConfig);
            List<String> seedClasses = dependencyGraph.getSeedClassesFromFiles(jsClassLoaderConfig.getSeedFileList());

            Bundler bundler = new Bundler(seedClasses, dependencyGraph);
            bundler.write(out);
        } catch (IOException e) {
            throw new MojoExecutionException("Error creating file " + bundleFile, e);
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
