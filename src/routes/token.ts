import express, { Request, Response, NextFunction } from "express";
import { getUser } from "../model/UsersDb";
import * as validate from "../utils/validate";
const router = express.Router();

router.post('/refresh', validate.verifyRequest, function (req, res) {
  const accessToken = validate.createAccessToken(res.locals.username);
  return res.json({ accessToken:  accessToken ? "Bearer " + accessToken : null });
});

router.post('/login', validate.verifyPostParams(["publicAddress", "signedNonce", "username"]), function (req, res) {
  const publicAddress = req.body.publicAddress;
  const signedNonce = req.body.signedNonce;
  const username = req.body.username;
  //TODO: Add username and password verification here
  const accessToken = validate.createAccessToken(username);
  const refreshToken = validate.createRefreshToken(username);
  if (accessToken && refreshToken) {
    return res.json({
      text: "Login Successful",
      user: getUser(username),
      accessToken: "Bearer " + accessToken,
      refreshToken: "Bearer " + refreshToken,
    });
  } else {
    return res.json({text: "Login Failed"});
  }
});

export default router;
