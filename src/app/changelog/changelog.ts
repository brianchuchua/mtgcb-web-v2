interface Release {
  date: string;
  version: string;
  changes: string[];
}

interface ChangelogData {
  releases: Release[];
}

const changelogData: ChangelogData = {
  releases: [
    {
      date: '2025-08-02',
      version: '0.90.0',
      changes: ['Added support for nested locations'],
    },
  ],
};

export default changelogData;
