export function needsJsonStringify(input: any): boolean {

  if (typeof input ==='string') {
    return false;
  }

  return !(input instanceof Buffer);
}
