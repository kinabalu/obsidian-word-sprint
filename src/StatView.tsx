import {ItemView, WorkspaceLeaf} from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SprintRunContext, PluginContext } from "./context";
import { StatReactView } from './StatReactView'
import SprintRun from "./SprintRun";
import WordSprintPlugin from "../main";

export const STAT_VIEW_TYPE = "stat-view";

export default class StatView extends ItemView {
	sprintRun: SprintRun;
	plugin: WordSprintPlugin

	constructor(sprintRun: SprintRun, plugin: WordSprintPlugin, leaf: WorkspaceLeaf) {
		super(leaf);

		this.sprintRun = sprintRun
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
				<SprintRunContext.Provider value={this.sprintRun}>
					<StatReactView />
				</SprintRunContext.Provider>
			</PluginContext.Provider>,
			this.containerEl.children[1]
		)
	}

	async onClose() {
		ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
	}
}
