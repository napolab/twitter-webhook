import { describe, expect, it } from "vitest";
import { isRPCMessage, isSerializedRequest, isSerializedResponse } from "./messages";

describe("isSerializedResponse", () => {
  it("accepts a valid serialized response", () => {
    expect(isSerializedResponse({ status: 200, headers: [], body: "" })).toBe(true);
    expect(
      isSerializedResponse({ status: 204, headers: [["content-type", "text/plain"]], body: "x" }),
    ).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isSerializedResponse(null)).toBe(false);
    expect(isSerializedResponse(undefined)).toBe(false);
    expect(isSerializedResponse("status")).toBe(false);
    expect(isSerializedResponse(42)).toBe(false);
  });

  it("rejects missing or wrong-typed fields", () => {
    expect(isSerializedResponse({ headers: [], body: "" })).toBe(false);
    expect(isSerializedResponse({ status: "200", headers: [], body: "" })).toBe(false);
    expect(isSerializedResponse({ status: 200, headers: "none", body: "" })).toBe(false);
    expect(isSerializedResponse({ status: 200, headers: [], body: 1 })).toBe(false);
  });
});

describe("isSerializedRequest", () => {
  it("accepts a valid serialized request with a body", () => {
    expect(
      isSerializedRequest({
        url: "http://extension.internal/rpc/webhooks",
        method: "POST",
        headers: [["content-type", "application/json"]],
        body: "{}",
      }),
    ).toBe(true);
  });

  it("accepts a valid serialized request with an undefined body", () => {
    expect(
      isSerializedRequest({
        url: "http://extension.internal/rpc/webhooks",
        method: "GET",
        headers: [],
        body: undefined,
      }),
    ).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isSerializedRequest(null)).toBe(false);
    expect(isSerializedRequest(42)).toBe(false);
  });

  it("rejects missing or wrong-typed fields", () => {
    expect(isSerializedRequest({ method: "GET", headers: [], body: undefined })).toBe(false);
    expect(isSerializedRequest({ url: 1, method: "GET", headers: [], body: undefined })).toBe(
      false,
    );
    expect(isSerializedRequest({ url: "u", method: 1, headers: [], body: undefined })).toBe(false);
    expect(isSerializedRequest({ url: "u", method: "GET", headers: "none", body: undefined })).toBe(
      false,
    );
    expect(isSerializedRequest({ url: "u", method: "GET", headers: [], body: 1 })).toBe(false);
  });
});

describe("isRPCMessage", () => {
  it("accepts a message with a valid request", () => {
    expect(
      isRPCMessage({
        type: "hono-rpc",
        request: { url: "u", method: "GET", headers: [], body: undefined },
      }),
    ).toBe(true);
  });

  it("rejects a message with the right tag but no valid request", () => {
    expect(isRPCMessage({ type: "hono-rpc" })).toBe(false);
    expect(isRPCMessage({ type: "hono-rpc", request: null })).toBe(false);
    expect(isRPCMessage({ type: "hono-rpc", request: { url: "u" } })).toBe(false);
  });

  it("rejects messages with the wrong tag or non-objects", () => {
    expect(isRPCMessage({ type: "other" })).toBe(false);
    expect(isRPCMessage(null)).toBe(false);
    expect(isRPCMessage("hono-rpc")).toBe(false);
  });
});
