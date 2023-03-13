import * as validate from '../utils/validate';
import express, {Request, Response} from 'express';
import * as UsersDb from '../model/UsersDb';
const router = express.Router();

//Insert New User
router.post('/', async function (req, res, next) {
  const user: UsersDb.InsertUser = req.body;
  //If this will be an admin user we need to verify the requestor is an admin
  if (user.isAdmin)
  {
    validate.verifyRequest(req, res, 
      async () => {await validate.verifyAdmin(req, res, async() => {await insertUser(req, res, user);})})
  }
  else
  {
    await insertUser(req, res, user);
  }
});

async function insertUser(req: Request, res: Response, user: UsersDb.InsertUser)
{
  const {error, status, statusText} = await UsersDb.insertUser(req.body);
  res.status(status).json({text: error ? error.message : statusText});
}

//Get Own User
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await UsersDb.getUser(res.locals.username);
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Other User
router.get('/:user_name', validate.verifyRequest, validate.verifyAdmin, async function (req, res, next) {
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
