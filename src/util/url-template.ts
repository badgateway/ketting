// @ts-ignore
import * as uriTemplate from 'uri-template';
import { resolve } from './url';
import { LinkVariables, Link } from '../link';

export function expand(context: string, template: string, vars: LinkVariables): string;
export function expand(link: Link, vars: LinkVariables): string;
export function expand(arg1: string|Link, arg2: string|LinkVariables, arg3?: LinkVariables): string {

  let context:string;
  let template:string;
  let vars:LinkVariables;

  if (typeof arg1 === 'string') {
    context = arg1;
    template = arg2 as string;
    vars = arg3 as LinkVariables;
  } else {
    context = arg1.context;
    template = arg1.href;
    vars =  arg2 as LinkVariables;
  }
  const templ = uriTemplate.parse(template);
  const expanded = templ.expand(vars);
  return resolve(context, expanded);
}
