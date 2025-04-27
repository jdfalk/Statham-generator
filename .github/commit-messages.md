# Conventional Commits Guide

## Format

Use this template for your conventional commits:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

Use these standardized types to categorize your changes:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect code meaning (formatting, white-space, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `build`: Changes to build system or external dependencies
- `ci`: Changes to CI configuration and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## Description Guidelines

- Use imperative, present tense ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Keep descriptions concise (50 chars or less)
- Be specific and clear about what changed including file names and links to files
- List all files that were changed in the body of the commit message
- Use bullet points for multiple files or changes
- Avoid vague terms like "fixes" or "updates" without context
- Ensure commit messages are formatted consistently

## Body Guidelines

- Use imperative, present tense
- Include motivation for the change
- Contrast with previous behavior
- Use blank line to separate from description
- Wrap at 72 characters
- Summarize the commits as the first line

## Footer Guidelines

- Use for referencing ACTUAL issues: `Fixes #123` or `Closes #456`
- Never reference fictional issue numbers - only include references to real issues
- Breaking changes must start with `BREAKING CHANGE:` followed by explanation
- Reference ticket numbers as: `[#123]` or specific project format

## Breaking Changes

Indicate breaking changes either:

- With `!` after type/scope: `feat(api)!: remove deprecated endpoints`
- In footer: `BREAKING CHANGE: environment variables now use different naming convention`

## Scope Guidelines

- Use consistent scope names throughout the project
- Keep scopes lowercase
- Use short nouns describing the affected component
- Common scopes: api, auth, core, ui, config, etc.

## Special Instructions

- For multi-line commit messages, ensure proper formatting with `-m` flag or by writing in commit editor
- Never add issue references unless they're for actual issues in your project

## Examples

> **Note:** The examples below show the format - replace issue numbers with actual issues from your project or omit the reference entirely.

```text
feat(auth): add SSO login option

Implement single sign-on login functionality using OAuth2

Closes #ISSUE_NUMBER  # Only include if there's an actual issue
```

```text
fix(api): prevent race condition in user creation

The previous implementation allowed concurrent requests to create
duplicate users with the same email address.

Fixes #ISSUE_NUMBER  # Only include if there's an actual issue
```

```text
docs: update README with new API endpoints
```

```text
feat(api)!: change response format to JSON API spec

BREAKING CHANGE: API responses now follow JSON API specification.
Clients will need to update their parsers.
```

```text
refactor(core): simplify error handling logic
```
