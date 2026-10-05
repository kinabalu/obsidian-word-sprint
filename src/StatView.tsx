import {ItemView, WorkspaceLeaf} from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { PluginContext } from "./context";
import { StatReactView } from './StatReactView'
import WordSprintPlugin from "./main";
import {ICON_NAME, LEAF_VIEW_DISPLAY_TEXT} from "./constants";

export const STAT_VIEW_TYPE = "stat-view";

export default class StatView extends ItemView {
	plugin: WordSprintPlugin
	root: Root | null = null

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
		this.root = createRoot(this.containerEl.children[1])
		this.root.render(
			<PluginContext.Provider value={this.plugin}>
				<StatReactView />
			</PluginContext.Provider>
		)
	}

	async onClose() {
		this.root?.unmount()
		this.root = null
	}
}
