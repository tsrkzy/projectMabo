var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {title: 'Express'});
});

/* Mabo login form */
router.get('/mabo', function(req, res, next) {
    res.render('mabo/index', {title: 'Mabo'});
});

/* Mabo scenario */
router.get('/mabo/scenario', function(req, res, next) {
    res.render('mabo/scenario/index', {title: 'Mabo'});
});

module.exports = router;
