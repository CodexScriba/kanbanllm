/**
 * Tree Data Provider for Kanban sidebar
 */

import * as vscode from 'vscode';
import * as path from 'path';
import type { Item, Stage } from '../core/types';
import { STAGES, STAGE_DISPLAY_NAMES } from '../core/types';
import { loadAllItems } from '../core/fs-adapter';

/**
 * Tree item type
 */
type TreeItemType = 'stage' | 'phase' | 'task';

/**
 * Kanban tree item
 */
export class KanbanTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: TreeItemType,
    public readonly stage?: Stage,
    public readonly item?: Item
  ) {
    super(label, collapsibleState);

    // Set context value for menu actions
    this.contextValue = itemType;

    // Set icon based on type
    if (itemType === 'phase') {
      this.iconPath = new vscode.ThemeIcon('package');
    } else if (itemType === 'task') {
      this.iconPath = new vscode.ThemeIcon('check');
    } else if (itemType === 'stage') {
      this.iconPath = new vscode.ThemeIcon('folder');
    }

    // Set description (shows tags for items)
    if (item && item.frontmatter.tags && item.frontmatter.tags.length > 0) {
      this.description = item.frontmatter.tags.join(', ');
    }

    // Set tooltip
    if (item) {
      this.tooltip = new vscode.MarkdownString();
      this.tooltip.appendMarkdown(`**${item.frontmatter.title}**\n\n`);
      this.tooltip.appendMarkdown(`Type: ${item.frontmatter.type}\n\n`);
      this.tooltip.appendMarkdown(`Stage: ${item.frontmatter.stage}\n\n`);
      if (item.frontmatter.phase) {
        this.tooltip.appendMarkdown(`Phase: ${item.frontmatter.phase}\n\n`);
      }
      if (item.frontmatter.tags && item.frontmatter.tags.length > 0) {
        this.tooltip.appendMarkdown(`Tags: ${item.frontmatter.tags.join(', ')}\n\n`);
      }
    }

    // Set command (open file on click)
    if (item) {
      this.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [vscode.Uri.file(item.filePath)]
      };
    }
  }
}

/**
 * Kanban Tree Data Provider
 */
export class KanbanTreeProvider implements vscode.TreeDataProvider<KanbanTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<KanbanTreeItem | undefined | null | void> =
    new vscode.EventEmitter<KanbanTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<KanbanTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private workspaceRoot: string;
  private items: Item[] = [];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Refresh tree view
   */
  async refresh(): Promise<void> {
    this.items = await loadAllItems(this.workspaceRoot);
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item
   */
  getTreeItem(element: KanbanTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of tree item
   */
  async getChildren(element?: KanbanTreeItem): Promise<KanbanTreeItem[]> {
    if (!element) {
      // Root level - return stages
      return this.getStageNodes();
    }

    if (element.itemType === 'stage' && element.stage) {
      // Stage level - return items in that stage
      return this.getItemsForStage(element.stage);
    }

    // Leaf node (phase/task has no children)
    return [];
  }

  /**
   * Get stage nodes
   */
  private async getStageNodes(): Promise<KanbanTreeItem[]> {
    // Load items if not already loaded
    if (this.items.length === 0) {
      this.items = await loadAllItems(this.workspaceRoot);
    }

    const stageNodes: KanbanTreeItem[] = [];

    for (const stage of STAGES) {
      const itemsInStage = this.items.filter(item => item.frontmatter.stage === stage);
      const count = itemsInStage.length;

      const label = `${STAGE_DISPLAY_NAMES[stage]} (${count})`;
      const node = new KanbanTreeItem(
        label,
        vscode.TreeItemCollapsibleState.Collapsed,
        'stage',
        stage
      );

      stageNodes.push(node);
    }

    return stageNodes;
  }

  /**
   * Get items for a specific stage
   */
  private getItemsForStage(stage: Stage): KanbanTreeItem[] {
    const itemsInStage = this.items.filter(item => item.frontmatter.stage === stage);

    // Sort: phases first, then tasks
    const phases = itemsInStage.filter(item => item.frontmatter.type === 'phase');
    const tasks = itemsInStage.filter(item => item.frontmatter.type === 'task');

    const nodes: KanbanTreeItem[] = [];

    // Add phases
    for (const phase of phases) {
      const icon = '📦';
      const label = `${icon} ${phase.frontmatter.title}`;
      const node = new KanbanTreeItem(
        label,
        vscode.TreeItemCollapsibleState.None,
        'phase',
        stage,
        phase
      );
      nodes.push(node);
    }

    // Add tasks
    for (const task of tasks) {
      const icon = '✅';
      const label = `${icon} ${task.frontmatter.title}`;
      const node = new KanbanTreeItem(
        label,
        vscode.TreeItemCollapsibleState.None,
        'task',
        stage,
        task
      );
      nodes.push(node);
    }

    return nodes;
  }
}
