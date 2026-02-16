export function needsJsonStringify(input: any): boolean {

  if (typeof input ==='string') {
    return false;
  }

  if ((global as any).Buffer && input instanceof Buffer) {
    return false;
  }

  return true;

}
