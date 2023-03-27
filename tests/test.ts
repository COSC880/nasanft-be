import request from "supertest";
import app from "../src/app";
import generateImageFromAttributes from "../src/utils/generateImage";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { InsertUser, UpdateUser } from "../src/model/UsersDb";
import { Question, Answer, stopSetRandomQuizJob, getCurrentWinners } from "../src/model/QuizzesDb";
import { createAccessToken } from "../src/utils/validate";
import { Alchemy, Network, OwnedNft, Wallet } from "alchemy-sdk";
import { burnTokens, mintTokens, safeBatchTransfer, safeTransfer } from "../src/model/NftBlockchain";
import { stopSetRandomNeoJob } from "../src/model/NeoDB";
const AUTH_HEADER = "x-auth-token";
const alchemy = new Alchemy({apiKey: process.env.ALCHEMY_API_KEY, network: process.env.ALCHEMY_NETWORK as Network});
const testSigner = new Wallet(process.env.TEST_WALLET_PRIVATE_KEY!, alchemy);
const owner = new Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY!, alchemy);
const nullAddress =  "0x0000000000000000000000000000000000000000"

describe("NasaFT", function () {
  it("Should be able to get unique nonce.", async () => {
    const public_address = "0x0000000000000000000000000000000000011111";
    const nonce1 = await request(app).get("/api/token/" + public_address);
    expect(nonce1.status).toEqual(200);
    expect(nonce1.body).toHaveProperty("nonce");
    const nonce2 = await request(app).get("/api/token/" + public_address);
    expect(nonce2.status).toEqual(200);
    expect(nonce2.body).toHaveProperty("nonce");
    expect(nonce1.body.nonce).not.toEqual(nonce2.body.nonce);
  });
  it("Shouldnt be able to get access token without refresh token.", async () => {
    await request(app).post("/api/token/refresh").expect(401);
  });
  it("Should be able to authenticate and then get an access token with encoded public address.", async () => {
    const test_public_address = await testSigner.getAddress();

    //Test failed login
    const failedNonceRes = await request(app).get("/api/token/" + test_public_address);
    expect(failedNonceRes.status).toEqual(200);
    expect(failedNonceRes.body).toHaveProperty("nonce");
    const failedUnsignedNonce = failedNonceRes.body.nonce;
    const failed_signed_nonce = await owner.signMessage(failedUnsignedNonce);
    await request(app).post("/api/token/login").send({
      signed_nonce: await owner.signMessage(failed_signed_nonce),
      public_address: test_public_address
    }).expect(401);
    
    //Test successful login
    const nonceRes = await request(app).get("/api/token/" + test_public_address);
    expect(nonceRes.status).toEqual(200);
    expect(nonceRes.body).toHaveProperty("nonce");
    const unsignedNonce = nonceRes.body.nonce;
    const signed_nonce = await testSigner.signMessage(unsignedNonce);
    const loginRes = await request(app).post("/api/token/login").send({
      signed_nonce: signed_nonce,
      public_address: test_public_address
    });
    expect(loginRes.body).toHaveProperty('accessToken');
    expect(loginRes.body).toHaveProperty('refreshToken');
    expect(loginRes.body).toHaveProperty('user');
    expect(loginRes.body.accessToken).not.toEqual(loginRes.body.refreshToken);

    //Wait to ensure we get a new access token as if we are in the same second as the old token we will get the same token
    await new Promise(resolve => setTimeout(resolve, 2000));

    //Test we get a new access token when we refresh
    const refreshRes = await request(app).post("/api/token/refresh").set(AUTH_HEADER, loginRes.body.refreshToken);
    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body.accessToken).not.toEqual(loginRes.body.accessToken);

    //Test we can get the public address out of the access token
    const userRes = await request(app).get("/api/users/").set(AUTH_HEADER, refreshRes.body.accessToken);
    expect(userRes.body).toHaveProperty('public_address', test_public_address);
  }, 10000);
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
    const user: InsertUser = {
      user_name: "SpaceXCellAnt",
      public_address: "0xaaaaaaaaaabbbbbbbbbbccccccccccdddddddddd"
    };
    
    await request(app).post("/api/users/").send({user: user})
      .expect(201);
  });
  it("Inserting user without required data should not insert data", async () => {
    //Missing user_name
    await request(app).post("/api/users/").send({public_address: "0xaaaaaaaaaabbbbbbbbbbccccccccccdddddddddd"})
      .expect(400);
  });
  it("Should be able to update user", async () => {
    const authenication = getUserAccessToken();
    const user_name = "MajorTom";
    const public_address = "0xaaaaaaaaaabbbbbbbbbbccccccccccdddddddddd";

    const user: UpdateUser = {
      user_name: user_name
    };
    
    const res = await request(app).put("/api/users/").send({user: user, public_address: public_address})
      .set(AUTH_HEADER, authenication!);
    expect(res.body.user_name).toEqual(user_name);
  });
  it("Should only be able to get another user if admin.", async () => {
    const otherPublicAddress = "0x0000000000000000000000000000000000000000"
    const nonAdminLogin = getUserAccessToken();
    const adminLogin = getAdminAccessToken();
    const nonAdminRes = await request(app).get("/api/users/" + otherPublicAddress).set(AUTH_HEADER, nonAdminLogin!);
    const adminRes = await request(app).get("/api/users/" + otherPublicAddress).set(AUTH_HEADER, adminLogin!);
    expect(nonAdminRes.status).toEqual(403);
    expect(adminRes.status).toEqual(200);
  });
  it("Should be able to delete user", async () => {
    const authenication = getUserAccessToken();
    const user: UpdateUser = {
      public_address: "0xaaaaaaaaaabbbbbbbbbbccccccccccdddddddddd"
    };
    
    const res = await request(app).delete("/api/users/").send(user)
      .set(AUTH_HEADER, authenication!);
    expect(res.status).toEqual(204);
  });
  it("Should be able to get a random quiz", async () => {
    const authenication = getUserAccessToken();
    
    const res = await request(app).get("/api/quizzes/")
      .set(AUTH_HEADER, authenication!);
    expect(res.status).toEqual(200);

    const id = res.body.quiz_id;
    const currentNeoRes = await request(app).get("/api/neo/")
      .set(AUTH_HEADER, authenication!);
    expect(currentNeoRes.body).toHaveProperty("neo");
    expect(currentNeoRes.body.neo).toHaveProperty("id");
    expect(parseInt(currentNeoRes.body.neo.id)).not.toEqual(Number.NaN);
    const currentNeo = currentNeoRes.body.neo;
    const public_address = testSigner.address;

    //Get Balance
    const getBalanceBefore = await request(app).post("/api/nft/balance")
      .set(AUTH_HEADER, authenication!)
      .send({account: public_address, id: parseInt(currentNeo!.id)});

    const getBalanceBeforeData = getBalanceBefore.body;
    expect(getBalanceBeforeData).toHaveProperty("balance");

    if (getBalanceBeforeData.balance > 0)
    {
      //Burn tokens in case this test ran before
      const burn = await burnTokens(public_address, parseInt(currentNeo!.id), getBalanceBeforeData.balance);
      expect(burn).toHaveProperty("data");
      const burnData = burn.data;
      expect(burnData).toHaveProperty("operator");
      expect(burnData).toHaveProperty("from");
      expect(burnData).toHaveProperty("to");
      expect(burnData).toHaveProperty("id");
      expect(burnData).toHaveProperty("amount", getBalanceBeforeData.balance);
    }

    //Get Balance
    const getBalanceAfter = await request(app).post("/api/nft/balance")
      .set(AUTH_HEADER, authenication!)
      .send({account: public_address, id: parseInt(currentNeo!.id)});

    const getBalanceAfterData = getBalanceAfter.body;
    expect(getBalanceAfterData).toHaveProperty("balance", 0);

    //Add Winner
    const winnerRes = await request(app).post("/api/quizzes").send({public_address: public_address})
      .set(AUTH_HEADER, authenication!)
    expect(winnerRes.status).toEqual(201);
    
    //Add again and make sure wasnt added twice
    const winner2Res = await request(app).post("/api/quizzes").send({public_address: public_address})
      .set(AUTH_HEADER, authenication!);
    expect(winner2Res.status).toEqual(201);

    const winners = await getCurrentWinners();
    expect(winners.data);
    expect(winners.data?.length).toEqual(1);

    //Force quiz refresh
    const adminAuthentication = getAdminAccessToken();
    const res2 = await request(app).put("/api/quizzes/")
      .set(AUTH_HEADER, adminAuthentication!);
    expect(res2.status).toEqual(200);

    const res3 = await request(app).get("/api/quizzes/")
      .set(AUTH_HEADER, authenication!);
    expect(res3.status).toEqual(200);
    expect(res3.body.quiz_id).not.toEqual(id);

    //Force Refresh neo
    const res4 = await request(app).put("/api/neo")
      .set(AUTH_HEADER, adminAuthentication!);
    expect(res4.status).toEqual(200);

    const newNeo = await request(app).get("/api/neo")
      .set(AUTH_HEADER, authenication!);
    expect(newNeo.body).toHaveProperty("neo");
    expect(newNeo.body.neo).toHaveProperty("id");
    expect(parseInt(newNeo.body.neo.id)).not.toEqual(Number.NaN);
    expect(newNeo.body.neo.id).not.toEqual(currentNeo.id);

    //Check nft was awarded to winner
    //Get Owners for Nft
    const getNftOwners = await request(app).get("/api/nft/" + currentNeo!.id)
      .set(AUTH_HEADER, authenication!);

    const getNftOwnersData = getNftOwners.body;
    expect(getNftOwnersData).toHaveProperty("owners");

    //Remove null address in case tokens were burned
    const index = getNftOwnersData.owners.indexOf(nullAddress);
    if (index > -1) {
      getNftOwnersData.owners.splice(index, 1);
    }

    expect(getNftOwnersData.owners.length).toEqual(1);
    expect(getNftOwnersData.owners[0].toLowerCase()).toEqual(public_address.toLowerCase());
  }, 40000);
  it("Questions should have the right answers returned", async () => {
    const authenication = getUserAccessToken();
    
    const res = await request(app).get("/api/quizzes/")
      .set(AUTH_HEADER, authenication!);
    expect(res.status).toEqual(200);
    res.body.questions.forEach((question: Question) => {
      question?.answers.forEach((answer: Answer) => {
        expect(answer?.question_id).toEqual(question.question_id);
      });
    });
  });
  it("Should be able to get specific quiz", async () => {
    const authenication = getAdminAccessToken();
    const quiz_id  = "0e16e3ff-e7c9-42b4-9984-b4c005443194"

    const res = await request(app).get("/api/quizzes/" + quiz_id)
      .set(AUTH_HEADER, authenication!);
    expect(res.status).toEqual(200);
    expect(res.body.quiz_id).toEqual(quiz_id);
    res.body.questions.forEach((question: Question) => {
      expect(question?.quiz_id).toEqual(quiz_id);
      question?.answers.forEach((answer: Answer) => {
        expect(answer?.quiz_id).toEqual(quiz_id);
      });
    });
  });
  it("Should be able to stop quiz and neo job", async () => {
    expect(stopSetRandomQuizJob).not.toThrowError();
    expect(stopSetRandomNeoJob).not.toThrowError();
  });
  it("Should be able to mint nft tokens, transfer nft tokens, batch transfer nft tokens," + 
      "get balance of nft tokens, get batch balance of nft tokens, get uri of nft tokens," +
      " get all owners of an NFT, and get all the NFTs owned by an owner", async () => {
    const authenication = getAdminAccessToken();
    const owner_public_address = await owner.getAddress();
    const test_public_address = await testSigner.getAddress();
    
    //Mint Nft
    const mintAmount = 30;
    const mint = await mintTokens(owner.address, getRandomInt(Number.MAX_SAFE_INTEGER), mintAmount);

    expect(mint).toHaveProperty("data");
    const mintData = mint.data;
    expect(mintData).toHaveProperty("operator");
    expect(mintData).toHaveProperty("from");
    expect(mintData).toHaveProperty("to");
    expect(mintData).toHaveProperty("id");
    expect(mintData).toHaveProperty("amount", mintAmount);

    //Transfer Single
    const from = owner_public_address;
    const to = test_public_address;
    const id = mintData!.id;
    const amount = 5;

    const transferSingle = await safeTransfer(to, id, amount);

    expect(transferSingle).toHaveProperty("data");
    const transferSingleData = transferSingle.data;
    expect(transferSingleData).toHaveProperty("operator", from);
    expect(transferSingleData).toHaveProperty("from", from);
    expect(transferSingleData).toHaveProperty("to", to);
    expect(transferSingleData).toHaveProperty("id", id);
    expect(transferSingleData).toHaveProperty("amount", amount);

    //Mint again
    const mint2Amount = 20;
    const mint2 = await mintTokens(owner.address, getRandomInt(Number.MAX_SAFE_INTEGER), mint2Amount);

    expect(mint2).toHaveProperty("data");
    const mint2Data = mint2.data;
    expect(mint2Data).toHaveProperty("operator");
    expect(mint2Data).toHaveProperty("from");
    expect(mint2Data).toHaveProperty("to");
    expect(mint2Data).toHaveProperty("id");
    expect(mint2Data).toHaveProperty("amount", mint2Amount);
    expect(mint2Data!.id).not.toEqual(mintData!.id);

    //Batch Transfer
    const ids = [mintData!.id, mint2Data!.id];
    const amounts = [5, 3];
    const transferBatch = await safeBatchTransfer(to, ids, amounts);

    expect(transferBatch).toHaveProperty("data");
    const transferBatchData = transferBatch.data;
    expect(transferBatchData).toHaveProperty("operator", from);
    expect(transferBatchData).toHaveProperty("from", from);
    expect(transferBatchData).toHaveProperty("to", to);
    expect(transferBatchData).toHaveProperty("ids", ids);
    expect(transferBatchData).toHaveProperty("amounts", amounts);

    //Get Balance
    const getBalance = await request(app).post("/api/nft/balance")
      .set(AUTH_HEADER, authenication!)
      .send({account: from, id: id});

    const getBalanceData = getBalance.body;
    expect(getBalanceData).toHaveProperty("balance", 20);

    //Get Balance Batch
    const getBalanceBatch = await request(app).post("/api/nft/balance/batch")
      .set(AUTH_HEADER, authenication!)
      .send({accounts: [from, to], ids: ids});

    const getBalanceBatchData = getBalanceBatch.body;
    expect(getBalanceBatchData).toHaveProperty("balances", [20, 3])

    //Get Uri
    const getUri = await request(app).get("/api/nft/uri/" + id)
      .set(AUTH_HEADER, authenication!)

    const getUriData = getUri.body;
    expect(getUriData).toHaveProperty("uri", "https://game.example/api/item/" + id + ".json");

    //Get Nfts For Owner
    const getOwnersNft = await request(app).get("/api/nft/ownedBy/" + to)
      .set(AUTH_HEADER, authenication!);

    expect(getOwnersNft.body).toHaveProperty("ownedNfts");
    const getOwnersNftData = new Map(getOwnersNft.body.ownedNfts.map((nft: OwnedNft) => [nft.tokenId + ":" + nft.contract.address, nft]));
    const ownedNftsLength = getOwnersNftData.size;
    expect(ownedNftsLength).toBeGreaterThanOrEqual(2);
    expect(getOwnersNftData.has(ids[0].toString() + ":" + process.env.CONTRACT_ADDRESS));
    expect(getOwnersNftData.has(ids[1].toString() + ":" + process.env.CONTRACT_ADDRESS));
  }, 70000);
  it("Invalid Nft id should give an error", async () => {
    const authenication = getUserAccessToken();
    //Verify invalid id gets error
    const getUri = await request(app).get("/api/nft/uri/" + "I am not a number")
    .set(AUTH_HEADER, authenication!)
    expect(getUri.status).toEqual(500);
  }, 10000);
});

function getUserAccessToken() 
{
  //Fake Login For Testing
  return createAccessToken("0x12345678890");
}

function getAdminAccessToken()
{
  //Fake Login For Testing
  return createAccessToken("0x0000000000000000000000000000000000011111");
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

function getRandomInt(max: number)
{
  return Math.floor(Math.random() * max);
}