import { layerName as applicationLayerName } from "../application/index.js";
export { FileSystemSkillRepository } from "./filesystem/file-system-skill-repository.js";
export { FileSystemHashPort } from "./filesystem/file-system-hash-port.js";
export { FileSystemTargetStore } from "./filesystem/file-system-target-store.js";
export { FileSystemTransferAuditStore } from "./filesystem/file-system-transfer-audit-store.js";
export { LocalGitSkillSourceResolver } from "./filesystem/local-git-skill-source-resolver.js";
export { createEventLogger, maskEvent } from "./logging/event-logger.js";
export { createVsCodeOutputChannelLogger } from "./vscode/vscode-output-logger.js";
export {
  createVsCodeRepositoryOpener,
  createVsCodeSettingsReader,
  createVsCodeSettingsWriter,
  readVsCodeWorkspaceRoots,
} from "./vscode/vscode-settings-reader.js";

export const layerName = "infrastructure";

export function describeInfrastructureLayer() {
  return {
    layerName,
    implementsPortsFor: [applicationLayerName],
  };
}
