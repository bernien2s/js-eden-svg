/**
 * XXX: currently this is used as a constructor
 * possibly just want a namespace for EDEN related functions
 */
function Eden(context) {
	this.context = context || new Folder();
	this.storage_script_key = "script";
	this.history = new Array();
	this.index = 0;
	this.errornumber = 0;
}

modelbase = "";


Eden.prototype.addHistory = function(data) {
	this.history.push(data);
	this.index = this.history.length;
}

Eden.prototype.getHistory = function(index) {
	if (this.history.length == 0) {
		return "";
	} else {
		return this.history[index];
	}
}

Eden.prototype.previousHistory = function() {
	if (this.index <= 0) {
		this.index = 1;
	}
	if (this.index > this.history.length) {
		this.index = this.history.length;
	}
	return this.getHistory(--this.index);
};

Eden.prototype.nextHistory = function() {
	if (this.index < 0) {
		this.index = 0;
	}
	if (this.index >= this.history.length-1) {
		this.index++;
		return "";
	}
	return this.getHistory(++this.index);
};

Eden.formatError = function (e, options) {
	options = options || {};
	return "<div class=\"error-item\">"+
		"## ERROR number " + eden.errornumber + ":<br>"+
		(options.path ? "## " + options.path + "<br>" : "")+
		e.message+
		"</div>\r\n\r\n";
};

Eden.reportError = function (e, options) {
	$('#error-window')
		.addClass('ui-state-error')
		.prepend(Eden.formatError(e, options))
		.dialog({title:"EDEN Errors"});
	eden.errornumber = eden.errornumber + 1;
};

/*
 * synchronously loads an EDEN file from the server,
 * translates it to JavaScript then evals it when it's done
 */
Eden.executeFile = function (path) {
	$.ajax({
		url: modelbase+path,
		dataType: 'text',
		success: function(data) {
			try {
				eval(Eden.translateToJavaScript(data));
			} catch (e) {
				Eden.reportError(e, {path: path});
			}
		},
		cache: false,
		async: false
	});
};

/*
 * Wraps a parser generated by jison so that it has access to some functions useful
 * in parsing
 *
 * @param {function} parser generated by jison takes a string
 */
Eden.parserWithInitialisation = function parserWithInitialisation(parser) {
	return function(source) {
		source = source.replace(/\r\n/g, '\n');
		var in_definition = false;
		var dependencies = {};

		var original_input = source;

		parser.yy.extractEdenDefinition = function(first_line, first_column, last_line, last_column) {
			var definition_lines = original_input.split('\n').slice(first_line - 1, last_line);
			var definition = "";

			for (var i = 0; i < definition_lines.length; ++i) {
				var line = definition_lines[i];

				if (i === 0) {
					var start = first_column;
				} else {
					var start = 0;
				}

				if (i === definition_lines.length - 1) {
					var end = last_column;
				} else {
					var end = line.length;
				}

				definition += line.slice(start, end);

				if (i < definition_lines.length - 1) {
					definition += "\n";
				}
			}

			return definition;
		}

		parser.yy.enterDefinition = function() {
			dependencies = {};
			in_definition = true;
		};

		parser.yy.leaveDefinition = function() {
			in_definition = false;
		};

		parser.yy.inDefinition = function() {
			return in_definition;
		};

		parser.yy.addDependency = function(name) {
			dependencies[name] = 1;
		};

		parser.yy.getDependencies = function() {
			var dependency_list = [];
			for (p in dependencies) {
				dependency_list.push(p);
			}
			return dependency_list;
		};

		var observables = {};
		var dobservables = {};
		var varnum = 0;

		parser.yy.observable = function(name) {
			observables[name] = 1;
			return "o_" + name;
		}

		parser.yy.dobservable = function(f) {
			varnum = varnum + 1;
			//dobservables[Number(varnum).toString()] = f;
			return "var d_" + Number(varnum).toString() + " = context.lookup(" + f + "); d_" + Number(varnum).toString();
		}

		parser.yy.printObservableDeclarations = function() {
			var javascript_declarations = [];
			for (var observable_name in observables) {
				javascript_declarations.push("var o_" + observable_name + " = context.lookup('" + observable_name + "');");
			}

			//for (var dobservable_name in dobservables) {
			//	javascript_declarations.push("var d_" + dobservable_name + " = context.lookup(" + dobservables[dobservable_name] + ");");
			//}

			return javascript_declarations.join("\n");
		}

		parser.yy.locals = [];
		parser.yy.paras = [];

		return parser.parse(source);
	};
};

/*
 * This is the entry point for eden to JS translation, which attaches some of the
 * necessary functions/initial state to the translator before running it
 */
// XXX: require.js for loading eden/parser.js
Eden.translateToJavaScript = Eden.parserWithInitialisation(parser);

Eden.prototype.getDefinition = function(name, symbol) {
	if (symbol.eden_definition) {
		return symbol.eden_definition + ";";
	} else {
		return name + " = " + symbol.cached_value + ";";
	}
};

/*
 * XXX: all this stuff currently isn't used, just represents
 * some hacking for persisting model state I did. monk
 */
Eden.prototype.getSerializedState = function() {
	var script = "";
	for (var name in this.context.symbols) {
		script += this.getDefinition(name, this.context.symbols[name]) + "\n";
	}
	return script;
};

Eden.prototype.saveLocalModelState = function() {
	var state_string = this.getSerializedState(this.context);
	localStorage[this.storage_script_key] = state_string;
};

Eden.prototype.loadLocalModelState = function() {
	var stored_script = localStorage[this.storage_script_key];
	if (stored_script != undefined) {
		eval(Eden.translateToJavaScript(stored_script));
	} else {
		console.log("tried to load local model state but there was nothing stored!");
	}
};

Eden.prototype.pushModelState = function() {
	var uploader_url = 'push-state.php';
	var state_string = this.getSerializedState(this.context);
	$.ajax(uploader_url, {
		type: 'POST',
		data: {
			state: state_string
		},
		timeout: 2000,
		success: function(data) {
			console.log("SUCCESSFULLY PUSHED MODEL", data);
		},
		error: function(request, status, error) {
			if (status === "timeout") {
				console.log("whoops, POST timed out");
			} else {
				console.log("something went wrong submitting a question (other than timeout): status " + status);
			}
		}
	});
};
