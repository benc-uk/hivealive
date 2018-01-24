const express = require('express');
const router = express.Router();

// Index and root
router
.get('/', function (req, res, next) {
  res.render('index', 
  { 
    title: 'Hivematic: Login'
  });
})

.post('/login', function (req, res, next) {
  res.redirect('/home');
})


module.exports = router;
