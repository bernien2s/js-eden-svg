#!/usr/bin/ruby
# Concatenates and serves all the required scripts for jseden.
puts "Content-type: application/x-javascript\n\n"

scripts = [
	"lib/jquery.color.js",
	"lib/jquery.hotkeys.js",
	"lib/json2.js",

	"runtime.js",
	"dummyconsole.js",
	"test.js",
	"maintainer.js",
	"eden/parser.js",
	"eden.js",
	"edenui.js",
	"models.js",
	"collections.js",
	"interpreter.js",
	"em.js",
	"edenpage.js",

	"sylvester.js",
	"raphael-min.js",
	"dracula_graffle.js",
	"dracula_graph.js",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end
