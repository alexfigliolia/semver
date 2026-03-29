import chalk from "chalk";

export class Logger {
  public static readonly RED = chalk.red.bold;
  public static readonly BLUE = chalk.blueBright.bold;
  private static readonly PREFIX = this.BLUE("Semver:");
  private static readonly ERROR_PREFIX = this.RED("Semver:");

  public static info(msg: string) {
    console.log(this.PREFIX, msg);
  }

  public static error(msg: string) {
    console.log(this.ERROR_PREFIX, msg);
  }
}
