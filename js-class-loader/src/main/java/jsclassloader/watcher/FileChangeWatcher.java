package jsclassloader.watcher;

import static java.nio.file.LinkOption.NOFOLLOW_LINKS;
import static java.nio.file.StandardWatchEventKinds.ENTRY_CREATE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_DELETE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_MODIFY;
import static java.nio.file.StandardWatchEventKinds.OVERFLOW;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.WatchEvent;
import java.nio.file.WatchEvent.Kind;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.HashMap;
import java.util.Map;

import jsclassloader.Bundler;

public class FileChangeWatcher {

	private final WatchService watcher;
	private final Map<WatchKey, Path> keys;
	private Bundler bundler;
	private GraphUpdateListener listener;
	
	/**
	 * Creates a WatchService and registers the given directory
	 */
	public FileChangeWatcher(Bundler bundler) throws IOException {
		this.watcher = FileSystems.getDefault().newWatchService();
		this.keys = new HashMap<WatchKey, Path>();
		this.bundler = bundler;
	}
	
	@SuppressWarnings("unchecked")
	static <T> WatchEvent<T> cast(WatchEvent<?> event) {
		return (WatchEvent<T>) event;
	}

	/**
	 * Register the given directory with the WatchService
	 */
	private void register(Path dir) throws IOException {
		WatchKey key = dir.register(watcher, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);
		keys.put(key, dir);
	}

	/**
	 * Register the given directory, and all its sub-directories, with the
	 * WatchService.
	 */
	private void registerAll(final Path start) throws IOException {
		// register directory and sub-directories
		Files.walkFileTree(start, new SimpleFileVisitor<Path>() {
			@Override
			public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
				register(dir);
				return FileVisitResult.CONTINUE;
			}
		});
	}

	/**
	 * Process all events for keys queued to the watcher
	 */
	public void processEvents() {
		for (;;) {

			// wait for key to be signalled
			WatchKey key;
			try {
				key = watcher.take();
			} catch (InterruptedException x) {
				return;
			}

			Path dir = keys.get(key);
			if (dir == null) {
				System.err.println("WatchKey not recognized!!");
				continue;
			}

			for (WatchEvent<?> event : key.pollEvents()) {
				Kind<?> kind = event.kind();

				// TBD - provide example of how OVERFLOW event is handled
				if (kind == OVERFLOW) {
					continue;
					//regenerate everything
				}

				// Context for directory entry event is the file name of entry
				WatchEvent<Path> ev = cast(event);
				Path name = ev.context();
				Path child = dir.resolve(name);

				// print out event
				System.out.format("%s: %s\n", event.kind().name(), child);

				if (kind == ENTRY_MODIFY) {
					if (!Files.isDirectory(child, NOFOLLOW_LINKS)) {
						try {
							bundler.getDependencyGraph().updateFile(child.toFile());
							this.listener.graphUpdated();
						}
						catch (IOException ioe) {
							throw new RuntimeException(ioe);
						}
					}
				}
				else if (kind == ENTRY_DELETE) {
					if (Files.isDirectory(child, NOFOLLOW_LINKS)) {
						
					}
					else {
						bundler.getDependencyGraph().removeFile(child.toFile());
						this.listener.graphUpdated();
					}
				}
				
				// if directory is created, and watching recursively, then
				// register it and its sub-directories
				if (kind == ENTRY_CREATE) {
					try {
						if (Files.isDirectory(child, NOFOLLOW_LINKS)) {
							registerAll(child);
						}
						else {
							bundler.getDependencyGraph().addFile(child.toFile());
							this.listener.graphUpdated();
						}
					} catch (IOException x) {
						throw new RuntimeException(x);
					}
				}
			}
		}
	}

	static void usage() {
		System.err.println("usage: java Watcher dir");
		System.exit(-1);
	}
	
	public void addUpdateListener(GraphUpdateListener listener) {
		this.listener = listener;
	}

	public interface GraphUpdateListener {
		public void graphUpdated();
	}
	
}
