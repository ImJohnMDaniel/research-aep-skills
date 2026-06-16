# sf-aep-skills Extension: Distribution & Update Strategy

This document outlines the recommended approach for distributing the `sf-aep-skills` Gemini extension to developer teams and managing future updates.

## Distribution Methods

| Method | Best For | Workflow |
| :--- | :--- | :--- |
| **Direct Git Install** | **Primary Method** for general distribution. | Teams run `gemini extensions install <gitlab-url>`. |
| **Workspace-Scoped** | Project-specific mandatory tools. | Commit source to `.gemini/extensions/` in the target repo. |
| **Pre-built Archive** | Performance-optimized installs. | Host `.tar.gz` archives on GitLab Releases. |

### 1. Git-based Installation (Recommended)
Leverage the existing GitLab Enterprise infrastructure. The CLI uses the local system's `git` binary, respecting established SSH or PAT credentials.

*   **Installation Command:**
    ```bash
    gemini extensions install git@gitlab.yourcompany.com:group/sf-aep-skills.git
    ```
*   **Version Control:** Use the `--ref` flag to pin to specific tags or branches:
    *   `--ref v1.0.0` (Stable releases)
    *   `--ref develop` (Beta testing)

## Update & Maintenance Workflow

### Update Mechanism
1.  **Manual Update:** Developers run `gemini extensions update sf-aep-skills`.
2.  **Auto-Update:** Install with the `--auto-update` flag to enable background checks.
3.  **Session Refresh:** Use `/skills reload` within the CLI to activate changes without a restart.

### Release Process
*   **Versioning:** Adhere to Semantic Versioning (SemVer).
*   **GitLab Tags:** Create tags in GitLab for every stable release.
*   **Manifest:** Maintain the `gemini-extension.json` file with accurate versioning and dependency metadata.
*   **CI/CD:** Utilize GitLab CI to validate Apex patterns and skill logic before merging to `main`.

## Implementation Considerations
*   **Security Allowlist:** If restricted, add the GitLab domain to `security.allowedExtensions` in the global `settings.json`.
*   **Authentication:** Ensure developers have SSH keys or PATs configured in their Git Credential Manager.
*   **Configuration:** Use `gemini extensions config sf-aep-skills` for setting extension-specific environment variables.
