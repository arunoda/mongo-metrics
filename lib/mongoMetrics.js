var qbox	= require('qbox');
var mongo 	= require('mongodb');

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
			date: date,
			resolution: getResolution(date)
		};

		mongoDatabase.ready(function() {

			mongoDatabase.db.collection(collection).insert(metric, callback);
		});
	};
}

function getResolution(date) {

	return {
		y: date.getUTCFullYear(),
		mo: date.getUTCMonth(),
		d: date.getUTCDate(),
		h: date.getUTCHours(),
		m: date.getUTCMinutes(),
		s: roundToNear(date.getUTCSeconds(), 5) //with 5 sec resolution
	};
}

function roundToNear (value, roundVal) {

	return ((value - (value % roundVal)) / roundVal) * roundVal;
}

module.exports = MongoMetrics;
module.exports._roundToNear = roundToNear;
module.exports._getResolution  = getResolution;