export type StateSerializedBody = Uint8Array | Blob | string;

export function serializeBody(data: any): StateSerializedBody {
  if (data instanceof Uint8Array ||
      data instanceof Blob ||
      typeof data === 'string')
  {
    return data;
  }
  return JSON.stringify(data);
}
