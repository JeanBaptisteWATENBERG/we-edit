import React, {Fragment} from "react"
import PropTypes from "prop-types"

import Base from "../section"

import {editable} from "model/edit"
import recomposable from "./recomposable"

const Super=editable(recomposable(Base))

export default class Section extends Super{
	static contextTypes={
		...Super.contextTypes,
		shouldRemoveComposed:PropTypes.func,
		shouldContinueCompose:PropTypes.func
	}

	createComposed2Parent(){
		return React.cloneElement(super.createComposed2Parent(...arguments),{childIndex:this.computed.children.length})
	}

	componentWillReceiveProps({changed,children}){
		if(this.context.shouldRemoveComposed(this)){
			if(changed){
				let iFirstChangedChild=this.getFirstChangedChildIndex(children)
				console.assert(iFirstChangedChild>-1)

				this.removeComposedFrom(iFirstChangedChild)
			}

			this.computed.composed.forEach(page=>this.context.parent.appendComposed(page))
		}
	}

	getFirstChangedChildIndex(children){
		return children.findIndex((current,i)=>{
			let last=this.props.children[i]
			if(!last)
				return true
			if(current.props.id!=last.props.id)
				return true
			return current.props.changed
		})
	}

	removeComposedFrom(iFirstChangedChild){
		this.computed.children=this.computed.children.slice(0,iFirstChangedChild)

		if(this.computed.children.length==0){
			this.computed.composed=[]
			return
		}

		let changedPageIndex=this.computed.composed.findIndex(({columns})=>{
			let start=columns[0].children[0].props.childIndex
			if(start==iFirstChangedChild)
				return true
			else if(start<iFirstChangedChild){
				let lastColumn=columns[columns.length-1]
				let lastColumnChildren=lastColumn.children
				let end=lastColumnChildren[lastColumnChildren.length-1].props.childIndex
				return end>=iFirstChangedChild
			}else {
				throw new Error("should not be here")
			}
		})

		let changedPage=this.computed.composed[changedPageIndex]
		this.computed.composed=this.computed.composed.slice(0,changedPageIndex)


		let changedColumnIndex=changedPage.columns.findIndex(({children})=>{
			let start=children[0].props.childIndex
			if(start==iFirstChangedChild)
				return true
			else if(start<iFirstChangedChild){
				let end=children[children.length-1].props.childIndex
				return end>=iFirstChangedChild
			}else{
				throw new Error("should not be here")
			}
		})

		let changedColumn=changedPage.columns[changedColumnIndex]
		changedPage.columns=changedPage.columns.slice(0,changedColumnIndex)


		let changedLineIndex=changedColumn.children.findIndex(line=>line.props.childIndex>=iFirstChangedChild)
		changedColumn.children=changedColumn.children.slice(0,changedLineIndex)
		changedPage.columns.push(changedColumn)

		this.computed.composed.push(changedPage)

		if(changedPage.lastSectionPage){
			if(!this.isAllComposed()){
				delete changedPage.lastSectionPage
			}
		}
	}

	isAllComposed(){
		return this.computed.children.length==this.props.children.length
	}

	render(){
		if(this.isAllComposed())
			return null

		if(!this.context.shouldContinueCompose())
			return null

		return (<Fragment>{this.props.children.slice(this.computed.children.length)}</Fragment>)
	}

	onAllChildrenComposed(){
		super.onAllChildrenComposed()
		let last=this.computed.composed[this.computed.composed.length-1]
		last.lastSectionPage=true
	}
}
