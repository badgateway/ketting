declare module 'uri-template' {

  export interface Template {
    expand(variables: object): string;
  }

  export function parse(href: string): Template;

}
