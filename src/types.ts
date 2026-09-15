import type { SemverRelease } from "./SemverRelease";

export type SemverString = `${number}.${number}.${number}`;

export type VersionCalback = (newVersion: SemverString) => void | Promise<void>;

export interface ReleaseConfiguration {
  onError?: (error: unknown) => void | Promise<void>;
  onNewVersion?: VersionCalback;
  onComplete?: VersionCalback;
  type?: (typeof SemverRelease.RELEASE_TYPES)[number];
}
