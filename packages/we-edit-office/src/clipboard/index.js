import React from "react"
import {connect} from "react-redux"
import {compose, setDisplayName, onlyUpdateForKeys} from "recompose"

import {ToolbarGroup} from "material-ui"
import CheckIconButton from "../components/check-icon-button"


import IconCopy from "material-ui/svg-icons/content/content-copy"
import IconPaste from "material-ui/svg-icons/content/content-paste"
import IconCut from "material-ui/svg-icons/content/content-cut"


import {ACTION, getSelection, getActive} from "we-edit"

export default compose(
	setDisplayName("clipboard"),
	connect(state=>{
		state=getActive(state).state
		const {start={},end={}}=getSelection(state)
		const isCursor=start.id==end.id && start.at==end.at
        return {
			withSelection: !isCursor,
            withClipboard:!!window._clipboard,
		}
	},(dispatch)=>{
		return {
            cut(){
                dispatch(ACTION.Selection.CUT())
            },
			copy(){
				dispatch(ACTION.Selection.COPY())
			},
			paste(){
				dispatch(ACTION.Selection.PASTE())
			},
		}
	}),
	onlyUpdateForKeys(['withSelection','withClipboard'])
)(({cut,copy,paste,withSelection,withClipboard,children})=>(
	<ToolbarGroup>
		<CheckIconButton
			label="paste"
			status={withClipboard ? "uncheck" : "disabled"}
			children={<IconPaste/>}
			onClick={paste}
			/>
		<CheckIconButton
			label="cut"
			status={withSelection ? "uncheck" : "disabled"}
			children={<IconCut/>}
			onClick={cut}
			/>
		<CheckIconButton
			label="copy"
			status={withSelection ? "uncheck" : "disabled"}
			children={<IconCopy/>}
			onClick={copy}
			/>
		{children}
	</ToolbarGroup>
))
