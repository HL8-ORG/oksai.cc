globalThis.__nitro_main__ = import.meta.url;
import { n as __exportAll } from "./_runtime.mjs";
import { a as toEventHandler, i as defineLazyEventHandler, n as HTTPError, o as toRequest, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import "./_libs/hookable.mjs";
import nodeHTTP from "node:http";
import { Readable } from "node:stream";
import nodeHTTPS from "node:https";
import nodeHTTP2 from "node:http2";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
function lazyInherit(target, source, sourceKey) {
	for (const key of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
		if (key === "constructor") continue;
		const targetDesc = Object.getOwnPropertyDescriptor(target, key);
		const desc = Object.getOwnPropertyDescriptor(source, key);
		let modified = false;
		if (desc.get) {
			modified = true;
			desc.get = targetDesc?.get || function() {
				return this[sourceKey][key];
			};
		}
		if (desc.set) {
			modified = true;
			desc.set = targetDesc?.set || function(value) {
				this[sourceKey][key] = value;
			};
		}
		if (!targetDesc?.value && typeof desc.value === "function") {
			modified = true;
			desc.value = function(...args) {
				return this[sourceKey][key](...args);
			};
		}
		if (modified) Object.defineProperty(target, key, desc);
	}
}
/**
* URL wrapper with fast paths to access to the following props:
*
*  - `url.pathname`
*  - `url.search`
*  - `url.searchParams`
*  - `url.protocol`
*
* **NOTES:**
*
* - It is assumed that the input URL is **already encoded** and formatted from an HTTP request and contains no hash.
* - Triggering the setters or getters on other props will deoptimize to full URL parsing.
* - Changes to `searchParams` will be discarded as we don't track them.
*/
var FastURL = /* @__PURE__ */ (() => {
	const NativeURL = globalThis.URL;
	const FastURL$1 = class URL {
		#url;
		#href;
		#protocol;
		#host;
		#pathname;
		#search;
		#searchParams;
		#pos;
		constructor(url) {
			if (typeof url === "string") this.#href = url;
			else {
				this.#protocol = url.protocol;
				this.#host = url.host;
				this.#pathname = url.pathname;
				this.#search = url.search;
			}
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeURL;
		}
		get _url() {
			if (this.#url) return this.#url;
			this.#url = new NativeURL(this.href);
			this.#href = void 0;
			this.#protocol = void 0;
			this.#host = void 0;
			this.#pathname = void 0;
			this.#search = void 0;
			this.#searchParams = void 0;
			this.#pos = void 0;
			return this.#url;
		}
		get href() {
			if (this.#url) return this.#url.href;
			if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
			return this.#href;
		}
		#getPos() {
			if (!this.#pos) {
				const url = this.href;
				const protoIndex = url.indexOf("://");
				const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
				this.#pos = [
					protoIndex,
					pathnameIndex,
					pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex)
				];
			}
			return this.#pos;
		}
		get pathname() {
			if (this.#url) return this.#url.pathname;
			if (this.#pathname === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.pathname;
				this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
			}
			return this.#pathname;
		}
		get search() {
			if (this.#url) return this.#url.search;
			if (this.#search === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.search;
				const url = this.href;
				this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
			}
			return this.#search;
		}
		get searchParams() {
			if (this.#url) return this.#url.searchParams;
			if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
			return this.#searchParams;
		}
		get protocol() {
			if (this.#url) return this.#url.protocol;
			if (this.#protocol === void 0) {
				const [protocolIndex] = this.#getPos();
				if (protocolIndex === -1) return this._url.protocol;
				this.#protocol = this.href.slice(0, protocolIndex + 1);
			}
			return this.#protocol;
		}
		toString() {
			return this.href;
		}
		toJSON() {
			return this.href;
		}
	};
	lazyInherit(FastURL$1.prototype, NativeURL.prototype, "_url");
	Object.setPrototypeOf(FastURL$1.prototype, NativeURL.prototype);
	Object.setPrototypeOf(FastURL$1, NativeURL);
	return FastURL$1;
})();
function resolvePortAndHost(opts) {
	const _port = opts.port ?? globalThis.process?.env.PORT ?? 3e3;
	const port = typeof _port === "number" ? _port : Number.parseInt(_port, 10);
	if (port < 0 || port > 65535) throw new RangeError(`Port must be between 0 and 65535 (got "${port}").`);
	return {
		port,
		hostname: opts.hostname ?? globalThis.process?.env.HOST
	};
}
function fmtURL(host, port, secure) {
	if (!host || !port) return;
	if (host.includes(":")) host = `[${host}]`;
	return `http${secure ? "s" : ""}://${host}:${port}/`;
}
function printListening(opts, url) {
	if (!url || (opts.silent ?? globalThis.process?.env?.TEST)) return;
	let additionalInfo = "";
	try {
		const _url = new URL(url);
		if (_url.hostname === "[::]" || _url.hostname === "0.0.0.0") {
			_url.hostname = "localhost";
			url = _url.href;
			additionalInfo = " (all interfaces)";
		}
	} catch {}
	let listeningOn = `➜ Listening on:`;
	if (globalThis.process.stdout?.isTTY) {
		listeningOn = `\u001B[32m${listeningOn}\u001B[0m`;
		url = `\u001B[36m${url}\u001B[0m`;
		additionalInfo = `\u001B[2m${additionalInfo}\u001B[0m`;
	}
	console.log(`${listeningOn} ${url}${additionalInfo}`);
}
function resolveTLSOptions(opts) {
	if (!opts.tls || opts.protocol === "http") return;
	const cert = resolveCertOrKey(opts.tls.cert);
	const key = resolveCertOrKey(opts.tls.key);
	if (!cert && !key) {
		if (opts.protocol === "https") throw new TypeError("TLS `cert` and `key` must be provided for `https` protocol.");
		return;
	}
	if (!cert || !key) throw new TypeError("TLS `cert` and `key` must be provided together.");
	return {
		cert,
		key,
		passphrase: opts.tls.passphrase
	};
}
function resolveCertOrKey(value) {
	if (!value) return;
	if (typeof value !== "string") throw new TypeError("TLS certificate and key must be strings in PEM format or file paths.");
	if (value.startsWith("-----BEGIN ")) return value;
	const { readFileSync } = process.getBuiltinModule("node:fs");
	return readFileSync(value, "utf8");
}
function createWaitUntil() {
	const promises = /* @__PURE__ */ new Set();
	return {
		waitUntil: (promise) => {
			if (typeof promise?.then !== "function") return;
			promises.add(Promise.resolve(promise).catch(console.error).finally(() => {
				promises.delete(promise);
			}));
		},
		wait: () => {
			return Promise.all(promises);
		}
	};
}
var noColor = /* @__PURE__ */ (() => {
	const env = globalThis.process?.env ?? {};
	return env.NO_COLOR === "1" || env.TERM === "dumb";
})();
var _c = (c, r = 39) => (t) => noColor ? t : `\u001B[${c}m${t}\u001B[${r}m`;
var red = /* @__PURE__ */ _c(31);
var gray = /* @__PURE__ */ _c(90);
function wrapFetch(server) {
	const fetchHandler = server.options.fetch;
	const middleware = server.options.middleware || [];
	return middleware.length === 0 ? fetchHandler : (request) => callMiddleware(request, fetchHandler, middleware, 0);
}
function callMiddleware(request, fetchHandler, middleware, index) {
	if (index === middleware.length) return fetchHandler(request);
	return middleware[index](request, () => callMiddleware(request, fetchHandler, middleware, index + 1));
}
var errorPlugin = (server) => {
	const errorHandler = server.options.error;
	if (!errorHandler) return;
	server.options.middleware.unshift((_req, next) => {
		try {
			const res = next();
			return res instanceof Promise ? res.catch((error) => errorHandler(error)) : res;
		} catch (error) {
			return errorHandler(error);
		}
	});
};
var gracefulShutdownPlugin = (server) => {
	const config = server.options?.gracefulShutdown;
	if (!globalThis.process?.on || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
	const gracefulShutdown = config === true || !config?.gracefulTimeout ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 3 : config.gracefulTimeout;
	const forceShutdown = config === true || !config?.forceTimeout ? Number.parseInt(process.env.SERVER_FORCE_SHUTDOWN_TIMEOUT || "") || 5 : config.forceTimeout;
	let isShuttingDown = false;
	let forceClose;
	const shutdown = async () => {
		if (isShuttingDown) {
			forceClose?.();
			return;
		}
		isShuttingDown = true;
		const w = process.stderr.write.bind(process.stderr);
		w(gray(`\nShutting down server in ${gracefulShutdown}s... (press Ctrl+C again to force close)`));
		let timeout;
		await Promise.race([server.close().finally(() => {
			clearTimeout(timeout);
			w(gray(" Server closed.\n"));
		}), new Promise((resolve) => {
			forceClose = () => {
				clearTimeout(timeout);
				w(gray("\nForce closing...\n"));
				server.close(true);
				resolve();
			};
			timeout = setTimeout(() => {
				w(gray(`\nForce closing connections in ${forceShutdown}s...`));
				timeout = setTimeout(() => {
					w(red("\nCould not close connections in time, force exiting."));
					resolve();
				}, forceShutdown * 1e3);
				return server.close(true);
			}, gracefulShutdown * 1e3);
		})]);
		globalThis.process.exit(0);
	};
	for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};
/**
* Fast Response for Node.js runtime
*
* It is faster because in most cases it doesn't create a full Response instance.
*/
var NodeResponse = /* @__PURE__ */ (() => {
	const NativeResponse = globalThis.Response;
	const STATUS_CODES = globalThis.process?.getBuiltinModule?.("node:http")?.STATUS_CODES || {};
	class NodeResponse$1 {
		#body;
		#init;
		#headers;
		#response;
		constructor(body, init) {
			this.#body = body;
			this.#init = init;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeResponse;
		}
		get status() {
			return this.#response?.status || this.#init?.status || 200;
		}
		get statusText() {
			return this.#response?.statusText || this.#init?.statusText || STATUS_CODES[this.status] || "";
		}
		get headers() {
			if (this.#response) return this.#response.headers;
			if (this.#headers) return this.#headers;
			const initHeaders = this.#init?.headers;
			return this.#headers = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders);
		}
		get ok() {
			if (this.#response) return this.#response.ok;
			const status = this.status;
			return status >= 200 && status < 300;
		}
		get _response() {
			if (this.#response) return this.#response;
			this.#response = new NativeResponse(this.#body, this.#headers ? {
				...this.#init,
				headers: this.#headers
			} : this.#init);
			this.#init = void 0;
			this.#headers = void 0;
			this.#body = void 0;
			return this.#response;
		}
		_toNodeResponse() {
			const status = this.status;
			const statusText = this.statusText;
			let body;
			let contentType;
			let contentLength;
			if (this.#response) body = this.#response.body;
			else if (this.#body) if (this.#body instanceof ReadableStream) body = this.#body;
			else if (typeof this.#body === "string") {
				body = this.#body;
				contentType = "text/plain; charset=UTF-8";
				contentLength = Buffer.byteLength(this.#body);
			} else if (this.#body instanceof ArrayBuffer) {
				body = Buffer.from(this.#body);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Uint8Array) {
				body = this.#body;
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof DataView) {
				body = Buffer.from(this.#body.buffer);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Blob) {
				body = this.#body.stream();
				contentType = this.#body.type;
				contentLength = this.#body.size;
			} else if (typeof this.#body.pipe === "function") body = this.#body;
			else body = this._response.body;
			const headers = [];
			const initHeaders = this.#init?.headers;
			const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders).map(([k, v]) => [k.toLowerCase(), v]) : void 0);
			let hasContentTypeHeader;
			let hasContentLength;
			if (headerEntries) for (const [key, value] of headerEntries) {
				if (Array.isArray(value)) for (const v of value) headers.push([key, v]);
				else headers.push([key, value]);
				if (key === "content-type") hasContentTypeHeader = true;
				else if (key === "content-length") hasContentLength = true;
			}
			if (contentType && !hasContentTypeHeader) headers.push(["content-type", contentType]);
			if (contentLength && !hasContentLength) headers.push(["content-length", String(contentLength)]);
			this.#init = void 0;
			this.#headers = void 0;
			this.#response = void 0;
			this.#body = void 0;
			return {
				status,
				statusText,
				headers,
				body
			};
		}
	}
	lazyInherit(NodeResponse$1.prototype, NativeResponse.prototype, "_response");
	Object.setPrototypeOf(NodeResponse$1, NativeResponse);
	Object.setPrototypeOf(NodeResponse$1.prototype, NativeResponse.prototype);
	return NodeResponse$1;
})();
async function sendNodeResponse(nodeRes, webRes) {
	if (!webRes) {
		nodeRes.statusCode = 500;
		return endNodeResponse(nodeRes);
	}
	if (webRes._toNodeResponse) {
		const res = webRes._toNodeResponse();
		writeHead(nodeRes, res.status, res.statusText, res.headers);
		if (res.body) {
			if (res.body instanceof ReadableStream) return streamBody(res.body, nodeRes);
			else if (typeof res.body?.pipe === "function") {
				res.body.pipe(nodeRes);
				return new Promise((resolve) => nodeRes.on("close", resolve));
			}
			nodeRes.write(res.body);
		}
		return endNodeResponse(nodeRes);
	}
	const rawHeaders = [...webRes.headers];
	writeHead(nodeRes, webRes.status, webRes.statusText, rawHeaders);
	return webRes.body ? streamBody(webRes.body, nodeRes) : endNodeResponse(nodeRes);
}
function writeHead(nodeRes, status, statusText, rawHeaders) {
	const writeHeaders = globalThis.Deno ? rawHeaders : rawHeaders.flat();
	if (!nodeRes.headersSent) if (nodeRes.req?.httpVersion === "2.0") nodeRes.writeHead(status, writeHeaders);
	else nodeRes.writeHead(status, statusText, writeHeaders);
}
function endNodeResponse(nodeRes) {
	return new Promise((resolve) => nodeRes.end(resolve));
}
function streamBody(stream, nodeRes) {
	if (nodeRes.destroyed) {
		stream.cancel();
		return;
	}
	const reader = stream.getReader();
	function streamCancel(error) {
		reader.cancel(error).catch(() => {});
		if (error) nodeRes.destroy(error);
	}
	function streamHandle({ done, value }) {
		try {
			if (done) nodeRes.end();
			else if (nodeRes.write(value)) reader.read().then(streamHandle, streamCancel);
			else nodeRes.once("drain", () => reader.read().then(streamHandle, streamCancel));
		} catch (error) {
			streamCancel(error instanceof Error ? error : void 0);
		}
	}
	nodeRes.on("close", streamCancel);
	nodeRes.on("error", streamCancel);
	reader.read().then(streamHandle, streamCancel);
	return reader.closed.catch(streamCancel).finally(() => {
		nodeRes.off("close", streamCancel);
		nodeRes.off("error", streamCancel);
	});
}
var NodeRequestURL = class extends FastURL {
	#req;
	constructor({ req }) {
		const path = req.url || "/";
		if (path[0] === "/") {
			const qIndex = path.indexOf("?");
			const pathname = qIndex === -1 ? path : path?.slice(0, qIndex) || "/";
			const search = qIndex === -1 ? "" : path?.slice(qIndex) || "";
			const host = req.headers.host || req.headers[":authority"] || `${req.socket.localFamily === "IPv6" ? "[" + req.socket.localAddress + "]" : req.socket.localAddress}:${req.socket?.localPort || "80"}`;
			const protocol = req.socket?.encrypted || req.headers["x-forwarded-proto"] === "https" || req.headers[":scheme"] === "https" ? "https:" : "http:";
			super({
				protocol,
				host,
				pathname,
				search
			});
		} else super(path);
		this.#req = req;
	}
	get pathname() {
		return super.pathname;
	}
	set pathname(value) {
		this._url.pathname = value;
		this.#req.url = this._url.pathname + this._url.search;
	}
};
var NodeRequestHeaders = /* @__PURE__ */ (() => {
	const NativeHeaders = globalThis.Headers;
	class Headers {
		#req;
		#headers;
		constructor(req) {
			this.#req = req;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeHeaders;
		}
		get _headers() {
			if (!this.#headers) {
				const headers = new NativeHeaders();
				const rawHeaders = this.#req.rawHeaders;
				const len = rawHeaders.length;
				for (let i = 0; i < len; i += 2) {
					const key = rawHeaders[i];
					if (key.charCodeAt(0) === 58) continue;
					const value = rawHeaders[i + 1];
					headers.append(key, value);
				}
				this.#headers = headers;
			}
			return this.#headers;
		}
		get(name) {
			if (this.#headers) return this.#headers.get(name);
			const value = this.#req.headers[name.toLowerCase()];
			return Array.isArray(value) ? value.join(", ") : value || null;
		}
		has(name) {
			if (this.#headers) return this.#headers.has(name);
			return name.toLowerCase() in this.#req.headers;
		}
		getSetCookie() {
			if (this.#headers) return this.#headers.getSetCookie();
			const value = this.#req.headers["set-cookie"];
			return Array.isArray(value) ? value : value ? [value] : [];
		}
		*_entries() {
			const rawHeaders = this.#req.rawHeaders;
			const len = rawHeaders.length;
			for (let i = 0; i < len; i += 2) {
				const key = rawHeaders[i];
				if (key.charCodeAt(0) === 58) continue;
				yield [key.toLowerCase(), rawHeaders[i + 1]];
			}
		}
		entries() {
			return this.#headers ? this.#headers.entries() : this._entries();
		}
		[Symbol.iterator]() {
			return this.entries();
		}
	}
	lazyInherit(Headers.prototype, NativeHeaders.prototype, "_headers");
	Object.setPrototypeOf(Headers, NativeHeaders);
	Object.setPrototypeOf(Headers.prototype, NativeHeaders.prototype);
	return Headers;
})();
var NodeRequest = /* @__PURE__ */ (() => {
	const NativeRequest = globalThis.Request;
	class Request {
		runtime;
		#req;
		#url;
		#bodyStream;
		#request;
		#headers;
		#abortController;
		constructor(ctx) {
			this.#req = ctx.req;
			this.runtime = {
				name: "node",
				node: ctx
			};
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeRequest;
		}
		get ip() {
			return this.#req.socket?.remoteAddress;
		}
		get method() {
			if (this.#request) return this.#request.method;
			return this.#req.method || "GET";
		}
		get _url() {
			return this.#url ||= new NodeRequestURL({ req: this.#req });
		}
		set _url(url) {
			this.#url = url;
		}
		get url() {
			if (this.#request) return this.#request.url;
			return this._url.href;
		}
		get headers() {
			if (this.#request) return this.#request.headers;
			return this.#headers ||= new NodeRequestHeaders(this.#req);
		}
		get _abortController() {
			if (!this.#abortController) {
				this.#abortController = new AbortController();
				const { req, res } = this.runtime.node;
				const abortController = this.#abortController;
				const abort = (err) => abortController.abort?.(err);
				if (res) res.once("close", () => {
					const reqError = req.errored;
					if (reqError) abort(reqError);
					else if (!res.writableEnded) abort();
				});
				else req.once("close", () => {
					if (!req.complete) abort();
				});
			}
			return this.#abortController;
		}
		get signal() {
			return this.#request ? this.#request.signal : this._abortController.signal;
		}
		get body() {
			if (this.#request) return this.#request.body;
			if (this.#bodyStream === void 0) {
				const method = this.method;
				this.#bodyStream = !(method === "GET" || method === "HEAD") ? Readable.toWeb(this.#req) : null;
			}
			return this.#bodyStream;
		}
		text() {
			if (this.#request) return this.#request.text();
			if (this.#bodyStream !== void 0) return this.#bodyStream ? new Response(this.#bodyStream).text() : Promise.resolve("");
			return readBody(this.#req).then((buf) => buf.toString());
		}
		json() {
			if (this.#request) return this.#request.json();
			return this.text().then((text) => JSON.parse(text));
		}
		get _request() {
			if (!this.#request) {
				const body = this.body;
				this.#request = new NativeRequest(this.url, {
					method: this.method,
					headers: this.headers,
					signal: this._abortController.signal,
					body,
					duplex: body ? "half" : void 0
				});
				this.#headers = void 0;
				this.#bodyStream = void 0;
			}
			return this.#request;
		}
	}
	lazyInherit(Request.prototype, NativeRequest.prototype, "_request");
	Object.setPrototypeOf(Request.prototype, NativeRequest.prototype);
	return Request;
})();
function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		const onData = (chunk) => {
			chunks.push(chunk);
		};
		const onError = (err) => {
			reject(err);
		};
		const onEnd = () => {
			req.off("error", onError);
			req.off("data", onData);
			resolve(Buffer.concat(chunks));
		};
		req.on("data", onData).once("end", onEnd).once("error", onError);
	});
}
function serve(options) {
	return new NodeServer(options);
}
var NodeServer = class {
	runtime = "node";
	options;
	node;
	serveOptions;
	fetch;
	#isSecure;
	#listeningPromise;
	#wait;
	constructor(options) {
		this.options = {
			...options,
			middleware: [...options.middleware || []]
		};
		for (const plugin of options.plugins || []) plugin(this);
		errorPlugin(this);
		gracefulShutdownPlugin(this);
		const fetchHandler = this.fetch = wrapFetch(this);
		this.#wait = createWaitUntil();
		const handler = (nodeReq, nodeRes) => {
			const request = new NodeRequest({
				req: nodeReq,
				res: nodeRes
			});
			request.waitUntil = this.#wait.waitUntil;
			const res = fetchHandler(request);
			return res instanceof Promise ? res.then((resolvedRes) => sendNodeResponse(nodeRes, resolvedRes)) : sendNodeResponse(nodeRes, res);
		};
		const tls = resolveTLSOptions(this.options);
		const { port, hostname: host } = resolvePortAndHost(this.options);
		this.serveOptions = {
			port,
			host,
			exclusive: !this.options.reusePort,
			...tls ? {
				cert: tls.cert,
				key: tls.key,
				passphrase: tls.passphrase
			} : {},
			...this.options.node
		};
		let server;
		this.#isSecure = !!this.serveOptions.cert && this.options.protocol !== "http";
		if (this.options.node?.http2 ?? this.#isSecure) if (this.#isSecure) server = nodeHTTP2.createSecureServer({
			allowHTTP1: true,
			...this.serveOptions
		}, handler);
		else throw new Error("node.http2 option requires tls certificate!");
		else if (this.#isSecure) server = nodeHTTPS.createServer(this.serveOptions, handler);
		else server = nodeHTTP.createServer(this.serveOptions, handler);
		this.node = {
			server,
			handler
		};
		if (!options.manual) this.serve();
	}
	serve() {
		if (this.#listeningPromise) return Promise.resolve(this.#listeningPromise).then(() => this);
		this.#listeningPromise = new Promise((resolve) => {
			this.node.server.listen(this.serveOptions, () => {
				printListening(this.options, this.url);
				resolve();
			});
		});
	}
	get url() {
		const addr = this.node?.server?.address();
		if (!addr) return;
		return typeof addr === "string" ? addr : fmtURL(addr.address, addr.port, this.#isSecure);
	}
	ready() {
		return Promise.resolve(this.#listeningPromise).then(() => this);
	}
	async close(closeAll) {
		await Promise.all([this.#wait.wait(), new Promise((resolve, reject) => {
			const server = this.node?.server;
			if (!server || !server.listening) return resolve();
			if (closeAll && "closeAllConnections" in server) server.closeAllConnections();
			server.close((error) => error ? reject(error) : resolve());
		})]);
	}
};
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
	const isSensitive = error.unhandled;
	const status = error.status || 500;
	const url = event.url || new URL(event.req.url);
	if (status === 404) {
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			statusText: "Found",
			headers: { location: `${baseURL}${url.pathname.slice(1)}${url.search}` },
			body: `Redirecting...`
		};
	}
	if (isSensitive && !opts?.silent) {
		const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
		console.error(`[request error] ${tags} [${event.req.method}] ${url}\n`, error);
	}
	const headers = {
		"content-type": "application/json",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
		"referrer-policy": "no-referrer",
		"content-security-policy": "script-src 'none'; frame-ancestors 'none';"
	};
	if (status === 404 || !event.res.headers.has("cache-control")) headers["cache-control"] = "no-cache";
	const body = {
		error: true,
		url: url.href,
		status,
		statusText: error.statusText,
		message: isSensitive ? "Server Error" : error.message,
		data: isSensitive ? void 0 : error.data
	};
	return {
		status,
		statusText: error.statusText,
		headers,
		body
	};
}
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
String.fromCharCode;
var ENC_SLASH_RE = /%2f/gi;
function decode(text = "") {
	try {
		return decodeURIComponent("" + text);
	} catch {
		return "" + text;
	}
}
function decodePath(text) {
	return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
var TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
var JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasTrailingSlash(input = "", respectQueryAndFragment) {
	if (!respectQueryAndFragment) return input.endsWith("/");
	return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
	if (!respectQueryAndFragment) return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
	if (!hasTrailingSlash(input, true)) return input || "/";
	let path = input;
	let fragment = "";
	const fragmentIndex = input.indexOf("#");
	if (fragmentIndex !== -1) {
		path = input.slice(0, fragmentIndex);
		fragment = input.slice(fragmentIndex);
	}
	const [s0, ...s] = path.split("?");
	return ((s0.endsWith("/") ? s0.slice(0, -1) : s0) || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
	if (!respectQueryAndFragment) return input.endsWith("/") ? input : input + "/";
	if (hasTrailingSlash(input, true)) return input || "/";
	let path = input;
	let fragment = "";
	const fragmentIndex = input.indexOf("#");
	if (fragmentIndex !== -1) {
		path = input.slice(0, fragmentIndex);
		fragment = input.slice(fragmentIndex);
		if (!path) return fragment;
	}
	const [s0, ...s] = path.split("?");
	return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
	return input.startsWith("/");
}
function withLeadingSlash(input = "") {
	return hasLeadingSlash(input) ? input : "/" + input;
}
function isNonEmptyURL(url) {
	return url && url !== "/";
}
function joinURL(base, ...input) {
	let url = base || "";
	for (const segment of input.filter((url2) => isNonEmptyURL(url2))) if (url) {
		const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
		url = withTrailingSlash(url) + _segment;
	} else url = segment;
	return url;
}
const headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
var public_assets_data_default = {
	"/assets/2fa-setup-BiDA9T7k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c7e-bcxASPQ+reXkmeoIEzPMMtxxKmg\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 7294,
		"path": "../public/assets/2fa-setup-BiDA9T7k.js"
	},
	"/assets/2fa-verify-VmIqFauc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e20-4ENgsOZX8Vxn2NvWnT6hcdnPjV4\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 3616,
		"path": "../public/assets/2fa-verify-VmIqFauc.js"
	},
	"/assets/B5PP2USH-CvCgIvRK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1df-74A0V+8NPl04t7upjpt/cd70M70\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 479,
		"path": "../public/assets/B5PP2USH-CvCgIvRK.js"
	},
	"/assets/HNLWDMU5-CVR0SuCv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37066-43/iHSWTm49QhVE2+Vter5Wv0e4\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 225382,
		"path": "../public/assets/HNLWDMU5-CVR0SuCv.js"
	},
	"/assets/WI32IQVE-BNCcM9XS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"245-mnEvmZPQPTKc1oDVbNtOjw283ik\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 581,
		"path": "../public/assets/WI32IQVE-BNCcM9XS.js"
	},
	"/assets/_provider-ChWriSt7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f07-rTOe+jKls+Tnz0mI+7mBmWoXRPA\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 3847,
		"path": "../public/assets/_provider-ChWriSt7.js"
	},
	"/assets/auth-client-DspwL_Kq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c6b2-o+VIfNN5dCh/9CIqPBwLd81XSh8\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 116402,
		"path": "../public/assets/auth-client-DspwL_Kq.js"
	},
	"/assets/button-7TSr3Y07.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bf7-Ee/Eb8hvwwqlT/e3tcloxnyYjgQ\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 3063,
		"path": "../public/assets/button-7TSr3Y07.js"
	},
	"/assets/dashboard-BioYk9L1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c3d-Bfkg9I8gG0a5AmEADKphzRdgWg8\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 3133,
		"path": "../public/assets/dashboard-BioYk9L1.js"
	},
	"/assets/dist-B6k3JDBa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4a0b-sfT2oIxhn4WnTJ7aWLYxyo0gcN8\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 18955,
		"path": "../public/assets/dist-B6k3JDBa.js"
	},
	"/assets/forgot-password-D-hUHp73.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12c8-JQiL3/+Q0uAe9qUTvUUQpra9cVc\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 4808,
		"path": "../public/assets/forgot-password-D-hUHp73.js"
	},
	"/assets/jsx-dev-runtime-DrCgFwTT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"64f6-FrFa8XXTsLfbp632PxseNEloH6Y\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 25846,
		"path": "../public/assets/jsx-dev-runtime-DrCgFwTT.js"
	},
	"/assets/label-Ds7derlV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"70b-WfiC3LsYfQ2LGLNoE/6/jELU/q0\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 1803,
		"path": "../public/assets/label-Ds7derlV.js"
	},
	"/assets/link-DE7nfFS5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5100-6QfcYrEaLq5EM8M2h+lqF9oFPS4\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 20736,
		"path": "../public/assets/link-DE7nfFS5.js"
	},
	"/assets/login-DsIsru7L.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282d-1WTGHr55WSHGuZuGH+dSj7QebFM\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 10285,
		"path": "../public/assets/login-DsIsru7L.js"
	},
	"/assets/main-oj1Sfrd5.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"5f81-HF8JL8/hqQ0TXGk26Ewn2lRN1G4\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 24449,
		"path": "../public/assets/main-oj1Sfrd5.css"
	},
	"/assets/preload-helper-C9C1R4my.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ab1-A5OE+MDm/yBF0sij1kDxdL1BZho\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 6833,
		"path": "../public/assets/preload-helper-C9C1R4my.js"
	},
	"/assets/register-RF62k10j.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f0a-KxTNiQHagmP+0ERhOq8manK/lHQ\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 7946,
		"path": "../public/assets/register-RF62k10j.js"
	},
	"/assets/reset-password-CH6GERf1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1238-t6CSdq6lIFiUo+Yh9u6lLtaTc78\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 4664,
		"path": "../public/assets/reset-password-CH6GERf1.js"
	},
	"/assets/routes-DwyF5JfQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"302-FuLc6JU6RRk3M2ycrCxC2CM8RrU\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 770,
		"path": "../public/assets/routes-DwyF5JfQ.js"
	},
	"/assets/useAuth-DBCkFpIl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ba3-zmb+nVVvr6DKmho7hrkKi7DRZwM\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 2979,
		"path": "../public/assets/useAuth-DBCkFpIl.js"
	},
	"/assets/useNavigate-Bm3Zj3yT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ea-fmSQtgjOHiQTFOJTGbdPQ/qkfKo\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 234,
		"path": "../public/assets/useNavigate-Bm3Zj3yT.js"
	},
	"/assets/useRouterState-DbcsjQCC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ab5-4WuOKIia22IPaGu/81TreDgXeoo\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 6837,
		"path": "../public/assets/useRouterState-DbcsjQCC.js"
	},
	"/assets/useSearch-Ces5p8WQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b3-PLUicKrTFxVYQbou7JftI58jRGM\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 691,
		"path": "../public/assets/useSearch-Ces5p8WQ.js"
	},
	"/assets/main-DpT4sKXJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f403-GCeeDXaArNN+x67zdfskhtOoFRA\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 586755,
		"path": "../public/assets/main-DpT4sKXJ.js"
	},
	"/assets/verify-email-Cco0bimd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"172e-OJRDXEzbbM9Kf7OtkMbWAF4avL4\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 5934,
		"path": "../public/assets/verify-email-Cco0bimd.js"
	},
	"/assets/zod-BoApESFW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"64c0-zFHy+oFYgjd1b2O9qMgnj/tuzMI\"",
		"mtime": "2026-03-08T05:26:45.795Z",
		"size": 25792,
		"path": "../public/assets/zod-BoApESFW.js"
	}
};
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
var METHODS = new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		s.length - 1;
		if (s[1] === "assets") r.unshift({
			data: $0,
			params: { "_": s.slice(2).join("/") }
		});
		return r;
	};
})();
var _lazy_mNXwQk = defineLazyEventHandler(() => Promise.resolve().then(() => ssr_renderer_exports));
const findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_mNXwQk
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
const globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function createNitroApp() {
	const hooks = void 0;
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		{
			const routeRules = getRouteRules(method, pathname);
			event.context.routeRules = routeRules?.routeRules;
			if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		}
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	for (const rule of Object.values(routeRules)) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
var port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch
});
trapUnhandledErrors();
var node_server_default = {};
function fetchViteEnv(viteEnvName, input, init) {
	const viteEnv = (globalThis.__nitro_vite_envs__ || {})[viteEnvName];
	if (!viteEnv) throw HTTPError.status(404);
	return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
var ssr_renderer_exports = /* @__PURE__ */ __exportAll({ default: () => ssrRenderer });
/** @param {{ req: Request }} HTTPEvent */
function ssrRenderer({ req }) {
	return fetchViteEnv("ssr", req);
}
export { node_server_default as default };
