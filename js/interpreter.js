function loadPreviousEdenCode(options) {
	options.editor.setValue(eden.previousHistory());
}

function loadNextEdenCode(options) {
	options.editor.setValue(eden.nextHistory());
}

function insertTag(options, value) {
    var code = document.getElementById("txtarea").value; 
    $("#txtarea").focus();
	options.editor.setValue(code + value);
}

function submitEdenCode(options) {
	var editor = options.editor;
	var edenparser = options.edenparser;
	try {
		var myvalue;
		eden.addHistory(editor.getValue());
		
		if (edenparser !== undefined) {
			//Parse special notation to eden
		} else {
			myvalue = editor.getValue();
		}
		
		eval(Eden.translateToJavaScript(myvalue));
		editor.setValue("");
		printAllUpdates();
	} catch (e) {
		var contents = $('#history-'+eden.history.length).html();
		$('#history-'+eden.history.length).attr('class','history-error').html('## '+contents);
		Eden.reportError(e);
	}
}

function closeInput(options) {
	var $dialog = options.$dialog;
	$dialog.dialog('close');
}

function openInput(options) {
	var $dialog = options.$dialog;

	$dialog.dialog('open');
	$(options.editor.getInputField()).focus();
}

function openObservablesAndAgents(options) {
	$('#symbol-search > .side-bar-topic-title').click();
	$('#observable-search').focus();
}

var KEYBINDINGS = {
	'alt+shift+i': closeInput,
	'alt+i': openInput,
	'alt+a': submitEdenCode,
	'alt+o': openObservablesAndAgents,
	'alt+p': loadPreviousEdenCode,
	'alt+n': loadNextEdenCode
};

function setupKeyBind(options, keyCombo, callback) {
	$(document).bind('keydown', keyCombo, function () {
		callback && callback(options);
	});
}

function setupAllKeyBinds(options) {
	for (var keyCombo in KEYBINDINGS) {
		setupKeyBind(options, keyCombo, KEYBINDINGS[keyCombo]);
	}
}

function make_interpreter(name, mtitle, edenparser) {
	var myeditor;

	$code_entry = $('<div id="'+name+'-input"><div></div><pre class="eden exec"></pre></div>');
	$dialog = $('<div id="'+name+'interpreter-window"></div>')
		.html($code_entry)
		.dialog({
			title: mtitle,
			width: 450,
			height: 240,
			minHeight: 120,
			minWidth: 230,
			position: ['right','bottom'],

			buttons: [
				{
					id: "btn-in",
					text: "Styles",
					click: function() {
						$( "#dialog" ).dialog();
						$("a").click(function () {
        					var selectbox = document.getElementsByName($(this).attr("id"));
							
							try {
								var item = selectbox[0].options[selectbox[0].selectedIndex].value;
        					} catch (err) {
        						console.log("you cannot do this...");
        					}
        					
        					if(item!=undefined) {
        						insertTag({editor: myeditor}, item);
        					}
    					});
						
						$('#svgcanvas').attr("currentScale", function() { return parseFloat(this.currentScale) + 0.50; });
						root.lookup('zoomLevel').assign($('#svgcanvas').attr("currentScale"));
					}
				},
				{
					id: "btn-out",
					text: "Export",
					click: function() {
						var svgfile = document.getElementById("svgcanvas");
						w = window.open('','Model State','width=400,height=400,scrollbars=no,toolbar=no,directories=no,status=no,resizable=yes');
						b = w.document.getElementsByTagName('body')[0];
						b.appendChild(svgfile);
						
						$('#svgcanvas').attr("currentScale", function() { return parseFloat(this.currentScale) - 0.50; });
						root.lookup('zoomLevel').assign($('#svgcanvas').attr("currentScale"));
					}
				},
				{
					id: "btn-submit",
					text: "Submit",
					click: function() {
						submitEdenCode({editor: myeditor});
					}
				},
				{
					text: "Previous",
					click: function() {
						loadPreviousEdenCode({editor: myeditor});
					}
				},
				{
					text: "Next",
					click: function() {
						loadNextEdenCode({editor: myeditor});
					}
				}
			]
		});
	input_dialog = $dialog;

	$("#btn-in").css("margin-left", "0px");
	$("#btn-out").css("margin-left", "0px");
	$("#btn-submit").css("margin-right", "30px");

	myeditor = convertToEdenPageNew('#'+name+'-input','code');

	setupAllKeyBinds({
		$dialog: $dialog,
		editor: myeditor,
		edenparser: edenparser
	});
}
