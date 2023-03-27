import * as validate from '../utils/validate';
import express from 'express';
import { generateNewNeo, getCurrentNeo, stopSetRandomNeoJob } from '../model/NeoDB';
const router = express.Router();

//Force Update Current Neo
router.put('/', validate.verifyRequest, validate.verifyAdmin, async function (req, res, next) {
    stopSetRandomNeoJob();
    const {status, error, data} = await generateNewNeo();
    res.status(status).json(error ? {text: error.message} : data);
  });

//Get Current Neo
router.get('/', validate.verifyRequest, async function (req, res, next) {
    const neo = getCurrentNeo();
    res.status(neo ? 200 : 500).json(neo ? {neo: neo} : {text: "Current NEO not set"});
});

export default router;
