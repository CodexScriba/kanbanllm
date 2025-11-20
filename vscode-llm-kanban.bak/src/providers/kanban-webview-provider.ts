/**
 * Webview provider for the Kanban board
 * Renders a visual drag-and-drop board interface
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { Item, Stage, WebviewMessage } from '../core/types';
import { loadAllItems, moveItem, writeItem, readItem } from '../core/fs-adapter';
import { reinjectContextForStageChange } from '../core/context-injector';

export class KanbanWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'llmkanban.boardView';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly workspaceRoot: string
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      await this._handleMessage(message);
    });

    // Send initial data
    this.refresh();
  }

  /**
   * Refresh the board with current items
   */
  public async refresh() {
    if (this._view) {
      const items = await loadAllItems(this.workspaceRoot);
      this._view.webview.postMessage({
        type: 'update',
        items,
      });
    }
  }

  /**
   * Handle messages from the webview
   */
  private async _handleMessage(message: WebviewMessage) {
    switch (message.type) {
      case 'moveItem':
        if (message.itemId && message.newStage) {
          await this._handleMoveItem(message.itemId, message.newStage);
        }
        break;

      case 'openItem':
        if (message.filePath) {
          const uri = vscode.Uri.file(message.filePath);
          await vscode.window.showTextDocument(uri);
        }
        break;

      case 'createItem':
        if (message.data?.type === 'task') {
          await vscode.commands.executeCommand('llmkanban.createTask');
        } else {
          await vscode.commands.executeCommand('llmkanban.createPhase');
        }
        break;

      case 'deleteItem':
        if (message.itemId) {
          const result = await vscode.window.showWarningMessage(
            `Delete item "${message.itemId}"?`,
            'Delete',
            'Cancel'
          );
          if (result === 'Delete') {
            // TODO: Implement delete
            vscode.window.showInformationMessage('Delete not yet implemented');
          }
        }
        break;

      case 'requestUpdate':
        await this.refresh();
        break;
    }
  }

  /**
   * Handle moving an item to a new stage
   */
  private async _handleMoveItem(itemId: string, newStage: Stage) {
    try {
      // Find current stage by checking all stages
      const items = await loadAllItems(this.workspaceRoot);
      const item = items.find((i) => i.frontmatter.id === itemId);

      if (!item) {
        vscode.window.showErrorMessage(`Item ${itemId} not found`);
        return;
      }

      const oldStage = item.frontmatter.stage;

      if (oldStage === newStage) {
        return; // No change needed
      }

      // Re-inject context for new stage
      const updatedItem = await reinjectContextForStageChange(
        this.workspaceRoot,
        item,
        newStage
      );

      // Write to new location
      await writeItem(this.workspaceRoot, updatedItem, newStage);

      // Move file
      await moveItem(this.workspaceRoot, itemId, oldStage, newStage);

      // Refresh to show changes
      await this.refresh();

      // Trigger tree view refresh
      await vscode.commands.executeCommand('llmkanban.refreshBoard');
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to move item: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to the script and CSS
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>LLM Kanban Board</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Register the webview provider
 */
export function registerKanbanWebview(
  context: vscode.ExtensionContext,
  workspaceRoot: string
): KanbanWebviewProvider {
  const provider = new KanbanWebviewProvider(context.extensionUri, workspaceRoot);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(KanbanWebviewProvider.viewType, provider)
  );

  return provider;
}
