package jsclassloader;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import jsclassloader.classes.ClassFileSet;
import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraph;

import com.milens3.utility.sourcemap.encoder.Mapping;
import com.milens3.utility.sourcemap.encoder.Position;
import com.milens3.utility.sourcemap.encoder.SourceMapEncoderV3;
import com.milens3.utility.sourcemap.encoder.SourceMapV3;

public class Bundler {
	
	private final static Logger LOG = Logger.getLogger("JS-Class-Loader");
	
	private List<ClassNode> classList;
	private Iterator<ClassNode> iterator;
	private ClassNode currentNode;
	private ClassFileSet classFileSet;
	private int contentLength;
	private Map<String, Boolean> addedClasses;
	private DependencyGraph dependencyGraph;
	private List<String> seedClassNameList;
	private List<Mapping> mappings;
	
	public List<ClassNode> getClassList() {
		return classList;
	}

	public Bundler(Config config) throws IOException {
		classList = new LinkedList<ClassNode>();

		this.dependencyGraph = new DependencyGraph(config);
		seedClassNameList = new ArrayList<String>();
		addedClasses = new HashMap<String, Boolean>();
		
		String propAllClasses = config.getProperty(Config.PROP_ALL_CLASSES);
		if (propAllClasses != null && propAllClasses.toLowerCase().equals("true")) {
			classFileSet = dependencyGraph.getClassFileSet();
			for (String className : classFileSet.getAllJsClasses()) {
				addNode(dependencyGraph.getNode(className), classList);
			}
		}
		else {

			String seedClassString = config.getProperty(Config.PROP_SEED_CLASSES);
			if (seedClassString != null) {
				String[] seedClasses = seedClassString.split(",");
				
				for (String className : seedClasses) {
					ClassNode node = dependencyGraph.getNode(className);
					if (node == null) {
						throw new RuntimeException(
								"Error, you have specified a seed class that doesn't exist or isn't in the correct file location: "
										+ className);
					}
					seedClassNameList.add(className);
					addNode(dependencyGraph.getNode(className), classList);
				}
			}
			if (config.getProperty(Config.PROP_SEED_FILES) != null) {
				try {
					List<String> seedFileClasses = dependencyGraph
							.getSeedClassesFromFiles(generateSeedFileList(config));

					for (String seedFileClass : seedFileClasses) {
						seedClassNameList.add(seedFileClass);
						addNode(dependencyGraph.getNode(seedFileClass), classList);
					}
				} catch (IOException e) {
					throw new RuntimeException("error parsing seed files: " + e);
				}
			}
		}
		
		iterator = classList.listIterator();
		classFileSet = dependencyGraph.getClassFileSet();

		
		contentLength = getSourceMappingUrlString(config).length();
		
		while (iterator.hasNext()) {
			File file = classFileSet.getFileFromClassname(iterator.next()
					.getValue());
			contentLength += file.length();
		}
	}

	public int getContentLength() {
		return contentLength;
	}
	
	public DependencyGraph getDependencyGraph() {
		return this.dependencyGraph;
	}
	
	public List<String> getSeedClassNameList() {
		return seedClassNameList;
	}

	private void addNode(ClassNode node, List<ClassNode> classList) {
		if (addedClasses.get(node.getValue()) == null) {

			// Depth first recurse adding static dependencies first:
			for (ClassNode child : node.getStaticDependencies()) {
				addNode(child, classList);
			}

			if (addedClasses.get(node.getValue()) == null) {
				classList.add(node);
				addedClasses.put(node.getValue(), true);
			}

			// then add runtime dependencies
			for (ClassNode child : node.getRunTimeDependencies()) {
				addNode(child, classList);
			}
		}
	}

	public void writeScriptTags(OutputStream out, Config config)
			throws IOException {

		String basePathString = config.getProperty(Config.PROP_SCRIPT_TAG_BASE_PATH);

		for (ClassNode item : getClassList()) {
			File file = dependencyGraph.getClassFileSet().getFileFromClassname(
					item.getValue());

			Path filePath = Paths.get(file.getAbsolutePath());

			/*
			 * Fix path string because java sees /. or \, as a folder and adds a
			 * .. to the relative path.
			 */
			String absoluteBasePath = new File(basePathString)
					.getCanonicalPath();
			/* ****************************************************************************************** */
			Path basePath = Paths.get(absoluteBasePath);
			
			LOG.info("Base: " + absoluteBasePath + ", path: " + file.getAbsolutePath());
			
			out.write(("<script type=\"text/javascript\" src=\""
					+ basePath.relativize(filePath) + "\"></script>\n")
					.getBytes());
		}

	}
	
	private String getSourceMappingUrlString(Config config) {
		return "//# sourceMappingURL=" + config.getProperty(Config.PROP_SOURCE_MAP_FILE) + "\n";
	}
	
	public List<Mapping> write(OutputStream out, Config config) throws IOException {
		MessageDigest md5 = null;
		iterator = classList.listIterator();
		try {
			md5 = MessageDigest.getInstance("MD5");
		}
		catch (NoSuchAlgorithmException nsae) {
			throw new RuntimeException("Java doesn't have MD5 hashing for some reason. JSCL needs it to create a unique id of the content. Aborting.");
		}
		
		mappings = new ArrayList<Mapping>();
		
		out.write(getSourceMappingUrlString(config).getBytes());
		
		int lineNumber = 2;
		while (iterator.hasNext()) {
			currentNode = iterator.next();
			File file = classFileSet.getFileFromClassname(currentNode
					.getValue());
			
			lineNumber = Bundler.copyLinesAndStripComments(file, out, md5, lineNumber, mappings, config);
		}
		
		String md5String = new BigInteger(1, md5.digest()).toString(16);
		
		out.write(("\n\nvar JSCL_UNIQUE_BUNDLE_HASH=" + "'" + md5String + "';\n\n").getBytes());
		
		return mappings;
	}

	private static final int DEFAULT_BUFFER_SIZE = 1024 * 4;

	/**
	 * Reads a File byte by byte and writes it to an OutputStream, stripping out comments.
	 * 
	 * @param inputFile
	 * @param output
	 * @param md5
	 * @param outputFileLineNumber
	 * @return
	 * @throws IOException
	 */
	public static int copyLinesAndStripComments(File inputFile, OutputStream output, MessageDigest md5, int outputFileLineNumber, List<Mapping> mappings, Config config) 
	       throws IOException {
		
		InputStream input = new FileInputStream(inputFile);
		
		String inputFileName = inputFile.getPath();
		
		boolean isInString = false;
		boolean isInSingleQuoteString = false;
		boolean isInDoubleQuoteString = false;
		boolean isInComment = false;
		boolean isInDoubleSlashComment = false;
		boolean wasInSlashStarComment = false;
		boolean isInSlashStarComment = false;

		byte prev = (byte)input.read();
		byte curr = (byte)input.read();
		
		int sourceFileLineNumber = 1;
		int sourceColumn = 1;
		int outputColumn = 1;
		
		while (true) {
			
			
			if (prev == '\n' || prev == -1) {
				if (!isInSlashStarComment) {
					mappings.add(new Mapping(inputFileName, new Position(sourceFileLineNumber, 0), new Position(outputFileLineNumber, 0)));
					if (prev == '\n') {
						outputFileLineNumber++;
					}
					outputColumn = 1;
				}
				sourceFileLineNumber++;
				sourceColumn = 1;
			}
			
			if (prev == -1) {
				break;
			}
			
			if (!isInComment) {
				if (isInString) {
					if (isInSingleQuoteString) {
						//if we're in a single quote string and the current 
						//is a newline or the current is an unescaped single quote, end string.
						if (curr == '\n' || (curr == '\'' && prev != '\\')) {
							isInSingleQuoteString = false;
							isInString = false;
						}
					}
					else if (isInDoubleQuoteString) {
						//if we're in a double quote string and the current 
						//is a newline or the current is an unescaped double quote, end string.
						if (curr == '\n' || (curr == '\"' && prev != '\\')) {
							isInDoubleQuoteString = false;
							isInString = false;
						}
					}
				}
				else {
					//If we're not in a string or comment and we are at an unescaped single quote, start
					//single quote string
					if (prev != '\\' && curr == '\'') {
						isInSingleQuoteString = true;
						isInString = true;
					}
					//If we're not in a string or comment and we at an unescaped double quote, start
					//double quote string
					else if (prev != '\\' && curr == '\"') {
						isInDoubleQuoteString = true;
						isInString = true;
					}
					//If we're not in a string or comment and we are at a double forward slash, start
					//double forward slash comment
					else if (prev == '/' && curr == '/') {
						isInDoubleSlashComment = true;
						isInComment = true;
					}
					//If we're not in a string or comment and we are at a forward slash and asterisk, start
					//a slash-star comment
					else if (prev == '/' && curr == '*') {
						isInSlashStarComment = true;
						isInComment = true;
					}
				}
				
				//if we weren't in a comment beforehand and we are still not after looking at the current char,
				//write the prev char to output:
				if (!isInComment && !wasInSlashStarComment) {
					output.write(prev);
					outputColumn++;
				}
				wasInSlashStarComment = false;
			}
			else {
				if (isInDoubleSlashComment) {
					//if we're in a double slash comment and the current 
					//is a newline then end comment
					if (curr == '\n') {
						isInDoubleSlashComment = false;
						isInComment = false;
					}
				}
				if (isInSlashStarComment) {
					//if we're in a slash star comment and the current and prev
					//are an asterisk and forward slash, end slash-star comment
					if (curr == '/' && prev == '*') {
						isInSlashStarComment = false;
						wasInSlashStarComment = true;
						isInComment = false;
					}
				}
			}
				
			prev = curr;
			curr = (byte)input.read();
			sourceColumn++;
		}
		
		output.write('\n');
		outputFileLineNumber++;
		
		input.close();
		
		return outputFileLineNumber;
	}

	public void writeSourceMap(OutputStream out, String bundleFileName) 
	        throws IOException {
		out.write(("{\n" 
		        + "\tversion: 3,\n"
		        + "\tfile: \"" + bundleFileName + "\",\n"
		        + "\tsourceRoot: \"\",\n").getBytes());
		        
		SourceMapEncoderV3 encoder = new SourceMapEncoderV3(mappings);
		SourceMapV3 map = encoder.encode();

		out.write(("\tsources: [").getBytes());
		
		List<String> sources = map.getSources();
		
		for (int i=0; i<sources.size(); i++) {
			out.write(("\"" + sources.get(i) + "\"").getBytes());
			if (i != sources.size() - 1) {
				out.write(", ".getBytes());
			}
		}
		
		out.write("],\n".getBytes());
		
		
		out.write(("\tmappings: \"").getBytes());
		out.write(map.getMappings().getBytes());
		out.write(("\"\n}\n").getBytes());
	}
	
	private List<File> generateSeedFileList(Config config) {
		List<File> seedFileList = new ArrayList<File>();

		String seedFileString = config.getProperty(Config.PROP_SEED_FILES);
		String basePath = config.getProperty(Config.PROP_BASE_FOLDER);

		com.esotericsoftware.wildcard.Paths paths;
		for (String path : seedFileString.split(",")) {
			paths = new com.esotericsoftware.wildcard.Paths();
			paths.glob(basePath, path);
			seedFileList.addAll(paths.getFiles());
		}

		return seedFileList;
	}

}