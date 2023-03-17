import request from "supertest";
import app from "../src/app";
import generateImageFromAttributes from "../src/utils/generateImage";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { InsertUser, UpdateUser } from "../src/model/UsersDb";
import { Question, Answer, stopSetRandomQuizJob } from "../src/model/QuizzesDb";
import { getSignerPublicAddress } from "../src/model/NftBlockchain";
const AUTH_HEADER = "x-auth-token";

describe("NasaFT", function () {
  it("Shouldnt be able to get access token without refresh token.", async () => {
    await request(app).post("/api/token/refresh").expect(401);
  });
  it("Should be able to authenticate and then get an access token.", async () => {
    const res = await request(app).post("/api/token/login").send({
      username: "xXSpacedOutXx",
      signedNonce: "INeedSpace",
      publicAddress: "0x342423423432423423423"
    });
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    const refreshRes = await request(app).post("/api/token/refresh").set(AUTH_HEADER, res.body.refreshToken);
    expect(refreshRes.body).toHaveProperty('accessToken');
  });
  it("Should be able to get username from middleware that decoded token.", async () => {
    const username = "EarthSunRockStar"
    const res = await request(app).post("/api/token/login").send({
      username: username,
      signedNonce: "FavoritePlaceIsSpace",
      publicAddress: "0x342423423432423423423"
    });
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    const userRes = await request(app).get("/api/users/").set(AUTH_HEADER, res.body.accessToken);
    expect(userRes.body).toHaveProperty('user_name', username);
  });
  it("Test generating nft image", async () => {
    const expectedImage = PNG.sync.read(fs.readFileSync(path.join(__dirname, "baselineImages", "average_far_small.png")));
    const actualBuffer = await generateImageFromAttributes("background", "average", "far", "small");
    const actualImage = PNG.sync.read(actualBuffer!);
    const {width, height} = expectedImage;
    const diffImage = new PNG({width, height});
    const match = pixelmatch(expectedImage.data, actualImage.data, diffImage.data, width, height);
    expect(match).toEqual(0);
  });
  it("Inserting user with required data should insert data", async () => {
    const authenication = await getAuthenticationHeader();
    const user: InsertUser = {
      user_name: "SpaceXCellAnt",
      public_address: "0x0000000000000000000000000000000000000000"
    };
    
    await request(app).post("/api/users/").send(user)
      .set(authenication.field, authenication.value!).expect(201);
  });
  it("Inserting user without required data should not insert data", async () => {
    const authenication = await getAuthenticationHeader();
    //Missing user_name
    await request(app).post("/api/users/").send({public_address: "0x0000000000000000000000000000000000000000"})
      .set(authenication.field, authenication.value!).expect(400);
  });
  it("Should be able to update user", async () => {
    const authenication = await getAuthenticationHeader();
    const time = "22:56:00+00";

    const user: UpdateUser = {
      last_completed: time
    };
    
    const res = await request(app).put("/api/users/").send({user: user, user_name: "SpaceXCellAnt"})
      .set(authenication.field, authenication.value!);
    expect(res.body.last_completed).toEqual(time);
  });
  it("Should only be able to get another user if admin.", async () => {
    const otherUsername = "EarthSunRockStar"
    const nonAdminLogin = (await request(app).post("/api/token/login").send({
      username: "TestUser",
      signedNonce: "INeedSpace",
      publicAddress: "123"
    })).body.accessToken;
    const adminLogin = (await request(app).post("/api/token/login").send({
      username: "administgreater",
      signedNonce: "bossman",
      publicAddress: "0x0000000000000000000000000000000000011111"
    })).body.accessToken;
    const nonAdminRes = await request(app).get("/api/users/" + otherUsername).set(AUTH_HEADER, nonAdminLogin);
    const adminRes = await request(app).get("/api/users/" + otherUsername).set(AUTH_HEADER, adminLogin);
    expect(nonAdminRes.status).toEqual(403);
    expect(adminRes.status).toEqual(200);
  });
  it("Should be able to delete user", async () => {
    const authenication = await getAuthenticationHeader();
    const user: UpdateUser = {
      user_name: "SpaceXCellAnt"
    };
    
    const res = await request(app).delete("/api/users/").send(user)
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(204);
  });
  it("Should be able to get a random quiz", async () => {
    const authenication = await getAuthenticationHeader();
    
    const res = await request(app).get("/api/quizzes/")
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(200);

    const id = res.body.quiz_id;

    //Force quiz refresh
    const adminAuthentication = await getAdminAuthenticationHeader();
    const res2 = await request(app).put("/api/quizzes/")
      .set(adminAuthentication.field, adminAuthentication.value!);
    expect(res2.status).toEqual(200);

    const res3 = await request(app).get("/api/quizzes/")
    .set(authenication.field, authenication.value!);
    expect(res3.status).toEqual(200);
    expect(res3.body.quiz_id).not.toEqual(id);
  });
  it("Questions should have the right answers returned", async () => {
    const authenication = await getAuthenticationHeader();
    
    const res = await request(app).get("/api/quizzes/")
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(200);
    res.body.questions.forEach((question: Question) => {
      question?.answers.forEach((answer: Answer) => {
        expect(answer?.question_id).toEqual(question.question_id);
      });
    });
  });
  it("Should be able to get specific quiz", async () => {
    const authenication = await getAdminAuthenticationHeader();
    const quiz_id  = "0e16e3ff-e7c9-42b4-9984-b4c005443194"

    const res = await request(app).get("/api/quizzes/" + quiz_id)
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(200);
    expect(res.body.quiz_id).toEqual(quiz_id);
    res.body.questions.forEach((question: Question) => {
      expect(question?.quiz_id).toEqual(quiz_id);
      question?.answers.forEach((answer: Answer) => {
        expect(answer?.quiz_id).toEqual(quiz_id);
      });
    });
  });
  it("Should be able to stop cron job", async () => {
    expect(stopSetRandomQuizJob).not.toThrowError();
  });
  it("Should be able to mint nft tokens, transfer nft tokens, batch transfer nft tokens," + 
      "get balance of nft tokens, get batch balance of nft tokens, and get uri of nft tokens", async () => {
    const authenication = await getAdminAuthenticationHeader();
    //Mint Nft
    const mintAmount = 30;
    const mint = await request(app).post("/api/nft/mint")
      .set(authenication.field, authenication.value!)
      .send({amount: mintAmount});

    const mintData = mint.body;
    expect(mintData).toHaveProperty("operator");
    expect(mintData).toHaveProperty("from");
    expect(mintData).toHaveProperty("to");
    expect(mintData).toHaveProperty("id");
    expect(mintData).toHaveProperty("amount", mintAmount);

    //Transfer Single
    const from = getSignerPublicAddress();
    const to = process.env.TEST_WALLET_PUBLIC_KEY;
    const id = mintData.id;
    const amount = 5;

    const transferSingle = await request(app).post("/api/nft/transfer")
      .set(authenication.field, authenication.value!)
      .send({fromAddress: from, toAddress: to, id: id, amount: amount});

    const transferSingleData = transferSingle.body;
    expect(transferSingleData).toHaveProperty("operator", from);
    expect(transferSingleData).toHaveProperty("from", from);
    expect(transferSingleData).toHaveProperty("to", to);
    expect(transferSingleData).toHaveProperty("id", id);
    expect(transferSingleData).toHaveProperty("amount", amount);

    //Mint again
    const mint2Amount = 20;
    const mint2 = await request(app).post("/api/nft/mint")
      .set(authenication.field, authenication.value!)
      .send({amount: mint2Amount});

    const mint2Data = mint2.body;
    expect(mint2Data).toHaveProperty("operator");
    expect(mint2Data).toHaveProperty("from");
    expect(mint2Data).toHaveProperty("to");
    expect(mint2Data).toHaveProperty("id");
    expect(mint2Data).toHaveProperty("amount", mint2Amount);
    expect(mint2Data.id).not.toEqual(mintData.id);

    //Batch Transfer
    const ids = [mintData.id, mint2Data.id];
    const amounts = [5, 3];
    const transferBatch = await request(app).post("/api/nft/transfer/batch")
      .set(authenication.field, authenication.value!)
      .send({fromAddress: from, toAddress: to, ids: ids, amounts: amounts});

    const transferBatchData = transferBatch.body;
    expect(transferBatchData).toHaveProperty("operator", from);
    expect(transferBatchData).toHaveProperty("from", from);
    expect(transferBatchData).toHaveProperty("to", to);
    expect(transferBatchData).toHaveProperty("ids", ids);
    expect(transferBatchData).toHaveProperty("amounts", amounts);

    //Get Balance
    const getBalance = await request(app).post("/api/nft/balance")
      .set(authenication.field, authenication.value!)
      .send({account: from, id: id});

    const getBalanceData = getBalance.body;
    expect(getBalanceData).toHaveProperty("balance", 20);

    //Get Balance Batch
    const getBalanceBatch = await request(app).post("/api/nft/balance/batch")
      .set(authenication.field, authenication.value!)
      .send({accounts: [from, to], ids: ids});

    const getBalanceBatchData = getBalanceBatch.body;
    expect(getBalanceBatchData).toHaveProperty("balances", [20, 3])

    //Get Uri
    const getUri = await request(app).post("/api/nft/uri")
    .set(authenication.field, authenication.value!)
    .send({id: id});

    const getUriData = getUri.body;
    expect(getUriData).toHaveProperty("uri", "https://game.example/api/item/" + id + ".json")
  }, 70000);
});

async function getAuthenticationHeader() 
{
  const accessToken = (await request(app).post("/api/token/login").send({
    username: "GiveMeSomeSpace",
    signedNonce: "YodaBest",
    publicAddress: "0x12345678890"
  })).body.accessToken;
  return { field: AUTH_HEADER, value: accessToken };
}

async function getAdminAuthenticationHeader()
{
  const adminLogin = (await request(app).post("/api/token/login").send({
    username: "administgreater",
    signedNonce: "bossman",
    publicAddress: "0x0000000000000000000000000000000000011111"
  })).body.accessToken;
  return { field: AUTH_HEADER, value: adminLogin}
}

async function saveImage(path: string, buffer: Buffer | undefined)
{
  if (buffer)
  {
    //Add extension if doesnt exist
    if (!path.toLowerCase().endsWith(".png"))
    {
      path = path + ".png"
    }
    fs.writeFileSync(path, buffer);
  }
}