/*
    {
        name: "String",
        source: "String",
        value: "Number",
        date: Date
    }
*/

var metrics = {

    "chunk-streams": ["box1", "box2"],
    "mp3": ["box1", "box2"]
};


for(var metricName in metrics) {

    var startDate = new Date("2013 01 01 10:00");
    var sources = metrics[metricName];
    for(var lc=0; lc<1000; lc++) {

        sources.forEach(function(source) {

            var date = new Date(startDate.getTime()  + (1000 * 2 * (lc + 1)));
            var resolution = {
                y: date.getUTCFullYear(),
                mo: date.getUTCMonth(),
                d: date.getUTCDate(),
                h: date.getUTCHours(),
                m: date.getUTCMinutes(),
                s: roundToNear(date.getUTCSeconds(), 5) //with 5 sec resolution
            };

            var metric = {
                name: metricName,
                source: source,
                resolution: resolution,
                date: date,
                value: getRandom(10, 40, true)
            };

            db.metrics.insert(metric);

        })
    }
}

function getRandom(min, max, isInt) {

    var rand = Math.random() * (max-min);
    var val = min + rand;

    return (isInt)? Math.ceil(val): val;
}

function roundToNear (value, roundVal) {
    
    return ((value - (value % roundVal)) / roundVal) * roundVal;
}