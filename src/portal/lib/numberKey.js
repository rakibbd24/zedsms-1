// URL-safe form of a number id for /app/numbers/:numberKey —
// "private:12" <-> "private-12"; plain ids pass through unchanged
export const numberKeyOf = (id) => String(id).replace(":", "-");
export const numberIdOfKey = (key) => key.replace("-", ":");
