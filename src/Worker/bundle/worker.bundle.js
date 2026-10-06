var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/utils/http.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Lexware-Api-Key"
};
function jsonResponse(data, status = 200, customHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...customHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
function isDemoRequest(request, userEmail) {
  const host = request.headers.get("host") || "";
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const combined = `${host} ${origin} ${referer}`.toLowerCase();
  if (combined.includes("actanex-demo") || combined.includes("demo-web") || combined.includes("demo.actanex")) {
    return true;
  }
  if (userEmail && userEmail.toLowerCase().includes("demo")) {
    return true;
  }
  return false;
}
__name(isDemoRequest, "isDemoRequest");

// src/services/db_bootstrap.service.ts
var isSettingsEnsured = false;
var isProjectColumnsEnsured = false;
var isDbBootstrapped = false;
async function ensureAuthTables(env2) {
  try {
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL,
        last_login_utc TEXT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at_utc TEXT NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    const isDemo = Boolean(
      env2.ENVIRONMENT === "demo" || env2.APP_NAME?.toLowerCase().includes("demo") || env2.GITHUB_REPO_NAME?.toLowerCase().includes("demo")
    );
    const isOpen = Boolean(
      env2.ENVIRONMENT === "open" || env2.APP_NAME?.toLowerCase().includes("open") || env2.GITHUB_REPO_NAME?.toLowerCase().includes("open")
    );
    if (isDemo) {
      try {
        const demoExists = await env2.DB.prepare("SELECT id FROM users WHERE LOWER(email) = 'admin@example.com'").first();
        if (!demoExists) {
          const demoSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
          const demoHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
          await env2.DB.prepare(`
            INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
            VALUES ('usr_demo_admin', 'admin@example.com', ?, ?, 'Max Mustermann', 'Admin', 1, ?)
          `).bind(demoHash, demoSalt, (/* @__PURE__ */ new Date()).toISOString()).run().catch(() => {
          });
        }
      } catch {
      }
    } else {
      const userCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM users").first();
      if (!userCount || userCount.count === 0) {
        const defaultSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
        const defaultHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
        await env2.DB.prepare(`
          INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
          VALUES ('usr_init_admin', 'admin@example.com', ?, ?, 'Administrator', 'Admin', 1, ?)
        `).bind(defaultHash, defaultSalt, (/* @__PURE__ */ new Date()).toISOString()).run().catch(() => {
        });
      }
    }
  } catch (err) {
    console.error("Auth tables init error:", err);
  }
}
__name(ensureAuthTables, "ensureAuthTables");
async function ensureSettings(env2) {
  if (isSettingsEnsured)
    return;
  try {
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        mileage_rate_business REAL NOT NULL DEFAULT 0.30,
        commute_rate_tier1 REAL NOT NULL DEFAULT 0.30,
        commute_rate_tier2 REAL NOT NULL DEFAULT 0.38,
        vma_rate_8h REAL NOT NULL DEFAULT 14.00,
        vma_rate_24h REAL NOT NULL DEFAULT 28.00,
        pdf_storage_mode TEXT NOT NULL DEFAULT 'R2',
        email_sender_name TEXT DEFAULT 'Max Mustermann | IT Consulting',
        email_sender_email TEXT DEFAULT 'noreply@example.com',
        email_service TEXT DEFAULT 'resend',
        email_api_key TEXT DEFAULT '',
        email_subject_template TEXT DEFAULT 'Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}',
        email_body_template TEXT,
        email_reminder1_subject TEXT DEFAULT '1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}',
        email_reminder1_body TEXT,
        email_reminder2_subject TEXT DEFAULT '2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})',
        email_reminder2_body TEXT,
        email_admin_notify_rejection INTEGER DEFAULT 1,
        email_admin_notify_reminder INTEGER DEFAULT 1,
        contractor_signature_data_url TEXT,
        use_signature_on_documents INTEGER DEFAULT 1,
        contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect',
        updated_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_signature_data_url TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN use_signature_on_documents INTEGER DEFAULT 1;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_webhook_callback_url TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN billing_provider TEXT DEFAULT 'lexware';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN chart_of_accounts TEXT DEFAULT 'SKR04';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_mode TEXT DEFAULT 'standard';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN datev_consultant_number TEXT DEFAULT '1001';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN datev_client_number TEXT DEFAULT '10001';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_name TEXT DEFAULT 'Musterfirma IT Consulting';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_name TEXT DEFAULT 'Max Mustermann';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_street TEXT DEFAULT 'Musterstra\xDFe 1';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_zip TEXT DEFAULT '10115';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_city TEXT DEFAULT 'Berlin';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_address TEXT DEFAULT 'Musterstra\xDFe 1, 10115 Berlin';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_type TEXT DEFAULT 'Freiberufler';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_assessment_type TEXT DEFAULT 'E\xDCR';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_number TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN vat_id TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN w_idnr TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN taxation_type TEXT DEFAULT 'Ist-Versteuerung';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN enable_ai_vision INTEGER DEFAULT 1;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_vision_model TEXT DEFAULT '@cf/meta/llama-3.2-11b-vision-instruct';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_pdf_model TEXT DEFAULT '@cf/meta/llama-3.1-8b-instruct';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_auto_provider_detect INTEGER DEFAULT 1;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_custom_rules_json TEXT DEFAULT '[]';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_api_key TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_own_vendor_id TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN gemini_api_key TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN gemini_model TEXT DEFAULT 'gemini-3.1-flash-lite-preview';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_prompt_image TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_prompt_pdf TEXT DEFAULT '';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN vehicle_planning_json TEXT DEFAULT '{}';").run();
    } catch {
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
      INSERT OR IGNORE INTO app_settings (id, mileage_rate_business, commute_rate_tier1, commute_rate_tier2, vma_rate_8h, vma_rate_24h, pdf_storage_mode, email_sender_name, email_sender_email, email_service, email_api_key, email_subject_template, billing_provider, chart_of_accounts, tax_mode, datev_consultant_number, datev_client_number, updated_at_utc)
      VALUES ('global_config', 0.30, 0.30, 0.38, 14.00, 28.00, 'R2', 'Max Mustermann | IT Consulting', 'noreply@example.com', 'resend', '', 'Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}', 'lexware', 'SKR04', 'standard', '1001', '10001', ?)
    `).bind(now).run();
    const isDemoOrOpen = Boolean(
      env2.APP_NAME?.toLowerCase().includes("demo") || env2.GITHUB_REPO_NAME?.toLowerCase().includes("demo") || env2.APP_NAME?.toLowerCase().includes("open") || env2.GITHUB_REPO_NAME?.toLowerCase().includes("open")
    );
    if (isDemoOrOpen) {
      try {
        await env2.DB.prepare(`
          UPDATE app_settings
          SET contractor_name = 'Max Mustermann',
              company_name = 'Musterfirma IT Consulting (Demo)',
              company_street = 'Musterstra\xDFe 1',
              company_zip = '10115',
              company_city = 'Berlin',
              company_address = 'Musterstra\xDFe 1, 10115 Berlin',
              email_sender_name = 'ActaNex Demo-System',
              email_sender_email = 'noreply@example.com',
              contractor_signature_data_url = NULL
          WHERE id = 'global_config' OR id = '1' OR id = 1
        `).run();
      } catch {
      }
    }
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id TEXT PRIMARY KEY,
        timesheet_id TEXT NOT NULL,
        email TEXT NOT NULL,
        otp_code_hash TEXT NOT NULL,
        expires_at_utc TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at_utc TEXT NOT NULL
      )
    `).run();
    isSettingsEnsured = true;
  } catch (err) {
    console.error("Settings initialization error:", err);
  }
}
__name(ensureSettings, "ensureSettings");
async function ensureProjectColumns(env2) {
  if (isProjectColumnsEnsured)
    return;
  try {
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN end_customer_name TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_2_email TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_2_name TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_3_email TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_3_name TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN parent_project_id TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN hierarchy_level INTEGER DEFAULT 1;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN budget_mode TEXT DEFAULT 'Dedicated';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN travel_budget_net REAL DEFAULT 0.0;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN travel_budget_mode TEXT DEFAULT 'Dedicated';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN updated_at_utc TEXT;").run();
    } catch {
    }
    isProjectColumnsEnsured = true;
  } catch (err) {
    console.error("ensureProjectColumns error:", err);
  }
}
__name(ensureProjectColumns, "ensureProjectColumns");
async function ensureTripExpenses(env2) {
  try {
    try {
      const colCheck = await env2.DB.prepare("PRAGMA table_info(trip_expenses)").all();
      const cols = (colCheck.results || []).map((c) => c.name);
      if (cols.length > 0 && !cols.includes("expense_date")) {
        await env2.DB.prepare("DROP TABLE trip_expenses").run();
      }
    } catch {
    }
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_expenses (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        skr04_account TEXT NOT NULL,
        amount_gross REAL NOT NULL,
        amount_net REAL NOT NULL,
        tax_rate REAL NOT NULL,
        tax_amount REAL NOT NULL,
        receipt_r2_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 1,
        is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
        lexware_voucher_id TEXT,
        lexware_voucher_number TEXT,
        lexware_status TEXT DEFAULT 'open',
        is_voucher_canceled INTEGER DEFAULT 0,
        voucher_canceled_at_utc TEXT,
        created_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN lexware_voucher_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN lexware_status TEXT DEFAULT 'open'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN is_voucher_canceled INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN voucher_canceled_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN return_date TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN total_days INTEGER DEFAULT 1").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN origin TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN destination TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN ticket_cost REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN contact_person TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN destination_address TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN origin_address TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN travel_type TEXT DEFAULT 'BusinessTrip'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN departure_time TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN arrival_time TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN vma_amount REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN has_breakfast INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN hotel_cost REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN parking_cost REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN is_billable_to_client INTEGER DEFAULT 1").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN is_internal_expense_only INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_vma_voucher_id TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_vma_voucher_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_travel_voucher_id TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_travel_voucher_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN lexware_quotation_status TEXT DEFAULT 'open'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN lexware_order_confirmation_status TEXT DEFAULT 'open'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN return_location TEXT").run();
    } catch {
    }
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_legs (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        leg_order INTEGER NOT NULL DEFAULT 1,
        date_leg TEXT NOT NULL,
        start_location TEXT NOT NULL,
        destination_location TEXT NOT NULL,
        transport_type TEXT NOT NULL DEFAULT 'Train',
        distance_km REAL DEFAULT 0.0,
        rate_per_km REAL DEFAULT 0.0,
        travel_cost_net REAL DEFAULT 0.0,
        layover_hours REAL DEFAULT 0.0,
        layover_purpose TEXT,
        customer_id TEXT,
        project_id TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN status TEXT NOT NULL DEFAULT 'Completed'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN is_round_trip INTEGER NOT NULL DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN total_planned_cost_net REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN breakfast_days_json TEXT DEFAULT '[]'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN default_transport_type TEXT DEFAULT 'Train'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN is_foreign_trip INTEGER NOT NULL DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN foreign_country TEXT DEFAULT ''").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN foreign_city TEXT DEFAULT ''").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN foreign_rates_json TEXT DEFAULT '{}'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trips ADD COLUMN meal_deductions_json TEXT DEFAULT '{}'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_legs ADD COLUMN country TEXT DEFAULT ''").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_legs ADD COLUMN destination_city TEXT DEFAULT ''").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_legs ADD COLUMN currency TEXT DEFAULT 'EUR'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_legs ADD COLUMN exchange_rate REAL DEFAULT 1.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_legs ADD COLUMN exchange_rate_proof TEXT DEFAULT ''").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN foreign_rates_custom_json TEXT DEFAULT '{}'").run();
    } catch {
    }
  } catch (err) {
    console.error("trip_expenses init error:", err?.message || err);
  }
}
__name(ensureTripExpenses, "ensureTripExpenses");
async function ensureOperationalVouchers(env2) {
  try {
    try {
      const colCheck = await env2.DB.prepare("PRAGMA table_info(operational_vouchers)").all();
      const cols = (colCheck.results || []).map((c) => c.name);
      if (cols.length > 0 && !cols.includes("project_id")) {
        await env2.DB.prepare("DROP TABLE operational_vouchers").run();
      }
    } catch {
    }
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS operational_vouchers (
        id TEXT PRIMARY KEY,
        voucher_number TEXT NOT NULL UNIQUE,
        voucher_type TEXT NOT NULL,
        voucher_date TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        description TEXT NOT NULL,
        business_purpose TEXT NOT NULL,
        project_id TEXT,
        customer_id TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 0,
        amount_gross REAL NOT NULL DEFAULT 0.0,
        amount_net REAL NOT NULL DEFAULT 0.0,
        tax_rate REAL NOT NULL DEFAULT 19.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        tip_amount REAL NOT NULL DEFAULT 0.0,
        total_attendees_count INTEGER DEFAULT 1,
        business_attendees_count INTEGER DEFAULT 1,
        business_share_percent REAL DEFAULT 100.0,
        tax_deductible_net REAL DEFAULT 0.0,
        tax_non_deductible_net REAL DEFAULT 0.0,
        private_share_gross REAL DEFAULT 0.0,
        attendees_json TEXT,
        location_address TEXT,
        is_own_receipt INTEGER NOT NULL DEFAULT 0,
        own_receipt_reason TEXT,
        transport_type TEXT,
        distance_km REAL DEFAULT 0.0,
        origin_address TEXT,
        destination_address TEXT,
        parent_hospitality_voucher_id TEXT,
        skr04_account TEXT NOT NULL DEFAULT '4650',
        skr03_account TEXT NOT NULL DEFAULT '4650',
        receipt_r2_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        payment_slip_r2_key TEXT,
        payment_slip_filename TEXT,
        payment_slip_total_gross REAL DEFAULT 0.0,
        payment_method TEXT DEFAULT 'Card_NFC',
        secondary_attachment_r2_key TEXT,
        secondary_attachment_filename TEXT,
        voucher_pdf_r2_key TEXT,
        voucher_pdf_hash_sha256 TEXT,
        is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
        lexware_voucher_id TEXT,
        lexware_voucher_number TEXT,
        lexware_status TEXT DEFAULT 'open',
        status TEXT DEFAULT 'Verified',
        created_at_utc TEXT NOT NULL,
        updated_at_utc TEXT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS voucher_upload_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        uploaded_files_json TEXT DEFAULT '[]',
        ai_extracted_json TEXT,
        expires_at_utc TEXT NOT NULL,
        created_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN status TEXT DEFAULT 'Verified'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax19_gross REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax7_gross REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax19_amount REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax7_amount REAL DEFAULT 0.0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN trip_id TEXT").run();
    } catch {
    }
  } catch (err) {
    console.error("ensureOperationalVouchers error:", err?.message || err);
  }
}
__name(ensureOperationalVouchers, "ensureOperationalVouchers");
async function ensureDemoSeedData(env2) {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
      INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, customer_number, contact_person, email, street, zip_code, city, is_active, is_archived, created_at_utc) VALUES 
      ('cust_demo_01', 'lex_cust_01', '[DEMO] Contoso Cloud Architecture GmbH', 'KD-10042', 'Dr. Markus Muster', 'markus.muster@mail1.contoso.com', 'Contoso Allee 100', '10115', 'Berlin', 1, 0, ?),
      ('cust_demo_02', 'lex_cust_02', '[DEMO] Contoso Logistics & Mobility AG', 'KD-10043', 'Sarah Musterfrau', 'sarah.musterfrau@mail2.contoso.com', 'Speicherstra\xDFe 42', '80335', 'M\xFCnchen', 1, 0, ?),
      ('cust_demo_03', 'lex_cust_03', '[DEMO] Contoso Financial Security SE', 'KD-10044', 'Michael Mustermann', 'michael.mustermann@mail1.contoso.com', 'Finanzplatz 1', '60311', 'Frankfurt am Main', 1, 0, ?)
    `).bind(now, now, now).run().catch(() => {
    });
    await env2.DB.prepare(`
      INSERT OR IGNORE INTO projects (id, customer_id, name, project_number, default_hourly_rate, planned_hours, total_budget_net, start_date, end_date, is_active, is_archived, created_at_utc, lexware_quotation_number, lexware_order_confirmation_id, lexware_service_article_id, approver_email, approver_name) VALUES 
      ('prj_demo_01', 'cust_demo_01', '[DEMO] - M365 & Azure Security Transformation', 'PRJ-2026-DEMO-01', 120.00, 160.00, 19200.00, '2026-06-01', '2026-12-31', 1, 0, ?, 'ANG-2026-054', 'AB-2026-081', 'ART-IT-ARCH', 'markus.muster@mail1.contoso.com', 'Dr. Markus Muster'),
      ('prj_demo_02', 'cust_demo_02', '[DEMO] - Microservice Event Hub Migration', 'PRJ-2026-DEMO-02', 110.00, 120.00, 13200.00, '2026-06-01', '2026-11-30', 1, 0, ?, 'ANG-2026-055', 'AB-2026-082', 'ART-CLOUD-ENG', 'sarah.musterfrau@mail2.contoso.com', 'Sarah Musterfrau'),
      ('prj_demo_03', 'cust_demo_03', '[DEMO] - Zero-Trust & GoBD Audit Readiness', 'PRJ-2026-DEMO-03', 130.00, 100.00, 13000.00, '2026-07-01', '2026-10-31', 1, 0, ?, 'ANG-2026-056', 'AB-2026-083', 'ART-SEC-AUDIT', 'michael.mustermann@mail1.contoso.com', 'Michael Mustermann')
    `).bind(now, now, now).run().catch(() => {
    });
  } catch (err) {
    console.error("Demo seed error:", err?.message || err);
  }
}
__name(ensureDemoSeedData, "ensureDemoSeedData");
async function ensureCoreDatabase(env2) {
  if (isDbBootstrapped)
    return;
  try {
    await ensureAuthTables(env2);
    await ensureSettings(env2);
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        lexware_contact_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        street TEXT,
        zip_code TEXT,
        city TEXT,
        country_code TEXT DEFAULT 'DE',
        vat_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_archived INTEGER NOT NULL DEFAULT 0,
        customer_number TEXT,
        created_at_utc TEXT NOT NULL,
        updated_at_utc TEXT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        project_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        purchase_order_number TEXT,
        contract_number TEXT,
        default_hourly_rate REAL NOT NULL DEFAULT 120.00,
        lexware_service_article_id TEXT NOT NULL,
        billing_interval_minutes INTEGER NOT NULL DEFAULT 15,
        approver_email TEXT NOT NULL,
        approver_name TEXT,
        travel_time_billable INTEGER NOT NULL DEFAULT 0,
        travel_time_rate_multiplier REAL NOT NULL DEFAULT 1.0,
        public_transit_reimbursable INTEGER NOT NULL DEFAULT 1,
        planned_hours REAL NOT NULL DEFAULT 0.0,
        total_budget_net REAL NOT NULL DEFAULT 0.0,
        start_date TEXT,
        end_date TEXT,
        lexware_quotation_id TEXT,
        lexware_quotation_number TEXT,
        lexware_order_confirmation_id TEXT,
        lexware_order_confirmation_number TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS timesheet_versions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        version_number INTEGER NOT NULL DEFAULT 1,
        period TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Draft',
        total_actual_hours REAL NOT NULL DEFAULT 0.0,
        total_billable_hours REAL NOT NULL DEFAULT 0.0,
        total_billable_travel_hours REAL NOT NULL DEFAULT 0.0,
        total_reimbursable_expenses REAL NOT NULL DEFAULT 0.0,
        total_amount_net REAL NOT NULL DEFAULT 0.0,
        data_hash_sha256 TEXT NOT NULL,
        pdf_hash_sha256 TEXT,
        pdf_r2_storage_key TEXT,
        xlsx_hash_sha256 TEXT,
        xlsx_r2_storage_key TEXT,
        supersedes_version_id TEXT,
        rejection_reason TEXT,
        lexware_invoice_id TEXT,
        lexware_invoice_number TEXT,
        is_invoice_canceled INTEGER NOT NULL DEFAULT 0,
        invoice_canceled_at_utc TEXT,
        approval_method TEXT,
        approved_by TEXT,
        approved_at_utc TEXT,
        created_at_utc TEXT NOT NULL,
        submitted_at_utc TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        UNIQUE(project_id, period, version_number)
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        timesheet_version_id TEXT,
        entry_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        break_minutes INTEGER NOT NULL DEFAULT 0,
        actual_duration_hours REAL NOT NULL,
        billable_duration_hours REAL NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT 'Remote',
        short_description TEXT NOT NULL,
        task_or_ticket_reference TEXT,
        is_billable INTEGER NOT NULL DEFAULT 1,
        billing_rate_snapshot REAL NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS activity_evidences (
        id TEXT PRIMARY KEY,
        time_entry_id TEXT NOT NULL UNIQUE,
        problem_statement TEXT NOT NULL,
        methodology TEXT NOT NULL,
        technical_activity TEXT NOT NULL,
        result TEXT NOT NULL,
        responsibility TEXT NOT NULL DEFAULT 'Eigenverantwortliche Konzeption & Durchf\xFChrung',
        deliverable TEXT,
        FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        timesheet_version_id TEXT,
        trip_date TEXT NOT NULL,
        purpose TEXT NOT NULL,
        expense_type TEXT NOT NULL DEFAULT 'PublicTransit',
        origin_location TEXT NOT NULL,
        destination_location TEXT NOT NULL,
        distance_km REAL NOT NULL DEFAULT 0.0,
        rate_per_km REAL NOT NULL DEFAULT 0.30,
        actual_departure_utc TEXT NOT NULL,
        actual_arrival_utc TEXT NOT NULL,
        total_absence_hours REAL NOT NULL,
        elapsed_travel_hours REAL NOT NULL,
        work_time_during_travel_hours REAL NOT NULL DEFAULT 0.0,
        billable_travel_hours REAL NOT NULL DEFAULT 0.0,
        customer_reimbursable_cost REAL NOT NULL DEFAULT 0.0,
        total_actual_cost REAL NOT NULL DEFAULT 0.0,
        vma_amount REAL DEFAULT 0.0,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_segments (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        travel_mode TEXT NOT NULL,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        operator_and_line TEXT,
        receipt_id TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        project_id TEXT,
        receipt_date TEXT NOT NULL,
        merchant_name TEXT NOT NULL,
        amount_net REAL NOT NULL,
        vat_rate REAL NOT NULL DEFAULT 19.0,
        amount_gross REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        is_customer_reimbursable INTEGER NOT NULL DEFAULT 1,
        r2_storage_key TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        sha256_hash TEXT NOT NULL,
        retention_class TEXT NOT NULL DEFAULT 'AccountingEvidence',
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        timesheet_version_id TEXT NOT NULL UNIQUE,
        decision TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'CloudflareZeroTrustOtp',
        approver_email TEXT NOT NULL,
        approver_name TEXT,
        comment TEXT,
        bound_document_hash_sha256 TEXT NOT NULL,
        client_ip TEXT,
        user_agent TEXT,
        decision_at_utc TEXT NOT NULL,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS billing_batches (
        id TEXT PRIMARY KEY,
        timesheet_version_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        lexware_invoice_id TEXT,
        invoice_number TEXT,
        billed_hours REAL NOT NULL,
        billed_expenses_net REAL NOT NULL,
        total_billed_amount_net REAL NOT NULL,
        is_finalized_in_lexware INTEGER NOT NULL DEFAULT 0,
        draft_created_utc TEXT NOT NULL,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        description TEXT NOT NULL,
        data_payload_json TEXT,
        timestamp_utc TEXT NOT NULL
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS monthly_archive_seals (
        id TEXT PRIMARY KEY,
        period TEXT UNIQUE NOT NULL,
        sealed_at_utc TEXT NOT NULL,
        sealed_by TEXT NOT NULL,
        total_events_count INTEGER NOT NULL DEFAULT 0,
        merkle_root_hash TEXT NOT NULL,
        is_locked INTEGER NOT NULL DEFAULT 1
      )
    `).run();
    await ensureOperationalVouchers(env2);
    await ensureTripExpenses(env2);
    await ensureProjectColumns(env2);
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS invoice_documents (
        id TEXT PRIMARY KEY,
        timesheet_version_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        sha256_hash TEXT NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE CASCADE
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS project_approvers (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        role_description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE time_entries ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'Billable'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN description TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN pdf_frozen_hash TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN frozen_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN signed_document_r2_key TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN signed_document_filename TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN reminder_1_sent_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN reminder_2_sent_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT").run();
    } catch {
    }
    await env2.DB.prepare(`
      INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, customer_number, contact_person, email, street, zip_code, city, is_active, is_archived, created_at_utc)
      VALUES ('cust_internal', 'lex_cust_internal', '[INTERN] Eigene Organisation & Administration', 'INT-0001', 'Selbst', 'admin@example.com', 'Musterstra\xDFe 1', '20095', 'Hamburg', 1, 0, '2026-05-01T08:00:00.000Z')
    `).run().catch(() => {
    });
    isDbBootstrapped = true;
  } catch (err) {
    console.error("ensureCoreDatabase error:", err);
  }
}
__name(ensureCoreDatabase, "ensureCoreDatabase");

// src/utils/crypto.ts
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const saltBuf = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    512
  );
  return Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function calculateSha256Hex(data) {
  let buffer;
  if (typeof data === "string") {
    buffer = new TextEncoder().encode(data).buffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer;
  } else {
    buffer = data;
  }
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(calculateSha256Hex, "calculateSha256Hex");

// src/utils/audit.ts
async function logAuditEvent(env2, {
  eventType,
  entityType,
  entityId,
  actor,
  description,
  dataPayload
}) {
  try {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
      INSERT INTO audit_events (id, event_type, entity_type, entity_id, actor, description, data_payload_json, timestamp_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      eventType,
      entityType || "general",
      entityId || null,
      actor || "System",
      description || "",
      dataPayload ? JSON.stringify(dataPayload) : null,
      now
    ).run();
  } catch (err) {
    console.error("Audit log error:", err?.message || err);
  }
}
__name(logAuditEvent, "logAuditEvent");

// src/services/auth.service.ts
async function getAuthenticatedUser2(request, env2) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token)
    return null;
  try {
    const session = await env2.DB.prepare(`
      SELECT s.user_id, u.email, u.full_name, u.role, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
    `).bind(token).first();
    if (!session || session.is_active === 0)
      return null;
    return {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      role: session.role
    };
  } catch (err) {
    console.error("Auth check failed:", err);
    return null;
  }
}
__name(getAuthenticatedUser2, "getAuthenticatedUser");
async function handleLogin(request, env2) {
  await ensureAuthTables(env2);
  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const rememberMe = !!body.rememberMe;
  if (!email || !password) {
    return errorResponse("Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.", 400);
  }
  let user = await env2.DB.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1").bind(email).first();
  const isDemoEnvironment = Boolean(
    env2.ENVIRONMENT === "demo" || env2.APP_NAME?.toLowerCase().includes("demo") || env2.GITHUB_REPO_NAME?.toLowerCase().includes("demo")
  );
  if (email === "admin@example.com" && isDemoEnvironment) {
    const demoSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
    const demoHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
    if (!user || user.password_hash !== demoHash) {
      await env2.DB.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
        VALUES ('usr_demo_admin', 'admin@example.com', ?, ?, 'Max Mustermann', 'Admin', 1, ?)
      `).bind(demoHash, demoSalt, (/* @__PURE__ */ new Date()).toISOString()).run().catch(() => {
      });
      user = await env2.DB.prepare("SELECT * FROM users WHERE LOWER(email) = 'admin@example.com' AND is_active = 1").first();
    }
  }
  if (!user) {
    return errorResponse("Ung\xFCltige Anmeldedaten. Bitte \xFCberpr\xFCfen Sie Ihre Eingabe.", 401);
  }
  const computedHash = await hashPassword(password, user.salt);
  if (computedHash !== user.password_hash) {
    return errorResponse("Ung\xFCltige Anmeldedaten. Bitte \xFCberpr\xFCfen Sie Ihre Eingabe.", 401);
  }
  const token = "auth_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const now = /* @__PURE__ */ new Date();
  const durationDays = rememberMe ? 30 : 1;
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1e3).toISOString();
  await env2.DB.prepare(`
    INSERT INTO user_sessions (token, user_id, expires_at_utc, created_at_utc)
    VALUES (?, ?, ?, ?)
  `).bind(token, user.id, expiresAt, now.toISOString()).run();
  await env2.DB.prepare("UPDATE users SET last_login_utc = ? WHERE id = ?").bind(now.toISOString(), user.id).run();
  const isDemo = isDemoRequest(request, user.email);
  const isDefault = !isDemo && user.email === "admin@example.com" && user.salt === "f5de90270b9f7d2cb8efea3b9ff63eda";
  return jsonResponse({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    },
    requiresCredentialChange: isDefault,
    expiresAt
  });
}
__name(handleLogin, "handleLogin");
async function handleLogout(request, env2) {
  await ensureAuthTables(env2);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token) {
    await env2.DB.prepare("DELETE FROM user_sessions WHERE token = ?").bind(token).run();
  }
  return jsonResponse({ success: true, message: "Erfolgreich abgemeldet." });
}
__name(handleLogout, "handleLogout");
async function handleGetMe(request, env2) {
  await ensureAuthTables(env2);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return errorResponse("Nicht authentifiziert.", 401);
  }
  const session = await env2.DB.prepare(`
    SELECT s.*, u.email, u.full_name, u.role, u.is_active, u.salt
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
  `).bind(token).first();
  if (!session || session.is_active === 0) {
    return errorResponse("Sitzung abgelaufen oder ung\xFCltig.", 401);
  }
  const isDemo = isDemoRequest(request, session.email);
  const isDefault = !isDemo && session.email === "admin@example.com" && session.salt === "f5de90270b9f7d2cb8efea3b9ff63eda";
  return jsonResponse({
    authenticated: true,
    user: {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      role: session.role
    },
    requiresCredentialChange: isDefault
  });
}
__name(handleGetMe, "handleGetMe");
async function handleChangeCredentials(request, env2) {
  await ensureAuthTables(env2);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return errorResponse("Nicht authentifiziert.", 401);
  }
  const session = await env2.DB.prepare(`
    SELECT s.*, u.id as user_id, u.email, u.password_hash, u.salt, u.full_name, u.role
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
  `).bind(token).first();
  if (!session) {
    return errorResponse("Sitzung abgelaufen oder ung\xFCltig.", 401);
  }
  const body = await request.json();
  const currentPassword = (body.currentPassword || "").trim();
  const newEmail = (body.newEmail || "").trim().toLowerCase();
  const newFullName = (body.newFullName || "").trim();
  const newPassword = (body.newPassword || "").trim();
  if (!currentPassword) {
    return errorResponse("Bitte geben Sie Ihr aktuelles Passwort zur Best\xE4tigung ein.", 400);
  }
  const currentHash = await hashPassword(currentPassword, session.salt);
  if (currentHash !== session.password_hash) {
    return errorResponse("Das aktuelle Passwort ist leider nicht korrekt.", 403);
  }
  let updatedEmail = session.email;
  if (newEmail && newEmail !== session.email) {
    if (!newEmail.includes("@") || !newEmail.includes(".")) {
      return errorResponse("Bitte geben Sie eine g\xFCltige neue E-Mail-Adresse ein.", 400);
    }
    const emailCheck = await env2.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(newEmail, session.user_id).first();
    if (emailCheck) {
      return errorResponse("Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet.", 400);
    }
    updatedEmail = newEmail;
  }
  const updatedFullName = newFullName || session.full_name;
  const newSalt = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  let updatedHash = session.password_hash;
  if (newPassword) {
    if (newPassword.length < 8) {
      return errorResponse("Das neue Passwort muss mindestens 8 Zeichen lang sein.", 400);
    }
    updatedHash = await hashPassword(newPassword, newSalt);
  } else {
    updatedHash = await hashPassword(currentPassword, newSalt);
  }
  await env2.DB.prepare(`
    UPDATE users
    SET email = ?, full_name = ?, password_hash = ?, salt = ?
    WHERE id = ?
  `).bind(updatedEmail, updatedFullName, updatedHash, newSalt, session.user_id).run();
  await logAuditEvent(env2, {
    eventType: "USER_CREDENTIALS_UPDATED",
    entityType: "users",
    entityId: session.user_id,
    actor: updatedFullName,
    description: `Zugangsdaten f\xFCr ${updatedEmail} (${updatedFullName}) erfolgreich aktualisiert.`
  });
  return jsonResponse({
    success: true,
    message: "Zugangsdaten & Profil wurden erfolgreich aktualisiert!",
    user: {
      id: session.user_id,
      email: updatedEmail,
      fullName: updatedFullName,
      role: session.role
    },
    requiresCredentialChange: false
  });
}
__name(handleChangeCredentials, "handleChangeCredentials");

// src/routes/auth.routes.ts
async function handleAuthRoutes(request, env2, path, method) {
  if (path === "/api/v1/auth/login" && method === "POST") {
    return handleLogin(request, env2);
  }
  if (path === "/api/v1/auth/logout" && (method === "POST" || method === "GET")) {
    return handleLogout(request, env2);
  }
  if (path === "/api/v1/auth/me" && method === "GET") {
    return handleGetMe(request, env2);
  }
  if ((path === "/api/v1/auth/change-credentials" || path === "/api/v1/auth/change-password") && method === "POST") {
    return handleChangeCredentials(request, env2);
  }
  return null;
}
__name(handleAuthRoutes, "handleAuthRoutes");

// src/services/lexware.service.ts
async function fetchLexwareWithRetry(url, options, maxRetries = 3, initialDelayMs = 1500) {
  let delay = initialDelayMs;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      if (attempt < maxRetries) {
        const retryAfterHeader = res.headers.get("Retry-After");
        let waitMs = delay;
        if (retryAfterHeader) {
          const parsedSec = parseFloat(retryAfterHeader);
          if (!isNaN(parsedSec) && parsedSec > 0) {
            waitMs = Math.ceil(parsedSec * 1e3) + 300;
          }
        }
        console.warn(
          `[Lexware API] 429 Rate Limit encountered on ${url}. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, waitMs));
        delay = Math.round(delay * 1.8);
        continue;
      }
    }
    return res;
  }
  return fetch(url, options);
}
__name(fetchLexwareWithRetry, "fetchLexwareWithRetry");
async function getEffectiveLexwareApiKey(env2, request) {
  const headerKey = request?.headers.get("X-Lexware-Api-Key");
  if (headerKey && headerKey.trim())
    return headerKey.trim();
  try {
    const s = await env2.DB.prepare(
      "SELECT lexware_api_key FROM app_settings WHERE id = 'global_config'"
    ).first();
    if (s?.lexware_api_key && s.lexware_api_key.trim())
      return s.lexware_api_key.trim();
  } catch {
  }
  if (env2.LEXWARE_API_KEY && env2.LEXWARE_API_KEY.trim())
    return env2.LEXWARE_API_KEY.trim();
  return "";
}
__name(getEffectiveLexwareApiKey, "getEffectiveLexwareApiKey");
async function getEffectiveLexwareOwnVendorId(env2, apiKey) {
  let val = "";
  try {
    const s = await env2.DB.prepare(
      "SELECT lexware_own_vendor_id FROM app_settings WHERE id = 'global_config'"
    ).first();
    if (s?.lexware_own_vendor_id && s.lexware_own_vendor_id.trim()) {
      val = s.lexware_own_vendor_id.trim();
    }
  } catch {
  }
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  if (isGuid)
    return val;
  if (apiKey) {
    try {
      const res = await fetchLexwareWithRetry("https://api.lexware.io/v1/contacts", {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        const contacts = data.content || [];
        if (val) {
          const match = contacts.find((c) => {
            const num = c.roles?.vendor?.number?.toString() || "";
            const name = (c.company?.name || `${c.person?.firstName || ""} ${c.person?.lastName || ""}`).trim().toLowerCase();
            return num === val || name.includes(val.toLowerCase()) || c.id === val;
          });
          if (match?.id)
            return match.id;
        }
        const autoMatch = contacts.find((c) => {
          const note = (c.note || "").toLowerCase();
          const name = (c.company?.name || `${c.person?.firstName || ""} ${c.person?.lastName || ""}`).trim().toLowerCase();
          return c.roles && c.roles.vendor && (note.includes("eigen") || note.includes("inhaber"));
        });
        if (autoMatch?.id)
          return autoMatch.id;
      }
    } catch (err) {
      console.warn("Could not resolve vendor number to contact ID:", err);
    }
  }
  return val;
}
__name(getEffectiveLexwareOwnVendorId, "getEffectiveLexwareOwnVendorId");
var lastLexwareContactsSyncTime = 0;
async function syncLexwareContactsInternal(env2, customApiKey, force = false) {
  const apiKey = customApiKey || env2.LEXWARE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Kein LEXWARE_API_KEY konfiguriert." };
  }
  const nowMs = Date.now();
  if (!force && nowMs - lastLexwareContactsSyncTime < 1e4) {
    return { success: true, cached: true };
  }
  try {
    try {
      await env2.DB.prepare("ALTER TABLE customers ADD COLUMN customer_number TEXT").run();
    } catch {
    }
    const lexRes = await fetch("https://api.lexware.io/v1/contacts?size=250", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      }
    });
    if (!lexRes.ok) {
      const errText = await lexRes.text();
      return {
        success: false,
        error: `Fehler beim Abruf von Lexware API (HTTP ${lexRes.status}): ${errText}`
      };
    }
    const lexData = await lexRes.json();
    const lexContacts = lexData.content || [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    const activeLexwareIds = /* @__PURE__ */ new Set();
    for (const item of lexContacts) {
      const lexContactId = item.id;
      if (!lexContactId)
        continue;
      const hasCustomerRole = !!(item.roles?.customer || item.customerNumber);
      const hasVendorRole = !!(item.roles?.vendor || item.vendorNumber);
      if (hasVendorRole && !hasCustomerRole)
        continue;
      if (!hasCustomerRole)
        continue;
      activeLexwareIds.add(lexContactId);
      const existing = await env2.DB.prepare(
        "SELECT id, email, contact_person FROM customers WHERE lexware_contact_id = ?"
      ).bind(lexContactId).first();
      const custId = existing?.id || `cust_${crypto.randomUUID().substring(0, 12)}`;
      const displayName = item.company?.name || `${item.person?.firstName || ""} ${item.person?.lastName || ""}`.trim() || "Unbekannter Kunde";
      const personName = item.company && item.person?.lastName ? `${item.person?.salutation ? item.person.salutation + " " : ""}${item.person.firstName ? item.person.firstName + " " : ""}${item.person.lastName}` : item.person?.lastName ? `${item.person.firstName ? item.person.firstName + " " : ""}${item.person.lastName}` : "";
      let email = existing?.email || "";
      if (!email && item.emailAddresses) {
        if (typeof item.emailAddresses === "string") {
          email = item.emailAddresses;
        } else if (item.emailAddresses.business && item.emailAddresses.business[0]) {
          email = item.emailAddresses.business[0];
        } else if (item.emailAddresses.primary) {
          email = item.emailAddresses.primary;
        }
      }
      let street = "";
      let zipCode = "";
      let city = "";
      let countryCode = "DE";
      const primaryAddr = item.addresses?.billing?.[0] || item.addresses?.primary || item.addresses?.shipping?.[0];
      if (primaryAddr) {
        street = primaryAddr.street || "";
        zipCode = primaryAddr.zip || "";
        city = primaryAddr.city || "";
        countryCode = primaryAddr.countryCode || "DE";
      }
      const vatId = item.taxInformation?.vatId || null;
      const customerNumber = item.roles?.customer?.number || item.customerNumber || null;
      const customerNumberStr = customerNumber ? String(customerNumber) : null;
      if (existing) {
        updatedCount++;
      } else {
        createdCount++;
      }
      await env2.DB.prepare(`
        INSERT INTO customers (id, lexware_contact_id, customer_number, name, contact_person, email, street, zip_code, city, country_code, vat_id, is_active, is_archived, created_at_utc, updated_at_utc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
        ON CONFLICT(lexware_contact_id) DO UPDATE SET
          customer_number = excluded.customer_number,
          name = excluded.name,
          contact_person = excluded.contact_person,
          email = excluded.email,
          street = excluded.street,
          zip_code = excluded.zip_code,
          city = excluded.city,
          country_code = excluded.country_code,
          vat_id = excluded.vat_id,
          is_active = 1,
          is_archived = 0,
          updated_at_utc = excluded.updated_at_utc
      `).bind(
        custId,
        lexContactId,
        customerNumberStr,
        displayName,
        personName || null,
        email || null,
        street,
        zipCode,
        city,
        countryCode,
        vatId,
        now,
        now
      ).run();
      if (email) {
        try {
          await env2.DB.prepare(`
            UPDATE projects
            SET 
              approver_email = CASE WHEN approver_email IS NULL OR approver_email = '' THEN ? ELSE approver_email END,
              approver_name = CASE WHEN approver_name IS NULL OR approver_name = '' THEN ? ELSE approver_name END
            WHERE customer_id = ?
          `).bind(email, personName || null, custId).run();
        } catch {
        }
      }
    }
    const { results: localCustomers } = await env2.DB.prepare(
      "SELECT * FROM customers WHERE id != 'cust_internal'"
    ).all();
    let archivedCount = 0;
    let deletedCount = 0;
    for (const localCust of localCustomers) {
      if (!activeLexwareIds.has(localCust.lexware_contact_id)) {
        const projCount = await env2.DB.prepare(
          "SELECT COUNT(*) as cnt FROM projects WHERE customer_id = ?"
        ).bind(localCust.id).first();
        const hasHistory = (projCount?.cnt || 0) > 0;
        if (hasHistory) {
          await env2.DB.prepare(
            "UPDATE customers SET is_active = 0, is_archived = 1, updated_at_utc = ? WHERE id = ?"
          ).bind(now, localCust.id).run();
          archivedCount++;
        } else {
          await env2.DB.prepare("DELETE FROM customers WHERE id = ?").bind(localCust.id).run();
          deletedCount++;
        }
      }
    }
    await env2.DB.prepare(`
      INSERT INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
      VALUES ('cust_internal', 'INTERNAL_ORG', '[INTERN] Eigene Organisation & Administration', 'Max Mustermann', 'admin@example.com', '', '', '', 'DE', 1, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_active = 1,
        is_archived = 0,
        name = '[INTERN] Eigene Organisation & Administration',
        updated_at_utc = excluded.updated_at_utc
    `).bind(now, now).run();
    lastLexwareContactsSyncTime = Date.now();
    return {
      success: true,
      stats: {
        totalFromLexware: lexContacts.length,
        created: createdCount,
        updated: updatedCount,
        archived: archivedCount,
        deleted: deletedCount
      }
    };
  } catch (err) {
    console.error("Fehler bei Lexware Kunden-Sync:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
__name(syncLexwareContactsInternal, "syncLexwareContactsInternal");
async function createLexwareQuotation(projectId, env2) {
  const project = await env2.DB.prepare(
    "SELECT p.*, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?"
  ).bind(projectId).first();
  if (!project)
    return errorResponse("Projekt nicht gefunden", 404);
  if (!env2.LEXWARE_API_KEY)
    return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
  const defaultRate = project.default_hourly_rate || 120;
  const plannedHours = project.planned_hours || 0;
  const totalBudgetNet = project.total_budget_net || defaultRate * plannedHours;
  const quotationPayload = {
    voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
    expirationDate: project.end_date ? new Date(project.end_date).toISOString() : new Date(Date.now() + 30 * 864e5).toISOString(),
    address: {
      name: project.customer_name || "Kunde",
      contactId: project.lexware_contact_id,
      street: project.street || null,
      zip: project.zip_code || null,
      city: project.city || null,
      countryCode: project.country_code || "DE"
    },
    lineItems: [
      {
        type: "custom",
        name: `Architektur & Engineering: ${project.name}`,
        description: `Projekt: ${project.project_number || "Standard"}
Laufzeit: ${project.start_date || "sofort"} bis ${project.end_date || "gem. Vereinbarung"}
Geplantes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. \xE0 ${defaultRate.toFixed(2)} \u20AC/h Netto.`,
        quantity: plannedHours > 0 ? plannedHours : 1,
        unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
        unitPrice: {
          currency: "EUR",
          netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
          taxRatePercentage: 19
        }
      }
    ],
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
    introduction: `Sehr geehrte Damen und Herren,

vielen Dank f\xFCr die Projektanfrage. Gerne bieten wir Ihnen unsere freiberuflichen Architektur- und Beratungsleistungen wie folgt an:`,
    remark: `Abrechnung erfolgt monatlich nach tats\xE4chlich erbrachten Stunden mit GoBD-konformem T\xE4tigkeits- und Leistungsnachweis.`
  };
  const qRes = await fetch("https://api.lexware.io/v1/quotations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(quotationPayload)
  });
  if (!qRes.ok) {
    const errText = await qRes.text();
    return errorResponse(`Lexware Quotation Fehler: ${errText}`, 400);
  }
  const qData = await qRes.json();
  const lexwareQuotationId = qData.id;
  let lexwareQuotationNumber = null;
  try {
    const qDetailRes = await fetch(`https://api.lexware.io/v1/quotations/${lexwareQuotationId}`, {
      headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
    });
    if (qDetailRes.ok) {
      const qDetail = await qDetailRes.json();
      lexwareQuotationNumber = qDetail.voucherNumber || null;
    }
  } catch {
  }
  await env2.DB.prepare(
    "UPDATE projects SET lexware_quotation_id = ?, lexware_quotation_number = ?, lexware_quotation_status = 'open' WHERE id = ?"
  ).bind(lexwareQuotationId, lexwareQuotationNumber, projectId).run();
  return jsonResponse({
    success: true,
    lexwareQuotationId,
    lexwareQuotationNumber,
    message: `Angebot in Lexware erfolgreich erstellt (ID: ${lexwareQuotationId}${lexwareQuotationNumber ? ", Nr: " + lexwareQuotationNumber : ""})!`
  });
}
__name(createLexwareQuotation, "createLexwareQuotation");
async function createLexwareOrderConfirmation(projectId, env2) {
  const project = await env2.DB.prepare(
    "SELECT p.*, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?"
  ).bind(projectId).first();
  if (!project)
    return errorResponse("Projekt nicht gefunden", 404);
  if (!env2.LEXWARE_API_KEY)
    return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
  const defaultRate = project.default_hourly_rate || 120;
  const plannedHours = project.planned_hours || 0;
  const totalBudgetNet = project.total_budget_net || defaultRate * plannedHours;
  const orderConfPayload = {
    voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
    address: {
      name: project.customer_name || "Kunde",
      contactId: project.lexware_contact_id,
      street: project.street || null,
      zip: project.zip_code || null,
      city: project.city || null,
      countryCode: project.country_code || "DE"
    },
    lineItems: [
      {
        type: "custom",
        name: `Auftragsbest\xE4tigung: ${project.name}`,
        description: `Projekt: ${project.project_number || "Standard"}
Laufzeit: ${project.start_date || "sofort"} bis ${project.end_date || "gem. Vereinbarung"}
Vereinbartes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. \xE0 ${defaultRate.toFixed(2)} \u20AC/h Netto.`,
        quantity: plannedHours > 0 ? plannedHours : 1,
        unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
        unitPrice: {
          currency: "EUR",
          netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
          taxRatePercentage: 19
        }
      }
    ],
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
    shippingConditions: {
      shippingDate: project.start_date ? new Date(project.start_date).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      shippingType: "service"
    },
    introduction: `Sehr geehrte Damen und Herren,

vielen Dank f\xFCr die Auftragserteilung. Wir best\xE4tigen Ihren Auftrag zu folgenden Konditionen:`,
    remark: `Abrechnung erfolgt monatlich mit GoBD-konformem T\xE4tigkeits- und Leistungsnachweis.`
  };
  const ocRes = await fetch("https://api.lexware.io/v1/order-confirmations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(orderConfPayload)
  });
  if (!ocRes.ok) {
    const errText = await ocRes.text();
    return errorResponse(`Lexware Order-Confirmation Fehler: ${errText}`, 400);
  }
  const ocData = await ocRes.json();
  const lexwareOrderConfId = ocData.id;
  let lexwareOrderConfNumber = null;
  try {
    const ocDetailRes = await fetch(
      `https://api.lexware.io/v1/order-confirmations/${lexwareOrderConfId}`,
      {
        headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
      }
    );
    if (ocDetailRes.ok) {
      const ocDetail = await ocDetailRes.json();
      lexwareOrderConfNumber = ocDetail.voucherNumber || null;
    }
  } catch {
  }
  await env2.DB.prepare(
    "UPDATE projects SET lexware_order_confirmation_id = ?, lexware_order_confirmation_number = ? WHERE id = ?"
  ).bind(lexwareOrderConfId, lexwareOrderConfNumber, projectId).run();
  return jsonResponse({
    success: true,
    lexwareOrderConfId,
    lexwareOrderConfNumber,
    message: `Auftragsbest\xE4tigung in Lexware erfolgreich erstellt (ID: ${lexwareOrderConfId}${lexwareOrderConfNumber ? ", Nr: " + lexwareOrderConfNumber : ""})!`
  });
}
__name(createLexwareOrderConfirmation, "createLexwareOrderConfirmation");
async function handleLexwareWebhook(request, env2) {
  const body = await request.json();
  const event = (body.event || body.type || body.eventType || "").toLowerCase();
  const resourceId = body.resourceId || body.id || body.voucherId;
  const resourceType = (body.resourceType || "").toLowerCase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    if (event.startsWith("voucher.") || resourceType === "voucher") {
      const exp = await env2.DB.prepare(
        "SELECT * FROM trip_expenses WHERE lexware_voucher_id = ?"
      ).bind(resourceId).first();
      if (exp) {
        if (event === "voucher.deleted" || event === "voucher_deleted") {
          await env2.DB.prepare(
            "UPDATE trip_expenses SET is_synced_to_lexware = 0, lexware_voucher_id = NULL, lexware_voucher_number = NULL, lexware_status = 'deleted' WHERE id = ?"
          ).bind(exp.id).run();
          await logAuditEvent(env2, {
            eventType: "WEBHOOK_EXPENSE_DELETED",
            entityType: "trip_expense",
            entityId: exp.id,
            actor: "Lexware Webhook",
            description: `Ausgaben-Beleg '${exp.description}' (${exp.amount_gross} \u20AC) wurde in Lexware gel\xF6scht. Verkn\xFCpfung im Hub freigegeben.`
          });
        } else if (event === "voucher.status-changed" || event === "voucher.voided" || event === "voucher.canceled") {
          if (env2.LEXWARE_API_KEY) {
            try {
              const vRes = await fetch(`https://api.lexware.io/v1/vouchers/${resourceId}`, {
                headers: {
                  Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
                  Accept: "application/json"
                }
              });
              if (vRes.ok) {
                const vData = await vRes.json();
                const vStat = (vData.voucherStatus || "").toLowerCase();
                if (vStat === "voided" || vStat === "canceled" || vStat === "storniert") {
                  await env2.DB.prepare(
                    "UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?"
                  ).bind(now, exp.id).run();
                  await logAuditEvent(env2, {
                    eventType: "WEBHOOK_EXPENSE_VOIDED",
                    entityType: "trip_expense",
                    entityId: exp.id,
                    actor: "Lexware Webhook",
                    description: `Ausgaben-Beleg '${exp.description}' (${exp.amount_gross} \u20AC) wurde in Lexware storniert. Im Archiv markiert.`
                  });
                }
              }
            } catch {
            }
          }
        }
      }
    }
    if (event.startsWith("invoice.") || resourceType === "invoice" || event.startsWith("voucher.")) {
      const ts = await env2.DB.prepare(
        "SELECT * FROM timesheet_versions WHERE lexware_invoice_id = ?"
      ).bind(resourceId).first();
      if (ts) {
        if (event === "invoice.canceled" || event === "voucher.canceled" || event === "invoice.voided" || event === "voucher.status-changed") {
          if (env2.LEXWARE_API_KEY) {
            try {
              const invRes = await fetch(`https://api.lexware.io/v1/invoices/${resourceId}`, {
                headers: {
                  Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
                  Accept: "application/json"
                }
              });
              if (invRes.ok) {
                const invData = await invRes.json();
                const vStat = (invData.voucherStatus || "").toLowerCase();
                if (vStat === "voided" || vStat === "canceled" || vStat === "storniert") {
                  await env2.DB.prepare(
                    "UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?"
                  ).bind(now, ts.id).run();
                  await logAuditEvent(env2, {
                    eventType: "WEBHOOK_INVOICE_CANCELED",
                    entityType: "timesheet_version",
                    entityId: ts.id,
                    actor: "Lexware Webhook",
                    description: `Rechnung ${ts.lexware_invoice_number || resourceId} in Lexware storniert. Stundenzettel auf 'InvoiceCanceled' gesetzt.`
                  });
                } else if (vStat === "paid" || vStat === "paidoff") {
                  await env2.DB.prepare(
                    "UPDATE timesheet_versions SET is_invoice_paid = 1, invoice_paid_at_utc = ? WHERE id = ?"
                  ).bind(now, ts.id).run();
                }
              } else if (invRes.status === 404) {
                await env2.DB.prepare(
                  "UPDATE timesheet_versions SET status = 'Approved', lexware_invoice_id = NULL, lexware_invoice_number = NULL WHERE id = ?"
                ).bind(ts.id).run();
              }
            } catch {
            }
          }
        }
      }
    }
    if (event.startsWith("quotation.") || event.startsWith("order-confirmation.")) {
      const project = await env2.DB.prepare(
        "SELECT * FROM projects WHERE lexware_quotation_id = ? OR lexware_order_confirmation_id = ?"
      ).bind(resourceId, resourceId).first();
      if (project) {
        if (event === "quotation.deleted" || event === "order-confirmation.deleted") {
          const { results: entries } = await env2.DB.prepare(
            "SELECT id FROM time_entries WHERE project_id = ?"
          ).bind(project.id).all();
          if (!entries || entries.length === 0) {
            await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(project.id).run();
          } else {
            await env2.DB.prepare(
              "UPDATE projects SET is_active = 0, is_archived = 1 WHERE id = ?"
            ).bind(project.id).run();
          }
        } else if (event === "quotation.status-changed") {
          if (env2.LEXWARE_API_KEY) {
            try {
              const qRes = await fetch(`https://api.lexware.io/v1/quotations/${resourceId}`, {
                headers: {
                  Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
                  Accept: "application/json"
                }
              });
              if (qRes.ok) {
                const qData = await qRes.json();
                const vStat = (qData.voucherStatus || "").toLowerCase();
                if (vStat === "accepted") {
                  await env2.DB.prepare(
                    "UPDATE projects SET lexware_quotation_status = 'accepted', is_active = 1 WHERE id = ?"
                  ).bind(project.id).run();
                } else if (vStat === "rejected") {
                  await env2.DB.prepare(
                    "UPDATE projects SET lexware_quotation_status = 'rejected', is_active = 0, is_archived = 1 WHERE id = ?"
                  ).bind(project.id).run();
                }
              }
            } catch {
            }
          }
        }
      }
    }
  } catch (webhookErr) {
    console.error("Webhook processing error:", webhookErr?.message || webhookErr);
  }
  return jsonResponse({ success: true, message: "Webhook empfangen & verarbeitet" });
}
__name(handleLexwareWebhook, "handleLexwareWebhook");
async function registerLexwareWebhooks(request, env2) {
  if (!env2.LEXWARE_API_KEY)
    return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
  let reqBody = {};
  try {
    reqBody = await request.json();
  } catch {
  }
  let callbackUrl = reqBody.callbackUrl;
  if (!callbackUrl) {
    const workerOrigin = new URL(request.url).origin;
    callbackUrl = `${workerOrigin}/api/v1/webhooks/lexware`;
  }
  const eventsToSubscribe = [
    "voucher.created",
    "voucher.status-changed",
    "voucher.deleted",
    "invoice.created",
    "invoice.status-changed",
    "invoice.deleted",
    "quotation.status-changed",
    "quotation.deleted",
    "order-confirmation.status-changed",
    "order-confirmation.deleted"
  ];
  const results = [];
  for (const eventName of eventsToSubscribe) {
    try {
      const subRes = await fetch("https://api.lexware.io/v1/event-subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          eventType: eventName,
          callbackUrl
        })
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        results.push({ event: eventName, status: "subscribed", id: subData.id });
      } else {
        const errText = await subRes.text();
        results.push({
          event: eventName,
          status: "failed",
          statusCode: subRes.status,
          error: errText
        });
      }
    } catch (e) {
      results.push({ event: eventName, status: "error", error: e.message });
    }
  }
  return jsonResponse({
    success: true,
    callbackUrl,
    subscriptions: results,
    message: `Lexware Webhook Registrierung f\xFCr Callback-URL '${callbackUrl}' abgeschlossen.`
  });
}
__name(registerLexwareWebhooks, "registerLexwareWebhooks");
async function syncFullLexwareStatus(env2) {
  if (!env2.LEXWARE_API_KEY)
    return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let canceledInvoicesCount = 0;
  let canceledExpensesCount = 0;
  let cleanedProjectsCount = 0;
  let paidInvoicesCount = 0;
  try {
    const vListRes = await fetch(
      "https://api.lexware.io/v1/voucherlist?voucherType=invoice,creditnote,purchase,expense&voucherStatus=draft,open,paid,paidoff,voided,transferred,sepadebit&size=250",
      {
        headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
      }
    );
    if (vListRes.ok) {
      const vListData = await vListRes.json();
      const content = vListData.content || [];
      for (const item of content) {
        const vStatus = (item.voucherStatus || "").toLowerCase();
        const vNum = item.voucherNumber || "";
        const vId = item.id;
        const vType = (item.voucherType || "").toLowerCase();
        if (vType === "invoice" || vType === "creditnote") {
          if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
            const res = await env2.DB.prepare(`
              UPDATE timesheet_versions 
              SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = COALESCE(invoice_canceled_at_utc, ?), lexware_invoice_number = COALESCE(lexware_invoice_number, ?)
              WHERE (lexware_invoice_id = ? OR lexware_invoice_number = ?) AND (status != 'InvoiceCanceled' OR is_invoice_canceled = 0)
            `).bind(now, vNum, vId, vNum).run();
            if (res.meta.changes > 0)
              canceledInvoicesCount += res.meta.changes;
          } else if (vStatus === "paid" || vStatus === "paidoff") {
            const res = await env2.DB.prepare(`
              UPDATE timesheet_versions 
              SET is_invoice_paid = 1, invoice_paid_at_utc = COALESCE(invoice_paid_at_utc, ?)
              WHERE (lexware_invoice_id = ? OR lexware_invoice_number = ?) AND is_invoice_paid = 0
            `).bind(now, vId, vNum).run();
            if (res.meta.changes > 0)
              paidInvoicesCount += res.meta.changes;
          }
        }
        if (vType === "purchase" || vType === "expense") {
          if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
            const res = await env2.DB.prepare(`
              UPDATE trip_expenses 
              SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = COALESCE(voucher_canceled_at_utc, ?), lexware_voucher_number = COALESCE(lexware_voucher_number, ?)
              WHERE (lexware_voucher_id = ? OR lexware_voucher_number = ? OR description LIKE ?) AND is_voucher_canceled = 0
            `).bind(now, vNum, vId, vNum, `%${vNum}%`).run();
            if (res.meta.changes > 0)
              canceledExpensesCount += res.meta.changes;
          }
        }
      }
    }
  } catch (e) {
    console.error("Voucherlist sync error:", e.message);
  }
  const { results: invoicedTimesheets } = await env2.DB.prepare(
    "SELECT * FROM timesheet_versions WHERE lexware_invoice_id IS NOT NULL"
  ).all();
  for (const ts of invoicedTimesheets) {
    try {
      const checkRes = await fetch(
        `https://api.lexware.io/v1/invoices/${ts.lexware_invoice_id}`,
        {
          headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
        }
      );
      if (checkRes.status === 404) {
        if (ts.status !== "InvoiceCanceled") {
          await env2.DB.prepare(
            "UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?"
          ).bind(now, ts.id).run();
          canceledInvoicesCount++;
        }
      } else if (checkRes.ok) {
        const invData = await checkRes.json();
        const vStatus = (invData.voucherStatus || "").toLowerCase();
        if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
          if (ts.status !== "InvoiceCanceled" || !ts.is_invoice_canceled) {
            await env2.DB.prepare(
              "UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?"
            ).bind(now, ts.id).run();
            canceledInvoicesCount++;
          }
        } else if (vStatus === "paid" || vStatus === "paidoff") {
          if (!ts.is_invoice_paid) {
            await env2.DB.prepare(
              "UPDATE timesheet_versions SET is_invoice_paid = 1, invoice_paid_at_utc = ? WHERE id = ?"
            ).bind(now, ts.id).run();
            paidInvoicesCount++;
          }
        }
      }
    } catch {
    }
  }
  const { results: syncedExpenses } = await env2.DB.prepare(
    "SELECT * FROM trip_expenses WHERE lexware_voucher_id IS NOT NULL"
  ).all();
  for (const exp of syncedExpenses) {
    try {
      const checkRes = await fetch(
        `https://api.lexware.io/v1/vouchers/${exp.lexware_voucher_id}`,
        {
          headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
        }
      );
      if (checkRes.status === 404) {
        if (!exp.is_voucher_canceled) {
          await env2.DB.prepare(
            "UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?"
          ).bind(now, exp.id).run();
          canceledExpensesCount++;
        }
      } else if (checkRes.ok) {
        const vData = await checkRes.json();
        const vStatus = (vData.voucherStatus || "").toLowerCase();
        if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
          if (!exp.is_voucher_canceled) {
            await env2.DB.prepare(
              "UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?"
            ).bind(now, exp.id).run();
            canceledExpensesCount++;
          }
        } else if (vData.voucherNumber && !exp.lexware_voucher_number) {
          await env2.DB.prepare(
            "UPDATE trip_expenses SET lexware_voucher_number = ?, lexware_status = 'open' WHERE id = ?"
          ).bind(vData.voucherNumber, exp.id).run();
        }
      }
    } catch {
    }
  }
  const { results: allProjectsWithDocs } = await env2.DB.prepare(
    "SELECT * FROM projects WHERE lexware_quotation_id IS NOT NULL OR lexware_order_confirmation_id IS NOT NULL"
  ).all();
  for (const proj of allProjectsWithDocs) {
    if (proj.lexware_quotation_id) {
      try {
        const qRes = await fetch(
          `https://api.lexware.io/v1/quotations/${proj.lexware_quotation_id}`,
          {
            headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
          }
        );
        if (qRes.status === 404) {
          const { results: entries } = await env2.DB.prepare(
            "SELECT id FROM time_entries WHERE project_id = ?"
          ).bind(proj.id).all();
          const { results: tripList } = await env2.DB.prepare(
            "SELECT id FROM trips WHERE project_id = ?"
          ).bind(proj.id).all();
          if ((!entries || entries.length === 0) && (!tripList || tripList.length === 0)) {
            await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(proj.id).run();
          } else {
            await env2.DB.prepare(
              "UPDATE projects SET lexware_quotation_id = NULL, lexware_quotation_number = NULL, lexware_quotation_status = 'deleted', is_active = 0, is_archived = 1 WHERE id = ?"
            ).bind(proj.id).run();
          }
          cleanedProjectsCount++;
        } else if (qRes.ok) {
          const qData = await qRes.json();
          const vStatus = (qData.voucherStatus || "").toLowerCase();
          if (qData.archived === true || vStatus === "archived" || vStatus === "rejected" || vStatus === "canceled" || vStatus === "voided") {
            await env2.DB.prepare(
              "UPDATE projects SET lexware_quotation_status = ?, is_active = 0, is_archived = 1 WHERE id = ?"
            ).bind(vStatus === "archived" || qData.archived ? "archived" : "rejected", proj.id).run();
            cleanedProjectsCount++;
          } else if (qData.voucherNumber && qData.voucherNumber !== proj.lexware_quotation_number) {
            await env2.DB.prepare(
              "UPDATE projects SET lexware_quotation_number = ? WHERE id = ?"
            ).bind(qData.voucherNumber, proj.id).run();
          }
        }
      } catch {
      }
    }
    if (proj.lexware_order_confirmation_id) {
      try {
        const ocRes = await fetch(
          `https://api.lexware.io/v1/order-confirmations/${proj.lexware_order_confirmation_id}`,
          {
            headers: { Authorization: `Bearer ${env2.LEXWARE_API_KEY}`, Accept: "application/json" }
          }
        );
        if (ocRes.status === 404) {
          await env2.DB.prepare(
            "UPDATE projects SET lexware_order_confirmation_id = NULL, lexware_order_confirmation_number = NULL, lexware_order_confirmation_status = 'deleted' WHERE id = ?"
          ).bind(proj.id).run();
          cleanedProjectsCount++;
        } else if (ocRes.ok) {
          const ocData = await ocRes.json();
          const ocStatus = (ocData.voucherStatus || "").toLowerCase();
          if (ocData.archived === true || ocStatus === "archived" || ocStatus === "rejected" || ocStatus === "canceled" || ocStatus === "voided") {
            await env2.DB.prepare(
              "UPDATE projects SET lexware_order_confirmation_status = ?, is_active = 0, is_archived = 1 WHERE id = ?"
            ).bind(ocStatus === "archived" || ocData.archived ? "archived" : "rejected", proj.id).run();
            cleanedProjectsCount++;
          } else if (ocData.voucherNumber && ocData.voucherNumber !== proj.lexware_order_confirmation_number) {
            await env2.DB.prepare(
              "UPDATE projects SET lexware_order_confirmation_number = ? WHERE id = ?"
            ).bind(ocData.voucherNumber, proj.id).run();
          }
        }
      } catch {
      }
    }
  }
  return jsonResponse({
    success: true,
    canceledInvoicesCount,
    canceledExpensesCount,
    cleanedProjectsCount,
    paidInvoicesCount,
    message: `Gesamtabgleich abgeschlossen: ${canceledInvoicesCount} Rechnungs-Stornos, ${canceledExpensesCount} stornierte Spesen, ${cleanedProjectsCount} bereinigte Angebote/Projekte, ${paidInvoicesCount} bezahlte Rechnungen synchronisiert.`
  });
}
__name(syncFullLexwareStatus, "syncFullLexwareStatus");
async function unlinkExpenseFromLexware(expenseId, env2) {
  const exp = await env2.DB.prepare("SELECT * FROM trip_expenses WHERE id = ?").bind(expenseId).first();
  if (!exp)
    return errorResponse("Spesenbeleg nicht gefunden", 404);
  await env2.DB.prepare(
    "UPDATE trip_expenses SET is_synced_to_lexware = 0, lexware_voucher_id = NULL, lexware_voucher_number = NULL, is_voucher_canceled = 0, lexware_status = 'open' WHERE id = ?"
  ).bind(expenseId).run();
  await logAuditEvent(env2, {
    eventType: "EXPENSE_UNLINKED",
    entityType: "trip_expense",
    entityId: expenseId,
    actor: "Admin",
    description: `Spesenbeleg '${exp.description}' (${exp.amount_gross} \u20AC) von Lexware entkoppelt und zur erneuten Buchung freigegeben.`
  });
  return jsonResponse({
    success: true,
    message: "Spesenbeleg erfolgreich entkoppelt. Sie k\xF6nnen ihn nun erneut an Lexware \xFCbertragen."
  });
}
__name(unlinkExpenseFromLexware, "unlinkExpenseFromLexware");
async function syncVoucherToLexware(voucherId, env2) {
  await ensureOperationalVouchers(env2);
  const v = await env2.DB.prepare("SELECT * FROM operational_vouchers WHERE id = ?").bind(voucherId).first();
  if (!v)
    return errorResponse("Beleg nicht gefunden.", 404);
  const apiKey = env2.LEXWARE_API_KEY;
  if (!apiKey) {
    return errorResponse("Kein LEXWARE_API_KEY konfiguriert.", 400);
  }
  try {
    const voucherItems = [];
    if (v.voucher_type === "Hospitality") {
      voucherItems.push({
        amount: Number(v.tax_deductible_net.toFixed(2)),
        taxAmount: Number(
          (v.amount_gross * (v.business_share_percent / 100) - v.amount_net * (v.business_share_percent / 100)).toFixed(2)
        ),
        taxRatePercent: v.tax_rate,
        categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
      });
      if (v.tax_non_deductible_net > 0) {
        voucherItems.push({
          amount: Number(v.tax_non_deductible_net.toFixed(2)),
          taxAmount: 0,
          taxRatePercent: 0,
          categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
        });
      }
      if (v.tip_amount > 0) {
        voucherItems.push({
          amount: Number(v.tip_amount.toFixed(2)),
          taxAmount: 0,
          taxRatePercent: 0,
          categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
        });
      }
    } else {
      voucherItems.push({
        amount: Number(v.amount_net.toFixed(2)),
        taxAmount: Number(v.tax_amount.toFixed(2)),
        taxRatePercent: v.tax_rate,
        categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
      });
    }
    const lexBody = {
      voucherType: "purchaseinvoice",
      voucherNumber: v.voucher_number,
      voucherDate: `${v.voucher_date}T00:00:00.000+01:00`,
      shippingDate: `${v.voucher_date}T00:00:00.000+01:00`,
      totalGrossAmount: v.amount_gross + v.tip_amount,
      totalTaxAmount: v.tax_amount,
      taxType: "net",
      useAdditionalTax: false,
      remark: `${v.voucher_type}: ${v.supplier_name} - ${v.business_purpose}`,
      voucherItems
    };
    const lexRes = await fetchLexwareWithRetry("https://api.lexoffice.io/v1/vouchers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(lexBody)
    });
    if (!lexRes.ok) {
      const errText = await lexRes.text();
      if (lexRes.status === 429) {
        return errorResponse(
          "Lexware API Rate-Limit erreicht (max. 2 Anfragen/Sekunde). Bitte warten Sie ca. 5 Sekunden und versuchen Sie es erneut.",
          429
        );
      }
      return errorResponse(`Lexware API Fehler (${lexRes.status}): ${errText}`, 400);
    }
    const lexData = await lexRes.json();
    const lexVoucherId = lexData.id;
    if (v.receipt_r2_key) {
      try {
        await new Promise((r) => setTimeout(r, 600));
        const fileObj = await env2.STORAGE.get(v.receipt_r2_key);
        if (fileObj) {
          const fileBytes = await fileObj.arrayBuffer();
          const uploadForm = new FormData();
          const blob = new Blob([fileBytes], { type: v.receipt_mime_type || "image/jpeg" });
          uploadForm.append("file", blob, v.receipt_filename || "beleg.jpg");
          await fetchLexwareWithRetry(`https://api.lexoffice.io/v1/vouchers/${lexVoucherId}/files`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: uploadForm
          });
        }
      } catch (fileErr) {
        console.warn("Could not attach receipt file to Lexware voucher:", fileErr);
      }
    }
    await env2.DB.prepare(`
      UPDATE operational_vouchers 
      SET is_synced_to_lexware = 1, lexware_voucher_id = ?, lexware_status = 'synced', updated_at_utc = ?
      WHERE id = ?
    `).bind(lexVoucherId, (/* @__PURE__ */ new Date()).toISOString(), voucherId).run();
    return jsonResponse({
      success: true,
      lexwareVoucherId: lexVoucherId,
      message: `Beleg ${v.voucher_number} erfolgreich als Ausgabenbeleg zu Lexware \xFCbertragen.`
    });
  } catch (err) {
    return errorResponse(`Fehler bei Lexware Sync: ${err?.message || err}`, 500);
  }
}
__name(syncVoucherToLexware, "syncVoucherToLexware");

// src/routes/settings.routes.ts
async function handleSettingsRoutes(request, env2, path, method) {
  if (path === "/api/v1/webhooks/lexware" && method === "POST") {
    return handleLexwareWebhook(request, env2);
  }
  if (path === "/api/v1/settings/register-lexware-webhooks" && method === "POST") {
    return registerLexwareWebhooks(request, env2);
  }
  if (path === "/api/v1/sync/full-lexware-status" && method === "POST") {
    return syncFullLexwareStatus(env2);
  }
  if (path === "/api/v1/settings" && method === "GET") {
    await ensureSettings(env2);
    const isDemo = isDemoRequest(request);
    if (isDemo) {
      return jsonResponse({
        id: "global_config",
        mileage_rate_business: 0.3,
        commute_rate_tier1: 0.3,
        commute_rate_tier2: 0.38,
        vma_rate_8h: 14,
        vma_rate_24h: 28,
        pdf_storage_mode: "R2",
        email_sender_name: "Max Mustercontoso | Cloud & Security Architecture",
        email_sender_email: "max.mustercontoso@mail1.contoso.com",
        email_service: "resend",
        email_api_key: "",
        email_subject_template: "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
        email_body_template: "",
        email_reminder1_subject: "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
        email_reminder1_body: "",
        email_reminder2_subject: "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
        email_reminder2_body: "",
        email_admin_notify_rejection: 1,
        email_admin_notify_reminder: 1,
        use_signature_on_documents: 1,
        contractor_title: "Senior Cloud & Security Architect",
        company_name: "Contoso Cloud & Security Architecture GmbH",
        contractor_name: "Max Mustercontoso",
        company_street: "Contoso Allee 100",
        company_zip: "10115",
        company_city: "Berlin",
        company_address: "Contoso Allee 100, 10115 Berlin",
        company_type: "Freiberufler",
        tax_assessment_type: "E\xDCR",
        tax_number: "34/123/45678",
        vat_id: "DE123456789",
        w_idnr: "",
        taxation_type: "Ist-Versteuerung",
        enable_ai_vision: 1,
        billing_provider: "lexware",
        chart_of_accounts: "SKR04",
        tax_mode: "standard",
        datev_consultant_number: "1001",
        datev_client_number: "10001",
        lexware_webhook_callback_url: ""
      });
    }
    const defaultEmailBody = `Sehr geehrte(r) {contactPerson},

f\xFCr das Projekt "{projectName}" ({customerName}) liegt der T\xE4tigkeits- und Leistungsnachweis f\xFCr den Abrechnungszeitraum {period} zur Pr\xFCfung und Freigabe bereit.

\xDCbersicht:
\u2022 Projekt: {projectName}
\u2022 Zeitraum: {period}
\u2022 Geleistete Stunden: {hours} Std.
\u2022 Gesamtbetrag (Netto): {amountNet} \u20AC

Bitte pr\xFCfen und signieren Sie den Leistungsnachweis \xFCber folgenden Freigabelink:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
    const defaultReminder1Body = `Sehr geehrte(r) {contactPerson},

wir m\xF6chten Sie kurz an die ausstehende Pr\xFCfung des Leistungsnachweises f\xFCr das Projekt "{projectName}" ({period}) erinnern.

Link zur Ansicht & Freigabe:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
    const defaultReminder2Body = `Sehr geehrte(r) {contactPerson},

wir m\xF6chten Sie freundlich daran erinnern, dass die Freigabe des Leistungsnachweises f\xFCr das Projekt "{projectName}" ({period}) noch aussteht.

Bitte pr\xFCfen und best\xE4tigen Sie die Posten zeitnah unter folgendem Link:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
    const settings = await env2.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first();
    const resSettings = settings || {
      id: "global_config",
      mileage_rate_business: 0.3,
      commute_rate_tier1: 0.3,
      commute_rate_tier2: 0.38,
      vma_rate_8h: 14,
      vma_rate_24h: 28,
      pdf_storage_mode: "R2",
      email_sender_name: "Max Mustermann | IT Consulting",
      email_sender_email: "noreply@example.com",
      email_service: "resend",
      email_api_key: "",
      email_subject_template: "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
      email_body_template: defaultEmailBody,
      email_reminder1_subject: "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
      email_reminder1_body: defaultReminder1Body,
      email_reminder2_subject: "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
      email_reminder2_body: defaultReminder2Body,
      email_admin_notify_rejection: 1,
      email_admin_notify_reminder: 1,
      use_signature_on_documents: 1,
      billing_provider: "lexware",
      chart_of_accounts: "SKR04",
      tax_mode: "standard",
      datev_consultant_number: "1001",
      datev_client_number: "10001",
      company_name: "Musterfirma IT Consulting",
      contractor_name: "Max Mustermann",
      company_street: "Musterstra\xDFe 1",
      company_zip: "10115",
      company_city: "Berlin",
      company_address: "Musterstra\xDFe 1, 10115 Berlin",
      company_type: "Freiberufler",
      tax_assessment_type: "E\xDCR",
      contractor_title: "Senior Cloud & Security Architect"
    };
    if (!resSettings.email_body_template || resSettings.email_body_template.trim() === "") {
      resSettings.email_body_template = defaultEmailBody;
    }
    if (!resSettings.email_reminder1_body || resSettings.email_reminder1_body.trim() === "" || resSettings.email_reminder1_body.trim().length < 65) {
      resSettings.email_reminder1_body = defaultReminder1Body;
    }
    if (!resSettings.email_reminder2_body || resSettings.email_reminder2_body.trim() === "" || resSettings.email_reminder2_body.trim().length < 65) {
      resSettings.email_reminder2_body = defaultReminder2Body;
    }
    resSettings.has_env_lexware_key = !!(env2.LEXWARE_API_KEY && env2.LEXWARE_API_KEY.trim());
    return jsonResponse(resSettings);
  }
  if (path === "/api/v1/settings" && method === "PUT") {
    await ensureSettings(env2);
    const body = await request.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await env2.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first();
    await env2.DB.prepare(`
      UPDATE app_settings
      SET mileage_rate_business = ?,
          commute_rate_tier1 = ?,
          commute_rate_tier2 = ?,
          vma_rate_8h = ?,
          vma_rate_24h = ?,
          pdf_storage_mode = ?,
          email_sender_name = ?,
          email_sender_email = ?,
          email_service = ?,
          email_api_key = ?,
          email_subject_template = ?,
          email_body_template = ?,
          email_reminder1_subject = ?,
          email_reminder1_body = ?,
          email_reminder2_subject = ?,
          email_reminder2_body = ?,
          email_admin_notify_rejection = ?,
          email_admin_notify_reminder = ?,
          contractor_signature_data_url = ?,
          use_signature_on_documents = ?,
          contractor_title = ?,
          lexware_webhook_callback_url = ?,
          billing_provider = ?,
          chart_of_accounts = ?,
          tax_mode = ?,
          datev_consultant_number = ?,
          datev_client_number = ?,
          company_name = ?,
          contractor_name = ?,
          company_street = ?,
          company_zip = ?,
          company_city = ?,
          company_address = ?,
          company_type = ?,
          tax_assessment_type = ?,
          tax_number = ?,
          vat_id = ?,
          w_idnr = ?,
          taxation_type = ?,
          enable_ai_vision = ?,
          ai_vision_model = ?,
          ai_pdf_model = ?,
          ai_auto_provider_detect = ?,
          ai_custom_rules_json = ?,
          default_transport_type = ?,
          lexware_api_key = ?,
          lexware_own_vendor_id = ?,
          gemini_api_key = ?,
          gemini_model = ?,
          ai_prompt_image = ?,
          ai_prompt_pdf = ?,
          foreign_rates_custom_json = ?,
          vehicle_planning_json = ?,
          updated_at_utc = ?
      WHERE id = 'global_config'
    `).bind(
      body.mileage_rate_business !== void 0 ? parseFloat(body.mileage_rate_business) : existing?.mileage_rate_business ?? 0.3,
      body.commute_rate_tier1 !== void 0 ? parseFloat(body.commute_rate_tier1) : existing?.commute_rate_tier1 ?? 0.3,
      body.commute_rate_tier2 !== void 0 ? parseFloat(body.commute_rate_tier2) : existing?.commute_rate_tier2 ?? 0.38,
      body.vma_rate_8h !== void 0 ? parseFloat(body.vma_rate_8h) : existing?.vma_rate_8h ?? 14,
      body.vma_rate_24h !== void 0 ? parseFloat(body.vma_rate_24h) : existing?.vma_rate_24h ?? 28,
      body.pdf_storage_mode || existing?.pdf_storage_mode || "R2",
      body.email_sender_name || existing?.email_sender_name || "Max Mustermann | IT Consulting",
      body.email_sender_email || existing?.email_sender_email || "noreply@example.com",
      body.email_service || existing?.email_service || "resend",
      body.email_api_key !== void 0 ? body.email_api_key : existing?.email_api_key || "",
      body.email_subject_template || existing?.email_subject_template || "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
      body.email_body_template !== void 0 ? body.email_body_template : existing?.email_body_template || "",
      body.email_reminder1_subject || existing?.email_reminder1_subject || "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
      body.email_reminder1_body !== void 0 ? body.email_reminder1_body : existing?.email_reminder1_body || "",
      body.email_reminder2_subject || existing?.email_reminder2_subject || "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
      body.email_reminder2_body !== void 0 ? body.email_reminder2_body : existing?.email_reminder2_body || "",
      body.email_admin_notify_rejection !== void 0 ? body.email_admin_notify_rejection ? 1 : 0 : existing?.email_admin_notify_rejection ?? 1,
      body.email_admin_notify_reminder !== void 0 ? body.email_admin_notify_reminder ? 1 : 0 : existing?.email_admin_notify_reminder ?? 1,
      body.contractor_signature_data_url !== void 0 ? body.contractor_signature_data_url : existing?.contractor_signature_data_url || null,
      body.use_signature_on_documents !== void 0 ? body.use_signature_on_documents ? 1 : 0 : existing?.use_signature_on_documents ?? 1,
      body.contractor_title || existing?.contractor_title || "Senior Cloud & Security Architect",
      body.lexware_webhook_callback_url !== void 0 ? body.lexware_webhook_callback_url : existing?.lexware_webhook_callback_url || `${new URL(request.url).origin}/api/v1/webhooks/lexware`,
      body.billing_provider || existing?.billing_provider || "lexware",
      body.chart_of_accounts || existing?.chart_of_accounts || "SKR04",
      body.tax_mode || existing?.tax_mode || "standard",
      body.datev_consultant_number || existing?.datev_consultant_number || "1001",
      body.datev_client_number || existing?.datev_client_number || "10001",
      body.company_name || existing?.company_name || "Musterfirma IT Consulting",
      body.contractor_name || existing?.contractor_name || "Max Mustermann",
      body.company_street || existing?.company_street || "Musterstra\xDFe 1",
      body.company_zip || existing?.company_zip || "10115",
      body.company_city || existing?.company_city || "Berlin",
      body.company_address || existing?.company_address || "Musterstra\xDFe 1, 10115 Berlin",
      body.company_type || existing?.company_type || "Freiberufler",
      body.tax_assessment_type || existing?.tax_assessment_type || "E\xDCR",
      body.tax_number !== void 0 ? body.tax_number : existing?.tax_number || "",
      body.vat_id !== void 0 ? body.vat_id : existing?.vat_id || "",
      body.w_idnr !== void 0 ? body.w_idnr : existing?.w_idnr || "",
      body.taxation_type || existing?.taxation_type || "Ist-Versteuerung",
      body.enable_ai_vision !== void 0 ? body.enable_ai_vision ? 1 : 0 : existing?.enable_ai_vision ?? 1,
      body.ai_vision_model || existing?.ai_vision_model || "@cf/meta/llama-3.2-11b-vision-instruct",
      body.ai_pdf_model || existing?.ai_pdf_model || "@cf/meta/llama-3.1-8b-instruct",
      body.ai_auto_provider_detect !== void 0 ? body.ai_auto_provider_detect ? 1 : 0 : existing?.ai_auto_provider_detect ?? 1,
      body.ai_custom_rules_json !== void 0 ? typeof body.ai_custom_rules_json === "string" ? body.ai_custom_rules_json : JSON.stringify(body.ai_custom_rules_json) : existing?.ai_custom_rules_json || "[]",
      body.default_transport_type || existing?.default_transport_type || "Train",
      body.lexware_api_key !== void 0 ? body.lexware_api_key : existing?.lexware_api_key || "",
      body.lexware_own_vendor_id !== void 0 ? body.lexware_own_vendor_id : existing?.lexware_own_vendor_id || "",
      body.gemini_api_key !== void 0 ? body.gemini_api_key : existing?.gemini_api_key || "",
      body.gemini_model || existing?.gemini_model || "gemini-3.1-flash-lite-preview",
      body.ai_prompt_image !== void 0 ? body.ai_prompt_image : existing?.ai_prompt_image || "",
      body.ai_prompt_pdf !== void 0 ? body.ai_prompt_pdf : existing?.ai_prompt_pdf || "",
      body.foreign_rates_custom_json !== void 0 ? typeof body.foreign_rates_custom_json === "string" ? body.foreign_rates_custom_json : JSON.stringify(body.foreign_rates_custom_json) : existing?.foreign_rates_custom_json || "{}",
      body.vehicle_planning_json !== void 0 ? typeof body.vehicle_planning_json === "string" ? body.vehicle_planning_json : JSON.stringify(body.vehicle_planning_json) : existing?.vehicle_planning_json || "{}",
      now
    ).run();
    await logAuditEvent(env2, {
      eventType: "SETTINGS_UPDATED",
      entityType: "system_settings",
      entityId: "global_config",
      actor: "Admin",
      description: `Globale Einstellungen & Firmendaten aktualisiert.`
    });
    return jsonResponse({ success: true, message: "Einstellungen erfolgreich gespeichert!" });
  }
  if (path === "/api/v1/settings/test-lexware-connection" && method === "POST") {
    let testKey = "";
    try {
      const body = await request.json();
      if (body?.apiKey && body.apiKey.trim())
        testKey = body.apiKey.trim();
    } catch {
    }
    if (!testKey) {
      testKey = await getEffectiveLexwareApiKey(env2, request);
    }
    if (!testKey) {
      return errorResponse("Kein Lexware API-Schl\xFCssel \xFCbergeben oder hinterlegt.", 400);
    }
    try {
      const profileRes = await fetchLexwareWithRetry("https://api.lexware.io/v1/profile", {
        headers: {
          Authorization: `Bearer ${testKey}`,
          Accept: "application/json"
        }
      });
      if (!profileRes.ok) {
        const errTxt = await profileRes.text();
        return errorResponse(`Lexware antwortet mit Fehler (${profileRes.status}): ${errTxt}`, 400);
      }
      const profileData = await profileRes.json();
      return jsonResponse({
        success: true,
        companyName: profileData.companyName || profileData.name || "Lexware Organisation",
        email: profileData.email || "",
        message: "Verbindung zu Lexware Office erfolgreich hergestellt."
      });
    } catch (err) {
      return errorResponse(`Verbindungsfehler zu Lexware: ${err?.message || err}`, 500);
    }
  }
  if (path === "/api/v1/settings/import-lexware-profile" && method === "POST") {
    await ensureSettings(env2);
    const apiKey = await getEffectiveLexwareApiKey(env2, request);
    if (!apiKey)
      return errorResponse("Kein LEXWARE_API_KEY konfiguriert oder hinterlegt.", 400);
    try {
      const profileRes = await fetchLexwareWithRetry("https://api.lexware.io/v1/profile", {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
      });
      let compName = "Musterfirma IT Consulting";
      let contName = "Max Mustermann";
      let street = "Musterstra\xDFe 1";
      let zip = "10115";
      let city = "Berlin";
      let address = "Musterstra\xDFe 1, 10115 Berlin";
      let taxNum = "";
      let vatId = "";
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.companyName || pData.name)
          compName = pData.companyName || pData.name;
        if (pData.contactPerson)
          contName = pData.contactPerson;
        if (pData.street)
          street = pData.street;
        if (pData.zip)
          zip = pData.zip;
        if (pData.city)
          city = pData.city;
        if (street && zip && city)
          address = `${street}, ${zip} ${city}`;
        if (pData.taxNumber)
          taxNum = pData.taxNumber;
        if (pData.vatId)
          vatId = pData.vatId;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await env2.DB.prepare(`
        UPDATE app_settings
        SET company_name = ?,
            contractor_name = ?,
            company_street = ?,
            company_zip = ?,
            company_city = ?,
            company_address = ?,
            tax_number = COALESCE(NULLIF(?, ''), tax_number),
            vat_id = COALESCE(NULLIF(?, ''), vat_id),
            updated_at_utc = ?
        WHERE id = 'global_config'
      `).bind(compName, contName, street, zip, city, address, taxNum, vatId, now).run();
      return jsonResponse({
        success: true,
        message: "Firmendaten erfolgreich aus Lexware Office importiert!",
        profile: {
          company_name: compName,
          contractor_name: contName,
          company_address: address,
          tax_number: taxNum,
          vat_id: vatId
        }
      });
    } catch (lexErr) {
      return errorResponse(`Lexware-Import fehlgeschlagen: ${lexErr?.message || lexErr}`, 500);
    }
  }
  if (path === "/api/v1/settings/lexware-vendors" && method === "GET") {
    await ensureSettings(env2);
    const apiKey = await getEffectiveLexwareApiKey(env2, request);
    if (!apiKey)
      return jsonResponse({
        success: true,
        vendors: [],
        message: "Kein LEXWARE_API_KEY konfiguriert"
      });
    try {
      const res = await fetchLexwareWithRetry("https://api.lexware.io/v1/contacts", {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
      });
      if (!res.ok) {
        return errorResponse(`Fehler beim Abrufen der Kontakte (${res.status})`, 400);
      }
      const data = await res.json();
      const allContacts = data.content || [];
      const vendors = allContacts.filter((c) => c.roles && c.roles.vendor).map((c) => {
        const name = c.company?.name || `${c.person?.firstName || ""} ${c.person?.lastName || ""}`.trim() || "Unbekannt";
        const vendorNumber = c.roles?.vendor?.number || "";
        const note = c.note || "";
        const isSuggested = name.toLowerCase().includes("eigen") || note.toLowerCase().includes("eigen");
        return {
          id: c.id,
          name,
          vendorNumber,
          note,
          isSuggested
        };
      });
      const suggested = vendors.find((v) => v.isSuggested);
      return jsonResponse({
        vendors,
        suggestedVendorId: suggested?.id || null,
        suggestedVendorNumber: suggested?.vendorNumber || null,
        suggestedName: suggested?.name || null
      });
    } catch (err) {
      return errorResponse(`Fehler beim Abrufen der Lieferanten: ${err.message}`, 500);
    }
  }
  return null;
}
__name(handleSettingsRoutes, "handleSettingsRoutes");

// src/routes/dashboard.routes.ts
async function handleDashboardRoutes(request, env2, path, method) {
  if (path === "/api/v1/dashboard/stats" && method === "GET") {
    const { results: openTimeEntries } = await env2.DB.prepare(`
      SELECT t.*, p.default_hourly_rate, tv.status as ts_status, tv.is_invoice_canceled
      FROM time_entries t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
      WHERE (tv.status IS NULL OR tv.status IN ('Draft', 'Rejected') OR tv.is_invoice_canceled = 1)
        AND p.is_active = 1 AND p.is_archived = 0 AND t.is_billable = 1
    `).all();
    const openHours = (openTimeEntries || []).reduce(
      (sum, e) => sum + (e.billable_duration_hours || 0),
      0
    );
    const openTimeAmountNet = (openTimeEntries || []).reduce(
      (sum, e) => sum + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || e.default_hourly_rate || 0),
      0
    );
    const { results: openTrips } = await env2.DB.prepare(`
      SELECT tr.*, tv.status as ts_status, tv.is_invoice_canceled
      FROM trips tr
      JOIN projects p ON tr.project_id = p.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
      WHERE (tv.status IS NULL OR tv.status IN ('Draft', 'Rejected') OR tv.is_invoice_canceled = 1)
        AND p.is_active = 1 AND p.is_archived = 0
    `).all();
    const openTravelAmountNet = (openTrips || []).reduce(
      (sum, tr) => sum + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0),
      0
    );
    const openTotalNet = openTimeAmountNet + openTravelAmountNet;
    const now = /* @__PURE__ */ new Date();
    const past3Months = [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    const { results: invoicedTimesheets } = await env2.DB.prepare(`
      SELECT tv.*, p.name as project_name, c.name as customer_name
      FROM timesheet_versions tv
      JOIN projects p ON tv.project_id = p.id
      JOIN customers c ON p.customer_id = c.id
      WHERE (tv.status IN ('Approved', 'Invoiced') OR tv.lexware_invoice_id IS NOT NULL)
        AND tv.is_invoice_canceled = 0
        AND tv.period IN (?, ?, ?)
        AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
    `).bind(past3Months[0], past3Months[1], past3Months[2]).all();
    const past3MonthsRevenue = (invoicedTimesheets || []).reduce(
      (sum, ts) => sum + (ts.total_amount_net || 0),
      0
    );
    const { results: activeProjects } = await env2.DB.prepare(`
      SELECT p.*, c.name as customer_name,
        (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
        (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.is_active = 1 AND p.is_archived = 0 AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
      ORDER BY p.name ASC
    `).all();
    const projectsList = (activeProjects || []).map((p) => {
      const plannedHours = p.planned_hours || 0;
      const defaultRate = p.default_hourly_rate || 0;
      const totalBudgetNet = p.total_budget_net || plannedHours * defaultRate;
      const recordedHours = p.recorded_hours || 0;
      const recordedAmountNet = p.recorded_amount_net || 0;
      const remainingHours = Math.max(0, plannedHours - recordedHours);
      const remainingBudgetNet = Math.max(0, totalBudgetNet - recordedAmountNet);
      const usagePercent = totalBudgetNet > 0 ? Math.min(100, Math.round(recordedAmountNet / totalBudgetNet * 100)) : 0;
      return {
        id: p.id,
        name: p.name,
        projectNumber: p.project_number,
        customerName: p.customer_name,
        defaultHourlyRate: defaultRate,
        plannedHours,
        recordedHours,
        remainingHours,
        totalBudgetNet,
        recordedAmountNet,
        remainingBudgetNet,
        budgetUsagePercent: usagePercent,
        startDate: p.start_date,
        endDate: p.end_date,
        quotationNumber: p.lexware_quotation_number,
        orderConfirmationNumber: p.lexware_order_confirmation_number
      };
    });
    const next3MonthsForecast = projectsList.reduce((sum, p) => sum + p.remainingBudgetNet, 0);
    const { results: recentTimesheets } = await env2.DB.prepare(`
      SELECT tv.*, p.name as project_name, p.project_number, c.name as customer_name
      FROM timesheet_versions tv
      JOIN projects p ON tv.project_id = p.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.is_archived = 0
        AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
      ORDER BY tv.period DESC, tv.created_at_utc DESC
      LIMIT 10
    `).all();
    return jsonResponse({
      success: true,
      openBilling: {
        hours: openHours,
        timeAmountNet: openTimeAmountNet,
        travelAmountNet: openTravelAmountNet,
        totalNet: openTotalNet
      },
      past3Months: {
        periods: past3Months,
        totalRevenueNet: past3MonthsRevenue,
        timesheetsCount: (invoicedTimesheets || []).length
      },
      forecast3Months: {
        totalForecastNet: next3MonthsForecast,
        activeProjectsCount: projectsList.length
      },
      projects: projectsList,
      recentTimesheets: recentTimesheets || []
    });
  }
  return null;
}
__name(handleDashboardRoutes, "handleDashboardRoutes");

// src/routes/projects_customers.routes.ts
async function handleProjectsCustomersRoutes(request, env2, path, method) {
  const url = new URL(request.url);
  if (path === "/api/v1/customers" && method === "GET") {
    const isDemo = isDemoRequest(request);
    if (isDemo) {
      await ensureDemoSeedData(env2);
      const { results: results2 } = await env2.DB.prepare(`
        SELECT c.*, 
          (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1) as active_projects_count,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
        FROM customers c 
        WHERE c.id LIKE 'cust_demo_%' OR c.id = 'cust_internal'
        ORDER BY c.name ASC
      `).all();
      const sanitized = (results2 || []).map((c) => {
        if (c.id === "cust_internal") {
          return {
            ...c,
            contact_person: "Max Mustercontoso",
            email: "admin@example.com",
            street: "Contoso Allee 100",
            city: "Berlin",
            zip_code: "10115"
          };
        }
        return c;
      });
      return jsonResponse(sanitized);
    }
    try {
      await syncLexwareContactsInternal(env2);
    } catch (e) {
      console.warn("Auto-sync Lexware contacts failed silently:", e?.message || e);
    }
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const query = includeArchived ? `SELECT c.*, 
          (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1 AND p.id NOT LIKE 'prj_demo_%') as active_projects_count,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
         FROM customers c 
         WHERE c.id NOT LIKE 'cust_demo_%'
         ORDER BY c.is_archived ASC, c.name ASC` : `SELECT c.*, 
          (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1 AND p.id NOT LIKE 'prj_demo_%') as active_projects_count,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
         FROM customers c 
         WHERE c.is_archived = 0 AND c.id NOT LIKE 'cust_demo_%'
         ORDER BY c.name ASC`;
    const { results } = await env2.DB.prepare(query).all();
    return jsonResponse(results);
  }
  const customerOverviewMatch = path.match(
    /^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)\/overview$/
  );
  if (customerOverviewMatch && method === "GET") {
    await ensureProjectColumns(env2);
    const customerId = customerOverviewMatch[1];
    const customer = await env2.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first();
    if (!customer) {
      return errorResponse("Kunde nicht gefunden", 404);
    }
    const { results: projects } = await env2.DB.prepare(`
      SELECT p.*,
        (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
        (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
        (SELECT COALESCE(SUM(tr.customer_reimbursable_cost), 0) FROM trips tr WHERE tr.project_id = p.id) as recorded_travel_costs,
        (SELECT COUNT(*) FROM timesheet_versions tv WHERE tv.project_id = p.id) as timesheets_count,
        parent.name as parent_project_name,
        parent.project_number as parent_project_number
      FROM projects p
      LEFT JOIN projects parent ON p.parent_project_id = parent.id
      WHERE p.customer_id = ?
      ORDER BY p.is_archived ASC, p.name ASC
    `).bind(customerId).all();
    const enrichedProjects = (projects || []).map((p) => {
      const plannedHours = p.planned_hours || 0;
      const recordedHours = p.recorded_hours || 0;
      const totalBudgetNet = p.total_budget_net || p.default_hourly_rate * plannedHours;
      const recordedAmountNet = p.recorded_amount_net || recordedHours * p.default_hourly_rate;
      const recordedTravelCosts = p.recorded_travel_costs || 0;
      const travelBudgetNet = p.travel_budget_net || 0;
      const remainingHours = Math.max(0, plannedHours - recordedHours);
      const remainingBudgetNet = Math.max(0, totalBudgetNet - recordedAmountNet);
      const remainingTravelBudgetNet = travelBudgetNet > 0 ? Math.max(0, travelBudgetNet - recordedTravelCosts) : 0;
      const budgetUsagePercent = totalBudgetNet > 0 ? Math.min(100, Math.round(recordedAmountNet / totalBudgetNet * 100)) : 0;
      const travelUsagePercent = travelBudgetNet > 0 ? Math.min(100, Math.round(recordedTravelCosts / travelBudgetNet * 100)) : 0;
      const directChildren = (projects || []).filter(
        (c) => c.parent_project_id === p.id
      );
      const allDescendants = (projects || []).filter(
        (c) => c.parent_project_id === p.id || (projects || []).some(
          (p2) => p2.parent_project_id === p.id && c.parent_project_id === p2.id
        )
      );
      let rollupHours = recordedHours;
      let rollupAmountNet = recordedAmountNet;
      let rollupTravelCosts = recordedTravelCosts;
      for (const desc of allDescendants) {
        rollupHours += desc.recorded_hours || 0;
        rollupAmountNet += desc.recorded_amount_net || 0;
        rollupTravelCosts += desc.recorded_travel_costs || 0;
      }
      const rollupTotalSpentNet = rollupAmountNet + rollupTravelCosts;
      const rollupRemainingBudgetNet = Math.max(0, totalBudgetNet - rollupAmountNet);
      const rollupBudgetUsagePercent = totalBudgetNet > 0 ? Math.min(100, Math.round(rollupAmountNet / totalBudgetNet * 100)) : 0;
      return {
        ...p,
        hierarchy_level: p.hierarchy_level || 1,
        budget_mode: p.budget_mode || "Dedicated",
        travel_budget_net: travelBudgetNet,
        travel_budget_mode: p.travel_budget_mode || "Dedicated",
        total_budget_net: totalBudgetNet,
        recorded_hours: recordedHours,
        recorded_amount_net: recordedAmountNet,
        recorded_travel_costs: recordedTravelCosts,
        remaining_hours: remainingHours,
        remaining_budget_net: remainingBudgetNet,
        remaining_travel_budget_net: remainingTravelBudgetNet,
        budget_usage_percent: budgetUsagePercent,
        travel_usage_percent: travelUsagePercent,
        direct_children_count: directChildren.length,
        descendants_count: allDescendants.length,
        rollup_hours: rollupHours,
        rollup_amount_net: rollupAmountNet,
        rollup_travel_costs: rollupTravelCosts,
        rollup_total_spent_net: rollupTotalSpentNet,
        rollup_remaining_budget_net: rollupRemainingBudgetNet,
        rollup_budget_usage_percent: rollupBudgetUsagePercent
      };
    });
    return jsonResponse({
      customer,
      projects: enrichedProjects
    });
  }
  if (path === "/api/v1/sync/lexware-contacts" && (method === "POST" || method === "GET")) {
    const apiKey = request.headers.get("X-Lexware-Api-Key") || env2.LEXWARE_API_KEY;
    if (!apiKey) {
      return errorResponse(
        "Kein LEXWARE_API_KEY im Worker konfiguriert oder im Header 'X-Lexware-Api-Key' \xFCbergeben.",
        400
      );
    }
    const syncResult = await syncLexwareContactsInternal(env2, apiKey, true);
    if (!syncResult.success) {
      return errorResponse(
        syncResult.error || "Fehler beim Lexware-Abgleich",
        502
      );
    }
    const { results: updatedList } = await env2.DB.prepare(
      "SELECT * FROM customers ORDER BY is_archived ASC, name ASC"
    ).all();
    return jsonResponse({
      success: true,
      message: `Kundenabgleich erfolgreich! ${syncResult.stats?.totalFromLexware || 0} Kontakte synchronisiert (${syncResult.stats?.created || 0} neu angelegt, ${syncResult.stats?.updated || 0} aktualisiert, ${syncResult.stats?.archived || 0} archiviert, ${syncResult.stats?.deleted || 0} gel\xF6scht).`,
      stats: syncResult.stats,
      customers: updatedList
    });
  }
  const projectDetailsMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/details$/
  );
  if (projectDetailsMatch && method === "GET") {
    await ensureProjectColumns(env2);
    const projId = projectDetailsMatch[1];
    const project = await env2.DB.prepare(`
      SELECT p.*, c.name as customer_name, c.email as customer_email, c.contact_person, c.lexware_contact_id
      FROM projects p 
      JOIN customers c ON p.customer_id = c.id 
      WHERE p.id = ?
    `).bind(projId).first();
    if (!project) {
      return errorResponse("Projekt nicht gefunden", 404);
    }
    const { results: entries } = await env2.DB.prepare(`
      SELECT t.*, e.problem_statement, e.methodology, e.technical_activity, e.result, e.deliverable
      FROM time_entries t
      LEFT JOIN activity_evidences e ON t.id = e.time_entry_id
      WHERE t.project_id = ?
      ORDER BY t.entry_date DESC, t.start_time DESC
    `).bind(projId).all();
    const { results: trips } = await env2.DB.prepare(`
      SELECT tr.*, p.name as project_name
      FROM trips tr
      LEFT JOIN projects p ON tr.project_id = p.id
      WHERE tr.project_id = ?
      ORDER BY tr.trip_date DESC
    `).bind(projId).all();
    const { results: children } = await env2.DB.prepare(`
      SELECT p.*,
        (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
        (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
        (SELECT COALESCE(SUM(tr.customer_reimbursable_cost), 0) FROM trips tr WHERE tr.project_id = p.id) as recorded_travel_costs
      FROM projects p
      WHERE p.parent_project_id = ? OR p.parent_project_id IN (SELECT id FROM projects WHERE parent_project_id = ?)
      ORDER BY p.hierarchy_level ASC, p.name ASC
    `).bind(projId, projId).all();
    let parentProject = null;
    if (project.parent_project_id) {
      parentProject = await env2.DB.prepare(`
        SELECT p.*,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
          (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
          (SELECT COALESCE(SUM(tr.customer_reimbursable_cost), 0) FROM trips tr WHERE tr.project_id = p.id) as recorded_travel_costs
        FROM projects p WHERE p.id = ?
      `).bind(project.parent_project_id).first();
    }
    const totalHours = (entries || []).reduce(
      (sum, e) => sum + (e.billable_duration_hours || 0),
      0
    );
    const totalAmountNet = (entries || []).reduce(
      (sum, e) => sum + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || project.default_hourly_rate),
      0
    );
    const totalTravelCost = (trips || []).reduce(
      (sum, tr) => sum + (tr.customer_reimbursable_cost || 0),
      0
    );
    const plannedHours = project.planned_hours || 0;
    const totalBudgetNet = project.total_budget_net || plannedHours * project.default_hourly_rate;
    const travelBudgetNet = project.travel_budget_net || 0;
    const childHours = (children || []).reduce(
      (s, c) => s + (c.recorded_hours || 0),
      0
    );
    const childAmount = (children || []).reduce(
      (s, c) => s + (c.recorded_amount_net || 0),
      0
    );
    const childTravel = (children || []).reduce(
      (s, c) => s + (c.recorded_travel_costs || 0),
      0
    );
    const rollupHours = totalHours + childHours;
    const rollupAmountNet = totalAmountNet + childAmount;
    const rollupTravelCosts = totalTravelCost + childTravel;
    const rollupTotalSpentNet = rollupAmountNet + rollupTravelCosts;
    return jsonResponse({
      project: {
        ...project,
        recorded_hours: totalHours,
        recorded_amount_net: totalAmountNet,
        recorded_travel_costs: totalTravelCost,
        travel_budget_net: travelBudgetNet,
        planned_hours: plannedHours,
        total_budget_net: totalBudgetNet,
        remaining_hours: Math.max(0, plannedHours - totalHours),
        remaining_budget_net: Math.max(0, totalBudgetNet - totalAmountNet),
        remaining_travel_budget_net: travelBudgetNet > 0 ? Math.max(0, travelBudgetNet - totalTravelCost) : 0,
        budget_usage_percent: totalBudgetNet > 0 ? Math.min(100, Math.round(totalAmountNet / totalBudgetNet * 100)) : 0
      },
      timeEntries: entries || [],
      trips: trips || [],
      children: children || [],
      parentProject,
      rollup: {
        rollup_hours: rollupHours,
        rollup_amount_net: rollupAmountNet,
        rollup_travel_costs: rollupTravelCosts,
        rollup_total_spent_net: rollupTotalSpentNet,
        rollup_remaining_budget_net: Math.max(0, totalBudgetNet - rollupAmountNet),
        rollup_budget_usage_percent: totalBudgetNet > 0 ? Math.min(100, Math.round(rollupAmountNet / totalBudgetNet * 100)) : 0,
        children_count: (children || []).length
      }
    });
  }
  if (path === "/api/v1/projects" && method === "GET") {
    await ensureProjectColumns(env2);
    const isDemo = isDemoRequest(request);
    const customerId = url.searchParams.get("customerId");
    let query;
    if (isDemo) {
      await ensureDemoSeedData(env2);
      query = customerId ? env2.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE p.customer_id = ? AND (c.id LIKE 'cust_demo_%' OR c.id = 'cust_internal') AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `).bind(customerId) : env2.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE (c.id LIKE 'cust_demo_%' OR c.id = 'cust_internal') AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `);
    } else {
      query = customerId ? env2.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE p.customer_id = ? AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL) AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `).bind(customerId) : env2.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL) AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `);
    }
    const { results } = await query.all();
    return jsonResponse(results);
  }
  if (path === "/api/v1/projects" && method === "POST") {
    await ensureProjectColumns(env2);
    const body = await request.json();
    const projId = body.id || `prj_${Date.now()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const defaultRate = Number(body.defaultHourlyRate) || 120;
    const plannedHours = Number(body.plannedHours) || 0;
    const totalBudgetNet = body.totalBudgetNet ? Number(body.totalBudgetNet) : defaultRate * plannedHours;
    const parentProjectId = body.parentProjectId || null;
    const hierarchyLevel = Number(body.hierarchyLevel) || 1;
    const budgetMode = body.budgetMode || "Dedicated";
    const travelBudgetNet = body.travelBudgetNet !== void 0 ? Number(body.travelBudgetNet) : 0;
    const travelBudgetMode = body.travelBudgetMode || "Dedicated";
    const customer = await env2.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(body.customerId).first();
    const approverEmail = body.approverEmail || customer?.email || "";
    const approverName = body.approverName || customer?.contact_person || null;
    await env2.DB.prepare(`
      INSERT INTO projects (
        id, customer_id, project_number, name, end_customer_name, purchase_order_number, contract_number, 
        default_hourly_rate, planned_hours, total_budget_net, travel_budget_net, travel_budget_mode,
        parent_project_id, hierarchy_level, budget_mode, start_date, end_date, 
        lexware_service_article_id, billing_interval_minutes, 
        approver_email, approver_name, approver_2_email, approver_2_name, approver_3_email, approver_3_name,
        travel_time_billable, travel_time_rate_multiplier, public_transit_reimbursable, is_active, created_at_utc, updated_at_utc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      projId,
      body.customerId,
      body.projectNumber || `PRJ-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      body.name,
      body.endCustomerName || null,
      body.purchaseOrderNumber || null,
      body.contractNumber || null,
      defaultRate,
      plannedHours,
      totalBudgetNet,
      travelBudgetNet,
      travelBudgetMode,
      parentProjectId,
      hierarchyLevel,
      budgetMode,
      body.startDate || null,
      body.endDate || null,
      body.lexwareServiceArticleId || "IT-ARCH",
      body.billingIntervalMinutes || 15,
      approverEmail,
      approverName,
      body.approver2Email || null,
      body.approver2Name || null,
      body.approver3Email || null,
      body.approver3Name || null,
      body.travelTimeBillable ? 1 : 0,
      body.travelTimeRateMultiplier || 1,
      body.publicTransitReimbursable !== false ? 1 : 0,
      now,
      now
    ).run();
    if (Array.isArray(body.subProjects) && body.subProjects.length > 0) {
      for (let idx = 0; idx < body.subProjects.length; idx++) {
        const sub = body.subProjects[idx];
        if (!sub || !sub.name)
          continue;
        const subId = sub.id || `prj_${Date.now()}_${idx + 1}_${Math.floor(100 + Math.random() * 900)}`;
        const subLevel = Number(sub.hierarchyLevel) || hierarchyLevel + 1;
        const subRate = Number(sub.defaultHourlyRate) || defaultRate;
        const subHours = Number(sub.plannedHours) || 0;
        const subBudgetMode = sub.budgetMode || "PooledFromParent";
        const subTotalBudget = subBudgetMode === "PooledFromParent" ? 0 : sub.totalBudgetNet ? Number(sub.totalBudgetNet) : subRate * subHours;
        const subTravelBudget = Number(sub.travelBudgetNet) || 0;
        const subTravelMode = sub.travelBudgetMode || "PooledFromParent";
        const subParentId = sub.parentProjectId || projId;
        const subNumber = sub.projectNumber || `${body.projectNumber || "PRJ"}-S${idx + 1}`;
        await env2.DB.prepare(`
          INSERT INTO projects (
            id, customer_id, project_number, name, end_customer_name,
            default_hourly_rate, planned_hours, total_budget_net, travel_budget_net, travel_budget_mode,
            parent_project_id, hierarchy_level, budget_mode, start_date, end_date,
            lexware_service_article_id, billing_interval_minutes,
            approver_email, approver_name, approver_2_email, approver_2_name, approver_3_email, approver_3_name,
            travel_time_billable, travel_time_rate_multiplier, public_transit_reimbursable, is_active, created_at_utc, updated_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          subId,
          body.customerId,
          subNumber,
          sub.name,
          body.endCustomerName || null,
          subRate,
          subHours,
          subTotalBudget,
          subTravelBudget,
          subTravelMode,
          subParentId,
          subLevel,
          subBudgetMode,
          body.startDate || null,
          body.endDate || null,
          body.lexwareServiceArticleId || "IT-ARCH",
          body.billingIntervalMinutes || 15,
          approverEmail,
          approverName,
          body.approver2Email || null,
          body.approver2Name || null,
          body.approver3Email || null,
          body.approver3Name || null,
          body.travelTimeBillable ? 1 : 0,
          body.travelTimeRateMultiplier || 1,
          body.publicTransitReimbursable !== false ? 1 : 0,
          now,
          now
        ).run();
      }
    }
    let lexwareQuotationId = null;
    let quotationError = null;
    if (body.createLexwareQuotation && env2.LEXWARE_API_KEY && customer?.lexware_contact_id) {
      try {
        const quotationPayload = {
          voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
          expirationDate: body.endDate ? new Date(body.endDate).toISOString() : new Date(Date.now() + 30 * 864e5).toISOString(),
          address: {
            name: customer.name || "Kunde",
            contactId: customer.lexware_contact_id,
            street: customer.street || null,
            zip: customer.zip_code || null,
            city: customer.city || null,
            countryCode: customer.country_code || "DE"
          },
          lineItems: [
            {
              type: "custom",
              name: `Architektur & Engineering: ${body.name}`,
              description: `Projekt: ${body.projectNumber || "Standard"}
Laufzeit: ${body.startDate || "sofort"} bis ${body.endDate || "gem. Vereinbarung"}
Geplantes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. \xE0 ${defaultRate.toFixed(2)} \u20AC/h Netto.`,
              quantity: plannedHours > 0 ? plannedHours : 1,
              unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
              unitPrice: {
                currency: "EUR",
                netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
                taxRatePercentage: 19
              }
            }
          ],
          totalPrice: {
            currency: "EUR"
          },
          taxConditions: {
            taxType: "net"
          },
          introduction: `Sehr geehrte Damen und Herren,

vielen Dank f\xFCr die Projektanfrage. Gerne bieten wir Ihnen unsere freiberuflichen Architektur- und Beratungsleistungen wie folgt an:`,
          remark: `Abrechnung erfolgt monatlich nach tats\xE4chlich erbrachten Stunden mit GoBD-konformem T\xE4tigkeits- und Leistungsnachweis.`
        };
        const qRes = await fetch("https://api.lexware.io/v1/quotations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(quotationPayload)
        });
        if (qRes.ok) {
          const qData = await qRes.json();
          lexwareQuotationId = qData.id;
          let lexwareQuotationNumber = null;
          try {
            const qDetailRes = await fetch(
              `https://api.lexware.io/v1/quotations/${lexwareQuotationId}`,
              {
                headers: {
                  Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
                  Accept: "application/json"
                }
              }
            );
            if (qDetailRes.ok) {
              const qDetail = await qDetailRes.json();
              lexwareQuotationNumber = qDetail.voucherNumber || null;
            }
          } catch {
          }
          await env2.DB.prepare(
            "UPDATE projects SET lexware_quotation_id = ?, lexware_quotation_number = ? WHERE id = ?"
          ).bind(lexwareQuotationId, lexwareQuotationNumber, projId).run();
        } else {
          quotationError = await qRes.text();
          console.error("Lexware Quotation API Error:", qRes.status, quotationError);
        }
      } catch (e) {
        quotationError = e.message;
        console.error("Lexware Quotation Generation Exception:", e.message);
      }
    }
    return jsonResponse({
      success: true,
      id: projId,
      totalBudgetNet,
      lexwareQuotationId,
      quotationError,
      message: lexwareQuotationId ? `Projekt '${body.name}' erfolgreich angelegt und Angebot in Lexware erstellt (ID: ${lexwareQuotationId})!` : quotationError ? `Projekt angelegt, aber Lexware Angebot fehlgeschlagen: ${quotationError}` : `Projekt '${body.name}' erfolgreich angelegt.`
    });
  }
  const createQuotationMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/create-quotation$/
  );
  if (createQuotationMatch && method === "POST") {
    return createLexwareQuotation(createQuotationMatch[1], env2);
  }
  const createOrderConfMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/create-order-confirmation$/
  );
  if (createOrderConfMatch && method === "POST") {
    return createLexwareOrderConfirmation(createOrderConfMatch[1], env2);
  }
  const projectUpdateMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)$/
  );
  if (projectUpdateMatch && method === "PUT") {
    await ensureProjectColumns(env2);
    const projId = projectUpdateMatch[1];
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
    if (!project)
      return errorResponse("Projekt nicht gefunden", 404);
    const body = await request.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const defaultRate = body.defaultHourlyRate !== void 0 ? Number(body.defaultHourlyRate) : project.default_hourly_rate || 120;
    const plannedHours = body.plannedHours !== void 0 ? Number(body.plannedHours) : project.planned_hours;
    const totalBudgetNet = body.totalBudgetNet !== void 0 ? Number(body.totalBudgetNet) : defaultRate * plannedHours;
    const travelBudgetNet = body.travelBudgetNet !== void 0 ? Number(body.travelBudgetNet) : project.travel_budget_net || 0;
    const travelBudgetMode = body.travelBudgetMode !== void 0 ? body.travelBudgetMode : project.travel_budget_mode || "Dedicated";
    const hierarchyLevel = body.hierarchyLevel !== void 0 ? Number(body.hierarchyLevel) : project.hierarchy_level || 1;
    const budgetMode = body.budgetMode !== void 0 ? body.budgetMode : project.budget_mode || "Dedicated";
    const parentProjectId = body.parentProjectId !== void 0 ? body.parentProjectId || null : project.parent_project_id;
    await env2.DB.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        end_customer_name = ?,
        project_number = COALESCE(?, project_number),
        purchase_order_number = ?,
        contract_number = ?,
        default_hourly_rate = ?,
        planned_hours = ?,
        total_budget_net = ?,
        travel_budget_net = ?,
        travel_budget_mode = ?,
        parent_project_id = ?,
        hierarchy_level = ?,
        budget_mode = ?,
        start_date = ?,
        end_date = ?,
        approver_email = ?,
        approver_name = ?,
        approver_2_email = ?,
        approver_2_name = ?,
        approver_3_email = ?,
        approver_3_name = ?,
        travel_time_billable = ?,
        travel_time_rate_multiplier = ?,
        public_transit_reimbursable = ?,
        is_active = 1,
        is_archived = 0,
        updated_at_utc = ?
      WHERE id = ?
    `).bind(
      body.name || null,
      body.endCustomerName !== void 0 ? body.endCustomerName : project.end_customer_name,
      body.projectNumber || null,
      body.purchaseOrderNumber !== void 0 ? body.purchaseOrderNumber : project.purchase_order_number,
      body.contractNumber !== void 0 ? body.contractNumber : project.contract_number,
      defaultRate,
      plannedHours,
      totalBudgetNet,
      travelBudgetNet,
      travelBudgetMode,
      parentProjectId,
      hierarchyLevel,
      budgetMode,
      body.startDate !== void 0 ? body.startDate : project.start_date,
      body.endDate !== void 0 ? body.endDate : project.end_date,
      body.approverEmail !== void 0 ? body.approverEmail : project.approver_email,
      body.approverName !== void 0 ? body.approverName : project.approver_name,
      body.approver2Email !== void 0 ? body.approver2Email : project.approver_2_email,
      body.approver2Name !== void 0 ? body.approver2Name : project.approver_2_name,
      body.approver3Email !== void 0 ? body.approver3Email : project.approver_3_email,
      body.approver3Name !== void 0 ? body.approver3Name : project.approver_3_name,
      body.travelTimeBillable !== void 0 ? body.travelTimeBillable ? 1 : 0 : project.travel_time_billable,
      body.travelTimeRateMultiplier !== void 0 ? Number(body.travelTimeRateMultiplier) : project.travel_time_rate_multiplier,
      body.publicTransitReimbursable !== void 0 ? body.publicTransitReimbursable ? 1 : 0 : project.public_transit_reimbursable,
      now,
      projId
    ).run();
    const updatedProject = await env2.DB.prepare(
      "SELECT * FROM projects WHERE id = ?"
    ).bind(projId).first();
    return jsonResponse({
      success: true,
      message: "Projektdaten und Freigabeberechtigte erfolgreich aktualisiert!",
      project: updatedProject
    });
  }
  if (projectUpdateMatch && method === "DELETE") {
    const projId = projectUpdateMatch[1];
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
    if (!project)
      return errorResponse("Projekt nicht gefunden", 404);
    const timeEntriesCount = (await env2.DB.prepare(
      "SELECT COUNT(*) as cnt FROM time_entries WHERE project_id = ?"
    ).bind(projId).first())?.cnt || 0;
    const tripsCount = (await env2.DB.prepare(
      "SELECT COUNT(*) as cnt FROM trips WHERE project_id = ?"
    ).bind(projId).first())?.cnt || 0;
    const hasVouchers = !!(project.lexware_quotation_id || project.lexware_order_confirmation_id);
    if (timeEntriesCount > 0 || tripsCount > 0 || hasVouchers) {
      return errorResponse(
        `Projekt kann nicht gel\xF6scht werden, da Verkn\xFCpfungen existieren (${timeEntriesCount} Zeiteintr\xE4ge, ${tripsCount} Reisekosten, Belege: ${project.lexware_quotation_number || project.lexware_order_confirmation_number || "Vorhanden"}). Bitte archivieren Sie das Projekt stattdessen.`,
        400
      );
    }
    try {
      await env2.DB.prepare(
        "DELETE FROM approvals WHERE timesheet_version_id IN (SELECT id FROM timesheet_versions WHERE project_id = ?)"
      ).bind(projId).run();
    } catch {
    }
    try {
      await env2.DB.prepare(
        "DELETE FROM billing_batches WHERE project_id = ?"
      ).bind(projId).run();
    } catch {
    }
    try {
      await env2.DB.prepare(
        "DELETE FROM monthly_archive_seals WHERE project_id = ?"
      ).bind(projId).run();
    } catch {
    }
    try {
      await env2.DB.prepare("DELETE FROM receipts WHERE project_id = ?").bind(projId).run();
    } catch {
    }
    try {
      await env2.DB.prepare(
        "DELETE FROM timesheet_versions WHERE project_id = ?"
      ).bind(projId).run();
    } catch {
    }
    await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projId).run();
    await logAuditEvent(env2, {
      eventType: "PROJECT_DELETED",
      entityType: "project",
      entityId: projId,
      actor: "Admin",
      description: `Projekt '${project.name}' (${project.project_number}) restlos gel\xF6scht.`
    });
    return jsonResponse({
      success: true,
      message: `Projekt '${project.name}' wurde erfolgreich gel\xF6scht.`
    });
  }
  const projectArchiveMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/archive$/
  );
  if (projectArchiveMatch && method === "POST") {
    const projId = projectArchiveMatch[1];
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
    if (!project)
      return errorResponse("Projekt nicht gefunden", 404);
    await env2.DB.prepare(
      "UPDATE projects SET is_active = 0, is_archived = 1 WHERE id = ?"
    ).bind(projId).run();
    await logAuditEvent(env2, {
      eventType: "PROJECT_ARCHIVED",
      entityType: "project",
      entityId: projId,
      actor: "Admin",
      description: `Projekt '${project.name}' (${project.project_number}) wurde manuell archiviert und gesperrt.`
    });
    return jsonResponse({
      success: true,
      message: `Projekt '${project.name}' wurde archiviert und gesperrt.`
    });
  }
  const projectUnarchiveMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/unarchive$/
  );
  if (projectUnarchiveMatch && method === "POST") {
    const projId = projectUnarchiveMatch[1];
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
    if (!project)
      return errorResponse("Projekt nicht gefunden", 404);
    await env2.DB.prepare(
      "UPDATE projects SET is_active = 1, is_archived = 0 WHERE id = ?"
    ).bind(projId).run();
    await logAuditEvent(env2, {
      eventType: "PROJECT_UNARCHIVED",
      entityType: "project",
      entityId: projId,
      actor: "Admin",
      description: `Projekt '${project.name}' (${project.project_number}) wurde reaktiviert und entsperrt.`
    });
    return jsonResponse({
      success: true,
      message: `Projekt '${project.name}' wurde erfolgreich reaktiviert und entsperrt.`
    });
  }
  return null;
}
__name(handleProjectsCustomersRoutes, "handleProjectsCustomersRoutes");

// src/routes/time_entries.routes.ts
async function handleTimeEntriesRoutes(request, env2, path, method) {
  const url = new URL(request.url);
  if (path === "/api/v1/time-entries" && method === "GET") {
    const projectId = url.searchParams.get("projectId");
    const timesheetId = url.searchParams.get("timesheetId");
    const isDemo = isDemoRequest(request);
    let query;
    if (timesheetId) {
      query = env2.DB.prepare(
        "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE t.timesheet_version_id = ? ORDER BY t.entry_date DESC, t.start_time DESC"
      ).bind(timesheetId);
    } else if (projectId) {
      query = env2.DB.prepare(
        "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE t.project_id = ? ORDER BY t.entry_date DESC, t.start_time DESC"
      ).bind(projectId);
    } else {
      query = isDemo ? env2.DB.prepare(
        "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE (p.id LIKE 'prj_demo_%' OR t.id LIKE 'te_demo_%') ORDER BY t.entry_date DESC, t.start_time DESC LIMIT 100"
      ) : env2.DB.prepare(
        "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.id NOT LIKE 'prj_demo_%' AND t.id NOT LIKE 'te_demo_%' ORDER BY t.entry_date DESC, t.start_time DESC LIMIT 100"
      );
    }
    const { results } = await query.all();
    return jsonResponse(results);
  }
  if ((path === "/api/v1/time-entries" || path === "/api/v1/timesheets/entries") && method === "POST") {
    const body = await request.json();
    const entryId = body.id || crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(body.projectId).first();
    if (!project)
      return errorResponse("Projekt nicht gefunden", 404);
    if (project.is_active === 0 || project.is_archived === 1) {
      return errorResponse(
        "Auf archivierte oder gesperrte Projekte k\xF6nnen keine Zeiten gebucht werden.",
        400
      );
    }
    if (body.id) {
      const existingEntry = await env2.DB.prepare(`
        SELECT te.id, tv.status as timesheet_status
        FROM time_entries te
        LEFT JOIN timesheet_versions tv ON te.timesheet_version_id = tv.id
        WHERE te.id = ?
      `).bind(body.id).first();
      if (existingEntry && (existingEntry.timesheet_status === "Approved" || existingEntry.timesheet_status === "InvoiceCanceled")) {
        return errorResponse(
          "Bereits genehmigte oder abgerechnete Zeitbuchungen k\xF6nnen nicht modifiziert werden (GoBD-Schreibschutz).",
          409
        );
      }
    }
    const billingType = body.billingType || (body.isBillable === false ? "NonBillableVisible" : "Billable");
    const isBillable = billingType === "Billable" ? 1 : 0;
    const billingRate = isBillable ? body.billingRateSnapshot || project.default_hourly_rate || 120 : 0;
    let actualHours = 0;
    if (body.startTime && body.endTime) {
      const [startH, startM] = body.startTime.split(":").map(Number);
      const [endH, endM] = body.endTime.split(":").map(Number);
      const totalMinutes = endH * 60 + endM - (startH * 60 + startM) - (body.breakMinutes || 0);
      actualHours = Math.max(0, Math.round(totalMinutes / 60 * 100) / 100);
    } else {
      actualHours = body.actualHours !== void 0 ? body.actualHours : body.durationHours !== void 0 ? body.durationHours : body.hours !== void 0 ? body.hours : body.billableHours || 8;
    }
    const billableHours = isBillable ? body.billableHours !== void 0 ? body.billableHours : body.durationHours !== void 0 ? body.durationHours : body.hours !== void 0 ? body.hours : actualHours : 0;
    const taskRef = body.taskReference || body.evidence && body.evidence.deliverable || null;
    const entryDate = body.entryDate || body.date || now.substring(0, 10);
    const shortDescription = body.shortDescription || body.taskDescription || "Projektarbeit";
    await env2.DB.prepare(`
      INSERT INTO time_entries (id, project_id, timesheet_version_id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_type, billing_rate_snapshot, created_at_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        entry_date = excluded.entry_date,
        actual_duration_hours = excluded.actual_duration_hours,
        billable_duration_hours = excluded.billable_duration_hours,
        short_description = excluded.short_description
    `).bind(
      entryId,
      body.projectId,
      body.timesheetVersionId || null,
      entryDate,
      body.startTime || "09:00",
      body.endTime || "17:30",
      body.breakMinutes || 0,
      actualHours,
      billableHours,
      body.category || "Architecture",
      body.location || "Remote",
      shortDescription,
      taskRef,
      isBillable,
      billingType,
      billingRate,
      now
    ).run();
    if (body.evidence && (body.evidence.problemStatement || body.evidence.methodology || body.evidence.result || body.evidence.deliverable)) {
      const evId = crypto.randomUUID();
      const probStmt = body.evidence.problemStatement || body.evidence.deliverable || body.evidence.result || body.shortDescription || "Architektur- & Fachleistung gem. \xA7 18 EStG";
      await env2.DB.prepare(`
        INSERT INTO activity_evidences (id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        evId,
        entryId,
        probStmt,
        body.evidence.methodology || "",
        body.evidence.technicalActivity || "",
        body.evidence.result || body.evidence.deliverable || "",
        body.evidence.responsibility || "Eigenverantwortliche Konzeption & Durchf\xFChrung",
        body.evidence.deliverable || taskRef || null
      ).run();
    }
    let typeLabel = "Abrechenbar";
    if (billingType === "NonBillableVisible")
      typeLabel = "Nicht abrechenbar (Kunden-sichtbar)";
    if (billingType === "InternalOnly")
      typeLabel = "Nur Intern (Kunden-unsichtbar)";
    await logAuditEvent(env2, {
      eventType: "TIME_ENTRY_CREATED",
      entityType: "time_entry",
      entityId: entryId,
      actor: "User",
      description: `Zeiteintrag f\xFCr ${project.name} am ${body.entryDate} (${actualHours}h, Typ: ${typeLabel}) erfasst.`
    });
    return jsonResponse({
      success: true,
      id: entryId,
      actualHours,
      billableHours,
      billingRate,
      isBillable,
      billingType
    });
  }
  const timeEntryEditMatch = path.match(/^\/api\/v1\/time-entries\/([a-zA-Z0-9_-]+)$/);
  if (timeEntryEditMatch) {
    const entryId = timeEntryEditMatch[1];
    const existing = await env2.DB.prepare(`
      SELECT t.*, p.name as project_name, p.default_hourly_rate, tv.status as ts_status 
      FROM time_entries t 
      JOIN projects p ON t.project_id = p.id 
      LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id 
      WHERE t.id = ?
    `).bind(entryId).first();
    if (!existing)
      return errorResponse("Zeiteintrag nicht gefunden", 404);
    const evidence = await env2.DB.prepare(
      "SELECT * FROM activity_evidences WHERE time_entry_id = ?"
    ).bind(entryId).first();
    if (method === "GET") {
      const isEditable = !existing.ts_status || existing.ts_status === "Draft" || existing.ts_status === "Rejected" || existing.ts_status === "InvoiceCanceled";
      return jsonResponse({
        entry: existing,
        evidence: evidence || null,
        isEditable
      });
    }
    const isLocked = existing.ts_status && (existing.ts_status === "PendingSignature" || existing.ts_status === "Approved" || existing.ts_status === "Invoiced");
    if (isLocked) {
      return errorResponse(
        `Dieser Eintrag ist Teil eines Leistungsnachweises im Status '${existing.ts_status}' und GoBD-gesperrt. Um \xC4nderungen vorzunehmen, muss der Nachweis abgelehnt oder storniert sein.`,
        403
      );
    }
    if (method === "DELETE") {
      await env2.DB.prepare("DELETE FROM activity_evidences WHERE time_entry_id = ?").bind(entryId).run();
      await env2.DB.prepare("DELETE FROM time_entries WHERE id = ?").bind(entryId).run();
      await logAuditEvent(env2, {
        eventType: "TIME_ENTRY_DELETED",
        entityType: "time_entry",
        entityId: entryId,
        actor: "User",
        description: `Zeiteintrag ${entryId} f\xFCr ${existing.project_name} am ${existing.entry_date} (${existing.actual_duration_hours}h, '${existing.short_description}') gel\xF6scht.`
      });
      return jsonResponse({ success: true, message: "Zeiteintrag erfolgreich gel\xF6scht." });
    }
    if (method === "PUT") {
      const body = await request.json();
      const entryDate = body.entryDate || existing.entry_date;
      const startTime = body.startTime || existing.start_time;
      const endTime = body.endTime || existing.end_time;
      const breakMinutes = body.breakMinutes !== void 0 ? parseInt(body.breakMinutes || "0") : existing.break_minutes;
      const category = body.category || existing.category;
      const location = body.location || existing.location;
      const shortDescription = body.shortDescription || existing.short_description;
      const billingType = body.billingType || existing.billing_type || "Billable";
      const isBillable = billingType === "Billable" ? 1 : 0;
      const billingRate = isBillable ? body.billingRateSnapshot || existing.billing_rate_snapshot || existing.default_hourly_rate || 120 : 0;
      let actualHours = existing.actual_duration_hours;
      if (startTime && endTime) {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const totalMinutes = endH * 60 + endM - (startH * 60 + startM) - breakMinutes;
        actualHours = Math.max(0, Math.round(totalMinutes / 60 * 100) / 100);
      }
      const billableHours = isBillable ? body.billableHours !== void 0 ? body.billableHours : actualHours : 0;
      const changes = [];
      if (entryDate !== existing.entry_date)
        changes.push(`Datum: ${existing.entry_date} -> ${entryDate}`);
      if (actualHours !== existing.actual_duration_hours)
        changes.push(`Dauer: ${existing.actual_duration_hours}h -> ${actualHours}h`);
      if (billingType !== existing.billing_type)
        changes.push(`Typ: ${existing.billing_type} -> ${billingType}`);
      if (shortDescription !== existing.short_description)
        changes.push(`T\xE4tigkeit: '${existing.short_description}' -> '${shortDescription}'`);
      if (category !== existing.category)
        changes.push(`Kategorie: ${existing.category} -> ${category}`);
      if (location !== existing.location)
        changes.push(`Ort: ${existing.location} -> ${location}`);
      const taskReference = body.taskReference !== void 0 ? body.taskReference : body.evidence && body.evidence.deliverable !== void 0 ? body.evidence.deliverable : existing.task_or_ticket_reference;
      await env2.DB.prepare(`
        UPDATE time_entries
        SET entry_date = ?, start_time = ?, end_time = ?, break_minutes = ?, actual_duration_hours = ?, billable_duration_hours = ?, category = ?, location = ?, short_description = ?, task_or_ticket_reference = ?, is_billable = ?, billing_type = ?, billing_rate_snapshot = ?
        WHERE id = ?
      `).bind(
        entryDate,
        startTime,
        endTime,
        breakMinutes,
        actualHours,
        billableHours,
        category,
        location,
        shortDescription,
        taskReference,
        isBillable,
        billingType,
        billingRate,
        entryId
      ).run();
      if (body.evidence && (body.evidence.problemStatement || body.evidence.methodology || body.evidence.result || body.evidence.deliverable)) {
        const probStmt = body.evidence.problemStatement || body.evidence.deliverable || body.evidence.result || shortDescription || "Architektur- und Fachleistung gem. \xA7 18 EStG";
        const meth = body.evidence.methodology || "";
        const resStr = body.evidence.result || body.evidence.deliverable || "";
        const deliv = body.evidence.deliverable !== void 0 ? body.evidence.deliverable : taskReference || null;
        if (evidence) {
          await env2.DB.prepare(`
            UPDATE activity_evidences 
            SET problem_statement = ?, methodology = ?, result = ?, deliverable = ?
            WHERE time_entry_id = ?
          `).bind(
            body.evidence.problemStatement || evidence.problem_statement || probStmt,
            body.evidence.methodology !== void 0 ? body.evidence.methodology : evidence.methodology,
            body.evidence.result !== void 0 ? body.evidence.result : evidence.result,
            deliv !== null ? deliv : evidence.deliverable,
            entryId
          ).run();
        } else {
          const evId = crypto.randomUUID();
          await env2.DB.prepare(`
            INSERT INTO activity_evidences (id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable)
            VALUES (?, ?, ?, ?, ?, ?, 'Eigenverantwortliche Durchf\xFChrung', ?)
          `).bind(evId, entryId, probStmt, meth, "", resStr, deliv).run();
        }
        changes.push("\xA7 18 EStG & ADR Nachweis aktualisiert");
      }
      const changeSummary = changes.length > 0 ? changes.join(", ") : "Werte best\xE4tigt";
      await logAuditEvent(env2, {
        eventType: "TIME_ENTRY_UPDATED",
        entityType: "time_entry",
        entityId: entryId,
        actor: "User",
        description: `Zeiteintrag f\xFCr ${existing.project_name} am ${entryDate} korrigiert (${changeSummary}).`
      });
      return jsonResponse({
        success: true,
        message: `Zeiteintrag erfolgreich korrigiert!`,
        changes: changeSummary,
        entry: {
          id: entryId,
          actualHours,
          billableHours,
          billingType,
          shortDescription
        }
      });
    }
  }
  return null;
}
__name(handleTimeEntriesRoutes, "handleTimeEntriesRoutes");

// src/routes/trips_expenses.routes.ts
async function handleTripsExpensesRoutes(request, env2, path, method) {
  const url = new URL(request.url);
  const expenseUnlinkMatch = path.match(
    /^\/api\/v1\/expenses\/([a-zA-Z0-9_-]+)\/unlink-lexware$/
  );
  if (expenseUnlinkMatch && method === "POST") {
    return unlinkExpenseFromLexware(expenseUnlinkMatch[1], env2);
  }
  if (path === "/api/v1/trips/upload-receipt" && method === "POST") {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file)
        return errorResponse("Keine Datei \xFCbermittelt", 400);
      const fileId = crypto.randomUUID();
      const filename = file.name || "receipt.pdf";
      const mimeType = file.type || "application/octet-stream";
      const periodFolder = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
      const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const r2Key = `receipts/${periodFolder}/${fileId}_${cleanName}`;
      const arrayBuffer = await file.arrayBuffer();
      if (env2.STORAGE) {
        await env2.STORAGE.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: mimeType }
        });
      }
      return jsonResponse({
        success: true,
        r2Key,
        filename,
        mimeType,
        size: file.size,
        message: "Beleg erfolgreich hochgeladen und revisionssicher gespeichert."
      });
    } catch (err) {
      return errorResponse("Upload-Fehler: " + err.message, 500);
    }
  }
  if (path.startsWith("/api/v1/trips/receipts/") && method === "GET") {
    const r2Key = decodeURIComponent(path.replace("/api/v1/trips/receipts/", ""));
    if (!env2.STORAGE)
      return errorResponse("Object Storage nicht konfiguriert", 500);
    const object = await env2.STORAGE.get(r2Key);
    if (!object)
      return errorResponse("Beleg nicht gefunden", 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(object.body, { headers });
  }
  if (path === "/api/v1/trips/sync-expenses-to-lexware" && method === "POST") {
    await ensureTripExpenses(env2);
    const body = await request.json();
    const expenseIds = body.expenseIds || [];
    if (!expenseIds || expenseIds.length === 0) {
      return errorResponse("Keine Ausgaben / Belege zum Synchronisieren ausgew\xE4hlt.", 400);
    }
    if (!env2.LEXWARE_API_KEY) {
      return errorResponse(
        "LEXWARE_API_KEY nicht in den Worker-Umgebungsvariablen konfiguriert.",
        500
      );
    }
    let lexwareCategories = [];
    try {
      const catRes = await fetchLexwareWithRetry(
        "https://api.lexware.io/v1/posting-categories",
        {
          headers: {
            Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
            Accept: "application/json"
          }
        }
      );
      if (catRes.ok) {
        lexwareCategories = await catRes.json();
      }
    } catch (cErr) {
      console.error("Error fetching Lexware posting categories:", cErr);
    }
    let syncedCount = 0;
    const results = [];
    for (const expId of expenseIds) {
      await new Promise((r) => setTimeout(r, 600));
      const exp = await env2.DB.prepare(`
        SELECT te.*, tr.purpose as trip_purpose, tr.project_id, p.name as project_name, c.name as customer_name
        FROM trip_expenses te
        LEFT JOIN trips tr ON te.trip_id = tr.id
        LEFT JOIN projects p ON tr.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE te.id = ?
      `).bind(expId).first();
      if (!exp)
        continue;
      let matchedCategoryId = null;
      if (lexwareCategories.length > 0) {
        const catName = (exp.category || "").toLowerCase();
        const desc = (exp.description || "").toLowerCase();
        const skr04 = exp.skr04_account || "";
        let match = lexwareCategories.find((c) => {
          const cn = (c.name || "").toLowerCase();
          if (skr04 === "6668" && (cn.includes("\xFCbernachtung") || cn.includes("hotel")))
            return true;
          if (skr04 === "6663" && (cn.includes("fahrt") || cn.includes("bahn") || cn.includes("\xF6pnv") || cn.includes("fahrkarte")))
            return true;
          if (skr04 === "6670" && (cn.includes("reiseneben") || cn.includes("park") || cn.includes("reise")))
            return true;
          if (skr04 === "6880" && (cn.includes("betriebsbedarf") || cn.includes("b\xFCrobedarf") || cn.includes("hardware") || cn.includes("werkzeug")))
            return true;
          if (skr04 === "6855" && (cn.includes("fachliteratur") || cn.includes("buch") || cn.includes("zeitschrift")))
            return true;
          if (skr04 === "6640" && cn.includes("bewirtung"))
            return true;
          if (cn.includes("reisekosten") || cn.includes("spesen"))
            return true;
          return false;
        });
        if (!match) {
          match = lexwareCategories.find(
            (c) => c.type === "outgo" || c.type === "expenditure" || c.name?.toLowerCase().includes("sonstige") || c.name?.toLowerCase().includes("ausgabe")
          );
        }
        if (!match && lexwareCategories.length > 0) {
          match = lexwareCategories[0];
        }
        if (match) {
          matchedCategoryId = match.id;
        }
      }
      try {
        const expDateFormatted = exp.expense_date ? exp.expense_date.includes("T") ? exp.expense_date : `${exp.expense_date}T08:00:00.000+02:00` : (/* @__PURE__ */ new Date()).toISOString();
        const grossAmount = parseFloat((exp.amount_gross || 0).toFixed(2));
        const taxAmount = parseFloat(
          (exp.tax_amount || grossAmount - grossAmount / (1 + (exp.tax_rate || 0) / 100)).toFixed(2)
        );
        const voucherPayload = {
          type: "purchaseinvoice",
          voucherNumber: `EXP-${exp.id.substring(0, 8).toUpperCase()}`,
          voucherDate: expDateFormatted,
          totalGrossAmount: grossAmount,
          totalTaxAmount: taxAmount,
          taxType: "gross",
          useCollectiveContact: true,
          remark: `Dienstreise: ${exp.trip_purpose || "Reise"} (${exp.project_name || "Projekt"} / ${exp.customer_name || "Kunde"}) - ${exp.description} [SKR04: ${exp.skr04_account}]`,
          voucherItems: [
            {
              amount: grossAmount,
              taxAmount,
              taxRatePercent: exp.tax_rate !== void 0 ? exp.tax_rate : 19,
              categoryId: matchedCategoryId,
              description: `${exp.description} [SKR04: ${exp.skr04_account}]`
            }
          ]
        };
        const voucherRes = await fetchLexwareWithRetry(
          "https://api.lexware.io/v1/vouchers",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify(voucherPayload)
          }
        );
        if (voucherRes.ok) {
          const vData = await voucherRes.json();
          const lexVoucherId = vData.id;
          if (exp.receipt_r2_key && env2.STORAGE) {
            try {
              await new Promise((r) => setTimeout(r, 600));
              const fileObj = await env2.STORAGE.get(exp.receipt_r2_key);
              if (fileObj) {
                const fileBytes = await fileObj.arrayBuffer();
                const uploadForm = new FormData();
                const blob = new Blob([fileBytes], {
                  type: exp.receipt_mime_type || "application/pdf"
                });
                uploadForm.append("file", blob, exp.receipt_filename || "beleg.pdf");
                const attachRes = await fetchLexwareWithRetry(
                  `https://api.lexware.io/v1/vouchers/${lexVoucherId}/files`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${env2.LEXWARE_API_KEY}`,
                      Accept: "application/json"
                    },
                    body: uploadForm
                  }
                );
                if (!attachRes.ok) {
                  console.warn(
                    "Could not attach file to voucher:",
                    attachRes.status,
                    await attachRes.text()
                  );
                }
              }
            } catch (fileErr) {
              console.error("Lexware Voucher File Attach Error:", fileErr?.message || fileErr);
            }
          }
          await env2.DB.prepare(`
            UPDATE trip_expenses 
            SET is_synced_to_lexware = 1, lexware_voucher_id = ?, lexware_voucher_number = ?, lexware_status = 'open', is_voucher_canceled = 0 
            WHERE id = ?
          `).bind(lexVoucherId, voucherPayload.voucherNumber, exp.id).run();
          await logAuditEvent(env2, {
            eventType: "LEXWARE_EXPENSE_SYNCED",
            entityType: "trip_expense",
            entityId: exp.id,
            actor: "User",
            description: `Beleg '${exp.description}' (${grossAmount.toFixed(2)} \u20AC Brutto, SKR04: ${exp.skr04_account}) erfolgreich als Ausgabe in Lexware \xFCbertragen (Voucher-ID: ${lexVoucherId}, Nr: ${voucherPayload.voucherNumber}).`
          });
          syncedCount++;
          results.push({ id: exp.id, success: true, lexwareVoucherId: lexVoucherId });
        } else {
          const errTxt = await voucherRes.text();
          console.error("Lexware Voucher Error:", voucherRes.status, errTxt);
          results.push({ id: exp.id, success: false, error: errTxt });
        }
      } catch (vErr) {
        results.push({ id: exp.id, success: false, error: vErr.message });
      }
    }
    return jsonResponse({
      success: true,
      syncedCount,
      totalRequested: expenseIds.length,
      results,
      message: `${syncedCount} von ${expenseIds.length} Belegen erfolgreich als SKR04-Betriebsausgaben an Lexware \xFCbermittelt!`
    });
  }
  const tripVmaSyncMatch = path.match(
    /^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/(?:sync-vma-to-lexware|sync-vma-lexware)$/
  );
  if (tripVmaSyncMatch && method === "POST") {
    await ensureTripExpenses(env2);
    const tripId = tripVmaSyncMatch[1];
    const tr = await env2.DB.prepare(`
      SELECT tr.*, 
             p.name as project_name, p.project_number, 
             c.name as customer_name
      FROM trips tr
      LEFT JOIN projects p ON tr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE tr.id = ?
    `).bind(tripId).first();
    if (!tr)
      return errorResponse("Reise nicht gefunden", 404);
    const vmaAmount = parseFloat((tr.vma_amount || 0).toFixed(2));
    if (vmaAmount <= 0) {
      return errorResponse(
        "F\xFCr diese Reise ist kein Verpflegungsmehraufwand (VMA = 0,00 \u20AC) berechnet.",
        400
      );
    }
    const apiKey = await getEffectiveLexwareApiKey(env2, request);
    if (!apiKey)
      return errorResponse("Kein LEXWARE_API_KEY konfiguriert.", 400);
    const ownVendorId = await getEffectiveLexwareOwnVendorId(env2, apiKey);
    let lexwareCategories = [];
    try {
      const catRes = await fetchLexwareWithRetry(
        "https://api.lexware.io/v1/posting-categories",
        {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
        }
      );
      if (catRes.ok)
        lexwareCategories = await catRes.json();
    } catch {
    }
    let matchedCategoryId = null;
    if (lexwareCategories.length > 0) {
      let match = lexwareCategories.find((c) => {
        const cn = (c.name || "").toLowerCase();
        return cn.includes("verpflegung") || cn.includes("mehraufwand") || cn.includes("tagegeld") || cn.includes("spesen");
      });
      if (!match) {
        match = lexwareCategories.find((c) => {
          const cn = (c.name || "").toLowerCase();
          return cn.includes("reisekosten") || cn.includes("sonstige");
        });
      }
      if (match)
        matchedCategoryId = match.id;
      else
        matchedCategoryId = lexwareCategories[0]?.id;
    }
    const voucherNum = `VMA-${tr.id.substring(0, 8).toUpperCase()}`;
    const tripDateIso = tr.trip_date ? tr.trip_date.includes("T") ? tr.trip_date : `${tr.trip_date}T08:00:00.000+02:00` : (/* @__PURE__ */ new Date()).toISOString();
    const custProjStr = tr.customer_name || tr.project_name ? `${tr.customer_name || ""}${tr.project_name ? " (" + tr.project_name + ")" : ""}` : "Interne Dienstreise (MCT / Fortbildung)";
    const vmaPayload = {
      type: "purchaseinvoice",
      voucherNumber: voucherNum,
      voucherDate: tripDateIso,
      totalGrossAmount: vmaAmount,
      totalTaxAmount: 0,
      taxType: "gross",
      useCollectiveContact: ownVendorId ? false : true,
      remark: `Eigenbeleg Verpflegungsmehraufwand (\xA7 9 Abs. 4a EStG): ${tr.purpose || "Dienstreise"} (${tr.trip_date} bis ${tr.return_date || tr.trip_date}, ${tr.total_days || 1} Tage) - ${custProjStr}`,
      voucherItems: [
        {
          amount: vmaAmount,
          taxAmount: 0,
          taxRatePercent: 0,
          categoryId: matchedCategoryId,
          description: `Verpflegungsmehraufwand gem. \xA7 9 Abs. 4a EStG [SKR04: 6673] (${tr.total_days || 1} Tage, Pauschale ${vmaAmount.toFixed(2)} \u20AC)`
        }
      ]
    };
    if (ownVendorId) {
      vmaPayload.contactId = ownVendorId;
    }
    try {
      await new Promise((r) => setTimeout(r, 600));
      const vRes = await fetchLexwareWithRetry("https://api.lexware.io/v1/vouchers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(vmaPayload)
      });
      if (!vRes.ok) {
        const errTxt = await vRes.text();
        if (vRes.status === 429) {
          return errorResponse(
            "Lexware API Rate-Limit erreicht (max. 2 Anfragen/Sekunde). Bitte warten Sie ca. 5 Sekunden und versuchen Sie es erneut.",
            429
          );
        }
        return errorResponse(`Lexware API Fehler (${vRes.status}): ${errTxt}`, 400);
      }
      const vData = await vRes.json();
      const lexVoucherId = vData.id;
      try {
        await new Promise((r) => setTimeout(r, 600));
        const docContent = [
          "=======================================================",
          "EIGENBELEG: VERPFLEGUNGSMEHRAUFWAND (gem. \xA7 9 Abs. 4a EStG)",
          "=======================================================",
          `Reise-ID: ${tr.id}`,
          `Voucher-Nummer: ${voucherNum}`,
          `Reisezweck / Anlass: ${tr.purpose || "Gesch\xE4ftstermin"}`,
          `Kunde / Projekt: ${custProjStr}`,
          `Reisezeitraum: ${tr.trip_date} (${tr.departure_time || "07:30"} Uhr) bis ${tr.return_date || tr.trip_date} (${tr.arrival_time || "19:30"} Uhr)`,
          `Reisedauer: ${tr.total_days || 1} Tag(e)`,
          `Fr\xFChst\xFCck gestellt: ${tr.has_breakfast ? "Ja (-5,60 \u20AC je \xDCbernachtung gem. EStG gek\xFCrzt)" : "Nein"}`,
          `Auszahlungsbetrag / Betriebsausgabe: ${vmaAmount.toFixed(2)} EUR`,
          "Steuerstatus: Steuerfreie Betriebsausgabe (0% USt)",
          "Buchungskonto: SKR04: 6673 / SKR03: 4673",
          `Erstellt am: ${(/* @__PURE__ */ new Date()).toLocaleString("de-DE")}`,
          "======================================================="
        ].join("\n");
        const uploadForm = new FormData();
        const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
        uploadForm.append("file", blob, `Eigenbeleg_VMA_${voucherNum}.txt`);
        await fetchLexwareWithRetry(
          `https://api.lexware.io/v1/vouchers/${lexVoucherId}/files`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
            body: uploadForm
          }
        );
      } catch {
      }
      await env2.DB.prepare(`
        UPDATE trips
        SET lexware_vma_voucher_id = ?,
            lexware_vma_voucher_number = ?,
            status = 'Completed'
        WHERE id = ?
      `).bind(lexVoucherId, voucherNum, tripId).run();
      await logAuditEvent(env2, {
        eventType: "LEXWARE_VMA_SYNCED",
        entityType: "trip",
        entityId: tripId,
        actor: "User",
        description: `Verpflegungsmehraufwand (${vmaAmount.toFixed(2)} \u20AC) erfolgreich als Eigenbeleg an Lexware \xFCbermittelt (Voucher-Nr: ${voucherNum}).`
      });
      return jsonResponse({
        success: true,
        message: `Verpflegungsmehraufwand (${vmaAmount.toFixed(2)} \u20AC) erfolgreich als Eigenbeleg an Lexware \xFCbermittelt!`,
        lexwareVoucherId: lexVoucherId,
        voucherNumber: voucherNum
      });
    } catch (err) {
      return errorResponse(`Fehler bei VMA-\xDCbertragung: ${err.message}`, 500);
    }
  }
  if (path === "/api/v1/trips" && method === "POST") {
    await ensureTripExpenses(env2);
    const body = await request.json();
    const tripId = body.id || crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let project = null;
    if (body.projectId) {
      project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(body.projectId).first();
      if (project && (project.is_active === 0 || project.is_archived === 1)) {
        return errorResponse(
          "Auf archivierte oder gesperrte Projekte k\xF6nnen keine Reisekosten gebucht werden.",
          400
        );
      }
    }
    const tripDate = body.tripDate || now.substring(0, 10);
    const returnDate = body.returnDate || tripDate;
    const totalDays = body.totalDays !== void 0 ? parseInt(body.totalDays) : 1;
    const travelType = body.travelType || "BusinessTrip";
    const expenseType = body.expenseType || "PersonalCar";
    const distanceKm = parseFloat(body.distanceKm || "0");
    const ratePerKm = parseFloat(
      body.ratePerKm || (travelType === "PermanentWorkplace" ? distanceKm > 20 ? "0.38" : "0.30" : "0.30")
    );
    const ticketCost = parseFloat(body.ticketCost || "0");
    const hotelCost = parseFloat(body.hotelCost || "0");
    const parkingCost = parseFloat(body.parkingCost || "0");
    const vmaAmount = parseFloat(body.vmaAmount || "0");
    const hasBreakfast = body.hasBreakfast ? 1 : 0;
    const isBillableToClient = body.isBillableToClient !== void 0 ? body.isBillableToClient ? 1 : 0 : 0;
    const isInternalExpenseOnly = isBillableToClient === 0 ? 1 : 0;
    const travelCost = expenseType === "PersonalCar" ? distanceKm * ratePerKm : ticketCost;
    const expenses = body.expenses || [];
    let totalExpensesGross = 0;
    let totalExpensesNet = 0;
    let totalExpensesBillableNet = 0;
    for (const exp of expenses) {
      const gross = parseFloat(exp.amountGross || "0");
      const net = parseFloat(
        exp.amountNet || (gross / (1 + parseFloat(exp.taxRate || "0") / 100)).toFixed(2)
      );
      const isBillable = exp.isBillableToClient === true || exp.isBillableToClient === 1 || exp.is_billable_to_client === 1 ? 1 : 0;
      totalExpensesGross += gross;
      totalExpensesNet += net;
      if (isBillable)
        totalExpensesBillableNet += net;
    }
    const totalActualCost = travelCost + hotelCost + parkingCost + vmaAmount + totalExpensesNet;
    const customerReimbursableCost = isBillableToClient ? travelCost + hotelCost + parkingCost + totalExpensesBillableNet : 0;
    const origin = body.origin || "Wohnort";
    const dest = body.destination || "Kunde";
    const originAddress = body.originAddress || origin;
    const destAddress = body.destinationAddress || dest;
    const contactPerson = body.contactPerson || "";
    const departureTime = body.departureTime || "08:00";
    const arrivalTime = body.arrivalTime || "18:00";
    const purpose = body.purpose || "Kundentermin vor Ort";
    const departureUtc = `${tripDate}T${departureTime || "07:30"}:00.000Z`;
    const arrivalUtc = `${returnDate}T${arrivalTime || "19:30"}:00.000Z`;
    const totalAbsenceHours = totalDays > 1 ? totalDays * 24 : 12;
    const status = body.status || "Completed";
    const isRoundTrip = body.isRoundTrip ? 1 : 0;
    const totalPlannedCostNet = parseFloat(
      body.totalPlannedCostNet || totalActualCost || "0"
    );
    const breakfastDaysJson = JSON.stringify(body.breakfastDays || []);
    const isForeignTrip = body.isForeignTrip !== void 0 ? parseInt(body.isForeignTrip) : body.is_foreign_trip !== void 0 ? parseInt(body.is_foreign_trip) : 0;
    const foreignCountry = body.foreignCountry || body.foreign_country || "";
    const foreignCity = body.foreignCity || body.foreign_city || "";
    const foreignRatesJson = typeof body.foreignRates === "object" ? JSON.stringify(body.foreignRates) : body.foreign_rates_json || "{}";
    const mealDeductionsJson = typeof body.mealDeductions === "object" ? JSON.stringify(body.mealDeductions) : body.meal_deductions_json || "{}";
    await env2.DB.prepare(`
      INSERT INTO trips (
        id, project_id, trip_date, return_date, total_days, origin, destination, 
        origin_location, destination_location, origin_address, destination_address, return_location, contact_person,
        distance_km, rate_per_km, departure_time, arrival_time, departure_time_utc, arrival_time_utc, total_absence_hours,
        purpose, travel_type, expense_type, ticket_cost, hotel_cost, parking_cost, vma_amount, has_breakfast,
        customer_reimbursable_cost, total_actual_cost, is_billable_to_client, is_internal_expense_only,
        status, is_round_trip, total_planned_cost_net, breakfast_days_json,
        is_foreign_trip, foreign_country, foreign_city, foreign_rates_json, meal_deductions_json,
        created_at_utc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        trip_date = excluded.trip_date,
        return_date = excluded.return_date,
        distance_km = excluded.distance_km,
        purpose = excluded.purpose,
        customer_reimbursable_cost = excluded.customer_reimbursable_cost,
        total_actual_cost = excluded.total_actual_cost
    `).bind(
      tripId,
      body.projectId || null,
      tripDate,
      returnDate,
      totalDays,
      origin,
      dest,
      origin,
      dest,
      originAddress,
      destAddress,
      body.returnLocation || (isRoundTrip ? origin : dest),
      contactPerson,
      distanceKm,
      ratePerKm,
      departureTime,
      arrivalTime,
      departureUtc,
      arrivalUtc,
      totalAbsenceHours,
      purpose,
      travelType,
      expenseType,
      ticketCost,
      hotelCost,
      parkingCost,
      vmaAmount,
      hasBreakfast,
      customerReimbursableCost,
      totalActualCost,
      isBillableToClient,
      isInternalExpenseOnly,
      status,
      isRoundTrip,
      totalPlannedCostNet,
      breakfastDaysJson,
      isForeignTrip,
      foreignCountry,
      foreignCity,
      foreignRatesJson,
      mealDeductionsJson,
      now
    ).run();
    for (const exp of expenses) {
      const expId = exp.id || crypto.randomUUID();
      const gross = parseFloat(exp.amountGross || "0");
      const rate = parseFloat(exp.taxRate !== void 0 ? exp.taxRate : "19.0");
      const net = parseFloat(
        exp.amountNet || (gross / (1 + rate / 100)).toFixed(2)
      );
      const taxAmount = parseFloat((gross - net).toFixed(2));
      const isBillable = exp.isBillableToClient === true || exp.isBillableToClient === 1 || exp.is_billable_to_client === 1 ? 1 : 0;
      await env2.DB.prepare(`
        INSERT INTO trip_expenses (
          id, trip_id, expense_date, category, description, skr04_account,
          amount_gross, amount_net, tax_rate, tax_amount,
          receipt_r2_key, receipt_filename, receipt_mime_type,
          is_billable_to_client, is_synced_to_lexware, created_at_utc
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          amount_gross = excluded.amount_gross,
          amount_net = excluded.amount_net,
          description = excluded.description
      `).bind(
        expId,
        tripId,
        exp.expenseDate || tripDate,
        exp.category || "Other",
        exp.description || "Spesen",
        exp.skr04Account || "6670",
        gross,
        net,
        rate,
        taxAmount,
        exp.receiptR2Key || null,
        exp.receiptFilename || null,
        exp.receiptMimeType || null,
        isBillable,
        0,
        now
      ).run();
    }
    const legs = body.legs || [];
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const legId = leg.id || crypto.randomUUID();
      let legCustId = null;
      if (leg.customerId && typeof leg.customerId === "string" && leg.customerId.trim() !== "") {
        const cCheck = await env2.DB.prepare(
          "SELECT id FROM customers WHERE id = ?"
        ).bind(leg.customerId.trim()).first();
        if (cCheck)
          legCustId = leg.customerId.trim();
      }
      let legProjId = null;
      if (leg.projectId && typeof leg.projectId === "string" && leg.projectId.trim() !== "") {
        const pCheck = await env2.DB.prepare("SELECT id FROM projects WHERE id = ?").bind(leg.projectId.trim()).first();
        if (pCheck)
          legProjId = leg.projectId.trim();
      }
      await env2.DB.prepare(`
        INSERT INTO trip_legs (
          id, trip_id, leg_order, date_leg, start_location, destination_location,
          transport_type, distance_km, rate_per_km, travel_cost_net,
          layover_hours, layover_purpose, customer_id, project_id, is_billable_to_client, created_at_utc
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          distance_km = excluded.distance_km,
          travel_cost_net = excluded.travel_cost_net
      `).bind(
        legId,
        tripId,
        leg.legOrder || i + 1,
        leg.dateLeg || tripDate,
        leg.startLocation || "Start",
        leg.destinationLocation || "Ziel",
        leg.transportType || "Train",
        parseFloat(leg.distanceKm || "0"),
        parseFloat(leg.ratePerKm || "0.30"),
        parseFloat(leg.travelCostNet || "0"),
        parseFloat(leg.layoverHours || "0"),
        leg.layoverPurpose || null,
        legCustId,
        legProjId,
        leg.isBillableToClient === true || leg.isBillableToClient === 1 || leg.is_billable_to_client === 1 ? 1 : 0,
        now
      ).run();
    }
    await logAuditEvent(env2, {
      eventType: "TRIP_CREATED",
      entityType: "trip",
      entityId: tripId,
      actor: "User",
      description: `Reisekosten f\xFCr ${project ? project.name : "Interne Dienstreise"} am ${tripDate} erfasst (${customerReimbursableCost.toFixed(2)} \u20AC an Kunde, ${totalActualCost.toFixed(2)} \u20AC Gesamtkosten).`
    });
    return jsonResponse({
      success: true,
      id: tripId,
      customerReimbursableCost,
      totalActualCost,
      expensesCount: expenses.length,
      legsCount: legs.length
    });
  }
  if (path === "/api/v1/trips" && method === "GET") {
    await ensureTripExpenses(env2);
    const projectId = url.searchParams.get("projectId");
    const customerId = url.searchParams.get("customerId");
    const period = url.searchParams.get("period");
    const timesheetId = url.searchParams.get("timesheetId");
    const statusFilter = url.searchParams.get("status");
    let baseQuery = `
      SELECT tr.*, 
             COALESCE(tr.return_date, tr.trip_date) as return_date,
             COALESCE(tr.total_days, 1) as total_days,
             COALESCE(tr.origin, tr.origin_location) as origin, 
             COALESCE(tr.destination, tr.destination_location) as destination, 
             COALESCE(tr.ticket_cost, 0.0) as ticket_cost,
             COALESCE(tr.hotel_cost, 0.0) as hotel_cost,
             COALESCE(tr.parking_cost, 0.0) as parking_cost,
             COALESCE(tr.vma_amount, 0.0) as vma_amount,
             COALESCE(tr.travel_type, 'BusinessTrip') as travel_type,
             COALESCE(tr.is_billable_to_client, 0) as is_billable_to_client,
             COALESCE(tr.status, 'Completed') as status,
             COALESCE(tr.is_round_trip, 0) as is_round_trip,
             COALESCE(tr.total_planned_cost_net, 0.0) as total_planned_cost_net,
             COALESCE(p.name, 'Interne Reise (Community / Fortbildung)') as project_name,
             COALESCE(p.project_number, 'INTERN') as project_number,
             c.id as customer_id,
             COALESCE(c.name, 'Eigenbetrieb / Fortbildung') as customer_name,
             tv.status as ts_status,
             tv.period as ts_period,
             tv.lexware_invoice_number
      FROM trips tr 
      LEFT JOIN projects p ON tr.project_id = p.id 
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
      WHERE 1=1
    `;
    const params = [];
    if (timesheetId) {
      baseQuery += " AND tr.timesheet_version_id = ?";
      params.push(timesheetId);
    }
    if (projectId) {
      baseQuery += " AND tr.project_id = ?";
      params.push(projectId);
    }
    if (customerId) {
      baseQuery += " AND c.id = ?";
      params.push(customerId);
    }
    if (period) {
      baseQuery += " AND (tr.trip_date LIKE ? OR tr.return_date LIKE ?)";
      params.push(`${period}%`, `${period}%`);
    }
    if (statusFilter === "planned") {
      baseQuery += " AND tr.status = 'Planned'";
    } else if (statusFilter === "completed") {
      baseQuery += " AND (tr.status = 'Completed' OR tr.status IS NULL)";
    } else if (statusFilter === "unbilled") {
      baseQuery += " AND (tr.status = 'Completed' OR tr.status IS NULL) AND (tr.timesheet_version_id IS NULL OR tv.status IN ('Draft', 'Rejected', 'InvoiceCanceled'))";
    } else if (statusFilter === "billed") {
      baseQuery += " AND tv.status IN ('PendingSignature', 'Approved', 'Invoiced')";
    }
    const isDemo = isDemoRequest(request);
    if (!isDemo) {
      baseQuery += " AND (tr.project_id NOT LIKE 'prj_demo_%' OR tr.project_id IS NULL) AND tr.id NOT LIKE 'trip_demo_%' AND (c.id NOT LIKE 'cust_demo_%' OR c.id IS NULL)";
    } else {
      baseQuery += " AND (tr.project_id LIKE 'prj_demo_%' OR tr.id LIKE 'trip_demo_%' OR tr.project_id IS NULL)";
    }
    baseQuery += " ORDER BY tr.trip_date DESC LIMIT 300";
    const query = env2.DB.prepare(baseQuery).bind(...params);
    const { results } = await query.all();
    const tripIds = (results || []).map((r) => r.id);
    let allExpenses = [];
    let allLegs = [];
    if (tripIds.length > 0) {
      const { results: expResults } = await env2.DB.prepare(`
        SELECT * FROM trip_expenses 
        ORDER BY expense_date ASC, created_at_utc ASC
      `).all();
      allExpenses = expResults || [];
      const { results: legResults } = await env2.DB.prepare(`
        SELECT * FROM trip_legs 
        ORDER BY leg_order ASC, created_at_utc ASC
      `).all();
      allLegs = legResults || [];
    }
    const enriched = (results || []).map((tr) => {
      const isEditable = (!tr.ts_status || tr.ts_status === "Draft" || tr.ts_status === "Rejected" || tr.ts_status === "InvoiceCanceled") && tr.status !== "Archived";
      const travelCost = tr.expense_type === "PersonalCar" ? tr.distance_km * (tr.rate_per_km || 0.3) : tr.ticket_cost || 0;
      const tripExps = allExpenses.filter((e) => e.trip_id === tr.id);
      const tripLegs = allLegs.filter((l) => l.trip_id === tr.id);
      let extraExpNet = 0;
      let extraExpGross = 0;
      let extraExpTax = 0;
      let extraExpBillableNet = 0;
      for (const e of tripExps) {
        extraExpNet += e.amount_net || 0;
        extraExpGross += e.amount_gross || e.amount_net || 0;
        extraExpTax += e.tax_amount || 0;
        if (e.is_billable_to_client)
          extraExpBillableNet += e.amount_net || 0;
      }
      let legsTravelCost = 0;
      let legsBillableCost = 0;
      for (const l of tripLegs) {
        const isCar = l.transport_type === "PersonalCar";
        const isFree = l.transport_type === "Passenger" || l.transport_type === "BikeFoot";
        const legCost = isCar ? parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30") : isFree ? 0 : l.travel_cost_net !== void 0 && l.travel_cost_net !== null ? parseFloat(l.travel_cost_net) : 0;
        legsTravelCost += legCost;
        if (l.is_billable_to_client)
          legsBillableCost += legCost;
      }
      const effTravelCost = tripLegs.length > 0 ? legsTravelCost : travelCost;
      const totalCost = effTravelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + (tr.vma_amount || 0) + extraExpNet;
      const totalGross = totalCost + extraExpTax;
      const clientNet = tr.is_billable_to_client ? effTravelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + extraExpBillableNet : 0;
      let routeDisplay = "";
      let destDisplay = tr.destination || tr.destination_address || "-";
      let returnLocation = tr.return_location || tr.origin || "-";
      function cleanCity(loc) {
        if (!loc)
          return "";
        return loc.split(",")[0].trim();
      }
      __name(cleanCity, "cleanCity");
      if (tripLegs.length > 0) {
        const stops = [];
        const destCities = [];
        const firstCity = cleanCity(tripLegs[0].start_location);
        const lastCity = cleanCity(tripLegs[tripLegs.length - 1].destination_location);
        tripLegs.forEach((leg, idx) => {
          const sCity = cleanCity(leg.start_location);
          const dCity = cleanCity(leg.destination_location);
          if (idx === 0 && sCity)
            stops.push(sCity);
          if (dCity && (stops.length === 0 || stops[stops.length - 1] !== dCity)) {
            stops.push(dCity);
          }
          if (dCity && dCity !== firstCity && dCity !== lastCity && !destCities.includes(dCity)) {
            destCities.push(dCity);
          }
        });
        routeDisplay = stops.join(" \u2794 ");
        if (destCities.length > 0) {
          destDisplay = destCities.join(", ");
        } else if (tr.destination && tr.destination !== tr.origin) {
          destDisplay = tr.destination;
        }
        returnLocation = tripLegs[tripLegs.length - 1].destination_location || tr.origin;
      } else if (tr.is_round_trip || tr.travel_type === "BusinessTrip") {
        const orig = (tr.origin || "").trim();
        const dst = (tr.destination || tr.destination_address || "").trim();
        if (dst && dst !== orig) {
          routeDisplay = `${orig} \u2794 ${dst} \u2794 ${orig}`;
          destDisplay = dst;
        } else {
          routeDisplay = orig ? `${orig} (Rundfahrt)` : "-";
        }
      } else {
        routeDisplay = `${tr.origin} \u2794 ${tr.destination || "-"}`;
      }
      return {
        ...tr,
        destination: destDisplay,
        return_location: returnLocation,
        route_display: routeDisplay,
        calculated_travel_cost: effTravelCost,
        calculated_total_cost: totalCost,
        calculated_total_gross: totalGross,
        calculated_total_tax: extraExpTax,
        calculated_client_net: clientNet,
        expenses: tripExps,
        legs: tripLegs,
        isEditable
      };
    });
    return jsonResponse(enriched);
  }
  const tripCompleteMatch = path.match(
    /^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/complete$/
  );
  if (tripCompleteMatch && method === "POST") {
    await ensureTripExpenses(env2);
    const tripId = tripCompleteMatch[1];
    const res = await env2.DB.prepare(
      "UPDATE trips SET status = 'Completed' WHERE id = ?"
    ).bind(tripId).run();
    if (!res.meta.changes || res.meta.changes === 0) {
      return errorResponse("Reise nicht gefunden", 404);
    }
    await logAuditEvent(env2, {
      eventType: "TRIP_COMPLETED",
      entityType: "trip",
      entityId: tripId,
      actor: "User",
      description: `Geplante Reise ${tripId} als durchgef\xFChrt markiert.`
    });
    return jsonResponse({
      success: true,
      message: "Reise erfolgreich als durchgef\xFChrt markiert. Belege k\xF6nnen nun final erfasst werden."
    });
  }
  const tripTaxReportMatch = path.match(
    /^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/tax-report-data$/
  );
  if (tripTaxReportMatch && method === "GET") {
    await ensureTripExpenses(env2);
    const tripId = tripTaxReportMatch[1];
    const tr = await env2.DB.prepare(`
      SELECT tr.*, 
             COALESCE(tr.return_date, tr.trip_date) as return_date,
             COALESCE(tr.total_days, 1) as total_days,
             p.name as project_name, p.project_number, c.name as customer_name, c.street as customer_street, c.zip_code as customer_zip, c.city as customer_city, tv.status as ts_status, tv.pdf_frozen_hash
      FROM trips tr
      LEFT JOIN projects p ON tr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
      WHERE tr.id = ?
    `).bind(tripId).first();
    if (!tr)
      return errorResponse("Reise nicht gefunden", 404);
    const { results: expenses } = await env2.DB.prepare(
      "SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY expense_date ASC"
    ).bind(tripId).all();
    const { results: legs } = await env2.DB.prepare(
      "SELECT * FROM trip_legs WHERE trip_id = ? ORDER BY leg_order ASC"
    ).bind(tripId).all();
    let legsTravelCost = 0;
    for (const l of legs || []) {
      if (l.transport_type === "PersonalCar") {
        legsTravelCost += parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30");
      } else if (l.transport_type === "Passenger" || l.transport_type === "BikeFoot") {
        legsTravelCost += 0;
      } else {
        legsTravelCost += l.travel_cost_net !== void 0 && l.travel_cost_net !== null ? parseFloat(l.travel_cost_net) : 0;
      }
    }
    const baseTravelCost = tr.expense_type === "PersonalCar" ? (tr.distance_km || 0) * (tr.rate_per_km || 0.3) : tr.ticket_cost || 0;
    const travelCost = legs && legs.length > 0 ? legsTravelCost : baseTravelCost;
    let extraExpNet = 0;
    let extraExpGross = 0;
    let extraExpTax = 0;
    let extraExpBillableNet = 0;
    for (const e of expenses || []) {
      extraExpNet += e.amount_net || 0;
      extraExpGross += e.amount_gross || e.amount_net || 0;
      extraExpTax += e.tax_amount || 0;
      if (e.is_billable_to_client)
        extraExpBillableNet += e.amount_net || 0;
    }
    const totalActualCost = travelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + (tr.vma_amount || 0) + extraExpNet;
    const totalActualGross = totalActualCost + extraExpTax;
    const clientReimbursable = tr.is_billable_to_client ? travelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + extraExpBillableNet : 0;
    const canonicalTripPayload = JSON.stringify({
      id: tr.id,
      trip_date: tr.trip_date,
      return_date: tr.return_date,
      purpose: tr.purpose,
      travelCost,
      totalActualCost,
      totalActualGross,
      clientReimbursable,
      legs: (legs || []).map((l) => ({
        start: l.start_location,
        dest: l.destination_location,
        km: l.distance_km,
        type: l.transport_type
      })),
      expenses: (expenses || []).map((e) => ({
        category: e.expense_category,
        amountNet: e.amount_net,
        taxRate: e.tax_rate,
        isBillable: e.is_billable_to_client
      }))
    });
    const tripHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalTripPayload));
    const reportHash = `SHA256_${Array.from(new Uint8Array(tripHashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
    return jsonResponse({
      trip: {
        ...tr,
        travelCost,
        totalActualCost,
        totalActualGross,
        totalTax: extraExpTax,
        clientReimbursable,
        reportHash,
        expenses: expenses || [],
        legs: legs || []
      }
    });
  }
  const tripDetailMatch = path.match(/^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)$/);
  if (tripDetailMatch) {
    await ensureTripExpenses(env2);
    const tripId = tripDetailMatch[1];
    const existing = await env2.DB.prepare(`
      SELECT tr.*, 
             COALESCE(tr.return_date, tr.trip_date) as return_date,
             COALESCE(tr.total_days, 1) as total_days,
             p.name as project_name, c.name as customer_name, tv.status as ts_status 
      FROM trips tr 
      LEFT JOIN projects p ON tr.project_id = p.id 
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id 
      WHERE tr.id = ?
    `).bind(tripId).first();
    if (!existing)
      return errorResponse("Reise nicht gefunden", 404);
    if (method === "GET") {
      const isEditable = !existing.ts_status || existing.ts_status === "Draft" || existing.ts_status === "Rejected" || existing.ts_status === "InvoiceCanceled";
      const { results: expenses } = await env2.DB.prepare(
        "SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY expense_date ASC"
      ).bind(tripId).all();
      const { results: legs } = await env2.DB.prepare(
        "SELECT * FROM trip_legs WHERE trip_id = ? ORDER BY leg_order ASC"
      ).bind(tripId).all();
      return jsonResponse({
        trip: { ...existing, expenses: expenses || [], legs: legs || [] },
        isEditable
      });
    }
    const isLocked = existing.ts_status && (existing.ts_status === "PendingSignature" || existing.ts_status === "Approved" || existing.ts_status === "Invoiced");
    if (isLocked) {
      return errorResponse(
        `Diese Reisekosten sind Teil eines Leistungsnachweises im Status '${existing.ts_status}' und GoBD-gesperrt.`,
        403
      );
    }
    if (method === "DELETE") {
      await env2.DB.prepare("DELETE FROM trip_legs WHERE trip_id = ?").bind(tripId).run();
      await env2.DB.prepare("DELETE FROM trip_expenses WHERE trip_id = ?").bind(tripId).run();
      await env2.DB.prepare("DELETE FROM trips WHERE id = ?").bind(tripId).run();
      await logAuditEvent(env2, {
        eventType: "TRIP_DELETED",
        entityType: "trip",
        entityId: tripId,
        actor: "User",
        description: `Reisekosten ${tripId} f\xFCr ${existing.project_name} (${existing.trip_date}) gel\xF6scht.`
      });
      return jsonResponse({ success: true, message: "Reisekosten erfolgreich gel\xF6scht." });
    }
    if (method === "PUT") {
      const body = await request.json();
      const tripDate = body.tripDate || existing.trip_date;
      const returnDate = body.returnDate || tripDate;
      const totalDays = body.totalDays !== void 0 ? parseInt(body.totalDays) : existing.total_days || 1;
      const travelType = body.travelType || existing.travel_type || "BusinessTrip";
      const expenseType = body.expenseType || existing.expense_type || "PersonalCar";
      const distanceKm = body.distanceKm !== void 0 ? parseFloat(body.distanceKm) : existing.distance_km || 0;
      const ratePerKm = body.ratePerKm !== void 0 ? parseFloat(body.ratePerKm) : existing.rate_per_km || 0.3;
      const ticketCost = body.ticketCost !== void 0 ? parseFloat(body.ticketCost) : existing.ticket_cost || 0;
      const hotelCost = body.hotelCost !== void 0 ? parseFloat(body.hotelCost) : existing.hotel_cost || 0;
      const parkingCost = body.parkingCost !== void 0 ? parseFloat(body.parkingCost) : existing.parking_cost || 0;
      const vmaAmount = body.vmaAmount !== void 0 ? parseFloat(body.vmaAmount) : existing.vma_amount || 0;
      const hasBreakfast = body.hasBreakfast !== void 0 ? body.hasBreakfast ? 1 : 0 : existing.has_breakfast;
      const isBillableToClient = body.isBillableToClient !== void 0 ? body.isBillableToClient ? 1 : 0 : existing.is_billable_to_client !== void 0 ? existing.is_billable_to_client : 0;
      const isInternalExpenseOnly = isBillableToClient === 0 ? 1 : 0;
      const status = body.status || existing.status || "Completed";
      const isRoundTrip = body.isRoundTrip !== void 0 ? body.isRoundTrip ? 1 : 0 : existing.is_round_trip || 0;
      const breakfastDaysJson = body.breakfastDays ? JSON.stringify(body.breakfastDays) : existing.breakfast_days_json || "[]";
      const travelCost = expenseType === "PersonalCar" ? distanceKm * ratePerKm : ticketCost;
      const expenses = body.expenses || [];
      let totalExpensesGross = 0;
      let totalExpensesNet = 0;
      let totalExpensesBillableNet = 0;
      await env2.DB.prepare("DELETE FROM trip_expenses WHERE trip_id = ?").bind(tripId).run();
      for (const exp of expenses) {
        const expId = exp.id || crypto.randomUUID();
        const gross = parseFloat(exp.amountGross || "0");
        const rate = parseFloat(exp.taxRate !== void 0 ? exp.taxRate : "19.0");
        const net = parseFloat(
          exp.amountNet || (gross / (1 + rate / 100)).toFixed(2)
        );
        const taxAmount = parseFloat((gross - net).toFixed(2));
        const isBillable = exp.isBillableToClient === true || exp.isBillableToClient === 1 || exp.is_billable_to_client === 1 ? 1 : 0;
        totalExpensesGross += gross;
        totalExpensesNet += net;
        if (isBillable)
          totalExpensesBillableNet += net;
        await env2.DB.prepare(`
          INSERT INTO trip_expenses (
            id, trip_id, expense_date, category, description, skr04_account,
            amount_gross, amount_net, tax_rate, tax_amount,
            receipt_r2_key, receipt_filename, receipt_mime_type,
            is_billable_to_client, is_synced_to_lexware, created_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          expId,
          tripId,
          exp.expenseDate || tripDate,
          exp.category || "Other",
          exp.description || "Spesen",
          exp.skr04Account || "6670",
          gross,
          net,
          rate,
          taxAmount,
          exp.receiptR2Key || null,
          exp.receiptFilename || null,
          exp.receiptMimeType || null,
          isBillable,
          exp.isSyncedToLexware ? 1 : 0
        ).run();
      }
      const legs = body.legs || [];
      await env2.DB.prepare("DELETE FROM trip_legs WHERE trip_id = ?").bind(tripId).run();
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const legId = leg.id || crypto.randomUUID();
        let legCustId = null;
        if (leg.customerId && typeof leg.customerId === "string" && leg.customerId.trim() !== "") {
          const cCheck = await env2.DB.prepare(
            "SELECT id FROM customers WHERE id = ?"
          ).bind(leg.customerId.trim()).first();
          if (cCheck)
            legCustId = leg.customerId.trim();
        }
        let legProjId = null;
        if (leg.projectId && typeof leg.projectId === "string" && leg.projectId.trim() !== "") {
          const pCheck = await env2.DB.prepare(
            "SELECT id FROM projects WHERE id = ?"
          ).bind(leg.projectId.trim()).first();
          if (pCheck)
            legProjId = leg.projectId.trim();
        }
        await env2.DB.prepare(`
          INSERT INTO trip_legs (
            id, trip_id, leg_order, date_leg, start_location, destination_location,
            transport_type, distance_km, rate_per_km, travel_cost_net,
            layover_hours, layover_purpose, customer_id, project_id, is_billable_to_client, created_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          legId,
          tripId,
          leg.legOrder || i + 1,
          leg.dateLeg || tripDate,
          leg.startLocation || "Start",
          leg.destinationLocation || "Ziel",
          leg.transportType || "Train",
          parseFloat(leg.distanceKm || "0"),
          parseFloat(leg.ratePerKm || "0.30"),
          parseFloat(leg.travelCostNet || "0"),
          parseFloat(leg.layoverHours || "0"),
          leg.layoverPurpose || null,
          legCustId,
          legProjId,
          leg.isBillableToClient === true || leg.isBillableToClient === 1 || leg.is_billable_to_client === 1 ? 1 : 0
        ).run();
      }
      const totalActualCost = travelCost + hotelCost + parkingCost + vmaAmount + totalExpensesNet;
      const customerReimbursableCost = isBillableToClient ? travelCost + hotelCost + parkingCost + totalExpensesBillableNet : 0;
      const totalPlannedCostNet = parseFloat(
        body.totalPlannedCostNet || totalActualCost || "0"
      );
      const origin = body.origin || existing.origin || "Wohnort";
      const dest = body.destination || existing.destination || "Kunde";
      const originAddress = body.originAddress || existing.origin_address || origin;
      const destAddress = body.destinationAddress || existing.destination_address || dest;
      const returnLocation = body.returnLocation || body.return_location || existing.return_location || (isRoundTrip ? origin : dest);
      const contactPerson = body.contactPerson || existing.contact_person || "";
      const departureTime = body.departureTime || existing.departure_time || "08:00";
      const arrivalTime = body.arrivalTime || existing.arrival_time || "18:00";
      const purpose = body.purpose || existing.purpose || "Kundentermin vor Ort";
      const changes = [];
      if (tripDate !== existing.trip_date || returnDate !== existing.return_date)
        changes.push(
          `Zeitraum: ${existing.trip_date} -> ${tripDate} bis ${returnDate}`
        );
      if (travelType !== existing.travel_type)
        changes.push(`Reiseart: ${existing.travel_type} -> ${travelType}`);
      if (distanceKm !== existing.distance_km)
        changes.push(`Distanz: ${existing.distance_km}km -> ${distanceKm}km`);
      if (vmaAmount !== existing.vma_amount)
        changes.push(`VMA: ${existing.vma_amount}\u20AC -> ${vmaAmount}\u20AC`);
      if (status !== existing.status)
        changes.push(`Status: ${existing.status} -> ${status}`);
      if (expenses.length > 0)
        changes.push(`${expenses.length} Belegpositionen aktualisiert`);
      if (legs.length > 0)
        changes.push(`${legs.length} Etappen aktualisiert`);
      const isForeignTrip = body.isForeignTrip !== void 0 ? parseInt(body.isForeignTrip) : body.is_foreign_trip !== void 0 ? parseInt(body.is_foreign_trip) : existing.is_foreign_trip || 0;
      const foreignCountry = body.foreignCountry !== void 0 ? body.foreignCountry : body.foreign_country !== void 0 ? body.foreign_country : existing.foreign_country || "";
      const foreignCity = body.foreignCity !== void 0 ? body.foreignCity : body.foreign_city !== void 0 ? body.foreign_city : existing.foreign_city || "";
      const foreignRatesJson = typeof body.foreignRates === "object" ? JSON.stringify(body.foreignRates) : body.foreign_rates_json !== void 0 ? body.foreign_rates_json : existing.foreign_rates_json || "{}";
      const mealDeductionsJson = typeof body.mealDeductions === "object" ? JSON.stringify(body.mealDeductions) : body.meal_deductions_json !== void 0 ? body.meal_deductions_json : existing.meal_deductions_json || "{}";
      await env2.DB.prepare(`
        UPDATE trips SET
          trip_date = ?, return_date = ?, total_days = ?, purpose = ?, expense_type = ?, travel_type = ?,
          origin = ?, destination = ?, origin_location = ?, destination_location = ?,
          origin_address = ?, destination_address = ?, return_location = ?, contact_person = ?,
          departure_time = ?, arrival_time = ?, distance_km = ?, rate_per_km = ?,
          ticket_cost = ?, hotel_cost = ?, parking_cost = ?, vma_amount = ?, has_breakfast = ?,
          customer_reimbursable_cost = ?, total_actual_cost = ?,
          is_billable_to_client = ?, is_internal_expense_only = ?,
          status = ?, is_round_trip = ?, total_planned_cost_net = ?, breakfast_days_json = ?,
          is_foreign_trip = ?, foreign_country = ?, foreign_city = ?, foreign_rates_json = ?, meal_deductions_json = ?
        WHERE id = ?
      `).bind(
        tripDate,
        returnDate,
        totalDays,
        purpose,
        expenseType,
        travelType,
        origin,
        dest,
        origin,
        dest,
        originAddress,
        destAddress,
        returnLocation,
        contactPerson,
        departureTime,
        arrivalTime,
        distanceKm,
        ratePerKm,
        ticketCost,
        hotelCost,
        parkingCost,
        vmaAmount,
        hasBreakfast,
        customerReimbursableCost,
        totalActualCost,
        isBillableToClient,
        isInternalExpenseOnly,
        status,
        isRoundTrip,
        totalPlannedCostNet,
        breakfastDaysJson,
        isForeignTrip,
        foreignCountry,
        foreignCity,
        foreignRatesJson,
        mealDeductionsJson,
        tripId
      ).run();
      const changeSummary = changes.length > 0 ? changes.join(", ") : "Werte best\xE4tigt";
      await logAuditEvent(env2, {
        eventType: "TRIP_UPDATED",
        entityType: "trip",
        entityId: tripId,
        actor: "User",
        description: `Reise f\xFCr ${existing.project_name} (${tripDate}) korrigiert (${changeSummary}).`
      });
      return jsonResponse({
        success: true,
        id: tripId,
        status,
        totalReimbursement: customerReimbursableCost,
        totalActualCost,
        message: "Reisekosten & Belege erfolgreich aktualisiert!",
        changes: changeSummary
      });
    }
  }
  return null;
}
__name(handleTripsExpensesRoutes, "handleTripsExpensesRoutes");

// src/services/email.service.ts
async function sendSystemEmail(env2, options) {
  try {
    const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
    const senderName = options.senderName || settings?.email_sender_name || "ActaNex System";
    const senderEmail = options.senderEmail || settings?.email_sender_email || "noreply@example.com";
    const emailService = settings?.email_service || "resend";
    const apiKey = settings?.email_api_key || env2.RESEND_API_KEY || "";
    if (emailService === "resend" && apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html || options.text.replace(/\n/g, "<br>")
        })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Resend API error:", err);
        return { success: false, error: err };
      }
      return { success: true };
    }
    try {
      const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to, name: options.to }]
            }
          ],
          from: {
            email: senderEmail,
            name: senderName
          },
          subject: options.subject,
          content: [
            {
              type: "text/plain",
              value: options.text
            }
          ]
        })
      });
      if (mailRes.ok || mailRes.status === 202) {
        return { success: true };
      }
    } catch (e) {
      console.warn("MailChannels attempt:", e?.message);
    }
    return { success: true };
  } catch (err) {
    console.error("Email send general error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
__name(sendSystemEmail, "sendSystemEmail");

// src/routes/timesheets_approval.routes.ts
async function handleTimesheetsApprovalRoutes(request, env2, path, method) {
  const url = new URL(request.url);
  if (path === "/api/v1/billing/pending-approvals" && method === "GET") {
    const { results: list } = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, p.approver_email as default_approver_email, p.approver_name as default_approver_name,
                 c.name as customer_name, c.email as customer_email, c.contact_person as customer_contact,
                 a.decision as approval_decision, a.approver_email as actual_approver_email, a.decision_at_utc
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN approvals a ON tv.id = a.timesheet_version_id
          WHERE p.is_archived = 0
          ORDER BY tv.created_at_utc DESC
        `).all();
    return jsonResponse({
      success: true,
      approvals: list || []
    });
  }
  if (path === "/api/v1/billing/hierarchy" && method === "GET") {
    const isDemo = isDemoRequest(request);
    try {
      if (!isDemo) {
        await syncLexwareContactsInternal(env2);
      }
    } catch (e) {
      console.warn("Auto-sync Lexware contacts for billing failed silently:", e?.message || e);
    }
    const { results: customers } = await env2.DB.prepare(
      isDemo ? "SELECT * FROM customers WHERE (id LIKE 'cust_demo_%') AND id != 'cust_internal' ORDER BY name ASC" : "SELECT * FROM customers WHERE id NOT LIKE 'cust_demo_%' AND id != 'cust_internal' ORDER BY name ASC"
    ).all();
    const { results: projects } = await env2.DB.prepare(
      isDemo ? "SELECT * FROM projects WHERE is_active = 1 AND is_archived = 0 AND (id LIKE 'prj_demo_%' OR customer_id LIKE 'cust_demo_%') AND (customer_id != 'cust_internal' OR customer_id IS NULL) ORDER BY name ASC" : "SELECT * FROM projects WHERE is_active = 1 AND is_archived = 0 AND id NOT LIKE 'prj_demo_%' AND (customer_id != 'cust_internal' OR customer_id IS NULL) AND (customer_id NOT LIKE 'cust_demo_%' OR customer_id IS NULL) ORDER BY name ASC"
    ).all();
    const { results: timeEntries } = await env2.DB.prepare(
      isDemo ? `SELECT t.*, p.customer_id, p.name as project_name, p.project_number, p.default_hourly_rate, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled, ae.deliverable, ae.result as evidence_result
               FROM time_entries t
               JOIN projects p ON t.project_id = p.id
               LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
               LEFT JOIN activity_evidences ae ON t.id = ae.time_entry_id
               WHERE (p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%') AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
               ORDER BY t.entry_date DESC` : `SELECT t.*, p.customer_id, p.name as project_name, p.project_number, p.default_hourly_rate, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled, ae.deliverable, ae.result as evidence_result
               FROM time_entries t
               JOIN projects p ON t.project_id = p.id
               LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
               LEFT JOIN activity_evidences ae ON t.id = ae.time_entry_id
               WHERE p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL) AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
               ORDER BY t.entry_date DESC`
    ).all();
    const { results: trips } = await env2.DB.prepare(
      isDemo ? `SELECT tr.*, p.customer_id, p.name as project_name, p.project_number, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled
               FROM trips tr
               JOIN projects p ON tr.project_id = p.id
               LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
               WHERE (p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%')
                 AND tr.is_billable_to_client = 1
                 AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
                 AND (tr.status = 'Completed' OR tr.status IS NULL)
               ORDER BY tr.trip_date DESC` : `SELECT tr.*, p.customer_id, p.name as project_name, p.project_number, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled
               FROM trips tr
               JOIN projects p ON tr.project_id = p.id
               LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
               WHERE p.id NOT LIKE 'prj_demo_%'
                 AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
                 AND tr.is_billable_to_client = 1
                 AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
                 AND (tr.status = 'Completed' OR tr.status IS NULL)
               ORDER BY tr.trip_date DESC`
    ).all();
    const { results: timesheetList } = await env2.DB.prepare(
      isDemo ? `SELECT tv.*, p.customer_id, p.name as project_name, p.project_number
               FROM timesheet_versions tv
               JOIN projects p ON tv.project_id = p.id
               WHERE p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%'
               ORDER BY tv.period DESC` : `SELECT tv.*, p.customer_id, p.name as project_name, p.project_number
               FROM timesheet_versions tv
               JOIN projects p ON tv.project_id = p.id
               WHERE p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
               ORDER BY tv.period DESC`
    ).all();
    const hierarchy = customers.map((cust) => {
      const custProjects = projects.filter((p) => p.customer_id === cust.id).map((proj) => {
        const projEntries = timeEntries.filter((e) => e.project_id === proj.id);
        const projTrips = trips.filter((tr) => tr.project_id === proj.id);
        const monthSet = /* @__PURE__ */ new Set();
        projEntries.forEach((e) => {
          if (e.entry_date)
            monthSet.add(e.entry_date.substring(0, 7));
        });
        projTrips.forEach((tr) => {
          if (tr.trip_date && tr.is_billable_to_client)
            monthSet.add(tr.trip_date.substring(0, 7));
        });
        timesheetList.filter((ts) => ts.project_id === proj.id).forEach((ts) => {
          if (ts.period)
            monthSet.add(ts.period);
        });
        const months = Array.from(monthSet).sort().reverse().map((period) => {
          const monthEntries = projEntries.filter((e) => e.entry_date?.startsWith(period));
          const monthTrips = projTrips.filter((tr) => tr.trip_date?.startsWith(period) && tr.is_billable_to_client);
          const existingTs = timesheetList.filter((ts) => ts.project_id === proj.id && ts.period === period).sort((a, b) => (b.version_number || 1) - (a.version_number || 1))[0];
          const totalHours = monthEntries.reduce((sum, e) => sum + (e.billable_duration_hours || 0), 0);
          const timeAmountNet = monthEntries.reduce((sum, e) => sum + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || proj.default_hourly_rate), 0);
          const travelAmountNet = monthTrips.reduce((sum, tr) => sum + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
          const totalAmountNet = timeAmountNet + travelAmountNet;
          let status = existingTs?.status || "Draft";
          if (existingTs?.is_invoice_canceled === 1) {
            status = "InvoiceCanceled";
          }
          return {
            period,
            timesheetId: existingTs?.id || null,
            versionNumber: existingTs?.version_number || 1,
            status,
            rejectionReason: existingTs?.rejection_reason || null,
            lexwareInvoiceId: existingTs?.lexware_invoice_id || null,
            lexwareInvoiceNumber: existingTs?.lexware_invoice_number || null,
            isInvoiceCanceled: existingTs?.is_invoice_canceled === 1,
            approvedBy: existingTs?.approved_by || null,
            approvedAt: existingTs?.approved_at_utc || null,
            approvalMethod: existingTs?.approval_method || null,
            pdfFrozenHash: existingTs?.pdf_frozen_hash || null,
            entriesCount: monthEntries.length,
            tripsCount: monthTrips.length,
            totalHours,
            timeAmountNet,
            travelAmountNet,
            totalAmountNet,
            timeEntries: monthEntries,
            trips: monthTrips
          };
        });
        return {
          ...proj,
          months
        };
      }).filter((p) => p.months && p.months.length > 0);
      if (custProjects.length === 0)
        return null;
      return {
        ...cust,
        projects: custProjects
      };
    }).filter(Boolean);
    return jsonResponse(hierarchy);
  }
  if (path === "/api/v1/billing/submit-for-signature" && method === "POST") {
    const body = await request.json();
    const { projectId, period, selectedTimeEntryIds, selectedTripIds } = body;
    if (!projectId || !period)
      return errorResponse("projectId und period erforderlich", 400);
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first();
    if (!project)
      return errorResponse("Projekt nicht gefunden", 404);
    const { results: allEntries } = await env2.DB.prepare("SELECT * FROM time_entries WHERE project_id = ? AND entry_date LIKE ?").bind(projectId, `${period}%`).all();
    const { results: allTrips } = await env2.DB.prepare("SELECT * FROM trips WHERE project_id = ? AND trip_date LIKE ?").bind(projectId, `${period}%`).all();
    const entries = selectedTimeEntryIds && Array.isArray(selectedTimeEntryIds) ? allEntries.filter((e) => selectedTimeEntryIds.includes(e.id)) : allEntries;
    const monthTrips = selectedTripIds && Array.isArray(selectedTripIds) ? allTrips.filter((tr) => selectedTripIds.includes(tr.id)) : allTrips;
    if (entries.length === 0 && monthTrips.length === 0) {
      return errorResponse("Bitte w\xE4hlen Sie mindestens einen Zeiteintrag oder eine Reisekosten-Position aus.", 400);
    }
    const totalHours = entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
    const actualHours = entries.reduce((s, e) => s + (e.actual_duration_hours || e.billable_duration_hours || 0), 0);
    const timeNet = entries.reduce((s, e) => s + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || project.default_hourly_rate), 0);
    const travelNet = monthTrips.reduce((s, tr) => s + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
    const totalNet = timeNet + travelNet;
    const { results: allTsForPeriod } = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE project_id = ? AND period = ? ORDER BY version_number DESC").bind(projectId, period).all();
    const latestTs = allTsForPeriod && allTsForPeriod.length > 0 ? allTsForPeriod[0] : null;
    let tsId;
    let versionNumber = 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const entriesPayload = entries.slice().sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date)) || String(a.id).localeCompare(String(b.id))).map((e) => `${e.id}:${e.entry_date}:${e.billable_duration_hours}:${e.billing_rate_snapshot || project.default_hourly_rate}`).join(";");
    const tripsPayload = monthTrips.slice().sort((a, b) => String(a.trip_date).localeCompare(String(b.trip_date)) || String(a.id).localeCompare(String(b.id))).map((t) => `${t.id}:${t.trip_date}:${t.ticket_cost || t.distance_km * t.rate_per_km || 0}`).join(";");
    const freezePayload = `${projectId}|${period}|${totalHours}|${totalNet}|${entriesPayload}|${tripsPayload}|${now}`;
    const freezeHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(freezePayload));
    const frozenHash = `SHA256_${Array.from(new Uint8Array(freezeHashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
    if (latestTs && (latestTs.status === "Approved" || latestTs.status === "InvoiceCanceled" || latestTs.status === "Invoiced" || latestTs.status === "Rejected" || latestTs.is_invoice_canceled === 1)) {
      versionNumber = (latestTs.version_number || 1) + 1;
      tsId = `ts_${period.replace("-", "_")}_${projectId}_v${versionNumber}_${Date.now()}`;
      await env2.DB.prepare(`
            INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, pdf_frozen_hash, frozen_at_utc, supersedes_version_id, created_at_utc)
            VALUES (?, ?, ?, ?, 'PendingSignature', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
          `).bind(tsId, projectId, versionNumber, period, actualHours, totalHours, travelNet, totalNet, frozenHash, frozenHash, now, latestTs.id, now).run();
    } else if (latestTs) {
      tsId = latestTs.id;
      versionNumber = latestTs.version_number || 1;
      await env2.DB.prepare(`
            UPDATE timesheet_versions SET
              status = 'PendingSignature',
              total_actual_hours = ?,
              total_billable_hours = ?,
              total_reimbursable_expenses = ?,
              total_amount_net = ?,
              pdf_frozen_hash = ?,
              frozen_at_utc = ?,
              approved_at_utc = NULL,
              approved_by = NULL,
              approval_method = NULL,
              rejection_reason = NULL,
              lexware_invoice_id = NULL,
              lexware_invoice_number = NULL
            WHERE id = ?
          `).bind(actualHours, totalHours, travelNet, totalNet, frozenHash, now, tsId).run();
    } else {
      tsId = `ts_${period.replace("-", "_")}_${projectId}_v1_${Date.now()}`;
      await env2.DB.prepare(`
            INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, pdf_frozen_hash, frozen_at_utc, created_at_utc)
            VALUES (?, ?, 1, ?, 'PendingSignature', ?, ?, 0, ?, ?, ?, ?, ?, ?)
          `).bind(tsId, projectId, period, actualHours, totalHours, travelNet, totalNet, frozenHash, frozenHash, now, now).run();
    }
    await env2.DB.prepare("UPDATE time_entries SET timesheet_version_id = NULL WHERE project_id = ? AND entry_date LIKE ?").bind(projectId, `${period}%`).run();
    await env2.DB.prepare("UPDATE trips SET timesheet_version_id = NULL WHERE project_id = ? AND trip_date LIKE ?").bind(projectId, `${period}%`).run();
    for (const e of entries) {
      await env2.DB.prepare("UPDATE time_entries SET timesheet_version_id = ? WHERE id = ?").bind(tsId, e.id).run();
    }
    for (const tr of monthTrips) {
      await env2.DB.prepare("UPDATE trips SET timesheet_version_id = ? WHERE id = ?").bind(tsId, tr.id).run();
    }
    await logAuditEvent(env2, {
      eventType: "TIMESHEET_SUBMITTED_FOR_SIGNATURE",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: "Admin",
      description: `Leistungsnachweis f\xFCr ${project.name} (${period}) zur Unterzeichnung vorgelegt. ${entries.length} Zeiteintr\xE4ge & ${monthTrips.length} Reisekosten GoBD-gesperrt (Hash: ${frozenHash}).`
    });
    return jsonResponse({
      success: true,
      timesheetId: tsId,
      status: "PendingSignature",
      pdfFrozenHash: frozenHash,
      message: `Leistungsnachweis (${period}) liegt zur Unterzeichnung vor. ${entries.length} Zeiteintr\xE4ge & ${monthTrips.length} Reisekosten wurden schreibgesch\xFCtzt.`
    });
  }
  const pdfDataMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/pdf-data$/);
  if (pdfDataMatch && method === "GET") {
    const tsId = pdfDataMatch[1];
    const timesheet = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first();
    if (!timesheet)
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(timesheet.project_id).first();
    const customer = project ? await env2.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(project.customer_id).first() : null;
    const isLocked = timesheet.status === "Approved" || timesheet.status === "Invoiced";
    const { results: entries } = await env2.DB.prepare(isLocked ? `
          SELECT t.*, ae.problem_statement, ae.methodology, ae.technical_activity, ae.result, ae.responsibility, ae.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences ae ON ae.time_entry_id = t.id
          WHERE t.timesheet_version_id = ? AND (t.billing_type IS NULL OR t.billing_type != 'InternalOnly')
          ORDER BY t.entry_date ASC, t.start_time ASC
        ` : `
          SELECT t.*, ae.problem_statement, ae.methodology, ae.technical_activity, ae.result, ae.responsibility, ae.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences ae ON ae.time_entry_id = t.id
          WHERE (t.timesheet_version_id = ? OR (t.project_id = ? AND t.entry_date LIKE ? AND (t.timesheet_version_id IS NULL OR t.timesheet_version_id = '')))
            AND (t.billing_type IS NULL OR t.billing_type != 'InternalOnly')
          ORDER BY t.entry_date ASC, t.start_time ASC
        `).bind(...isLocked ? [tsId] : [tsId, timesheet.project_id, `${timesheet.period}%`]).all();
    const { results: trips } = await env2.DB.prepare(isLocked ? `
          SELECT tr.*, COALESCE(tr.origin, tr.origin_location) as origin, COALESCE(tr.destination, tr.destination_location) as destination, COALESCE(tr.ticket_cost, tr.customer_reimbursable_cost) as ticket_cost
          FROM trips tr
          WHERE tr.timesheet_version_id = ?
          ORDER BY tr.trip_date ASC
        ` : `
          SELECT tr.*, COALESCE(tr.origin, tr.origin_location) as origin, COALESCE(tr.destination, tr.destination_location) as destination, COALESCE(tr.ticket_cost, tr.customer_reimbursable_cost) as ticket_cost
          FROM trips tr
          WHERE (tr.timesheet_version_id = ? OR (tr.project_id = ? AND tr.trip_date LIKE ? AND (tr.timesheet_version_id IS NULL OR tr.timesheet_version_id = '')))
            AND (tr.is_billable_to_client = 1 OR tr.is_billable_to_client IS NULL)
          ORDER BY tr.trip_date ASC
        `).bind(...isLocked ? [tsId] : [tsId, timesheet.project_id, `${timesheet.period}%`]).all();
    if (!isLocked) {
      const totalHours = entries.reduce((s, e) => s + (e.is_billable !== 0 ? e.billable_duration_hours || 0 : 0), 0);
      const hourlyRate = project?.default_hourly_rate || 0;
      const timeNet = entries.reduce((s, e) => s + (e.is_billable !== 0 ? (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || hourlyRate) : 0), 0);
      const travelNet = trips.reduce((s, tr) => s + (tr.ticket_cost || tr.distance_km * (tr.rate_per_km || 0.3) || 0), 0);
      timesheet.total_billable_hours = totalHours;
      timesheet.total_reimbursable_expenses = travelNet;
      timesheet.total_amount_net = timeNet + travelNet;
    }
    const { results: approvals } = await env2.DB.prepare("SELECT * FROM approvals WHERE timesheet_version_id = ? ORDER BY decision_at_utc DESC").bind(tsId).all();
    return jsonResponse({
      timesheet,
      project,
      customer,
      entries,
      trips,
      approvals
    });
  }
  const approveMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/approve$/);
  if (approveMatch && method === "POST") {
    const tsId = approveMatch[1];
    const body = await request.json();
    const methodType = body.method || "ManualEmail";
    const approverName = body.approverName || "Kunde";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const ts = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first();
    if (!ts)
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Approved',
            approval_method = ?,
            approved_by = ?,
            approved_at_utc = ?,
            rejection_reason = NULL
          WHERE id = ?
        `).bind(methodType, approverName, now, tsId).run();
    await logAuditEvent(env2, {
      eventType: "TIMESHEET_APPROVED",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: approverName,
      description: `Leistungsnachweis ${tsId} genehmigt via ${methodType}.`
    });
    return jsonResponse({ success: true, status: "Approved", message: `Leistungsnachweis wurde erfolgreich als genehmigt markiert (${methodType}).` });
  }
  const rejectMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/reject$/);
  if (rejectMatch && method === "POST") {
    const tsId = rejectMatch[1];
    const body = await request.json();
    const reason = body.reason || "Keine Begr\xFCndung angegeben";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const ts = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first();
    if (!ts)
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Rejected',
            rejection_reason = ?
          WHERE id = ?
        `).bind(reason, tsId).run();
    await logAuditEvent(env2, {
      eventType: "TIMESHEET_REJECTED",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: "Kunde",
      description: `Leistungsnachweis ${tsId} abgelehnt. Begr\xFCndung: ${reason}`
    });
    return jsonResponse({ success: true, status: "Rejected", message: `Leistungsnachweis wurde abgelehnt.` });
  }
  const createInvoiceMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/create-invoice$/);
  if (createInvoiceMatch && method === "POST") {
    const tsId = createInvoiceMatch[1];
    if (!env2.LEXWARE_API_KEY)
      return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
    const ts = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, p.default_hourly_rate, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
    if (!ts)
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    if (ts.status !== "Approved" && ts.status !== "InvoiceCanceled") {
      return errorResponse(`Rechnung kann nur f\xFCr genehmigte Leistungsnachweise erstellt werden (Aktueller Status: ${ts.status}).`, 400);
    }
    const { results: entries } = await env2.DB.prepare("SELECT * FROM time_entries WHERE timesheet_version_id = ?").bind(tsId).all();
    const { results: monthTrips } = await env2.DB.prepare("SELECT * FROM trips WHERE timesheet_version_id = ?").bind(tsId).all();
    const totalHours = entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
    const hourlyRate = ts.default_hourly_rate || 135;
    const travelNet = monthTrips.reduce((s, tr) => s + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
    const lineItems = [];
    if (totalHours > 0) {
      lineItems.push({
        type: "custom",
        name: `Beratungs- & Architekturleistungen (${ts.period})`,
        description: `Projekt: ${ts.project_name} (${ts.project_number})
Leistungszeitraum: ${ts.period}
Abgerechnete Stunden: ${totalHours.toFixed(2)} Std. \xE0 ${hourlyRate.toFixed(2)} \u20AC/h Netto gem. freigegebenem Leistungsnachweis.`,
        quantity: totalHours,
        unitName: "Stunde",
        unitPrice: {
          currency: "EUR",
          netAmount: hourlyRate,
          taxRatePercentage: 19
        }
      });
    }
    if (travelNet > 0) {
      lineItems.push({
        type: "custom",
        name: `Reisekosten & Auslagen (${ts.period})`,
        description: `Reisekosten / Fahrten im Leistungszeitraum ${ts.period} gem. Leistungsnachweis.`,
        quantity: 1,
        unitName: "Pauschal",
        unitPrice: {
          currency: "EUR",
          netAmount: travelNet,
          taxRatePercentage: 19
        }
      });
    }
    const invoicePayload = {
      voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
      address: {
        name: ts.customer_name || "Kunde",
        contactId: ts.lexware_contact_id,
        street: ts.street || null,
        zip: ts.zip_code || null,
        city: ts.city || null,
        countryCode: ts.country_code || "DE"
      },
      lineItems,
      totalPrice: { currency: "EUR" },
      taxConditions: { taxType: "net" },
      shippingConditions: {
        shippingDate: (/* @__PURE__ */ new Date()).toISOString(),
        shippingType: "service"
      },
      paymentConditions: {
        paymentTermLabel: "Zahlbar innerhalb von 14 Tagen rein netto",
        paymentTermDuration: 14
      },
      introduction: `Sehr geehrte Damen und Herren,

f\xFCr die vereinbarten und freigegebenen Leistungen stellen wir Ihnen folgende Positionen in Rechnung:`,
      remark: `Rechnung zu Leistungsnachweis ${ts.id} (${ts.period}). Vielen Dank f\xFCr die angenehme Zusammenarbeit.`
    };
    const invRes = await fetch("https://api.lexware.io/v1/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(invoicePayload)
    });
    if (!invRes.ok) {
      const errText = await invRes.text();
      return errorResponse(`Lexware Invoice API Fehler: ${errText}`, 400);
    }
    const invData = await invRes.json();
    const lexwareInvoiceId = invData.id;
    let lexwareInvoiceNumber = null;
    try {
      const invDetailRes = await fetch(`https://api.lexware.io/v1/invoices/${lexwareInvoiceId}`, {
        headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
      });
      if (invDetailRes.ok) {
        const invDetail = await invDetailRes.json();
        lexwareInvoiceNumber = invDetail.voucherNumber || null;
      }
    } catch {
    }
    await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Invoiced',
            lexware_invoice_id = ?,
            lexware_invoice_number = ?,
            is_invoice_canceled = 0
          WHERE id = ?
        `).bind(lexwareInvoiceId, lexwareInvoiceNumber, tsId).run();
    await logAuditEvent(env2, {
      eventType: "INVOICE_CREATED",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: "Admin",
      description: `Rechnung in Lexware erstellt (ID: ${lexwareInvoiceId}, Beleg-Nr: ${lexwareInvoiceNumber || "Erstellt"}).`
    });
    return jsonResponse({
      success: true,
      status: "Invoiced",
      lexwareInvoiceId,
      lexwareInvoiceNumber,
      message: `Rechnung in Lexware erfolgreich erstellt (Beleg-Nr: ${lexwareInvoiceNumber || lexwareInvoiceId})!`
    });
  }
  const markInvoicedMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/mark-invoiced$/);
  if (markInvoicedMatch && method === "POST") {
    const tsId = markInvoicedMatch[1];
    const body = await request.json() || {};
    const invoiceNumber = (body.invoiceNumber || "").trim();
    const invoiceDate = body.invoiceDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (!invoiceNumber) {
      return errorResponse("Bitte geben Sie eine externe Rechnungsnummer an.", 400);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Invoiced',
            external_invoice_number = ?,
            external_invoice_date = ?,
            updated_at_utc = ?
          WHERE id = ?
        `).bind(invoiceNumber, invoiceDate, now, tsId).run();
    await logAuditEvent(env2, {
      eventType: "TIMESHEET_MANUALLY_INVOICED",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: "Admin",
      description: `Stundenzettel manuell als abgerechnet markiert (Rechnungsnummer: ${invoiceNumber}, Datum: ${invoiceDate}).`
    });
    return jsonResponse({
      success: true,
      status: "Invoiced",
      externalInvoiceNumber: invoiceNumber,
      externalInvoiceDate: invoiceDate,
      message: `Stundenzettel erfolgreich als abgerechnet markiert (Rechnung: ${invoiceNumber})!`
    });
  }
  const cloneMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/clone-revision$/);
  if (cloneMatch && method === "POST") {
    const sourceTsId = cloneMatch[1];
    const sourceTs = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(sourceTsId).first();
    if (!sourceTs) {
      return errorResponse("Ausgangs-Stundenzettel nicht gefunden", 404);
    }
    const newTsId = `ts_${sourceTs.period.replace("-", "_")}_v${sourceTs.version_number + 1}_${Date.now()}`;
    const newVersionNumber = sourceTs.version_number + 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
          INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, supersedes_version_id, created_at_utc)
          VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      newTsId,
      sourceTs.project_id,
      newVersionNumber,
      sourceTs.period,
      sourceTs.total_actual_hours,
      sourceTs.total_billable_hours,
      sourceTs.total_billable_travel_hours,
      sourceTs.total_reimbursable_expenses,
      sourceTs.total_amount_net,
      "PENDING_RECALCULATION",
      sourceTsId,
      now
    ).run();
    const { results: oldEntries } = await env2.DB.prepare("SELECT * FROM time_entries WHERE timesheet_version_id = ?").bind(sourceTsId).all();
    for (const entry of oldEntries) {
      const newEntryId = crypto.randomUUID();
      await env2.DB.prepare(`
            INSERT INTO time_entries (id, project_id, timesheet_version_id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot, created_at_utc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
        newEntryId,
        entry.project_id,
        newTsId,
        entry.entry_date,
        entry.start_time,
        entry.end_time,
        entry.break_minutes,
        entry.actual_duration_hours,
        entry.billable_duration_hours,
        entry.category,
        entry.location || "Remote",
        entry.short_description,
        entry.task_or_ticket_reference,
        entry.is_billable,
        entry.billing_rate_snapshot,
        now
      ).run();
    }
    await logAuditEvent(env2, {
      eventType: "REVISION_CLONED",
      entityType: "timesheet_version",
      entityId: newTsId,
      actor: "Admin",
      description: `Revisionskopie v${newVersionNumber} aus Stundenzettel ${sourceTsId} erzeugt.`
    });
    return jsonResponse({
      success: true,
      newTimesheetId: newTsId,
      versionNumber: newVersionNumber,
      message: `Neue Revision v${newVersionNumber} wurde als Entwurf erstellt.`
    });
  }
  const publicApprovalMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/approval-data$/);
  if (publicApprovalMatch && method === "GET") {
    await ensureProjectColumns(env2);
    const tsId = publicApprovalMatch[1];
    const url2 = new URL(request.url);
    const providedToken = url2.searchParams.get("token") || request.headers.get("x-approval-token") || "";
    const authUser = await getAuthenticatedUser(request, env2).catch(() => null);
    const ts = await env2.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.project_number, p.default_hourly_rate, p.end_customer_name,
                 p.approver_email, p.approver_name, 
                 p.approver_2_email, p.approver_2_name, 
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
    if (!ts) {
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    }
    if (!authUser) {
      if (!providedToken) {
        return errorResponse("Zugriff verweigert. G\xFCltiges Freigabetoken erforderlich.", 403);
      }
      if (ts.approval_token && ts.approval_token !== providedToken) {
        return errorResponse("Ung\xFCltiges Freigabetoken.", 403);
      }
    }
    const { results: entries } = await env2.DB.prepare(`
          SELECT id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot
          FROM time_entries
          WHERE timesheet_version_id = ? OR (project_id = ? AND entry_date LIKE ?)
          ORDER BY entry_date ASC, start_time ASC
        `).bind(tsId, ts.project_id, `${ts.period}%`).all();
    const { results: trips } = await env2.DB.prepare(`
          SELECT t.*, 
            (SELECT COALESCE(SUM(te.amount_net), 0) FROM trip_expenses te WHERE te.trip_id = t.id AND te.is_billable_to_client = 1) as total_expenses_net
          FROM trips t
          WHERE (t.timesheet_version_id = ? OR (t.project_id = ? AND t.trip_date LIKE ?)) AND t.is_billable_to_client = 1
          ORDER BY t.trip_date ASC
        `).bind(tsId, ts.project_id, `${ts.period}%`).all();
    const authorizedApprovers = [];
    if (ts.approver_email) {
      authorizedApprovers.push({ name: ts.approver_name || "1. Freigabeberechtigter", email: ts.approver_email, role: "Hauptfreigebender" });
    }
    if (ts.approver_2_email) {
      authorizedApprovers.push({ name: ts.approver_2_name || "2. Freigabeberechtigter", email: ts.approver_2_email, role: "Endkunde / Fachverantwortlicher" });
    }
    if (ts.approver_3_email) {
      authorizedApprovers.push({ name: ts.approver_3_name || "3. Freigabeberechtigter", email: ts.approver_3_email, role: "Projektleitung" });
    }
    if (authorizedApprovers.length === 0 && ts.customer_email) {
      authorizedApprovers.push({ name: ts.contact_person || ts.customer_name, email: ts.customer_email, role: "Kooperationspartner" });
    }
    return jsonResponse({
      success: true,
      timesheet: {
        id: ts.id,
        period: ts.period,
        versionNumber: ts.version_number,
        status: ts.status,
        totalActualHours: ts.total_actual_hours,
        totalBillableHours: ts.total_billable_hours,
        totalReimbursableExpenses: ts.total_reimbursable_expenses,
        totalAmountNet: ts.total_amount_net,
        dataHashSha256: ts.data_hash_sha256,
        approvedAt: ts.approved_at_utc,
        approvedBy: ts.approved_by,
        approvalMethod: ts.approval_method,
        rejectionReason: ts.rejection_reason,
        signedDocumentR2Key: ts.signed_document_r2_key,
        signedDocumentFilename: ts.signed_document_filename
      },
      project: {
        name: ts.project_name,
        projectNumber: ts.project_number,
        endCustomerName: ts.end_customer_name || null,
        hourlyRate: ts.default_hourly_rate,
        approverEmail: ts.approver_email || ts.customer_email,
        approverName: ts.approver_name || ts.contact_person,
        approver2Email: ts.approver_2_email || null,
        approver2Name: ts.approver_2_name || null,
        approver3Email: ts.approver_3_email || null,
        approver3Name: ts.approver_3_name || null
      },
      customer: {
        name: ts.customer_name,
        contactPerson: ts.contact_person
      },
      authorizedApprovers,
      entries,
      trips
    });
  }
  const requestOtpMatch = path.match(/^\/api\/v1\/(?:public\/)?(?:timesheets\/([a-zA-Z0-9_-]+)\/request-otp|otp\/request)$/);
  if (requestOtpMatch && method === "POST") {
    await ensureSettings(env2);
    await ensureProjectColumns(env2);
    const body = await request.json();
    const timesheetId = requestOtpMatch[1] || body.timesheetId;
    const email = (body.email || "").trim().toLowerCase();
    if (!timesheetId || !email) {
      return errorResponse("timesheetId und email sind erforderlich", 400);
    }
    const ts = await env2.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.end_customer_name,
                 p.approver_email, p.approver_name,
                 p.approver_2_email, p.approver_2_name,
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.email as customer_email, c.contact_person
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(timesheetId).first();
    if (!ts) {
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    }
    const authorizedApprovers = [
      ts.approver_email?.toLowerCase(),
      ts.approver_2_email?.toLowerCase(),
      ts.approver_3_email?.toLowerCase(),
      ts.customer_email?.toLowerCase()
    ].filter(Boolean);
    if (!authorizedApprovers.includes(email)) {
      return errorResponse("Die angegebene E-Mail-Adresse ist nicht als autorisierter Freigebender f\xFCr dieses Projekt hinterlegt.", 403);
    }
    let recipientName = ts.contact_person || ts.customer_name;
    if (ts.approver_email && ts.approver_email.toLowerCase() === email)
      recipientName = ts.approver_name || recipientName;
    if (ts.approver_2_email && ts.approver_2_email.toLowerCase() === email)
      recipientName = ts.approver_2_name || recipientName;
    if (ts.approver_3_email && ts.approver_3_email.toLowerCase() === email)
      recipientName = ts.approver_3_name || recipientName;
    const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const enc = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
    const otpHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
          INSERT INTO otp_verifications (id, timesheet_id, email, otp_code_hash, expires_at_utc, attempts, is_verified, created_at_utc)
          VALUES (?, ?, ?, ?, ?, 0, 0, ?)
        `).bind(crypto.randomUUID(), timesheetId, email, otpHash, expiresAt, now).run();
    const mailSubject = `Ihr Best\xE4tigungscode f\xFCr ${ts.project_name}`;
    const mailText = `Guten Tag ${recipientName},

Ihr 6-stelliger Einmalcode zur Freigabe des Leistungsnachweises f\xFCr das Projekt "${ts.project_name}" (Abrechnungsmonat ${ts.period}) lautet:

\u{1F449}  ${otpCode}  \u{1F448}

Dieser Code ist 15 Minuten g\xFCltig.

Mit freundlichen Gr\xFC\xDFen,
${ts.customer_name}`;
    await sendSystemEmail(env2, {
      to: email,
      subject: mailSubject,
      text: mailText
    });
    await logAuditEvent(env2, {
      eventType: "OTP_REQUESTED",
      entityType: "timesheet_version",
      entityId: timesheetId,
      actor: email,
      description: `6-stelliger OTP-Freigabecode f\xFCr '${email}' angefordert (15 Min. G\xFCltigkeit).`
    });
    return jsonResponse({
      success: true,
      message: `Ein 6-stelliger Freigabecode wurde an ${email} gesendet.`
    });
  }
  const verifyOtpMatch = path.match(/^\/api\/v1\/(?:public\/)?(?:timesheets\/([a-zA-Z0-9_-]+)\/verify-otp|otp\/verify)$/);
  if (verifyOtpMatch && method === "POST") {
    const body = await request.json();
    const timesheetId = verifyOtpMatch[1] || body.timesheetId;
    const email = (body.email || "").trim().toLowerCase();
    const otpCode = (body.otpCode || body.code || "").trim();
    if (!timesheetId || !otpCode) {
      return errorResponse("timesheetId und otpCode sind erforderlich", 400);
    }
    const enc = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
    const otpHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const validOtp = await env2.DB.prepare(`
          SELECT * FROM otp_verifications
          WHERE timesheet_id = ? AND otp_code_hash = ? AND is_verified = 0 AND datetime(expires_at_utc) > datetime('now')
          ORDER BY created_at_utc DESC LIMIT 1
        `).bind(timesheetId, otpHash).first();
    if (!validOtp) {
      return errorResponse("Der eingegebene Freigabecode ist ung\xFCltig oder abgelaufen (15 Min. G\xFCltigkeit). Bitte fordern Sie einen neuen Code an.", 403);
    }
    if (email && email !== validOtp.email.toLowerCase()) {
      return errorResponse("E-Mail-Adresse stimmt nicht mit dem Empf\xE4nger des Freigabecodes \xFCberein.", 403);
    }
    const approverEmail = validOtp.email;
    const updateOtpRes = await env2.DB.prepare(
      "UPDATE otp_verifications SET is_verified = 1 WHERE id = ? AND is_verified = 0"
    ).bind(validOtp.id).run();
    if (updateOtpRes.meta.changes === 0) {
      return errorResponse("Freigabecode wurde bereits eingel\xF6st.", 409);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const rawIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const maskedIp = rawIp.replace(/\.\d+$/, ".xxx");
    const country = request.headers.get("CF-IPCountry") || "DE";
    const userAgent = request.headers.get("User-Agent") || "Browser";
    const tsSummary = await env2.DB.prepare(`
          SELECT tv.id, tv.period, tv.total_actual_hours, tv.total_billable_hours, tv.total_amount_net,
                 p.name as project_name, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(timesheetId).first();
    const { results: tsEntries } = await env2.DB.prepare(`
          SELECT id, entry_date, start_time, end_time, actual_duration_hours, billable_duration_hours, short_description
          FROM time_entries
          WHERE timesheet_version_id = ?
          ORDER BY entry_date ASC, id ASC
        `).bind(timesheetId).all();
    const canonicalPayload = JSON.stringify({
      timesheet: tsSummary || { id: timesheetId },
      entries: tsEntries || [],
      approvedBy: approverEmail,
      approvalMethod: "VerifiedOTP",
      approvedAtUtc: now
    });
    const docHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalPayload));
    const realDocumentHash = Array.from(new Uint8Array(docHashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    await env2.DB.prepare(`
          UPDATE timesheet_versions 
          SET status = 'Approved', approved_at_utc = ?, approval_method = 'VerifiedOTP', approved_by = ?, document_hash = ?
          WHERE id = ?
        `).bind(now, approverEmail, realDocumentHash, timesheetId).run();
    const approvalId = crypto.randomUUID();
    await env2.DB.prepare(`
          INSERT INTO approvals (id, timesheet_version_id, decision, method, approver_email, bound_document_hash_sha256, client_ip, user_agent, decision_at_utc)
          VALUES (?, ?, 'Approve', 'CustomerOTP', ?, ?, ?, ?, ?)
        `).bind(
      approvalId,
      timesheetId,
      approverEmail,
      realDocumentHash,
      `${maskedIp} (${country})`,
      userAgent,
      now
    ).run();
    await logAuditEvent(env2, {
      eventType: "TIMESHEET_APPROVED_OTP",
      entityType: "timesheet_version",
      entityId: timesheetId,
      actor: approverEmail,
      description: `Leistungsnachweis durch Auftraggeber freigegeben (Hash: ${realDocumentHash.substring(0, 16)}..., IP: ${maskedIp}, Land: ${country}).`
    });
    return jsonResponse({
      success: true,
      status: "Approved",
      approvedAt: now,
      approvedBy: email || validOtp.email,
      message: "Leistungsnachweis wurde erfolgreich freigegeben."
    });
  }
  const rejectPublicMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/reject$/);
  if (rejectPublicMatch && method === "POST") {
    await ensureSettings(env2);
    const tsId = rejectPublicMatch[1];
    const body = await request.json();
    const reason = (body.reason || "").trim();
    const email = (body.email || "Kunde").trim();
    if (!reason) {
      return errorResponse("Bitte geben Sie eine Begr\xFCndung f\xFCr die Ablehnung bzw. Korrekturanforderung an.", 400);
    }
    const ts = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
    if (!ts) {
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    }
    await env2.DB.prepare(`
          UPDATE timesheet_versions
          SET status = 'Rejected', rejection_reason = ?
          WHERE id = ?
        `).bind(reason, tsId).run();
    await logAuditEvent(env2, {
      eventType: "TIMESHEET_REJECTED_BY_CLIENT",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: email,
      description: `Leistungsnachweis durch Kunde abgelehnt. Begr\xFCndung: "${reason}".`
    });
    const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
    if (settings?.email_admin_notify_rejection !== 0) {
      const adminMail = settings?.email_sender_email || "admin@example.com";
      const mailSubject = `\u26A0\uFE0F Korrekturanforderung: Leistungsnachweis ${ts.period} (${ts.project_name})`;
      const mailText = `Hallo,

der Kunde/Auftraggeber (${ts.customer_name}, ${email}) hat den Leistungsnachweis f\xFCr den Zeitraum ${ts.period} im Projekt "${ts.project_name}" abgelehnt bzw. eine Korrektur angefordert.

Begr\xFCndung des Kunden:
"${reason}"

Bitte pr\xFCfen Sie den Nachweis im ActaNex Dashboard.

Status: Rejected`;
      await sendSystemEmail(env2, {
        to: adminMail,
        subject: mailSubject,
        text: mailText
      });
    }
    return jsonResponse({
      success: true,
      status: "Rejected",
      message: "Ihre Korrekturanforderung wurde erfolgreich an den Auftragnehmer \xFCbermittelt."
    });
  }
  const uploadSignedMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/upload-signed-document$/);
  if (uploadSignedMatch && method === "POST") {
    const tsId = uploadSignedMatch[1];
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return errorResponse("Keine Datei zum Upload \xFCbergeben", 400);
    }
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const r2Key = `signed-approvals/${tsId}_${Date.now()}_${safeFilename}`;
    const arrayBuffer = await file.arrayBuffer();
    await env2.STORAGE.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type || "application/pdf" },
      customMetadata: { timesheetId: tsId, originalFilename: file.name }
    });
    await env2.DB.prepare(`
          UPDATE timesheet_versions
          SET signed_document_r2_key = ?, signed_document_filename = ?
          WHERE id = ?
        `).bind(r2Key, file.name, tsId).run();
    await logAuditEvent(env2, {
      eventType: "SIGNED_DOCUMENT_UPLOADED",
      entityType: "timesheet_version",
      entityId: tsId,
      actor: "Client / Admin",
      description: `Unterschriebenes Dokument '${file.name}' hochgeladen und in R2 archiviert.`
    });
    return jsonResponse({
      success: true,
      r2Key,
      filename: file.name,
      message: `Unterschriebenes Dokument '${file.name}' erfolgreich hochgeladen!`
    });
  }
  const downloadSignedMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/download-signed-document$/);
  if (downloadSignedMatch && method === "GET") {
    const tsId = downloadSignedMatch[1];
    const ts = await env2.DB.prepare("SELECT signed_document_r2_key, signed_document_filename FROM timesheet_versions WHERE id = ?").bind(tsId).first();
    if (!ts || !ts.signed_document_r2_key) {
      return errorResponse("Kein signiertes Dokument f\xFCr diesen Nachweis hinterlegt.", 404);
    }
    const object = await env2.STORAGE.get(ts.signed_document_r2_key);
    if (!object) {
      return errorResponse("Dokument in R2 nicht gefunden", 404);
    }
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/pdf");
    headers.set("Content-Disposition", `inline; filename="${ts.signed_document_filename || "signed_timesheet.pdf"}"`);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(object.body, { headers });
  }
  const downloadPdfMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/pdf$/);
  if (downloadPdfMatch && method === "GET") {
    const tsId = downloadPdfMatch[1];
    const ts = await env2.DB.prepare("SELECT signed_document_r2_key, signed_document_filename FROM timesheet_versions WHERE id = ?").bind(tsId).first();
    if (ts && ts.signed_document_r2_key) {
      const object = await env2.STORAGE.get(ts.signed_document_r2_key);
      if (object) {
        const headers = new Headers();
        headers.set("Content-Type", object.httpMetadata?.contentType || "application/pdf");
        headers.set("Content-Disposition", `attachment; filename="${ts.signed_document_filename || "timesheet.pdf"}"`);
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(object.body, { headers });
      }
    }
    return errorResponse("Kein druckfertiges PDF f\xFCr diesen Nachweis hinterlegt.", 404);
  }
  const sendEmailMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/send-approval-email$/);
  if (sendEmailMatch && method === "POST") {
    await ensureSettings(env2);
    await ensureProjectColumns(env2);
    const tsId = sendEmailMatch[1];
    const bodyReq = await request.json().catch(() => ({}));
    const ts = await env2.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.default_hourly_rate, p.end_customer_name,
                 p.approver_email, p.approver_name, 
                 p.approver_2_email, p.approver_2_name,
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
    if (!ts) {
      return errorResponse("Leistungsnachweis nicht gefunden", 404);
    }
    let recipientEmails = [];
    if (bodyReq.recipientEmails && Array.isArray(bodyReq.recipientEmails) && bodyReq.recipientEmails.length > 0) {
      recipientEmails = bodyReq.recipientEmails.filter(Boolean);
    } else if (bodyReq.email) {
      recipientEmails = [bodyReq.email];
    } else {
      const list = [ts.approver_email, ts.approver_2_email, ts.approver_3_email, ts.customer_email].filter(Boolean);
      recipientEmails = Array.from(new Set(list));
    }
    if (recipientEmails.length === 0) {
      return errorResponse("Keine Freigabe-E-Mail-Adresse beim Kunden/Projekt hinterlegt.", 400);
    }
    const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
    const origin = new URL(request.url).origin;
    const approvalLink = `${origin}/?portal=approve&token=${tsId}`;
    const senderName = settings?.email_sender_name || "ActaNex Admin";
    let subject = settings?.email_subject_template || "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}";
    subject = subject.replace("{period}", ts.period).replace("{projectName}", ts.project_name).replace("{customerName}", ts.customer_name);
    for (const recipientEmail of recipientEmails) {
      let contactPerson = ts.contact_person || "Auftraggeber";
      if (ts.approver_email && ts.approver_email.toLowerCase() === recipientEmail.toLowerCase())
        contactPerson = ts.approver_name || contactPerson;
      if (ts.approver_2_email && ts.approver_2_email.toLowerCase() === recipientEmail.toLowerCase())
        contactPerson = ts.approver_2_name || contactPerson;
      if (ts.approver_3_email && ts.approver_3_email.toLowerCase() === recipientEmail.toLowerCase())
        contactPerson = ts.approver_3_name || contactPerson;
      let body = settings?.email_body_template || `Sehr geehrte(r) {contactPerson},

f\xFCr das Projekt "{projectName}" ({customerName}) liegt der T\xE4tigkeits- und Leistungsnachweis f\xFCr den Abrechnungszeitraum {period} zur Pr\xFCfung und Freigabe bereit.

\xDCbersicht:
\u2022 Projekt: {projectName}
\u2022 Zeitraum: {period}
\u2022 Geleistete Stunden: {hours} Std.
\u2022 Gesamtbetrag (Netto): {amountNet} \u20AC

Bitte pr\xFCfen und signieren Sie den Leistungsnachweis \xFCber folgenden Freigabelink:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
      body = body.replace(/{contactPerson}/g, contactPerson).replace(/{projectName}/g, ts.project_name).replace(/{customerName}/g, ts.customer_name).replace(/{period}/g, ts.period).replace(/{hours}/g, (ts.total_billable_hours || 0).toFixed(2)).replace(/{amountNet}/g, (ts.total_amount_net || 0).toFixed(2)).replace(/{approvalLink}/g, approvalLink).replace(/{senderName}/g, senderName);
      await sendSystemEmail(env2, {
        to: recipientEmail,
        subject,
        text: body
      });
      await logAuditEvent(env2, {
        eventType: "APPROVAL_EMAIL_SENT",
        entityType: "timesheet_version",
        entityId: tsId,
        actor: "Admin",
        description: `Freigabe-Einladung per E-Mail an '${recipientEmail}' gesendet.`
      });
    }
    return jsonResponse({
      success: true,
      recipients: recipientEmails,
      approvalLink,
      message: `Freigabe-E-Mail wurde erfolgreich an ${recipientEmails.join(", ")} versendet!`
    });
  }
  if (path === "/api/v1/timesheets/send-reminders" && method === "POST") {
    await ensureSettings(env2);
    const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
    const adminMail = settings?.email_sender_email || "admin@example.com";
    const senderName = settings?.email_sender_name || "ActaNex Admin";
    const { results: pendingList } = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.approver_email, p.approver_name, c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.status = 'PendingSignature'
        `).all();
    let reminder1Count = 0;
    let reminder2Count = 0;
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
    for (const item of pendingList) {
      const recipientEmail = item.approver_email || item.customer_email;
      if (!recipientEmail)
        continue;
      const createdDate = new Date(item.created_at_utc);
      const daysElapsed = (now.getTime() - createdDate.getTime()) / (1e3 * 60 * 60 * 24);
      const approvalLink = `https://evidence-hub-web.pages.dev/?portal=approve&token=${item.id}`;
      const contactPerson = item.approver_name || item.contact_person || "Auftraggeber";
      if (daysElapsed >= 5 && !item.reminder_2_sent_at_utc) {
        let subj = settings?.email_reminder2_subject || "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})";
        subj = subj.replace("{period}", item.period).replace("{projectName}", item.project_name).replace("{customerName}", item.customer_name);
        let body = settings?.email_reminder2_body || `Sehr geehrte(r) {contactPerson},

wir m\xF6chten Sie freundlich daran erinnern, dass die Freigabe des Leistungsnachweises f\xFCr das Projekt "{projectName}" ({item.period}) noch aussteht.

Bitte pr\xFCfen und best\xE4tigen Sie die Posten zeitnah unter folgendem Link:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
        body = body.replace(/{contactPerson}/g, contactPerson).replace(/{projectName}/g, item.project_name).replace(/{customerName}/g, item.customer_name).replace(/{period}/g, item.period).replace(/{approvalLink}/g, approvalLink).replace(/{senderName}/g, senderName);
        await sendSystemEmail(env2, { to: recipientEmail, subject: subj, text: body });
        if (settings?.email_admin_notify_reminder !== 0) {
          await sendSystemEmail(env2, {
            to: adminMail,
            subject: `[Status-Info] 2. Erinnerung versendet: ${item.customer_name} (${item.period})`,
            text: `Hallo Michael,

f\xFCr das Projekt "${item.project_name}" (${item.customer_name}) wurde soeben die 2. Erinnerung nach ${Math.floor(daysElapsed)} Tagen an ${recipientEmail} versendet.`
          });
        }
        await env2.DB.prepare("UPDATE timesheet_versions SET reminder_2_sent_at_utc = ? WHERE id = ?").bind(nowIso, item.id).run();
        reminder2Count++;
      } else if (daysElapsed >= 3 && !item.reminder_1_sent_at_utc && !item.reminder_2_sent_at_utc) {
        let subj = settings?.email_reminder1_subject || "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}";
        subj = subj.replace("{period}", item.period).replace("{projectName}", item.project_name).replace("{customerName}", item.customer_name);
        let body = settings?.email_reminder1_body || `Sehr geehrte(r) {contactPerson},

wir m\xF6chten Sie kurz an die ausstehende Pr\xFCfung des Leistungsnachweises f\xFCr das Projekt "{projectName}" ({item.period}) erinnern.

Link zur Ansicht & Freigabe:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
        body = body.replace(/{contactPerson}/g, contactPerson).replace(/{projectName}/g, item.project_name).replace(/{customerName}/g, item.customer_name).replace(/{period}/g, item.period).replace(/{approvalLink}/g, approvalLink).replace(/{senderName}/g, senderName);
        await sendSystemEmail(env2, { to: recipientEmail, subject: subj, text: body });
        if (settings?.email_admin_notify_reminder !== 0) {
          await sendSystemEmail(env2, {
            to: adminMail,
            subject: `[Status-Info] 1. Erinnerung versendet: ${item.customer_name} (${item.period})`,
            text: `Hallo Michael,

f\xFCr das Projekt "${item.project_name}" (${item.customer_name}) wurde soeben die 1. Erinnerung nach ${Math.floor(daysElapsed)} Tagen an ${recipientEmail} versendet.`
          });
        }
        await env2.DB.prepare("UPDATE timesheet_versions SET reminder_1_sent_at_utc = ? WHERE id = ?").bind(nowIso, item.id).run();
        reminder1Count++;
      }
    }
    return jsonResponse({
      success: true,
      checkedPendingCount: pendingList.length,
      reminder1Sent: reminder1Count,
      reminder2Sent: reminder2Count,
      message: `Mahnlauf abgeschlossen: ${pendingList.length} offene Nachweise gepr\xFCft (${reminder1Count}x 1. Erinnerung, ${reminder2Count}x 2. Erinnerung versendet).`
    });
  }
  return null;
}
__name(handleTimesheetsApprovalRoutes, "handleTimesheetsApprovalRoutes");

// src/utils/pdf.ts
function uint8ArrayToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}
__name(uint8ArrayToBase64, "uint8ArrayToBase64");
async function extractTextFromPdfBytes(buffer) {
  const latin1 = new TextDecoder("latin1");
  const pdfStr = latin1.decode(buffer);
  const textPieces = [];
  let searchIdx = 0;
  function cleanPdfString(raw) {
    return raw.replace(/\\([()\\])/g, "$1").replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ");
  }
  __name(cleanPdfString, "cleanPdfString");
  function hexToText(hex) {
    let str = "";
    const cleanHex = hex.replace(/\s+/g, "");
    for (let i = 0; i < cleanHex.length; i += 2) {
      const code = parseInt(cleanHex.substr(i, 2), 16);
      if (!isNaN(code) && code > 0)
        str += String.fromCharCode(code);
    }
    return str;
  }
  __name(hexToText, "hexToText");
  while (true) {
    const streamIdx = pdfStr.indexOf("stream", searchIdx);
    if (streamIdx === -1)
      break;
    const headerStart = Math.max(0, streamIdx - 300);
    const header = pdfStr.slice(headerStart, streamIdx);
    const isFlate = header.includes("/FlateDecode");
    const isImage = header.includes("/Image");
    let contentStart = streamIdx + 6;
    if (buffer[contentStart] === 13 && buffer[contentStart + 1] === 10)
      contentStart += 2;
    else if (buffer[contentStart] === 10 || buffer[contentStart] === 13)
      contentStart += 1;
    const endstreamIdx = pdfStr.indexOf("endstream", contentStart);
    if (endstreamIdx === -1)
      break;
    let contentEnd = endstreamIdx;
    if (buffer[contentEnd - 1] === 10)
      contentEnd--;
    if (buffer[contentEnd - 1] === 13)
      contentEnd--;
    const streamBytes = buffer.subarray(contentStart, contentEnd);
    searchIdx = endstreamIdx + 9;
    if (isImage || streamBytes.length > 2 * 1024 * 1024)
      continue;
    try {
      let inflatedStr = "";
      if (isFlate) {
        try {
          const ds = new DecompressionStream("deflate");
          const writer = ds.writable.getWriter();
          writer.write(streamBytes);
          writer.close();
          const res = new Response(ds.readable);
          const decomp = new Uint8Array(await res.arrayBuffer());
          inflatedStr = latin1.decode(decomp);
        } catch {
          try {
            const dsRaw = new DecompressionStream("deflate-raw");
            const writer = dsRaw.writable.getWriter();
            writer.write(streamBytes);
            writer.close();
            const res = new Response(dsRaw.readable);
            const decomp = new Uint8Array(await res.arrayBuffer());
            inflatedStr = latin1.decode(decomp);
          } catch {
            inflatedStr = latin1.decode(streamBytes);
          }
        }
      } else {
        inflatedStr = latin1.decode(streamBytes);
      }
      const btRegex = /BT[\s\S]*?ET/g;
      let match;
      while ((match = btRegex.exec(inflatedStr)) !== null) {
        const block = match[0];
        const tjRegex = /\[(.*?)\]\s*TJ/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
          const inner = tjMatch[1];
          const strRegex = /\((.*?)\)/g;
          let sMatch;
          while ((sMatch = strRegex.exec(inner)) !== null) {
            textPieces.push(cleanPdfString(sMatch[1]));
          }
          const hexRegex = /<([0-9a-fA-F]+)>/g;
          let hMatch;
          while ((hMatch = hexRegex.exec(inner)) !== null) {
            const ht = hexToText(hMatch[1]);
            if (ht)
              textPieces.push(ht);
          }
        }
        const singleTjRegex = /\((.*?)\)\s*Tj/g;
        let sTjMatch;
        while ((sTjMatch = singleTjRegex.exec(block)) !== null) {
          textPieces.push(cleanPdfString(sTjMatch[1]));
        }
        const singleHexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
        let sHexMatch;
        while ((sHexMatch = singleHexTjRegex.exec(block)) !== null) {
          const ht = hexToText(sHexMatch[1]);
          if (ht)
            textPieces.push(ht);
        }
      }
    } catch (stErr) {
      console.warn("PDF stream decode error:", stErr);
    }
  }
  return textPieces.join(" ");
}
__name(extractTextFromPdfBytes, "extractTextFromPdfBytes");

// src/services/ai_vision.service.ts
async function scanVoucherWithAi(request, env2) {
  try {
    const body = await request.json();
    let imageBytes = null;
    if (body.r2Key) {
      const obj = await env2.STORAGE.get(body.r2Key);
      if (obj) {
        imageBytes = new Uint8Array(await obj.arrayBuffer());
      }
    }
    if (!imageBytes && (body.imageBase64 || body.base64DataUri || body.base64)) {
      let base64 = body.imageBase64 || body.base64DataUri || body.base64;
      if (base64.includes(","))
        base64 = base64.split(",")[1];
      const binaryString = atob(base64);
      imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }
    }
    if (!imageBytes || imageBytes.length === 0) {
      return errorResponse("Kein Belegbild oder r2Key \xFCbergeben.", 400);
    }
    let aiVisionModel = "@cf/meta/llama-3.2-11b-vision-instruct";
    let aiPdfModel = "@cf/meta/llama-3.1-8b-instruct";
    let aiAutoDetect = 1;
    let customRules = [];
    let geminiApiKey = "";
    let geminiModel = "gemini-3.1-flash-lite-preview";
    let customPromptImage = "";
    let customPromptPdf = "";
    try {
      const dbSettings = await env2.DB.prepare("SELECT ai_vision_model, ai_pdf_model, ai_auto_provider_detect, ai_custom_rules_json, gemini_api_key, gemini_model, ai_prompt_image, ai_prompt_pdf FROM app_settings WHERE id = 'global_config'").first();
      if (dbSettings) {
        if (dbSettings.ai_vision_model)
          aiVisionModel = dbSettings.ai_vision_model;
        if (dbSettings.ai_pdf_model)
          aiPdfModel = dbSettings.ai_pdf_model;
        if (dbSettings.ai_auto_provider_detect !== void 0)
          aiAutoDetect = Number(dbSettings.ai_auto_provider_detect);
        if (dbSettings.gemini_api_key)
          geminiApiKey = dbSettings.gemini_api_key.trim();
        if (dbSettings.gemini_model)
          geminiModel = dbSettings.gemini_model.trim();
        if (dbSettings.ai_prompt_image)
          customPromptImage = dbSettings.ai_prompt_image.trim();
        if (dbSettings.ai_prompt_pdf)
          customPromptPdf = dbSettings.ai_prompt_pdf.trim();
        if (dbSettings.ai_custom_rules_json) {
          try {
            customRules = JSON.parse(dbSettings.ai_custom_rules_json);
          } catch {
          }
        }
      }
    } catch {
    }
    if (!geminiApiKey && (body.geminiApiKey || body.gemini_api_key)) {
      geminiApiKey = String(body.geminiApiKey || body.gemini_api_key).trim();
    }
    if (!geminiApiKey && env2.GEMINI_API_KEY) {
      geminiApiKey = env2.GEMINI_API_KEY.trim();
    }
    if (body.preferredModel && !body.preferredModel.startsWith("@cf/")) {
      geminiModel = String(body.preferredModel).trim();
    }
    let isPdf = false;
    let pdfOffset = -1;
    const searchLen = Math.min(imageBytes.length - 4, 1024);
    for (let i = 0; i <= searchLen; i++) {
      if (imageBytes[i] === 37 && imageBytes[i + 1] === 80 && imageBytes[i + 2] === 68 && imageBytes[i + 3] === 70) {
        isPdf = true;
        pdfOffset = i;
        break;
      }
    }
    if (isPdf && pdfOffset > 0) {
      imageBytes = imageBytes.subarray(pdfOffset);
    } else if (!isPdf && (body.filename?.toLowerCase()?.endsWith(".pdf") || body.r2Key?.toLowerCase()?.endsWith(".pdf") || body.base64DataUri?.startsWith("data:application/pdf"))) {
      const deepSearch = Math.min(imageBytes.length - 4, 4096);
      for (let i = 0; i <= deepSearch; i++) {
        if (imageBytes[i] === 37 && imageBytes[i + 1] === 80 && imageBytes[i + 2] === 68 && imageBytes[i + 3] === 70) {
          isPdf = true;
          imageBytes = imageBytes.subarray(i);
          break;
        }
      }
    }
    let extractedData = null;
    let debugModelUsed = "";
    let debugRawAiText = "";
    let pdfExtractedText = "";
    if (isPdf) {
      try {
        pdfExtractedText = await extractTextFromPdfBytes(imageBytes);
      } catch (pErr) {
        console.warn("PDF stream text extraction failed:", pErr);
      }
    }
    let customRuleInstructions = "";
    if (customRules.length > 0) {
      customRuleInstructions = "\nBenutzerdefinierte Priorit\xE4tszuordnungen:\n" + customRules.map((r) => `- Wenn '${r.keyword}', ordne zwingend zu: categorySuggestion='${r.category}'`).join("\n");
    }
    const defaultImagePrompt = `Du bist ein hochpr\xE4ziser Beleg-Scanner f\xFCr deutsche Reisekosten, Bewirtungen und Buchhaltung (GoBD/DATEV).
Analysiere diesen Beleg (Foto oder Scan). Achte penibel auf Handschriften, Stempel, Steuers\xE4tze und Summen.

Antworte AUSSCHLIESSLICH als valides JSON-Objekt mit exakt folgendem Schema ohne zus\xE4tzlichen Text:
{
  "docRole": "HospitalityInvoice | HotelInvoice | TrainTicket | FlightTicket | TaxiReceipt | ParkingTicket | FuelReceipt | PaymentSlip | OtherReceipt",
  "categorySuggestion": "HotelLogis | HotelBreakfast | TrainLongDistance | TransitLocal | Flight | TaxiLocal | TaxiLong | FuelPower | Parking | Hospitality | Other",
  "supplierName": "Name des Lokals, Hotels, Taxiunternehmens, H\xE4ndlers",
  "locationAddress": "Stra\xDFe Hausnummer, PLZ Ort (falls vorhanden)",
  "voucherDate": "YYYY-MM-DD",
  "amountGross": 0.00,
  "amountNet": 0.00,
  "taxRate": 19.0,
  "taxAmount": 0.00,
  "tax19Gross": 0.00,
  "tax7Gross": 0.00,
  "hotelLogisGross": 0.00,
  "hotelBreakfastGross": 0.00,
  "tipAmount": 0.00,
  "paymentMethod": "Card_NFC | Cash | Invoice | Other",
  "summary": "Pr\xE4gnante Kurzbeschreibung (z. B. 'Gesch\xE4ftsessen Restaurant XY' oder 'Taxifahrt M\xFCnchen')",
  "currency": "EUR",
  "foreignAmountGross": 0.00,
  "exchangeRate": 1.0,
  "isForeign": false,
  "isHotel": false,
  "isTrain": false,
  "isFlight": false,
  "isTaxi": false,
  "isParking": false,
  "isFuel": false,
  "isPaymentSlip": false
}

KRITISCHE REGELN F\xDCR DIE GENAUE ERKENNUNG:
1. BEWIRTUNGSBELEG (Hospitality):
   - H\xE4ufig enth\xE4lt eine Rechnung Speisen zu 7% USt (Mitnahme/Erm\xE4\xDFigt) UND Getr\xE4nke zu 19% USt (oder Speisen & Getr\xE4nke beide 19%).
   - Trenne bei Bewirtung IMMER:
     * tax7Gross = Bruttobetrag aller Positionen mit 7% USt
     * tax19Gross = Bruttobetrag aller Positionen mit 19% USt
     * amountGross = tax7Gross + tax19Gross
     * taxRate = wenn gemischt, den \xFCberwiegenden Satz (z.B. 19.0) oder 19.0
   - Suche nach Trinkgeld (handschriftlich oder separat): tipAmount.
   - docRole='HospitalityInvoice', categorySuggestion='Hospitality'.
2. TAXI (TaxiReceipt):
   - Taxifahrten im Nahverkehr (<50 km) unterliegen in Deutschland 7% USt (taxRate=7.0).
   - Handschriftliche K\xFCrzungsstriche wie '15-' oder '15,00' bedeuten 15.00 EUR Brutto (amountGross=15.00, amountNet=14.02, taxAmount=0.98).
   - Handschrift wie '30,-' bedeutet 30.00 EUR Brutto (amountGross=30.00, amountNet=28.04, taxAmount=1.96).
   - docRole='TaxiReceipt', isTaxi=true, categorySuggestion='TaxiLocal'. Niemals als Hotel klassifizieren!
3. KARTENZAHLUNGSBELEG / TERMINALSLIP (PaymentSlip):
   - Reiner Girocard-/EC-Kundenbeleg (z.B. Samuel GmbH, 'Zahlung erfolgt', Terminal-ID, ohne Leistungsnachweis):
   - docRole='PaymentSlip', isPaymentSlip=true, categorySuggestion='Other', taxRate=0.0, taxAmount=0.0.
4. \xD6PNV / BAHN / BUS (TransitLocal / TrainLongDistance):
   - Deutsche Bahn Nahverkehr = TransitLocal (7%). DB Fernverkehr (ICE/IC) = TrainLongDistance (7%).
   - Flughafenbusse (z.B. Kielius Autokraft) = TransitLocal (19% MwSt).
5. AUSLANDSBELEGE & FREMDW\xC4HRUNGEN:
   - Wenn der Beleg in einer Fremdw\xE4hrung ausgestellt ist (z.B. CHF, USD, GBP, JPY, DKK, SEK), setze 'currency' (z.B. 'CHF'), 'foreignAmountGross' und 'isForeign'=true.
   - F\xFCr die deutsche Buchhaltung ist bei Auslandsbelegen kein inl\xE4ndischer Vorsteuerabzug m\xF6glich: taxRate=0.0, taxAmount=0.0.${customRuleInstructions}`;
    const defaultPdfPrompt = `Du bist ein hochpr\xE4ziser Beleg-Scanner f\xFCr die deutsche Buchhaltung (GoBD/DATEV) und Reisekostenabrechnung.
Analysiere diesen Beleg (PDF-Dokument oder Scan). Achte penibel auf Handschriften, Stempel, Aussteller, Rechnungsnummern, Reisedatum, Steuers\xE4tze und Summen.

Antworte AUSSCHLIESSLICH als valides JSON-Objekt ohne Erkl\xE4rungen:
{
  "docRole": "HospitalityInvoice | HotelInvoice | TrainTicket | FlightTicket | TaxiReceipt | ParkingTicket | FuelReceipt | PaymentSlip | OtherReceipt",
  "categorySuggestion": "HotelLogis | HotelBreakfast | TrainLongDistance | TransitLocal | Flight | TaxiLocal | TaxiLong | FuelPower | Parking | Hospitality | Other",
  "supplierName": "Name des Lokals, Hotels, Bef\xF6rderers oder H\xE4ndlers",
  "locationAddress": "Stra\xDFe Hausnummer, PLZ Ort",
  "voucherDate": "YYYY-MM-DD",
  "amountGross": 0.00,
  "amountNet": 0.00,
  "taxRate": 19.0,
  "taxAmount": 0.00,
  "tax19Gross": 0.00,
  "tax7Gross": 0.00,
  "hotelLogisGross": 0.00,
  "hotelBreakfastGross": 0.00,
  "tipAmount": 0.00,
  "paymentMethod": "Card_NFC | Invoice | Cash | Other",
  "summary": "Kurzbeschreibung der Leistung / Fahrtstrecke / Ticket",
  "currency": "EUR",
  "foreignAmountGross": 0.00,
  "exchangeRate": 1.0,
  "isForeign": false,
  "isHotel": false,
  "isTrain": false,
  "isFlight": false,
  "isTaxi": false,
  "isParking": false,
  "isFuel": false,
  "isPaymentSlip": false
}

WICHTIGE REGELN:
1. Bei Fahrkarten (z.B. Autokraft Kielius): Rechnungsnummer (z.B. 1000194060), Reisedatum oder Rechnungsdatum erfassen. docRole='TrainTicket', isTrain=true, categorySuggestion='TransitLocal', taxRate=19.0.
2. Bei Bewirtungsbelegen mit 7% und 19%: tax7Gross und tax19Gross separat ausweisen, amountGross = tax7Gross + tax19Gross.
3. Betr\xE4ge penibel aus 'Gesamtrechnungsbetrag Brutto' oder 'Endbetrag' entnehmen.${customRuleInstructions}`;
    const activeImagePrompt = customPromptImage || defaultImagePrompt;
    const activePdfPrompt = customPromptPdf || defaultPdfPrompt;
    let geminiErrorDetails = "";
    if (geminiApiKey) {
      const requestedGeminiModel = body.preferredModel && !body.preferredModel.startsWith("@cf/") ? body.preferredModel : geminiModel;
      const geminiCandidates = [
        requestedGeminiModel,
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
      ].filter((m, i, arr) => m && arr.indexOf(m) === i);
      const b64Data = uint8ArrayToBase64(imageBytes);
      const mimeType = isPdf ? "application/pdf" : "image/jpeg";
      const promptToUse = isPdf ? activePdfPrompt : activeImagePrompt;
      const geminiPayload = JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptToUse },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: b64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.05
        }
      });
      for (const tryModel of geminiCandidates) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${geminiApiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12e3);
          let geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: geminiPayload,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (geminiRes.status === 429 || geminiRes.status === 503) {
            console.warn(`Gemini model ${tryModel} returned status ${geminiRes.status}, trying next candidate...`);
            continue;
          }
          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            debugRawAiText = rawText;
            debugModelUsed = `${tryModel} (Google Gemini API)`;
            if (rawText && rawText.length > 5) {
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  extractedData = JSON.parse(jsonMatch[0]);
                  break;
                } catch {
                }
              }
            }
          } else {
            const errText = await geminiRes.text();
            geminiErrorDetails = `Gemini API Status ${geminiRes.status}: ${errText.slice(0, 200)}`;
            console.warn(`Gemini model ${tryModel} returned status ${geminiRes.status}:`, errText.slice(0, 150));
          }
        } catch (gErr) {
          geminiErrorDetails = `Gemini Exception: ${gErr?.message || gErr}`;
          console.warn(`Gemini model ${tryModel} failed/timeout:`, gErr?.message || gErr);
        }
      }
    }
    if (!extractedData && env2.AI) {
      if (isPdf && pdfExtractedText && pdfExtractedText.trim().length > 20) {
        const textModels = [
          body.preferredModel && body.preferredModel.startsWith("@cf/") ? body.preferredModel : aiPdfModel,
          "@cf/meta/llama-3.1-8b-instruct",
          "@cf/meta/llama-3.3-70b-instruct"
        ].filter((m, i, arr) => arr.indexOf(m) === i);
        const textPrompt = `${activePdfPrompt}

Belegtext aus PDF:
"""
${pdfExtractedText.slice(0, 4e3)}
"""`;
        for (const model of textModels) {
          try {
            const aiResponse = await env2.AI.run(model, {
              prompt: textPrompt,
              max_tokens: 600,
              temperature: 0
            });
            let rawText = "";
            if (typeof aiResponse === "string")
              rawText = aiResponse;
            else if (aiResponse?.response)
              rawText = aiResponse.response;
            else if (aiResponse?.result)
              rawText = aiResponse.result;
            else
              rawText = JSON.stringify(aiResponse);
            debugRawAiText = rawText;
            debugModelUsed = model + " (Cloudflare Text-LLM)";
            if (rawText && rawText.length > 5) {
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  extractedData = JSON.parse(jsonMatch[0]);
                  break;
                } catch {
                }
              }
            }
          } catch (tErr) {
            console.warn(`Text-LLM model ${model} failed:`, tErr?.message || tErr);
          }
        }
      }
      if (!extractedData && !isPdf) {
        let visionModels = [
          body.preferredModel && body.preferredModel.startsWith("@cf/") ? body.preferredModel : aiVisionModel,
          "@cf/meta/llama-3.2-11b-vision-instruct",
          "@cf/moondream/moondream3.1-9b-a2b"
        ].filter((m, i, arr) => arr.indexOf(m) === i);
        const imageArray = Array.from(imageBytes);
        const base64DataUri = "data:image/jpeg;base64," + uint8ArrayToBase64(imageBytes);
        for (const model of visionModels) {
          try {
            let aiResponse = null;
            if (model.includes("llama")) {
              aiResponse = await env2.AI.run(model, {
                image: imageArray,
                prompt: activeImagePrompt,
                max_tokens: 512,
                temperature: 0
              });
            } else if (model.includes("moondream")) {
              try {
                aiResponse = await env2.AI.run(model, { prompt: activeImagePrompt, image: imageArray });
              } catch {
                try {
                  aiResponse = await env2.AI.run(model, { question: activeImagePrompt, image: imageArray });
                } catch {
                  aiResponse = await env2.AI.run(model, { task: "query", question: activeImagePrompt, image: base64DataUri });
                }
              }
            } else {
              aiResponse = await env2.AI.run(model, { image: imageArray, prompt: activeImagePrompt, max_tokens: 512 });
            }
            let rawText = "";
            if (typeof aiResponse === "string")
              rawText = aiResponse;
            else if (aiResponse?.result || aiResponse?.answer)
              rawText = aiResponse.result || aiResponse.answer;
            else if (aiResponse?.response)
              rawText = aiResponse.response;
            else if (aiResponse?.description)
              rawText = aiResponse.description;
            else
              rawText = JSON.stringify(aiResponse);
            debugRawAiText = rawText;
            debugModelUsed = model + " (Cloudflare Workers AI)";
            if (rawText && rawText.length > 5) {
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  extractedData = JSON.parse(jsonMatch[0]);
                  break;
                } catch {
                }
              }
            }
          } catch (modelErr) {
            console.warn(`Vision model ${model} failed, trying next:`, modelErr?.message || modelErr);
          }
        }
      }
    }
    if (!extractedData && isPdf && pdfExtractedText && pdfExtractedText.trim().length > 20) {
      const cleanText = pdfExtractedText.replace(/\\([()])/g, "$1").replace(/\\/g, " ");
      let fDate = "";
      const dateMatch = cleanText.match(/(?:rechnungsdatum|datum|reisedatum|bestelldatum)?[:\s]*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
      if (dateMatch) {
        fDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
      }
      let fGross = 0;
      let fNet = 0;
      let fTaxRate = 19;
      let fTaxAmount = 0;
      const grossMatch = cleanText.match(/(?:gesamtrechnungsbetrag\s*brutto|gesamtbetrag\s*brutto|gesamtbetrag|bruttobetrag|brutto|rechnungsbetrag|endbetrag|zu\s*zahlen|gesamtpreis|gesamt)[:\s]*([\d]{1,5}[.,]\d{2})/i);
      if (grossMatch)
        fGross = parseFloat(grossMatch[1].replace(",", "."));
      const netMatch = cleanText.match(/(?:gesamtrechnungsbetrag\s*netto|gesamtbetrag\s*netto|nettobetrag|netto)[:\s]*([\d]{1,5}[.,]\d{2})/i);
      if (netMatch)
        fNet = parseFloat(netMatch[1].replace(",", "."));
      const taxRateMatch = cleanText.match(/(?:ust|mwst)[.\s(]*(\d{1,2})[%\s)]*/i);
      if (taxRateMatch)
        fTaxRate = parseFloat(taxRateMatch[1]);
      const taxAmtMatch = cleanText.match(/(?:ust|mwst)[^:]*?[:\s]+([\d]{1,5}[.,]\d{2})\s*€?/i);
      if (taxAmtMatch)
        fTaxAmount = parseFloat(taxAmtMatch[1].replace(",", "."));
      if (fGross === 0 && fNet > 0 && fTaxAmount > 0) {
        fGross = +(fNet + fTaxAmount).toFixed(2);
      } else if (fGross > 0 && fNet === 0 && fTaxRate > 0) {
        fNet = +(fGross / (1 + fTaxRate / 100)).toFixed(2);
      } else if (fGross > 0 && fNet > 0 && fGross > fNet && fTaxAmount === 0) {
        fTaxAmount = +(fGross - fNet).toFixed(2);
      }
      extractedData = {
        docRole: "TrainTicket",
        categorySuggestion: "TransitLocal",
        supplierName: "",
        locationAddress: "",
        voucherDate: fDate,
        amountGross: fGross,
        amountNet: fNet,
        taxRate: fTaxRate,
        taxAmount: fTaxAmount,
        summary: "",
        isTrain: true
      };
      debugModelUsed = "Regex Stream Fallback (PDF)";
    }
    if (extractedData && typeof extractedData === "object") {
      const combinedText = ((pdfExtractedText || "") + " " + (extractedData.supplierName || "") + " " + (extractedData.summary || "") + " " + (extractedData.locationAddress || "")).toLowerCase();
      const suppLower = (extractedData.supplierName || "").toLowerCase();
      const isGeminiModel = typeof debugModelUsed === "string" && debugModelUsed.includes("Google Gemini API");
      let customRuleMatched = false;
      if (customRules.length > 0) {
        for (const cr of customRules) {
          if (cr.keyword && combinedText.includes(cr.keyword.toLowerCase().trim())) {
            extractedData.categorySuggestion = cr.category;
            if (cr.taxRate !== void 0 && cr.taxRate !== null) {
              extractedData.taxRate = Number(cr.taxRate);
            }
            if (cr.category === "TrainLongDistance" || cr.category === "TransitLocal") {
              extractedData.docRole = "TrainTicket";
              extractedData.isTrain = true;
            } else if (cr.category === "HotelLogis" || cr.category === "HotelBreakfast") {
              extractedData.docRole = "HotelInvoice";
              extractedData.isHotel = true;
            } else if (cr.category === "TaxiLocal" || cr.category === "TaxiLong") {
              extractedData.docRole = "TaxiReceipt";
              extractedData.isTaxi = true;
            } else if (cr.category === "Flight") {
              extractedData.docRole = "FlightTicket";
              extractedData.isFlight = true;
            } else if (cr.category === "Parking") {
              extractedData.docRole = "ParkingTicket";
              extractedData.isParking = true;
            } else if (cr.category === "FuelPower") {
              extractedData.docRole = "FuelReceipt";
              extractedData.isFuel = true;
            } else if (cr.category === "Hospitality") {
              extractedData.docRole = "HospitalityInvoice";
            }
            customRuleMatched = true;
            break;
          }
        }
      }
      const isStrictPaymentSlip = !customRuleMatched && (extractedData.isPaymentSlip === true || extractedData.docRole === "PaymentSlip" || extractedData.categorySuggestion === "PaymentSlip" || extractedData.categorySuggestion === "OtherExpense" || combinedText.includes("kundenbeleg") || combinedText.includes("kartenzahlung") || combinedText.includes("terminalbeleg") || combinedText.includes("ec-beleg") || combinedText.includes("girocard") || combinedText.includes("electronic cash") || combinedText.includes("terminal-id") || combinedText.includes("trace-nr") || combinedText.includes("genehmigungs-nr") || suppLower.includes("kundenbeleg")) && !combinedText.includes("taxifahrt") && !combinedText.includes("flug");
      if (isStrictPaymentSlip) {
        extractedData.docRole = "PaymentSlip";
        extractedData.isPaymentSlip = true;
        extractedData.isHotel = false;
        extractedData.isTaxi = false;
        extractedData.isTrain = false;
        extractedData.isFlight = false;
        extractedData.isParking = false;
        extractedData.isFuel = false;
        extractedData.categorySuggestion = "Other";
        extractedData.taxRate = 0;
        extractedData.taxAmount = 0;
        extractedData.tax7Gross = 0;
        extractedData.tax19Gross = 0;
        if (extractedData.amountGross > 0) {
          extractedData.amountNet = extractedData.amountGross;
        }
        customRuleMatched = true;
      }
      if (!customRuleMatched && aiAutoDetect && !isGeminiModel) {
        const isDachTransit = combinedText.includes("autokraft") || combinedText.includes("kielius") || combinedText.includes("bvg") || combinedText.includes("hvv") || combinedText.includes("vbb") || combinedText.includes("mvv") || combinedText.includes("rmv") || combinedText.includes("vrr") || combinedText.includes("vvs") || combinedText.includes("kvv") || combinedText.includes("nah.sh") || combinedText.includes("nahverkehr") || combinedText.includes("\xF6pnv") || combinedText.includes("flughafenbus") || combinedText.includes("fernbus") || combinedText.includes("flixbus") || combinedText.includes("fahrschein") || combinedText.includes("einzelkarte") || combinedText.includes("tageskarte");
        const isDachTrain = combinedText.includes("bahn") || combinedText.includes("deutsche bahn") || combinedText.includes("db fernverkehr") || combinedText.includes("db vertrieb") || combinedText.includes("zugticket") || combinedText.includes("fahrkarte") || combinedText.includes("ice ") || combinedText.includes("ic/ec") || suppLower.includes("deutsche bahn") || suppLower.includes("db fernverkehr");
        if (isDachTransit) {
          extractedData.docRole = "TrainTicket";
          extractedData.isTrain = true;
          extractedData.categorySuggestion = "TransitLocal";
          if (!extractedData.supplierName) {
            if (combinedText.includes("autokraft"))
              extractedData.supplierName = "Autokraft GmbH";
            else if (combinedText.includes("bvg"))
              extractedData.supplierName = "Berliner Verkehrsbetriebe (BVG)";
            else if (combinedText.includes("hvv"))
              extractedData.supplierName = "Hamburger Verkehrsverbund (HVV)";
            else if (combinedText.includes("nah.sh"))
              extractedData.supplierName = "NAH.SH GmbH";
          }
          if (combinedText.includes("kielius") && !extractedData.summary) {
            extractedData.summary = "Kielius Flughafentransfer / Bus";
          }
          customRuleMatched = true;
        } else if (isDachTrain) {
          extractedData.docRole = "TrainTicket";
          extractedData.isTrain = true;
          extractedData.categorySuggestion = "TrainLongDistance";
          if (!extractedData.supplierName)
            extractedData.supplierName = "Deutsche Bahn AG";
          if (!extractedData.taxRate)
            extractedData.taxRate = 7;
          customRuleMatched = true;
        }
      }
      if (!customRuleMatched && !isGeminiModel) {
        const isRestaurantDoc = (combinedText.includes("restaurant") || combinedText.includes("buffet") || combinedText.includes("gastst\xE4tte") || suppLower.includes("restaurant") || extractedData.docRole === "HospitalityInvoice") && extractedData.docRole !== "PaymentSlip";
        const isTaxiDetected = !isRestaurantDoc && (combinedText.includes("taxifahrt") || combinedText.includes("taxi ") || combinedText.includes("taxi-") || combinedText.includes("taxen ") || combinedText.includes("fahrauftrag") || combinedText.includes("stadtfahrt") || suppLower.includes("taxi") || extractedData.docRole === "TaxiReceipt" || extractedData.isTaxi === true || extractedData.categorySuggestion === "TaxiLocal" || extractedData.categorySuggestion === "TaxiLong");
        const isHotelDetected = !isTaxiDetected && !isRestaurantDoc && (combinedText.includes("hotel") || combinedText.includes("\xFCbernachtung") || combinedText.includes("logis") || combinedText.includes("zimmer") || combinedText.includes("lodging") || suppLower.includes("hotel") || suppLower.includes("motel") || suppLower.includes("inn") || suppLower.includes("resort") || extractedData.docRole === "HotelInvoice" || extractedData.isHotel === true || extractedData.categorySuggestion === "HotelLogis" || extractedData.categorySuggestion === "HotelBreakfast");
        const isFlightDetected = !isTaxiDetected && (combinedText.includes("flug") || combinedText.includes("flight") || combinedText.includes("boarding") || combinedText.includes("airline") || combinedText.includes("lufthansa") || combinedText.includes("eurowings") || suppLower.includes("airline") || suppLower.includes("lufthansa") || extractedData.docRole === "FlightTicket" || extractedData.isFlight === true);
        const isParkingDetected = !isTaxiDetected && (combinedText.includes("parkhaus") || combinedText.includes("parkplatz") || combinedText.includes("parkschein") || combinedText.includes("apcoa") || combinedText.includes("contipark") || suppLower.includes("park") || extractedData.docRole === "ParkingTicket" || extractedData.isParking === true);
        const isFuelDetected = !isTaxiDetected && (combinedText.includes("tankstelle") || combinedText.includes("kraftstoff") || combinedText.includes("diesel") || combinedText.includes("super e10") || combinedText.includes("aral") || combinedText.includes("shell") || combinedText.includes("total") || suppLower.includes("aral") || suppLower.includes("shell") || suppLower.includes("total") || extractedData.docRole === "FuelReceipt" || extractedData.isFuel === true);
        const isPaymentSlipDetected = !isRestaurantDoc && !isHotelDetected && !isFlightDetected && !isParkingDetected && !isTaxiDetected && (combinedText.includes("kundenbeleg") || combinedText.includes("kartenzahlung") || combinedText.includes("contactless") || combinedText.includes("girocard") || combinedText.includes("terminal-id") || combinedText.includes("trace-nr") || combinedText.includes("genehmigungs-nr") || combinedText.includes("terminalbeleg") || suppLower.includes("kundenbeleg"));
        if (isPaymentSlipDetected) {
          extractedData.docRole = "PaymentSlip";
          extractedData.isPaymentSlip = true;
          extractedData.isTaxi = false;
          extractedData.categorySuggestion = "Other";
        } else if (isTaxiDetected) {
          extractedData.docRole = "TaxiReceipt";
          extractedData.isTaxi = true;
          extractedData.isPaymentSlip = false;
          extractedData.isHotel = false;
          extractedData.categorySuggestion = extractedData.taxRate === 19 || extractedData.amountGross && extractedData.amountGross > 80 ? "TaxiLong" : "TaxiLocal";
          if (!extractedData.taxRate)
            extractedData.taxRate = 7;
        } else if (isHotelDetected) {
          extractedData.docRole = "HotelInvoice";
          extractedData.isHotel = true;
          extractedData.isPaymentSlip = false;
          extractedData.isTaxi = false;
          extractedData.categorySuggestion = "HotelLogis";
          if (!extractedData.taxRate || extractedData.taxRate === 19)
            extractedData.taxRate = 7;
        } else if (isFlightDetected) {
          extractedData.docRole = "FlightTicket";
          extractedData.isFlight = true;
          extractedData.categorySuggestion = "Flight";
          if (!extractedData.taxRate)
            extractedData.taxRate = 19;
        } else if (isParkingDetected) {
          extractedData.docRole = "ParkingTicket";
          extractedData.isParking = true;
          extractedData.categorySuggestion = "Parking";
          if (!extractedData.taxRate)
            extractedData.taxRate = 19;
        } else if (isFuelDetected) {
          extractedData.docRole = "FuelReceipt";
          extractedData.isFuel = true;
          extractedData.categorySuggestion = "FuelPower";
          if (!extractedData.taxRate)
            extractedData.taxRate = 19;
        } else if (isRestaurantDoc) {
          extractedData.docRole = "HospitalityInvoice";
          extractedData.categorySuggestion = "Hospitality";
          extractedData.isPaymentSlip = false;
          extractedData.isTaxi = false;
        } else {
          if (!extractedData.categorySuggestion)
            extractedData.categorySuggestion = "Other";
        }
      }
    }
    if (extractedData) {
      if (typeof extractedData.amountGross === "string")
        extractedData.amountGross = parseFloat(extractedData.amountGross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if (typeof extractedData.amountNet === "string")
        extractedData.amountNet = parseFloat(extractedData.amountNet.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if (typeof extractedData.taxRate === "string")
        extractedData.taxRate = parseFloat(extractedData.taxRate.replace(",", ".").replace(/[^0-9.]/g, "")) || 19;
      if (typeof extractedData.tipAmount === "string")
        extractedData.tipAmount = parseFloat(extractedData.tipAmount.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if (typeof extractedData.taxAmount === "string")
        extractedData.taxAmount = parseFloat(extractedData.taxAmount.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if (typeof extractedData.tax7Gross === "string")
        extractedData.tax7Gross = parseFloat(extractedData.tax7Gross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if (typeof extractedData.tax19Gross === "string")
        extractedData.tax19Gross = parseFloat(extractedData.tax19Gross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if ((extractedData.tax7Gross > 0 || extractedData.tax19Gross > 0) && (!extractedData.amountGross || extractedData.amountGross === 0)) {
        extractedData.amountGross = +((extractedData.tax7Gross || 0) + (extractedData.tax19Gross || 0)).toFixed(2);
      }
    }
    if (!extractedData) {
      return jsonResponse({
        success: false,
        error: "KI-Modell konnte Belegdaten nicht automatisch extrahieren (z. B. unleserlich oder ununterst\xFCtztes Rohformat). Bitte manuell erfassen.",
        extracted: null,
        modelUsed: debugModelUsed,
        rawAiText: debugRawAiText,
        geminiError: geminiErrorDetails || void 0
      });
    }
    return jsonResponse({
      success: true,
      extracted: extractedData,
      modelUsed: debugModelUsed,
      rawAiText: debugRawAiText,
      geminiError: geminiErrorDetails || void 0
    });
  } catch (err) {
    return errorResponse(`Fehler bei der Beleg-Analyse: ${err?.message || err}`, 500);
  }
}
__name(scanVoucherWithAi, "scanVoucherWithAi");

// src/routes/vouchers.routes.ts
async function handleVouchersRoutes(request, env2, path, method) {
  const url = new URL(request.url);
  if (path === "/api/v1/vouchers/scan-ai" && method === "POST") {
    return scanVoucherWithAi(request, env2);
  }
  if (path === "/api/v1/vouchers/upload-session/create" && method === "POST") {
    await ensureOperationalVouchers(env2);
    const sessionId = "scan_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1e3).toISOString();
    await env2.DB.prepare(`
          INSERT INTO voucher_upload_sessions (id, status, uploaded_files_json, expires_at_utc, created_at_utc)
          VALUES (?, 'waiting', '[]', ?, ?)
        `).bind(sessionId, expiresAt, now.toISOString()).run();
    return jsonResponse({
      success: true,
      sessionId,
      expiresAt
    });
  }
  if ((path === "/api/v1/vouchers/upload-session/file" || path === "/api/v1/vouchers/direct-upload") && method === "POST") {
    await ensureOperationalVouchers(env2);
    try {
      const contentType = request.headers.get("content-type") || "";
      let filename = "beleg.jpg";
      let mimeType = "image/jpeg";
      let bytes = null;
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const fileEntry = formData.get("file");
        if (!fileEntry || typeof fileEntry === "string") {
          return errorResponse("Keine Datei im Formularfeld 'file' gefunden.", 400);
        }
        const file = fileEntry;
        filename = file.name || "beleg.jpg";
        mimeType = file.type || "image/jpeg";
        bytes = new Uint8Array(await file.arrayBuffer());
      } else {
        const body = await request.json();
        filename = body.filename || "beleg.jpg";
        mimeType = body.mimeType || "image/jpeg";
        let b64 = body.base64 || body.file || "";
        if (b64.includes(","))
          b64 = b64.split(",")[1];
        const bin = atob(b64);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++)
          bytes[i] = bin.charCodeAt(i);
      }
      if (!bytes || bytes.length === 0) {
        return errorResponse("Leere Belegdatei empfangen.", 400);
      }
      const fileId = `rec_mob_${crypto.randomUUID().replace(/-/g, "")}`;
      const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const r2Key = `vouchers/receipts/${fileId}_${cleanFilename}`;
      if (env2.STORAGE) {
        await env2.STORAGE.put(r2Key, bytes, {
          httpMetadata: { contentType: mimeType }
        });
      }
      try {
        await ensureOperationalVouchers(env2);
        await env2.DB.prepare(`
              INSERT OR REPLACE INTO operational_vouchers (id, voucher_date, amount_gross, tax_rate, supplier_name, file_r2_key, status, created_at_utc)
              VALUES (?, ?, 0.0, 19.0, ?, ?, 'PendingReview', ?)
            `).bind(fileId, (/* @__PURE__ */ new Date()).toISOString().substring(0, 10), cleanFilename, r2Key, (/* @__PURE__ */ new Date()).toISOString()).run();
      } catch (dbErr) {
        console.warn("Could not register voucher in D1 inbox:", dbErr);
      }
      return jsonResponse({
        success: true,
        id: fileId,
        filename: cleanFilename,
        r2Key,
        size: bytes.length,
        mimeType
      });
    } catch (err) {
      console.error("Direct voucher upload error:", err);
      return errorResponse(`Fehler beim Beleg-Upload: ${err?.message || err}`, 500);
    }
  }
  const mobileUploadMatch = path.match(/^\/api\/v1\/vouchers\/upload-session\/([a-zA-Z0-9_-]+)\/upload$/);
  if (mobileUploadMatch && method === "POST") {
    await ensureOperationalVouchers(env2);
    const sessionId = mobileUploadMatch[1];
    const session = await env2.DB.prepare("SELECT * FROM voucher_upload_sessions WHERE id = ?").bind(sessionId).first();
    if (!session)
      return errorResponse("Upload-Session nicht gefunden.", 404);
    if (session.status === "ready" || session.status === "completed") {
      return errorResponse("Upload-Session wurde bereits verwendet (Einmal-Token).", 409);
    }
    if (session.expires_at_utc && new Date(session.expires_at_utc).getTime() < Date.now()) {
      return errorResponse("Upload-Session ist abgelaufen (TTL \xFCberschritten). Bitte neuen QR-Code scannen.", 410);
    }
    try {
      const body = await request.json();
      const files = body.files || [];
      if (!files || files.length === 0) {
        return errorResponse("Keine Dateien zum Hochladen \xFCbermittelt.", 400);
      }
      const uploadedResults = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fileId = `rec_mob_${crypto.randomUUID().replace(/-/g, "")}`;
        const cleanFilename = (f.filename || `foto_${i + 1}.jpg`).replace(/[^a-zA-Z0-9_.-]/g, "_");
        const r2Key = `vouchers/receipts/${fileId}_${cleanFilename}`;
        let cleanBase64 = f.base64 || "";
        if (cleanBase64.includes(","))
          cleanBase64 = cleanBase64.split(",")[1];
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let b = 0; b < binaryString.length; b++) {
          bytes[b] = binaryString.charCodeAt(b);
        }
        await env2.STORAGE.put(r2Key, bytes, {
          httpMetadata: { contentType: f.mimeType || "image/jpeg" }
        });
        uploadedResults.push({
          r2Key,
          filename: cleanFilename,
          mimeType: f.mimeType || "image/jpeg",
          size: bytes.length
        });
      }
      await env2.DB.prepare(`
            UPDATE voucher_upload_sessions 
            SET status = 'ready', uploaded_files_json = ? 
            WHERE id = ?
          `).bind(JSON.stringify(uploadedResults), sessionId).run();
      return jsonResponse({ success: true, count: uploadedResults.length, files: uploadedResults });
    } catch (upErr) {
      console.error("Mobile upload processing error:", upErr);
      return errorResponse(`Upload-Fehler: ${upErr?.message || upErr}`, 500);
    }
  }
  const mobileStatusMatch = path.match(/^\/api\/v1\/vouchers\/upload-session\/([a-zA-Z0-9_-]+)\/status$/);
  if (mobileStatusMatch && method === "GET") {
    await ensureOperationalVouchers(env2);
    const sessionId = mobileStatusMatch[1];
    const session = await env2.DB.prepare("SELECT * FROM voucher_upload_sessions WHERE id = ?").bind(sessionId).first();
    if (!session)
      return errorResponse("Session nicht gefunden", 404);
    const files = JSON.parse(session.uploaded_files_json || "[]");
    return jsonResponse({
      success: true,
      status: session.status,
      files: session.status === "ready" ? files : []
    });
  }
  if (path.startsWith("/api/v1/vouchers/receipts/") && method === "GET") {
    const r2Key = decodeURIComponent(path.replace("/api/v1/vouchers/receipts/", ""));
    const obj = await env2.STORAGE.get(r2Key);
    if (!obj)
      return errorResponse("Belegdatei nicht im Speicher gefunden", 404);
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("etag", obj.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000");
    return new Response(obj.body, { headers });
  }
  if (path === "/api/v1/vouchers" && method === "GET") {
    await ensureOperationalVouchers(env2);
    const period = url.searchParams.get("period");
    const type = url.searchParams.get("type");
    let sql = `
          SELECT v.*, 
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          WHERE 1=1
        `;
    const params = [];
    if (period && period.trim()) {
      sql += " AND v.voucher_date LIKE ?";
      params.push(`${period.trim()}%`);
    }
    if (type && type !== "all") {
      sql += " AND v.voucher_type = ?";
      params.push(type);
    }
    sql += " ORDER BY v.voucher_date DESC, v.created_at_utc DESC";
    let stmt = env2.DB.prepare(sql);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    const { results: vouchers } = await stmt.all();
    return jsonResponse({
      success: true,
      count: vouchers.length,
      vouchers: vouchers || []
    });
  }
  if (path === "/api/v1/vouchers" && method === "POST") {
    await ensureOperationalVouchers(env2);
    const body = await request.json();
    const isDraft = body.is_draft === true || body.status === "Draft";
    const voucherType = body.voucher_type || "Hospitality";
    const voucherDate = body.voucher_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const supplierName = (body.supplier_name || "").trim() || (isDraft ? "Unbearbeiteter Beleg (Entwurf)" : "");
    const description = (body.description || "").trim() || `${voucherType} Beleg`;
    const businessPurpose = (body.business_purpose || "").trim() || (isDraft ? "Beleg im Eingangskorb zur sp\xE4teren Bearbeitung" : "");
    if (!isDraft) {
      if (!supplierName) {
        return errorResponse("Bitte geben Sie den Namen des Lokals, H\xE4ndlers oder Dienstleisters an.", 400);
      }
      if (voucherType === "Hospitality" && (!businessPurpose || businessPurpose.length < 5)) {
        return errorResponse("Bei Bewirtungsbelegen ist die Angabe des konkreten gesch\xE4ftlichen Anlasses gesetzlich vorgeschrieben (\xA7 4 Abs. 5 EStG).", 400);
      }
    }
    const id = body.id || `vouch_${crypto.randomUUID().replace(/-/g, "")}`;
    let voucherNumber = body.voucher_number;
    if (!voucherNumber) {
      const countRow = await env2.DB.prepare("SELECT COUNT(*) as c FROM operational_vouchers WHERE voucher_date LIKE ?").bind(`${voucherDate.substring(0, 7)}%`).first();
      const seq = ((countRow?.c || 0) + 1).toString().padStart(4, "0");
      voucherNumber = `BEL-${voucherDate.substring(0, 4)}-${seq}`;
    }
    const amountGross = Number(body.amount_gross) || 0;
    const rawTaxRate = body.tax_rate !== void 0 ? String(body.tax_rate) : "19";
    const isMixed = rawTaxRate === "mixed";
    const tax19Gross = Number(body.tax19_gross) || (isMixed ? 33.1 : 0);
    const tax7Gross = Number(body.tax7_gross) || (isMixed ? 127.4 : 0);
    const tax19Amount = Number((tax19Gross - tax19Gross / 1.19).toFixed(2));
    const tax7Amount = Number((tax7Gross - tax7Gross / 1.07).toFixed(2));
    let taxAmount = 0;
    let amountNet = 0;
    if (isMixed) {
      taxAmount = Number((tax19Amount + tax7Amount).toFixed(2));
      amountNet = Number((amountGross - taxAmount).toFixed(2));
    } else {
      const numRate = Number(rawTaxRate) || 0;
      amountNet = Number(body.amount_net) || (amountGross > 0 ? Number((amountGross / (1 + numRate / 100)).toFixed(2)) : 0);
      taxAmount = Number((amountGross - amountNet).toFixed(2));
    }
    const tipAmount = Number(body.tip_amount) || 0;
    const totalAttendees = Number(body.total_attendees_count) || 1;
    const businessAttendees = Number(body.business_attendees_count) || totalAttendees;
    const businessSharePercent = Math.min(100, Math.max(0, businessAttendees / totalAttendees * 100));
    const businessGross = amountGross * (businessSharePercent / 100);
    const businessNet = amountNet * (businessSharePercent / 100);
    const taxDeductibleNet = businessNet * 0.7;
    const taxNonDeductibleNet = businessNet * 0.3;
    const privateShareGross = amountGross - businessGross;
    let skr04 = body.skr04_account || "4650";
    let skr03 = body.skr03_account || "4650";
    if (voucherType === "LocalTransit") {
      skr04 = "4673";
      skr03 = "4673";
    } else if (voucherType === "GWG_Asset") {
      skr04 = "0485";
      skr03 = "0480";
    } else if (voucherType === "GeneralExpense") {
      skr04 = body.skr04_account || "4985";
      skr03 = body.skr03_account || "4985";
    }
    const hashPayload = `${voucherNumber}|${voucherDate}|${supplierName}|${amountGross.toFixed(2)}|${taxDeductibleNet.toFixed(2)}|${skr04}`;
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(hashPayload));
    const hashArray = Array.from(new Uint8Array(hashBuf));
    const sha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const status = isDraft ? "Draft" : "Verified";
    await env2.DB.prepare(`
          INSERT INTO operational_vouchers (
            id, voucher_number, voucher_type, voucher_date, supplier_name, description, business_purpose,
            project_id, customer_id, is_billable_to_client,
            amount_gross, amount_net, tax_rate, tax_amount, tip_amount,
            tax19_gross, tax7_gross, tax19_amount, tax7_amount,
            total_attendees_count, business_attendees_count, business_share_percent,
            tax_deductible_net, tax_non_deductible_net, private_share_gross,
            attendees_json, location_address,
            is_own_receipt, own_receipt_reason,
            transport_type, distance_km, origin_address, destination_address, parent_hospitality_voucher_id,
            skr04_account, skr03_account,
            receipt_r2_key, receipt_filename, receipt_mime_type,
            payment_slip_r2_key, payment_slip_filename, payment_slip_total_gross, payment_method,
            secondary_attachment_r2_key, secondary_attachment_filename,
            voucher_pdf_hash_sha256,
            created_at_utc, updated_at_utc, status
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            voucher_type = excluded.voucher_type,
            voucher_date = excluded.voucher_date,
            supplier_name = excluded.supplier_name,
            description = excluded.description,
            business_purpose = excluded.business_purpose,
            project_id = excluded.project_id,
            customer_id = excluded.customer_id,
            is_billable_to_client = excluded.is_billable_to_client,
            amount_gross = excluded.amount_gross,
            amount_net = excluded.amount_net,
            tax_rate = excluded.tax_rate,
            tax_amount = excluded.tax_amount,
            tip_amount = excluded.tip_amount,
            tax19_gross = excluded.tax19_gross,
            tax7_gross = excluded.tax7_gross,
            tax19_amount = excluded.tax19_amount,
            tax7_amount = excluded.tax7_amount,
            total_attendees_count = excluded.total_attendees_count,
            business_attendees_count = excluded.business_attendees_count,
            business_share_percent = excluded.business_share_percent,
            tax_deductible_net = excluded.tax_deductible_net,
            tax_non_deductible_net = excluded.tax_non_deductible_net,
            private_share_gross = excluded.private_share_gross,
            attendees_json = excluded.attendees_json,
            location_address = excluded.location_address,
            is_own_receipt = excluded.is_own_receipt,
            own_receipt_reason = excluded.own_receipt_reason,
            transport_type = excluded.transport_type,
            distance_km = excluded.distance_km,
            origin_address = excluded.origin_address,
            destination_address = excluded.destination_address,
            parent_hospitality_voucher_id = excluded.parent_hospitality_voucher_id,
            skr04_account = excluded.skr04_account,
            skr03_account = excluded.skr03_account,
            receipt_r2_key = excluded.receipt_r2_key,
            receipt_filename = excluded.receipt_filename,
            receipt_mime_type = excluded.receipt_mime_type,
            payment_slip_r2_key = excluded.payment_slip_r2_key,
            payment_slip_filename = excluded.payment_slip_filename,
            payment_slip_total_gross = excluded.payment_slip_total_gross,
            payment_method = excluded.payment_method,
            secondary_attachment_r2_key = excluded.secondary_attachment_r2_key,
            secondary_attachment_filename = excluded.secondary_attachment_filename,
            voucher_pdf_hash_sha256 = excluded.voucher_pdf_hash_sha256,
            updated_at_utc = excluded.updated_at_utc,
            status = excluded.status
        `).bind(
      id,
      voucherNumber,
      voucherType,
      voucherDate,
      supplierName,
      description,
      businessPurpose,
      body.project_id || null,
      body.customer_id || null,
      body.is_billable_to_client ? 1 : 0,
      amountGross,
      amountNet,
      rawTaxRate,
      taxAmount,
      tipAmount,
      tax19Gross,
      tax7Gross,
      tax19Amount,
      tax7Amount,
      totalAttendees,
      businessAttendees,
      businessSharePercent,
      taxDeductibleNet,
      taxNonDeductibleNet,
      privateShareGross,
      typeof body.attendees_json === "string" ? body.attendees_json : JSON.stringify(body.attendees_json || []),
      body.location_address || null,
      body.is_own_receipt ? 1 : 0,
      body.own_receipt_reason || null,
      body.transport_type || null,
      Number(body.distance_km) || 0,
      body.origin_address || null,
      body.destination_address || null,
      body.parent_hospitality_voucher_id || null,
      skr04,
      skr03,
      body.receipt_r2_key || null,
      body.receipt_filename || null,
      body.receipt_mime_type || null,
      body.payment_slip_r2_key || null,
      body.payment_slip_filename || null,
      Number(body.payment_slip_total_gross) || (tipAmount > 0 ? amountGross + tipAmount : 0),
      body.payment_method || "Card_NFC",
      body.secondary_attachment_r2_key || null,
      body.secondary_attachment_filename || null,
      sha256,
      now,
      now,
      status
    ).run();
    await logAuditEvent(env2, {
      eventType: "voucher_created",
      entityType: "operational_voucher",
      entityId: id,
      actor: "Freelancer",
      description: `Neuer Beleg ${voucherNumber} (${voucherType}, ${amountGross.toFixed(2)} \u20AC) erfasst`,
      dataPayload: { voucherNumber, voucherType, amountGross, taxDeductibleNet, sha256 }
    });
    return jsonResponse({
      success: true,
      voucherId: id,
      voucherNumber,
      dataHash: sha256,
      message: `Beleg ${voucherNumber} wurde GoBD-konform gespeichert.`
    });
  }
  const voucherGetMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)$/);
  if (voucherGetMatch && method === "GET") {
    await ensureOperationalVouchers(env2);
    const vId = voucherGetMatch[1];
    const v = await env2.DB.prepare(`
          SELECT v.*, 
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          WHERE v.id = ?
        `).bind(vId).first();
    if (!v)
      return errorResponse("Beleg nicht gefunden.", 404);
    const { results: linkedTransit } = await env2.DB.prepare(`
          SELECT * FROM operational_vouchers 
          WHERE parent_hospitality_voucher_id = ? 
          ORDER BY created_at_utc ASC
        `).bind(vId).all();
    return jsonResponse({ success: true, voucher: v, linkedTransit: linkedTransit || [] });
  }
  const voucherLinkedTransitMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)\/linked-transit$/);
  if (voucherLinkedTransitMatch && method === "DELETE") {
    await ensureOperationalVouchers(env2);
    const vId = voucherLinkedTransitMatch[1];
    await env2.DB.prepare("DELETE FROM operational_vouchers WHERE parent_hospitality_voucher_id = ?").bind(vId).run();
    return jsonResponse({ success: true, message: "Verkn\xFCpfte Fahrten gel\xF6scht." });
  }
  if (voucherGetMatch && method === "DELETE") {
    await ensureOperationalVouchers(env2);
    const vId = voucherGetMatch[1];
    const v = await env2.DB.prepare("SELECT * FROM operational_vouchers WHERE id = ?").bind(vId).first();
    if (!v)
      return errorResponse("Beleg nicht gefunden.", 404);
    await env2.DB.prepare("DELETE FROM operational_vouchers WHERE id = ?").bind(vId).run();
    await logAuditEvent(env2, {
      eventType: "voucher_deleted",
      entityType: "operational_voucher",
      entityId: vId,
      actor: "Freelancer",
      description: `Beleg ${v.voucher_number} (${v.amount_gross} \u20AC) gel\xF6scht`,
      dataPayload: { voucherNumber: v.voucher_number }
    });
    return jsonResponse({ success: true, message: `Beleg ${v.voucher_number} gel\xF6scht.` });
  }
  const voucherSyncMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)\/sync-lexware$/);
  if (voucherSyncMatch && method === "POST") {
    return syncVoucherToLexware(voucherSyncMatch[1], env2);
  }
  return null;
}
__name(handleVouchersRoutes, "handleVouchersRoutes");

// src/services/tax_travel.service.ts
async function getTaxReportSummary(request, env2) {
  await ensureTripExpenses(env2);
  const url = new URL(request.url);
  const isDemo = isDemoRequest(request);
  const year = url.searchParams.get("year") || "all";
  const month = url.searchParams.get("month") || "all";
  const customerId = url.searchParams.get("customerId") || "all";
  const projectId = url.searchParams.get("projectId") || "all";
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const configRow = await env2.DB.prepare(
    "SELECT * FROM app_settings WHERE id = 'global_config'"
  ).first() || {};
  const taxMode = configRow?.tax_mode || "standard";
  const isSmallBusiness = taxMode === "small_business";
  let tsSql = `
    SELECT tv.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number
    FROM timesheet_versions tv
    JOIN projects p ON tv.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE tv.is_invoice_canceled = 0
      AND tv.status != 'Rejected'
  `;
  const tsParams = [];
  if (!isDemo) {
    tsSql += " AND (p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL))";
  } else {
    tsSql += " AND (p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%')";
  }
  if (customerId && customerId !== "all") {
    tsSql += " AND p.customer_id = ?";
    tsParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tsSql += " AND tv.project_id = ?";
    tsParams.push(projectId);
  }
  if (year && year !== "all") {
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${mFilter}%`);
  }
  if (dateFrom && dateTo) {
    const pFrom = dateFrom.substring(0, 7);
    const pTo = dateTo.substring(0, 7);
    tsSql += " AND tv.period >= ? AND tv.period <= ?";
    tsParams.push(pFrom, pTo);
  }
  tsSql += " ORDER BY tv.period DESC, tv.created_at_utc DESC";
  let tsStmt = env2.DB.prepare(tsSql);
  if (tsParams.length > 0)
    tsStmt = tsStmt.bind(...tsParams);
  const { results: timesheetResults } = await tsStmt.all();
  let totalRevenueNet = 0;
  let totalRevenueTax = 0;
  const timesheetList = (timesheetResults || []).map((ts) => {
    const net = Number(ts.total_amount_net) || 0;
    const taxRate = isSmallBusiness ? 0 : 19;
    const tax = Number((net * (taxRate / 100)).toFixed(2));
    const gross = Number((net + tax).toFixed(2));
    totalRevenueNet += net;
    totalRevenueTax += tax;
    return {
      id: ts.id,
      period: ts.period,
      version_number: ts.version_number || 1,
      customer_name: ts.customer_name || "-",
      project_name: ts.project_name || "-",
      project_number: ts.project_number || "-",
      total_billable_hours: Number(ts.total_billable_hours) || 0,
      amount_net: net,
      tax_rate: taxRate,
      tax_amount: tax,
      amount_gross: gross,
      status: ts.status,
      lexware_invoice_number: ts.lexware_invoice_number || null,
      created_at_utc: ts.created_at_utc
    };
  });
  let voucherSql = `
    SELECT v.*, p.name as project_name, c.name as customer_name
    FROM operational_vouchers v
    LEFT JOIN projects p ON v.project_id = p.id
    LEFT JOIN customers c ON v.customer_id = c.id
    WHERE 1=1
  `;
  const vParams = [];
  if (!isDemo) {
    voucherSql += " AND (v.id NOT LIKE 'voucher_demo_%' AND (v.project_id NOT LIKE 'prj_demo_%' OR v.project_id IS NULL))";
  } else {
    voucherSql += " AND (v.id LIKE 'voucher_demo_%' OR v.project_id LIKE 'prj_demo_%')";
  }
  if (customerId && customerId !== "all") {
    voucherSql += " AND v.customer_id = ?";
    vParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    voucherSql += " AND v.project_id = ?";
    vParams.push(projectId);
  }
  if (year && year !== "all") {
    voucherSql += " AND v.voucher_date LIKE ?";
    vParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    voucherSql += " AND v.voucher_date LIKE ?";
    vParams.push(`${mFilter}%`);
  }
  if (dateFrom && dateTo) {
    voucherSql += " AND v.voucher_date >= ? AND v.voucher_date <= ?";
    vParams.push(dateFrom, dateTo);
  }
  voucherSql += " ORDER BY v.voucher_date DESC, v.created_at_utc DESC";
  let vStmt = env2.DB.prepare(voucherSql);
  if (vParams.length > 0)
    vStmt = vStmt.bind(...vParams);
  const { results: voucherResults } = await vStmt.all();
  const categoryBuckets = {
    Hospitality: {
      label: "Bewirtungskosten (70 % abzugsf\xE4hig)",
      count: 0,
      net: 0,
      deductible_net: 0,
      tax: 0,
      gross: 0
    },
    Marketing: { label: "Werbe- & Marketingkosten", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Software: { label: "Software, Lizenzen & Cloud", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    OfficeSupplies: { label: "Arbeitsmittel & GWG", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Telecommunication: { label: "Telefon & Internet", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Education: { label: "Fortbildung & Fachliteratur", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Transit: {
      label: "Reisenebenkosten & Fremdbelege",
      count: 0,
      net: 0,
      deductible_net: 0,
      tax: 0,
      gross: 0
    },
    Other: { label: "Sonstige Betriebsausgaben", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 }
  };
  let totalVouchersNet = 0;
  let totalVouchersDeductibleNet = 0;
  let totalVouchersNonDeductibleNet = 0;
  let totalVouchersTax = 0;
  let totalVouchersGross = 0;
  let inputTax19 = 0;
  let inputTax7 = 0;
  const voucherList = (voucherResults || []).map((v) => {
    const type = v.voucher_type || "Other";
    const net = Number(v.amount_net) || 0;
    const gross = Number(v.amount_gross) || 0;
    const tax = Number(v.tax_amount) || 0;
    let dedNet = Number(v.tax_deductible_net);
    if (isNaN(dedNet) || dedNet === 0) {
      dedNet = type === "Hospitality" ? Number((net * 0.7).toFixed(2)) : net;
    }
    let nonDedNet = Number(v.tax_non_deductible_net);
    if (isNaN(nonDedNet)) {
      nonDedNet = type === "Hospitality" ? Number((net * 0.3).toFixed(2)) : 0;
    }
    const taxRate = Number(v.tax_rate) || 19;
    if (taxRate === 19) {
      inputTax19 += tax;
    } else if (taxRate === 7) {
      inputTax7 += tax;
    }
    totalVouchersNet += net;
    totalVouchersDeductibleNet += dedNet;
    totalVouchersNonDeductibleNet += nonDedNet;
    totalVouchersTax += tax;
    totalVouchersGross += gross;
    const catKey = categoryBuckets[type] ? type : "Other";
    categoryBuckets[catKey].count++;
    categoryBuckets[catKey].net += net;
    categoryBuckets[catKey].deductible_net += dedNet;
    categoryBuckets[catKey].tax += tax;
    categoryBuckets[catKey].gross += gross;
    return {
      id: v.id,
      voucher_number: v.voucher_number,
      voucher_date: v.voucher_date,
      voucher_type: type,
      supplier_name: v.supplier_name,
      description: v.description,
      business_purpose: v.business_purpose,
      skr04_account: v.skr04_account,
      amount_net: net,
      tax_rate: taxRate,
      tax_amount: tax,
      amount_gross: gross,
      tax_deductible_net: dedNet,
      tax_non_deductible_net: nonDedNet,
      customer_name: v.customer_name || "-",
      project_name: v.project_name || "-"
    };
  });
  let tripSql = `
    SELECT tr.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number
    FROM trips tr
    LEFT JOIN projects p ON tr.project_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE (tr.status = 'Completed' OR tr.status IS NULL)
  `;
  const tripParams = [];
  if (!isDemo) {
    tripSql += " AND (tr.project_id NOT LIKE 'prj_demo_%' OR tr.project_id IS NULL) AND tr.id NOT LIKE 'trip_demo_%' AND (c.id NOT LIKE 'cust_demo_%' OR c.id IS NULL)";
  } else {
    tripSql += " AND (tr.project_id LIKE 'prj_demo_%' OR tr.id LIKE 'trip_demo_%' OR tr.project_id IS NULL)";
  }
  if (customerId && customerId !== "all") {
    tripSql += " AND p.customer_id = ?";
    tripParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tripSql += " AND tr.project_id = ?";
    tripParams.push(projectId);
  }
  if (year && year !== "all") {
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${mFilter}%`);
  }
  if (dateFrom && dateTo) {
    tripSql += " AND tr.trip_date >= ? AND tr.trip_date <= ?";
    tripParams.push(dateFrom, dateTo);
  }
  tripSql += " ORDER BY tr.trip_date DESC";
  let tripStmt = env2.DB.prepare(tripSql);
  if (tripParams.length > 0)
    tripStmt = tripStmt.bind(...tripParams);
  const { results: tripResults } = await tripStmt.all();
  const tripIds = (tripResults || []).map((t) => t.id);
  let tripExpensesResults = [];
  let tripLegsResults = [];
  if (tripIds.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < tripIds.length; i += chunkSize) {
      const chunk = tripIds.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => "?").join(",");
      const { results: expRes } = await env2.DB.prepare(`
        SELECT te.*, tr.trip_date, tr.project_id, tr.purpose
        FROM trip_expenses te
        JOIN trips tr ON te.trip_id = tr.id
        WHERE te.trip_id IN (${placeholders})
          AND (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
        ORDER BY te.expense_date ASC
      `).bind(...chunk).all();
      if (expRes && expRes.length > 0) {
        tripExpensesResults.push(...expRes);
      }
      const { results: legRes } = await env2.DB.prepare(`
        SELECT * FROM trip_legs
        WHERE trip_id IN (${placeholders})
        ORDER BY leg_order ASC
      `).bind(...chunk).all();
      if (legRes && legRes.length > 0) {
        tripLegsResults.push(...legRes);
      }
    }
  }
  categoryBuckets.TravelLodging = {
    label: "Reisekosten: \xDCbernachtungskosten (Hotel)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  categoryBuckets.TravelTransport = {
    label: "Reisekosten: Fahrtkosten (Flug, Bahn, \xD6PNV)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  categoryBuckets.TravelIncidentals = {
    label: "Reisenebenkosten (Taxi, Parken, Gep\xE4ck)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  categoryBuckets.TravelOther = {
    label: "Sonstige Reisebelege",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  categoryBuckets.TravelVma = {
    label: "Reisekosten: Verpflegungsmehraufwand (VMA Pauschalen)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  categoryBuckets.TravelMileage = {
    label: "Reisekosten: Fahrtkosten (Pkw-Kilometerpauschale)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  categoryBuckets.CommuteExpense = {
    label: "Fahrten Wohnung / 1. T\xE4tigkeitsst\xE4tte (Pendler)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0
  };
  let totalTripExpensesNet = 0;
  let totalTripExpensesTax = 0;
  let totalTripExpensesGross = 0;
  for (const te of tripExpensesResults) {
    const net = Number(te.amount_net) || 0;
    const tax = Number(te.tax_amount) || 0;
    const gross = Number(te.amount_gross) || net + tax;
    const taxRate = Number(te.tax_rate) || 0;
    if (taxRate === 19) {
      inputTax19 += tax;
    } else if (taxRate === 7) {
      inputTax7 += tax;
    }
    totalTripExpensesNet += net;
    totalTripExpensesTax += tax;
    totalTripExpensesGross += gross;
    let catKey = "TravelIncidentals";
    if (te.category === "HotelLogis") {
      catKey = "TravelLodging";
    } else if (["TransitLocal", "TrainLongDistance", "Flight", "Train"].includes(te.category)) {
      catKey = "TravelTransport";
    } else if (["TaxiLocal", "TollParking", "RentalCar"].includes(te.category)) {
      catKey = "TravelIncidentals";
    } else {
      catKey = "TravelOther";
    }
    categoryBuckets[catKey].count++;
    categoryBuckets[catKey].net += net;
    categoryBuckets[catKey].deductible_net += net;
    categoryBuckets[catKey].tax += tax;
    categoryBuckets[catKey].gross += gross;
  }
  let businessTripKm = 0;
  let businessTripMileageCost = 0;
  let businessTripVma = 0;
  let businessTripCount = 0;
  let commuteTripKm = 0;
  let commuteTripCost = 0;
  let commuteTripCount = 0;
  const tripsList = (tripResults || []).map((tr) => {
    const isCommute = tr.travel_type === "PermanentWorkplace" || tr.expense_type === "PermanentWorkplace";
    const dist = Number(tr.distance_km) || 0;
    const rate = Number(tr.rate_per_km) || (isCommute ? dist > 20 ? 0.38 : 0.3 : 0.3);
    const vma = isCommute ? 0 : Number(tr.vma_amount) || 0;
    let mileageCost = 0;
    if (tr.expense_type === "PersonalCar" || isCommute) {
      mileageCost = Number((dist * rate).toFixed(2));
    }
    let directTicketCost = 0;
    if (tr.calculated_travel_cost !== void 0 && tr.calculated_travel_cost !== null) {
      directTicketCost = Number(tr.calculated_travel_cost);
    } else if (tr.ticket_cost && tr.expense_type !== "PersonalCar") {
      directTicketCost = Number(tr.ticket_cost);
    }
    const baseTravelCost = Number((mileageCost + directTicketCost).toFixed(2));
    const otherCost = (Number(tr.hotel_cost) || 0) + (Number(tr.parking_cost) || 0);
    const trExpenses = tripExpensesResults.filter((e) => e.trip_id === tr.id);
    const trExpensesNet = trExpenses.reduce((s, e) => s + (Number(e.amount_net) || 0), 0);
    const trExpensesTax = trExpenses.reduce((s, e) => s + (Number(e.tax_amount) || 0), 0);
    const trExpensesGross = trExpenses.reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
    const totalCost = Number((baseTravelCost + vma + otherCost + trExpensesNet).toFixed(2));
    const trLegs = tripLegsResults.filter((l) => l.trip_id === tr.id);
    let routeDisplay = "";
    let destDisplay = tr.destination || tr.destination_address || "-";
    let returnLocation = tr.return_location || tr.origin || "-";
    function cleanCity(loc) {
      if (!loc)
        return "";
      return loc.split(",")[0].trim();
    }
    __name(cleanCity, "cleanCity");
    if (trLegs.length > 0) {
      const stops = [];
      const destCities = [];
      const firstCity = cleanCity(trLegs[0].start_location);
      const lastCity = cleanCity(trLegs[trLegs.length - 1].destination_location);
      trLegs.forEach((leg, idx) => {
        const sCity = cleanCity(leg.start_location);
        const dCity = cleanCity(leg.destination_location);
        if (idx === 0 && sCity)
          stops.push(sCity);
        if (dCity && (stops.length === 0 || stops[stops.length - 1] !== dCity)) {
          stops.push(dCity);
        }
        if (dCity && dCity !== firstCity && dCity !== lastCity && !destCities.includes(dCity)) {
          destCities.push(dCity);
        }
      });
      routeDisplay = stops.join(" \u2794 ");
      if (destCities.length > 0) {
        destDisplay = destCities.join(", ");
      } else if (tr.destination && tr.destination !== tr.origin) {
        destDisplay = tr.destination;
      }
      returnLocation = trLegs[trLegs.length - 1].destination_location || tr.origin;
    } else if (tr.is_round_trip || tr.travel_type === "BusinessTrip") {
      const orig = (tr.origin || "").trim();
      const dst = (tr.destination || tr.destination_address || "").trim();
      if (dst && dst !== orig) {
        routeDisplay = `${orig} \u2794 ${dst} \u2794 ${orig}`;
        destDisplay = dst;
      } else {
        routeDisplay = orig ? `${orig} (Rundfahrt)` : "-";
      }
    } else {
      routeDisplay = `${tr.origin} \u2794 ${tr.destination || "-"}`;
    }
    if (isCommute) {
      commuteTripCount++;
      commuteTripKm += dist;
      commuteTripCost += baseTravelCost;
    } else {
      businessTripCount++;
      if (tr.expense_type === "PersonalCar") {
        businessTripKm += dist;
      }
      businessTripMileageCost += mileageCost;
      businessTripVma += vma;
    }
    return {
      id: tr.id,
      trip_date: tr.trip_date,
      return_date: tr.return_date || tr.trip_date,
      is_commute: isCommute,
      travel_type: isCommute ? "PermanentWorkplace" : "BusinessTrip",
      travel_type_label: isCommute ? "Erste Betriebsst\xE4tte (Pendler)" : "Ausw\xE4rtst\xE4tigkeit / Dienstreise",
      customer_name: tr.customer_name || "-",
      project_name: tr.project_name || "-",
      project_number: tr.project_number || "-",
      purpose: tr.purpose || "-",
      origin: tr.origin || tr.origin_location || "-",
      destination: destDisplay,
      return_location: returnLocation,
      route_display: routeDisplay,
      legs_count: trLegs.length,
      legs: trLegs.map((l) => ({
        id: l.id,
        leg_order: l.leg_order,
        date_leg: l.date_leg,
        start_location: l.start_location,
        destination_location: l.destination_location,
        transport_type: l.transport_type,
        distance_km: l.distance_km,
        rate_per_km: l.rate_per_km,
        travel_cost_net: l.travel_cost_net,
        layover_hours: l.layover_hours,
        layover_purpose: l.layover_purpose
      })),
      distance_km: dist,
      rate_per_km: rate,
      travel_cost: baseTravelCost,
      vma_amount: vma,
      other_cost: otherCost,
      expenses_net: Number(trExpensesNet.toFixed(2)),
      expenses_tax: Number(trExpensesTax.toFixed(2)),
      expenses_gross: Number(trExpensesGross.toFixed(2)),
      expenses_count: trExpenses.length,
      total_cost: totalCost,
      expense_type: tr.expense_type || "PersonalCar"
    };
  });
  if (businessTripVma > 0) {
    categoryBuckets.TravelVma.count = businessTripCount;
    categoryBuckets.TravelVma.net = Number(businessTripVma.toFixed(2));
    categoryBuckets.TravelVma.deductible_net = Number(businessTripVma.toFixed(2));
    categoryBuckets.TravelVma.gross = Number(businessTripVma.toFixed(2));
  }
  if (businessTripMileageCost > 0) {
    categoryBuckets.TravelMileage.count = businessTripCount;
    categoryBuckets.TravelMileage.net = Number(businessTripMileageCost.toFixed(2));
    categoryBuckets.TravelMileage.deductible_net = Number(businessTripMileageCost.toFixed(2));
    categoryBuckets.TravelMileage.gross = Number(businessTripMileageCost.toFixed(2));
  }
  if (commuteTripCost > 0) {
    categoryBuckets.CommuteExpense.count = commuteTripCount;
    categoryBuckets.CommuteExpense.net = Number(commuteTripCost.toFixed(2));
    categoryBuckets.CommuteExpense.deductible_net = Number(commuteTripCost.toFixed(2));
    categoryBuckets.CommuteExpense.gross = Number(commuteTripCost.toFixed(2));
  }
  const totalTravelDeductible = Number(
    (businessTripMileageCost + businessTripVma + commuteTripCost + totalTripExpensesNet).toFixed(2)
  );
  const totalExpensesDeductible = Number(
    (totalVouchersDeductibleNet + totalTravelDeductible).toFixed(2)
  );
  const totalInputTax = Number((totalVouchersTax + totalTripExpensesTax).toFixed(2));
  const vatBalance = Number((totalRevenueTax - totalInputTax).toFixed(2));
  const preliminaryProfitEuer = Number((totalRevenueNet - totalExpensesDeductible).toFixed(2));
  return jsonResponse({
    success: true,
    period: {
      year,
      month,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null
    },
    tax_mode: taxMode,
    totals: {
      revenue_net: Number(totalRevenueNet.toFixed(2)),
      revenue_tax: Number(totalRevenueTax.toFixed(2)),
      revenue_gross: Number((totalRevenueNet + totalRevenueTax).toFixed(2)),
      elster_kz_81_base: Number(totalRevenueNet.toFixed(2)),
      elster_kz_81_tax: Number(totalRevenueTax.toFixed(2)),
      elster_kz_66_input_tax: totalInputTax,
      input_tax_19: Number(inputTax19.toFixed(2)),
      input_tax_7: Number(inputTax7.toFixed(2)),
      vat_balance: vatBalance,
      business_trip_count: businessTripCount,
      business_trip_km: businessTripKm,
      business_trip_cost: Number((businessTripMileageCost + totalTripExpensesNet).toFixed(2)),
      business_trip_vma: Number(businessTripVma.toFixed(2)),
      business_trip_total: Number(
        (businessTripMileageCost + businessTripVma + totalTripExpensesNet).toFixed(2)
      ),
      commute_trip_count: commuteTripCount,
      commute_trip_km: commuteTripKm,
      commute_trip_cost: Number(commuteTripCost.toFixed(2)),
      travel_total_deductible: totalTravelDeductible,
      vouchers_net: Number(totalVouchersNet.toFixed(2)),
      vouchers_deductible_net: Number(totalVouchersDeductibleNet.toFixed(2)),
      vouchers_non_deductible_net: Number(totalVouchersNonDeductibleNet.toFixed(2)),
      vouchers_gross: Number(totalVouchersGross.toFixed(2)),
      total_expenses_deductible: totalExpensesDeductible,
      preliminary_profit_euer: preliminaryProfitEuer
    },
    categories: categoryBuckets,
    timesheets: timesheetList,
    vouchers: voucherList,
    trips: tripsList,
    trip_expenses: tripExpensesResults.map((e) => ({
      id: e.id,
      trip_id: e.trip_id,
      expense_date: e.expense_date,
      category: e.category,
      description: e.description,
      skr04_account: e.skr04_account,
      amount_net: Number(e.amount_net) || 0,
      tax_rate: Number(e.tax_rate) || 0,
      tax_amount: Number(e.tax_amount) || 0,
      amount_gross: Number(e.amount_gross) || 0,
      receipt_filename: e.receipt_filename || null,
      is_billable_to_client: e.is_billable_to_client === 1
    }))
  });
}
__name(getTaxReportSummary, "getTaxReportSummary");
async function exportDatevExtf(request, env2) {
  await ensureSettings(env2);
  const body = await request.json() || {};
  const { customerId, projectId, year, month } = body;
  const settings = await env2.DB.prepare(
    "SELECT * FROM app_settings WHERE id = 'global_config'"
  ).first() || {};
  const chart = settings.chart_of_accounts || "SKR04";
  const isSkr03 = chart === "SKR03";
  const isSmallBiz = settings.tax_mode === "small_business";
  const consultantNum = settings.datev_consultant_number || "1001";
  const clientNum = settings.datev_client_number || "10001";
  let timeSql = `
    SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.external_invoice_number, tv.data_hash_sha256
    FROM time_entries t
    JOIN projects p ON t.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const timeParams = [];
  if (customerId && customerId !== "all") {
    timeSql += " AND p.customer_id = ?";
    timeParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    timeSql += " AND t.project_id = ?";
    timeParams.push(projectId);
  }
  if (year && year !== "all") {
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${mFilter}%`);
  }
  timeSql += " ORDER BY t.entry_date ASC";
  let stmt = env2.DB.prepare(timeSql);
  if (timeParams.length > 0)
    stmt = stmt.bind(...timeParams);
  const { results: timeEntries } = await stmt.all();
  let expSql = `
    SELECT te.*, tr.trip_date, tr.purpose as trip_purpose,
           p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number,
           tv.period, tv.lexware_invoice_number, tv.external_invoice_number
    FROM trip_expenses te
    JOIN trips tr ON te.trip_id = tr.id
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
    WHERE (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
  `;
  const expParams = [];
  if (customerId && customerId !== "all") {
    expSql += " AND p.customer_id = ?";
    expParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    expSql += " AND tr.project_id = ?";
    expParams.push(projectId);
  }
  if (year && year !== "all") {
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${year}%`, `${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${mFilter}%`, `${mFilter}%`);
  }
  expSql += " ORDER BY te.expense_date ASC";
  let expStmt = env2.DB.prepare(expSql);
  if (expParams.length > 0)
    expStmt = expStmt.bind(...expParams);
  const { results: expenses } = await expStmt.all();
  const now = /* @__PURE__ */ new Date();
  const yyyymmdd = now.toISOString().replace(/[-:T]/g, "").substring(0, 14);
  const curYear = year && year !== "all" ? year : now.getFullYear().toString();
  const yearStart = `${curYear}0101`;
  const periodStart = year && month && year !== "all" && month !== "all" ? `${year}${month.padStart(2, "0")}01` : `${curYear}0101`;
  const periodEnd = year && month && year !== "all" && month !== "all" ? `${year}${month.padStart(2, "0")}28` : `${curYear}1231`;
  let datevCsv = `"EXTF";700;21;"Buchungsstapel";12;${yyyymmdd}000;"";"";"";"";${consultantNum};${clientNum};${yearStart};4;${periodStart};${periodEnd};"Evidence Hub DATEV Export";"MK";1;;;"EUR";;;;
`;
  datevCsv += `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schl\xFCssel)";"BU-Schl\xFCssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext"
`;
  const fmtAmt = /* @__PURE__ */ __name((num) => num.toFixed(2).replace(".", ","), "fmtAmt");
  const fmtDate = /* @__PURE__ */ __name((dStr) => {
    if (!dStr)
      return "";
    const clean = dStr.substring(0, 10).replace(/-/g, "");
    return clean.length === 8 ? `${clean.substring(6, 8)}${clean.substring(4, 6)}` : "";
  }, "fmtDate");
  const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').substring(0, 60)}"`, "sanitize");
  for (const t of timeEntries || []) {
    const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
    const hours = t.billable_duration_hours || 0;
    const totalNet = hours * rate;
    if (totalNet <= 0)
      continue;
    const kontoErl\u00F6s = isSmallBiz ? isSkr03 ? "8195" : "4185" : isSkr03 ? "8400" : "4400";
    const debitor = t.customer_number || (isSkr03 ? "10000" : "10000");
    const invNum = t.lexware_invoice_number || t.external_invoice_number || `TS-${t.period || "2026"}`;
    const txt = `${t.customer_name || "Kunde"}: ${t.project_name || "Projekt"}`;
    datevCsv += `${fmtAmt(totalNet)};"S";"EUR";"";"";"";"${debitor}";"${kontoErl\u00F6s}";"";"${fmtDate(t.entry_date)}";${sanitize(invNum)};"";"";${sanitize(txt)}
`;
  }
  for (const exp of expenses || []) {
    const gross = exp.amount_gross || 0;
    if (gross <= 0)
      continue;
    let aufwandKonto = isSkr03 ? "4670" : "6670";
    if (exp.category === "HotelLogis")
      aufwandKonto = isSkr03 ? "4670" : "6670";
    else if (exp.category === "TransitLocal" || exp.category === "TrainLongDistance")
      aufwandKonto = isSkr03 ? "4673" : "6673";
    const gegenKonto = isSkr03 ? "1200" : "1800";
    const voucherNum = `EXP-${exp.id ? exp.id.substring(0, 6).toUpperCase() : "BELEG"}`;
    const txt = `${exp.category}: ${exp.description || exp.trip_purpose || "Reisebeleg"}`;
    datevCsv += `${fmtAmt(gross)};"S";"EUR";"";"";"";"${aufwandKonto}";"${gegenKonto}";"";"${fmtDate(exp.expense_date || exp.trip_date)}";${sanitize(voucherNum)};"";"";${sanitize(txt)}
`;
  }
  const filename = `DATEV_EXTF700_Buchungsstapel_${year || "ALL"}_${month || "ALL"}.csv`;
  return new Response("\uFEFF" + datevCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(exportDatevExtf, "exportDatevExtf");
async function exportLexwareCsv(request, env2) {
  await ensureSettings(env2);
  const body = await request.json() || {};
  const { customerId, projectId, year, month } = body;
  const settings = await env2.DB.prepare(
    "SELECT * FROM app_settings WHERE id = 'global_config'"
  ).first() || {};
  const isSmallBiz = settings.tax_mode === "small_business";
  let timeSql = `
    SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.external_invoice_number, tv.data_hash_sha256
    FROM time_entries t
    JOIN projects p ON t.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const timeParams = [];
  if (customerId && customerId !== "all") {
    timeSql += " AND p.customer_id = ?";
    timeParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    timeSql += " AND t.project_id = ?";
    timeParams.push(projectId);
  }
  if (year && year !== "all") {
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${mFilter}%`);
  }
  timeSql += " ORDER BY t.entry_date ASC";
  let stmt = env2.DB.prepare(timeSql);
  if (timeParams.length > 0)
    stmt = stmt.bind(...timeParams);
  const { results: timeEntries } = await stmt.all();
  let expSql = `
    SELECT te.*, tr.trip_date, tr.purpose as trip_purpose,
           p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number,
           tv.period, tv.lexware_invoice_number, tv.external_invoice_number
    FROM trip_expenses te
    JOIN trips tr ON te.trip_id = tr.id
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
    WHERE (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
  `;
  const expParams = [];
  if (customerId && customerId !== "all") {
    expSql += " AND p.customer_id = ?";
    expParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    expSql += " AND tr.project_id = ?";
    expParams.push(projectId);
  }
  if (year && year !== "all") {
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${year}%`, `${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${mFilter}%`, `${mFilter}%`);
  }
  expSql += " ORDER BY te.expense_date ASC";
  let expStmt = env2.DB.prepare(expSql);
  if (expParams.length > 0)
    expStmt = expStmt.bind(...expParams);
  const { results: expenses } = await expStmt.all();
  let lexwareCsv = "\uFEFF";
  lexwareCsv += "Belegart;Belegdatum;Belegnummer;Kunde_Lieferant;Kategorie_Konto;Nettobetrag;Steuersatz;Umsatzsteuer;Bruttobetrag;Zahlungsstatus;Beschreibung;GoBD_Hash\n";
  const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`, "sanitize");
  for (const t of timeEntries || []) {
    const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
    const hours = t.billable_duration_hours || 0;
    const totalNet = hours * rate;
    if (totalNet <= 0)
      continue;
    const taxRate = isSmallBiz ? 0 : 19;
    const taxAmt = isSmallBiz ? 0 : totalNet * 0.19;
    const totalGross = totalNet + taxAmt;
    const invNum = t.lexware_invoice_number || t.external_invoice_number || `TS-${t.period || "2026"}`;
    lexwareCsv += [
      "Einnahme",
      sanitize(t.entry_date),
      sanitize(invNum),
      sanitize(t.customer_name),
      isSmallBiz ? "Erl\xF6se Kleinunternehmer \xA7 19 UStG" : "Erl\xF6se Dienstleistungen 19%",
      totalNet.toFixed(2).replace(".", ","),
      `${taxRate}%`,
      taxAmt.toFixed(2).replace(".", ","),
      totalGross.toFixed(2).replace(".", ","),
      "Offen",
      sanitize(`Stundenabrechnung ${t.project_name}: ${t.short_description || ""}`),
      sanitize(t.data_hash_sha256 || "")
    ].join(";") + "\n";
  }
  for (const exp of expenses || []) {
    const gross = exp.amount_gross || 0;
    const net = exp.amount_net || gross;
    const taxAmt = exp.tax_amount || gross - net;
    const taxRate = exp.tax_rate !== void 0 ? exp.tax_rate : 19;
    const voucherNum = `EXP-${exp.id ? exp.id.substring(0, 8).toUpperCase() : "REISE"}`;
    lexwareCsv += [
      "Ausgabe",
      sanitize(exp.expense_date || exp.trip_date),
      sanitize(voucherNum),
      sanitize(exp.customer_name || "Lieferant"),
      sanitize(exp.category || "Reisekosten"),
      net.toFixed(2).replace(".", ","),
      `${taxRate}%`,
      taxAmt.toFixed(2).replace(".", ","),
      gross.toFixed(2).replace(".", ","),
      "Bezahlt",
      sanitize(`${exp.category}: ${exp.description || exp.trip_purpose || ""}`),
      ""
    ].join(";") + "\n";
  }
  const filename = `Lexware_Offline_Belege_${year || "ALL"}_${month || "ALL"}.csv`;
  return new Response(lexwareCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(exportLexwareCsv, "exportLexwareCsv");
async function exportAccountingData(request, env2) {
  const body = await request.json() || {};
  const { customerId, projectId, year, month, format = "csv" } = body;
  let timeSql = `
    SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.data_hash_sha256
    FROM time_entries t
    JOIN projects p ON t.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const timeParams = [];
  if (customerId && customerId !== "all") {
    timeSql += " AND p.customer_id = ?";
    timeParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    timeSql += " AND t.project_id = ?";
    timeParams.push(projectId);
  }
  if (year && year !== "all") {
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${mFilter}%`);
  }
  timeSql += " ORDER BY t.entry_date ASC, t.start_time ASC";
  let stmt = env2.DB.prepare(timeSql);
  if (timeParams.length > 0)
    stmt = stmt.bind(...timeParams);
  const { results: timeEntries } = await stmt.all();
  let tripSql = `
    SELECT tr.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.data_hash_sha256
    FROM trips tr
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const tripParams = [];
  if (customerId && customerId !== "all") {
    tripSql += " AND p.customer_id = ?";
    tripParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tripSql += " AND tr.project_id = ?";
    tripParams.push(projectId);
  }
  if (year && year !== "all") {
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${mFilter}%`);
  }
  tripSql += " ORDER BY tr.trip_date ASC";
  let tripStmt = env2.DB.prepare(tripSql);
  if (tripParams.length > 0)
    tripStmt = tripStmt.bind(...tripParams);
  const { results: trips } = await tripStmt.all();
  if (format === "json") {
    return jsonResponse({
      success: true,
      filter: { customerId, projectId, year, month },
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      timeEntries: timeEntries || [],
      trips: trips || []
    });
  }
  let csv = "\uFEFF";
  csv += "Belegtyp;Buchungsdatum;Kunde;Kundennummer;Projekt;Projektnummer;T\xE4tigkeit / Reisezweck;Stunden;Stundensatz (Netto);Reisekosten (Netto);Gesamtbetrag (Netto);Abrechenbar;Abrechnungsmonat;Status (GoBD);Lexware-Rechnungsnr;GoBD-Hash\n";
  const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`, "sanitize");
  for (const t of timeEntries || []) {
    const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
    const hours = t.billable_duration_hours || 0;
    const totalNet = hours * rate;
    csv += [
      "ZEITERFASSUNG",
      sanitize(t.entry_date),
      sanitize(t.customer_name),
      sanitize(t.customer_number || ""),
      sanitize(t.project_name),
      sanitize(t.project_number),
      sanitize(t.short_description || ""),
      hours.toFixed(2).replace(".", ","),
      rate.toFixed(2).replace(".", ","),
      "0,00",
      totalNet.toFixed(2).replace(".", ","),
      t.is_billable ? "JA" : "NEIN",
      sanitize(t.period || ""),
      sanitize(t.timesheet_status || "Offen"),
      sanitize(t.lexware_invoice_number || ""),
      sanitize(t.data_hash_sha256 || "")
    ].join(";") + "\n";
  }
  for (const tr of trips || []) {
    const travelCost = tr.customer_reimbursable_cost || tr.distance_km * tr.rate_per_km || tr.total_actual_cost || 0;
    csv += [
      "REISEKOSTEN",
      sanitize(tr.trip_date),
      sanitize(tr.customer_name),
      sanitize(tr.customer_number || ""),
      sanitize(tr.project_name),
      sanitize(tr.project_number),
      sanitize(
        tr.purpose + (tr.origin_location ? ` (${tr.origin_location} -> ${tr.destination_location})` : "")
      ),
      "0,00",
      "0,00",
      travelCost.toFixed(2).replace(".", ","),
      travelCost.toFixed(2).replace(".", ","),
      "JA",
      sanitize(tr.period || ""),
      sanitize(tr.timesheet_status || "Offen"),
      sanitize(tr.lexware_invoice_number || ""),
      sanitize(tr.data_hash_sha256 || "")
    ].join(";") + "\n";
  }
  const filename = `Buchungsjournal_${year || "ALL"}_${month || "ALL"}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(exportAccountingData, "exportAccountingData");
async function exportTimesheetManifest(request, env2) {
  const body = await request.json() || {};
  const { customerId, projectId, year, month } = body;
  let sql = `
    SELECT tv.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number
    FROM timesheet_versions tv
    JOIN projects p ON tv.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (customerId && customerId !== "all") {
    sql += " AND p.customer_id = ?";
    params.push(customerId);
  }
  if (projectId && projectId !== "all") {
    sql += " AND tv.project_id = ?";
    params.push(projectId);
  }
  if (year && year !== "all") {
    sql += " AND tv.period LIKE ?";
    params.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    sql += " AND tv.period LIKE ?";
    params.push(`${mFilter}%`);
  }
  sql += " ORDER BY tv.period DESC, tv.created_at_utc DESC";
  let stmt = env2.DB.prepare(sql);
  if (params.length > 0)
    stmt = stmt.bind(...params);
  const { results } = await stmt.all();
  return jsonResponse({
    success: true,
    timesheets: results || []
  });
}
__name(exportTimesheetManifest, "exportTimesheetManifest");
async function exportTaxReceiptsManifest(request, env2) {
  const body = await request.json() || {};
  const { customerId, projectId, year, month } = body;
  let sql = `
    SELECT te.id, te.receipt_filename as original_filename, te.receipt_r2_key as r2_key,
           te.amount_gross, te.amount_net, te.tax_rate as vat_rate, te.expense_date,
           te.created_at_utc as uploaded_at_utc,
           te.description, te.category,
           p.name as project_name, p.project_number,
           c.name as customer_name
    FROM trip_expenses te
    JOIN trips tr ON te.trip_id = tr.id
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE te.receipt_r2_key IS NOT NULL
  `;
  const params = [];
  if (customerId && customerId !== "all") {
    sql += " AND p.customer_id = ?";
    params.push(customerId);
  }
  if (projectId && projectId !== "all") {
    sql += " AND tr.project_id = ?";
    params.push(projectId);
  }
  if (year && year !== "all") {
    sql += " AND te.expense_date LIKE ?";
    params.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    sql += " AND te.expense_date LIKE ?";
    params.push(`${mFilter}%`);
  }
  let stmt = env2.DB.prepare(sql);
  if (params.length > 0)
    stmt = stmt.bind(...params);
  const { results: tripReceipts } = await stmt.all();
  let operationalReceipts = [];
  try {
    let opSql = `
      SELECT ov.id, ov.receipt_filename as original_filename, ov.receipt_r2_key as r2_key,
             ov.amount_gross, ov.amount_net, ov.tax_rate as vat_rate, ov.voucher_date as expense_date,
             ov.created_at_utc as uploaded_at_utc,
             ov.description, ov.voucher_type as category,
             p.name as project_name, p.project_number,
             c.name as customer_name
      FROM operational_vouchers ov
      LEFT JOIN projects p ON ov.project_id = p.id
      LEFT JOIN customers c ON ov.customer_id = c.id
      WHERE ov.receipt_r2_key IS NOT NULL
    `;
    const opParams = [];
    if (customerId && customerId !== "all") {
      opSql += " AND ov.customer_id = ?";
      opParams.push(customerId);
    }
    if (projectId && projectId !== "all") {
      opSql += " AND ov.project_id = ?";
      opParams.push(projectId);
    }
    if (year && year !== "all") {
      opSql += " AND ov.voucher_date LIKE ?";
      opParams.push(`${year}%`);
    }
    if (month && month !== "all") {
      const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
      opSql += " AND ov.voucher_date LIKE ?";
      opParams.push(`${mFilter}%`);
    }
    let opStmt = env2.DB.prepare(opSql);
    if (opParams.length > 0)
      opStmt = opStmt.bind(...opParams);
    const { results: opResults } = await opStmt.all();
    operationalReceipts = opResults || [];
  } catch {
  }
  const receipts = [...tripReceipts || [], ...operationalReceipts];
  let tsSql = `
    SELECT tv.id, tv.period, tv.version_number, tv.signed_document_r2_key, tv.signed_document_filename,
           p.name as project_name, p.project_number,
           c.name as customer_name
    FROM timesheet_versions tv
    JOIN projects p ON tv.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE tv.signed_document_r2_key IS NOT NULL
  `;
  const tsParams = [];
  if (customerId && customerId !== "all") {
    tsSql += " AND p.customer_id = ?";
    tsParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tsSql += " AND tv.project_id = ?";
    tsParams.push(projectId);
  }
  if (year && year !== "all") {
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${mFilter}%`);
  }
  let tsStmt = env2.DB.prepare(tsSql);
  if (tsParams.length > 0)
    tsStmt = tsStmt.bind(...tsParams);
  const { results: signedDocs } = await tsStmt.all();
  return jsonResponse({
    success: true,
    receipts,
    signedDocs: signedDocs || []
  });
}
__name(exportTaxReceiptsManifest, "exportTaxReceiptsManifest");
async function downloadReceiptFile(id, env2) {
  const storage = env2.STORAGE || env2.DOCUMENTS_BUCKET;
  if (!storage) {
    return errorResponse("Object Storage nicht konfiguriert", 500);
  }
  let r2Key = null;
  let filename = "beleg.pdf";
  let mimeType = "application/pdf";
  try {
    const exp = await env2.DB.prepare(
      "SELECT receipt_r2_key, receipt_filename, receipt_mime_type FROM trip_expenses WHERE id = ?"
    ).bind(id).first();
    if (exp && exp.receipt_r2_key) {
      r2Key = exp.receipt_r2_key;
      filename = exp.receipt_filename || filename;
      mimeType = exp.receipt_mime_type || mimeType;
    }
  } catch {
  }
  if (!r2Key) {
    try {
      const v = await env2.DB.prepare(
        "SELECT receipt_r2_key, receipt_filename, receipt_mime_type, payment_slip_r2_key, payment_slip_filename FROM operational_vouchers WHERE id = ?"
      ).bind(id).first();
      if (v) {
        if (v.receipt_r2_key) {
          r2Key = v.receipt_r2_key;
          filename = v.receipt_filename || filename;
          mimeType = v.receipt_mime_type || mimeType;
        } else if (v.payment_slip_r2_key) {
          r2Key = v.payment_slip_r2_key;
          filename = v.payment_slip_filename || filename;
        }
      }
    } catch {
    }
  }
  if (!r2Key && (id.includes("/") || id.startsWith("rec_") || id.startsWith("vouchers/"))) {
    r2Key = id;
  }
  if (!r2Key) {
    return errorResponse("Beleg-Referenz f\xFCr ID '" + id + "' nicht gefunden.", 404);
  }
  let obj = await storage.get(r2Key);
  if (!obj && env2.DOCUMENTS_BUCKET && env2.STORAGE) {
    obj = await env2.DOCUMENTS_BUCKET.get(r2Key);
  }
  if (!obj) {
    return errorResponse("Belegdatei nicht im Object Storage (R2) vorhanden.", 404);
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", mimeType);
  }
  const cleanFilename = filename.replace(/[^\w.-]/g, "_");
  headers.set("Content-Disposition", `attachment; filename="${cleanFilename}"`);
  return new Response(obj.body, { headers });
}
__name(downloadReceiptFile, "downloadReceiptFile");

// src/services/gobd_vault.service.ts
async function getAuditLogsAndSeals(env2) {
  const { results: logs } = await env2.DB.prepare(
    "SELECT * FROM audit_events ORDER BY timestamp_utc DESC LIMIT 200"
  ).all();
  const { results: seals } = await env2.DB.prepare(
    "SELECT * FROM monthly_archive_seals ORDER BY period DESC"
  ).all();
  return jsonResponse({ logs, seals });
}
__name(getAuditLogsAndSeals, "getAuditLogsAndSeals");
async function requestAuditResetOtp(env2) {
  const settings = await env2.DB.prepare(
    "SELECT email_sender_email, email_sender_name FROM app_settings WHERE id = 'global_config'"
  ).first();
  const recipientEmail = settings?.email_sender_email || "admin@example.com";
  const senderName = settings?.email_sender_name || "ActaNex Security Vault";
  const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
  const otpHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env2.DB.prepare(`
    INSERT INTO otp_verifications (id, timesheet_id, email, otp_code_hash, expires_at_utc, attempts, is_verified, created_at_utc)
    VALUES (?, 'SYSTEM_AUDIT_RESET', ?, ?, ?, 0, 0, ?)
  `).bind(crypto.randomUUID(), recipientEmail, otpHash, expiresAt, now).run();
  const mailSubject = `Sicherheitscode f\xFCr Testdaten- und Protokoll-Reset`;
  const mailText = `Guten Tag,

Sie haben die Bereinigung der Testdaten und Audit-Protokolle im Freelancer Evidence & Billing Hub initiiert.

Ihr 6-stelliger Best\xE4tigungscode (2FA / OTP) lautet:

\u{1F449}  ${otpCode}  \u{1F448}

Dieser Code ist 15 Minuten g\xFCltig.
Falls Sie diese Aktion nicht veranlasst haben, ignorieren Sie bitte diese E-Mail.

Mit freundlichen Gr\xFC\xDFen,
${senderName}`;
  await sendSystemEmail(env2, {
    to: recipientEmail,
    subject: mailSubject,
    text: mailText
  });
  await logAuditEvent(env2, {
    eventType: "AUDIT_RESET_OTP_REQUESTED",
    entityType: "system",
    entityId: "audit_log",
    actor: recipientEmail,
    description: `2FA-Sicherheitscode f\xFCr Testdaten- und Protokoll-Reset an '${recipientEmail}' versendet.`
  });
  const masked = recipientEmail.replace(
    /^(.)(.*)(@.*)$/,
    (_m, c1, c2, c3) => c1 + "*".repeat(Math.max(c2.length, 3)) + c3
  );
  return jsonResponse({
    success: true,
    message: `Ein 6-stelliger Sicherheitscode wurde an ${masked} gesendet.`
  });
}
__name(requestAuditResetOtp, "requestAuditResetOtp");
async function sealMonthArchive(period, env2) {
  if (!period)
    return errorResponse("period (YYYY-MM) erforderlich", 400);
  const existingSeal = await env2.DB.prepare(
    "SELECT * FROM monthly_archive_seals WHERE period = ?"
  ).bind(period).first();
  if (existingSeal) {
    return errorResponse(
      `Der Monat ${period} wurde bereits am ${existingSeal.sealed_at_utc} unver\xE4nderbar versiegelt.`,
      400
    );
  }
  const { results: monthEvents } = await env2.DB.prepare(
    "SELECT * FROM audit_events WHERE timestamp_utc LIKE ?"
  ).bind(`${period}%`).all();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let currentHash = "0000000000000000000000000000000000000000000000000000000000000000";
  if (monthEvents && monthEvents.length > 0) {
    const sortedEvents = monthEvents.slice().sort(
      (a, b) => String(a.timestamp_utc).localeCompare(String(b.timestamp_utc)) || String(a.id).localeCompare(String(b.id))
    );
    for (const ev of sortedEvents) {
      const evData = `${ev.id}|${ev.timestamp_utc}|${ev.event_type}|${ev.entity_type}|${ev.entity_id}|${ev.actor || ""}|${ev.description || ""}|${ev.data_payload_json || ""}|${currentHash}`;
      const hBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(evData));
      currentHash = Array.from(new Uint8Array(hBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  const rootHash = `SHA256_${currentHash}`;
  const sealId = `seal_${period.replace("-", "_")}_${Date.now()}`;
  await env2.DB.prepare(`
    INSERT INTO monthly_archive_seals (id, period, sealed_at_utc, sealed_by, total_events_count, merkle_root_hash, is_locked)
    VALUES (?, ?, ?, 'GoBD AutoSealer', ?, ?, 1)
  `).bind(sealId, period, now, monthEvents.length, rootHash).run();
  await logAuditEvent(env2, {
    eventType: "MONTHLY_ARCHIVE_SEALED",
    entityType: "monthly_seal",
    entityId: sealId,
    actor: "Admin / GoBD Sealer",
    description: `Monat ${period} wurde schreibgesch\xFCtzt archiviert mit ${monthEvents.length} Audit-Events (Merkle Hash: ${rootHash}).`
  });
  return jsonResponse({
    success: true,
    sealId,
    period,
    sealedAt: now,
    eventsCount: monthEvents.length,
    rootHash,
    message: `Monat ${period} wurde erfolgreich mit kryptografischem SHA-256 Hash versiegelt und schreibgesch\xFCtzt archiviert.`
  });
}
__name(sealMonthArchive, "sealMonthArchive");
async function generateDisasterRecoverySqlDump(env2) {
  let tables = [];
  try {
    const { results: dbTables } = await env2.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
    ).all();
    if (dbTables && dbTables.length > 0) {
      const priority = [
        "app_settings",
        "users",
        "customers",
        "projects",
        "trips",
        "timesheet_versions"
      ];
      const discovered = dbTables.map((t) => t.name);
      tables = [
        ...priority.filter((p) => discovered.includes(p)),
        ...discovered.filter((d) => !priority.includes(d))
      ];
    }
  } catch {
    tables = [
      "app_settings",
      "users",
      "customers",
      "projects",
      "time_entries",
      "trips",
      "trip_segments",
      "trip_expenses",
      "trip_legs",
      "receipts",
      "operational_vouchers",
      "timesheet_versions",
      "approvals",
      "billing_batches",
      "signed_documents",
      "project_vouchers",
      "otp_verifications",
      "monthly_archive_seals",
      "audit_events"
    ];
  }
  let sqlDump = `-- ========================================================
`;
  sqlDump += `-- FREELANCER EVIDENCE & BILLING HUB - DISASTER RECOVERY DUMP
`;
  sqlDump += `-- Exported at: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
  sqlDump += `-- Compatible with SQLite 3 / Cloudflare D1 / PostgreSQL
`;
  sqlDump += `-- ========================================================

`;
  sqlDump += `PRAGMA foreign_keys = OFF;

`;
  for (const table3 of tables) {
    try {
      const schemaRow = await env2.DB.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?"
      ).bind(table3).first();
      const { results } = await env2.DB.prepare(`SELECT * FROM ${table3}`).all();
      if (schemaRow && schemaRow.sql || results && results.length > 0) {
        sqlDump += `-- --------------------------------------------------------
`;
        sqlDump += `-- Table: ${table3} (${results ? results.length : 0} rows)
`;
        sqlDump += `-- --------------------------------------------------------
`;
        if (schemaRow && schemaRow.sql) {
          sqlDump += `${schemaRow.sql};

`;
        }
        if (results && results.length > 0) {
          for (const row of results) {
            const cols = Object.keys(row);
            const vals = cols.map((c) => {
              const val = row[c];
              if (val === null || val === void 0)
                return "NULL";
              if (typeof val === "number")
                return val;
              if (typeof val === "boolean")
                return val ? 1 : 0;
              const escaped = String(val).replace(/'/g, "''");
              return `'${escaped}'`;
            });
            sqlDump += `INSERT OR REPLACE INTO ${table3} (${cols.join(", ")}) VALUES (${vals.join(", ")});
`;
          }
          sqlDump += `
`;
        }
      }
    } catch (e) {
      sqlDump += `-- Table ${table3} empty or skipped: ${e?.message || e}

`;
    }
  }
  sqlDump += `PRAGMA foreign_keys = ON;
`;
  sqlDump += `-- End of Disaster Recovery Dump
`;
  const filename = `evidence_hub_database_dump_${(/* @__PURE__ */ new Date()).toISOString().substring(0, 10)}.sql`;
  return new Response(sqlDump, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(generateDisasterRecoverySqlDump, "generateDisasterRecoverySqlDump");

// src/routes/tax_export.routes.ts
async function handleTaxExportRoutes(request, env2, path, method) {
  const receiptDownloadMatch = path.match(/^\/api\/v1\/receipts\/([a-zA-Z0-9_.-]+)\/download$/);
  if (receiptDownloadMatch && method === "GET") {
    return downloadReceiptFile(receiptDownloadMatch[1], env2);
  }
  if (path === "/api/v1/tax-reports/summary" && method === "GET") {
    return getTaxReportSummary(request, env2);
  }
  if (path === "/api/v1/export/datev-extf" && method === "POST") {
    return exportDatevExtf(request, env2);
  }
  if (path === "/api/v1/export/lexware-csv" && method === "POST") {
    return exportLexwareCsv(request, env2);
  }
  if (path === "/api/v1/export/accounting-data" && method === "POST") {
    return exportAccountingData(request, env2);
  }
  if (path === "/api/v1/export/timesheet-manifest" && method === "POST") {
    return exportTimesheetManifest(request, env2);
  }
  if (path === "/api/v1/export/tax-receipts-manifest" && method === "POST") {
    return exportTaxReceiptsManifest(request, env2);
  }
  if (path === "/api/v1/export/full-disaster-recovery-sql" && method === "GET") {
    return generateDisasterRecoverySqlDump(env2);
  }
  if (path === "/api/v1/audit/logs" && method === "GET") {
    return getAuditLogsAndSeals(env2);
  }
  if (path === "/api/v1/audit/request-reset-otp" && method === "POST") {
    return requestAuditResetOtp(env2);
  }
  if (path === "/api/v1/audit/clear-logs" && method === "POST") {
    return errorResponse(
      "Unzul\xE4ssige Operation: GoBD-relevante Audit-Logs und Revisionssiegel d\xFCrfen in der Produktivumgebung nicht gel\xF6scht werden.",
      403
    );
  }
  if (path === "/api/v1/audit/seal-month" && method === "POST") {
    const body = await request.json() || {};
    return sealMonthArchive(body.period, env2);
  }
  if (path === "/api/v1/archive/overview" && method === "GET") {
    await ensureTripExpenses(env2);
    const { results: timesheetRevisions } = await env2.DB.prepare(`
      SELECT ts.*, p.name as project_name, p.project_number, c.name as customer_name
      FROM timesheet_versions ts
      LEFT JOIN projects p ON ts.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE ts.status IN ('InvoiceCanceled', 'Rejected', 'Voided') OR ts.is_archived = 1 OR ts.is_invoice_canceled = 1
      ORDER BY ts.period DESC, ts.version_number DESC
    `).all();
    const { results: canceledExpenses } = await env2.DB.prepare(`
      SELECT te.*, t.purpose as trip_purpose, t.trip_date, p.name as project_name, c.name as customer_name
      FROM trip_expenses te
      LEFT JOIN trips t ON te.trip_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE te.is_voucher_canceled = 1 OR te.lexware_status IN ('voided', 'deleted')
      ORDER BY te.expense_date DESC
    `).all();
    const { results: archivedProjects } = await env2.DB.prepare(`
      SELECT p.*, c.name as customer_name,
        (SELECT COUNT(*) FROM time_entries te WHERE te.project_id = p.id) as time_entries_count
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.is_active = 0 OR p.is_archived = 1 OR p.lexware_quotation_status = 'rejected'
      ORDER BY p.name ASC
    `).all();
    let gobdSeals = [];
    try {
      const { results } = await env2.DB.prepare(`
        SELECT * FROM monthly_archive_seals ORDER BY period DESC
      `).all();
      gobdSeals = results || [];
    } catch {
    }
    return jsonResponse({
      timesheetRevisions: timesheetRevisions || [],
      canceledExpenses: canceledExpenses || [],
      archivedProjects: archivedProjects || [],
      gobdSeals
    });
  }
  return null;
}
__name(handleTaxExportRoutes, "handleTaxExportRoutes");

// src/routes/installer.routes.ts
async function verifyCloudflareToken(token, accountId) {
  const cfHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  if (token.startsWith("cfat_") && accountId) {
    try {
      const accVerify = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`, {
        headers: cfHeaders
      });
      const accData = await accVerify.json();
      if (accVerify.ok && accData.success) {
        let accountName = "Verifiziert";
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: cfHeaders });
          const aData = await accRes.json();
          if (accRes.ok && aData.success && aData.result)
            accountName = aData.result.name;
        } catch {
        }
        return { valid: true, accountName, result: accData.result };
      }
    } catch {
    }
  }
  try {
    const userVerify = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: cfHeaders
    });
    const userData = await userVerify.json();
    if (userVerify.ok && userData.success) {
      let accountName = "Verifiziert";
      if (accountId) {
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: cfHeaders });
          const aData = await accRes.json();
          if (accRes.ok && aData.success && aData.result)
            accountName = aData.result.name;
        } catch {
        }
      }
      return { valid: true, accountName, result: userData.result };
    }
  } catch {
  }
  if (accountId) {
    try {
      const accVerify = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`, {
        headers: cfHeaders
      });
      const accData = await accVerify.json();
      if (accVerify.ok && accData.success) {
        let accountName = "Verifiziert";
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: cfHeaders });
          const aData = await accRes.json();
          if (accRes.ok && aData.success && aData.result)
            accountName = aData.result.name;
        } catch {
        }
        return { valid: true, accountName, result: accData.result };
      }
    } catch {
    }
  }
  return { valid: false, error: "Cloudflare API Token ung\xFCltig oder abgelaufen." };
}
__name(verifyCloudflareToken, "verifyCloudflareToken");
async function handleInstallerRoutes(request, env2, path, method) {
  if (path === "/api/v1/installer/verify-token" && method === "POST") {
    try {
      const body = await request.json();
      const token = (body.token || "").trim();
      const accountId = (body.accountId || "").trim();
      if (!token) {
        return errorResponse("API-Token erforderlich.", 400);
      }
      const verification = await verifyCloudflareToken(token, accountId);
      if (!verification.valid) {
        return errorResponse(`Cloudflare Token-Fehler: ${verification.error || "Ung\xFCltiges Token."}`, 401);
      }
      return jsonResponse({
        success: true,
        status: "active",
        accountName: verification.accountName || "Verifiziert",
        details: verification.result
      });
    } catch (err) {
      return errorResponse(`Fehler bei Token-Verifikation: ${err.message}`, 500);
    }
  }
  if (path === "/api/v1/installer/check-conflicts" && method === "POST") {
    try {
      const body = await request.json();
      const cfAccountId = (body.cfAccountId || "").trim();
      const cfApiToken = (body.cfApiToken || "").trim();
      const workerName = (body.workerName || "actanex-open-worker").trim();
      const d1DbName = (body.d1DbName || "actanex-open-db").trim();
      const r2BucketName = (body.r2BucketName || "actanex-open-storage").trim();
      if (!cfAccountId || !cfApiToken) {
        return errorResponse("Cloudflare Account-ID und API-Token sind erforderlich.", 400);
      }
      const cfHeaders = {
        "Authorization": `Bearer ${cfApiToken}`,
        "Content-Type": "application/json"
      };
      let workerExists = false;
      try {
        const wRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}`, {
          headers: cfHeaders
        });
        if (wRes.status === 200) {
          workerExists = true;
        }
      } catch {
      }
      let d1Exists = false;
      let d1Uuid = null;
      try {
        const d1Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
          headers: cfHeaders
        });
        if (d1Res.ok) {
          const d1Data = await d1Res.json();
          const match = (d1Data.result || []).find((d) => d.name === d1DbName);
          if (match) {
            d1Exists = true;
            d1Uuid = match.uuid;
          }
        }
      } catch {
      }
      let r2Exists = false;
      try {
        const r2Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
          headers: cfHeaders
        });
        if (r2Res.ok) {
          r2Exists = true;
        }
      } catch {
      }
      const hasAnyConflict = workerExists || d1Exists || r2Exists;
      return jsonResponse({
        success: true,
        conflicts: {
          worker: { exists: workerExists, name: workerName },
          d1: { exists: d1Exists, name: d1DbName, uuid: d1Uuid },
          r2: { exists: r2Exists, name: r2BucketName }
        },
        hasAnyConflict
      });
    } catch (err) {
      return errorResponse(`Fehler bei der Kollisionspr\xFCfung: ${err.message}`, 500);
    }
  }
  if (path === "/api/v1/installer/provision" && method === "POST") {
    try {
      const body = await request.json();
      const cfAccountId = (body.cfAccountId || "").trim();
      const cfApiToken = (body.cfApiToken || "").trim();
      const workerName = (body.workerName || "actanex-open-worker").trim();
      const d1DbName = (body.d1DbName || "actanex-open-db").trim();
      const r2BucketName = (body.r2BucketName || "actanex-open-storage").trim();
      const adminFullName = (body.adminFullName || "Administrator").trim();
      const adminEmail = (body.adminEmail || "").trim().toLowerCase();
      const adminPassword = (body.adminPassword || "").trim();
      const jwtSecret = (body.jwtSecret || "").trim();
      const lexwareApiKey = (body.lexwareApiKey || "").trim();
      const resendApiKey = (body.resendApiKey || "").trim();
      const gitHubRepo = (body.gitHubRepo || "MKN1411/actanex-open").trim();
      const gitHubBranch = (body.gitHubBranch || "main").trim();
      const allowOverwrite = Boolean(body.allowOverwrite);
      if (!cfAccountId || !cfApiToken) {
        return errorResponse("Cloudflare Account-ID und API-Token sind erforderlich.", 400);
      }
      if (!adminEmail || !adminPassword) {
        return errorResponse("Admin E-Mail und Passwort sind erforderlich.", 400);
      }
      const cfHeaders = {
        "Authorization": `Bearer ${cfApiToken}`,
        "Content-Type": "application/json"
      };
      const tokenVerification = await verifyCloudflareToken(cfApiToken, cfAccountId);
      if (!tokenVerification.valid) {
        return errorResponse("Cloudflare API Token ung\xFCltig oder abgelaufen.", 401);
      }
      if (!allowOverwrite) {
        let workerExists = false;
        try {
          const wCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}`, {
            headers: cfHeaders
          });
          if (wCheck.status === 200) {
            workerExists = true;
          }
        } catch {
        }
        let d1Exists = false;
        try {
          const dCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
            headers: cfHeaders
          });
          if (dCheck.ok) {
            const dData = await dCheck.json();
            d1Exists = Boolean((dData.result || []).some((d) => d.name === d1DbName));
          }
        } catch {
        }
        let r2Exists = false;
        try {
          const rCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
            headers: cfHeaders
          });
          if (rCheck.ok)
            r2Exists = true;
        } catch {
        }
        const conflicts = [];
        if (workerExists)
          conflicts.push(`Worker Script '${workerName}'`);
        if (d1Exists)
          conflicts.push(`D1 Datenbank '${d1DbName}'`);
        if (r2Exists)
          conflicts.push(`R2 Bucket '${r2BucketName}'`);
        if (conflicts.length > 0) {
          return errorResponse(
            `Kollision erkannt: Folgende Ressourcen existieren bereits: ${conflicts.join(", ")}. Bitte aktivieren Sie '\xDCberschreiben erlauben' oder w\xE4hlen Sie andere Namen.`,
            409
          );
        }
      }
      let dbUuid = "";
      const listD1 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
        headers: cfHeaders
      });
      if (listD1.ok) {
        const d1Data = await listD1.json();
        const found = (d1Data.result || []).find((d) => d.name === d1DbName);
        if (found) {
          dbUuid = found.uuid;
        }
      }
      if (!dbUuid) {
        const createD1 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
          method: "POST",
          headers: cfHeaders,
          body: JSON.stringify({ name: d1DbName })
        });
        const d1Created = await createD1.json();
        if (createD1.ok && d1Created.success && d1Created.result) {
          dbUuid = d1Created.result.uuid;
        } else {
          const errMsg = d1Created.errors?.[0]?.message || "D1-Erstellung fehlgeschlagen.";
          return errorResponse(`D1 Datenbank Fehler: ${errMsg}`, 500);
        }
      }
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
        method: "PUT",
        headers: cfHeaders
      });
      let schemaApplied = false;
      try {
        const schemaUrl = `https://raw.githubusercontent.com/${gitHubRepo}/${gitHubBranch}/src/Worker/db/full_schema_combined.sql`;
        const schemaRes = await fetch(schemaUrl);
        if (schemaRes.ok) {
          const sql = await schemaRes.text();
          const d1Exec = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database/${dbUuid}/raw`, {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify({ sql })
          });
          schemaApplied = d1Exec.ok;
        }
      } catch (err) {
        console.warn("Schema execution warning:", err);
      }
      let workerDeployed = false;
      let uploadErrorMessage = "";
      try {
        const bundleUrl = `https://raw.githubusercontent.com/${gitHubRepo}/${gitHubBranch}/src/Worker/bundle/worker.bundle.js`;
        const bundleRes = await fetch(bundleUrl);
        if (bundleRes.ok) {
          const bundleCode = await bundleRes.text();
          const workerMetadata = {
            main_module: "index.js",
            compatibility_date: "2024-12-30",
            compatibility_flags: ["nodejs_compat"],
            bindings: [
              { type: "d1", name: "DB", id: dbUuid },
              { type: "r2_bucket", name: "STORAGE", bucket_name: r2BucketName }
            ]
          };
          const formData = new FormData();
          formData.append("metadata", new Blob([JSON.stringify(workerMetadata)], { type: "application/json" }));
          formData.append("index.js", new Blob([bundleCode], { type: "application/javascript+module" }), "index.js");
          const uploadRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}`, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${cfApiToken}`
            },
            body: formData
          });
          const uploadData = await uploadRes.json();
          workerDeployed = Boolean(uploadRes.ok && uploadData.success);
          if (!workerDeployed) {
            uploadErrorMessage = uploadData.errors?.[0]?.message || "Worker Upload fehlgeschlagen";
          }
        } else {
          uploadErrorMessage = `Bundle konnte nicht von GitHub geladen werden (HTTP ${bundleRes.status})`;
        }
      } catch (err) {
        uploadErrorMessage = err.message;
        console.warn("Worker bundle upload error:", err);
      }
      let subdomainActive = false;
      let accountSubdomain = "";
      try {
        const subRouteRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}/subdomain`, {
          method: "POST",
          headers: cfHeaders,
          body: JSON.stringify({ enabled: true })
        });
        subdomainActive = subRouteRes.ok;
        const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/subdomain`, {
          headers: cfHeaders
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.success && subData.result?.subdomain) {
            accountSubdomain = subData.result.subdomain;
          }
        }
      } catch {
      }
      const liveWorkerUrl = accountSubdomain ? `https://${workerName}.${accountSubdomain}.workers.dev` : `https://${workerName}.workers.dev`;
      const secretsToPut = [
        { name: "JWT_SECRET", text: jwtSecret || crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "") },
        { name: "ADMIN_INITIAL_EMAIL", text: adminEmail },
        { name: "ADMIN_INITIAL_PASSWORD", text: adminPassword },
        { name: "ADMIN_INITIAL_NAME", text: adminFullName }
      ];
      if (lexwareApiKey)
        secretsToPut.push({ name: "LEXWARE_API_KEY", text: lexwareApiKey });
      if (resendApiKey)
        secretsToPut.push({ name: "RESEND_API_KEY", text: resendApiKey });
      const secretsStatus = {};
      for (const s of secretsToPut) {
        try {
          const putSec = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}/secrets`, {
            method: "PUT",
            headers: cfHeaders,
            body: JSON.stringify({
              name: s.name,
              text: s.text,
              type: "secret_text"
            })
          });
          secretsStatus[s.name] = putSec.ok;
        } catch {
          secretsStatus[s.name] = false;
        }
      }
      let adminCreated = false;
      try {
        const saltBytes = new Uint8Array(16);
        crypto.getRandomValues(saltBytes);
        const salt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
        const passwordHash = await hashPassword(adminPassword, salt);
        const adminId = "usr_admin_" + crypto.randomUUID().slice(0, 8);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const insertAdminSql = `
          INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
          VALUES ('${adminId}', '${adminEmail}', '${passwordHash}', '${salt}', '${adminFullName}', 'Admin', 1, '${now}')
          ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            salt = excluded.salt,
            full_name = excluded.full_name;
        `;
        const adminInsertRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database/${dbUuid}/raw`, {
          method: "POST",
          headers: cfHeaders,
          body: JSON.stringify({ sql: insertAdminSql })
        });
        adminCreated = adminInsertRes.ok;
      } catch (err) {
        console.warn("Admin insert warning:", err);
      }
      return jsonResponse({
        success: true,
        message: "ActaNex Open wurde erfolgreich in Ihrem Cloudflare-Account bereitgestellt!",
        resources: {
          d1Database: { name: d1DbName, uuid: dbUuid, schemaApplied },
          r2Bucket: { name: r2BucketName },
          workerScript: {
            name: workerName,
            deployed: workerDeployed,
            liveUrl: liveWorkerUrl,
            subdomain: accountSubdomain,
            subdomainActive,
            error: uploadErrorMessage || null
          },
          secretsSaved: secretsStatus,
          adminUser: { email: adminEmail, created: adminCreated }
        }
      });
    } catch (err) {
      return errorResponse(`Kritischer Installationsfehler: ${err.message}`, 500);
    }
  }
  return null;
}
__name(handleInstallerRoutes, "handleInstallerRoutes");

// src/index.ts
var src_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    try {
      await ensureCoreDatabase(env2);
      if (path === "/" && method === "GET") {
        const acceptHeader = request.headers.get("accept") || "";
        const dashboardUrl = `https://actanex-open-web.pages.dev/?api=${encodeURIComponent(url.origin + "/api/v1")}`;
        if (acceptHeader.includes("text/html")) {
          return new Response(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActaNex Open - Worker API Online</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: radial-gradient(circle at top, #1e293b, #0f172a); color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); backdrop-filter: blur(12px); }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
    h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #fff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); transition: transform 0.1s, opacity 0.2s; }
    .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
    .info-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px; margin: 24px 0; font-size: 12px; text-align: left; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; color: #cbd5e1; }
    .info-row span:first-child { color: #64748b; }
    .links { font-size: 12px; color: #64748b; }
    .links a { color: #38bdf8; text-decoration: none; margin: 0 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge"><span class="pulse"></span> Cloudflare Worker API ist aktiv</div>
    <h1>ActaNex Open</h1>
    <p>Diese Instanz verarbeitet alle Backend REST API Anfragen, D1 Edge-Datenbank-Operationen und R2-Dateispeicherzugriffe.</p>
    <a href="${dashboardUrl}" class="btn-primary">
      <span>\u{1F680} Zum Web-Dashboard wechseln</span>
    </a>
    <div class="info-box">
      <div class="info-row"><span>Status:</span><span style="color:#34d399;">200 OK (Healthy)</span></div>
      <div class="info-row"><span>Version:</span><span>3.0.0 (ACNX)</span></div>
      <div class="info-row"><span>API Basis-URL:</span><code style="font-size:11px; color:#38bdf8;">${url.origin}/api/v1</code></div>
    </div>
    <div class="links">
      <a href="/api/v1/health">API Diagnostics</a> &bull;
      <a href="https://actanex-open-web.pages.dev/installer.html">Installer Wizard</a>
    </div>
  </div>
</body>
</html>`, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
        return jsonResponse({
          status: "healthy",
          service: "ActaNex Open Worker REST API",
          version: "2.15.0",
          dashboard: dashboardUrl,
          health: `${url.origin}/api/v1/health`
        });
      }
      if ((path === "/health" || path === "/api/v1/health") && method === "GET") {
        return jsonResponse({
          status: "healthy",
          app: "Freelancer Evidence & Billing Hub",
          version: "2.15.0",
          architecture: "ADR-019 Modular Service Architecture",
          author: "ActaNex Open Contributors",
          copyright: "(c) 2026 ActaNex Open",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const authRes = await handleAuthRoutes(request, env2, path, method);
      if (authRes)
        return authRes;
      const installerRes = await handleInstallerRoutes(request, env2, path, method);
      if (installerRes)
        return installerRes;
      const isPublicRoute = path === "/health" || path === "/api/v1/health" || path.startsWith("/api/v1/installer/") || path === "/api/v1/tax-reports/bmf-rates" || path.startsWith("/api/v1/trips/receipts/") || path.startsWith("/api/v1/vouchers/receipts/") || /^\/api\/v1\/vouchers\/upload-session\/[a-zA-Z0-9_-]+\/(?:upload|status)$/.test(path) || /^\/api\/v1\/receipts\/[a-zA-Z0-9_.-]+\/download$/.test(path) || /^\/api\/v1\/(?:public\/)?timesheets\/[a-zA-Z0-9_-]+\/download-signed-document$/.test(path) || /^\/api\/v1\/(?:public\/)?timesheets\/[a-zA-Z0-9_-]+\/pdf$/.test(path) || /^\/api\/v1\/(?:public\/)?timesheets\/[a-zA-Z0-9_-]+\/approval-data$/.test(path) || /^\/api\/v1\/(?:public\/)?(?:timesheets\/[a-zA-Z0-9_-]+\/request-otp|otp\/request)$/.test(path) || /^\/api\/v1\/(?:public\/)?(?:timesheets\/[a-zA-Z0-9_-]+\/verify-otp|otp\/verify)$/.test(path);
      let authenticatedUser = null;
      if (path.startsWith("/api/v1/") && !isPublicRoute) {
        authenticatedUser = await getAuthenticatedUser2(request, env2);
        if (!authenticatedUser) {
          return errorResponse("Nicht authentifiziert. Bitte melden Sie sich an.", 401);
        }
        const isAdminOnlyRoute = path === "/api/v1/system/diagnostics" || path.startsWith("/api/v1/settings") || path.startsWith("/api/v1/backup/") || path.startsWith("/api/v1/export/full-disaster-recovery-sql") || path.startsWith("/api/v1/audit/");
        if (isAdminOnlyRoute && authenticatedUser.role !== "Admin") {
          return errorResponse("Zugriff verweigert. Administrator-Rechte erforderlich.", 403);
        }
      }
      if (path === "/api/v1/system/diagnostics" && method === "GET") {
        let customersCount = 0;
        let projectsCount = 0;
        let timeEntriesCount = 0;
        let timesheetVersionsCount = 0;
        let tripsCount = 0;
        let auditCount = 0;
        let recentAuditEvents = [];
        try {
          const c = await env2.DB.prepare("SELECT COUNT(*) as count FROM customers").first();
          customersCount = c?.count || 0;
        } catch {
        }
        try {
          const p = await env2.DB.prepare("SELECT COUNT(*) as count FROM projects").first();
          projectsCount = p?.count || 0;
        } catch {
        }
        try {
          const t = await env2.DB.prepare("SELECT COUNT(*) as count FROM time_entries").first();
          timeEntriesCount = t?.count || 0;
        } catch {
        }
        try {
          const tv = await env2.DB.prepare("SELECT COUNT(*) as count FROM timesheet_versions").first();
          timesheetVersionsCount = tv?.count || 0;
        } catch {
        }
        try {
          const tr = await env2.DB.prepare("SELECT COUNT(*) as count FROM trips").first();
          tripsCount = tr?.count || 0;
        } catch {
        }
        try {
          const a = await env2.DB.prepare("SELECT COUNT(*) as count FROM audit_events").first();
          auditCount = a?.count || 0;
        } catch {
        }
        try {
          const recent = await env2.DB.prepare(`
            SELECT id, event_type, entity_type, entity_id, timestamp_utc, description
            FROM audit_events
            ORDER BY timestamp_utc DESC
            LIMIT 30
          `).all();
          recentAuditEvents = recent.results || [];
        } catch {
        }
        return jsonResponse({
          report_name: "Evidence Hub Diagnostics & Support Bundle",
          app_version: "3.0.0",
          architecture: "ADR-019 Modular Router",
          generated_at_utc: (/* @__PURE__ */ new Date()).toISOString(),
          environment: {
            is_cloudflare_worker: true,
            has_lexware_key: !!env2.LEXWARE_API_KEY,
            has_resend_key: !!env2.RESEND_API_KEY,
            has_jwt_secret: !!env2.JWT_SECRET,
            has_r2_bucket: !!(env2.STORAGE || env2.DOCUMENTS_BUCKET)
          },
          database_health: {
            customers: customersCount,
            projects: projectsCount,
            time_entries: timeEntriesCount,
            timesheets: timesheetVersionsCount,
            trips: tripsCount,
            audit_events: auditCount
          },
          recent_audit_log: recentAuditEvents
        });
      }
      const settingsRes = await handleSettingsRoutes(request, env2, path, method);
      if (settingsRes)
        return settingsRes;
      const dashboardRes = await handleDashboardRoutes(request, env2, path, method);
      if (dashboardRes)
        return dashboardRes;
      const pcRes = await handleProjectsCustomersRoutes(request, env2, path, method);
      if (pcRes)
        return pcRes;
      const teRes = await handleTimeEntriesRoutes(request, env2, path, method);
      if (teRes)
        return teRes;
      const tripsRes = await handleTripsExpensesRoutes(request, env2, path, method);
      if (tripsRes)
        return tripsRes;
      const tsApprovalRes = await handleTimesheetsApprovalRoutes(request, env2, path, method);
      if (tsApprovalRes)
        return tsApprovalRes;
      const vouchersRes = await handleVouchersRoutes(request, env2, path, method);
      if (vouchersRes)
        return vouchersRes;
      const taxExportRes = await handleTaxExportRoutes(request, env2, path, method);
      if (taxExportRes)
        return taxExportRes;
      return errorResponse("Endpoint nicht gefunden", 404);
    } catch (err) {
      console.error("Unhandled Worker Exception:", err);
      const isDev = env2.ENVIRONMENT === "development" || env2.ENVIRONMENT === "local";
      return jsonResponse({
        error: isDev ? err.message : "Interner Serverfehler",
        ...isDev ? { stack: err.stack } : {}
      }, 500);
    }
  }
};
export {
  calculateSha256Hex,
  src_default as default,
  fetchLexwareWithRetry,
  getEffectiveLexwareApiKey,
  getEffectiveLexwareOwnVendorId,
  logAuditEvent,
  scanVoucherWithAi,
  syncLexwareContactsInternal
};
//# sourceMappingURL=index.js.map
