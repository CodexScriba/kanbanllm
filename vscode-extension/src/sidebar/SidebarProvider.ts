import * as vscode from 'vscode';

/**
 * Sidebar tree item representing menu items in the LLM Kanban sidebar
 */
export class SidebarItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly iconName: string,
    public readonly commandId: string,
    public readonly tooltip?: string
  ) {
    super(label, collapsibleState);

    // Set icon using VSCode's built-in codicons
    this.iconPath = new vscode.ThemeIcon(iconName);

    // Set tooltip
    this.tooltip = tooltip || label;

    // Set command to execute when item is clicked
    this.command = {
      command: commandId,
      title: label,
      arguments: []
    };
  }
}

/**
 * Tree data provider for the LLM Kanban sidebar
 *
 * Task 0: Initial implementation with just two menu items:
 * - Open Kanban Board
 * - Settings
 */
export class SidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined | null | void> =
    new vscode.EventEmitter<SidebarItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    // No initialization needed for Task 0
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item representation
   */
  getTreeItem(element: SidebarItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for the tree view
   *
   * Task 0: Returns only the two initial menu items
   * Future: Will return the full task hierarchy
   */
  getChildren(element?: SidebarItem): Thenable<SidebarItem[]> {
    if (element) {
      // No children for now (Task 0 - flat structure)
      return Promise.resolve([]);
    }

    // Root level items
    return Promise.resolve(this.getInitialMenuItems());
  }

  /**
   * Get the initial menu items for Task 0
   *
   * @returns Array of two menu items: Open Kanban Board and Settings
   */
  private getInitialMenuItems(): SidebarItem[] {
    return [
      new SidebarItem(
        'Open Kanban Board',
        vscode.TreeItemCollapsibleState.None,
        'graph',
        'llmKanban.openBoard',
        'Open the Kanban board view'
      ),
      new SidebarItem(
        'Settings',
        vscode.TreeItemCollapsibleState.None,
        'gear',
        'llmKanban.openSettings',
        'Configure LLM Kanban settings'
      )
    ];
  }
}
