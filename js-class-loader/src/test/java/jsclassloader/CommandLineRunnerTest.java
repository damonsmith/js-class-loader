package jsclassloader;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.util.Arrays;
import java.util.List;

import jsclassloader.cli.CommandLineRunner;

import org.junit.Assert;
import org.junit.Test;

public class CommandLineRunnerTest {

	@Test
	public void testListAllClasses() throws Exception {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		String args = "--list --allClasses --sourcePaths=src/test/resources/dependency-tree";
		
		CommandLineRunner.execute(args.split(" "), new PrintStream(out));
		
		List<String> lines = Arrays.asList(out.toString().split("\n"));
		
		List<String> expected = Arrays.asList(new String[]{
				"abra.cad.abra.open.sesame.Lamp", 
				"abra.cad.abra.Rabbit",
				"abra.cad.abra.open.sesame.Genie", 
				"abra.cad.abra.Presto", 
				"something.else.Entirely", 
				"abra.cad.abra.Hey",
				"abra.cad.abra.Hat", 
				"ala.kazam.Fizzle", 
				"ala.kazam.Zap",
				"ala.kazam.smoke.Mirrors"});
		
		Assert.assertTrue("Listed classes must contain all classes in source tree", lines.containsAll(expected));
		Assert.assertEquals("There must be the same number of listed classes as in the source tree", expected.size(), lines.size());
	}

	public void testAllClassesListOrder() throws Exception {

		ByteArrayOutputStream out = new ByteArrayOutputStream();
		String args = "--list --allClasses --sourcePaths=src/test/resources/dependency-tree";
		
		CommandLineRunner.execute(args.split(" "), new PrintStream(out));
		
		List<String> lines = Arrays.asList(out.toString().split("\n"));

		Assert.assertTrue(
				"Hat has a parse-time dependency on Genie, so Genie must appear before it", 
				appearsBefore(lines, "abra.cad.abra.open.sesame.Genie", "abra.cad.abra.Hat"));
		
		Assert.assertTrue(
				"Zap has a parse-time dependency on Fizzle, so Fizzle must appear before it",
				appearsBefore(lines, "ala.kazam.Zap", "ala.kazam.Fizzle"));
		
	}
	
	@Test
	public void testAllClassesInMixedMultiModule() throws Exception {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		String args = "--list --basePath=src/test/resources/multimodule --config=src/test/resources/multimodule/js-class-loader-multi.properties";
		
		CommandLineRunner.execute(args.split(" "), new PrintStream(out));
		
		List<String> lines = Arrays.asList(out.toString().split("\n"));

		List<String> expected = Arrays.asList(new String[]{
				"larrymite.svg.SVGToBox2D",
				"larrymite.effect.ParticleFire",
				"larrymite.scenario.Scenario",
				"larrymite.scenario.event.ZoomAndScrollEventHandler",
				"larrymite.box2d.WorldRenderer",
				"larrymite.box2d.WorldRunner",
				"larrymite.app.Base",
				"larrymite.app.event.AppEventAdapter",
				"larrymite.app.Util",
				"larrymite.audio.Audio",
				"larrymite.scenario.Trebuchet",
				"larrymite.scenario.RocketLander",
				"larrymite.scenario.Drums",
				"jssynth.Sample",
				"jssynth.Global",
				"jssynth.Mixer",
				"jssynth.webkitAudioContextMonkeyPatch",
				"jssynth.WebAudioOutput",
				"jssynth.player.Effects",
				"jssynth.player.NoteData",
				"jssynth.player.AmigaLowPassFilter",
				"jssynth.player.MODPlayer",
				"jssynth.player.S3MLoader",
				"jssynth.player.MODLoader",
				"jssynth.Instrument"
		});
		
		Assert.assertTrue("Listed classes must contain all classes in source tree", lines.containsAll(expected));
		Assert.assertEquals("There must be the same number of listed classes as in the source tree", expected.size(), lines.size());
	}
	
	@Test
	public void testAllMultiModuleClassesListOrder() throws Exception {
		
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		String args = "--list --basePath=src/test/resources/multimodule --config=src/test/resources/multimodule/js-class-loader-multi.properties";
		
		CommandLineRunner.execute(args.split(" "), new PrintStream(out));
		
		List<String> lines = Arrays.asList(out.toString().split("\n"));

		Assert.assertTrue(
				"RocketLander extends Scenario so must appear after:", 
				appearsBefore(lines, "larrymite.scenario.Scenario", "larrymite.scenario.RocketLander"));
		
		Assert.assertTrue(
				"Trebuchet extends Scenario so must appear after:", 
				appearsBefore(lines, "larrymite.scenario.Trebuchet", "larrymite.scenario.RocketLander"));
		
	}
	
	
	private boolean appearsBefore(List<String> items, String before, String after) throws Exception {
		boolean beforeFound = false;
				
		for (String item : items) {
			if (item.equals(after)) {
				if (beforeFound) {
					return true;
				}
				else {
					return false;
				}
			}
			if (item.equals(before)) {
				beforeFound = true;
			}
		}
		throw new Exception("Either or both items were not found in the list");
	}
	
}
