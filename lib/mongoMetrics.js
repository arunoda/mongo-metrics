var qbox    = require('qbox');
var mongo   = require('mongodb');

function MongoMetrics (mongoUrl, collection) {
    
    collection = collection || 'metrics';

    var mongoDatabase = qbox.create(); 
    mongo.MongoClient.connect(mongoUrl, function(err, db) {

        if(err) {
            throw err;
        }

        mongoDatabase.db = db;
        mongoDatabase.start();

        db.on('error', function(err) {
            console.error('mongodb error: ' + err.toString());
        });
    });

    this.track = function track(name, value, source, date, callback) {

        if((typeof date) == 'function') {
            callback = date;
            date = null;
        }
        date = date || new Date();

        var metric = {
            name: name, 
            value: value,
            source: source,
            date: date.getTime(),
            resolution: getResolution(date)
        };

        mongoDatabase.ready(function() {

            if(callback) {
                mongoDatabase.db.collection(collection).insert(metric, callback);
            } else {
                mongoDatabase.db.collection(collection).insert(metric, {w: 0});
            }
        });
    };

    /*
        Aggregate metrics

        @param {String} name - name of the metric
        @param {Constant} resolution - resolution type
            possible values: "DAY", "HOUR", "MINUTE", "FIVE_SECS"
        @param {String} valueAggregator - aggregation function to be used for aggregating metric of the each source
            possible values: "sum", "avg", "min", "max"
        @param {String} sourceAggregator - aggregation function to be used for the aggregating sources(value from metricsAggregation)
            possible values: "sum", "avg", "min", "max"
        @param {Object} query - mongodb query for filtering out metrics
            only supports date and source only
        @param {Function} callback - callback function
            callback(err, results)
    */
    this.aggregate = function aggregate(name, resolution, valueAggregator, sourceAggregator, query, callback) {

        if(typeof(query) == 'function') {
            callback = query;
            query = {};
        }

        if(!MongoMetrics.RESOLUTION[resolution]) {
            return callback(new Error("invalid resolution"));
        }

        if(!MongoMetrics.AGGREGATORS[valueAggregator]) {
            return callback(new Error("valueAggregator is not supported"));
        }

        if(!MongoMetrics.AGGREGATORS[sourceAggregator]) {
            return callback(new Error("sourceAggregator is not supported"));
        }

        var filter = { name: name };
        ['date', 'source'].forEach(function(field) {

            if(query[field]) {
                filter[field] = query[field];
            }
        });

        var aggreation = [
            {$match: filter},
            {$group: this._generateValueGrouping(resolution, valueAggregator)},
            {$group: this._generateSourceGrouping(sourceAggregator)},
            {$sort: {"_id.y": 1, "_id.mo": 1, "_id.d": 1, "_id.h": 1, "_id.m": 1, "_id.s": 1}}
        ];

        mongoDatabase.ready(function() {

            mongoDatabase.db.collection(collection).aggregate(aggreation, callback);
        });

    };

    this._generateValueGrouping = function _generateValueGrouping(resolution, aggregator) {

        var _id = {
            date: {
                y: "$resolution.y",
                mo: "$resolution.mo"
            },
            source: "$source"
        };

        var value = {};
        value["$" + aggregator] = "$value";

        switch(resolution) {

            case "five_secs":
                _id.date['s5'] = "$resolution.s5"
            case "minute":
                _id.date['m'] = "$resolution.m"
            case "hour":
                _id.date['h'] = "$resolution.h"
            case "day":
                _id.date['d'] = "$resolution.d";
        }

        return {
            _id: _id,
            value: value
        };
    };

    this._generateSourceGrouping = function _generateSourceGrouping(aggregator) {

        var value = {};
        value['$' + aggregator] = "$value";

        return {
            _id: "$_id.date",
            value: value
        };
    };

}

MongoMetrics.RESOLUTION = {
    day: true,
    hour: true,
    minute: true,
    five_secs: true
};

MongoMetrics.AGGREGATORS = {
    "sum": true,
    "avg": true,
    "min": true,
    "max": true
};

function getResolution(date) {

    return {
        y: date.getUTCFullYear(),
        mo: date.getUTCMonth(),
        d: date.getUTCDate(),
        h: date.getUTCHours(),
        m: date.getUTCMinutes(),
        s5: roundToNear(date.getUTCSeconds(), 5), //with 5 sec resolution,
        s: date.getUTCSeconds()
    };
}

function roundToNear (value, roundVal) {

    return ((value - (value % roundVal)) / roundVal) * roundVal;
}

module.exports = MongoMetrics;
module.exports._roundToNear = roundToNear;
module.exports._getResolution  = getResolution;