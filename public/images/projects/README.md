# projects/

One folder per project, named with the project `id` from
`src/data/projects.ts`:

```
projects/
├── caregpt-ai/          01-dashboard.jpg  02-main-feature.jpg  03-results.jpg  04-analytics.jpg
├── ai-credit-scoring/   01-dashboard.jpg  02-main-feature.jpg  03-results.jpg  04-analytics.jpg
├── tom-0-1/             01-session.jpg    02-main-feature.jpg
└── password-analyzer/   01-analyzer.jpg   02-generator.jpg
```

The expected filenames are declared in `src/data/projects.ts`. To mark one as
supplied, pass `true` as the fourth argument to `projectShot(...)`:

```ts
projectShot("caregpt-ai", "01-dashboard.jpg", "Dashboard", true)
```

Use 16:9, 1600px wide, and compress to roughly 200 KB each.
