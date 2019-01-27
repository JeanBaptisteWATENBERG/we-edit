import {getSelection,getFile} from "../../state/selector"
import ACTION from "../../state/action"
import xQuery from "./xquery"

 class Base{
	constructor(state){
		this._state=state
		this._undoables={}
		this._selection=getSelection(state)
		this._file=getFile(state)

		this.$=context=>new xQuery(state,context)
	}

	state(){
		let state={}

		if(Object.keys(this._undoables).length>0)
			state.undoables=this._undoables

		if(Object.keys(this._selection).length>0)
			state.selection=this._selection

		return state
	}

	get selection(){
		return this._selection
	}

	get file(){
		return this._file
	}

	save4undo(id){
		this._undoables[id]=this.file.cloneNode(this.file.getNode(id),false)
	}

	renderChanged(id){
		let docNode=typeof(id)=="string" ? this.file.getNode(id) : id

		try{
			docNode=docNode.get(0)
		}catch(e){

		}

		let rendered=this.file.renderChanged(docNode)

		id=rendered.id

		if(this._state.hasIn(["content",id])){
			this._state.setIn(["_content",id,"parent"],
				this._state.getIn(["content",id,"parent"]))
		}

		return rendered
	}

	cursorAt(id,at, endId=id, endAt=at, cursorAt){
		if(cursorAt=="start" || cursorAt=="end")
			this._selection.cursorAt=cursorAt

		this._selection={...this._selection,start:{id,at}, end:{id:endId, at:endAt}}
		return this._selection
	}
}

class Reducer extends Base{
	IsEntityAction({id}={}){
		if(id!=undefined){
			return id
		}
		const {start,end}=this.selection
		if(start.id==end.id && start.at==end.at){
			return start.id
		}
		
		return false
	}
	
	clone(keepId=false){
		return this.selection
		const {start,end}=this.selection
		return this.file.clone(start,end, keepId)
	}
	
	splitAtUpto({id,at},to="paragraph"){
		const target=this.$('#'+id)
		const text=target.text()
		to=typeof(to)=="string" ? target.closest(to) : to
		const parent=to.parent()

		this.save4undo(to.attr('id'))
		this.save4undo(parent.attr('id'))

		let to1=target.constructUp(to)
			.insertAfter(to)

		let t0=to1.findFirst("text")
			.text(text.substr(at))

		target.parentsUntil(to).each(function(i,node,$){
			this.eq(i).after($(node).nextAll())
		},t0.parentsUntil(to1))

		target.text(text.substr(0,at))

		this.renderChanged(to1.attr('id'))
		this.renderChanged(to.attr('id'))

		return [to,to1]
	}
	
	getTyped(type){
		const {start,end}=this.selection
		const target0=this.$('#'+start.id)
		const target1=this.$("#"+end.id)
		const ancestor=target0.parentsUntil(target1.parentsUntil()).last().parent()
		
		const ancestors0=target0.parentsUntil(ancestor)
		const ancestors1=target1.parentsUntil(ancestor)
		return []
	}
	
	insert_text_at(inserting,{id,at}){
		const target=this.$('#'+id)
		const p=target.closest("paragraph")

		const pieces=inserting.split(/[\r\n]+/g)
		const FIRST=0
		const LAST=pieces.length-1

		this.save4undo(p.attr("id"))

		let text=target.text()

		pieces.reduceRight((b,piece,i)=>{
			switch(i){
				case FIRST:{//first piece merged into
					target.text(text.substring(0,at)+piece)
					this.renderChanged(p.attr("id"))
					break
				}
				case LAST:{
					let p0=target.constructUp(p)
						.insertAfter(p)

					let t0=p0.findFirst("text")
						.text(piece+text.substr(at))

					target.parentsUntil(p).each(function(i,node,$){
						this.eq(i).after($(node).nextAll())
					},t0.parentsUntil(p0))

					this.cursorAt(t0.attr("id"), piece.length)
					break
				}
				default:{
					target.constructUp(p)
						.insertAfter(p)
						.findFirst("text")
						.text(piece)
					break
				}
			}
		},1)
	}
	
	merge_content_at(content,{id,at}){
		
	}
	
	remove_object_at({id,at}){
		const target=this.$(`#${id}`)
		if(target.attr("type")=="text"){
			
		}else{
			
		}
	}
	
	backspace_object_at({id,at}){
		const target=this.$(`#${id}`)
	}
}

class Content extends Reducer{
	create(element){
		if(this.IsEntityAction()===false){
			this.remove()
		}
		
		const {start:{id,at}}=this.selection
		const target=this.$(`#${id}`)

		const cursor=this.file.createNode(element, this, target)

		this.cursorAt(cursor.id, cursor.at)

		return this
	}

	insert(data){
		if(this.IsEntityAction()===false){
			this.remove()
		}
		
		if(typeof(data)=="string"){
			this.insert_text_at(data,this.selection.start)
		}else{
			this.merge_content_at(data, this.selection.start)
		}
		return this
	}

	update({id,type,...changing}){
		var targets=[]
		if((id=this.isEntityAction(arguments[0]))!==false){
			targets.push(id)
			type=type||this.$(`#${id}`).attr("type")
		}else{
			targets=this.getTyped(type)
		}
		
		targets.forEach(target=>{
			target=this.file.getNode(target)
			this.file.updateNode({id:target,type},changing)
			this.renderChanged(target)
		})
		
		return this
	}

	remove(at){
		if(this.isEntityAction()!==false){
			if(at==1){
				this.remove_object_at(start)
			}else if(at=-1){
				this.backspace_object_at(start)
			}
			return this 
		}
		
		const {start,end}=this.selection
		const target0=this.$('#'+start.id)
		const target1=this.$("#"+end.id)
		const ancestor=target0.parentsUntil(target1.parentsUntil()).last().parent()
		
		const ancestors0=target0.parentsUntil(ancestor)
		const ancestors1=target1.parentsUntil(ancestor)
		const top0=ancestors0.last()
		const top1=ancestors1.last()

		top0.nextUntil(top1).remove()
		ancestors0.not(top0).each((i,a)=>$(a).nextAll().remove())
		ancestors1.not(top1).each((i,a)=>$(a).prevAll().remove())
		
		if(target0.attr("type")=="text"){
			const text=target0.text()
			target0.text(text.substring(0,start.at))
		}
		
		if(target1.attr("type")=="text"){
			const text=target1.text()
			target1.text(text.substr(end.at))
		}
		
		this.renderChanged(ancestor.attr("id"))
		this.cursorAt(start.id,start.at)
		return this
	}
}

class Clipboard extends Content{
	move(dest){
		const cloned=this.clone(true)
		return this.insert(cloned, dest)
	}

	cut({clipboardData}){
		clipboardData.setData("application/we-edit",this.clone())
		return this.remove()
	}

	copy({clipboardData}){
		clipboardData.setData("application/we-edit",this.clone())
	}

	paste({clipboardData}){
		const data=clipboardData.getData("application")||clipboardData.getData("text")
		if(data){
			if(this.isEntityAction()===false){
				this.remove()
			}
			this.insert(data)
		}
		
		return  this
	}
}

export default class extends Clipboard{
	
}