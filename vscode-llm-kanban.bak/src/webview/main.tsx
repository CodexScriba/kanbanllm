/**
 * Webview entry point
 * React application for the Kanban board
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Board } from './components/Board';
import './styles/main.css';

// Get VS Code API
const vscode = acquireVsCodeApi();

// Render the board
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Board vscode={vscode} />
  </React.StrictMode>
);

// Type declaration for VS Code API
declare global {
  function acquireVsCodeApi(): {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
  };
}
