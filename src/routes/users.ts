import validate from '../utils/validate';
import express from 'express';
import { DBCONNECTIONS } from '../config';
import { Database as User } from '../model/Users';
const router = express.Router();

const dbConnection = DBCONNECTIONS.users;

//Insert New User
router.post('/', validate.verifyRequest, async function (req, res, next) {
  const result = await dbConnection.from("user_data").insert(req.body);
  res.status(result.status).json({text: result.error ? result.error.message : result.statusText});
});

//Get Own User
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const result = await dbConnection.from("user_data").select().filter("user_name", "eq", res.locals.username).single();
  res.status(result.status).json(result.error ? {text: result.error.message} : result.data);
});

//Get Other User
router.get('/:user_name', validate.verifyRequest, async function (req, res, next) {
  const result = await dbConnection.from("user_data").select().filter("user_name", "eq", req.params.user_name).single();
  res.status(result.status).json(result.error ? {text: result.error.message} : result.data);
});

//Update User
router.put('/', validate.verifyRequest, async function (req, res, next) {
  const result = await dbConnection.from("user_data").update(req.body.user).eq("user_name", req.body.user_name).select().single();
  res.status(result.status).json(result.error ? {text: result.error.message} : result.data);
});

//Delete User
router.delete('/', validate.verifyRequest, async function (req, res, next) {
  const result = await dbConnection.from("user_data").delete().filter("user_name", "eq", req.body.user_name);
  res.status(result.status).json({text: result.error ? result.error.message : result.statusText});
});

export default router;
