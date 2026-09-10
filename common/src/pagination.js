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

/**
 * Express middleware that intercepts JSON responses and adds a HATEOAS `next` link
 * to any payload that contains `pagination.nextCursor`.
 */
function paginationLinker(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && body.pagination && body.pagination.nextCursor) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const url = new URL(req.originalUrl, `${protocol}://${host}`);
        url.searchParams.set('cursor', body.pagination.nextCursor);
        body.pagination.next = url.pathname + url.search;
      } catch (err) {
        // ignore malformed URLs, shouldn't fail the response
      }
    }
    return originalJson(body);
  };
  next();
}

module.exports = { encodeCursor, decodeCursor, paginate, paginationLinker };
