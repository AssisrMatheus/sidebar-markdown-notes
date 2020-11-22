import * as vscode from 'vscode';

class Config {
  private readonly config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('sidebarMarkdownNotes');
  }

  getLeftMargin() {
    return !!this.config.get('leftMargin', false);
  }

  getShowWelcomeText() {
    return !!this.config.get('showWelcomeText', true);
  }
}

export function getConfig() {
  return new Config();
}
