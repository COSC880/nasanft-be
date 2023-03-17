import * as validate from '../utils/validate';
import express, {Request, Response} from 'express';
import * as NftBlockchain from '../model/NftBlockchain';
const router = express.Router();

//Mint Tokens
router.post('/mint', validate.verifyRequest, validate.verifyAdmin, validate.verifyPostParams(["amount"]), async function (req, res, next) {
    const {error, status, data} = await NftBlockchain.mintTokens(req.body.amount);
    res.status(status).json(error ? {text: error.message} : data);
});

//Transfer Batch Tokens
router.post("/transfer/batch", validate.verifyRequest, validate.verifyAdmin,
  validate.verifyPostParams(["fromAddress", "toAddress", "ids", "amounts"]),
  async function (req, res, next) {
    const { error, status, data } = await NftBlockchain.safeBatchTransfer(
      req.body.fromAddress, req.body.toAddress, req.body.ids, req.body.amounts);
    res.status(status).json(error ? { text: error.message } : data);
});

//Transfer Single Tokens
router.post('/transfer', validate.verifyRequest, validate.verifyAdmin, 
  validate.verifyPostParams(["fromAddress", "toAddress", "id", "amount"]),
  async function (req, res, next) {
    const { error, status, data } = await NftBlockchain.safeTransfer(
      req.body.fromAddress, req.body.toAddress, req.body.id, req.body.amount);
    res.status(status).json(error ? { text: error.message } : data);
});

//Balance Of Batch
router.post('/balance/batch', validate.verifyRequest, validate.verifyPostParams(["accounts", "ids"]),
  async function (req, res, next) {
    const {error, status, data} = await NftBlockchain.balanceOfBatch(req.body.accounts, req.body.ids);
    res.status(status).json(error ? {text: error.message} : data);
});

//Balance Of Single
router.post('/balance', validate.verifyRequest, validate.verifyPostParams(["account", "id"]),
  async function (req, res, next) {
    const {error, status, data} = await NftBlockchain.balanceOf(req.body.account, req.body.id);
    res.status(status).json(error ? {text: error.message} : data);
});

//Get Uri
router.post('/uri', validate.verifyRequest, validate.verifyPostParams(["id"]), async function (req, res, next) {
    const {error, status, data} = await NftBlockchain.uri(req.body.id);
    res.status(status).json(error ? {text: error.message} : data);
});

export default router;