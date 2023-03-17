import * as validate from '../utils/validate';
import express from 'express';
import * as QuizzesDB from "../model/QuizzesDb";
const router = express.Router();

//Force Update Random Question
router.put('/', validate.verifyRequest, validate.verifyAdmin, async function (req, res, next) {
  const {error, status, statusText} = await QuizzesDB.setRandomQuiz();
  res.status(status).json({text: error ? error.message : statusText});
});

//Get Current Random Quiz
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await QuizzesDB.getRandomQuiz();
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Specific Quiz
router.get('/:quiz_id', validate.verifyRequest, validate.verifyAdmin, async function (req, res, next) {
  const {error, data, status} = await QuizzesDB.getQuiz(req.params.quiz_id);
  res.status(status).json(error ? {text: error.message} : data);
});
export default router;
