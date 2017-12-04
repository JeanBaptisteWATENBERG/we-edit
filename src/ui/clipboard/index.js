import React, {Component} from "react"
import PropTypes from "prop-types"
import {connect} from "react-redux"
import {compose, mapProps,getContext,setDisplayName} from "recompose"

import Input from "we-edit/input"

import {ToolbarGroup} from "material-ui"
import {IconButton} from "we-edit-ui/components/with-no-doc"


import IconRedo from "material-ui/svg-icons/content/redo"
import IconUndo from "material-ui/svg-icons/content/undo"

import {ACTION, getActive} from "we-edit"

export default compose(
	setDisplayName("clipboard"),
	getContext({store:PropTypes.object}),
	mapProps(({store:{dispatch}})=>({
		undo(){
			dispatch(ACTION.History.undo())
		},
		redo(){
			dispatch(ACTION.History.redo())
		}
	})),
	connect(state=>{
		const{canRedo, canUndo}=getActive(state)
		return {canRedo, canUndo}
	})
)(({undo,redo, canUndo, canRedo})=>(
	<ToolbarGroup>
		<IconButton
			disabled={!canUndo}
			children={<IconUndo/>}
			onClick={undo}
			/>
		<IconButton
			disabled={!canRedo}
			children={<IconRedo/>}
			onClick={redo}
			/>
	</ToolbarGroup>
))