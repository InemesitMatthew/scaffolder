export type FrameworkId = 'flutter' | 'react' | 'nestjs' | 'go';

export interface FrameworkDefinition {
  id: FrameworkId;
  label: string;
  available: boolean;
  description: string;
}

export const frameworks: FrameworkDefinition[] = [
  {
    id: 'flutter',
    label: 'Flutter',
    available: true,
    description: 'Clean Architecture + shared UI kit (BaseScaffold, TextWidget, …)',
  },
  {
    id: 'react',
    label: 'React',
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'nestjs',
    label: 'NestJS',
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'go',
    label: 'Go',
    available: false,
    description: 'Coming soon',
  },
];

export function getFramework(id: string): FrameworkDefinition | undefined {
  return frameworks.find((f) => f.id === id);
}

export function availableFrameworks(): FrameworkDefinition[] {
  return frameworks.filter((f) => f.available);
}
