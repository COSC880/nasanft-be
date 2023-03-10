import { createClient } from '@supabase/supabase-js';

export function getConnection<T>(schema: "public" extends keyof T ? keyof T & "public" : string & keyof T)
{
    return createClient<T>(
        "https://" + process.env.SUPABASE_PROJECT_ID + ".supabase.co",
        process.env.SUPABASE_API_KEY!,
        {db: {schema: schema}}
      ); 
}