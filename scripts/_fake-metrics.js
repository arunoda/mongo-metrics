var MongoMetrics    = require('../lib/mongoMetrics');

var metrics = new MongoMetrics("mongodb://localhost/metrics");

setInterval(function() {

    metrics.track('chunks', getRandom(20, 60, true), 's1');
    metrics.track('chunks', getRandom(20, 60, true), 's2');

    metrics.track('mp3', getRandom(100, 300, true), 's1');
    metrics.track('mp3', getRandom(100, 300, true), 's2');

    metrics.track('lame', getRandom(100, 300, true), 's1');
    metrics.track('lame', getRandom(100, 300, true), 's2');

    metrics.track('kkk', getRandom(100, 300, true), 's1');
    metrics.track('kkk', getRandom(100, 300, true), 's2');
}, 1000);

function getRandom(min, max, isInt) {

    var randValue = Math.random() * (max - min);
    if(isInt) {
        return min + Math.floor(randValue);
    } else {
        return min + randValue;
    }
}