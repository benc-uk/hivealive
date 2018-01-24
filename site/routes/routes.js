const express = require('express');
const router = express.Router();

router
.get('/home', function (req, res, next) {
  res.render('home', 
  { 
    title: 'HiveAlive: Portal'
  });
})


.get('/hives', function (req, res, next) {
  res.render('hives', 
  { 
    title: 'HiveAlive: Portal'
  });
})


.get('/reports', function (req, res, next) {
  res.render('reports', 
  { 
    title: 'HiveAlive: Reports'
  });
})


.get('/admin', function (req, res, next) {
  res.render('admin', 
  { 
    title: 'HiveAlive: Admin'
  });
})

module.exports = router;
