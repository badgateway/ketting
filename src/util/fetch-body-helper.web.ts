export function needsJsonStringify(input: any): boolean {

  if (typeof input ==='string') {
    return false;
  }

  if (input instanceof Blob) {
    return false;
  }

  return true;

}
