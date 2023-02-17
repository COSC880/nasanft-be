var express = require("express");
const validate = require("../validate");
var router = express.Router();

router.post('/refresh', function (req, res) {
  validate.verifyRequest(req, res, (valRes) => {
    const accessToken = validate.createAccessToken(valRes.username);
    res.send(JSON.stringify({ accessToken: "Bearer " + accessToken }));
  });
});

router.post('/login', function (req, res) {
  var username = "user1"; //req.body.username.toLowerCase();
  //TODO: Add username and password verification here
  const accessToken = validate.createAccessToken(username);
  const refreshToken = validate.createRefreshToken(username);
  if (accessToken && refreshToken) {
    res.send(
      JSON.stringify({
        text: "Login Successful",
        accessToken: "Bearer " + accessToken,
        refreshToken: "Bearer " + refreshToken,
      })
    );
  } else {
    res.send("Login Failed");
  }
});

module.exports = router;
