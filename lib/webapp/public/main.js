var g1 = new Graph('#graph1 svg');
var g2 = new Graph('#graph2 svg');

setInterval(function() {

	g1.update([{
		key: "CPU",
		values: [[Date.now(), Math.random() * 100]]
	}]);

	g2.update([{
		key: "RAM",
		values: [[Date.now(), Math.random() * 100]]
	}]);

}, 1000);

function Graph(cssSelector, maxDataPoints, timeFormat) {

	var metrics = [];

	maxDataPoints = maxDataPoints || 10;
	timeFormat = timeFormat || "%X";

	var chart = nv.models.stackedAreaChart()
					.x(function(d) { return d[0] })
					.y(function(d) { return d[1] })
					.clipEdge(true)
					.showControls(false)

	chart.xAxis
		.tickFormat(function(d) { return d3.time.format(timeFormat)(new Date(d)) });

	chart.yAxis
		.tickFormat(d3.format('f'));


	nv.addGraph(function() {

		d3.select(cssSelector)
			.datum(metrics)
			.transition().duration(100).call(chart);		
	});

	this.update = function(newMetrics) {

		console.log(metrics);

		newMetrics.forEach(function(metricData) {

			if(!findMetric(metricData.key)) {
				metrics.push(metricData);
			} else {
				var newValues = metricData.values;
				var oldValues = findMetric(metricData.key).values;

				//if the begining time of the newMetrics is same as the end of the metrics
				//then we simply update values
				if(newValues.length >0 && oldValues.length > 0) {
					if(newValues[0][0] == oldValues[oldValues.length -1][0]) {
						var value = newValues.shift();
						oldValues[oldValues.length -1][1] = value[1];
					}
				}

				newValues.forEach(function(value) {
					
					oldValues.push(value);
				});

				if(oldValues.length > maxDataPoints) {
					oldValues.splice(0, oldValues.length - maxDataPoints);
				}
				
			}
		});


		chart.update();
	};

	function findMetric(key) {

		for(var lc=0; lc<metrics.length; lc++) {
			if(metrics[lc].key == key) {
				return metrics[lc];
			}
		}

		return false;
	}
}
