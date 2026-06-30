const extension = await import("../src/extension.js");
const domain = await import("../src/domain/index.js");
const application = await import("../src/application/index.js");

if (typeof extension.activate !== "function") {
  throw new Error("extension activate export is missing");
}

if (typeof extension.deactivate !== "function") {
  throw new Error("extension deactivate export is missing");
}

if (domain.layerName !== "domain") {
  throw new Error("domain module smoke check failed");
}

if (application.layerName !== "application") {
  throw new Error("application module smoke check failed");
}

console.log("build smoke ok");
