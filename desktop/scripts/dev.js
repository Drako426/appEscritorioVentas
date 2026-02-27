const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const rendererDir = path.join(rootDir, "renderer");
const devUrl = "http://localhost:5173";
let rendererProcess;
let electronProcess;

function run(command, args, options = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

function runNpm(args, options = {}) {
  if (process.platform === "win32") {
    return run("cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], options);
  }

  return run("npm", args, options);
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error("Vite no respondió a tiempo"));
            return;
          }
          setTimeout(check, 500);
        });
    };

    check();
  });
}

function shutdown(code = 0) {
  if (electronProcess && !electronProcess.killed) electronProcess.kill();
  if (rendererProcess && !rendererProcess.killed) rendererProcess.kill();
  process.exit(code);
}

async function start() {
  rendererProcess = runNpm(["run", "dev"], { cwd: rendererDir });

  rendererProcess.on("exit", (code) => {
    if (!electronProcess) {
      process.exit(code || 1);
      return;
    }
    shutdown(code || 0);
  });

  try {
    await waitForServer(devUrl);
  } catch (error) {
    console.error(error.message);
    shutdown(1);
    return;
  }

  electronProcess = runNpm(["run", "dev:electron"], {
    cwd: rootDir,
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: devUrl,
    },
  });

  electronProcess.on("exit", (code) => shutdown(code || 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start();
