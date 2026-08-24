// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi(object)]
pub struct PaletteSearchItem {
  pub id: String,
  pub title: String,
  pub subtitle: Option<String>,
  pub category: String,
  pub icon: Option<String>,
  pub action: Option<String>,
  pub payload: Option<String>,
}

#[napi(object)]
pub struct PaletteSearchResult {
  pub item: PaletteSearchItem,
  pub score: f64,
}

fn fuzzy_score(query: &str, text: &str) -> Option<f64> {
  let q = query.to_lowercase();
  let t = text.to_lowercase();

  if q.is_empty() {
    return Some(0.0);
  }
  if t == q {
    return Some(100.0);
  }
  if t.starts_with(&q) {
    return Some(80.0 + (q.len() as f64 / t.len() as f64) * 10.0);
  }
  if t.contains(&q) {
    return Some(50.0 + (q.len() as f64 / t.len() as f64) * 10.0);
  }

  // Subsequence match
  let mut q_chars = q.chars().peekable();
  let mut score = 0.0;
  let mut last_idx = 0;

  for (idx, ch) in t.chars().enumerate() {
    if let Some(&target) = q_chars.peek() {
      if ch == target {
        q_chars.next();
        score += 10.0;
        if idx == last_idx + 1 {
          score += 5.0; // consecutive bonus
        }
        last_idx = idx;
      }
    }
  }

  if q_chars.peek().is_none() {
    Some(score)
  } else {
    None
  }
}

#[napi]
pub fn palette_fuzzy_search(
  query: String,
  items: Vec<PaletteSearchItem>,
  limit: Option<u32>,
) -> Vec<PaletteSearchResult> {
  let trimmed_q = query.trim();
  let max_results = limit.unwrap_or(20) as usize;

  let mut scored: Vec<PaletteSearchResult> = items
    .into_iter()
    .filter_map(|item| {
      let title_score = fuzzy_score(trimmed_q, &item.title);
      let subtitle_score = item
        .subtitle
        .as_ref()
        .and_then(|s| fuzzy_score(trimmed_q, s))
        .map(|s| s * 0.7);

      let final_score = match (title_score, subtitle_score) {
        (Some(t), Some(s)) => Some(t.max(s)),
        (Some(t), None) => Some(t),
        (None, Some(s)) => Some(s),
        (None, None) => None,
      };

      final_score.map(|score| PaletteSearchResult { item, score })
    })
    .collect();

  scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
  scored.truncate(max_results);
  scored
}
