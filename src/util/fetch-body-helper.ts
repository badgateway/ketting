export function needsJsonStringify(input: any): boolean {

  if (typeof input ==='string') {
    return false;
  }

  if (input instanceof Buffer) {
    return false;
  }

  return true;

}
