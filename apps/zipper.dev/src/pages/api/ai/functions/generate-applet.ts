const systemPrompt = `
    You are a high skilled typescript developer, your task is to take the user request and generate typescript code. 
    Your code must export a handler function. You are not allowed to use classes. 
    Your final output should be a handler function that implements the user request.
    You should always only respond with the desired code, no additional text.
    Example: 
    User request: I want a applet that can greet the user by it's name
    Code: 
    export async function handler({name} : {name: string}){
      return \`Hello \${name}\`
    }
`;

export const createAppletMessage = ({
  userRequest,
}: {
  userRequest: string;
}) => [
  {
    role: 'system' as const,
    content: systemPrompt,
  },
  {
    role: 'user' as const,
    content: userRequest,
  },
];
