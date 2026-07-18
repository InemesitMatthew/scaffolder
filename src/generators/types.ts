export type FlutterMode = 'create' | 'inject';

export interface FlutterScaffoldOptions {
  framework: 'flutter';
  mode: FlutterMode;
  projectName: string;
  packageName: string;
  org: string;
  outputPath: string;
  primaryColor: string;
  basePrimaryColor: string;
  fontFamily: string;
  baseWidth: number;
  baseHeight: number;
  force: boolean;
  /** Sample StatefulShellRoute. */
  withShell: boolean;
  /** Dio ApiClient + pulls core/error. */
  withNetwork: boolean;
  /** Splash CA sample (repo + Riverpod); may pull core/error. */
  withSampleFeature: boolean;
  /** Auth feature stub + secure storage hook. */
  withAuth: boolean;
  /** flutter_localizations + arb stub. */
  withL10n: boolean;
  /** talker_flutter AppLogger + route observer. */
  withLogging: boolean;
  /** AppConfig via --dart-define. */
  withEnv: boolean;
  /** GitHub Actions analyze + test workflow. */
  withCi: boolean;
  /** After success: remove *.scaffolder.bak (undefined = ask interactively). */
  cleanBackups?: boolean;
  appClassName: string;
  appTitle: string;
}

/** Derived: error types when network and/or sample feature is on. */
export function wantsError(options: FlutterScaffoldOptions): boolean {
  return options.withNetwork || options.withSampleFeature;
}

export interface GeneratorResult {
  projectPath: string;
  mode: FlutterMode;
  messages: string[];
  backups: string[];
}

export interface FrameworkGenerator {
  id: string;
  run(options: FlutterScaffoldOptions): Promise<GeneratorResult>;
}
