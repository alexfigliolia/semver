#!/usr/bin/env node
import { SemverRelease } from "./SemverRelease";

void (async () => {
  const release = new SemverRelease();
  await release.run();
})();
