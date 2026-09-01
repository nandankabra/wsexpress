const { encodeCursor, decodeCursor, paginate } = require('../src/pagination');

describe('pagination', () => {
  test('round-trips a cursor', () => {
    const cursor = encodeCursor({ id: 42 });
    expect(decodeCursor(cursor)).toEqual({ id: 42 });
  });

  test('returns null for a garbage cursor', () => {
    expect(decodeCursor('not-base64-json')).toBeNull();
  });

  test('flags hasMore when items exceed the limit', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = paginate(items, 2, (item) => ({ id: item.id }));
    expect(result.data).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(true);
    expect(decodeCursor(result.pagination.nextCursor)).toEqual({ id: 2 });
  });

  test('does not flag hasMore when items fit within the limit', () => {
    const items = [{ id: 1 }];
    const result = paginate(items, 2, (item) => ({ id: item.id }));
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });
});
