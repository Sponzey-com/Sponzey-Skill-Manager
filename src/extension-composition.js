import {
  addGlobalRepository,
  addProjectRepository,
  applySkillToTarget,
  backupAppliedSkillToMainRepository,
  buildRuntimeContext,
  copyAppliedSkillToMainRepository,
  createRepositorySkillAnalyzer,
  createSkill,
  analyzeAllSkills,
  convertAppliedSkillMode,
  deleteBackup,
  deleteSourceSkill,
  exportSourceSkill,
  getSkillDetail,
  importSkillToMainRepository,
  importSkillArchiveToMainRepository,
  installSkillToMainRepository,
  listSkillBackups,
  moveAppliedSkillToMainRepository,
  openMainRepository,
  openSkillPath,
  promoteBackupToSkillSource,
  renameSourceSkill,
  removeGlobalRepository,
  refreshSkills,
  removeAppliedSkill,
  removeMainRepository,
  removeProjectRepository,
  setMainRepository,
  showDiagnostics,
  updateAppliedCopyFromSource,
} from "./application/index.js";
import {
  FileSystemHashPort,
  FileSystemSkillRepository,
  FileSystemTargetStore,
  LocalGitSkillSourceResolver,
} from "./infrastructure/index.js";
import { createUseCaseCommandHandlers } from "./presentation/index.js";

export async function createExtensionComposition({
  settingsReader,
  workspaceRoots = [],
  adapters = {},
  analyzer = null,
}) {
  const runtimeContextResult = await buildRuntimeContext({
    settingsReader,
    workspaceRoots,
  });

  if (!runtimeContextResult.ok) {
    return {
      ok: false,
      context: null,
      diagnostics: runtimeContextResult.diagnostics,
      commandHandlers: createUseCaseCommandHandlers({
        async getContext() {
          return null;
        },
        useCases: createSettingsUseCaseBundle({
          settingsWriter: adapters.settingsWriter,
          skillRepository: adapters.skillRepository,
        }),
      }),
    };
  }

  const context = runtimeContextResult.context;
  const skillRepository =
    adapters.skillRepository ?? new FileSystemSkillRepository();
  const targetStore = adapters.targetStore ?? new FileSystemTargetStore();
  const hashPort = adapters.hashPort ?? new FileSystemHashPort();
  const skillSourceResolver =
    adapters.skillSourceResolver ?? new LocalGitSkillSourceResolver();
  const skillAnalyzer =
    analyzer ?? createRepositorySkillAnalyzer({ skillRepository });
  const useCases = createUseCaseBundle({
    skillRepository,
    targetStore,
    hashPort,
    analyzer: skillAnalyzer,
    skillSourceResolver,
    settingsWriter: adapters.settingsWriter,
    repositoryOpener: adapters.repositoryOpener,
  });

  return {
    ok: true,
    context,
    diagnostics: runtimeContextResult.diagnostics,
    commandHandlers: createUseCaseCommandHandlers({
      async getContext() {
        return context;
      },
      useCases,
    }),
  };
}

function createSettingsUseCaseBundle({ settingsWriter, skillRepository }) {
  return {
    async setMainRepository({ input }) {
      return setMainRepository({
        input,
        settingsWriter,
        skillRepository,
      });
    },
    async removeMainRepository({ input }) {
      return removeMainRepository({
        input,
        settingsWriter,
      });
    },
    async addGlobalRepository({ input }) {
      return addGlobalRepository({
        input,
        settingsWriter,
      });
    },
    async removeGlobalRepository({ input }) {
      return removeGlobalRepository({
        input,
        settingsWriter,
      });
    },
    async addProjectRepository({ input }) {
      return addProjectRepository({
        input,
        settingsWriter,
      });
    },
    async removeProjectRepository({ input }) {
      return removeProjectRepository({
        input,
        settingsWriter,
      });
    },
  };
}

function createUseCaseBundle({
  skillRepository,
  targetStore,
  hashPort,
  analyzer,
  skillSourceResolver,
  settingsWriter,
    repositoryOpener,
}) {
  const useCases = {
    ...createSettingsUseCaseBundle({ settingsWriter, skillRepository }),
    async openMainRepository({ context }) {
      return openMainRepository({
        context,
        repositoryOpener,
      });
    },
    async refreshSkills({ context }) {
      return refreshSkills({
        context,
        skillRepository,
        targetStore,
        hashPort,
      });
    },
    async createSkill({ context, input }) {
      return createSkill({
        context,
        input,
        skillRepository,
      });
    },
    async removeAppliedSkill({ input }) {
      return removeAppliedSkill({
        input,
        targetStore,
      });
    },
    async copyAppliedSkillToMainRepository({ context, input }) {
      return copyAppliedSkillToMainRepository({
        context,
        input,
        skillRepository,
      });
    },
    async backupAppliedSkillToMainRepository({ context, input }) {
      return backupAppliedSkillToMainRepository({
        context,
        input,
        skillRepository,
      });
    },
    async moveAppliedSkillToMainRepository({ context, input }) {
      return moveAppliedSkillToMainRepository({
        context,
        input,
        skillRepository,
        targetStore,
      });
    },
    async showDiagnostics({ context }) {
      return showDiagnostics({
        context,
        skillRepository,
        targetStore,
      });
    },
    async getSkillDetail({ input }) {
      return getSkillDetail({
        input,
        skillRepository,
        targetStore,
      });
    },
    async openSkillPath({ input }) {
      return openSkillPath({
        input,
        repositoryOpener,
      });
    },
    async analyzeAllSkills({ context }) {
      return analyzeAllSkills({
        context,
        analyzer,
        skillRepository,
      });
    },
    async updateAppliedCopyFromSource({ input }) {
      return updateAppliedCopyFromSource({
        input,
        targetStore,
      });
    },
    async convertAppliedSkillMode({ input }) {
      return convertAppliedSkillMode({
        input,
        targetStore,
      });
    },
    async renameSourceSkill({ context, input }) {
      return renameSourceSkill({
        context,
        input,
        skillRepository,
      });
    },
    async deleteSourceSkill({ context, input }) {
      return deleteSourceSkill({
        context,
        input,
        skillRepository,
      });
    },
    async exportSourceSkill({ context, input }) {
      return exportSourceSkill({
        context,
        input,
        skillRepository,
      });
    },
    async importSkillArchiveToMainRepository({ context, input }) {
      return importSkillArchiveToMainRepository({
        context,
        input,
        skillRepository,
      });
    },
    async listSkillBackups({ context }) {
      return listSkillBackups({
        context,
        skillRepository,
      });
    },
    async promoteBackupToSkillSource({ context, input }) {
      return promoteBackupToSkillSource({
        context,
        input,
        skillRepository,
      });
    },
    async deleteBackup({ input }) {
      return deleteBackup({
        input,
        skillRepository,
      });
    },
  };

  if (analyzer) {
    useCases.importSkillToMainRepository = async ({ context, input }) =>
      importSkillToMainRepository({
        context,
        input,
        skillRepository,
        analyzer,
      });
    useCases.installSkillToMainRepository = async ({ context, input }) =>
      installSkillToMainRepository({
        context,
        input,
        skillRepository,
        skillSourceResolver,
        analyzer,
      });
    useCases.applySkillToTarget = async ({ context, input }) =>
      applySkillToTarget({
        context,
        input,
        analyzer,
        targetStore,
      });
  }

  return useCases;
}
