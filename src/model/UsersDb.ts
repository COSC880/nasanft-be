import { getConnection } from "./UtilsDb";
import { Database as UsersSchema } from "../schemas/Users";

const connection = getConnection<UsersSchema>("users_data");
const USER_DATA_TABLE = "user_data";

export async function insertUser(user: InsertUser)
{
  return connection.from(USER_DATA_TABLE).insert(user);
}

export async function getUser(username: string)
{
  return await connection.from(USER_DATA_TABLE).select().filter("user_name", "eq", username).single();
}

export async function updateUser(username: string, updatedUser: UpdateUser)
{
  return await connection.from(USER_DATA_TABLE).update(updatedUser).eq("user_name", username).select().single();
}

export async function deleteUser(username: string)
{
  return await connection.from(USER_DATA_TABLE).delete().filter("user_name", "eq", username);
}

export type InsertUser = UsersSchema["users_data"]["Tables"]["user_data"]["Insert"];
export type UpdateUser = UsersSchema["users_data"]["Tables"]["user_data"]["Update"];
export type GetUser = undefined | null | UsersSchema["users_data"]["Tables"]["user_data"]["Row"];