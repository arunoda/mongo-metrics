$(function() {
    // var gm = new GraphModel(['mp3'], { metric: 'avg', source: 'avg' }, 'five_secs', 1000* 60 * 5 );
    // gm.draw('#graph1').start();

    // var gm2 = new GraphModel(['mp3'], { metric: 'avg', source: 'avg' }, 'minute');
    // gm2.draw('#graph2').start();

    loadGraphsFromURL();

    $('#configure').click(configureGraphs);
});

function loadGraphsFromURL() {

    var matched = location.href.match(/#(.*)/);
    if(matched) {
        var query = {};
        matched[1].split('&').forEach(function(i){
            query[i.split('=')[0]]=i.split('=')[1];
        });

        if(query.title) {
            $('#title').val(query.title);
        }

        if(query.syntax) {
            $('#syntax').html(Base64.decode(query.syntax));
            $('#graphs-per-row').val(query.graphsPerRow || 2);
            $('#graph-height').val(query.graphHeight || 150);
            configureGraphs();
        }
    }
}

function configureGraphs() {

    var graphsPerRow = parseInt($('#graphs-per-row').val()) || 2;
    var graphHeight = parseInt($('#graph-height').val());
    var syntaxText = $('#syntax').val();
    var title = $('#title').val();

    //validations
    if(12 % graphsPerRow != 0 || graphsPerRow > 6 ) {
        return alert("Graphs per row only contain these values: \n\t1, 2, 3, 4, 6");
    }

    var lines = syntaxText.split('\n');

    var infoList = [];
    lines.forEach(function(line) {

        try{
            if(line.trim() == '') {
                infoList.push({type: 'blank'});
            } else {
                infoList.push({type: 'graph', data: parseGraphDef(line)});
            }
        } catch(ex) {
            alert(ex.message);
            throw ex;
        }
    });

    //creating dom
    $('#graphs').html('');

    for(var lc=0; lc<infoList.length; lc+=graphsPerRow) {
        var rowDiv = $($('#tmpl-row').text().trim());

        for(var i=0; i<graphsPerRow; i++) {
            var graphId = 'g' + (lc + i);
            var graphDiv = $($('#tmpl-graph').text().trim()).attr('id', graphId);
            var spanClass = 'span' + (12/graphsPerRow);
            graphDiv.addClass(spanClass);
            rowDiv.append(graphDiv);
        }

        $('#graphs').append(rowDiv);
    }

    //creating graphs
    infoList.forEach(function(info, index) {

        if(info.type == 'graph') {
            var graphDef = info.data;
            var graphId = '#g' + index;
            var graph = new GraphModel(graphDef.metrics.metrics, graphDef.metrics.aggegators, graphDef.metrics.resolution, graphDef.metrics.timeLength);
            graph.draw(graphId, graphDef.graph.type, graphHeight).start();

            $(graphId + ' h4').text(graphDef.graph.title);
        } else if(info.type == 'blank') {

        }
    });

    //configure title
    $('#heading h1').text(title);
    document.title = title;

    //create persistance url
    location.href = 
        "#syntax=" + Base64.encode(syntaxText) + 
        "&title=" + title +
        "&graphsPerRow=" + graphsPerRow + 
        "&graphHeight=" + graphHeight;

    $('#dialog-configure').modal('hide');
}

/*

title|stack|mp3,ogg|avg,sum|five_sec|time-length

*/

function parseGraphDef(line) {

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
                value: aggegators[0],
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

