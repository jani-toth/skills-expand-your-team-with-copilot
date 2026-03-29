document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");
  const difficultyFilters = document.querySelectorAll(".difficulty-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";
  let currentDifficulty = "";
  let currentGroupBy = "";
  let currentView = "cards";

  // Authentication state
  let currentUser = null;

  // Dark mode toggle
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  function applyDarkMode(isDark) {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      darkModeToggle.textContent = "☀️";
      darkModeToggle.title = "Switch to light mode";
      darkModeToggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      document.documentElement.removeAttribute("data-theme");
      darkModeToggle.textContent = "🌙";
      darkModeToggle.title = "Switch to dark mode";
      darkModeToggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  // Load saved preference or use system preference
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));

  darkModeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyDarkMode(!isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
  });

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Before school hours
    afternoon: { start: "15:00", end: "18:00" }, // After school hours
    weekend: { days: ["Saturday", "Sunday"] }, // Weekend days
  };

  // Initialize filters from active elements
  function initializeFilters() {
    // Initialize day filter
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    // Initialize time filter
    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    // Update active class
    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    // Update active class
    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Verify the stored user with the server
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout(); // Clear invalid data
      }
    }

    // Set authentication class on body
    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        // Session invalid, log out
        logout();
        return;
      }

      // Session is valid, update user data
      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
    }

    updateAuthBodyClass();
    // Refresh the activities to update the UI
    fetchActivities();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(
          data.detail || "Invalid username or password",
          "error"
        );
        return false;
      }

      // Login successful
      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  // Close login modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    // Create more skeleton cards to fill the screen since they're smaller now
    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    // If schedule_details is available, use the structured data
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      // Convert 24h time format to 12h AM/PM format for display
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    // Fallback to the string format if schedule_details isn't available
    return details.schedule;
  }

  // Function to determine activity type (this would ideally come from backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    } else if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    } else if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    } else if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    } else if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    // Default to "academic" if no match
    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    // Show loading skeletons first
    showLoadingSkeletons();

    try {
      // Build query string with filters if they exist
      let queryParams = [];

      // Handle day filter
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      // Handle time range filter
      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        // Handle weekend special case
        if (currentTimeRange === "weekend") {
          // Don't add time parameters for weekend filter
          // Weekend filtering will be handled on the client side
        } else if (range) {
          // Add time parameters for before/after school
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      // Save the activities data
      allActivities = activities;

      // Apply search and filter, and handle weekend filter in client
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    // Clear the activities list
    activitiesList.innerHTML = "";

    // If calendar view is active, refresh calendar instead
    if (currentView === "calendar") {
      renderCalendarView(allActivities);
      return;
    }

    // Apply client-side filtering - this handles category filter and search, plus weekend filter
    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      // Apply category filter
      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      // Apply weekend filter if selected
      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      // Apply difficulty filter
      if (currentDifficulty) {
        if (details.difficulty && details.difficulty !== currentDifficulty) {
          return;
        }
      }

      // Apply search filter
      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (
        searchQuery &&
        !searchableContent.includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      // Activity passed all filters, add to filtered list
      filteredActivities[name] = details;
    });

    // Check if there are any results
    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    // If group-by is active, group and render
    if (currentGroupBy === "category") {
      activitiesList.classList.add("grouped");
      const groups = {};
      Object.entries(filteredActivities).forEach(([name, details]) => {
        const type = getActivityType(name, details.description);
        const label = activityTypes[type] ? activityTypes[type].label : "Other";
        if (!groups[label]) groups[label] = {};
        groups[label][name] = details;
      });
      Object.keys(groups).sort().forEach((groupLabel) => {
        const section = document.createElement("div");
        section.className = "group-section";
        section.innerHTML = `<h3 class="group-section-heading">${groupLabel}</h3>`;
        const cardsContainer = document.createElement("div");
        cardsContainer.className = "group-section-cards";
        section.appendChild(cardsContainer);
        activitiesList.appendChild(section);
        Object.entries(groups[groupLabel]).forEach(([name, details]) => {
          renderActivityCard(name, details, cardsContainer);
        });
      });
      return;
    }

    if (currentGroupBy === "day") {
      activitiesList.classList.add("grouped");
      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const groups = {};
      Object.entries(filteredActivities).forEach(([name, details]) => {
        const days = details.schedule_details ? details.schedule_details.days : [];
        const key = days.length > 0 ? days.join(", ") : "Unscheduled";
        if (!groups[key]) groups[key] = {};
        groups[key][name] = details;
      });
      // Sort group keys by first day of week
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        const aIdx = dayOrder.indexOf(a.split(",")[0].trim());
        const bIdx = dayOrder.indexOf(b.split(",")[0].trim());
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });
      sortedKeys.forEach((groupKey) => {
        const section = document.createElement("div");
        section.className = "group-section";
        section.innerHTML = `<h3 class="group-section-heading">${groupKey}</h3>`;
        const cardsContainer = document.createElement("div");
        cardsContainer.className = "group-section-cards";
        section.appendChild(cardsContainer);
        activitiesList.appendChild(section);
        Object.entries(groups[groupKey]).forEach(([name, details]) => {
          renderActivityCard(name, details, cardsContainer);
        });
      });
      return;
    }

    // Default: flat grid
    activitiesList.classList.remove("grouped");
    // Display filtered activities
    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  // Function to build social share URLs for an activity
  function buildShareButtons(name, description) {
    const pageUrl = window.location.href.split("#")[0];
    const shareText = `Check out "${name}" at Mergington High School! ${description}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareText)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + pageUrl)}`;

    return `
      <div class="share-buttons">
        <span class="share-label">Share:</span>
        <a href="${twitterUrl}" target="_blank" rel="noopener noreferrer"
           class="share-btn share-btn-twitter" aria-label="Share on X (Twitter)" title="Share on X (Twitter)">X</a>
        <a href="${facebookUrl}" target="_blank" rel="noopener noreferrer"
           class="share-btn share-btn-facebook" aria-label="Share on Facebook" title="Share on Facebook">FB</a>
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer"
           class="share-btn share-btn-whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp">WA</a>
      </div>
    `;
  }

  // Function to render a single activity card
  function renderActivityCard(name, details, container) {
    const targetContainer = container || activitiesList;
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    // Calculate spots and capacity
    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    // Determine capacity status class
    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    // Determine activity type
    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    // Format the schedule using the new helper function
    const formattedSchedule = formatSchedule(details);

    // Create activity tag
    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    // Create capacity indicator
    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
      ${buildShareButtons(name, details.description)}
    `;

    // Add click handlers for delete buttons
    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add click handler for register button (only when authenticated)
    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    targetContainer.appendChild(activityCard);
  }
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current filter and display filtered activities
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current day filter and fetch activities
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current time filter and fetch activities
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Add event listeners for difficulty filter buttons
  difficultyFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      difficultyFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current difficulty filter and display filtered activities
      currentDifficulty = button.dataset.difficulty;
      displayFilteredActivities();
    });
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    // Add slight delay to trigger animation
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  // Event listener for close button
  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    // Create the confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="confirm-button" class="confirm-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Style the buttons
      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    // Set the message
    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    // Show the dialog
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    // Handle button clicks
    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    // Remove any existing event listeners
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add new event listeners
    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    // Close when clicking outside
    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            // Refresh the activities list
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        // Refresh the activities list after successful signup
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // ===== Group By Feature =====
  const groupFilters = document.querySelectorAll(".group-filter");

  groupFilters.forEach((button) => {
    button.addEventListener("click", () => {
      groupFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentGroupBy = button.dataset.group;
      displayFilteredActivities();
    });
  });

  // ===== Calendar View Feature =====
  const viewCardsBtn = document.getElementById("view-cards-btn");
  const viewCalendarBtn = document.getElementById("view-calendar-btn");
  const calendarView = document.getElementById("calendar-view");

  viewCardsBtn.addEventListener("click", () => {
    currentView = "cards";
    viewCardsBtn.classList.add("active");
    viewCalendarBtn.classList.remove("active");
    activitiesList.classList.remove("hidden");
    calendarView.classList.add("hidden");
  });

  viewCalendarBtn.addEventListener("click", () => {
    currentView = "calendar";
    viewCalendarBtn.classList.add("active");
    viewCardsBtn.classList.remove("active");
    activitiesList.classList.add("hidden");
    calendarView.classList.remove("hidden");
    renderCalendarView(allActivities);
  });

  // Render calendar view from activities data
  function renderCalendarView(activities) {
    calendarView.innerHTML = "";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const daysFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Calendar runs 6:00 AM to 9:00 PM (15 hours)
    const START_HOUR = 6;
    const END_HOUR = 21;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const ROW_HEIGHT = 40; // px per hour

    // Build the grid wrapper
    const grid = document.createElement("div");
    grid.className = "calendar-grid";
    grid.style.gridTemplateRows = `auto repeat(${TOTAL_HOURS}, ${ROW_HEIGHT}px)`;

    // Header row: empty corner + day labels
    const corner = document.createElement("div");
    corner.className = "calendar-header-cell";
    corner.textContent = "";
    grid.appendChild(corner);

    days.forEach((day) => {
      const header = document.createElement("div");
      header.className = "calendar-header-cell";
      header.textContent = day;
      grid.appendChild(header);
    });

    // Time label rows + day columns
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      const timeLabel = document.createElement("div");
      timeLabel.className = "calendar-time-label";
      const displayHour = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      timeLabel.textContent = `${displayHour}${ampm}`;
      grid.appendChild(timeLabel);

      for (let d = 0; d < 7; d++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day-column";
        cell.dataset.day = d;
        cell.dataset.hour = hour;
        grid.appendChild(cell);
      }
    }

    calendarView.appendChild(grid);

    // Now place activity events on the grid
    // Collect events per day to handle overlaps
    const eventsByDay = Array.from({ length: 7 }, () => []);

    // Apply same filters as card view before showing on calendar
    Object.entries(activities).forEach(([name, details]) => {
      if (!details.schedule_details) return;

      const activityType = getActivityType(name, details.description);
      if (currentFilter !== "all" && activityType !== currentFilter) return;
      if (currentDifficulty && details.difficulty && details.difficulty !== currentDifficulty) return;
      if (searchQuery) {
        const searchableContent = [
          name.toLowerCase(),
          details.description.toLowerCase(),
          formatSchedule(details).toLowerCase(),
        ].join(" ");
        if (!searchableContent.includes(searchQuery.toLowerCase())) return;
      }

      const { days: actDays, start_time, end_time } = details.schedule_details;

      actDays.forEach((dayName) => {
        const dayIndex = daysFull.indexOf(dayName);
        if (dayIndex === -1) return;

        const parseTime = (t) => {
          const [h, m] = t.split(":").map(Number);
          return h + m / 60;
        };

        const startDecimal = parseTime(start_time);
        const endDecimal = parseTime(end_time);
        const clampedStart = Math.max(startDecimal, START_HOUR);
        const clampedEnd = Math.min(endDecimal, END_HOUR);
        if (clampedEnd <= clampedStart) return;

        eventsByDay[dayIndex].push({ name, details, startDecimal: clampedStart, endDecimal: clampedEnd, activityType });
      });
    });

    // Place events in the grid
    eventsByDay.forEach((dayEvents, dayIndex) => {
      if (dayEvents.length === 0) return;

      // Sort by start time
      dayEvents.sort((a, b) => a.startDecimal - b.startDecimal);

      // Group overlapping events into columns
      const columns = [];
      dayEvents.forEach((ev) => {
        let placed = false;
        for (let col = 0; col < columns.length; col++) {
          const lastInCol = columns[col][columns[col].length - 1];
          if (lastInCol.endDecimal <= ev.startDecimal) {
            columns[col].push(ev);
            ev._col = col;
            placed = true;
            break;
          }
        }
        if (!placed) {
          ev._col = columns.length;
          columns.push([ev]);
        }
      });

      const numCols = columns.length;

      dayEvents.forEach((ev) => {
        const topPx = (ev.startDecimal - START_HOUR) * ROW_HEIGHT;
        const heightPx = (ev.endDecimal - ev.startDecimal) * ROW_HEIGHT;

        // Find the grid cell for this day column at the start hour row
        // Grid rows: row 1 = header, rows 2..(TOTAL_HOURS+1) = hour rows
        const rowStart = Math.floor(ev.startDecimal - START_HOUR) + 2;
        const colStart = dayIndex + 2; // +2: col 1 is time label

        // Find the actual cell element
        const cell = grid.querySelector(
          `.calendar-day-column[data-day="${dayIndex}"][data-hour="${Math.floor(ev.startDecimal)}"]`
        );
        if (!cell) return;

        // Position the event relative to the column's containing cell
        // We'll use the grid area with absolute positioning within that cell
        const eventEl = document.createElement("div");
        eventEl.className = "calendar-event";

        const typeInfo = activityTypes[ev.activityType];
        eventEl.style.backgroundColor = typeInfo.color;
        eventEl.style.color = typeInfo.textColor;
        eventEl.style.borderLeft = `3px solid ${typeInfo.textColor}`;

        // Calculate position across multiple rows
        // We place a single event div that spans multiple row heights
        // using absolute position relative to the cell's position
        const startOffset = (ev.startDecimal - Math.floor(ev.startDecimal)) * ROW_HEIGHT;
        eventEl.style.top = `${startOffset}px`;
        eventEl.style.height = `${heightPx}px`;

        // Handle overlapping columns
        const colWidth = 100 / numCols;
        eventEl.style.left = `${ev._col * colWidth + 1}%`;
        eventEl.style.right = `${100 - (ev._col + 1) * colWidth + 1}%`;
        eventEl.style.width = "auto";

        const enrolled = ev.details.participants.length;
        const spotsLeft = ev.details.max_participants - enrolled;

        const formatTime12 = (t) => {
          const [h, m] = t.split(":").map(Number);
          const period = h >= 12 ? "PM" : "AM";
          const displayH = h % 12 || 12;
          return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
        };

        const startFmt = formatTime12(ev.details.schedule_details.start_time);
        const endFmt = formatTime12(ev.details.schedule_details.end_time);

        eventEl.innerHTML = `
          <span>${ev.name}</span>
          <span style="opacity:0.8;font-size:0.6rem;">${enrolled}/${ev.details.max_participants}</span>
          <div class="cal-tooltip">
            <strong>${ev.name}</strong><br>
            ${startFmt} – ${endFmt}<br>
            ${enrolled} enrolled, ${spotsLeft} spots left<br>
            <em style="font-size:0.7rem">${ev.details.description.substring(0, 60)}${ev.details.description.length > 60 ? "…" : ""}</em>
          </div>
        `;

        // Make cell relatively positioned if not already
        cell.style.position = "relative";
        cell.style.overflow = "visible";
        cell.appendChild(eventEl);
      });
    });
  }

  // Initialize app
  checkAuthentication();
  initializeFilters();
  fetchActivities();
});
