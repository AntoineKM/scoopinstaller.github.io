/**
 * Configuration for the Azure Search API used by the Scoop website
 */

export const API_CONFIG = {
  // Base URL for the Azure Search API
  url: "https://scoopsearch.search.windows.net",
  // Index name
  index: "apps",
  
  // API key for development purposes
  // This key is public in the original repository
  key: "78CB5DCD0A7ABACE5B4DC3C34BC54C8F",
  
  // API version to use
  version: "2020-06-30",
  
  // Sort mode configurations
  sortModes: [
    {
      DisplayName: "Best match",
      DefaultSortDirection: 1, // Descending
      OrderBy: {
        0: ["search.score() asc", "Metadata/OfficialRepositoryNumber asc", "NameSortable desc"],
        1: ["search.score() desc", "Metadata/OfficialRepositoryNumber desc", "NameSortable asc"],
      },
    },
    {
      DisplayName: "Name",
      DefaultSortDirection: 0, // Ascending
      OrderBy: {
        0: [
          "NameSortable asc",
          "Metadata/OfficialRepositoryNumber desc",
          "Metadata/RepositoryStars desc",
          "Metadata/Committed desc",
        ],
        1: [
          "NameSortable desc",
          "Metadata/OfficialRepositoryNumber asc",
          "Metadata/RepositoryStars asc",
          "Metadata/Committed asc",
        ],
      },
    },
    {
      DisplayName: "Newest",
      DefaultSortDirection: 1, // Descending
      OrderBy: {
        0: [
          "Metadata/Committed asc",
          "Metadata/OfficialRepositoryNumber asc",
          "Metadata/RepositoryStars asc",
        ],
        1: [
          "Metadata/Committed desc",
          "Metadata/OfficialRepositoryNumber desc",
          "Metadata/RepositoryStars desc",
        ],
      },
    },
  ],
  
  // Helpers to create API requests
  getSearchUrl: function() {
    return `${this.url}/indexes/${this.index}/docs/search?api-version=${this.version}`;
  },
  
  getSearchHeaders: function() {
    return {
      "Content-Type": "application/json",
      "api-key": this.key,
    };
  }
};