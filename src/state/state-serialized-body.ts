export type StateSerializedBody = Buffer | Blob | string;

export function serializeBody(data: any): StateSerializedBody {
  if (data instanceof Buffer ||
      data instanceof Blob ||
      typeof data === 'string')
  {
    return data;
  }
  return JSON.stringify(data);
}
