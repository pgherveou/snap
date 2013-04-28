document.getElementById('open-left').addEventListener('click', function(){
	if (snapper.getState() === 'closed')
		snapper.open('left');
});