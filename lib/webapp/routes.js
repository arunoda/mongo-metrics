var util    = require('util');

module.exports = function(mongoMetrics, expressApp, options) {

    expressApp.get('/', function(req, res) {
        res.render('home.ejs', {title: options.title});
    });

    expressApp.post('/aggregate', function(req, res) {

        var options = req.body;
        var query = { date: {} };
        var responseSent = false;

        var response = [];

        options.aggregators = options.aggregators || {};
        options.aggregators.value = options.aggregators.value || "avg";
        options.aggregators.source = options.aggregators.source || "sum";
        options.resolution = options.resolution || "hour";

        if(options.from) {
            query.date['$gte'] = parseInt(options.from);
        }

        if(options.until) {
            query.date['$lt'] = parseInt(options.until);
        }

        if(options.metrics) {
            options.metrics.forEach(function(metric) {

                mongoMetrics.aggregate(
                    metric, options.resolution, options.aggregators.value, 
                    options.aggregators.source, query, handleResult(metric))
            });
        } else {
            res.send({});
        }

        function handleResult(metric) {

            return function(err, metrics) {

                if(err) {
                    sendError(err);
                } else {
                    response.push({
                        key: metric,
                        values: transformMetrics(metrics)
                    });

                    if(response.length == options.metrics.length) {
                        res.send(response);
                    }
                }
            };
        }

        function sendError(err) {

            if(!responseSent) {
                res.send({error: err.toString()});
                responseSent = true;
            }
        };

    });
};


function transformMetrics(input) {

    var output = [];
    input.forEach(function(metric) {

        metric._id.h = metric._id.h || 0;
        metric._id.m = metric._id.m || 0;
        metric._id.s5 = metric._id.s5 || 0;
        
        var dateString = util.format("%d %d %d %d:%d:%d UTC", metric._id.y, 
            metric._id.mo + 1, metric._id.d, metric._id.h, metric._id.m, metric._id.s5);

        output.push([new Date(dateString).getTime(), metric.value]);
    });

    return output;
}