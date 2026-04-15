#!/usr/bin/env bash
# check-consumers.sh — audit consumer apps against UI design rules §11/§12/§13.
#
# For every app directory under ~/Git that has a web/ root, verify:
#   1. Every symlink under web/ resolves to a real target.
#      (Catches the wlmonitor bug: `web/assets -> ~/Git/css/assets` pointing
#       at a non-existent path.)
#   2. If any template under web/ or inc/ uses `.app-header`, at least one CSS
#      file under web/ declares `body { ... padding-top: ... }`. Rule §12
#      requires this because the shared `.app-header` is position: fixed.
#   3. Same for `.app-footer` → `padding-bottom` (rule §13).
#
# Exits 0 on success, non-zero if any violations were found. Prints one line
# per violation. Safe to run from a pre-commit hook or CI.

set -euo pipefail

git_root="${HOME}/Git"
violations=0

report() {
    printf '  ✗ %s\n' "$1"
    violations=$((violations + 1))
}

check_symlinks() {
    local app_dir="$1"
    local web="${app_dir}/web"
    [[ -d $web ]] || return 0
    while IFS= read -r link; do
        if [[ ! -e $link ]]; then
            local target
            target=$(readlink "$link")
            report "broken symlink: ${link#${git_root}/} -> ${target}"
        fi
    done < <(find "$web" -type l 2>/dev/null)
}

uses_class() {
    # grep returns 0 on match, 1 on no-match. Swallow "no match" but surface
    # any other error.
    local class="$1" app_dir="$2"
    local found=1
    while IFS= read -r -d '' f; do
        if grep -q -- "$class" "$f" 2>/dev/null; then
            found=0
            break
        fi
    done < <(find "${app_dir}/web" "${app_dir}/inc" -type f \
                 \( -name '*.php' -o -name '*.html' \) -print0 2>/dev/null)
    return $found
}

css_has_body_rule() {
    # Look for `body { ... <prop>: ... }` in any *.css under web/. We tolerate
    # attribute order and whitespace; we just need a `body` selector that sets
    # the property.
    local prop="$1" app_dir="$2"
    while IFS= read -r -d '' css; do
        # Pull every `body { ... }` block, check if it sets $prop.
        if awk -v prop="$prop" '
            /^[[:space:]]*body[[:space:]]*\{/ { inblock=1 }
            inblock && index($0, prop ":")    { found=1 }
            inblock && /\}/                   { inblock=0 }
            END { exit found ? 0 : 1 }
        ' "$css"; then
            return 0
        fi
    done < <(find "${app_dir}/web" -type f -name '*.css' -print0 2>/dev/null)
    return 1
}

check_body_padding() {
    local app_dir="$1"
    if uses_class '\.app-header\|class="app-header"' "$app_dir"; then
        css_has_body_rule 'padding-top' "$app_dir" \
            || report "uses .app-header but no body { padding-top } in web/**/*.css (rule §12)"
    fi
    if uses_class '\.app-footer\|class="app-footer"' "$app_dir"; then
        css_has_body_rule 'padding-bottom' "$app_dir" \
            || report "uses .app-footer but no body { padding-bottom } in web/**/*.css (rule §13)"
    fi
}

check_app() {
    local app_dir="$1"
    [[ -d "${app_dir}/web" ]] || return 0
    [[ -f "${app_dir}/.no-ui-rules" ]] && return 0
    printf '→ %s\n' "${app_dir#${git_root}/}"
    check_symlinks "$app_dir"
    check_body_padding "$app_dir"
}

# Discover apps: any ~/Git/<name> that has a web/ subdirectory.
for app in "$git_root"/*/; do
    app="${app%/}"
    check_app "$app"
done

echo
if (( violations > 0 )); then
    printf '%d violation(s) found.\n' "$violations"
    exit 1
fi
echo "All consumer apps clean."
