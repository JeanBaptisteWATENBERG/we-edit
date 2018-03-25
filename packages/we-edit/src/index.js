'strict mode'
import "./tools/array-find-last"

export * from "./components"

export {ACTION, DOMAIN, reducer, getActive} from "./components/we-edit"
export {getContent, getSelection, getFile, getUndos, getRedos} from "./state/selector"
export {default as getClientRect} from "./tools/get-client-rect"
export {default as shallowEqual} from "./tools/shallow-equal"
export {default as uuid} from "./tools/uuid"

export {default as ContentQuery} from "./state/selector/query"
export {default as Input} from "./input"

export {editify} from "./model/edit"

export {default as model} from "./model"
