import { getConnection } from "./UtilsDb";
import { Database as QuizzesSchema } from "../schema/Quizzes";
import { CronJob } from "cron";
import { getCurrentNeo, setImageOfTheDay } from "./NeoDB";

const connection = getConnection<QuizzesSchema>("quiz_information");
const QUIZZES_TABLE = "quizzes"
const QUESTIONS_TABLE = "quiz_questions";
const ANSWERS_TABLE = "quiz_answers";
const RANDOM_QUIZ_VIEW = "random_quizzes";
const WINNERS = "winners";

var CURRENT_RANDOM_QUIZ: Quiz;
const setRandomQuizJob = new CronJob({cronTime: "0 0 * * *", onTick: setRandomQuiz, start: true, runOnInit: true});

export async function getRandomQuiz()
{
    return CURRENT_RANDOM_QUIZ ? { status: 200, data: CURRENT_RANDOM_QUIZ }
        : { status: 500, error: new Error("Current Quiz is not set") };
}

export async function setRandomQuiz()
{
  setImageOfTheDay();
  const res = await connection.from(RANDOM_QUIZ_VIEW).select("*, questions:" + QUESTIONS_TABLE + "!" + QUESTIONS_TABLE +
    "_quiz_id_fkey (*, answers:" + ANSWERS_TABLE + "!" + ANSWERS_TABLE + "_question_id_fkey (*))")
        .filter("quiz_id", CURRENT_RANDOM_QUIZ ? "neq" : "not.is", CURRENT_RANDOM_QUIZ ? CURRENT_RANDOM_QUIZ.quiz_id : null).limit(1).single();
  if (!res.error && res.data)
  {
    CURRENT_RANDOM_QUIZ = (res.data as unknown as Quiz);
  }
  return res;
}

export async function getQuiz(quiz_id: string)
{
    return await connection.from(QUIZZES_TABLE).select("*, questions:" + QUESTIONS_TABLE + "!" + QUESTIONS_TABLE +
        "_quiz_id_fkey (*, answers:" + ANSWERS_TABLE + "!" + ANSWERS_TABLE + "_question_id_fkey (*))")
            .filter("quiz_id", "eq", quiz_id).single();
}

export function stopSetRandomQuizJob()
{
    setRandomQuizJob.stop();
}

export async function getCurrentWinners()
{
  const currentNeo = getCurrentNeo();
  return await connection.from(WINNERS).select("*").filter("neo_id", "eq", currentNeo?.id);
}

export async function setWinner(public_address: string)
{
  const currentNeo = getCurrentNeo();
  return await connection.from(WINNERS).upsert({ neo_id: currentNeo?.id!, public_address: public_address }, { onConflict: "neo_id, public_address" });
}

export type Answer = undefined | null | QuizzesSchema["quiz_information"]["Tables"]["quiz_answers"]["Row"];
export type Question = undefined | null | QuizzesSchema["quiz_information"]["Tables"]["quiz_questions"]["Row"] & {answers: Answer[]}
export type Quiz = undefined | null | QuizzesSchema["quiz_information"]["Tables"]["quiz_questions"]["Row"] & {questions: Question[]}
export type Winner = QuizzesSchema["quiz_information"]["Tables"]["winners"]["Row"];
