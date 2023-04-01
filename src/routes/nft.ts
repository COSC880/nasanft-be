import * as validate from '../utils/validate';
import express, {Request, Response} from 'express';
import * as NftBlockchain from '../model/NftBlockchain';
const router = express.Router();

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
router.get('/uri/:id', validate.verifyRequest, async function (req, res, next) {
    const {error, status, data} = await NftBlockchain.uri(parseInt(req.params.id));
    res.status(status).json(error ? {text: error.message} : data);
});

//Get Nft Owners
router.get('/:id', validate.verifyRequest, async function (req, res, next) {
  const {error, status, data} = await NftBlockchain.getNftOwners(parseInt(req.params.id));
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Nfts Owned By Account
router.get('/ownedBy/:account', validate.verifyRequest, async function (req, res, next) {
  const {error, status, data} = await NftBlockchain.getOwnedNfts(req.params.account);
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Nft Info for a single Nft
router.get('/info/:id', validate.verifyRequest, async function (req, res, next) {
  const {error, status, data} = await NftBlockchain.getNftinfo(parseInt(req.params.id));
  res.status(status).json(error ? {text: error.message} : data);
});

export default router;