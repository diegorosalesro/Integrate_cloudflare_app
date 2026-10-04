import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { afterEach, describe, it, expect, vi } from "vitest";
import worker from "../src";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Hello World user worker", () => {
	describe("request for /message", () => {
		it('/ responds with "Hello, World!" (unit style)', async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/message"
			);
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});

		it('responds with "Hello, World!" (integration style)', async () => {
			const request = new Request("http://example.com/message");
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});
	});

	describe("request for /random", () => {
		it("/ responds with a random UUID (unit style)", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/random"
			);
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatch(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
			);
		});

		it("responds with a random UUID (integration style)", async () => {
			const request = new Request("http://example.com/random");
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
			);
		});
	});

	describe("request for /health", () => {
		it("returns an OK status and an ISO timestamp", async () => {
			const response = await worker.fetch(
				new Request("http://example.com/health"),
				env,
				createExecutionContext()
			);
			const body = (await response.json()) as {
				status: string;
				timestamp: string;
			};

			expect(response.status).toBe(200);
			expect(body.status).toBe("ok");
			expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
		});
	});

	describe("request for /usuarios", () => {
		it("returns users from D1", async () => {
			const statement = env.DB.prepare("SELECT * FROM usuarios");
			vi.spyOn(env.DB, "prepare").mockReturnValue(statement);
			vi.spyOn(statement, "all").mockResolvedValue({
				results: [{ id: 1, nombre: "Diego", email: "diego@ejemplo.com" }],
				success: true,
				meta: {
					duration: 0,
					size_after: 0,
					rows_read: 1,
					rows_written: 0,
					last_row_id: 0,
					changed_db: false,
					changes: 0,
				},
			});

			const response = await worker.fetch(
				new Request("http://example.com/usuarios"),
				env,
				createExecutionContext()
			);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual([
				{ id: 1, nombre: "Diego", email: "diego@ejemplo.com" },
			]);
		});

		it("returns an error when D1 cannot be queried", async () => {
			const statement = env.DB.prepare("SELECT * FROM usuarios");
			vi.spyOn(env.DB, "prepare").mockReturnValue(statement);
			vi.spyOn(statement, "all").mockRejectedValue(
				new Error("Database unavailable")
			);

			const response = await worker.fetch(
				new Request("http://example.com/usuarios"),
				env,
				createExecutionContext()
			);

			expect(response.status).toBe(500);
			expect(await response.text()).toBe("Error al consultar D1");
		});
	});

	it("returns 404 for an unknown route", async () => {
		const response = await worker.fetch(
			new Request("http://example.com/not-found"),
			env,
			createExecutionContext()
		);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not Found");
	});
});
