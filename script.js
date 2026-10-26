const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById(
  "usernameInput"
);

const themeButton = document.getElementById(
  "themeButton"
);

const clearHistoryButton = document.getElementById(
  "clearHistoryButton"
);

const profileSection = document.getElementById(
  "profileSection"
);

const loading = document.getElementById("loading");
const errorMessage = document.getElementById(
  "errorMessage"
);

const avatar = document.getElementById("avatar");
const profileName = document.getElementById(
  "profileName"
);
const profileUsername = document.getElementById(
  "profileUsername"
);
const profileBio = document.getElementById(
  "profileBio"
);
const profileLink = document.getElementById(
  "profileLink"
);

const locationElement = document.getElementById(
  "location"
);
const companyElement = document.getElementById(
  "company"
);
const joinedDateElement = document.getElementById(
  "joinedDate"
);

const followers = document.getElementById("followers");
const following = document.getElementById("following");
const repositories = document.getElementById(
  "repositories"
);
const gists = document.getElementById("gists");

const repositoryCount = document.getElementById(
  "repositoryCount"
);
const repositoryList = document.getElementById(
  "repositoryList"
);

const historyList = document.getElementById(
  "historyList"
);

const toast = document.getElementById("toast");

let searchHistory = JSON.parse(
  localStorage.getItem("githubSearchHistory")
) || [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function formatNumber(number) {
  return Number(number).toLocaleString();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}

function setText(element, value, fallback) {
  element.textContent = value || fallback;
}

function showLoading() {
  loading.classList.remove("hidden");
  profileSection.classList.add("hidden");
  errorMessage.textContent = "";
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showError(message) {
  hideLoading();
  profileSection.classList.add("hidden");
  errorMessage.textContent = message;
}

async function fetchProfile(username) {
  const profileResponse = await fetch(
    `https://api.github.com/users/${encodeURIComponent(
      username
    )}`
  );

  if (!profileResponse.ok) {
    if (profileResponse.status === 404) {
      throw new Error("GitHub user was not found.");
    }

    if (profileResponse.status === 403) {
      throw new Error(
        "GitHub API rate limit reached. Try again later."
      );
    }

    throw new Error("Unable to load this profile.");
  }

  const profile = await profileResponse.json();

  const repositoriesResponse = await fetch(
    `https://api.github.com/users/${encodeURIComponent(
      username
    )}/repos?sort=stars&direction=desc&per_page=6`
  );

  const userRepositories = repositoriesResponse.ok
    ? await repositoriesResponse.json()
    : [];

  return {
    profile,
    repositories: userRepositories
  };
}

function displayProfile(data) {
  const { profile, repositories: userRepositories } =
    data;

  avatar.src = profile.avatar_url;
  avatar.alt = `${profile.login} profile avatar`;

  setText(
    profileName,
    profile.name,
    profile.login
  );

  profileUsername.textContent = `@${profile.login}`;

  setText(
    profileBio,
    profile.bio,
    "This user has not added a bio."
  );

  profileLink.href = profile.html_url;

  locationElement.textContent = profile.location
    ? `📍 ${profile.location}`
    : "📍 Location not provided";

  companyElement.textContent = profile.company
    ? `🏢 ${profile.company}`
    : "🏢 Company not provided";

  joinedDateElement.textContent = profile.created_at
    ? `📅 Joined ${formatDate(profile.created_at)}`
    : "📅 Join date unavailable";

  followers.textContent = formatNumber(
    profile.followers
  );

  following.textContent = formatNumber(
    profile.following
  );

  repositories.textContent = formatNumber(
    profile.public_repos
  );

  gists.textContent = formatNumber(
    profile.public_gists
  );

  repositoryCount.textContent = `${
    userRepositories.length
  } ${
    userRepositories.length === 1
      ? "repository"
      : "repositories"
  }`;

  renderRepositories(userRepositories);

  profileSection.classList.remove("hidden");
}

function renderRepositories(userRepositories) {
  repositoryList.innerHTML = "";

  if (userRepositories.length === 0) {
    repositoryList.innerHTML = `
      <p class="empty-message">
        No public repositories found.
      </p>
    `;

    return;
  }

  userRepositories.forEach((repository) => {
    const card = document.createElement("article");
    card.className = "repository-card";

    const title = document.createElement("h3");
    const link = document.createElement("a");

    link.href = repository.html_url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = repository.name;

    title.appendChild(link);

    const description = document.createElement("p");
    description.textContent =
      repository.description ||
      "No description provided.";

    const meta = document.createElement("div");
    meta.className = "repository-meta";

    const language = document.createElement("span");
    language.textContent = repository.language
      ? `💻 ${repository.language}`
      : "💻 N/A";

    const stars = document.createElement("span");
    stars.textContent = `⭐ ${formatNumber(
      repository.stargazers_count
    )}`;

    const forks = document.createElement("span");
    forks.textContent = `🍴 ${formatNumber(
      repository.forks_count
    )}`;

    meta.append(language, stars, forks);
    card.append(title, description, meta);
    repositoryList.appendChild(card);
  });
}

function saveSearch(username) {
  searchHistory = [
    username,
    ...searchHistory.filter(
      (item) => item.toLowerCase() !== username.toLowerCase()
    )
  ].slice(0, 8);

  localStorage.setItem(
    "githubSearchHistory",
    JSON.stringify(searchHistory)
  );

  renderSearchHistory();
}

function renderSearchHistory() {
  historyList.innerHTML = "";

  if (searchHistory.length === 0) {
    historyList.innerHTML = `
      <p class="empty-message">
        No recent searches yet.
      </p>
    `;

    return;
  }

  searchHistory.forEach((username) => {
    const button = document.createElement("button");

    button.className = "history-user";
    button.textContent = `@${username}`;

    button.addEventListener("click", () => {
      usernameInput.value = username;
      searchUser(username);
    });

    historyList.appendChild(button);
  });
}

function clearHistory() {
  searchHistory = [];
  localStorage.removeItem("githubSearchHistory");
  renderSearchHistory();
  showToast("Search history cleared");
}

async function searchUser(username) {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    showError("Please enter a GitHub username.");
    return;
  }

  showLoading();

  try {
    const profileData = await fetchProfile(
      cleanUsername
    );

    hideLoading();
    displayProfile(profileData);
    saveSearch(cleanUsername);
    showToast("Profile loaded successfully");
  } catch (error) {
    showError(error.message);
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(
    "githubFinderTheme"
  );

  if (savedTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    themeButton.textContent = "☀️";
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchUser(usernameInput.value);
});

clearHistoryButton.addEventListener(
  "click",
  clearHistory
);

themeButton.addEventListener("click", () => {
  const isDark =
    document.body.getAttribute("data-theme") === "dark";

  if (isDark) {
    document.body.removeAttribute("data-theme");
    themeButton.textContent = "🌙";

    localStorage.setItem(
      "githubFinderTheme",
      "light"
    );
  } else {
    document.body.setAttribute("data-theme", "dark");
    themeButton.textContent = "☀️";

    localStorage.setItem(
      "githubFinderTheme",
      "dark"
    );
  }
});

loadTheme();
renderSearchHistory();