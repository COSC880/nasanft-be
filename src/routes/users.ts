import validate from '../utils/validate';
import express from 'express';
import { DBCONNECTIONS } from '../config';
import { Database as User } from '../model/Users';
const router = express.Router();

const dbConnection = DBCONNECTIONS.users;
const USER_DATA_TABLE = "user_data";

//Insert New User
router.post('/', validate.verifyRequest, async function (req, res, next) {
  const {error, status, statusText} = await dbConnection.from(USER_DATA_TABLE).insert(req.body);
  res.status(status).json({text: error ? error.message : statusText});
});

//Get Own User
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await dbConnection.from(USER_DATA_TABLE).select().filter("user_name", "eq", res.locals.username).single();
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Other User
router.get('/:user_name', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await dbConnection.from(USER_DATA_TABLE).select().filter("user_name", "eq", req.params.user_name).single();
  res.status(status).json(error ? {text: error.message} : data);
});

//Update User
router.put('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await dbConnection.from(USER_DATA_TABLE).update(req.body.user).eq("user_name", req.body.user_name).select().single();
  res.status(status).json(error ? {text: error.message} : data);
});

//Delete User
router.delete('/', validate.verifyRequest, async function (req, res, next) {
  const {error, status, statusText} = await dbConnection.from(USER_DATA_TABLE).delete().filter("user_name", "eq", req.body.user_name);
  res.status(status).json({text: error ? error.message : statusText});
});

export default router;
