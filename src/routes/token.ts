import express from "express";
import { JwtPayload } from "jsonwebtoken";
import validate from "../validate";
const router = express.Router();

router.post('/refresh', function (req, res) {
  validate.verifyRequest(req, res, (valRes: JwtPayload) => {
    const accessToken = validate.createAccessToken(valRes.username);
    return res.json({ accessToken: "Bearer " + accessToken });
  });
});

router.post('/login', function (req, res) {
  if (!validate.verifyPostParams(req, res, ["username", "password"]))
  {
    return;
  }
  var username = req.body.username;
  var password = req.body.password;
  //TODO: Add username and password verification here
  const accessToken = validate.createAccessToken(username);
  const refreshToken = validate.createRefreshToken(username);
  if (accessToken && refreshToken) {
    return res.json({
      text: "Login Successful",
      accessToken: "Bearer " + accessToken,
      refreshToken: "Bearer " + refreshToken,
    });
  } else {
    return res.json({text: "Login Failed"});
  }
});

export default router;
