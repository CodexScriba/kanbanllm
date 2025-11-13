import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'kanbanllm.openSampleColumn',
    () => {
      SampleColumnPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // No teardown required for this simple example
}

class SampleColumnPanel {
  private static currentPanel: SampleColumnPanel | undefined;
  private static readonly viewType = 'kanbanllmSampleColumn';
  private readonly panel: vscode.WebviewPanel;
  // extensionUri kept for future asset resolution if needed
  private readonly extensionUri: vscode.Uri;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

    this.panel.onDidDispose(
      () => this.dispose(),
      null,
      []
    );

    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'log':
            console.log('[SampleColumn Webview]', message.value);
            break;
          default:
            break;
        }
      },
      undefined,
      []
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column =
      vscode.window.activeTextEditor?.viewColumn
        ? vscode.window.activeTextEditor.viewColumn + 1
        : vscode.ViewColumn.Two;

    if (SampleColumnPanel.currentPanel) {
      SampleColumnPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      SampleColumnPanel.viewType,
      'Sample Column',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    SampleColumnPanel.currentPanel = new SampleColumnPanel(panel, extensionUri);
  }

  public dispose() {
    SampleColumnPanel.currentPanel = undefined;
    this.panel.dispose();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta http-equiv='Content-Security-Policy'
        content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Sample Column</title>
  <style>
    body {
      font-family: var(--vscode-font-family, system-ui, sans-serif);
      margin: 0;
      padding: 16px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    button {
      padding: 8px 14px;
      border-radius: 4px;
      border: 1px solid var(--vscode-button-border, transparent);
      cursor: pointer;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    #message {
      margin-top: 16px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <button id='sample-button'>Click me</button>
  <div id='message'></div>

  <script nonce='${nonce}'>
    const vscode = acquireVsCodeApi();
    const button = document.getElementById('sample-button');
    const message = document.getElementById('message');

    button.addEventListener('click', () => {
      message.textContent = 'you click a button';
      vscode.postMessage({ type: 'log', value: 'Button was clicked in webview' });
    });
  </script>
</body>
</html>`;
  }

  private getNonce(): string {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}