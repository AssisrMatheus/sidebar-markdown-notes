// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { getConfig } from './config';

export default class SidebarMarkdownNotesProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'sidebarMarkdownNotes.webview';

  private _view?: vscode.WebviewView;

  private config = getConfig();

  constructor(private readonly _extensionUri: vscode.Uri, private _statusBar?: vscode.StatusBarItem) {}

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
  public resolveWebviewView(webviewView: vscode.WebviewView) {
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
        this.config = getConfig()
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
      }
    });
  }

  public resetData() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'resetData' });
    }
  }

  public togglePreview() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'togglePreview' });
    }
  }

  public previousPage() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'previousPage' });
    }
  }

  public nextPage() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'nextPage' });
    }
  }

  public updateStatusBar(content?: string) {
    if (this._statusBar) {
      if (content) {
        this._statusBar.text = `${content}`;
        this._statusBar.show();
      } else {
        this._statusBar.hide();
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">

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

            renderElement.style.paddingLeft = ${this.config.getLeftMargin() === true ? '"20px"' : '"0px"'};
            editorElement.style.paddingLeft = ${this.config.getLeftMargin() === true ? '"20px"' : '"0px"'};
          })();
        </script>
        <script nonce="${nonce}">var config = ${JSON.stringify(this.config)};</script>
        <script nonce="${nonce}" src="${lodashUri}"></script>
        <script nonce="${nonce}" src="${purifyUri}"></script>
        <script nonce="${nonce}" src="${markedUri}"></script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private _getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
