/**
 * Tree view provider for the sidebar
 * Shows kanban items organized by stage
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { Item, Stage, STAGES, STAGE_DISPLAY_NAMES } from '../core/types';
import { loadAllItems } from '../core/fs-adapter';
import { getWorkspaceRoot } from '../utils/workspace';

/**
 * Tree item types
 */
type TreeItemType = 'stage' | 'phase' | 'task';

/**
 * Tree item data
 */
interface KanbanTreeItem {
  type: TreeItemType;
  label: string;
  stage?: Stage;
  item?: Item;
  count?: number;
}

/**
 * Kanban tree data provider
 */
export class KanbanTreeProvider implements vscode.TreeDataProvider<KanbanTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<KanbanTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private items: Item[] = [];

  constructor(private workspaceRoot: string) {
    this.refresh();
  }

  /**
   * Refresh the tree view
   */
  async refresh(): Promise<void> {
    try {
      this.items = await loadAllItems(this.workspaceRoot);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('Failed to load items:', error);
      this.items = [];
      this._onDidChangeTreeData.fire();
    }
  }

  /**
   * Get tree item
   */
  getTreeItem(element: KanbanTreeItem): vscode.TreeItem {
    if (element.type === 'stage') {
      const treeItem = new vscode.TreeItem(
        element.label,
        vscode.TreeItemCollapsibleState.Expanded
      );
      treeItem.contextValue = 'stage';
      treeItem.description = element.count !== undefined ? `${element.count}` : '';
      treeItem.iconPath = new vscode.ThemeIcon('folder');
      return treeItem;
    }

    if (element.type === 'phase' && element.item) {
      const treeItem = new vscode.TreeItem(
        element.item.frontmatter.title,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.contextValue = 'phase';
      treeItem.description = element.item.frontmatter.tags?.join(', ');
      treeItem.iconPath = new vscode.ThemeIcon('package');
      treeItem.command = {
        command: 'vscode.open',
        title: 'Open Phase',
        arguments: [vscode.Uri.file(element.item.filePath || '')],
      };
      treeItem.tooltip = `Phase: ${element.item.frontmatter.title}\nID: ${element.item.frontmatter.id}`;
      return treeItem;
    }

    if (element.type === 'task' && element.item) {
      const treeItem = new vscode.TreeItem(
        element.item.frontmatter.title,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.contextValue = 'task';
      treeItem.description = element.item.frontmatter.tags?.join(', ');
      treeItem.iconPath = new vscode.ThemeIcon('check');
      treeItem.command = {
        command: 'vscode.open',
        title: 'Open Task',
        arguments: [vscode.Uri.file(element.item.filePath || '')],
      };
      treeItem.tooltip = `Task: ${element.item.frontmatter.title}\nPhase: ${element.item.frontmatter.phase}\nID: ${element.item.frontmatter.id}`;
      return treeItem;
    }

    return new vscode.TreeItem('Unknown');
  }

  /**
   * Get children of a tree item
   */
  getChildren(element?: KanbanTreeItem): Thenable<KanbanTreeItem[]> {
    if (!element) {
      // Root level: show stages
      return Promise.resolve(this.getStageItems());
    }

    if (element.type === 'stage' && element.stage) {
      // Stage level: show items in this stage
      return Promise.resolve(this.getItemsForStage(element.stage));
    }

    return Promise.resolve([]);
  }

  /**
   * Get stage items (root level)
   */
  private getStageItems(): KanbanTreeItem[] {
    return STAGES.map((stage) => {
      const itemsInStage = this.items.filter((item) => item.frontmatter.stage === stage);
      return {
        type: 'stage' as TreeItemType,
        label: STAGE_DISPLAY_NAMES[stage],
        stage,
        count: itemsInStage.length,
      };
    });
  }

  /**
   * Get items for a specific stage
   */
  private getItemsForStage(stage: Stage): KanbanTreeItem[] {
    const itemsInStage = this.items.filter((item) => item.frontmatter.stage === stage);

    // Sort: phases first, then tasks
    const phases = itemsInStage
      .filter((item) => item.frontmatter.type === 'phase')
      .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));

    const tasks = itemsInStage
      .filter((item) => item.frontmatter.type === 'task')
      .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));

    return [
      ...phases.map((item) => ({
        type: 'phase' as TreeItemType,
        label: item.frontmatter.title,
        item,
      })),
      ...tasks.map((item) => ({
        type: 'task' as TreeItemType,
        label: item.frontmatter.title,
        item,
      })),
    ];
  }
}

/**
 * Register the tree view provider
 */
export function registerKanbanTreeView(
  context: vscode.ExtensionContext,
  workspaceRoot: string
): KanbanTreeProvider {
  const treeDataProvider = new KanbanTreeProvider(workspaceRoot);

  const treeView = vscode.window.createTreeView('llmkanban.treeView', {
    treeDataProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(treeView);

  // Register refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('llmkanban.refreshBoard', () => {
      treeDataProvider.refresh();
    })
  );

  return treeDataProvider;
}
