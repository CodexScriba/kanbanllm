import * as vscode from 'vscode';
import * as path from 'path';
import { loadBoardData, moveItemToStage, deleteItemById, readItemById, createItem, updateItem, readContextFile, writeContextFile } from '../core/fs-adapter';
import { serializeItemToMarkdown } from '../core/parser';
import { AgentManager } from '../core/AgentManager';
import { ContextManager } from '../core/ContextManager';

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
  private _agentManager: AgentManager;
  private _contextManager: ContextManager;

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

    this._agentManager = new AgentManager();
    this._contextManager = new ContextManager();

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
      // Basic validation
      if (!message || !message.type) {
        console.warn('[Kanban Webview] Received invalid message:', message);
        return;
      }

      switch (message.type) {
        case 'ready':
          // Webview is ready, send initial data
          await this._loadAndSendData();
          break;

        case 'moveItem':
          if (!message.itemId || !message.targetStage) throw new Error('Invalid moveItem payload');
          await moveItemToStage(this._workspaceRoot, message.itemId, message.targetStage);
          await this._loadAndSendData(); // Refresh data
          vscode.window.showInformationMessage(`Item moved to ${message.targetStage}`);
          break;

        case 'openItem':
          if (!message.itemId) throw new Error('Invalid openItem payload');
          await this._openItem(message.itemId);
          break;

        case 'deleteItem':
          if (!message.itemId) throw new Error('Invalid deleteItem payload');
          await deleteItemById(this._workspaceRoot, message.itemId);
          this._panel.webview.postMessage({
            type: 'itemDeleted',
            itemId: message.itemId,
          });
          vscode.window.showInformationMessage('Item deleted');
          break;

        case 'updateItem':
          if (!message.item || !message.item.id) throw new Error('Invalid updateItem payload');
          // We need to read the existing item to preserve other fields
          const existingItem = await readItemById(this._workspaceRoot, message.item.id);
          if (existingItem) {
             await updateItem(this._workspaceRoot, message.item.id, {
               title: message.item.title,
               // We only support updating title for now via this message
             });
             await this._loadAndSendData();
             vscode.window.showInformationMessage(`Item updated: ${message.item.title}`);
          }
          break;

        case 'copyWithContext':
          await this._copyWithContext(message.itemId, message.mode);
          break;

        case 'createTask':
          await createItem(this._workspaceRoot, {
            title: message.title,
            stage: message.stage,
            type: 'task',
            phaseId: message.phaseId,
            tags: message.tags,
          });
          await this._loadAndSendData();
          vscode.window.showInformationMessage(`Task created: ${message.title}`);
          break;

        case 'createPhase':
          await createItem(this._workspaceRoot, {
            title: message.title,
            stage: message.stage,
            type: 'phase',
            tags: message.tags,
          });
          await this._loadAndSendData();
          vscode.window.showInformationMessage(`Phase created: ${message.title}`);
          break;

        case 'getAgent':
          const agent = await this._agentManager.getAgent(message.agentId);
          if (agent) {
            this._panel.webview.postMessage({
              type: 'agentData',
              agent,
            });
          } else {
            vscode.window.showErrorMessage(`Agent ${message.agentId} not found`);
          }
          break;

        case 'listAgents':
          const agents = await this._agentManager.listAgents();
          this._panel.webview.postMessage({
            type: 'agentList',
            agents,
          });
          break;

        case 'listContexts':
          const { listContexts } = await import('../core/fs-adapter.js');
          const contexts = await listContexts(this._workspaceRoot);
          this._panel.webview.postMessage({
            type: 'contextList',
            contexts,
          });
          break;

        case 'getContext':
          const contextContent = await readContextFile(message.contextType, message.contextId);
          this._panel.webview.postMessage({
            type: 'contextData',
            contextType: message.contextType,
            contextId: message.contextId,
            content: contextContent
          });
          break;

        case 'saveContext':
          await writeContextFile(message.contextType, message.contextId, message.content);
          vscode.window.showInformationMessage(`Saved ${message.contextType}: ${message.contextId}`);
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
        data: { chat: [], queue: [], plan: [], code: [], audit: [], completed: [] },
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

      // Find the file path using fs-adapter logic
      // We can reconstruct the path since we know the stage and ID, and we're using canonical paths now
      // But to be safe and support legacy, we should probably expose a findItemPath function in fs-adapter
      // For now, we'll use the stage from the item to construct the path, assuming canonical folder structure for new items
      // and checking legacy folders if needed.
      
      // Actually, readItemById already found the item, but it returns a FlatItem which doesn't have the full path.
      // Let's use findItemById from fs-adapter which returns the path.
      const { findItemById } = await import('../core/fs-adapter.js');
      const filePath = await findItemById(itemId);

      if (!filePath) {
         vscode.window.showErrorMessage(`Item file for ${itemId} not found`);
         return;
      }

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
