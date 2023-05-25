export interface User {
  name: string,
  id: number,
  publicKey: string,
  privateKey: string,
  relays: Array<string>,
}
