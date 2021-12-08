import { IPlugin } from "../../../store/Plugin";
import FileInputViewActions from "./FileInputAction";
import FileInputViewSelectors from "./FileInputSelectors";
import { STORE_ALIAS as FileInputAlias, IFileInputViewStoreState, defaultState } from "./FileInputTypes";

export const FileInputView: IPlugin = {
    alias: FileInputAlias,
    defaultState,
    actions: FileInputViewActions,
    selectors: FileInputViewSelectors,
    childPlugins: []
}