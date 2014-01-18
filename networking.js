function startGame() {
	$('#invitebox').slideUp();
	$('#play_container').slideUp();
	
	Game.start();
}

window.is_host = null;

TogetherJSConfig_on_ready = function () {
	$('#sharelink').html(TogetherJS.shareUrl());
	$('#sharelink').attr('href', TogetherJS.shareUrl());
};

TogetherJS.hub.on( 'togetherjs.hello', function (msg) {
	window.is_host = true;
	TogetherJS.send({
		type: 'init'
	});
	startGame();
});

TogetherJS.hub.on( 'init', function (msg) {
	window.is_host = false;
	startGame();
});

$('#play').click(function() {
	TogetherJS();
	$('#play_container').slideUp();
	$('#invitebox').slideDown();
});

$(function() {
	if(!TogetherJS.running)
		$('#play_container').slideDown();
});
