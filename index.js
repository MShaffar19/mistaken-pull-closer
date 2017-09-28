const commentBody = `
Thanks for your submission.

It appears that you've created a pull request using one of our repository's branches. Since this is
almost always a mistake, we're going to go ahead and close this. If it was intentional, please
let us know what you were intending and we can see about reopening it.

Thanks again!
`

async function close (context, params) {
  const closeParams = Object.assign({}, params, {state: 'closed'})

  return context.github.issues.edit(closeParams)
}

async function comment (context, params) {
  return context.github.issues.createComment(params)
}

async function hasPushAccess (context, params) {
  const permissionResponse = await context.github.repos.reviewUserPermissionLevel(params)
  const level = permissionResponse.permission

  return level === 'admin' || level === 'write'
}

module.exports = (robot) => {
  robot.on('pull_request.opened', async context => {
    const {repo} = context.repo()
    const branchLabel = context.payload.pull_request.head.label

    // If the branch label starts with the repo name, then it is a PR from a branch in the local
    // repo
    if (branchLabel.startsWith(repo)) {
      const canPush = await hasPushAccess(context.repo({username: context.payload.pull_request.user.login}))

      // If the user creating the PR from a local branch doesn't have push access, then they
      // can't push to their own PR and it isn't going to be useful
      if (!canPush) {
        await comment(context, context.issue({body: commentBody}))

        return close(context, context.issue())
      }
    }
  })
}
