import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { api } from "../src/api.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockFetch(status, body) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(body === undefined ? null : body, { status });
  };
  return calls;
}

test("1. GET 200 tra ve du lieu JSON", async () => {
  const calls = mockFetch(200, JSON.stringify([{ class_id: "WEB-01" }]));
  const data = await api("/sections");
  assert.deepEqual(data, [{ class_id: "WEB-01" }]);
  assert.equal(calls[0].url, "http://127.0.0.1:8000/sections");
  assert.equal(calls[0].options.method, "GET");
});

test("2. POST gui JSON dung hai truong va header Content-Type", async () => {
  const calls = mockFetch(201, JSON.stringify({ message: "Dang ky thanh cong" }));
  await api("/enrollments", {
    method: "POST",
    body: { student_id: "22000004", class_section_id: "WEB-01" },
  });
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    student_id: "22000004",
    class_section_id: "WEB-01",
  });
});

test("3. DELETE 204 khong co body tra ve null", async () => {
  mockFetch(204);
  const data = await api("/enrollments/22000004/WEB-01", { method: "DELETE" });
  assert.equal(data, null);
});

test("4. 409 giu nguyen status va detail", async () => {
  mockFetch(409, JSON.stringify({ detail: "Lop hoc phan da het cho" }));
  await assert.rejects(
    () => api("/enrollments", { method: "POST", body: {} }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /409.*het cho/);
      return true;
    },
  );
});

test("5. 422 detail dang danh sach duoc ghep thanh chuoi", async () => {
  mockFetch(422, JSON.stringify({ detail: [{ msg: "Field required" }, { msg: "Sai kieu" }] }));
  await assert.rejects(
    () => api("/enrollments", { method: "POST", body: {} }),
    (error) => {
      assert.equal(error.status, 422);
      assert.match(error.message, /Field required; Sai kieu/);
      return true;
    },
  );
});

test("6. 404 tra ve loi co status 404", async () => {
  mockFetch(404, JSON.stringify({ detail: "Khong tim thay sinh vien" }));
  await assert.rejects(
    () => api("/students/99999999/enrollments"),
    (error) => error.status === 404,
  );
});

test("7. Mat ket noi: thong bao loi de hieu, khong co status", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(
    () => api("/sections"),
    (error) => {
      assert.match(error.message, /Backend\/CORS/);
      assert.equal(error.status, undefined);
      return true;
    },
  );
});

test("8. Phan hoi khong phai JSON bao loi ro rang", async () => {
  mockFetch(200, "<html>khong phai json</html>");
  await assert.rejects(() => api("/sections"), /không phải JSON/);
});

test("9. AbortError duoc nem lai nguyen ven", async () => {
  globalThis.fetch = async () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    throw error;
  };
  await assert.rejects(() => api("/sections"), (error) => error.name === "AbortError");
});