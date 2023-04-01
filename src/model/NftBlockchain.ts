import { Alchemy, Network, BigNumber, Wallet, Contract, GetOwnersForNftResponse, OwnedNft } from "alchemy-sdk";
import {abi} from "./NasaFT.json";
import { getUser, updateUser } from "./UsersDb";
import { verifyMessage } from "@ethersproject/wallet";
import { randomUUID } from "crypto";
import { NEO } from "./NeoDB";
import PinataClient, { PinataPinResponse } from "@pinata/sdk";
import { Attributes, getAttributes, generateImageFromAttributes } from "../utils/attributes";
import { Readable } from "stream";

//Connect to contract
const alchemy = new Alchemy({apiKey: process.env.ALCHEMY_API_KEY, network: process.env.ALCHEMY_NETWORK as Network});
const signer = new Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY!, alchemy);
const nasaFT = new Contract(process.env.CONTRACT_ADDRESS!, abi, signer);
const pinata = new PinataClient({ pinataApiKey: process.env.PINATA_API_KEY!, pinataSecretApiKey: process.env.PINATA_API_SECRET});
let shouldWait: boolean;

export async function mintTokens(tokenId: number, tokenAmount: number, uri: string): Promise<ContractResponse<TransferSingleData>> {
    const tx = await syncronizeTransactions(nasaFT.mintTokens(tokenId, tokenAmount, uri));
    if (!tx.error)
    {
        return convertToTransferSingleResponse(tx.events[0].args);
    }
    else
    {
        return {status: tx.status, error: convertToError(tx.error)};
    }
}

export async function burnTokens(fromAddress: string, tokenId: number, tokenAmount: number): Promise<ContractResponse<TransferSingleData>> {
    const tx = await syncronizeTransactions(nasaFT.burnTokens(fromAddress, tokenId, tokenAmount));
    if (!tx.error)
    {
        return convertToTransferSingleResponse(tx.events[0].args);
    }
    else
    {
        return {status: tx.status, error: convertToError(tx.error)};
    }
}

async function syncronizeTransactions(transaction: Promise<any>)
{
    try
    {
        while(shouldWait)
        {
            console.log("Waiting for another transaction to finish...");
            await new Promise(r => setTimeout(r, 1000));
        }
        shouldWait = true;
        return await (await transaction).wait();
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error as Error }
    }
    finally {
        shouldWait = false;
    }
}

export async function safeTransfer(toAddress: string, id: number, amount: number): Promise<ContractResponse<TransferSingleData>>
{
    try
    {
        const tx = await (await nasaFT.safeTransferFrom(signer.address, toAddress, id, amount, [])).wait();
        return convertToTransferSingleResponse(tx.events[0].args);
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error as Error }
    }
}

export async function safeBatchTransfer(toAddress: string, ids: number[], amounts: number[]): Promise<ContractResponse<TransferBatchData>>
{
    try
    {
        const tx = await (await nasaFT.safeBatchTransferFrom(signer.address, toAddress, ids, amounts, [])).wait();
        return convertToTransferBatchResponse(tx.events[0].args);
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error as Error}
    }
}

export async function balanceOf(account: string, id: number): Promise<ContractResponse<BalanceData>>
{
    try
    {
        const balance = await nasaFT.balanceOf(account, id);
        return { status: 200, data: { balance: balance.toNumber() } };
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error as Error}
    }
}

export async function balanceOfBatch(accounts: string[], ids: number[]): Promise<ContractResponse<BalanceBatchData>>
{
    try
    {
        const balances = await nasaFT.balanceOfBatch(accounts, ids);
        return { status: 200, data: { balances: convertToNumberArray(balances) } };
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error }
    }
}

export async function uri(id: number) : Promise<ContractResponse<UriData>>
{
    try
    {
        //TODO: use nft.getMetaData to get the metadata
        const uri: string = await nasaFT.uri(id);
        return { status: 200, data: { uri: uri } };
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error }
    }
}

export async function getNftOwners(id: number): Promise<ContractResponse<GetOwnersForNftResponse>>
{
    try
    {
        const owners = await alchemy.nft.getOwnersForNft(process.env.CONTRACT_ADDRESS!, id); 
        return { status: 200, data: owners}
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error }
    }
}

export async function getOwnedNfts(account: string): Promise<ContractResponse<{ownedNfts: OwnedNft[]}>>
{
    try
    {
        const ownedNfts: OwnedNft[] = [];
        for await (const nft of alchemy.nft.getNftsForOwnerIterator(account)) {
            ownedNfts.push(nft);
        }
        return { status: 200, data: { ownedNfts: ownedNfts } }
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error }
    }
}

export async function generateNonce(public_address: string)
{
  return await updateUser(public_address, {"nonce": "Please sign this nonce with the wallet associated " +
    "with your account to authenticate yourself for login: " + randomUUID()});
}

export async function verifyNonce(public_address: string, signed_nonce: string): Promise<ContractResponse<{verified: boolean}>>
{
    try
    {
        let {error, data, status} = await getUser(public_address);
        if (!error && data && data.nonce) {
            const unsignedNonce = data.nonce;
            const verified = verifyMessage(unsignedNonce, signed_nonce).toLowerCase() === public_address.toLowerCase();
            return {status: verified ? 200 : 401, data: {verified: verified}}
        }
        else {
            return {status: status, error: error ? convertToError(error) : new Error("Could not get nonce for user")}
        }
    }
    catch(error)
    {
        return { status: 500, error: convertToError(error) }
    }
}

export async function getNftMetadata(neo: NEO): Promise<PinataPinResponse | undefined>
{
    const attributes = getAttributes(neo);
    const image = await generateImageFromAttributes(attributes);
    if (image)
    {
        const imageOnIpfs = await pinata.pinFileToIPFS(Readable.from(image!), {pinataMetadata: {
            name: attributes.size + "_" + attributes.range + "_" + attributes.velocity + ".png"
        }});
        return await pinata.pinJSONToIPFS({id: neo.id, image: imageOnIpfs.IpfsHash, attributes })
    }
}

function convertToTransferSingleResponse(event: any) : ContractResponse<TransferSingleData>
{
    const transferData = convertToTransferData(event);
    return {
      status: 200,
      data: {
        operator: transferData.operator,
        to: transferData.to,
        from: transferData.from,
        id: event.id.toNumber(),
        amount: event.value.toNumber(),
      },
    };
}

function convertToTransferBatchResponse(event: any) : ContractResponse<TransferBatchData>
{
    const transferData = convertToTransferData(event);
    return {
      status: 200,
      data: {
        operator: transferData.operator,
        to: transferData.to,
        from: transferData.from,
        ids: convertToNumberArray(event.ids),
        //Cant use property name here because values is an array function
        amounts: convertToNumberArray(event[4]),
      },
    };
}

function convertToTransferData(event: any) : TransferData
{
    return { 
            operator: event.operator, 
            to: event.to,
            from: event.from
        };
}

export function convertToError(error: unknown): Error
{
    if (error instanceof Error)
    {
        return error as Error;
    }
    else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === "string")
    {
        return new Error(error.message);
    }
    return new Error("Unknown Error");
}

function convertToNumberArray(bigNums: BigNumber[])
{
    const numArr: number[] = [];
    bigNums.forEach(bigNum => {
        numArr.push(bigNum.toNumber())
    });
    return numArr;
}

interface ContractResponse<T> {
    status: number,
    error?: Error,
    data?: T
}

interface TransferData {
    operator: string,
    to: string,
    from: string,
}

type TransferSingleData = TransferData & {
    id: number
    amount: number
}

type TransferBatchData = TransferData & {
    ids: number[]
    amounts: number[]
}

type BalanceData = {
    balance: number
}

type BalanceBatchData = {
    balances: number[]
}

type UriData = {
    uri: string
}

type MetaData = {id: number, image: string } & Attributes;