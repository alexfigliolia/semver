import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd, exit } from "node:process";
import { parseArgs } from "node:util";
import chalk from "chalk";
import { Logger } from "./Logger";
import type { ReleaseConfiguration, SemverString } from "./types";

export class SemverRelease {
  public static readonly ROOT = this.findRootSync();
  public static readonly RELEASE_TYPES = ["patch", "minor", "major"] as const;
  private static readonly PACKAGE_FILE_PATH = join(this.ROOT, "package.json");
  constructor(public readonly configuration: ReleaseConfiguration = {}) {}

  public async run() {
    const releaseType =
      this.configuration.type ?? (await this.getReleaseType());
    Logger.info(`Creating a new ${Logger.BLUE(releaseType)} release`);
    const nextVersion = await this.getNextVersion(releaseType);
    if (!nextVersion) {
      return;
    }
    Logger.info(
      `The version for this release will be ${Logger.BLUE(nextVersion)}`,
    );
    Logger.info("Running post processors");
    await this.configuration?.onNewVersion?.(nextVersion);
    await this.writePackageVersion(nextVersion);
    await this.configuration?.onComplete?.(nextVersion);
    Logger.info("Fin! 🚀");
  }

  private async getNextVersion(
    releaseType: Awaited<ReturnType<SemverRelease["getReleaseType"]>>,
  ) {
    const packageFile = await this.getPackageFile();
    const { version } = packageFile;
    const [major, minor, patch] = version.split(".");
    if (!major || !minor || !patch) {
      return this.logAndExit(
        `The existing package version ${Logger.RED(version)} is not following semver. Fix this`,
      );
    }
    let nextVersion: string = version;
    switch (releaseType) {
      case "major":
        nextVersion = `${parseInt(major) + 1}.0.0`;
        break;
      case "minor":
        nextVersion = `${major}.${parseInt(minor) + 1}.0`;
        break;
      case "patch":
        nextVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
        break;
    }
    if (nextVersion === packageFile.version) {
      return this.logAndExit(
        `Bumping ${Logger.RED(packageFile.version)} by a ${Logger.BLUE(releaseType)} failed. Please inspect the version and try again`,
      );
    }
    return nextVersion as SemverString;
  }

  private async writePackageVersion(version: SemverString) {
    const packageFile = await this.getPackageFile();
    packageFile.version = version;
    await writeFile(
      SemverRelease.PACKAGE_FILE_PATH,
      JSON.stringify(packageFile, null, 2),
    );
  }

  private async getReleaseType() {
    const {
      values: { type },
    } = parseArgs({
      options: {
        type: {
          default: "patch",
          multiple: false,
          type: "string",
          short: "t",
        },
      },
    });
    const release = type as (typeof SemverRelease.RELEASE_TYPES)[number];
    if (!SemverRelease.RELEASE_TYPES.includes(release)) {
      await this.logAndExit(
        `The release type ${Logger.RED(type)} is invalid. Please specify one of ${chalk.green.bold(Array.from(SemverRelease.RELEASE_TYPES).join(" | "))}`,
      );
      exit(0);
    }
    return release;
  }

  private async logAndExit(msg: string) {
    await this.configuration?.onError?.(msg);
    Logger.error(msg);
    exit(0);
  }

  private static findRootSync() {
    try {
      const root = execSync("git rev-parse --show-toplevel").toString().trim();
      if (!root) {
        throw "fallback";
      }
      return root;
    } catch {
      let currentDir = cwd();
      let maxIterations = 20;
      while (
        --maxIterations > 0 &&
        !existsSync(join(currentDir, "package.json"))
      ) {
        currentDir = join(currentDir, "..");
      }
      return currentDir;
    }
  }

  private async getPackageFile() {
    try {
      const packageFile = (
        await readFile(SemverRelease.PACKAGE_FILE_PATH)
      ).toString();
      const json = JSON.parse(packageFile);
      return json;
    } catch {
      await this.logAndExit(
        `I failed to locate your ${Logger.BLUE("package.json")} file`,
      );
      exit(0);
    }
  }
}
