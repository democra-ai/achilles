# Privacy Policy — Achilles Vault

**Effective Date:** March 20, 2026

## Overview

Achilles Vault is a local-first secret management tool. Your privacy is fundamental to our design — all data stays on your device.

## Data Collection

**Achilles Vault does not collect, transmit, or store any personal data.** Specifically:

- No user accounts or registration required
- No analytics or telemetry
- No crash reporting sent to external servers
- No network requests to our servers
- No cookies or tracking
- No advertising

## Data Storage

All secrets, credentials, and configuration data are stored **exclusively on your local machine** using AES-256-GCM encryption. Data is never uploaded to any cloud service.

- Vault database: `~/.achilles/vault.db` (encrypted)
- Configuration: `~/.achilles/config.json`
- Audit logs: stored locally only

## Network Access

The app requires local network access (`127.0.0.1`) solely for communication between the frontend interface and the local backend server running on your machine. No external network connections are made.

## Third-Party Services

Achilles Vault does not integrate with or send data to any third-party services, analytics platforms, or advertising networks.

## Children's Privacy

We do not knowingly collect any information from anyone, including children under the age of 13.

## Changes to This Policy

If we update this policy, changes will be posted to this page with an updated effective date.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/tao-shen/achilles/issues
