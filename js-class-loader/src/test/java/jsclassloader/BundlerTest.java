package jsclassloader;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

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

	private void checkMapping(List<Mapping> mappings, int mappingNum, int sourceLineNumber, int outputLineNumber, String expectedSourcePath) {
		Assert.assertEquals(sourceLineNumber, mappings.get(mappingNum).getSourcePosition().getLine());
		Assert.assertEquals(outputLineNumber, mappings.get(mappingNum).getMappedPosition().getLine());
		Assert.assertEquals(expectedSourcePath, mappings.get(mappingNum).getSourceFile());
	}
	
	
	
}
