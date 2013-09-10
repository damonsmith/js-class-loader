package jsclassloader.servlet;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import jsclassloader.Bundler;
import jsclassloader.Config;
import jsclassloader.dependency.DependencyGraph;


@SuppressWarnings("serial")
public class JsClassLoaderServlet extends HttpServlet {

	private Config jsClassLoaderConfig;
	private String propFileName = "js-class-loader.properties";
	
	@Override
	public void init(final ServletConfig config) throws ServletException {
		super.init(config);
		try {
			jsClassLoaderConfig = new Config(
				this.getClass().getClassLoader().getResourceAsStream(propFileName),
				config.getServletContext().getRealPath("."));
		}
		catch(IOException ioe) {
			throw new ServletException(
					"JSClassLoader servlet can't load properties file '" + propFileName + 
					"' from classpath\n" + 
					"message: " + ioe.getMessage());
		}
	}
	@Override
	protected void doGet(final HttpServletRequest request, final HttpServletResponse response) {
		try {
			DependencyGraph dependencyGraph = new DependencyGraph(jsClassLoaderConfig.getSourceFolderList(), jsClassLoaderConfig);
			List<String> seedClasses = dependencyGraph.getSeedClassesFromFiles(jsClassLoaderConfig.getSeedFileList());
			
			
			Bundler bundler = new Bundler(seedClasses, dependencyGraph);
			response.setContentType("text/javascript");
			
			response.setContentLength(bundler.getContentLength());
			bundler.write(response.getOutputStream());
		}
		catch (Exception e) {
			e.printStackTrace();
		}
	}
}
