// Minimal Worker env typing for this repo.
// Generated typing via `wrangler types` is optional; this keeps TS happy in CI.

interface Env {
  ASSETS: Fetcher;
  ARTICLES: R2Bucket;
  /**
   * Optional: protect uploads.
   * If set, the UI must send `Authorization: Bearer <token>`.
   */
  UPLOAD_TOKEN?: string;
}
