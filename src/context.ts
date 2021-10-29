import SprintRun from "./SprintRun"

import * as React from "react"
import WordSprintPlugin from "../main";

export const SprintRunContext = React.createContext<SprintRun>(undefined);

export const PluginContext = React.createContext<WordSprintPlugin>(undefined);
