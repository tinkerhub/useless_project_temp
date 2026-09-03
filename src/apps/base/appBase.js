class AppBase {

    constructor(config = {}) {

        this.id =
            config.id || "";

        this.name =
            config.name || "Unnamed App";

        this.icon =
            config.icon || "📦";
    }

    render() {

        return `
            <div>
                <h2>${this.icon} ${this.name}</h2>
            </div>
        `;
    }
}

export default AppBase;