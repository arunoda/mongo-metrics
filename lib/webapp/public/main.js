$(function() {
	// var gm = new GraphModel(['mp3'], { metric: 'avg', source: 'avg' }, 'five_secs', 1000* 60 * 5 );
	// gm.draw('#graph1').start();

	// var gm2 = new GraphModel(['mp3'], { metric: 'avg', source: 'avg' }, 'minute');
	// gm2.draw('#graph2').start();

	loadGraphsFromURL();

	$('#configure').click(configureGraphs);
});

function loadGraphsFromURL() {

	var matched = location.href.match(/#syntax=(.*)/);
	if(matched) {
		var syntaxText = Base64.decode(matched[1]);
		$('#syntax').val(syntaxText);
		configureGraphs();
	}
}

function configureGraphs() {

	var syntaxText = $('#syntax').val();
	var lines = syntaxText.split('\n');

	var infoList = [];
	lines.forEach(function(line) {

		try{
			infoList.push(parseLine(line));
			$('#dialog-configure').modal('hide');
		} catch(ex) {
			alert(ex.message);
		}
	});

	//creating dom

	$('#graphs').html('');

	var graphsPerRow = 2;
	for(var lc=0; lc<infoList.length; lc+=graphsPerRow) {
		var rowDiv = $($('#tmpl-row').text().trim());

		for(var i=0; i<graphsPerRow; i++) {
			var graphId = 'g' + (lc + i);
			var graphDiv = $($('#tmpl-graph').text().trim()).attr('id', graphId);
			rowDiv.append(graphDiv);
		}

		$('#graphs').append(rowDiv);
	}

	//creating graphs
	infoList.forEach(function(info, index) {

		var graphId = '#g' + index;
		var graph = new GraphModel(info.metrics.metrics, info.metrics.aggegators, info.metrics.resolution, info.metrics.timeLength);
		graph.draw(graphId, info.graph.type).start();

		$(graphId + ' h4').text(info.graph.title);
	});

	//create persistance url
	location.href = "#syntax=" + Base64.encode(syntaxText);
}

/*

title|stack|mp3,ogg|avg,sum|five_sec|time-length

*/

function parseLine(line) {

	if(line) {
		var parts = line.split('|').map(trim);
		if(parts.length > 4) {
			var graphInfo = {};
			var metricsInfo = {};

			graphInfo.title = parts[0];
			graphInfo.type = parts[1];

			metricsInfo.metrics = parts[2].split(',').map(trim);
			if(metricsInfo.metrics.length == 0) {
				throw new Error("please specify one or more metrics");
			}

			var aggegators = parts[3].split(',').map(trim);
			if(aggegators.length < 2) {
				throw new Error("2 aggegators required. Syntax: `<metric-aggregator>, <source-aggregator>`")
			}
			metricsInfo.aggegators = {
				metric: aggegators[0],
				source: aggegators[1]
			};

			metricsInfo.resolution = parts[4];
			metricsInfo.timeLength = eval(parts[5]);

			return {
				metrics: metricsInfo,
				graph: graphInfo
			};

		} else {
			throw new Error("please check the syntax. Incorrect number of inputs");
		}
	}

	function trim(a) {
		return a.trim();
	}
}

