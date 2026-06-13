import { Octokit } from '@octokit/rest';

export async function getPRDiff(octokit: Octokit, owner: string, repo: string, pullNumber: number): Promise<string> {
  const { data: diff } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: {
      format: 'diff'
    }
  });
  return diff as unknown as string;
}

export async function createReviewComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  commitId: string,
  path: string,
  line: number,
  body: string
) {
  await octokit.pulls.createReviewComment({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitId,
    path,
    line,
    body,
    side: 'RIGHT'
  });
}

export async function createSummaryComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  });
}

export async function getPRDetails(octokit: Octokit, owner: string, repo: string, pullNumber: number) {
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber
  });
  return pr;
}
