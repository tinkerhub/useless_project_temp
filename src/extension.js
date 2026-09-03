const vscode = require('vscode');

const audioEngine = require('./audioEngine');
const aiRoast = require('./aiRoast');

function activate(context) {

    console.log('Emotional Damage IDE activated!');
̥
    let disposable = vscode.commands.registerCommand(
        'emotionalDamageIDE.roast',
        async () => {

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showWarningMessage(
                    'Open a code file first!'
                );
                return;
            }

            const text = editor.document.getText();

            const roast = await aiRoast.generateEmotionalDamage({
                language: editor.document.languageId,
                error: text,
                errorCount: 1
            });

            vscode.window.showErrorMessage(roast);

            audioEngine.playRandomSound();
        }
    );

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};