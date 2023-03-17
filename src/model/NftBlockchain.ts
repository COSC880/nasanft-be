import { ethers } from "ethers";
import {abi} from './NasaFt.json'
//Connect to contract
const provider = new ethers.providers.AlchemyProvider(process.env.ALCHEMY_NETWORK, process.env.ALCHEMY_API_KEY);
const signer =  new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY!, provider);
const nasaFT = new ethers.Contract(process.env.CONTRACT_ADDRESS!, abi, signer);

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
        const uri: string = await nasaFT.uri(id);
        return { status: 200, data: { uri: uri } };
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

function convertToNumberArray(bigNums: ethers.BigNumber[])
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