// Full ISO-3166 country list (name, cca2 code, emoji flag). Generated from the
// `world-countries` package via `node scripts/generate-countries.cjs` — see that file
// to regenerate. Kept as a flat checked-in file instead of importing the package at
// runtime, since the raw package includes every field (currencies, borders, translations...)
// and would otherwise bloat the app bundle just to get name/code/flag.
import { allCountries, type WorldCountry } from "./countries.generated";

export { allCountries, type WorldCountry };
