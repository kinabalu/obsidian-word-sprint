import {ItemView, WorkspaceLeaf} from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PluginContext } from "./context";
import { StatReactView } from './StatReactView'
import WordSprintPlugin from "./main";

export const STAT_VIEW_TYPE = "stat-view";

export default class StatView extends ItemView {
	plugin: WordSprintPlugin

	constructor(plugin: WordSprintPlugin, leaf: WorkspaceLeaf) {
		super(leaf);

		this.plugin = plugin
	}

	getViewType() {
		return STAT_VIEW_TYPE;
	}

	getIcon() {
		return "pencil"
	}

	getDisplayText() {
		return "Word Sprint";
	}

	async onOpen() {
		ReactDOM.render(
			<PluginContext.Provider value={this.plugin}>
				<StatReactView />
			</PluginContext.Provider>,
			this.containerEl.children[1]
		)
	}

	async onClose() {
		ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
	}
}
