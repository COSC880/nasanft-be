var express = require('express');
var router = express.Router();

router.post('/create', function (req, res, next) {
  res.send("Create the User here");
});

router.get('/read', function (req, res, next) {
  res.send("Get the User here");
});

router.post('/update', function (req, res, next) {
  res.send("Update the User here");
});

router.post('/delete', function (req, res, next) {
  res.send("Delete the User here");
});

module.exports = router;
