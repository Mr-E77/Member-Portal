# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README.md with project documentation
- Enhanced project capabilities and feature descriptions
- CHANGELOG.md for tracking project changes
- DEPLOYMENT.md with detailed deployment instructions

### Changed
- Updated repository references to match Member-Portal naming
- Updated Node.js version requirements from 14.x to 18.x/20.x LTS
- Updated npm version requirements from 6.x to 8.x or higher
- Updated GitHub Actions workflow to use latest action versions (checkout@v4, setup-node@v4, configure-aws-credentials@v4)
- Improved CloudFront distribution ID handling to use GitHub secrets
- Enhanced deployment script with error handling (set -e)
- Improved security headers configuration with better CSP example

### Removed
- Deprecated X-XSS-Protection security header

### Fixed
- Changed destructive git reset rollback to safer git revert approach

## [0.1.0] - 2026-01-05

### Added
- Initial project setup
- Basic repository structure
- Project initialization

[Unreleased]: https://github.com/Mr-E77/Member-Portal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Mr-E77/Member-Portal/releases/tag/v0.1.0
