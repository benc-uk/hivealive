const express = require('express');
const router = express.Router();

router
.get('/home', function (req, res, next) {
  res.render('home', 
  { 
    title: 'Hivematic: Portal'
  });
})


.get('/hives', function (req, res, next) {
  res.render('hives', 
  { 
    title: 'Hivematic: Portal'
  });
})


.get('/reports', function (req, res, next) {
  res.render('reports', 
  { 
    title: 'Hivematic: Reports'
  });
})


.get('/admin', function (req, res, next) {
  res.render('admin', 
  { 
    title: 'Hivematic: Admin'
  });
})

module.exports = router;
