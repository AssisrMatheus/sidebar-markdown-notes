module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/extension.ts":
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
/*! flagged exports */
/*! export __esModule [provided] [maybe used in main (runtime-defined)] [usage prevents renaming] */
/*! export activate [provided] [maybe used in main (runtime-defined)] [usage prevents renaming] */
/*! export deactivate [provided] [maybe used in main (runtime-defined)] [usage prevents renaming] */
/*! other exports [not provided] [maybe used in main (runtime-defined)] */
/*! runtime requirements: __webpack_exports__, __webpack_require__ */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(/*! vscode */ "vscode");
const webviewProvider_1 = __webpack_require__(/*! ./webviewProvider */ "./src/webviewProvider.ts");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    context.subscriptions.push(statusBar);
    const provider = new webviewProvider_1.default(context.extensionUri, statusBar);
    // register some listener that make sure the status bar
    // item always up-to-date
    // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(provider.updateStatusBar));
    // context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(provider.updateStatusBar));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(webviewProvider_1.default.viewId, provider));
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('sidebar-markdown-notes.togglePreview', () => {
        // The code you place here will be executed every time your command is executed
        provider.togglePreview();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('sidebar-markdown-notes.previousPage', () => {
        provider.previousPage();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('sidebar-markdown-notes.nextPage', () => {
        provider.nextPage();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('sidebar-markdown-notes.resetData', () => {
        provider.resetData();
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),

/***/ "./src/webviewProvider.ts":
/*!********************************!*\
  !*** ./src/webviewProvider.ts ***!
  \********************************/
/*! flagged exports */
/*! export __esModule [provided] [no usage info] [missing usage info prevents renaming] */
/*! export default [provided] [no usage info] [missing usage info prevents renaming] */
/*! other exports [not provided] [no usage info] */
/*! runtime requirements: __webpack_exports__, __webpack_require__ */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(/*! vscode */ "vscode");
class SidebarMarkdownNotesProvider {
    constructor(_extensionUri, _statusBar) {
        this._extensionUri = _extensionUri;
        this._statusBar = _statusBar;
        this.config = vscode.workspace.getConfiguration('sidebar-markdown-notes');
    }
    /**
     * Revolves a webview view.
     *
     * `resolveWebviewView` is called when a view first becomes visible. This may happen when the view is
     * first loaded or when the user hides and then shows a view again.
     *
     * @param webviewView Webview view to restore. The provider should take ownership of this view. The
     *    provider must set the webview's `.html` and hook up all webview events it is interested in.
     * @param context Additional metadata about the view being resolved.
     * @param token Cancellation token indicating that the view being provided is no longer needed.
     *
     * @return Optional thenable indicating that the view has been fully resolved.
     */
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
                case 'log': {
                    vscode.window.showInformationMessage(`${data.value}`);
                    break;
                }
                case 'updateStatusBar': {
                    this.updateStatusBar(data.value);
                    break;
                }
            }
        });
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('sidebar-markdown-notes')) {
                this.config = vscode.workspace.getConfiguration('sidebar-markdown-notes');
                webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            }
        });
    }
    resetData() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'resetData' });
        }
    }
    togglePreview() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'togglePreview' });
        }
    }
    previousPage() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'previousPage' });
        }
    }
    nextPage() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'nextPage' });
        }
    }
    updateStatusBar(content) {
        if (this._statusBar) {
            if (content) {
                this._statusBar.text = `${content}`;
                this._statusBar.show();
            }
            else {
                this._statusBar.hide();
            }
        }
    }
    _getHtmlForWebview(webview) {
        const purifyUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'lib', 'purify.min.js'));
        const markedUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'lib', 'marked.min.js'));
        const lodashUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'lib', 'lodash.min.js'));
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const markdownCss = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'markdown.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = this._getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${markdownCss}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Sidebar markdown notes</title>
			</head>
      <body>

        <div id="render"></div>
        <div id="content"><textarea id="text-input" name="text-input" placeholder="Start by typing your markdown notes..."></textarea></div>

        <script nonce="${nonce}">
          (function () {
            const renderElement = document.getElementById('render');
            const editorElement = document.getElementById('content');

            renderElement.style.paddingLeft = ${this.config.get('leftMargin') === true ? '"20px"' : '"0px"'};
            editorElement.style.paddingLeft = ${this.config.get('leftMargin') === true ? '"20px"' : '"0px"'};
          })();
        </script>
        <script nonce="${nonce}" src="${lodashUri}"></script>
        <script nonce="${nonce}" src="${purifyUri}"></script>
        <script nonce="${nonce}" src="${markedUri}"></script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.default = SidebarMarkdownNotesProvider;
SidebarMarkdownNotesProvider.viewId = 'sidebarMarkdownNotes.webview';


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/*! dynamic exports */
/*! exports [maybe provided (runtime-defined)] [no usage info] */
/*! runtime requirements: module */
/***/ ((module) => {

module.exports = require("vscode");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__("./src/extension.ts");
/******/ })()
;
//# sourceMappingURL=extension.js.map