import * as vscode from 'vscode';
import { loadBoardData, type FlatItem } from '../core/fs-adapter';
import { Stage } from '../core/types';

/**
 * Sidebar tree item types
 */
type TreeItemType = 'menu' | 'stage' | 'item';

/**
 * Sidebar tree item with extended properties
 */
export class KanbanTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: TreeItemType,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemData?: FlatItem,
    public readonly stage?: Stage,
    public readonly commandId?: string
  ) {
    super(label, collapsibleState);

    // Set icon based on type
    if (type === 'menu') {
      this.iconPath = new vscode.ThemeIcon(commandId === 'llmKanban.openBoard' ? 'graph' : 'gear');
    } else if (type === 'stage') {
      this.iconPath = this.getStageIcon(stage!);
      this.description = `${this.children?.length || 0} items`;
    } else if (type === 'item' && itemData) {
      this.iconPath = new vscode.ThemeIcon(itemData.type === 'phase' ? 'package' : 'check');
      this.description = itemData.tags.join(', ');
      this.tooltip = `${itemData.title}\nID: ${itemData.id}\nUpdated: ${new Date(itemData.updated).toLocaleString()}`;
      this.contextValue = 'kanbanItem';
    }

    // Set command for menu items
    if (type === 'menu' && commandId) {
      this.command = {
        command: commandId,
        title: label,
        arguments: []
      };
    }
    // Set command for item clicks (open file)
    else if (type === 'item' && itemData) {
      this.command = {
        command: 'llmKanban.openItemFromSidebar',
        title: 'Open Item',
        arguments: [itemData.id]
      };
    }
  }

  public children?: KanbanTreeItem[];

  private getStageIcon(stage: Stage): vscode.ThemeIcon {
    const iconMap: Record<Stage, string> = {
      queue: 'inbox',
      plan: 'edit',
      code: 'code',
      audit: 'search',
      completed: 'check-all',
      chat: 'comment-discussion'
    };
    return new vscode.ThemeIcon(iconMap[stage]);
  }
}

/**
 * Tree data provider for the LLM Kanban sidebar with full task hierarchy
 */
export class SidebarProvider implements vscode.TreeDataProvider<KanbanTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<KanbanTreeItem | undefined | null | void> =
    new vscode.EventEmitter<KanbanTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<KanbanTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private _workspaceRoot: string | undefined;
  private _cacheEnabled: boolean = true;

  constructor() {
    // Get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this._workspaceRoot = workspaceFolders[0].uri.fsPath;
    }
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
  getTreeItem(element: KanbanTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for the tree view
   */
  async getChildren(element?: KanbanTreeItem): Promise<KanbanTreeItem[]> {
    if (!this._workspaceRoot) {
      return this.getMenuItemsOnly();
    }

    // Root level
    if (!element) {
      return this.getRootItems();
    }

    // Menu items have no children
    if (element.type === 'menu') {
      return [];
    }

    // Stage items - return items in that stage
    if (element.type === 'stage' && element.children) {
      return element.children;
    }

    // FlatItem children (phases can contain tasks)
    if (element.type === 'item' && element.itemData?.type === 'phase') {
      return element.children || [];
    }

    return [];
  }

  /**
   * Get root level items (menu + stages)
   */
  private async getRootItems(): Promise<KanbanTreeItem[]> {
    const menuItems = [
      new KanbanTreeItem(
        'Open Kanban Board',
        'menu',
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'llmKanban.openBoard'
      ),
      new KanbanTreeItem(
        'Settings',
        'menu',
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'llmKanban.openSettings'
      )
    ];

    try {
      const boardData = await loadBoardData(this._workspaceRoot!);
      const stageItems = await this.buildStageTree(boardData);
      return [...menuItems, ...stageItems];
    } catch (error) {
      console.error('Error loading sidebar data:', error);
      return menuItems;
    }
  }

  /**
   * Build hierarchical tree of stages → phases → tasks
   */
  private async buildStageTree(boardData: any): Promise<KanbanTreeItem[]> {
    const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed'];
    const stageLabels: Record<Stage, string> = {
      queue: 'Queue',
      plan: 'Plan',
      code: 'Code',
      audit: 'Audit',
      completed: 'Completed',
      chat: 'Chat'
    };

    return stages.map(stage => {
      const items = boardData[stage] || [];
      const phases = items.filter((item: FlatItem) => item.type === 'phase');
      const tasks = items.filter((item: FlatItem) => item.type === 'task');

      // Build tree: phases with their tasks, then orphan tasks
      const childItems: KanbanTreeItem[] = [];

      // Add phases with their tasks
      phases.forEach((phase: FlatItem) => {
        const phaseTasks = tasks.filter((task: FlatItem) => task.phaseId === phase.id);
        const phaseItem = new KanbanTreeItem(
          phase.title,
          'item',
          phaseTasks.length > 0
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
          phase,
          stage
        );

        if (phaseTasks.length > 0) {
          phaseItem.children = phaseTasks.map((task: FlatItem) =>
            new KanbanTreeItem(
              task.title,
              'item',
              vscode.TreeItemCollapsibleState.None,
              task,
              stage
            )
          );
        }

        childItems.push(phaseItem);
      });

      // Add orphan tasks (tasks without a phase)
      const orphanTasks = tasks.filter((task: FlatItem) => !task.phaseId);
      orphanTasks.forEach((task: FlatItem) => {
        childItems.push(
          new KanbanTreeItem(
            task.title,
            'item',
            vscode.TreeItemCollapsibleState.None,
            task,
            stage
          )
        );
      });

      const stageItem = new KanbanTreeItem(
        `${stageLabels[stage]} (${items.length})`,
        'stage',
        childItems.length > 0
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None,
        undefined,
        stage
      );

      stageItem.children = childItems;
      return stageItem;
    });
  }

  /**
   * Get only menu items (when no workspace open)
   */
  private getMenuItemsOnly(): KanbanTreeItem[] {
    return [
      new KanbanTreeItem(
        'Open Kanban Board',
        'menu',
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'llmKanban.openBoard'
      ),
      new KanbanTreeItem(
        'Settings',
        'menu',
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'llmKanban.openSettings'
      )
    ];
  }
}
