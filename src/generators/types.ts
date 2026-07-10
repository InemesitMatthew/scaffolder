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
  /** After success: remove *.scaffolder.bak (undefined = ask interactively). */
  cleanBackups?: boolean;
  appClassName: string;
  appTitle: string;
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
