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
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
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
	private Config config;
	private boolean isGeneratingSourceMap;
	
	public List<ClassNode> getClassList() {
		return classList;
	}

	public Bundler(Config config) throws IOException {
		classList = new LinkedList<ClassNode>();
		this.config = config;
		isGeneratingSourceMap = (config.getProperty(Config.PROP_SOURCE_MAP_FILE) != null);

		this.dependencyGraph = new DependencyGraph(config);
		seedClassNameList = new ArrayList<String>();
		addedClasses = new HashMap<String, Boolean>();
		
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
		
		iterator = classList.listIterator();
		classFileSet = dependencyGraph.getClassFileSet();

		
		contentLength = 35;//getSourceMappingUrlString().length();
		
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

			// Depth first recurse adding static dependencies first in alphabetical order:
			ArrayList<ClassNode> staticDependencies = new ArrayList<ClassNode>(node.getStaticDependencies());
			Collections.sort(staticDependencies);
			
			for (ClassNode child : staticDependencies) {
				addNode(child, classList);
			}
			
			if (addedClasses.get(node.getValue()) == null) {
				classList.add(node);
				addedClasses.put(node.getValue(), true);
			}
			
			// Depth first recurse adding runtime dependencies first in alphabetical order:
			ArrayList<ClassNode> runtimeDependencies = new ArrayList<ClassNode>(node.getRunTimeDependencies());
			Collections.sort(runtimeDependencies);

			// then add runtime dependencies
			for (ClassNode child : runtimeDependencies) {
				addNode(child, classList);
			}
		}
	}

	public void writeScriptTags(OutputStream out)
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

	public String getSourceMappingUrlString() {
		
		File bundleFile = new File(config.getProperty(Config.PROP_BUNDLE_FILE)).getAbsoluteFile();
		File sourceMapFile = new File(config.getProperty(Config.PROP_SOURCE_MAP_FILE)).getAbsoluteFile();
		Path pathBase = Paths.get(bundleFile.getParent());
		return "//# sourceMappingURL=" + pathBase.relativize(Paths.get(sourceMapFile.getPath())) + "\n";
	}
	
	public List<Mapping> write(OutputStream out) throws IOException {
		MessageDigest md5 = null;
		iterator = classList.listIterator();
		try {
			md5 = MessageDigest.getInstance("MD5");
		}
		catch (NoSuchAlgorithmException nsae) {
			throw new RuntimeException("Unexpected error: Your version of Java doesn't have MD5 hashing capability. JSCL needs it to create a unique id of the content. Aborting.");
		}
		
		mappings = new ArrayList<Mapping>();
		
		if (isGeneratingSourceMap) {
			out.write(getSourceMappingUrlString().getBytes());
		}
		
		int lineNumber = 2;
		while (iterator.hasNext()) {
			currentNode = iterator.next();
			File file = classFileSet.getFileFromClassname(currentNode
					.getValue());
			
			lineNumber = copyLinesAndStripComments(file, out, md5, lineNumber, mappings);
		}
		
		String md5String = new BigInteger(1, md5.digest()).toString(16);
		
		out.write(("\n\nvar JSCL_UNIQUE_BUNDLE_HASH=" + "'" + md5String + "';\n\n").getBytes());
		
		return mappings;
	}

	/**
	 * Reads a File byte by byte and writes it to an OutputStream, stripping out comments.
	 * 
	 * @param inputFile the input javascript file to comment strip and write to output
	 * @param sourcemapPath this is used to build relative paths in the sourcemap, as each file entry in the sourcemap must be relative to it.
	 * @param output comment-stripped js source is written to this output stream
	 * @param md5 this md5 is updated with the stripped code
	 * @param outputFileLineNumber this is the running total number of lines in the bundle so far, each call to this ad
	 * @return
	 * @throws IOException
	 */
	public int copyLinesAndStripComments(File inputFile, OutputStream output, MessageDigest md5, int outputFileLineNumber, List<Mapping> mappings) 
	       throws IOException {
		
		LOG.log(Level.INFO, "writing file: " + inputFile.getPath() + " at line: " + outputFileLineNumber);
		
		InputStream input = new FileInputStream(inputFile);
		//Get the path to the input file relative to the folder that the source map is in.
		String sourceMapFolderPath = null;
        Path inputFilePath = null;
        Path pathBase = null;
        Path pathRelative = null;
		
        if (isGeneratingSourceMap) {
        	//Get the path to the input file relative to the folder that the source map is in.
    		sourceMapFolderPath = new File(config.getProperty(Config.PROP_SOURCE_MAP_FILE)).getAbsoluteFile().getParentFile().getAbsolutePath();
            inputFilePath = Paths.get(inputFile.getAbsolutePath());
            pathBase = Paths.get(sourceMapFolderPath);
            pathRelative = pathBase.relativize(inputFilePath);
        }
        
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
		
		StringBuilder line = new StringBuilder();
		StringBuilder total = new StringBuilder();
		while (true) {
			if (prev == 13 && curr == 13) {
				sourceFileLineNumber++;
				outputFileLineNumber++;
			}
			if (prev >= -1 && prev < 128) {
				if (prev != '\n') {
					line.append((char)prev);
				}
				if (prev == '\n' || prev == -1) {
					if (!isInSlashStarComment) {
						if (isGeneratingSourceMap) {
							//System.out.println(sourceFileLineNumber + " : " + outputFileLineNumber + " - " + line);
							total.append(line);
							line = new StringBuilder();
							mappings.add(new Mapping(pathRelative.toString(), new Position(sourceFileLineNumber, 0), new Position(outputFileLineNumber, 0)));
						}
						if (prev == '\n') {
							outputFileLineNumber++;
						}
					}
					sourceFileLineNumber++;
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
					if (!isInComment && !wasInSlashStarComment && prev != -1) {
						output.write(prev);
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
			}

			if (prev == -1) {
				break;
			}
			prev = curr;
			curr = (byte)input.read();
		}
		
		output.write((new String("//end of " + inputFile.getName() + "\n")).getBytes());
		outputFileLineNumber++;
		
		
		input.close();
		
		return outputFileLineNumber;
	}

	public void writeSourceMap(OutputStream out) 
	        throws IOException {
		
		String bundleFileName = config.getProperty(Config.PROP_BUNDLE_FILE);
		
		out.write(("{\n" 
		        + "\t\"version\": 3,\n"
		        + "\t\"file\": \"" + bundleFileName + "\",\n"
		        + "\t\"sourceRoot\": \"\",\n").getBytes());
		        
		SourceMapEncoderV3 encoder = new SourceMapEncoderV3(mappings);
		SourceMapV3 map = encoder.encode();

		out.write(("\t\"sources\": [").getBytes());
		
		List<String> sources = map.getSources();
		
		for (int i=0; i<sources.size(); i++) {
			out.write(("\"" + sources.get(i) + "\"").getBytes());
			if (i != sources.size() - 1) {
				out.write(", ".getBytes());
			}
		}
		
		out.write("],\n".getBytes());
		
		
		out.write(("\t\"mappings\": \"").getBytes());
		out.write(map.getMappings().getBytes());
		out.write(("\"\n}\n").getBytes());
		
	}
	
	private List<File> generateSeedFileList(Config config) {
		List<File> seedFileList = new ArrayList<File>();

		String seedFileString = config.getProperty(Config.PROP_SEED_FILES);
		String basePath = config.getProperty(Config.PROP_BASE_FOLDER);

		com.esotericsoftware.wildcard.Paths paths;
		for (String path : seedFileString.split(",")) {
			paths = new com.esotericsoftware.wildcard.Paths(basePath);
			paths.glob(path);
			seedFileList.addAll(paths.getFiles());
		}
		if (seedFileList.isEmpty()) {
			throw new RuntimeException("Error, your seed file config matches no seed files. Seed files are configured as: [" + 
			          config.getProperty(Config.PROP_SEED_FILES) + "], " + 
					" and the base path is: [" + config.getProperty(Config.PROP_BASE_FOLDER) + "]" + 
			        " which maps to: " + (new File(config.getProperty(Config.PROP_BASE_FOLDER))).getAbsolutePath());
		}

		return seedFileList;
	}

}