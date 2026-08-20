export interface CliArgs {
  command?: string;
  base?: string;
  head?: string;
  profile?: string;
  format: "text" | "json";
  help: boolean;
}
export function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = { format: "text", help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--base") result.base = argv[++index];
    else if (arg === "--head") result.head = argv[++index];
    else if (arg === "--profile") result.profile = argv[++index];
    else if (arg === "--format") {
      const format = argv[++index];
      if (format !== "text" && format !== "json") throw new Error("invalid format");
      result.format = format;
    } else if (!result.command) result.command = arg;
    else throw new Error("unknown argument: " + arg);
  }
  return result;
}
