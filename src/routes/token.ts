import express, { Request, Response, NextFunction } from "express";
import { getUser } from "../model/UsersDb";
import * as validate from "../utils/validate";
const router = express.Router();

router.post('/refresh', validate.verifyRequest, function (req, res) {
  const accessToken = validate.createAccessToken(res.locals.public_address);
  return res.json({ accessToken:  accessToken ? "Bearer " + accessToken : null });
});

router.post('/login', validate.verifyPostParams(["public_address", "signed_nonce", "user_name"]), async function (req, res) {
  const public_address = req.body.public_address;
  const signed_nonce = req.body.signed_nonce;
  const user_name = req.body.user_name;
  //TODO: Add username and password verification here
  const accessToken = validate.createAccessToken(public_address);
  const refreshToken = validate.createRefreshToken(public_address);
  if (accessToken && refreshToken) {
    return res.json({
      text: "Login Successful",
      user: (await getUser(public_address)).data,
      accessToken: "Bearer " + accessToken,
      refreshToken: "Bearer " + refreshToken,
    });
  } else {
    return res.json({text: "Login Failed"});
  }
});

export default router;
