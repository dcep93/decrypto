var express = require('express');
var path = require('path');

var router = express.Router();

var views = path.join(__dirname, 'views');

router.get('/', function(req, res) {
	res.render('index.ejs', {
		title: 'Decrypto',
		views: views,
	});
});

router.use(express.static(path.join(__dirname, 'public')));

module.exports = router;
