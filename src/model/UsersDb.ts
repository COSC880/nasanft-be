import { getConnection } from "./UtilsDb";
import { Database as UsersSchema } from "../schemas2/Users";

const connection = getConnection<UsersSchema>("users_data");
const USER_DATA_TABLE = "user_data";
const USER_DATA_VIEW = "ranking_user_data";

export async function insertUser(user: InsertUser)
{
  return connection.from(USER_DATA_TABLE).insert(user);
}

export async function getUser(public_address: string)
{
  return await connection.from(USER_DATA_VIEW).select().filter("public_address", "ilike", public_address).single();
}

export async function updateUser(public_address: string, updatedUser: UpdateUser)
{
  return await connection.from(USER_DATA_TABLE).update(updatedUser).filter("public_address", "ilike", public_address).select().single();
}

export async function deleteUser(public_address: string)
{
  return await connection.from(USER_DATA_TABLE).delete().filter("public_address", "ilike", public_address);
}

export type InsertUser = UsersSchema["users_data"]["Tables"]["user_data"]["Insert"];
export type UpdateUser = UsersSchema["users_data"]["Tables"]["user_data"]["Update"];
export type GetUser = undefined | null | UsersSchema["users_data"]["Views"]["ranking_user_data"];