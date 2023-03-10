import validate from '../utils/validate';
import express from 'express';
import * as UsersDb from '../model/UsersDb';
const router = express.Router();

//Insert New User
router.post('/', validate.verifyRequest, async function (req, res, next) {
  const {error, status, statusText} = await UsersDb.insertUser(req.body);
  res.status(status).json({text: error ? error.message : statusText});
});

//Get Own User
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await UsersDb.getUser(res.locals.username);
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Other User
router.get('/:user_name', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await UsersDb.getUser(req.params.user_name);
  res.status(status).json(error ? {text: error.message} : data);
});

//Update User
router.put('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await UsersDb.updateUser(req.body.user_name, req.body.user);
  res.status(status).json(error ? {text: error.message} : data);
});

//Delete User
router.delete('/', validate.verifyRequest, async function (req, res, next) {
  const {error, status, statusText} = await UsersDb.deleteUser(req.body.user_name);
  res.status(status).json({text: error ? error.message : statusText});
});

export default router;
