js-class-loader
===============

(Java) Builds a dependency list for large javascript projects, generates lists and bundles for dev and production. Fast.


JS-Class-Loader is a java tool for managing large javascript codebases. It is not a generic tool like WRO4J or RequireJS
that can be used on any codebase given a few modifications. This tool requires your source files to be organised in the
Java style, where folders match package names and filenames match class names. If your code is organised this way then
JS-Class-Loader will detect dependencies without you having to declare them at all, bundle your code or generate script
tags for development, and also provide diagnostics like dependency dot files and graphs.

JS-Class-Loader works as either a command line tool, a Maven Mojo or a Servlet. The default config would be to use the 
Servlet for dev and the generated static file for test and production installations.


Getting started
---------------

The simplest case on the command line:
java -jar js-class-loader.jar --seed-file Main.js --output-file bundle.js

This will use Main.js as the seed file, the current folder as the only source folder and generate a bundle of everything
that is required for Main.js.

The way that it works is that it first finds all js files in the current source tree. It then matches package and class 
usages in source files to find runtime dependencies. It also parses any use of the extend function to track parse-time
dependencies and make sure they are loaded into the bundle before the subclass that requires them.


Comparison with other tools
---------------------------

RequireJS is a popular tool for doing this sort of thing. Reasons why this project still exists and isn't
considered superceded by requireJS:

RequireJS needs nodejs or rhino to run and takes a loooong time to generate bundles. Even running from nodejs the docs
talk about taking 12 seconds to generate a bundle. JS-Class-Loader is so fast that you can hit save on a js file, hit reload on your
browser and a few milliseconds later the bundle will be regenerated and served to the page.

Of course with RequireJS you can lazy load your files in dev mode and have it traverse your dependency tree that way.
For large codebases that becomes less and less practical, meaning you will get developers excited at first at how everything
just works via magic and then more and more frustrated as the project goes on and the dev cycle gets slower and slower.
This tool provides a solution where - if you can organise your files in a standard Java-like way - then this tool can 
do all the dependency management, dev tooling and development bundling for you very quickly.

WRO4J also bundles javascript and other web assets and is generally very useful. It does not however provide anything
to manage dependencies. It is fine if you have no parse-time dependencies and you just want to bundle everything, but 
if that is not the case then you will end up doing a lot of manual handling of your javascript.




