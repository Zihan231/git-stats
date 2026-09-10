export const PROFILE_QUERY = `
  query DeveloperProfile($login: String!, $from: DateTime!, $to: DateTime!, $after: String) {
    user(login: $login) {
      login
      name
      avatarUrl
      bio
      followers { totalCount }
      following { totalCount }
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount weekday }
          }
        }
      }
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        privacy: PUBLIC
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          name
          isFork
          stargazerCount
          forkCount
          owner { login }
          languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name } }
          }
        }
      }
    }
  }
`;
