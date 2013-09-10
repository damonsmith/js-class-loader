package jsclassloader;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import com.esotericsoftware.wildcard.Paths;

public class Config {
	
	private String implementRegex;
	private String extendRegex;
	private String forceLoadRegex;

	private String startOfWholeLineForceLoadRegex;
	private String wholeLineForceLoadRegex;

	private String sourceFolders;
	private String seedFiles;
	
	private String baseFolder;
	
	private List<File> sourceFolderList;
	private List<File> seedFileList;
	
	private List<String> seedClassList;
	
	public Config() {
	}
	
	public Config(Properties properties, String baseFolder) throws IOException {
		this.baseFolder = baseFolder;
		implementRegex = properties.getProperty("implement.regex");
		extendRegex = properties.getProperty("extend.regex");
		forceLoadRegex = properties.getProperty("force.load.regex");

		startOfWholeLineForceLoadRegex = properties.getProperty("start.of.whole.line.force.load.regex");
		wholeLineForceLoadRegex = properties.getProperty("whole.line.force.load.regex");

		sourceFolders = properties.getProperty("source.folders");
		seedFiles = properties.getProperty("seed.files");
		
		generateSeedFileList();
		generateSourceFolderList();
		
	}
	
	public Config(InputStream propertyStream, String baseFolder) throws IOException {
		this(loadProperties(propertyStream), baseFolder);
	}

	private static Properties loadProperties(InputStream propertyStream){
		try {
			Properties properties = new Properties();
			properties.load(propertyStream);
			return properties;
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	private void generateSeedFileList() {
		seedFileList = new ArrayList<File>();
		
		String fileList = this.getSeedFiles();
		Paths paths;
		for (String path : fileList.split(",")) {
			paths = new Paths();
			paths.glob(baseFolder, path);
			seedFileList.addAll(paths.getFiles());
		}
	}
	
	private void generateSourceFolderList() {
		Paths paths = new Paths();
		for (String path : getSourceFolders().split(",")) {
			paths.glob(this.baseFolder, path);
		}
		sourceFolderList = paths.dirsOnly().getFiles();
	}
	
	public List<File> getSourceFolderList() {
		if (sourceFolderList == null) {
			generateSourceFolderList();
		}
		return sourceFolderList;
	}
		
	public List<File> getSeedFileList() {
		if (seedFileList == null) {
			generateSeedFileList();
		}
		return seedFileList;
	}
	
	public String getImplementRegex() {
		return implementRegex;
	}

	public void setImplementRegex(String implementRegex) {
		this.implementRegex = implementRegex;
	}


	public String getExtendRegex() {
		return extendRegex;
	}


	public void setExtendRegex(String extendRegex) {
		this.extendRegex = extendRegex;
	}


	public String getForceLoadRegex() {
		return forceLoadRegex;
	}


	public void setForceLoadRegex(String forceLoadRegex) {
		this.forceLoadRegex = forceLoadRegex;
	}


	public String getStartOfWholeLineForceLoadRegex() {
		return startOfWholeLineForceLoadRegex;
	}


	public void setStartOfWholeLineForceLoadRegex(String startPartialForceLoadRegex) {
		this.startOfWholeLineForceLoadRegex = startPartialForceLoadRegex;
	}

	
	public String getWholeLineForceLoadRegex() {
		return wholeLineForceLoadRegex;
	}

	
	public void setWholeLineForceLoadRegex(String endPartialForceLoadRegex) {
		this.wholeLineForceLoadRegex = endPartialForceLoadRegex;
	}


	public String getSourceFolders() {
		return sourceFolders;
	}


	public void setSourceFolders(String sourceFolders) {
		this.sourceFolders = sourceFolders;
		this.generateSourceFolderList();
	}

	public String getSeedFiles() {
		return seedFiles;
	}

	public void setSeedFiles(String seedFiles) {
		this.seedFiles = seedFiles;
		this.generateSeedFileList();
	}
	
	public void setBaseFolder(String baseFolder) {
		this.baseFolder = baseFolder;
	}
	
	public List<String> getSeedClassList() {
		return seedClassList;
	}

	public void setSeedClassList(List<String> seedClassList) {
		this.seedClassList = seedClassList;
	}
}
