/**
 * Shared helpers for the API route tests.
 *
 * These routes are Next.js App Router handlers, not Express, so Supertest
 * doesn't apply — a handler is just `(Request) => Promise<Response>`. We call
 * it directly with a real `Request`, which exercises the identical code path a
 * live HTTP request takes, minus the network.
 */

export function jsonRequest(
  url: string,
  body: Record<string, unknown>,
  method = "POST"
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

/** A minimal stand-in for a Mongoose document with a chainable `.save()`. */
export interface MockDoc {
  [key: string]: unknown;
  save: jest.Mock;
}

export function mockDoc(fields: Record<string, unknown> = {}): MockDoc {
  const doc: MockDoc = {
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
    ...fields,
  };
  return doc;
}

/** Mimics Mongoose's `.select()` / `.sort()` chain terminating in a promise. */
export function chainable<T>(result: T) {
  const chain: Record<string, unknown> = {
    select: jest.fn(() => chain),
    sort: jest.fn(() => chain),
    populate: jest.fn(() => chain),
    session: jest.fn(() => chain),
    lean: jest.fn(() => chain),
    then: (resolve: (v: T) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}
