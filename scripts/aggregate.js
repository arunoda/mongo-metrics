var result = db.metrics.aggregate([
	{ $match: { name: "chunk-streams" } }, //sort by date too
	{ $group: 
		{
			_id: {
				date: {
					y: "$date.y",
					mo: "$date.mo",
					d: "$date.d",
					h: "$date.h",
					m: "$date.m"
				},
				source: "$source"
			},
			value: {$avg: "$value"},
		}
	},
	{ $group:
		{
			_id: "$_id.date",
			value: {$avg: "$value"}
		}
	},
	{ $sort: {
		_id: 1
	}}
]);

printjson(result);