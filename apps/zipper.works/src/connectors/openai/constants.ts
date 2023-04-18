export const code = `
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

const apiKey = Deno.env.get("OPENAI_API_KEY");
const openAI = new OpenAI(apiKey);

export default openAI;
`;

export const scopes: string[] = [];
