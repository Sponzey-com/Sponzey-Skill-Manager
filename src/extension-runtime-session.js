export function createRuntimeSession({ initialComposition = null, compose }) {
  let currentComposition = initialComposition;

  return {
    getComposition() {
      return currentComposition;
    },
    async recompose() {
      if (typeof compose !== "function") {
        return {
          ok: false,
          diagnostics: [
            {
              code: "runtime-recompose-unavailable",
              severity: "error",
              message: "Runtime recomposition is unavailable.",
            },
          ],
          events: [
            {
              level: "ProductLog",
              code: "runtime.recompose.failed",
              reason: "runtime-recompose-unavailable",
            },
          ],
          steps: ["RecomposeRequested", "RecomposeUnavailable"],
        };
      }

      const steps = ["ReadingSettings"];
      const nextComposition = await compose();
      steps.push("BuildingRuntimeContext");

      if (!nextComposition) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "runtime-recompose-failed",
              severity: "error",
              message: "Runtime recomposition did not return a composition.",
            },
          ],
          events: [
            {
              level: "ProductLog",
              code: "runtime.recompose.failed",
              reason: "runtime-recompose-failed",
            },
          ],
          steps: [...steps, "RuntimeRebuildFailed"],
        };
      }

      currentComposition = nextComposition;
      steps.push("RewiringHandlers");
      steps.push("RefreshingTree");

      return {
        ok: nextComposition.ok !== false,
        composition: nextComposition,
        diagnostics: nextComposition.diagnostics ?? [],
        events: [
          {
            level: "ProductLog",
            code:
              nextComposition.ok === false
                ? "runtime.recompose.failed"
                : "runtime.recompose.completed",
          },
          {
            level: "FieldDebugLog",
            code: "runtime.recompose.step",
            steps: [...steps, "Completed"],
          },
        ],
        steps: [...steps, "Completed"],
      };
    },
  };
}

export function createRuntimeSessionCommandHandlers({ session, fallbackHandlers }) {
  const fallback = fallbackHandlers ?? {};
  return Object.fromEntries(
    Object.keys(fallback).map((commandId) => [
      commandId,
      async (input) => {
        const composition = session?.getComposition?.();
        const handler = composition?.commandHandlers?.[commandId] ?? fallback[commandId];

        if (typeof handler !== "function") {
          return {
            ok: false,
            code: "command-not-wired",
            commandId,
          };
        }

        return handler(input);
      },
    ]),
  );
}
