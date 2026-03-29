export type SemverString = `${number}.${number}${number}`;

export type VersionCalback = (newVersion: SemverString) => void | Promise<void>;

export interface ReleaseConfiguration {
  onError: (error: unknown) => void | Promise<void>;
  onNewVersion: VersionCalback;
  onComplete: VersionCalback;
}
