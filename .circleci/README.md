# SageCI 🧙‍♂️

Our CI processes are handled by
[CircleCI](https://app.circleci.com/pipelines/github/evolution-virtual/vysta-platform-monorepo).
There you can see the status of the builds and the tests for every backend and
frontend service in this monorepo.

All jobs are automatically generated according to what packages we have in the
monorepo and what is their ci configuration.

## How it works ❓

The first job, as defined in the [config.yml](./config.yml) file, is always a
`setup` job that will parse the monorepo structure and the packages
configurations to generate a new workflow for all jobs.

The generated workflow will always have the following jobs:

- `bootstrap` - Installs all dependencies, builds the shared libraries and
  caches everything for future jobs
- `allow-prod-release` - Runs the prod deploys for jobs that have already ran
  their respective staging deploys

The way it generates the jobs is that it will first check if the package has a
`sageCi` property in its package.json that has an `active` property set to
`true`. If it does, it will generate a job for it.

The jobs generated by default are the following:

- `release` - Start running the jobs for this package
- `build` - Tests and builds the package
- `deploy-$STAGE` - Deploys the package to the specified stage (staging or
  production)

If more jobs are needed (such as iOS and Windows deploys), they can be added to
the package's `sageCi` property.

## How to add a new package to the CI ➕

1. Add a new package to the monorepo
2. In this new package's package.json, add:

```json
"sageCi": {
  "active": true
}
```

3. Commit and push the changes
4. _(optional)_ - If you want your package to have different deploys (like iOS
   and Windows), you can add more properties to this object. To see all
   properties and what is accepted, please refer to the properties documented in
   [the config class](./src/config.ts)

## How to change how the CI works ⚒

In the [generation script](./src/index.ts) you can see how the CI is generated.

Every reusable command, executor, job and orb is neatly configured under this
folder. If necessary, you can easily find them by what they are + their name.
For example, the `configure-aws` command is under `commands/configure-aws.ts`.

If you need to add new commands, executors, jobs or orbs, don't forget to add
them to their respective index file so they can be exported and used in the
generation script.

## Possible Improvements 😁

We may want to only generate the jobs for the packages that have changed since
the last build. This would reduce the amount of jobs that are run and would make
the builds faster.

CircleCI has documentation for a
[path filtering job](https://circleci.com/docs/using-dynamic-configuration/#config)
that checks the changed files against a branch and defines variables for each
job that can be used to filter the jobs.

If this job doesn't work due to possible limitations, another way to do this
could be to programatically get the diff between the HEAD and the last build
commit and check if the changed files are in the package's folder. If they are,
then we can generate the jobs for that package.

## References 📚

- [CircleCI Config SDK](https://circleci-public.github.io/circleci-config-sdk-ts/)
- [Dynamic Configuration Docs](https://circleci.com/docs/using-dynamic-configuration/)