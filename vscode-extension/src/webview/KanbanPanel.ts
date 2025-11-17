import * as vscode from 'vscode';

/**
 * Manages the Kanban Board webview panel
 *
 * Task 1: Basic webview infrastructure with placeholder content
 * Future: Will display full Kanban board with 6 columns
 */
export class KanbanPanel {
  public static currentPanel: KanbanPanel | undefined;
  private static readonly viewType = 'llmKanbanBoard';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

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

    // Set initial HTML content
    this._update();

    // Listen for panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'log':
            console.log('[Kanban Webview]', message.value);
            break;
          case 'error':
            console.error('[Kanban Webview]', message.value);
            break;
          default:
            console.log('[Kanban Webview] Unknown message:', message);
        }
      },
      null,
      this._disposables
    );
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
   * Generate HTML content for the webview
   *
   * Task 1: Placeholder content
   * Task 2: Will contain full board layout
   */
  private _getHtmlContent(webview: vscode.Webview): string {
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban Board</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      margin: 0;
      padding: 0;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 20px;
    }

    .container-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 520px;
    }

    h1 {
      color: var(--vscode-editor-foreground);
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    p {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
      margin-bottom: 24px;
      text-align: center;
      max-width: 400px;
    }

    .icon {
      font-size: 64px;
      margin-bottom: 24px;
      opacity: 0.6;
    }

    .info {
      background-color: var(--vscode-panel-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
      margin-top: 20px;
      max-width: 500px;
    }

    .info h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .info ul {
      margin: 0;
      padding-left: 20px;
    }

    .info li {
      margin: 6px 0;
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
    }

    .status {
      display: inline-block;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }

    .actions {
      margin-top: 28px;
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-button {
      min-width: 180px;
      padding: 10px 20px;
      border-radius: 999px;
      border: 1px solid var(--vscode-button-border, var(--vscode-button-background));
      background: transparent;
      color: var(--vscode-button-foreground);
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      outline: none;
      transition:
        background-color 120ms ease,
        border-color 120ms ease,
        box-shadow 120ms ease,
        transform 80ms ease;
    }

    .action-button.primary {
      background-color: var(--vscode-button-background);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
    }

    .action-button.secondary {
      border-color: var(--vscode-editor-foreground);
      color: var(--vscode-editor-foreground);
      opacity: 0.9;
    }

    .action-button:hover {
      transform: translateY(-1px);
      background-color: var(--vscode-button-hoverBackground, var(--vscode-button-background));
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }

    .action-button.secondary:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }

    .action-button:active {
      transform: translateY(0);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .action-button .label {
      font-weight: 600;
    }

    .action-button .accent {
      font-size: 11px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="container-inner">
      <div class="icon">📊</div>
      <h1>Kanban Board</h1>
      <p>
        The visual Kanban board interface is coming soon. This webview infrastructure is ready and
        will display the full 6-column board (Chat → Queue → Plan → Code → Audit → Completed) in the next task.
      </p>

      <div class="info">
        <h2>✅ Task 1 Complete: Webview Infrastructure</h2>
        <ul>
          <li>Webview panel opens successfully</li>
          <li>VSCode theme integration working</li>
          <li>Message passing configured (extension ↔ webview)</li>
          <li>Content Security Policy configured</li>
          <li>Ready for Task 2: Board layout shell</li>
        </ul>
        <span class="status">Phase 2 - Task 1/10</span>
      </div>

      <div class="actions">
        <button class="action-button primary" type="button">
          <span class="label">Begin Board Layout</span>
        </button>
        <button class="action-button secondary" type="button">
          <span class="label">View Phase 2 Plan</span>
          <span class="accent">phase-2 / 10</span>
        </button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    // Acquire VS Code API
    const vscode = acquireVsCodeApi();

    // Log that webview loaded successfully
    vscode.postMessage({
      type: 'log',
      value: 'Kanban Board webview loaded successfully'
    });

    // Example: Send message on click (for testing)
    document.addEventListener('click', () => {
      vscode.postMessage({
        type: 'log',
        value: 'Webview clicked'
      });
    });
  </script>
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
