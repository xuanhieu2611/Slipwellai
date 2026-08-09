/**
 * Prettier configuration.
 *
 * `printWidth` is raised from the default 80 to 100: this codebase already
 * predominantly writes wider lines (JSX props, long Supabase query chains),
 * and 100 keeps the formatting baseline close to the code as it already
 * reads instead of forcing wide-scale rewrapping. Every other option is
 * Prettier's default, matching the double-quote/semicolon/trailing-comma
 * style already used throughout `src/`.
 */
const config = {
  printWidth: 100,
};

export default config;
