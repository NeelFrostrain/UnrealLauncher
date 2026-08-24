// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;

fn sha1_hex(data: &[u8]) -> String {
  let mut h0 = 0x67452301u32;
  let mut h1 = 0xEFCDAB89u32;
  let mut h2 = 0x98BADCFEu32;
  let mut h3 = 0x10325476u32;
  let mut h4 = 0xC3D2E1F0u32;

  let mut msg = data.to_vec();
  let orig_len = (data.len() as u64) * 8;
  msg.push(0x80);
  while (msg.len() % 64) != 56 {
    msg.push(0x00);
  }
  msg.extend_from_slice(&orig_len.to_be_bytes());

  for chunk in msg.chunks(64) {
    let mut w = [0u32; 80];
    for (i, word) in chunk.chunks(4).enumerate() {
      w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
    }
    for i in 16..80 {
      w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
    }

    let mut a = h0;
    let mut b = h1;
    let mut c = h2;
    let mut d = h3;
    let mut e = h4;

    for i in 0..80 {
      let (f, k) = match i {
        0..=19 => ((b & c) | ((!b) & d), 0x5A827999),
        20..=39 => (b ^ c ^ d, 0x6ED9EBA1),
        40..=59 => ((b & c) | (b & d) | (c & d), 0x8F1BBCDC),
        _ => (b ^ c ^ d, 0xCA62C1D6),
      };

      let temp = a
        .rotate_left(5)
        .wrapping_add(f)
        .wrapping_add(e)
        .wrapping_add(k)
        .wrapping_add(w[i]);
      e = d;
      d = c;
      c = b.rotate_left(30);
      b = a;
      a = temp;
    }

    h0 = h0.wrapping_add(a);
    h1 = h1.wrapping_add(b);
    h2 = h2.wrapping_add(c);
    h3 = h3.wrapping_add(d);
    h4 = h4.wrapping_add(e);
  }

  format!("{:08x}{:08x}{:08x}{:08x}{:08x}", h0, h1, h2, h3, h4)
}

#[napi]
pub fn get_thumbnail_cache_filename_native(source_path: String, mtime_ms: f64) -> String {
  let p = Path::new(&source_path);
  let ext = p
    .extension()
    .and_then(|e| e.to_str())
    .unwrap_or("png")
    .to_lowercase();
  let key = format!("{}:{}", source_path, mtime_ms as i64);
  let hash = sha1_hex(key.as_bytes());
  format!("{}.{}", hash, ext)
}
