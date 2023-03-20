import * as validate from '../utils/validate';
import express, {Request, Response} from 'express';
import * as UsersDb from '../model/UsersDb';
const router = express.Router();

//Insert New User
router.post('/', validate.verifyPostParams(["user"]), async function (req, res, next) {
  const user: UsersDb.InsertUser = req.body.user;
  //If this will be an admin user we need to verify the requestor is an admin
  if (user.isAdmin)
  {
    validate.verifyRequest(req, res, 
      async () => {await validate.verifyAdmin(req, res, async() => {await insertUser(req, res);})})
  }
  else
  {
    await insertUser(req, res);
  }
});

async function insertUser(req: Request, res: Response)
{
  const {error, status, statusText} = await UsersDb.insertUser(req.body.user);
  res.status(status).json({text: error ? error.message : statusText});
}

//Get Own User
router.get('/', validate.verifyRequest, async function (req, res, next) {
  const {error, data, status} = await UsersDb.getUser(res.locals.public_address);
  res.status(status).json(error ? {text: error.message} : data);
});

//Get Other User
router.get('/:public_address', validate.verifyRequest, validate.verifyAdmin, async function (req, res, next) {
  const {error, data, status} = await UsersDb.getUser(req.params.public_address);
  res.status(status).json(error ? {text: error.message} : data);
});

//Update User
router.put('/', validate.verifyRequest, validate.verifyPostParams(["public_address", "user"]), async function (req, res, next) {
  const {error, data, status} = await UsersDb.updateUser(req.body.public_address, req.body.user);
  res.status(status).json(error ? {text: error.message} : data);
});

//Delete User
router.delete('/', validate.verifyRequest, validate.verifyPostParams(["public_address"]), async function (req, res, next) {
  const {error, status, statusText} = await UsersDb.deleteUser(req.body.public_address);
  res.status(status).json({text: error ? error.message : statusText});
});

export default router;
