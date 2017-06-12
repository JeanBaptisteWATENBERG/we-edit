import {getSelection, getParentId,getFile,getContent} from "state/selector"
import {query} from "state/selector"
import ACTION from "state/action"
import Content from "./content"
import {selection as select} from "./selection"

export default class Changer{
	constructor(state){
		this._state=state
		this._undoables={}
		this._updated={}
		this._selection=getSelection(state)
		
		this._mutableState=state.updateIn(["content"],c=>c.asMutable())
		this.$=context=>new Content(this._mutableState,context)
	}

	getParentId(id){
		return getParentId(this._state.get("content"), id)
	}

	state(){
		let state={}
		if(Object.keys(this._updated).length>0)
			state.updated=this._updated

		if(Object.keys(this._undoables).length>0)
			state.undoables=this._undoables

		if(Object.keys(this._selection).length>0)
			state.selection=this._selection

		if(Object.keys(state).length>0)
			return state
	}

	get selection(){
		return this._selection
	}

	get file(){
		return getFile(this._state)
	}

	getContent(id){
		return getContent(this._state,id).toJS()
	}

	updateChildren(parent,f){
		if(!(parent in this._updated)){
			this._updated[parent]={
				children:this.getContent(parent).children
			}
		}

		if(typeof(f)=="string"){
			let children=this._updated[parent].children
			let index=children.indexOf(f)
			if(index!=-1)
				children.splice(index,1)
		}else{
			f(this._updated[parent].children)
		}
	}

	updateSelection(id,at, endId=id, endAt=at, cursorAt){
		if(cursorAt=="start" || cursorAt=="end")
			this._selection.cursorAt=cursorAt

		this._selection={...this._selection,start:{id,at}, end:{id:endId, at:endAt}}
		return this._selection
	}
	
	cursorAt(id,at){
		this._selection=select(this._selection,ACTION.Cursor.AT(id,at))
	}
	
	save4Undo(node,id){
		this._undoables[id||node.attr('id')]=this.file.cloneNode(node)
	}

	renderChanged(changed){
		let node=this._renderChanged(changed)
		if(this._state.hasIn(["content",node.id]))
			this._updated[node.id]={}
		return node
	}

	_renderChanged(changed){
		throw new Error("you need implement it")
	}
}
