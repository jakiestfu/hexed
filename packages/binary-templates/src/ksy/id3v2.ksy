meta:
  id: id3v2
  file-extension: id3v2
  endian: be
  title: ID3v2.3.0 tag
  license: CC0-1.0
  encoding: UTF-8

seq:
  - id: magic
    contents: [0x49, 0x44, 0x33]
  - id: version_major
    type: u1
  - id: version_revision
    type: u1
  - id: flags
    type: u1
  - id: size
    type: u4be
  - id: tags
    type: tag
    repeat: eos

types:
  tag:
    seq:
      - id: name
        type: str
        size: 4
        encoding: ASCII
      - id: size
        type: u4be
      - id: flags
        type: u2be
      - id: data
        size: size
        type: strz
        encoding: UTF-8
