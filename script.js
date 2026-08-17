(function () {
  const defaultPlayers = [
    "Nils",
    "Tiernan",
    "Ethan",
    "Declan",
    "Dave",
    "Robert",
    "Ger",
    "Pat",
  ];

  const elements = {
    playerForm: document.getElementById("player-form"),
    playerInput: document.getElementById("player-name"),
    playerList: document.getElementById("player-list"),
    startRoundButton: document.getElementById("start-round"),
    resetButton: document.getElementById("reset-players"),
    matchSummary: document.getElementById("match-summary"),
    winnerActions: document.getElementById("winner-actions"),
    queueList: document.getElementById("queue-list"),
    bullOffActions: document.getElementById("bull-off-actions"),
  };

  let players = [...defaultPlayers];
  let queue = [];
  let currentMatch = [];

  function buildQueueFromPlayers() {
    const teams = [];

    for (let i = 0; i + 1 < players.length; i += 2) {
      teams.push([players[i], players[i + 1]]);
    }

    if (players.length % 2 !== 0) {
      teams.push([players[players.length - 1]]);
    }

    return teams;
  }

  function teamKey(team) {
    return team.join(" & ");
  }

  function teamLabel(team) {
    return team.join(" & ");
  }

  function isWaitingForBullOffChoice() {
    const action = getQueueAction();
    return action?.kind === "fill-singleton";
  }

  function renderPlayers() {
    elements.playerList.innerHTML = players.length
      ? players
          .map((player) => `<li class="player-pill">${player}</li>`)
          .join("")
      : '<li class="empty">No players added yet.</li>';
  }

  function renderQueueList() {
    if (!queue.length) {
      elements.queueList.innerHTML =
        '<li class="empty">No matches queued yet.</li>';
      return;
    }

    elements.queueList.innerHTML = queue
      .map(
        (team, index) => `
          <li class="waiting-team">
            <span class="queue-number">${index + 1}</span>
            <span>${team.join(" & ")}</span>
          </li>
        `,
      )
      .join("");
  }

  function getQueueAction() {
    if (!queue.length) {
      return null;
    }

    const nextTeam = queue[0];
    const followingTeam = queue[1];

    if (
      nextTeam &&
      nextTeam.length === 1 &&
      followingTeam &&
      followingTeam.length === 2
    ) {
      return {
        kind: "fill-singleton",
        singleton: nextTeam[0],
        pair: [...followingTeam],
      };
    }

    return null;
  }

  function renderBullOffUI() {
    const action = getQueueAction();
    if (!action || action.kind !== "fill-singleton") {
      elements.bullOffActions.innerHTML = "";
      return;
    }

    const [first, second] = action.pair;
    elements.bullOffActions.innerHTML = `
      <p class="bull-off-instruction">
        Choose who joins ${action.singleton} from ${first} and ${second}.
      </p>
      <div class="bull-off-options">
        <button type="button" class="join-player" data-player="${first}">${first}</button>
        <button type="button" class="join-player" data-player="${second}">${second}</button>
      </div>
    `;
  }

  function resolveQueueJoin(playerName) {
    const action = getQueueAction();
    if (!action || action.kind !== "fill-singleton") {
      return;
    }

    const [first, second] = action.pair;
    const chosen = playerName === first ? first : second;
    const leftover = playerName === first ? second : first;

    queue = [[action.singleton, chosen], [leftover], ...queue.slice(2)];
    render();
  }

  function renderWinnerButtons(teamOne, teamTwo) {
    elements.winnerActions.replaceChildren();

    const createWinnerButton = (team) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "winner-button";
      button.disabled = isWaitingForBullOffChoice();
      button.dataset.team = teamKey(team);
      button.textContent = `${teamLabel(team)} win`;
      return button;
    };

    elements.winnerActions.append(
      createWinnerButton(teamOne),
      createWinnerButton(teamTwo),
    );
  }

  function renderMatch() {
    if (currentMatch.length < 2) {
      elements.matchSummary.innerHTML =
        '<p class="status">Not enough teams to start a match.</p>';
      elements.winnerActions.innerHTML = "";
      elements.bullOffActions.innerHTML = "";
      renderQueueList();
      return;
    }

    const [teamOne, teamTwo] = currentMatch;
    elements.matchSummary.innerHTML = `
      <div class="team-card">
        <span class="team-label">Team 1</span>
        <strong>${teamOne.join(" & ")}</strong>
      </div>
      <div class="versus">vs</div>
      <div class="team-card">
        <span class="team-label">Team 2</span>
        <strong>${teamLabel(teamTwo)}</strong>
      </div>
    `;

    renderWinnerButtons(teamOne, teamTwo);
    renderQueueList();
    renderBullOffUI();
  }

  function render() {
    renderPlayers();
    renderMatch();
  }

  function updateAfterWinner(winningTeamKey) {
    const winningTeam = currentMatch.find(
      (team) => teamKey(team) === winningTeamKey,
    );
    if (!winningTeam) {
      return;
    }

    const losingTeam = currentMatch.find(
      (team) => teamKey(team) !== winningTeamKey,
    );
    const nextTeam = queue.shift();
    queue.push(losingTeam);
    currentMatch = nextTeam ? [winningTeam, nextTeam] : [winningTeam];
    render();
  }

  function handleAddPlayer(event) {
    event.preventDefault();
    const value = elements.playerInput.value.trim();
    if (!value) {
      return;
    }

    players.push(value);
    elements.playerInput.value = "";
    elements.playerInput.focus();
    renderPlayers();
  }

  function buildInitialState() {
    const teams = buildQueueFromPlayers();
    currentMatch = teams.slice(0, 2);
    queue = teams.slice(2);
    render();
  }

  function resetPlayers() {
    players = [];
    queue = [];
    currentMatch = [];
    render();
  }

  elements.playerForm.addEventListener("submit", handleAddPlayer);
  elements.startRoundButton.addEventListener("click", buildInitialState);
  elements.resetButton.addEventListener("click", resetPlayers);

  elements.bullOffActions.addEventListener("click", (event) => {
    const joinButton = event.target.closest(".join-player");
    if (joinButton) {
      resolveQueueJoin(joinButton.dataset.player);
    }
  });

  elements.winnerActions.addEventListener("click", (event) => {
    const button = event.target.closest(".winner-button");
    if (!button) {
      return;
    }

    updateAfterWinner(button.dataset.team);
  });

  render();
  buildInitialState();
})();
