import { trimFormData, withTrimming } from '@/utils/form/trimFormData';

describe('trimFormData', () => {
  it('trims string values', () => {
    expect(trimFormData({ username: '  john  ', email: '\tjohn@example.com\n' })).toEqual({
      username: 'john',
      email: 'john@example.com',
    });
  });

  it('leaves the default password fields untouched', () => {
    const data = {
      password: '  p1  ',
      confirmPassword: '  p2  ',
      newPassword: '  p3  ',
      passwordConfirmation: '  p4  ',
    };

    expect(trimFormData(data)).toEqual(data);
  });

  it('replaces the default exclusions when a custom list is given', () => {
    expect(trimFormData({ password: '  pw  ', note: '  keep  ' }, ['note'])).toEqual({
      password: 'pw',
      note: '  keep  ',
    });
  });

  it('trims nested objects and applies exclusions inside them', () => {
    expect(trimFormData({ profile: { name: '  Ann ', password: ' secret ' } })).toEqual({
      profile: { name: 'Ann', password: ' secret ' },
    });
  });

  it('leaves arrays, dates, numbers, booleans and nulls alone', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    const result = trimFormData({
      tags: ['  a  '],
      when: date,
      count: 3,
      active: false,
      empty: null,
      missing: undefined,
    });

    expect(result.tags).toEqual(['  a  ']);
    expect(result.when).toBe(date);
    expect(result.count).toBe(3);
    expect(result.active).toBe(false);
    expect(result.empty).toBeNull();
    expect('missing' in result).toBe(true);
  });

  it('does not mutate the input', () => {
    const data = { username: '  john  ', nested: { name: ' x ' } };
    trimFormData(data);

    expect(data).toEqual({ username: '  john  ', nested: { name: ' x ' } });
  });

  it('returns non-object input as-is', () => {
    expect(trimFormData(null as never)).toBeNull();
  });
});

describe('withTrimming', () => {
  it('calls the handler with trimmed data and returns its result', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = withTrimming(handler);

    await wrapped({ username: ' bob ', password: ' pw ' });

    expect(handler).toHaveBeenCalledWith({ username: 'bob', password: ' pw ' });
  });

  it('passes custom exclusions through', () => {
    const handler = jest.fn();

    withTrimming(handler, ['code'])({ code: ' 123 ', name: ' n ' });

    expect(handler).toHaveBeenCalledWith({ code: ' 123 ', name: 'n' });
  });

  it('propagates the handler promise', async () => {
    const wrapped = withTrimming(() => Promise.reject(new Error('nope')));

    await expect(wrapped({ a: ' b ' })).rejects.toThrow('nope');
  });
});
