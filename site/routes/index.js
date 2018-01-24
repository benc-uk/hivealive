const express = require('express');
const router = express.Router();

// Index and root
router
.get('/', function (req, res, next) {
  res.render('index', 
  { 
    title: 'HiveAlive: Login'
  });
})

.post('/login', function (req, res, next) {
  res.redirect('/home');
})


module.exports = router;
