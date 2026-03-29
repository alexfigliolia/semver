# Semver

A small CLI tool to manage versioning of NPM packages

## Installation

```bash
npm i -D @figliolia/semver
```

### Basic Usage

#### CLI

```bash
npx release --type <patch | minor | major>
```

#### Programmatic

The `SemverRelease` release module allows you to configure behaviors during the release process. Using the options available in this class you can create a more robust release process for your project

```typescript
import { SemverRelease } from "@figliolia/semver";

void (async () => {
  const release = new SemverRelease({
    onNewVersion: newVersion => {
      // A callback to be executed once the new version is determined
    },
    onComplete: newVersion => {
      // A callback to be executed once the new version is written
      // to your package.json
    },
    onError: error => {
      // A generic callback to run if an error is encountered
    },
  });
  await release.run();
})();
```

## Advanced Usage

This package is used in a multi-lingual codebase that synchronizes versioning between multiple binaries. Here's how we use this library to manage versioning:

```typescript
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { ChildProcess } from "@figliolia/child-process";
import { Logger, SemverRelease } from "@figliolia/semver";

export class ReleaseManager extends SemverRelease {
  private static readonly INSTALL_SCRIPT = join(
    this.ROOT,
    "installation",
    "install.sh",
  );
  private static readonly CARGO_FILE_PATH = join(this.ROOT, "Cargo.toml");
  constructor() {
    super({
      onComplete: async version => {
        await Release.writeVersion(version);
        Logger.info("Linting Everything...");
        await new ChildProcess("yarn lint:ts").handler;
        await new ChildProcess("yarn lint:rust").handler;
        Logger.info("Compiling for production...");
        await new ChildProcess("yarn build:ts").handler;
      },
    });
  }

  private static writeVersion(version: string) {
    return Promise.all([
      this.writeCargoVersion(version),
      this.updateInstallScript(version),
    ]);
  }

  private static async updateInstallScript(version: string) {
    let write = true;
    const content = await this.streamFileContent(this.INSTALL_SCRIPT, line => {
      if (write && line.startsWith('CURRENT_VERSION="')) {
        write = false;
        return `CURRENT_VERSION="${version}"`;
      }
      return line;
    });
    await writeFile(this.INSTALL_SCRIPT, content);
  }

  private static async writeCargoVersion(version: string) {
    let write = true;
    const content = await this.streamFileContent(this.CARGO_FILE_PATH, line => {
      if (write && line.startsWith('version = "')) {
        write = false;
        return `version = "${version}"`;
      }
      return line;
    });
    await writeFile(this.CARGO_FILE_PATH, content);
  }

  private static async streamFileContent(
    path: string,
    onLine: (line: string) => string,
  ) {
    const reader = createInterface({
      input: createReadStream(path),
      crlfDelay: Infinity,
    });
    const lines: string[] = [];
    for await (const line of reader) {
      lines.push(onLine(line));
    }
    reader.close();
    return lines.join("\n");
  }
}
```

We then invoke this module just by running it with node:

```typescript
import { ReleaseManager } from "./ReleaseManager";

void (async () => {
  const release = new Release();
  await release.run();
})();
```
