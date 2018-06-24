// players.state {words: [string], answers: [int], history: [{clues: [string], answers: {int: [int]}}]
// state.numWords int
// state.numClues int
// state.answers [int]
// state.round {clues: ?[string], answers: {string: [int], index: int}

var round; // ?int
var drawnClues; // ?int

getJSONs([{ path: '/socket_games/words/common.json', name: 'words' }]);

$(document).ready(function() {
	$('#door').click(door);
	$('#leave').click(leave);
	$('#reset').click(prepare);
	$('#spy').click(spy);
	$('#clues').submit(submit);
});

function prepare() {
	resetClues();
	state.bank = constants.words.slice();
	shuffleArray(state.bank);
	state.numWords = Number.parseInt($('#num_words').val());
	state.numClues = Number.parseInt($('#num_clues').val());
	state.round = { index: 1 };
	state.currentPlayer = myIndex;
	state.players.forEach(function(player) {
		player.state = newState();
	});
	sendState('prepare');
}

function update() {
	$('#words').empty();
	for (var i = 0; i < state.numWords; i++) {
		$('<div>')
			.text(me().state.words[i])
			.addClass('bubble')
			.addClass('inline')
			.addClass('space')
			.appendTo('#words');
	}
	$('#players_state').empty();
	for (var i = 0; i < state.players.length; i++) {
		var player = state.players[i];
		var playerDiv = $('<div>')
			.addClass('bubble')
			.addClass('inline_flex')
			.append($('<div>').text(player.name))
			.addClass('player_div')
			.appendTo('#players_state');
		for (var j = 0; j < player.state.history.length; j++) {
			var history = player.state.history[j];
			var clues = $('<div>')
				.addClass('bubble')
				.addClass('inline');
			for (var k = 0; k < state.numClues; k++) {
				$('<div>')
					.text(history.clues[k])
					.addClass('bubble')
					.appendTo(clues);
			}
			var answers = $('<div>')
				.addClass('bubble')
				.addClass('inline');
			for (var index in history.answers) {
				var name =
					(index === '' ? 'correct' : state.players[index].name) +
					':';
				var text = name + ' ' + history.answers[index].join(', ');
				$('<div>')
					.text(text)
					.addClass('bubble')
					.appendTo(answers);
			}
			var historyDiv = $('<div>')
				.append(clues)
				.append(answers)
				.addClass('bubble')
				.prependTo(playerDiv);
		}
	}
	if (drawnClues !== state.numClues) {
		resetClues();
	}

	setClues();
	if (isAdmin() && everyoneHasAnswered()) {
		current().state.history.push(state.round);
		state.round = { index: state.round.index + 1 };
		var name = current().name;
		advanceTurn();
		sendState('finished turn', name);
	}
}

function everyoneHasAnswered() {
	if (state.round.answers === undefined) return false;
	for (var i = 0; i < state.players.length; i++) {
		var player = state.players[i];
		if (player.present !== null && state.round.answers[i] === undefined) {
			return false;
		}
	}
	return true;
}

function newState() {
	var words = [];
	for (var i = 0; i < state.numWords; i++) {
		words.push(state.bank.pop());
	}
	return { words: words, history: [] };
}

function resetClues() {
	$('#clues').empty();
	for (var i = 0; i < state.numClues; i++) {
		var clueDiv = $('<div>');
		$('<input>')
			.addClass('clue')
			.addClass('clue_input')
			.appendTo(clueDiv);
		$('<input>')
			.prop('type', 'number')
			.addClass('control_number')
			.addClass('guess')
			.addClass('clue_input')
			.appendTo(clueDiv);
		$('<div>')
			.append(clueDiv)
			.appendTo('#clues');
	}
	$('<input>')
		.prop('type', 'submit')
		.appendTo('#clues');
	drawnClues = state.numClues;
}

function setClues() {
	if (state.round.clues !== undefined) {
		$('.clue').each(function(index) {
			$(this).val(state.round.clues[index]);
		});
	} else if (state.round.index !== round) {
		round = state.round.index;
		$('.clue_input').val('');
	}
	var canClue =
		state.round.clues === undefined &&
		me().state.answers !== undefined &&
		myIndex === state.currentPlayer;
	$('.clue').prop('disabled', !canClue);
	$('.guess').prop(
		'disabled',
		state.round.clues === undefined ||
			state.round.answers[myIndex] !== undefined ||
			canClue
	);
}

isMyTurn = function() {
	if (state.currentPlayer === undefined) {
		return isAdmin();
	}
	if (state.round.clues === undefined) {
		return myIndex === state.currentPlayer;
	} else {
		return state.round.answers[myIndex] === undefined;
	}
};

function submit() {
	if (state.round.clues !== undefined) {
		guess();
	} else if (isMyTurn()) {
		clue();
	}
	return false;
}

function guess() {
	if (state.round.answers[myIndex] !== undefined) return;
	state.round.answers[myIndex] = $('.guess')
		.map(function() {
			return $(this).val();
		})
		.toArray();
	sendState('guessed');
}

function clue() {
	if (me().state.answers !== undefined) {
		state.round.answers = { '': me().state.answers };
		delete me().state.answers;
		state.round.clues = $('.clue')
			.map(function() {
				return $(this).val();
			})
			.toArray();
		sendState('sent clues');
	}
}

function spy() {
	var answers = [];
	for (var i = 1; i <= state.numWords; i++) {
		answers.push(i);
	}
	shuffleArray(answers);
	answers = answers.slice(0, state.numClues);
	me().state.answers = answers;
	sendState('saw answers');
	alert(answers);
}
