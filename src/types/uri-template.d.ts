declare module 'uri-template' {

  export interface Template {
    expand(variables: Record<string, any>): string;
  }

  export function parse(href: string): Template;

}
