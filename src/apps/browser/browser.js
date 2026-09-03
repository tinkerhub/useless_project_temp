import AppBase from "../base/appBase.js";
import "./browser.css";

class BrowserApp extends AppBase {
    constructor() {
        super({
            id: "browser",
            name: "Browser",
            icon: "🌐"
        });

        this.history = ["home"];
        this.historyIndex = 0;

        this.tabs = [
            {
                id: 1,
                title: "New Tab",
                url: "home"
            }
        ];

        this.activeTab = 1;
        this.nextTabId = 2;
    }

    render() {
        return `
            <div class="rage-browser">

                <div class="browser-tabs">

                    <div class="browser-tab browser-tab-active"
                         data-tab-id="1">

                        <span class="browser-tab-icon">🌐</span>

                        <span class="browser-tab-title">
                            New Tab
                        </span>

                        <button
                            class="browser-tab-close"
                            data-action="close-tab"
                            data-tab-id="1">
                            ×
                        </button>

                    </div>

                    <button
                        class="browser-new-tab"
                        data-action="new-tab">
                        +
                    </button>

                </div>

                <div class="browser-toolbar">

                    <button
                        class="browser-toolbar-button"
                        data-action="back"
                        title="Back">
                        ←
                    </button>

                    <button
                        class="browser-toolbar-button"
                        data-action="forward"
                        title="Forward">
                        →
                    </button>

                    <button
                        class="browser-toolbar-button"
                        data-action="refresh"
                        title="Refresh">
                        ⟳
                    </button>

                    <div class="browser-address-container">

                        <span class="browser-lock">
                            🔒
                        </span>

                        <input
                            class="browser-address"
                            type="text"
                            value="rage://home"
                            placeholder="Search or enter address"
                        />

                    </div>

                    <button
                        class="browser-go"
                        data-action="go">
                        Go
                    </button>

                </div>

                <div class="browser-loading">
                    <div class="browser-loading-bar"></div>
                </div>

                <div class="browser-content">
                    ${this.renderHomePage()}
                </div>

            </div>
        `;
    }

    renderHomePage() {
        return `
            <div class="browser-home">

                <div class="browser-logo">
                    <span>R</span>age
                </div>

                <p class="browser-subtitle">
                    A perfectly normal browser.
                </p>

                <div class="browser-search-container">

                    <input
                        class="browser-home-search"
                        type="text"
                        placeholder="Search the web..."
                    />

                    <button
                        class="browser-home-search-button"
                        data-action="home-search">
                        🔍
                    </button>

                </div>

                <div class="browser-shortcuts">

                    <button
                        class="browser-shortcut"
                        data-url="rage://about">
                        ℹ️
                        <span>About</span>
                    </button>

                    <button
                        class="browser-shortcut"
                        data-url="rage://news">
                        📰
                        <span>News</span>
                    </button>

                    <button
                        class="browser-shortcut"
                        data-url="rage://calculator">
                        🧮
                        <span>Calculator</span>
                    </button>

                </div>

            </div>
        `;
    }

    renderSearchPage(query) {
        const results = [
            {
                title: `What is ${query}?`,
                description: `Everything you need to know about ${query}.`,
                url: `rage://result/${query}`
            },
            {
                title: `${query} - Wikipedia`,
                description: `The completely accurate encyclopedia entry for ${query}.`,
                url: `rage://wikipedia/${query}`
            },
            {
                title: `Top 10 facts about ${query}`,
                description: `You won't believe number 7.`,
                url: `rage://facts/${query}`
            },
            {
                title: `Calculator`,
                description: `Definitely related to your search.`,
                url: "rage://calculator"
            }
        ];

        return `
            <div class="browser-search-page">

                <h1>
                    Search Results
                </h1>

                <p class="browser-search-query">
                    Results for:
                    <strong>${this.escapeHtml(query)}</strong>
                </p>

                <div class="browser-results">

                    ${results.map((result, index) => `
                        <div
                            class="browser-result"
                            data-result-url="${result.url}">

                            <a href="#" class="browser-result-title">
                                ${result.title}
                            </a>

                            <div class="browser-result-url">
                                ${result.url}
                            </div>

                            <p>
                                ${result.description}
                            </p>

                        </div>
                    `).join("")}

                </div>

            </div>
        `;
    }

    renderAboutPage() {
        return `
            <div class="browser-basic-page">

                <h1>About Rage Browser</h1>

                <p>
                    Welcome to Rage Browser.
                </p>

                <p>
                    The fastest, safest and most
                    completely normal browser in RagebaitOS.
                </p>

                <div class="browser-warning">
                    ⚠️ Nothing suspicious is happening.
                </div>

            </div>
        `;
    }

    renderNewsPage() {
        return `
            <div class="browser-basic-page">

                <h1>📰 Rage News</h1>

                <article class="browser-news-card">
                    <h2>
                        Scientists Confirm Computers Are Annoying
                    </h2>

                    <p>
                        Researchers have discovered that
                        pressing a button repeatedly does not
                        make it work faster.
                    </p>
                </article>

                <article class="browser-news-card">
                    <h2>
                        User Still Searching For The Same Thing
                    </h2>

                    <p>
                        More updates after this page finishes loading.
                    </p>
                </article>

            </div>
        `;
    }

    renderResultPage(title) {
        return `
            <div class="browser-basic-page">

                <h1>${this.escapeHtml(title)}</h1>

                <p>
                    You have successfully reached the page.
                </p>

                <p>
                    Congratulations.
                </p>

                <div class="browser-warning">
                    🚨 This page contains absolutely no useful information.
                </div>

            </div>
        `;
    }

    renderErrorPage() {
        return `
            <div class="browser-error-page">

                <div class="browser-error-icon">
                    😐
                </div>

                <h1>
                    This page isn't working
                </h1>

                <p>
                    The browser has decided that this page
                    does not exist anymore.
                </p>

                <button
                    class="browser-error-button"
                    data-action="home">
                    Go to Home
                </button>

            </div>
        `;
    }

    navigate(url, addHistory = true) {

        const tab = this.getActiveTab();

        if (!tab) {
            return;
        }

        /*
         * SABOTAGE 1:
         * Google sometimes redirects to Calculator.
         */

        if (
            url.toLowerCase().includes("google") &&
            Math.random() < 0.30
        ) {
            url = "rage://calculator";

            this.showRageMessage(
                "Google was feeling mathematical today."
            );
        }

        /*
         * SABOTAGE 2:
         * Random URLs sometimes get corrupted.
         */

        if (
            !url.startsWith("rage://") &&
            Math.random() < 0.15
        ) {
            url = this.corruptUrl(url);

            this.showRageMessage(
                "Your URL looked slightly wrong."
            );
        }

        tab.url = url;
        tab.title = this.getPageTitle(url);

        if (addHistory) {

            this.history =
                this.history.slice(
                    0,
                    this.historyIndex + 1
                );

            this.history.push(url);

            this.historyIndex =
                this.history.length - 1;
        }

        this.updateBrowser();
    }

    getPageTitle(url) {

        if (url === "home") {
            return "New Tab";
        }

        if (url === "rage://calculator") {
            return "Calculator";
        }

        if (url === "rage://about") {
            return "About Rage Browser";
        }

        if (url === "rage://news") {
            return "Rage News";
        }

        if (url.startsWith("rage://search")) {
            return "Search";
        }

        return "Rage Browser";
    }

    renderPage(url) {

        if (url === "home") {
            return this.renderHomePage();
        }

        if (url === "rage://about") {
            return this.renderAboutPage();
        }

        if (url === "rage://news") {
            return this.renderNewsPage();
        }

        if (url === "rage://calculator") {
            return `
                <div class="browser-basic-page">

                    <div class="browser-calculator-redirect">
                        🧮
                    </div>

                    <h1>
                        Calculator
                    </h1>

                    <p>
                        You were redirected to the Calculator.
                    </p>

                    <p>
                        This is probably what you wanted.
                    </p>

                </div>
            `;
        }

        if (url.startsWith("rage://search/")) {

            const query =
                decodeURIComponent(
                    url.replace("rage://search/", "")
                );

            return this.renderSearchPage(query);
        }

        if (url.startsWith("rage://result/")) {

            const query =
                decodeURIComponent(
                    url.replace("rage://result/", "")
                );

            return this.renderResultPage(
                `Information about ${query}`
            );
        }

        if (url.startsWith("rage://wikipedia/")) {

            const query =
                decodeURIComponent(
                    url.replace("rage://wikipedia/", "")
                );

            return this.renderResultPage(
                `${query} - Wikipedia`
            );
        }

        if (url.startsWith("rage://facts/")) {

            const query =
                decodeURIComponent(
                    url.replace("rage://facts/", "")
                );

            return this.renderResultPage(
                `10 facts about ${query}`
            );
        }

        return this.renderErrorPage();
    }

    updateBrowser() {

        const browser =
            document.querySelector(".rage-browser");

        if (!browser) {
            return;
        }

        const tab =
            this.getActiveTab();

        if (!tab) {
            return;
        }

        const address =
            browser.querySelector(".browser-address");

        const content =
            browser.querySelector(".browser-content");

        if (address) {
            address.value =
                tab.url === "home"
                    ? "rage://home"
                    : tab.url;
        }

        if (content) {
            content.innerHTML =
                this.renderPage(tab.url);
        }

        this.updateTabs(browser);
    }

    updateTabs(browser) {

        const tabsContainer =
            browser.querySelector(".browser-tabs");

        if (!tabsContainer) {
            return;
        }

        const newTabButton =
            tabsContainer.querySelector(".browser-new-tab");

        tabsContainer
            .querySelectorAll(".browser-tab")
            .forEach(tab => tab.remove());

        this.tabs.forEach(tab => {

            const tabElement =
                document.createElement("div");

            tabElement.className =
                "browser-tab";

            if (tab.id === this.activeTab) {
                tabElement.classList.add(
                    "browser-tab-active"
                );
            }

            tabElement.dataset.tabId =
                tab.id;

            tabElement.innerHTML = `
                <span class="browser-tab-icon">
                    🌐
                </span>

                <span class="browser-tab-title">
                    ${this.escapeHtml(tab.title)}
                </span>

                <button
                    class="browser-tab-close"
                    data-action="close-tab"
                    data-tab-id="${tab.id}">
                    ×
                </button>
            `;

            tabsContainer.insertBefore(
                tabElement,
                newTabButton
            );
        });
    }

    getActiveTab() {

        return this.tabs.find(
            tab => tab.id === this.activeTab
        );
    }

    newTab() {

        const tab = {
            id: this.nextTabId++,
            title: "New Tab",
            url: "home"
        };

        this.tabs.push(tab);

        this.activeTab =
            tab.id;

        this.updateBrowser();
    }

    closeTab(tabId) {

        if (this.tabs.length === 1) {
            this.showRageMessage(
                "You can't escape this browser."
            );

            return;
        }

        /*
         * SABOTAGE 3:
         * Sometimes the wrong tab closes.
         */

        if (Math.random() < 0.20) {

            const otherTabs =
                this.tabs.filter(
                    tab => tab.id !== tabId
                );

            if (otherTabs.length > 0) {

                tabId =
                    otherTabs[
                        Math.floor(
                            Math.random() *
                            otherTabs.length
                        )
                    ].id;

                this.showRageMessage(
                    "Oops. Wrong tab."
                );
            }
        }

        const index =
            this.tabs.findIndex(
                tab => tab.id === tabId
            );

        if (index === -1) {
            return;
        }

        this.tabs.splice(index, 1);

        if (this.activeTab === tabId) {

            const newIndex =
                Math.max(
                    0,
                    index - 1
                );

            this.activeTab =
                this.tabs[newIndex].id;
        }

        this.updateBrowser();
    }

    goBack() {

        if (this.historyIndex <= 0) {
            return;
        }

        /*
         * SABOTAGE 4:
         * Sometimes Back behaves like Forward.
         */

        if (
            Math.random() < 0.25 &&
            this.historyIndex <
            this.history.length - 1
        ) {

            this.historyIndex++;

            this.showRageMessage(
                "Back button decided to move forward."
            );

        } else {

            this.historyIndex--;
        }

        const url =
            this.history[this.historyIndex];

        const tab =
            this.getActiveTab();

        if (tab) {
            tab.url = url;
            tab.title =
                this.getPageTitle(url);
        }

        this.updateBrowser();
    }

    goForward() {

        if (
            this.historyIndex >=
            this.history.length - 1
        ) {
            return;
        }

        this.historyIndex++;

        const url =
            this.history[this.historyIndex];

        const tab =
            this.getActiveTab();

        if (tab) {
            tab.url = url;
            tab.title =
                this.getPageTitle(url);
        }

        this.updateBrowser();
    }

    refresh() {

        /*
         * SABOTAGE 5:
         * Refresh occasionally changes the page.
         */

        if (Math.random() < 0.30) {

            this.showRageMessage(
                "Refreshing definitely helped."
            );

            const randomPages = [
                "rage://about",
                "rage://news",
                "rage://facts/random"
            ];

            const randomPage =
                randomPages[
                    Math.floor(
                        Math.random() *
                        randomPages.length
                    )
                ];

            this.navigate(randomPage);

            return;
        }

        this.showLoading();

        setTimeout(() => {
            this.updateBrowser();
        }, 700);
    }

    search(query) {

        query =
            query.trim();

        if (!query) {
            return;
        }

        /*
         * SABOTAGE 6:
         * Sometimes the search redirects to Calculator.
         */

        if (Math.random() < 0.15) {

            this.navigate(
                "rage://calculator"
            );

            this.showRageMessage(
                "Search engine found Calculator."
            );

            return;
        }

        this.navigate(
            `rage://search/${encodeURIComponent(query)}`
        );
    }

    handleResultClick(url) {

        /*
         * SABOTAGE 7:
         * Links sometimes go somewhere else.
         */

        if (Math.random() < 0.25) {

            const wrongPages = [
                "rage://about",
                "rage://news",
                "rage://calculator"
            ];

            url =
                wrongPages[
                    Math.floor(
                        Math.random() *
                        wrongPages.length
                    )
                ];

            this.showRageMessage(
                "That wasn't the link you clicked."
            );
        }

        this.navigate(url);
    }

    corruptUrl(url) {

        if (url.length < 3) {
            return url;
        }

        const position =
            Math.floor(
                Math.random() * url.length
            );

        const characters =
            "abcdefghijklmnopqrstuvwxyz";

        const randomCharacter =
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

        return (
            url.substring(0, position) +
            randomCharacter +
            url.substring(position + 1)
        );
    }

    showLoading() {

        const loading =
            document.querySelector(
                ".browser-loading"
            );

        const bar =
            document.querySelector(
                ".browser-loading-bar"
            );

        if (!loading || !bar) {
            return;
        }

        loading.classList.add(
            "browser-loading-active"
        );

        bar.style.width = "0%";

        setTimeout(() => {
            bar.style.width = "45%";
        }, 100);

        setTimeout(() => {
            bar.style.width = "80%";
        }, 250);

        /*
         * SABOTAGE 8:
         * Sometimes gets stuck at 99%.
         */

        if (Math.random() < 0.20) {

            setTimeout(() => {

                bar.style.width = "99%";

                this.showRageMessage(
                    "Page loading... 99%..."
                );

            }, 450);

            setTimeout(() => {

                loading.classList.remove(
                    "browser-loading-active"
                );

                bar.style.width = "0%";

            }, 2500);

            return;
        }

        setTimeout(() => {

            bar.style.width = "100%";

        }, 450);

        setTimeout(() => {

            loading.classList.remove(
                "browser-loading-active"
            );

            bar.style.width = "0%";

        }, 700);
    }

    showRageMessage(message) {

        const existing =
            document.querySelector(
                ".browser-rage-message"
            );

        if (existing) {
            existing.remove();
        }

        const messageElement =
            document.createElement("div");

        messageElement.className =
            "browser-rage-message";

        messageElement.textContent =
            message;

        document.body.appendChild(
            messageElement
        );

        setTimeout(() => {

            messageElement.classList.add(
                "browser-rage-message-visible"
            );

        }, 10);

        setTimeout(() => {

            messageElement.classList.remove(
                "browser-rage-message-visible"
            );

            setTimeout(() => {
                messageElement.remove();
            }, 300);

        }, 1800);
    }

    escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value;

        return div.innerHTML;
    }

    handleClick(event) {

        const browser =
            event.target.closest(
                ".rage-browser"
            );

        if (!browser) {
            return;
        }

        const actionElement =
            event.target.closest(
                "[data-action]"
            );

        if (actionElement) {

            const action =
                actionElement.dataset.action;

            if (action === "back") {
                this.goBack();
                return;
            }

            if (action === "forward") {
                this.goForward();
                return;
            }

            if (action === "refresh") {
                this.refresh();
                return;
            }

            if (action === "go") {

                const address =
                    browser.querySelector(
                        ".browser-address"
                    );

                if (address) {
                    this.navigate(
                        this.processAddress(
                            address.value
                        )
                    );
                }

                return;
            }

            if (action === "new-tab") {
                this.newTab();
                return;
            }

            if (action === "close-tab") {

                this.closeTab(
                    Number(
                        actionElement.dataset.tabId
                    )
                );

                return;
            }

            if (action === "home") {
                this.navigate("home");
                return;
            }

            if (action === "home-search") {

                const input =
                    browser.querySelector(
                        ".browser-home-search"
                    );

                if (input) {
                    this.search(
                        input.value
                    );
                }

                return;
            }
        }

        const tab =
            event.target.closest(
                ".browser-tab"
            );

        if (
            tab &&
            !event.target.closest(
                ".browser-tab-close"
            )
        ) {

            this.activeTab =
                Number(
                    tab.dataset.tabId
                );

            this.updateBrowser();

            return;
        }

        const result =
            event.target.closest(
                ".browser-result"
            );

        if (result) {

            event.preventDefault();

            this.handleResultClick(
                result.dataset.resultUrl
            );

            return;
        }

        const shortcut =
            event.target.closest(
                "[data-url]"
            );

        if (shortcut) {

            this.navigate(
                shortcut.dataset.url
            );
        }
    }

    processAddress(value) {

        value =
            value.trim();

        if (!value) {
            return "home";
        }

        if (
            value === "rage://home"
        ) {
            return "home";
        }

        if (
            value.startsWith("rage://")
        ) {
            return value;
        }

        /*
         * Treat ordinary text as a search.
         */

        if (
            !value.includes(".")
        ) {
            return `rage://search/${encodeURIComponent(value)}`;
        }

        return value;
    }

    handleKeydown(event) {

        const browser =
            event.target.closest(
                ".rage-browser"
            );

        if (!browser) {
            return;
        }

        if (
            event.key === "Enter" &&
            event.target.classList.contains(
                "browser-address"
            )
        ) {

            this.navigate(
                this.processAddress(
                    event.target.value
                )
            );
        }

        if (
            event.key === "Enter" &&
            event.target.classList.contains(
                "browser-home-search"
            )
        ) {

            this.search(
                event.target.value
            );
        }
    }

    initializeEvents() {

        /*
         * Browser events are intentionally
         * scoped to the Browser DOM.
         */

        if (this.eventsInitialized) {
            return;
        }

        this.eventsInitialized = true;

        document.addEventListener(
            "click",
            event => this.handleClick(event)
        );

        document.addEventListener(
            "keydown",
            event => this.handleKeydown(event)
        );
    }
}

const browserApp =
    new BrowserApp();

browserApp.initializeEvents();

export default browserApp;