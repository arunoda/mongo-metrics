function GraphModel(metrics, aggregators, resolution, timeLength) {

    var stopped = false;
    var initialRequest = true;
    var graph;

    var resolutionMillis;

    var resolutionsToMillis = {
        "five_secs": 1000 * 5,
        "minute": 1000 * 60,
        "hour": 1000 * 60 * 60,
        "day": 1000 * 60 * 60 * 24
    };

    var resolutionMillis = resolutionsToMillis[resolution.toString()];
    if(!resolutionMillis) {
        throw new Error('unsupported resolution type: ' + resolution);
    }

    timeLength = timeLength || resolutionMillis * 60; //we allowe 60 data points by default
    var maxDataPoints = Math.ceil(timeLength / resolutionMillis);

    function fetchMetricData() {

        var roundedDate = roundToNear(Date.now(), resolutionMillis);
        var from = roundedDate - 5 * (resolutionMillis);
        if(initialRequest) {
            from = roundedDate - (timeLength + resolutionMillis);
            initialRequest = false;
        }

        var until = roundedDate;

        var request = {
            metrics: metrics, 
            aggregators: aggregators, 
            resolution: resolution,
            from: from,
            until: until
        };

        $.post('/aggregate', request, function(data) {

            if(graph) {
                graph.update(data, until);
            }
        });

        if(!stopped) {
            setTimeout(fetchMetricData, resolutionMillis);
        }
    }

    this.draw = function draw(cssSelector, type, height) {
        
        graph = new Graph(type, cssSelector, metrics, maxDataPoints, resolutionMillis, {height: height});
        $(window).resize(graph.redraw);
        return this;
    };

    this.start = function start() {

        fetchMetricData();
        return this;
    };

    this.stop = function stop() {

        stopped = true;
        return this;
    };
}

function Graph(type, cssSelector, metrics, maxDataPoints, interval, options) {

    maxDataPoints = maxDataPoints || 10;
    var height = options.height || 150;
    
    var colorScheme = (type == 'line')? 'colorwheel': 'cool';
    var palette = new Rickshaw.Color.Palette( { scheme: colorScheme } );

    var series = [];
    var mappedArrays = {};
    metrics.forEach(function(metric) {

        var mArray = new MappedArray(maxDataPoints, interval/1000);

        mappedArrays[metric] = mArray;
        series.push({
            color: palette.color(),
            data: mArray.getArray(),
            name: metric
        });
    });
    
    var graph = new Rickshaw.Graph( {
        element: document.querySelector(cssSelector + ' .graph'),
        width: $(cssSelector + ' .graph').width(),
        height: height,
        renderer: type,
        series: series,
        stroke: true,
        interpolation: "linear"
    });

    graph.render();

    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph,
        xFormatter: function(x) {
            return new Date( x * 1000 ).toLocaleString();
        }
    });

    // var legend = new Rickshaw.Graph.Legend( {
    //  graph: graph,
    //  element: document.querySelector(cssSelector + ' .legend')
    // });

    // var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
    //  graph: graph,
    //  legend: legend
    // });

    var axesTime = new Rickshaw.Graph.Axis.Time( {
        graph: graph
    });
    axesTime.render();

    // var axesY = new Rickshaw.Graph.Axis.Y( {
    //  graph: graph
    // });
    // axesY.render();

    this.redraw = function() {

        graph.configure({
            width: $(cssSelector + ' .graph').width() - 10,
            height: $(cssSelector + ' .graph').height(),
        });
        graph.render();
    };

    this.update = function(newMetrics, until) {

        newMetrics.forEach(function(metricData) {

            var mappedArray = mappedArrays[metricData.key];
            if(mappedArray) {

                metricData.values.forEach(function(value) {

                    mappedArray.put(value[0] /1000, value[1]);
                });
            }
            
            mappedArray.update(Math.ceil(until/1000));
        });

        graph.render();
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

function MappedArray(size, interval) {

    this._array = [];
    this._size = size;
    this._interval = interval;
    this._map = {};
}

MappedArray.prototype.put = function(timestamp, value) {

    this._array.push(createPoint(timestamp, value));
};

MappedArray.prototype.getArray = function() {
    return this._array;
};

MappedArray.prototype.update = function(until) {
    
    var self = this;

    function sortFunction(a,b) {
        var diff =  a.x - b.x;
        if(diff == 0) {
            return a._added - b._added;
        } else {
            return diff;
        }
    }

    this._array.sort(sortFunction);
    this._removeDuplicatesAndFillGaps(false, until);
    this._padPoints(until);

};

MappedArray.prototype._removeDuplicatesAndFillGaps = function(inheritY, until) {
    
    var points = this._array;
    var interval = this._interval;

    //fill in the blanks
    var lc = 0;
    var lastPoint;
    while(points.length > lc) {

        var currPoint = points[lc];

        if(lastPoint) {
            var diff = currPoint.x - lastPoint.x;
            
            if(currPoint.x > until) {
                points.splice(lc, 1);
                lc--;
            } else if(diff == 0) { 
                points.splice(lc-1, 1);
                lc--;
            } else if(diff/interval > 1) {
                var noPointsToBeAdded = (diff/interval) -1;
                for(var i=0; i<noPointsToBeAdded; i++) {
                    var newPoint = createPoint(
                        lastPoint.x + ((i + 1) * interval),
                        (inheritY)? lastPoint.y: 0
                    );

                    points.splice((lc+ i) , 0, newPoint);
                }

                lastPoint = points[lc];
                lc += noPointsToBeAdded;
            }
        } 

        lastPoint = currPoint;
        lc++;
    }
};

MappedArray.prototype._padPoints = function(until) {
    
    var points = this._array;
    var interval = this._interval;
    var size = this._size;

    if(points.length == 0) {
        for(var lc=0; lc<size; lc++) {
            points.unshift(createPoint(
                until - (lc * interval), 0
            ));
        }
    } else {

        var lastPoint = points[points.length -1];
        var firstPoint = points[0];

        //add points to at the end, if points are missing at the end
        if(lastPoint.x < until) {
            var noOfPointsToAdd = (until - lastPoint.x) / interval;
            for(var lc=0; lc < noOfPointsToAdd; lc++) {
                points.push(createPoint(
                    lastPoint.x + ((lc +1) * interval),
                    0
                ));
            }
        }

        var sizeDiff = size - points.length;

        if(sizeDiff > 0) {
            //add points to the begining
            for(var lc=0; lc < sizeDiff; lc++) {
                
                points.unshift(createPoint(
                    firstPoint.x - ((lc +1) * interval),
                    0
                ));
            }
        } else {
            //remove points from the begining
            points.splice(0, -sizeDiff);
        }

    }
};


function roundToNear (value, roundVal) {

    return ((value - (value % roundVal)) / roundVal) * roundVal;
}

function createPoint(x, y) {
    return {
        x: x,
        y: y,
        _added: Date.now()
    }
}