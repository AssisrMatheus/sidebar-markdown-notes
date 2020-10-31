/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-undef */
// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // const vscode = acquireVsCodeApi();
  // const oldState = vscode.getState() || { colors: [] };
  // // Update the saved state
  // vscode.setState({ colors: colors });

  document.getElementById('content').innerHTML = marked('# Marked in browser\n\nRendered by **marked**.');
})();
