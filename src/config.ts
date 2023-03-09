import { createClient } from '@supabase/supabase-js';
import { Database as Users } from "./model/Users";
import { Database as Questions } from "./model/Questions";


function getConnection<T>(schema: "public" extends keyof T ? keyof T & "public" : string & keyof T)
{
    return createClient<T>(
        "https://" + process.env.SUPABASE_PROJECT_ID + ".supabase.co",
        process.env.SUPABASE_API_KEY!,
        {db: {schema: schema}}
      ); 
}

export const DBCONNECTIONS = {
    users: getConnection<Users>("users_data"),
    questions: getConnection<Questions>("quiz_information")
};