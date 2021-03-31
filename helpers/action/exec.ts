import { exec as coreExec } from "@actions/exec";

/**
 * By default, the core exec() function returns the response number of the command.
 * This returns the stdout data instead.
 * This action fails if data is outputted to stderr
 * @param commandLine The command to run
 */
export const exec = async (commandLine: string) => {
  let stdoutData = "";
  await coreExec(commandLine, undefined, {
    listeners: {
      stdout: (data: Buffer) => {
        stdoutData += data.toString();
      },
    },
    failOnStdErr: true
  });
  return stdoutData;
};
