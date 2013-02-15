var express 		= require('express');
var routes 			= require('./lib/webapp/routes');
var MongoMetrics 	= require('./lib/mongoMetrics');
var path			= require('path');

/*
	@param {Object} options - options for the dashboard.supported options are shown below
		title - title for the webapp
	
*/
exports.listen = function(mongoUrl, port, options) {

	options = options || {};

	var mongoMetrics = new MongoMetrics(mongoUrl, options.collection);

	var app;
	if(typeof(port) == 'number') {
		app = express();
	} else if(port.constructor == express.constructor) {
		app = port;
	} else {
		throw new Error("Second parameter should be either port number or a express app");
	}

	var currDir = path.dirname(__filename);

	app.engine('ejs', require('ejs').renderFile);
	app.set('views', path.resolve(currDir, 'lib/webapp/views'));
	app.use(express.static(path.resolve(currDir, 'lib/webapp/public')));
	app.use(express.bodyParser());

	routes(mongoMetrics, app, options);

	if(typeof(port) == 'number') {
		app.listen(port);
	}
};