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
  createBuiltInAnalyzerPolicyPack,
  buildRepositoryIndex,
  evaluateSkillNameConflictPolicy,
  evaluateSkillShadowingPolicy,
  evaluateRepositoryPathPolicy,
  ANALYZER_POLICY_VERSION,
  REPOSITORY_INDEX_SCHEMA_VERSION,
  repositoryIndexUnsupportedVersionDiagnostic,
} from "./policy/core-policies.js";

export const layerName = "domain";

export function describeDomainLayer() {
  return {
    layerName,
    ownsExternalIo: false,
  };
}
