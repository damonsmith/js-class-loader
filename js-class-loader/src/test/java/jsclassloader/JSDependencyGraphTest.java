package jsclassloader;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.IOException;
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
		config.setForceLoadRegex(forceLoadRegex);
		config.setImplementRegex(implementRegex);
		config.setExtendRegex(extendRegex);
		config.setStartOfWholeLineForceLoadRegex(startOfWholeLineForceLoadRegex);
		config.setWholeLineForceLoadRegex(wholeLineForceLoadRegex);
	}
	
	@After
	public void tearDown() 
	{
	}

	@Test
	public void testLoadNormalDependency() 
	{
		String[] roots = {"src/test/resources/dependency-tree"};
		DependencyGraph loader = createClassLoader(roots);
		
		assertTrue(loader.getNode("abra.cad.abra.Hat") != null);

		assertTrue(loader.getNode("abra.cad.abra.Hat").hasStaticDependency("something.else.Entirely"));
		assertFalse(loader.getNode("abra.cad.abra.Hat").hasRuntimeDependency("something.else.Entirely"));
		
		assertTrue(loader.getNode("abra.cad.abra.Hat").hasStaticDependency("abra.cad.abra.open.sesame.Genie"));
		assertFalse(loader.getNode("abra.cad.abra.Hat").hasRuntimeDependency("abra.cad.abra.open.sesame.Genie"));
		
		assertFalse(loader.getNode("abra.cad.abra.Hat").hasDependency("abra.cad.abra.Presto"));
	}

	@Test
	public void testLoadWholeLineDependency() { 
		
		String[] roots = {"src/test/resources/dependency-tree"};
		DependencyGraph loader = createClassLoader(roots);
		
		assertTrue(loader.getNode("ala.kazam.Zap").hasRuntimeDependency("abra.cad.abra.Presto"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("abra.cad.abra.Hey"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("abra.cad.abra.Hat"));
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("abra.cad.abra.Rabbit"));
		assertFalse(loader.getNode("ala.kazam.Zap").hasRuntimeDependency("ala.kazam.Souffle"));//There is no Souffle, Neo.
		assertTrue(loader.getNode("ala.kazam.Zap").hasStaticDependency("ala.kazam.Fizzle"));
	}

	private DependencyGraph createClassLoader(String[] rootFolders) {
		try {
		List<File> roots = new ArrayList<File>();
		for (String root: rootFolders) {
			roots.add(new File(root));
		}
		return new DependencyGraph(roots, config);
		}
		catch(IOException ioe) {
			throw new RuntimeException("error reading class files : " + ioe);
		}
	}
	
}