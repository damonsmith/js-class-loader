package jsclassloader;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.List;

import jsclassloader.dependency.ClassNode;
import jsclassloader.dependency.DependencyGraph;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class JsBundleReaderTest {
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

		config.setProperty(Config.PROP_SOURCE_PATHS, "src/test/resources/dependency-tree");
	}

	@After
	public void tearDown() {
	}

	@Test
	public void testClassWithNoDependencies() throws Exception {
		config.setProperty(Config.PROP_SEED_CLASSES, "abra.cad.abra.Presto");
		List<ClassNode> bundle = new Bundler(config).getClassList();

		assertTrue(bundle.size() == 1);
		assertEquals("abra.cad.abra.Presto", bundle.get(0).getValue());
	}

	@Test
	public void testRuntimeDependentClass() throws Exception {
		config.setProperty(Config.PROP_SEED_CLASSES, "abra.cad.abra.open.sesame.Lamp");

		List<ClassNode> bundle = new Bundler(config).getClassList();
		assertTrue(bundle.size() == 2);
		assertEquals("abra.cad.abra.open.sesame.Lamp", bundle.get(0).getValue());
		assertEquals("abra.cad.abra.Rabbit",           bundle.get(1).getValue());
	}

	@Test
	public void testDependencyList() throws Exception {
		config.setProperty(Config.PROP_SEED_CLASSES, "abra.cad.abra.Hat");

		Bundler reader = new Bundler(config);
		List<ClassNode> bundle = reader.getClassList();

		assertEquals("abra.cad.abra.open.sesame.Genie", bundle.get(0).getValue());
		assertEquals("abra.cad.abra.open.sesame.Lamp",  bundle.get(1).getValue());
		assertEquals("abra.cad.abra.Rabbit",            bundle.get(2).getValue());
		assertEquals("something.else.Entirely",         bundle.get(3).getValue());
		assertEquals("abra.cad.abra.Hey",               bundle.get(4).getValue());
		assertEquals("abra.cad.abra.Hat",               bundle.get(5).getValue());
	}

	@Test
	public void testAllClassesList() throws Exception {
		config.setProperty(Config.PROP_ALL_CLASSES, "true");
		
		Bundler reader = new Bundler(config);
		List<ClassNode> bundle = reader.getClassList();

		assertEquals("abra.cad.abra.open.sesame.Genie", bundle.get(0).getValue());
		assertEquals("abra.cad.abra.open.sesame.Lamp",  bundle.get(1).getValue());
		assertEquals("abra.cad.abra.Rabbit",            bundle.get(2).getValue());
		assertEquals("something.else.Entirely",         bundle.get(3).getValue());
		assertEquals("abra.cad.abra.Hey",               bundle.get(4).getValue());
		assertEquals("abra.cad.abra.Hat",               bundle.get(5).getValue());
		assertEquals("abra.cad.abra.Presto",            bundle.get(6).getValue());
		assertEquals("ala.kazam.Fizzle",                bundle.get(7).getValue());
		assertEquals("ala.kazam.Zap",                   bundle.get(8).getValue());
		assertEquals("ala.kazam.smoke.Mirrors",         bundle.get(9).getValue());
	}

}