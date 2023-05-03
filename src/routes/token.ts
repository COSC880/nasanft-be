import express from "express";
import * as validate from "../utils/validate";
import { generateNonce, verifyNonce } from "../model/NftBlockchain";
import { updateUser } from "../model/UsersDb";
const router = express.Router();

router.post('/refresh', validate.verifyRefresh, function (req, res) {
  const accessToken = validate.createAccessToken(res.locals.public_address);
  return res.json({ accessToken: accessToken ? accessToken : null });
});

router.post('/login', validate.verifyPostParams(["public_address", "signed_nonce"]), async function (req, res) {
  const public_address = req.body.public_address;
  const signed_nonce = req.body.signed_nonce;
  const {error, data: verifiedData, status: verifiedStatus} = await verifyNonce(public_address, signed_nonce);
  if (!error && verifiedData)
  {
    let {error, data, status} = await updateUser(public_address, {nonce: null});
    if (!error && data)
    {
      return res.status(verifiedStatus).json({
        accessToken: verifiedData.verified ? validate.createAccessToken(public_address) : undefined,
        refreshToken: verifiedData.verified ? validate.createRefreshToken(public_address) : undefined,
        text: verifiedData.verified ? "Login Successful" : "Login Failed",
        user: data
      });
    }
    else
    {
      return res.status(status).json(error ? {text: error.message} : {text: "Failed to get verified user"}); 
    }
  }
  return res.status(verifiedStatus).json(error ? {text: error.message} : {text: "Failed to determine verification"});
});

//Get Nonce
router.get('/:public_address', async function (req, res) {
  const {error, data, status} = await generateNonce(req.params.public_address);
  res.status(status).json(error ? {text: error.message} : !data.nonce ? {text: "Unknown Error"} : {nonce: data.nonce});
});

export default router;
