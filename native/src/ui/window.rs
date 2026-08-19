// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi(object)]
pub struct NativeWindowBoundsResult {
  pub x: i32,
  pub y: i32,
  pub width: u32,
  pub height: u32,
}

#[napi]
pub fn clamp_window_bounds_native(
  x: i32,
  y: i32,
  width: u32,
  height: u32,
  screen_width: u32,
  screen_height: u32,
) -> NativeWindowBoundsResult {
  let min_w = 800u32;
  let min_h = 600u32;

  let clamped_w = width.max(min_w).min(screen_width);
  let clamped_h = height.max(min_h).min(screen_height);

  let max_x = (screen_width as i32) - (clamped_w as i32);
  let max_y = (screen_height as i32) - (clamped_h as i32);

  let clamped_x = x.max(0).min(max_x.max(0));
  let clamped_y = y.max(0).min(max_y.max(0));

  NativeWindowBoundsResult {
    x: clamped_x,
    y: clamped_y,
    width: clamped_w,
    height: clamped_h,
  }
}
