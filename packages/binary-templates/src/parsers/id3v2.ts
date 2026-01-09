import { KaitaiStream } from "kaitai-struct";
import Id3v2 from "../generated/id3v2";

export function parseId3(buffer: ArrayBuffer) {
  const stream = new KaitaiStream(buffer);
  return new Id3v2(stream);
}
