import * as vscode from 'vscode';

class Config {
  private readonly config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('sidebar-markdown-notes');
  }

  get leftMargin() {
    return !!this.config.get('leftMargin', false);
  }

  get showWelcomeText() {
    return !!this.config.get('showWelcomeText', true);
  }
}

export function getConfig() {
  return new Config();
}
