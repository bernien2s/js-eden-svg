#!/usr/bin/env ruby
# Concatenates and serves all the required scripts for jseden.
puts "Content-type: text/css\n\n"

scripts = [
	"header.css",
	"jseden.css",
	"jquery-ui-1.8.16.flick.css",
	"eden.css",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end
