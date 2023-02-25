import validate from '../utils/validate';
import express from 'express';
const router = express.Router();

router.put('/create', validate.verifyRequest, function (req, res, next) {
  res.json({text: "Create the User here"});
});

router.get('/read', validate.verifyRequest, function (req, res, next) {
  res.json({username: res.locals.username});
});

router.post('/update', validate.verifyRequest, function (req, res, next) {
  res.json({text: "Update the User here"});
});

router.delete('/delete', validate.verifyRequest, function (req, res, next) {
  res.json({text: "Delete the User here"});
});

export default router;
