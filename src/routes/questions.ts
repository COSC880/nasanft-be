import validate from '../utils/validate';
import express from 'express';
import { DBCONNECTIONS } from '../config';
import { Database as Question } from '../model/Questions';
const router = express.Router();

const dbConnection = DBCONNECTIONS.questions;
const QUESTIONS_TABLE = "quiz_questions";
const ANSWERS_TABLE = "quiz_answers";
const RANDOM_QUESTIONS_VIEW = "random_quiz_questions";

//Get Random Question
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await dbConnection.from(RANDOM_QUESTIONS_VIEW).select("*, answers:" + ANSWERS_TABLE + "!quiz_answers_question_id_fkey (*)").limit(1).single();
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Specific Question
router.get('/:question_id', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await dbConnection.from(QUESTIONS_TABLE).select("*, answers:" + ANSWERS_TABLE + "!quiz_answers_question_id_fkey (*)")
  .filter("question_id", "eq", req.params.question_id).single();
  res.status(status).json(error ? {text: error.message} : data);
});

export default router;
