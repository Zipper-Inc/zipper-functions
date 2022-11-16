import { spawn, exec as nativeExec } from 'child_process';

/**
 * Async run a shell script with `spawn` and pipe the output
 */
export default async function shell(command: string, options?: string[]) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const cmd = spawn(command, options);

    cmd.stdout.on('data', (out) => {
      stdout += out.toString();
      console.log(out.toString());
    });

    cmd.stderr.on('data', (err) => {
      stderr += err.toString();
      console.error(err.toString());
    });

    cmd.on('error', reject);

    cmd.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

/** Async version of native exec */
export function exec(command: string) {
  return new Promise((resolve, reject) => {
    nativeExec(command, (error: any, stdout: string, stderr: string) => {
      if (error || stderr) reject(error || new Error(stderr));
      else resolve(stdout);
    });
  });
}
