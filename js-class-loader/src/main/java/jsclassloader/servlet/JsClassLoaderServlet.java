package jsclassloader.servlet;

import java.io.File;
import java.io.IOException;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import jsclassloader.Bundler;
import jsclassloader.Config;


@SuppressWarnings("serial")
public class JsClassLoaderServlet extends HttpServlet {

	private String propFileName = "js-class-loader.properties";
	
	private Config config;
	
	private Bundler bundler;
	
	@Override
	public void init(ServletConfig servletConfig) throws ServletException {
		super.init(servletConfig);
		config = getConfig(servletConfig.getServletContext());
		try {
		bundler = new Bundler(config);
		}
		catch (IOException ioe) {
			throw new ServletException(ioe);
		}
	}
	
	@Override
	protected void doGet(final HttpServletRequest request, final HttpServletResponse response) {
		try {
			if (request.getContextPath().indexOf(".map") != -1) {
				bundler.writeSourceMap(response.getOutputStream());
			}
			else {
				response.setContentType("text/javascript");
				
				response.setContentLength(bundler.getContentLength());
				bundler.write(response.getOutputStream());
			}
			
		}
		catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	private Config getConfig(ServletContext context) throws ServletException {
		try {
			Config config = new Config(
				this.getClass().getClassLoader().getResourceAsStream(propFileName));
			
			String basePath = config.getProperty(Config.PROP_BASE_FOLDER);
			
			//Make sure all paths are relative to the context root:
			if (!new File(basePath).isAbsolute()) {
				String relativeBase = context.getRealPath("/" + basePath);
				config.setProperty(Config.PROP_BASE_FOLDER, relativeBase);
			}
			
			return config;
		}
		catch(IOException ioe) {
			throw new ServletException(
					"JSClassLoader servlet can't load properties file '" + propFileName + 
					"' from classpath\n" + 
					"message: " + ioe.getMessage());
		}
	}
}
