const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'PRI', 'PROPFIND', 'REPORT', 'SEARCH', 'TRACE'];

export function isSafeMethod(method: string): boolean {
  return safeMethods.includes(method);
}
