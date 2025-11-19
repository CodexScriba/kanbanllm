import * as vscode from 'vscode';
import * as path from 'path';
import { loadBoardData, moveItemToStage, deleteItemById, readItemById } from '../../../src/core/fs-adapter';
import { serializeItemToMarkdown } from '../../../src/core/parser';

/**
 * Manages the Kanban Board webview panel with full backend integration
 */
export class KanbanPanel {
  public static currentPanel: KanbanPanel | undefined;
  private static readonly viewType = 'llmKanbanBoard';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _workspaceRoot: string | undefined;

  /**
   * Create or show the Kanban board webview
   */
  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If panel already exists, reveal it
    if (KanbanPanel.currentPanel) {
      KanbanPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      KanbanPanel.viewType,
      'Kanban Board',
      column || vscode.ViewColumn.One,
      {
        // Enable JavaScript in the webview
        enableScripts: true,

        // Restrict webview to only load resources from extension directory
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      }
    );

    KanbanPanel.currentPanel = new KanbanPanel(panel, extensionUri);
  }

  /**
   * Private constructor - use createOrShow() instead
   */
  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this._workspaceRoot = workspaceFolders[0].uri.fsPath;
    }

    // Set initial HTML content
    this._update();

    // Listen for panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        await this._handleMessage(message);
      },
      null,
      this._disposables
    );
  }

  /**
   * Handle messages from webview
   */
  private async _handleMessage(message: any) {
    if (!this._workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    try {
      switch (message.type) {
        case 'ready':
          // Webview is ready, send initial data
          await this._loadAndSendData();
          break;

        case 'moveItem':
          await moveItemToStage(this._workspaceRoot, message.itemId, message.targetStage);
          await this._loadAndSendData(); // Refresh data
          vscode.window.showInformationMessage(`Item moved to ${message.targetStage}`);
          break;

        case 'openItem':
          await this._openItem(message.itemId);
          break;

        case 'deleteItem':
          await deleteItemById(this._workspaceRoot, message.itemId);
          this._panel.webview.postMessage({
            type: 'itemDeleted',
            itemId: message.itemId,
          });
          vscode.window.showInformationMessage('Item deleted');
          break;

        case 'copyWithContext':
          await this._copyWithContext(message.itemId, message.mode);
          break;

        default:
          console.log('[Kanban Webview] Unknown message:', message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error: ${errorMsg}`);
      this._panel.webview.postMessage({
        type: 'error',
        message: errorMsg,
      });
    }
  }

  /**
   * Load data from file system and send to webview
   */
  private async _loadAndSendData() {
    if (!this._workspaceRoot) return;

    try {
      const boardData = await loadBoardData(this._workspaceRoot);
      this._panel.webview.postMessage({
        type: 'init',
        data: boardData,
      });
    } catch (error) {
      console.error('Error loading board data:', error);
      this._panel.webview.postMessage({
        type: 'init',
        data: { queue: [], planning: [], coding: [], auditing: [], completed: [] },
      });
    }
  }

  /**
   * Open item file in editor
   */
  private async _openItem(itemId: string) {
    if (!this._workspaceRoot) return;

    try {
      const item = await readItemById(this._workspaceRoot, itemId);
      if (!item) {
        vscode.window.showErrorMessage(`Item ${itemId} not found`);
        return;
      }

      // Find the file path
      const stageFolderName = item.stage === 'queue' ? '1-queue' :
                              item.stage === 'planning' ? '2-planning' :
                              item.stage === 'coding' ? '3-coding' :
                              item.stage === 'auditing' ? '4-auditing' : '5-completed';

      const filePath = path.join(
        this._workspaceRoot,
        '.llmkanban',
        stageFolderName,
        `${itemId}.md`
      );

      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Error opening item: ${error}`);
    }
  }

  /**
   * Copy item with context to clipboard
   */
  private async _copyWithContext(itemId: string, mode: 'full' | 'context' | 'user') {
    if (!this._workspaceRoot) return;

    try {
      const item = await readItemById(this._workspaceRoot, itemId);
      if (!item) {
        vscode.window.showErrorMessage(`Item ${itemId} not found`);
        return;
      }

      let textToCopy = '';
      switch (mode) {
        case 'full':
          // For full mode, reconstruct from managed section and user content
          textToCopy = (item.managedSection || '') + '\n' + (item.userContent || '');
          break;
        case 'context':
          textToCopy = (item.managedSection || '') + '\n\n' + (item.userContent || '');
          break;
        case 'user':
          textToCopy = item.userContent || '';
          break;
      }

      await vscode.env.clipboard.writeText(textToCopy);
      vscode.window.showInformationMessage(`Copied ${textToCopy.length} characters (${mode} mode)`);
    } catch (error) {
      vscode.window.showErrorMessage(`Error copying: ${error}`);
    }
  }

  /**
   * Clean up resources
   */
  public dispose() {
    KanbanPanel.currentPanel = undefined;

    // Dispose panel
    this._panel.dispose();

    // Dispose all subscriptions
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Update webview content
   */
  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlContent(webview);
  }

  /**
   * Generate HTML content for the webview - loads React app
   */
  private _getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js')
    );

    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban Board</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Generate a nonce for Content Security Policy
   */
  private _getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
