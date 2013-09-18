package jsclassloader;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.List;

import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraph;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class JsBundleReaderTest
{
	private String forceLoadRegex = ".*force\\.load\\s*\\(.*";
	private String implementRegex = ".*imp\\.lements\\s*\\(.*";
	private String extendRegex = ".*ext\\.ends\\s*\\(.*";
	private String startOfWholeLineForceLoadRegex = ".*inc\\.lude\\s*\\(.*";
	private String wholeLineForceLoadRegex = ".*inc\\.lude\\s*\\(.*,\\s*true\\s*\\).*";
	
	Config config;
	DependencyGraph depGraph;
	Bundler bundler;
	List<String> seedClasses;
	
	@Before
	public void setUp() {
		
		config = new Config();
		config.setProperty(Config.PROP_FORCE, forceLoadRegex);
		config.setProperty(Config.PROP_IMPLEMENT, implementRegex);
		config.setProperty(Config.PROP_EXTEND, extendRegex);
		config.setProperty(Config.PROP_START_FORCE, startOfWholeLineForceLoadRegex);
		config.setProperty(Config.PROP_WHOLE_FORCE, wholeLineForceLoadRegex);
		
		config.setProperty(Config.PROP_SOURCE_FOLDERS, "src/test/resources/dependency-tree");
	}

	@After
	public void tearDown() 
	{
	}

	@Test
	public void testClassWithNoDependencies()  throws Exception
	{	
		config.setProperty(Config.PROP_SEED_CLASSES, "abra.cad.abra.Presto");
		List<ClassNode> bundle = new Bundler(config).getClassList();
		
		assertTrue(bundle.size() == 1);
		assertEquals(bundle.get(0).getValue(), "abra.cad.abra.Presto");
	}
	
	@Test
	public void testRuntimeDependentClass()  throws Exception
	{
		config.setProperty(Config.PROP_SEED_CLASSES, "abra.cad.abra.open.sesame.Lamp");
		
		List<ClassNode> bundle = new Bundler(config).getClassList();
		assertTrue(bundle.size() == 2);
		assertEquals(bundle.get(0).getValue(), "abra.cad.abra.open.sesame.Lamp");
		assertEquals(bundle.get(1).getValue(), "abra.cad.abra.Rabbit");
	}
	
	@Test
	public void testDependencyList() throws Exception
	{
		config.setProperty(Config.PROP_SEED_CLASSES, "abra.cad.abra.Hat");
		
		Bundler reader = new Bundler(config);
		List<ClassNode> bundle = reader.getClassList();
		
		assertEquals(bundle.get(0).getValue(), "abra.cad.abra.open.sesame.Genie");
		assertEquals(bundle.get(1).getValue(), "abra.cad.abra.open.sesame.Lamp");
		assertEquals(bundle.get(2).getValue(), "abra.cad.abra.Rabbit");
		assertEquals(bundle.get(3).getValue(), "something.else.Entirely");
		assertEquals(bundle.get(4).getValue(), "abra.cad.abra.Hey");
		assertEquals(bundle.get(5).getValue(), "abra.cad.abra.Hat");
	}

}