#!/usr/bin/python3
# (C) Kirils Solovjovs, 2015

import sys, os, base64, zlib, re

#           111111 11112222
#01234567 89012345 67890123
#cdefgh56 78abGH12 34ABCDEF  (from)
#abcdefgh 12345678 ABCDEFGH  (to)
#revtribitmap=[2,3,4,5,6,7,12,13,14,15,0,1,22,23,8,9,10,11,16,17,18,19,20,21]
tribitmap = [10, 11, 0, 1, 2, 3, 4, 5, 14, 15, 16, 17, 6, 7, 8, 9, 18, 19, 20, 21, 22, 23, 12, 13]

def tribit(content):
    # content is bytes in Python 3
    result = bytearray()
    for i in range(0, len(content) - 1, 3):
        goodtribit = 0
        badtribit = content[i] * 0x10000 + content[i + 1] * 0x100 + content[i + 2]
        for mangle in tribitmap:
            goodtribit = (goodtribit << 1) + (1 if ((badtribit & (0x800000 >> mangle)) > 0) else 0)

        for move in [16, 8, 0]:
            result.append((goodtribit >> move) & 0xff)

    return bytes(result)

if len(sys.argv) > 1:
    if len(sys.argv) > 2:
        dir = sys.argv[2]
    else:
        dir = sys.argv[1] + "_contents/"
else:
    raise Exception(f"Usage: {sys.argv[0]} <supout.rif> [output_folder]")


if not os.access(sys.argv[1], os.R_OK):
    raise Exception(f"Can't read file {sys.argv[1]}")

if not os.path.exists(dir):
    os.makedirs(dir)

if not os.access(dir, os.W_OK):
    raise Exception(f"Directory {dir} not writeable")

if os.listdir(dir) != []:
    raise Exception(f"Directory {dir} not empty")

i = 0
with open(sys.argv[1], 'r', newline='') as my_file:
    sections = my_file.read().replace(
        "--BEGIN ROUTEROS SUPOUT SECTION\r\n", ":"
    ).replace(
        "--END ROUTEROS SUPOUT SECTION\r\n", ":"
    ).replace("::", ":").split(":")
    for sect in sections:
        if len(sect.strip()) > 0:
            i = i + 1

            out = tribit(base64.b64decode(sect.replace("=", "A")))

            name, zipped = out.split(b"\x00", 1)
            name = name.decode("ascii", errors="replace")
            print(f'{i:02d} {name:<23}', end='  ')
            if not i % 3:
                print()

            res = zlib.decompress(zipped)
            filename = re.sub(r'[^a-z0-9.\-]', '_', name)
            fo = open(dir + "/" + str(i).zfill(2) + "_" + filename, "wb")
            fo.write(res)
            fo.close()

print()  # final newline
