# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased · 2026-10-30

- Help/version exit before Git access; unknown options fail instead of committing. Previously, `--help` could create a commit.
- JSON stdout is parseable for previews, empty indexes and real commits. Commit logs go to stderr in JSON mode; add `--dry-run` to preview without committing.
- Read NUL-delimited staged paths and pass Git arguments directly, preserving Unicode, whitespace and literal special characters.
- Git read failures return nonzero rather than masquerading as an empty successful index.
- Validation: 14 existing checks plus 7 real-CLI scenarios passed on Windows / Node.js 24.18.0. npm release version is unchanged.

## [1.0.0] - 2026-08-19

### Added
- Automatic commit type detection (feat, fix, docs, test, style, chore, ci, build)
- Scope detection from file paths
- Conventional commit message generation
- Dry-run mode (--dry-run)
- JSON output mode (--json)
- Quiet mode (--quiet)
- Dual alias (git-format / gf)
- Test suite (14 tests)
- Bilingual README (English + Chinese)
