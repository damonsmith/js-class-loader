package jsclassloader;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import jsclassloader.dependency.DependencyGraph;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class DependencyGraphTest
{
	private String extendRegex = ".*ext\\.ends\\s*\\(.*";
	
	Config config;
	
	@Before
	public void setUp() {
		config = new Config();
		config.setProperty(Config.PROP_EXTEND, extendRegex);
	}
	
	@After
	public void tearDown() {
	}

	@Test
	public void testLoadNormalDependency()  throws Exception {
		config.setProperty(Config.PROP_SOURCE_PATHS, "src/test/resources/dependency-tree");
		
		DependencyGraph loader = new DependencyGraph(config);
		
		assertTrue(loader.getNode("abra.cad.abra.Hat") != null);

		assertTrue(loader.getNode("abra.cad.abra.Hat").hasStaticDependency("something.else.Entirely"));
		assertFalse(loader.getNode("abra.cad.abra.Hat").hasRuntimeDependency("something.else.Entirely"));
		
		assertTrue(loader.getNode("abra.cad.abra.Hat").hasStaticDependency("abra.cad.abra.open.sesame.Genie"));
		assertFalse(loader.getNode("abra.cad.abra.Hat").hasRuntimeDependency("abra.cad.abra.open.sesame.Genie"));
		
		assertFalse(loader.getNode("abra.cad.abra.Hat").hasDependency("abra.cad.abra.Presto"));
	}

	@Test
	public void testDependencyGraphDotOutput() throws Exception { 
		
		config.setProperty(Config.PROP_SOURCE_PATHS, "src/test/resources/dependency-tree");

		List<String> classNames = new ArrayList<String>();
		classNames.add("ala.kazam.Zap");
	}
	
	
}