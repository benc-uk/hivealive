const request = require('request');
const express = require('express');
const router = express.Router();

const API_ENDPOINT = process.env.API_ENDPOINT || "https://hive-poc-func.azurewebsites.net/api"

router
.get('/home', function (req, res, next) {
  res.render('home', 
  { 
    title: 'HiveAlive: Portal'
  });
})


.get('/hives', function (req, res, next) {
  request(`${API_ENDPOINT}/hives`, { json: true }, (err, apires, data) => {
    if (err) { return console.log(err); }
    console.log(data);
    res.render('hives', 
    { 
      title: 'HiveAlive: Portal',
      hives: data,
      hivesJSON: JSON.stringify(data)
    });
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


.get('/global', function (req, res, next) {
  res.render('global', 
  { 
    title: 'HiveAlive: Global View'
  });
})


module.exports = router;
