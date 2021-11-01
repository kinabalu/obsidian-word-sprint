import {ItemView, WorkspaceLeaf} from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PluginContext } from "./context";
import { StatReactView } from './StatReactView'
import WordSprintPlugin from "./main";
import {ICON_NAME, LEAF_VIEW_DISPLAY_TEXT} from "./constants";

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
		return ICON_NAME
	}

	getDisplayText() {
		return LEAF_VIEW_DISPLAY_TEXT
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
