#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

USER_DATA_DIR="${SPONZEY_VSCODE_USER_DATA_DIR:-/tmp/sponzey-skills-manager-vscode-user}"
EXTENSIONS_DIR="${SPONZEY_VSCODE_EXTENSIONS_DIR:-/tmp/sponzey-skills-manager-vscode-exts}"
WORKSPACE_DIR="${1:-${PROJECT_ROOT}}"

resolve_code_bin() {
  if [[ -n "${CODE_BIN:-}" ]]; then
    if [[ -x "${CODE_BIN}" || -n "$(command -v "${CODE_BIN}" 2>/dev/null)" ]]; then
      echo "${CODE_BIN}"
      return 0
    fi

    return 1
  fi

  for command_name in code code-insiders; do
    if command -v "${command_name}" >/dev/null 2>&1; then
      command -v "${command_name}"
      return 0
    fi
  done

  local candidates=(
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
    "${HOME}/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
    "/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code"
    "${HOME}/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -x "${candidate}" ]]; then
      echo "${candidate}"
      return 0
    fi
  done

  return 1
}

if ! RESOLVED_CODE_BIN="$(resolve_code_bin)"; then
  echo "VSCode command not found." >&2
  echo "Install the 'code' shell command from VSCode, or set CODE_BIN=/path/to/code." >&2
  echo "Common macOS path: /Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" >&2
  exit 1
fi

mkdir -p "${USER_DATA_DIR}" "${EXTENSIONS_DIR}"

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  (
    cd "${PROJECT_ROOT}"
    npm run build
  )
fi

exec "${RESOLVED_CODE_BIN}" \
  --new-window \
  --extensionDevelopmentPath="${PROJECT_ROOT}" \
  --user-data-dir "${USER_DATA_DIR}" \
  --extensions-dir "${EXTENSIONS_DIR}" \
  "${WORKSPACE_DIR}"
