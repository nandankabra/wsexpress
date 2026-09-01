function encodeCursor(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch (err) {
    return null;
  }
}

/**
 * Builds a cursor-paginated response envelope.
 * @param {Array} items - one extra item beyond `limit` fetched by the caller, used to detect hasMore
 * @param {number} limit
 * @param {(item: any) => any} cursorFor - extracts the cursor payload (e.g. { id, createdAt }) from an item
 */
function paginate(items, limit, cursorFor) {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return {
    data: page,
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore ? encodeCursor(cursorFor(page[page.length - 1])) : null,
    },
  };
}

module.exports = { encodeCursor, decodeCursor, paginate };
