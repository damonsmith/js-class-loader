package jsclassloader;

import java.io.IOException;
import java.io.InputStream;
import java.util.Enumeration;
import java.util.Properties;

/**
 * This class just wraps a Properties object and holds some key names.
 */
public class Config {

	public static final String PROP_BASE_FOLDER = "basePath";
	public static final String PROP_SOURCE_FOLDERS = "sourceFolders";
	
	public static final String PROP_SEED_FILES = "seedFiles";
	public static final String PROP_SEED_CLASSES = "seedClasses";
	
	public static final String PROP_IMPLEMENT = "regex.implement";
	public static final String PROP_EXTEND = "regex.extend";
	public static final String PROP_FORCE = "regex.force";
	public static final String PROP_START_FORCE = "regex.start.force";
	public static final String PROP_WHOLE_FORCE = "regex.whole.force";
	
	public static final String PROP_BUNDLE_FILE = "bundleFile";
	public static final String PROP_SCRIPT_TAGS = "scriptTagsFile";
	public static final String PROP_GRAPH_FILE = "graphFile";
	public static final String PROP_SCRIPT_TAG_BASE_PATH = "scriptTagsBasePath";
	
	public Properties properties;
	
	private static final String DEFAULT_PROPS_FILE = "js-class-loader-default.properties";
	
	/**
	 * Create a new config with the default settings
	 * 
	 * @throws IOException
	 */
	public Config() {
		try {
			properties = new Properties();
			properties.load(getClass().getClassLoader().getResourceAsStream(DEFAULT_PROPS_FILE));
		}
		catch (IOException e) {
			throw new RuntimeException("Default settings properties file not found for JS-Class-Loader."
					+ "It should be in the classpath and called " + DEFAULT_PROPS_FILE);
		}
	}

	/**
	 * Overwrite the default properties file with anything in the provided properties.
	 * 
	 * @param newProps
	 * @throws IOException
	 */
	public Config(Properties newProps) throws IOException {
		this();
		this.loadProperties(newProps);
	}
	
	/**
	 * Overwrite the default properties file with anything in the provided properties input stream.
	 * 
	 * @param newProps
	 * @throws IOException
	 */
	public Config(InputStream in) throws IOException {
		this();
		this.loadPropertiesFromStream(in);
	}
	
	public void loadProperties(Properties newProps) throws IOException {
		Enumeration<Object> em = newProps.keys();
		while (em.hasMoreElements()) {
			String key = (String)em.nextElement();
			properties.setProperty(key, newProps.getProperty(key));
		}
	}
	public void loadPropertiesFromStream(InputStream in) throws IOException {
		properties.load(in);
	}
	
	public String getProperty(String name) {
		return (String)properties.get(name);
	}
	
	public void setProperty(String name, String value) {
		properties.setProperty(name, value);
	}
}
