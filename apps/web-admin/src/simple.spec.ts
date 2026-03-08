import { describe, expect, it } from "vitest";

describe("Simple Test Example", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should work with strings", () => {
    expect("hello").toBe("hello");
  });

  it("should work with objects", () => {
    const user = { name: "Test", email: "test@example.com" };
    expect(user.name).toBe("Test");
    expect(user.email).toContain("@");
  });
});
