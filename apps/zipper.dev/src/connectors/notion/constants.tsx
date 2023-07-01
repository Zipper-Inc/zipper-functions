export const code = `
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts';

const apiKey = Deno.env.get("NOTION_API_KEY");
const notion = new Client({
  auth: apiKey,
});

export default notion;
`;
