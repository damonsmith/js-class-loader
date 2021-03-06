package jsclassloader.classes;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import jsclassloader.Config;

import com.esotericsoftware.wildcard.Paths;

/**
 * Given a list of root folders this class will locate all js class files and
 * store them, converting their folder paths and file names into fully qualified
 * class names.
 */
public class ClassFileSet {

	private final static Logger LOG = Logger.getLogger("JS-Class-Loader");

	private Path basePath;
	private final List<File> rootDirs;
	private Map<String, File> classnameToFilelookup;
	private Map<String, String> classnameToSrcDirLookup;
	private Map<File, String> fileToClassnamelookup;
	private List<String> allJsClasses = new ArrayList<String>();

	public ClassFileSet(Config config) throws IOException {

		LOG.setLevel(Level.WARNING);
		basePath = java.nio.file.Paths.get(new File(config.getProperty(Config.PROP_BASE_FOLDER)).getCanonicalPath());

		classnameToFilelookup = new HashMap<String, File>();
		classnameToSrcDirLookup = new HashMap<String, String>();
		fileToClassnamelookup = new HashMap<File, String>();

		this.rootDirs = this.generateSourceFolderList(config);
		if (this.rootDirs.size() == 0) {
			throw new RuntimeException("Error, the source paths that you have provided don't match anything.\n"
					+ "base path: " + config.getProperty(Config.PROP_BASE_FOLDER) + "\n" + "source paths: "
					+ config.getProperty(Config.PROP_SOURCE_PATHS));
		}
		this.initialize();
	}

	public int size() {
		return allJsClasses.size();
	}

	public List<String> getAllJsClasses() {
		return allJsClasses;
	}

	public File getFileFromClassname(String classname) {
		return classnameToFilelookup.get(classname);
	}

	public String getSrcDirFromClassname(String classname) {
		return classnameToSrcDirLookup.get(classname);
	}

	public String getClassnameFromFile(File file) {
		return fileToClassnamelookup.get(file);
	}

	private void initialize() throws IOException {
		for (File rootDir : rootDirs) {
			LOG.info("Source path: " + rootDir.getAbsolutePath());
			int rootFilenameLength = rootDir.getAbsolutePath().length();

			Path srcRootPath = basePath.relativize(java.nio.file.Paths.get(rootDir.getCanonicalPath()));

			findJsFiles(rootDir, rootFilenameLength, srcRootPath.toString());
		}
		Collections.sort(allJsClasses);
	}

	private void findJsFiles(File directory, int rootFilenameLength, String rootDir) {

		File[] files = directory.listFiles();
		if (files == null) {
			return;
		}
		for (int i = 0; i < files.length; i++) {
			if (files[i].isDirectory()) {
				findJsFiles(files[i], rootFilenameLength, rootDir);
			}
			addClassFile(files[i], rootFilenameLength, rootDir);
		}
	}
	
	public void addClassFile(File file) {
		for (File dir : rootDirs) {
			String rootDirPath = dir.getAbsolutePath();
			
			//check if root dir contains file path by seeing if the file path contains the parent path
			if (file.getAbsolutePath().indexOf(rootDirPath) == 0) {
				addClassFile(file, rootDirPath.length(), rootDirPath);
			}
		}
	}

	private void addClassFile(File file, int rootFilenameLength, String rootDir) {
		if (file.getName().endsWith(".js")) {
			String classname = generateClassnameFromFile(file, rootFilenameLength);
			allJsClasses.add(classname);
			classnameToFilelookup.put(classname, file);
			classnameToSrcDirLookup.put(classname, rootDir);
			fileToClassnamelookup.put(file, classname);
		}
	}
	
	public boolean containsFile(File file) {
		return fileToClassnamelookup.get(file) != null;
	}
	
	public void removeClassFile(File file) {
		for (File dir : rootDirs) {
			String rootDirPath = dir.getAbsolutePath();
			
			//check if root dir contains file path by seeing if the file path contains the parent path
			if (file.getAbsolutePath().indexOf(rootDirPath) == 0) {
				removeClassFile(file, rootDirPath.length(), rootDirPath);
			}
		}
	}
	
	private void removeClassFile(File file, int rootFilenameLength, String rootDir) {
		if (file.getName().endsWith(".js") && fileToClassnamelookup.get(file) != null) {
			String classname = generateClassnameFromFile(file, rootFilenameLength);
			allJsClasses.remove(classname);
			classnameToFilelookup.remove(classname);
			classnameToSrcDirLookup.remove(classname);
			fileToClassnamelookup.remove(file);
		}
	}

	private String generateClassnameFromFile(File file, int rootFilenameLength) {
		String name = file.getAbsolutePath();
		int endPos = name.length() - 3;
		String relative = name.substring(rootFilenameLength + 1, endPos);
		String result = relative.replace(File.separatorChar, '.');
		return result;
	}

	private List<File> generateSourceFolderList(Config config) {
		Paths paths = new Paths();

		String sourcePaths = config.getProperty(Config.PROP_SOURCE_PATHS);
		String basePath = config.getProperty(Config.PROP_BASE_FOLDER);

		for (String path : sourcePaths.split(",")) {
			LOG.info("Source folder string: " + basePath + ", " + path);
			paths.glob(basePath, path);
		}
		return paths.dirsOnly().getFiles();
	}

	public List<File> getRootDirs() {
		return rootDirs;
	}
	
	
}
