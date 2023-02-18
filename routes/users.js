var express = require('express');
var router = express.Router();

router.put('/create', function (req, res, next) {
  res.json({text: "Create the User here"});
});

router.get('/read', function (req, res, next) {
  res.json({text: "Get the User here"});
});

router.post('/update', function (req, res, next) {
  res.json({text: "Update the User here"});
});

router.delete('/delete', function (req, res, next) {
  res.json({text: "Delete the User here"});
});

module.exports = router;
