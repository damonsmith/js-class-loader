package jsclassloader;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.junit.Assert;
import org.junit.Test;

import com.milens3.utility.sourcemap.encoder.Mapping;

public class BundlerTest {
	
	@Test
	public void testBundleMapLocationStringInSameFolder() throws Exception {
		
		Config config = new Config();
		config.setProperty(Config.PROP_BUNDLE_FILE, "gen/bundle.js");
		config.setProperty(Config.PROP_SOURCE_MAP_FILE, "gen/bundle.js.map");
		
		String mapString = (new Bundler(config)).getSourceMappingUrlString();
		
		Assert.assertEquals("//# sourceMappingURL=bundle.js.map\n", mapString);
	}

	@Test
	public void testBundleMapLocationStringInDifferentFolders() throws Exception {
		
		Config config = new Config();
		config.setProperty(Config.PROP_BUNDLE_FILE, "gen/bundle.js");
		config.setProperty(Config.PROP_SOURCE_MAP_FILE, "out/files/bundle.js.map");
		
		String mapString = (new Bundler(config)).getSourceMappingUrlString();
		
		Assert.assertEquals("//# sourceMappingURL=../out/files/bundle.js.map\n", mapString);
	}
	
	@Test
	public void testBundleMapLocationStringInBaseFolder() throws Exception {
		
		Config config = new Config();
		config.setProperty(Config.PROP_BUNDLE_FILE, "bundle.js");
		config.setProperty(Config.PROP_SOURCE_MAP_FILE, "bundle.js.map");
		
		String mapString = (new Bundler(config)).getSourceMappingUrlString();
		
		Assert.assertEquals("//# sourceMappingURL=bundle.js.map\n", mapString);
	}

	
	@Test
	public void testStripComments() throws Exception {
		
		Config config = new Config();
		
		File sourceFile = new File("src/test/resources/code-comments/test1-source-code.js");
		File expectedFile = new File("src/test/resources/code-comments/test1-expected-code.js");
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		MessageDigest md5 = MessageDigest.getInstance("MD5");
		
		List<Mapping> mappings = new ArrayList<Mapping>();
		
		Bundler bundler = new Bundler(config);
		
		bundler.copyLinesAndStripComments(sourceFile, baos, md5, 1, mappings);
		
		InputStream input = new FileInputStream(expectedFile);
		
		try {
			byte[] outBytes = baos.toByteArray();
			
			int curr = input.read();
			int counter = 0;
			while(curr != -1) {
				if (curr != outBytes[counter]) {
					Assert.assertTrue("Comment stripping - output bytes must match expected bytes at byte number: " + counter, false);
				}
				
				curr = input.read();
				counter++;
			}
		}
		finally {
			input.close();
		}
	}
	
	@Test
	public void testGenerateMappings() throws Exception {
		
		Config config = new Config();
		config.setProperty(Config.PROP_BUNDLE_FILE, "gen/bundle.js");
		config.setProperty(Config.PROP_SOURCE_MAP_FILE, "gen/bundle.js.map");
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		MessageDigest md5 = MessageDigest.getInstance("MD5");
		
		List<Mapping> mappings = new ArrayList<Mapping>();
		
		Bundler bundler = new Bundler(config);
		
		File sourceFile = new File("src/test/resources/code-comments/test1-source-code.js");
		
		int outputLineNumber = bundler.copyLinesAndStripComments(sourceFile, baos, md5, 1, mappings);
		
		String expectedMappingSourcePath = "../src/test/resources/code-comments/test1-source-code.js";
		
		checkMapping(mappings, 0, 1,  1, expectedMappingSourcePath);
		checkMapping(mappings, 1, 2,  2, expectedMappingSourcePath);
		checkMapping(mappings, 2, 3,  3, expectedMappingSourcePath);
		checkMapping(mappings, 3, 4,  4, expectedMappingSourcePath);
		checkMapping(mappings, 4, 5,  5, expectedMappingSourcePath);
		checkMapping(mappings, 5, 12, 6, expectedMappingSourcePath);
		checkMapping(mappings, 6, 13, 7, expectedMappingSourcePath);
		checkMapping(mappings, 7, 14, 8, expectedMappingSourcePath);
		checkMapping(mappings, 8, 15, 9, expectedMappingSourcePath);
		checkMapping(mappings, 9, 16, 10, expectedMappingSourcePath);
		checkMapping(mappings, 10, 17, 11, expectedMappingSourcePath);
		checkMapping(mappings, 11, 18, 12, expectedMappingSourcePath);
		checkMapping(mappings, 12, 27, 13, expectedMappingSourcePath);
		checkMapping(mappings, 13, 28, 14, expectedMappingSourcePath);
		checkMapping(mappings, 14, 29, 15, expectedMappingSourcePath);
		checkMapping(mappings, 15, 30, 16, expectedMappingSourcePath);
		checkMapping(mappings, 16, 31, 17, expectedMappingSourcePath);
		checkMapping(mappings, 17, 32, 18, expectedMappingSourcePath);
		checkMapping(mappings, 18, 33, 19, expectedMappingSourcePath);
		checkMapping(mappings, 19, 34, 20, expectedMappingSourcePath);
		checkMapping(mappings, 20, 35, 21, expectedMappingSourcePath);
		
		Assert.assertEquals(22, outputLineNumber); 
	}
	
	@Test
	public void testGenerateMultiFileMappings() throws Exception {
		
		Config config = new Config();
		config.setProperty(Config.PROP_SOURCE_PATHS, "src/test/resources/sourcemap");
		config.setProperty(Config.PROP_SEED_CLASSES, "nsone.sourceOne");
		config.setProperty(Config.PROP_BUNDLE_FILE, "gen/bundle.js");
		config.setProperty(Config.PROP_SOURCE_MAP_FILE, "gen/bundle.js.map");
		
		Logger.getGlobal().setLevel(Level.FINE);
		
		Bundler bundler = new Bundler(config);
		
		File outfile = File.createTempFile("bundler-test","js");
		List<Mapping> mappings = bundler.write(new FileOutputStream(outfile));

		testListOfMappings(mappings, 
				new int[] {1, 3, 4, 5, 6, 7, 10, 11, 14, 15, 16, 1,  2,  3,  4,  5,  8,  9,  12}, 
				new int[] {2, 3, 4, 5, 6, 7, 8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20});
	}
	
	
	@Test
	public void testLargeSourceFiles() throws Exception {
		
		Config config = new Config();
		config.setProperty(Config.PROP_SOURCE_PATHS, "full/lib,full/script");
		config.setProperty(Config.PROP_SEED_CLASSES, "mite.base.Lang");
		config.setProperty(Config.PROP_SEED_FILES, "seedFiles=full/script/larrymite/game/*");
		config.setProperty(Config.PROP_BUNDLE_FILE, "gen/bundle.js");
		config.setProperty(Config.PROP_SOURCE_MAP_FILE, "gen/bundle.js.map");
		config.setProperty(Config.PROP_SCRIPT_TAGS, "gen/script-tag-list.html");
		config.setProperty(Config.PROP_BASE_FOLDER, "src/test/resources");
		
		Logger.getGlobal().setLevel(Level.FINE);
		
		Bundler bundler = new Bundler(config);
		
		File outfile = File.createTempFile("bundler-test","js");
		List<Mapping> mappings = bundler.write(new FileOutputStream(outfile));

		checkSourceAndTargetLines(mappings, 3, 5, "../src/test/resources/full/lib/mite/base/Lang.js");
		checkSourceAndTargetLines(mappings, 42, 1, "../src/test/resources/full/lib/box2d/b2Settings.js");
		checkSourceAndTargetLines(mappings, 94, 9, "../src/test/resources/full/lib/prototype/prototype.js");
		checkSourceAndTargetLines(mappings, 4312, 28, "../src/test/resources/full/lib/box2d/box2d.js");
		
		checkSourceAndTargetLines(mappings, 4999, 715, "../src/test/resources/full/lib/box2d/box2d.js");
		checkSourceAndTargetLines(mappings, 5996, 1712, "../src/test/resources/full/lib/box2d/box2d.js");
		checkSourceAndTargetLines(mappings, 13949, 9862, "../src/test/resources/full/lib/box2d/box2d.js");
		checkSourceAndTargetLines(mappings, 13978, 9891, "../src/test/resources/full/lib/box2d/box2d.js");
		checkSourceAndTargetLines(mappings, 13979, 9892, "../src/test/resources/full/lib/box2d/box2d.js");
		checkLineOfBundleMatches(outfile, "\tenableMotor: null});", 13978);
		checkLineOfBundleMatches(outfile, "second last line", 13979);
		checkLineOfBundleMatches(outfile, "last line//end of box2d.js", 13980);
		
		checkSourceAndTargetLines(mappings, 13981, 19, "../src/test/resources/full/lib/jssynth/Global.js");
		checkSourceAndTargetLines(mappings, 13982, 20, "../src/test/resources/full/lib/jssynth/Global.js");
		checkSourceAndTargetLines(mappings, 13983, 23, "../src/test/resources/full/lib/jssynth/Global.js");
		checkSourceAndTargetLines(mappings, 13984, 24, "../src/test/resources/full/lib/jssynth/Global.js");
		checkSourceAndTargetLines(mappings, 13985, 25, "../src/test/resources/full/lib/jssynth/Global.js");
		checkSourceAndTargetLines(mappings, 13988, 30, "../src/test/resources/full/lib/jssynth/Global.js");
		checkSourceAndTargetLines(mappings, 14050, 8, "../src/test/resources/full/lib/jssynth/Instrument.js");
	}
	
	private void checkLineOfBundleMatches(File outfile, String expected, int lineNumber) throws Exception {
		BufferedReader reader = new BufferedReader(new FileReader(outfile));
		for (int i=1; i<lineNumber; i++) {
			reader.readLine();
		}
		String actual = reader.readLine();
		Assert.assertEquals(expected, actual);
		reader.close();
	}
	
	
	private void checkSourceAndTargetLines(List<Mapping> mappings, int outputLineNumber, int sourceLineNumber, String sourceFile) {
		for (int i=0; i<mappings.size(); i++) {
			if (mappings.get(i).getMappedPosition().getLine() == outputLineNumber) {
				Assert.assertEquals(sourceLineNumber, mappings.get(i).getSourcePosition().getLine());
				Assert.assertEquals(sourceFile, mappings.get(i).getSourceFile());
				return;
			}
		}
		Assert.assertTrue("couldn't find line number in mapped file: " + outputLineNumber, false);
	}
	
	private void testListOfMappings(List<Mapping> mappings, int[] sourceLineNumbers, int[] outputLineNumbers) {
		for (int i=0; i<mappings.size(); i++) {
			Assert.assertEquals(sourceLineNumbers[i], mappings.get(i).getSourcePosition().getLine());
			Assert.assertEquals(outputLineNumbers[i], mappings.get(i).getMappedPosition().getLine());
		}
	}

	private void checkMapping(List<Mapping> mappings, int mappingNum, int sourceLineNumber, int outputLineNumber, String expectedSourcePath) {
		Assert.assertEquals(sourceLineNumber, mappings.get(mappingNum).getSourcePosition().getLine());
		Assert.assertEquals(outputLineNumber, mappings.get(mappingNum).getMappedPosition().getLine());
		Assert.assertEquals(expectedSourcePath, mappings.get(mappingNum).getSourceFile());
	}
}
