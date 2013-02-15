var webapp = require('./dashboard');
webapp.listen("mongodb://localhost/metrics", 4000, {
	title: "Dejaset Metrics"
});