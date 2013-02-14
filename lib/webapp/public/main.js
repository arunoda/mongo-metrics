$(function() {
	var gm = new GraphModel(['mp3'], { metric: 'avg', source: 'avg' }, 'five_secs', 1000 * 60 * 5);
	gm.draw('#graph1').start();

	var gm2 = new GraphModel(['lame'], { metric: 'avg', source: 'avg' }, 'five_secs', 1000 * 60 * 5);
	gm2.draw('#graph2').start();
});

