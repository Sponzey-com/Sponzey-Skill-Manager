export const SPONZEY_TREE_VIEWS = Object.freeze([
  { id: "sponzeySkills.mainRepository", name: "Main Repository" },
  { id: "sponzeySkills.globalSkills", name: "Global Skills" },
  {
    id: "sponzeySkills.projectSkills",
    name: "Project Skills",
    when: "workspaceFolderCount > 0",
  },
  { id: "sponzeySkills.diagnostics", name: "Diagnostics" },
]);

export function mapSkillsReadModelToTreeItems(readModel) {
  return [
    section("mainRepositorySkills", "Main Repository", [
      ...(readModel.mainRepositorySkills ?? []).map((skill) =>
        item({
          id: `source:${skill.name}`,
          label: skill.name,
          description: sourceDescription(skill),
          detail: skill.sourcePath,
          iconId: "repo",
          contextValue: "sponzeySkillSource",
          source: sourceFromSkill(skill),
        }),
      ),
      ...backupSectionItems(readModel.backups ?? []),
    ]),
    section(
      "globalSkills",
      "Global Skills",
      flatAppliedSkillItems(readModel.globalSkills ?? []),
    ),
    section(
      "projectSkills",
      "Project Skills",
      flatAppliedSkillItems(readModel.projectSkills ?? []),
    ),
    section("diagnostics", "Diagnostics", [
      ...(readModel.diagnostics ?? []).map((diagnostic, index) =>
        item({
          id: `diagnostic:${diagnostic.code}:${index}`,
          label: diagnostic.code,
          description: diagnosticDescription(diagnostic),
          detail: diagnostic.message,
          iconId: iconIdForDiagnostic(diagnostic),
        }),
      ),
    ]),
  ];
}

function flatAppliedSkillItems(groups) {
  return groups.flatMap((group) =>
    (group.skills ?? []).map((skill) => appliedSkillItem({ group, skill })),
  );
}

function appliedSkillItem({ group, skill }) {
  const target = targetFromGroup(group);

  return item({
    id: `target-skill:${group.targetId}:${skill.name}`,
    label: skill.name,
    description: appliedSkillDescriptionWithTarget({ group, skill }),
    detail: appliedSkillDetailWithTarget({ group, skill }),
    iconId: iconIdForTarget(group),
    contextValue: "sponzeyAppliedSkill",
    target,
    appliedSkill: appliedSkillFromSkill(skill),
  });
}

function projectPatternFromGroup(group) {
  if (typeof group.targetPath !== "string" || !group.targetPath.includes("/")) {
    return null;
  }

  return group.targetPath.split("/").slice(-2).join("/");
}

function clientTypeLabel(clientType) {
  if (clientType === "codex") {
    return "Codex";
  }

  if (clientType === "claude") {
    return "Claude";
  }

  if (typeof clientType === "string" && clientType.trim().length > 0) {
    return clientType.trim();
  }

  return "Custom";
}

function backupSectionItems(backups) {
  if (!Array.isArray(backups) || backups.length === 0) {
    return [];
  }

  return [
    section(
      "backupSnapshots",
      "Backup Snapshots",
      backups.map((backup) =>
        item({
          id: `backup:${backup.skillName}:${backup.snapshotId}`,
          label: `${backup.skillName}:${backup.snapshotId}`,
          description: backup.createdAt ?? "backup",
          detail: backup.backupPath,
          iconId: "archive",
          contextValue: "sponzeySkillBackup",
          backup: backupFromBackupReadModel(backup),
        }),
      ),
    ),
  ];
}

function section(id, label, children) {
  return item({
    id,
    label,
    collapsible: true,
    children,
  });
}

function sourceFromSkill(skill) {
  const source = {
    id: skill.id ?? skill.name,
    name: skill.name,
    sourcePath: skill.sourcePath,
  };

  if (skill.sourceHash !== undefined) {
    source.sourceHash = skill.sourceHash;
  }
  if (skill.riskLevel !== undefined) {
    source.riskLevel = skill.riskLevel;
  }
  if (skill.lastAnalyzedAt !== undefined) {
    source.lastAnalyzedAt = skill.lastAnalyzedAt;
  }
  if ((skill.appliedTargets?.length ?? 0) > 0) {
    source.appliedTargetCount = skill.appliedTargets.length;
  }

  return source;
}

function targetFromGroup(group) {
  return {
    id: group.targetId,
    clientType: group.clientType,
    scope: group.scope,
    targetPath: group.targetPath,
    workspacePath: group.workspacePath,
    targetPattern: group.targetPattern,
  };
}

function appliedSkillFromSkill(skill) {
  const appliedSkill = {
    name: skill.name,
    kind: skill.kind,
    status: skill.status,
    targetPath: skill.targetPath,
    sourceId: skill.sourceId,
  };

  if (skill.syncStatus !== undefined) {
    appliedSkill.syncStatus = skill.syncStatus;
  }
  if (skill.sourceHash !== undefined) {
    appliedSkill.sourceHash = skill.sourceHash;
  }
  if (skill.targetHash !== undefined) {
    appliedSkill.targetHash = skill.targetHash;
  }
  if (skill.lastCheckedAt !== undefined) {
    appliedSkill.lastCheckedAt = skill.lastCheckedAt;
  }

  return appliedSkill;
}

function backupFromBackupReadModel(backup) {
  return {
    skillName: backup.skillName,
    snapshotId: backup.snapshotId,
    backupPath: backup.backupPath,
    createdAt: backup.createdAt,
  };
}

function sourceDescription(skill) {
  const count = skill.appliedTargets?.length ?? 0;
  if (count > 0) {
    return `${skill.status} · ${count} target${count === 1 ? "" : "s"}`;
  }
  return skill.status;
}

function appliedSkillDescription(skill) {
  if (skill.syncStatus) {
    return `${skill.kind} · ${skill.syncStatus}`;
  }
  return skill.kind;
}

function appliedSkillDescriptionWithTarget({ group, skill }) {
  const parts = [clientTypeLabel(group.clientType), appliedSkillDescription(skill)];

  if (group.scope === "project") {
    const projectPattern = group.targetPattern ?? projectPatternFromGroup(group);
    if (projectPattern) {
      parts.splice(1, 0, projectPattern);
    }
  }

  return parts.join(" · ");
}

function appliedSkillDetailWithTarget({ group, skill }) {
  const targetPath =
    group.scope === "project"
      ? group.targetPattern ?? projectPatternFromGroup(group) ?? group.targetPath
      : group.targetPath;

  return [targetPath, skill.targetPath].filter(Boolean).join(" -> ");
}

function item({
  id,
  label,
  description,
  detail,
  collapsible = false,
  children = [],
  contextValue,
  source,
  target,
  appliedSkill,
  backup,
  iconId,
}) {
  const treeItem = {
    id,
    label,
    description,
    detail,
    collapsible,
    children,
  };

  if (iconId) {
    treeItem.iconId = iconId;
  }

  if (contextValue) {
    treeItem.contextValue = contextValue;
  }

  if (source) {
    treeItem.source = source;
  }

  if (target) {
    treeItem.target = target;
  }

  if (appliedSkill) {
    treeItem.appliedSkill = appliedSkill;
  }

  if (backup) {
    treeItem.backup = backup;
  }

  return treeItem;
}

function iconIdForTarget(group) {
  if (group.clientType === "codex") {
    return "agent-codex";
  }

  if (group.clientType === "claude") {
    return "agent-claude";
  }

  if (group.scope === "global") {
    return "globe";
  }

  if (group.scope === "project") {
    return "folder";
  }

  return "target";
}

function iconIdForDiagnostic(diagnostic) {
  if (diagnostic.severity === "error") {
    return "error";
  }

  if (diagnostic.severity === "warning") {
    return "warning";
  }

  return "info";
}

function diagnosticDescription(diagnostic) {
  const context =
    textOrNull(diagnostic.sourceId) ??
    textOrNull(diagnostic.targetId) ??
    textOrNull(diagnostic.targetPath);

  return [context, diagnostic.severity].filter(Boolean).join(" · ");
}

function textOrNull(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
