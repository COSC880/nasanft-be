import { Alchemy, Network, BigNumber, Wallet, Contract, GetOwnersForNftResponse, OwnedBaseNftsResponse } from "alchemy-sdk";
import {abi} from "./NasaFT.json";

//Connect to contract
const alchemy = new Alchemy({apiKey: process.env.ALCHEMY_API_KEY, network: process.env.ALCHEMY_NETWORK as Network});
const signer = new Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY!, alchemy);
const nasaFT = new Contract(process.env.CONTRACT_ADDRESS!, abi, signer);

export async function mintTokens(tokenAmount: number): Promise<ContractResponse<TransferSingleData>> {
    try
    {
        const tx = await (await nasaFT.mintTokens(tokenAmount)).wait();
        return convertToTransferSingleResponse(tx.events[0].args);
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error as Error }
    }
}

export async function safeTransfer(fromAddress: string, toAddress: string, id: number, amount: number): Promise<ContractResponse<TransferSingleData>>
{
    try
    {
        const tx = await (await nasaFT.safeTransferFrom(fromAddress, toAddress, id, amount, [])).wait();
        return convertToTransferSingleResponse(tx.events[0].args);
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error as Error }
    }
}

export async function safeBatchTransfer(fromAddress: string, toAddress: string, ids: number[], amounts: number[]): Promise<ContractResponse<TransferBatchData>>
{
    try
    {
        const tx = await (await nasaFT.safeBatchTransferFrom(fromAddress, toAddress, ids, amounts, [])).wait();
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

export async function getOwnedNfts(account: string): Promise<ContractResponse<OwnedBaseNftsResponse>>
{
    try
    {
        //This only returns a maximum of 100 nfts. Need to use pageKey to get the rest
        const nfts = await alchemy.nft.getNftsForOwner(account);
        let pageKey = nfts.pageKey;
        while(pageKey != undefined)
        {
            const nextPage = await alchemy.nft.getNftsForOwner(account, {pageKey: pageKey});
            pageKey = nextPage.pageKey;
            nfts.ownedNfts.push(...nextPage.ownedNfts);
        }
        return { status: 200, data: nfts }
    }
    catch(err)
    {
        const error = convertToError(err);
        return { status: 500, error: error }
    }
}

export function getSignerPublicAddress(): string {
    return signer.address;
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

function convertToError(error: unknown): Error
{
    if (error instanceof Error)
    {
        return error as Error;
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