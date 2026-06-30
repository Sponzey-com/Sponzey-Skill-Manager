export {
  createSkillName,
  createSkillSource,
  createSkillTarget,
  normalizePath,
} from "./model/core.js";
export {
  decideApplyConflictPolicy,
  calculateSyncStatus,
  decideRemovePolicy,
  decideRiskPolicy,
  decideTransferPolicy,
  evaluateRepositoryPathPolicy,
} from "./policy/core-policies.js";

export const layerName = "domain";

export function describeDomainLayer() {
  return {
    layerName,
    ownsExternalIo: false,
  };
}
