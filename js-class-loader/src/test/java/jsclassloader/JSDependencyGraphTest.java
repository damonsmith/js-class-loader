package jsclassloader;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import jsclassloader.dependency.DependencyGraph;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class JSDependencyGraphTest
{
	private String forceLoadRegex = ".*force\\.load\\s*\\(.*";
	private String implementRegex = ".*imp\\.lements\\s*\\(.*";
	private String extendRegex = ".*ext\\.ends\\s*\\(.*";
	private String startOfWholeLineForceLoadRegex = ".*inc\\.lude\\s*\\(.*";
	private String wholeLineForceLoadRegex = ".*inc\\.lude\\s*\\(.*,\\s*true\\s*\\).*";
	
	Config config;
	
	@Before
	public void setUp() {
		config = new Config();
		config.setProperty(Config.PROP_FORCE, forceLoadRegex);
		config.setProperty(Config.PROP_IMPLEMENT, implementRegex);
		config.setProperty(Config.PROP_EXTEND, extendRegex);
		config.setProperty(Config.PROP_START_FORCE, startOfWholeLineForceLoadRegex);
		config.setProperty(Config.PROP_WHOLE_FORCE, wholeLineForceLoadRegex);
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
	public void testLoadWholeLineDependency() throws Exception { 
		
		config.setProperty(Config.PROP_SOURCE_PATHS, "src/test/resources/dependency-tree");
		DependencyGraph loader = new DependencyGraph(config);
		
		assertTrue(loader.getNode("ala.kazam.Zap").hasRuntimeDependency("abra.cad.abra.Presto"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("abra.cad.abra.Hey"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("abra.cad.abra.Hat"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("abra.cad.abra.Rabbit"));
		assertFalse(loader.getNode("ala.kazam.Zap").hasRuntimeDependency("ala.kazam.Souffle"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("ala.kazam.Fizzle"));
	}
	
	@Test
	public void testDependencyGraphDotOutput() throws Exception { 
		
		config.setProperty(Config.PROP_SOURCE_PATHS, "src/test/resources/dependency-tree");

		List<String> classNames = new ArrayList<String>();
		classNames.add("ala.kazam.Zap");
	}
	
	
}