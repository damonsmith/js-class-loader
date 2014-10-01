package jsclassloader;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

import org.junit.Assert;
import org.junit.Test;

import com.milens3.utility.sourcemap.encoder.Mapping;

public class BundlerTest {
	@Test
	public void testStripComments() throws Exception {
		
		Config config = new Config();
		
		File sourceFile = new File("src/test/resources/code-comments/test1-source-code.js");
		File expectedFile = new File("src/test/resources/code-comments/test1-expected-code.js");
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		MessageDigest md5 = MessageDigest.getInstance("MD5");
		
		List<Mapping> mappings = new ArrayList<Mapping>();
		
		Bundler.copyLinesAndStripComments(sourceFile, baos, md5, 1, mappings, config);
		
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
		
		File sourceFile = new File("src/test/resources/code-comments/test1-source-code.js");
		
		Config config = new Config();
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		MessageDigest md5 = MessageDigest.getInstance("MD5");
		
		List<Mapping> mappings = new ArrayList<Mapping>();
		
		int outputLineNumber = Bundler.copyLinesAndStripComments(sourceFile, baos, md5, 1, mappings, config);
		
		checkMapping(mappings, 0, 1,  1);
		checkMapping(mappings, 1, 2,  2);
		checkMapping(mappings, 2, 3,  3);
		checkMapping(mappings, 3, 4,  4);
		checkMapping(mappings, 4, 5,  5);
		checkMapping(mappings, 5, 12, 6);
		checkMapping(mappings, 6, 13, 7);
		checkMapping(mappings, 7, 14, 8);
		checkMapping(mappings, 8, 15, 9);
		checkMapping(mappings, 9, 16, 10);
		checkMapping(mappings, 10, 17, 11);
		checkMapping(mappings, 11, 18, 12);
		checkMapping(mappings, 12, 27, 13);
		checkMapping(mappings, 13, 28, 14);
		checkMapping(mappings, 14, 29, 15);
		checkMapping(mappings, 15, 30, 16);
		checkMapping(mappings, 16, 31, 17);
		checkMapping(mappings, 17, 32, 18);
		checkMapping(mappings, 18, 33, 19);
		checkMapping(mappings, 19, 34, 20);
		checkMapping(mappings, 20, 35, 21);
		
		Assert.assertEquals(22, outputLineNumber); 
	}

	private void checkMapping(List<Mapping> mappings, int mappingNum, int sourceLineNumber, int outputLineNumber) {
		Assert.assertEquals(sourceLineNumber, mappings.get(mappingNum).getSourcePosition().getLine());
		Assert.assertEquals(outputLineNumber, mappings.get(mappingNum).getMappedPosition().getLine());
	}
	
}
