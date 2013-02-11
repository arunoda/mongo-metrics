var assert 			= require('assert');
var MongoMetrics	= require('../lib/mongoMetrics');
var mongojs			= require('mongojs');

var MONGO_URL = "mongodb://localhost:27017/test-chunk";
var COLLECTION = 'metrics';

var db = mongojs(MONGO_URL);

suite('Mongo Metrics', function() {

	suite('.track()', function() {

		test("tracking a metric", _clean(function(done) {

			var mm = new MongoMetrics(MONGO_URL, COLLECTION);
			var name = 'the-name';
			var value = 'the-value';
			var source = 'the-source';
			var date = new Date('2013 01 01 4:15:23');
			mm.track(name, value, source, date, function(err) {

				assert.equal(err, undefined);
				db.collection(COLLECTION).findOne({name: name}, validateMetric);
			});

			function validateMetric(err, metric) {

				assert.equal(err, undefined);
				assert.equal(metric.name, name);
				assert.equal(metric.value, value);
				assert.equal(metric.source, source);
				assert.equal(metric.date.getTime(), date.getTime());

				assert.deepEqual(metric.resolution, {
					y: date.getUTCFullYear(),
					mo: date.getUTCMonth(),
					d: date.getUTCDate(),
					h: date.getUTCHours(),
					m: date.getUTCMinutes(),
					s: MongoMetrics._roundToNear(date.getUTCSeconds(), 5)
				});
				done();
			}
		}));
	});
});

function _clean(callback) {

    return function(done) {

        db.collection(COLLECTION).remove(afterRemoved);

        function afterRemoved (err) {
        	
      		if(err) {
      			throw err;
      		} else {
      			callback(done);
      		}
        }
    };    

}