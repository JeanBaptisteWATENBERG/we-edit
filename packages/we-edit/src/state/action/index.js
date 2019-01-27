import {getContent, nextCursorable, nextSelectable, prevCursorable, prevSelectable, getSelection} from "../selector"
import {ACTION as History} from "../undoable"
import Query from "../selector/query"

function isInSameParagraph(state,id1,id2){
	return new Query(state,[id1])
		.parents("paragraph")
		.is(new Query(state,[id2]).parents("paragraph"))
}

export const Cursor={
	ACTIVE: docId=>({type:"we-edit/selection/DOC",payload:docId}),
	AT: (contentId, at)=>Selection.SELECT(contentId, at),
	MOVE_RIGHT: (shift)=>(dispatch,getState)=>{
		const state=getState()
		let {start,end,cursorAt}=getSelection(state)

		if(start.id==end.id && start.at==end.at){
			let {id,at}=shift ? end : start
			let target=getContent(state,id).toJS()
			const text=target.children
			if(text.length>at){
				at++
			}else{
				target=nextCursorable(state,id)
				if(target){
					at=isInSameParagraph(state,id,target) ? 1 : 0
					id=target
				}else{
					//keep cursor at end of current target
				}
			}
			if(shift)
				dispatch(Selection.END_AT(id,at))
			else
				dispatch(Selection.SELECT(id,at))
		}else{
			if(shift){
				let {id,at}=cursorAt=="end" ? end : start
				let target=getContent(state,id).toJS()
				const text=target.children
				if(text && text.length>at){
					at++
				}else{
					target=nextCursorable(state,id)
					if(target){
						at=isInSameParagraph(state,id,target) ? 1 : 0
						id=target
					}else{
						//keep cursor at end of current target
					}
				}
				dispatch(Selection[`${cursorAt.toUpperCase()}_AT`](id,at))
			}else
				dispatch(Selection.SELECT(end.id,end.at))
		}
	},
	MOVE_LEFT: (shift)=>(dispatch,getState)=>{
		const state=getState()
		let {start,end,cursorAt}=getSelection(state)
		if(start.id==end.id && start.at==end.at){
			let {id,at}=shift ? end : start
			if(at>0){
				at--
			}else{
				let target=prevCursorable(state,id)
				if(target){
					let children=getContent(state, target).get("children")
					at=isInSameParagraph(state,id,target) ? children.length-1 : children.length
					id=target
				}else{
					//keep cursor at end of current target
				}
			}
			if(shift)
				dispatch(Selection.START_AT(id, at))
			else
				dispatch(Selection.SELECT(id,at))
		}else{
			if(shift){
				let {id,at}=cursorAt=="start" ? start : end
				if(at>0){
					at--
				}else{
					let target=prevCursorable(state,id)
					if(target){
						let children=getContent(state, target).get("children")
						if(!children){
							at=1
						}else{
							at=isInSameParagraph(state,id,target) ? children.length-1 : children.length
						}
						id=target
					}else{
						//keep cursor at end of current target
					}
				}
				dispatch(Selection[`${cursorAt.toUpperCase()}_AT`](id,at))

			}else
				dispatch(Selection.SELECT(start.id,start.at))
		}
	},
}

export const Text={
	INSERT: t=>({type:"we-edit/text/INSERT",payload:t}),
	REMOVE: n=>({type:"we-edit/text/REMOVE",payload:n}),
	RETURN: n=>({type:"we-edit/text/RETURN"}),
}

export const Selection={
	SELECT: function(start, at=0, end=start, endAt=at){
		endAt=arguments.length==1 ? 1 : endAt
		return {
			type:`we-edit/selection/SELECTED`,
			payload: {
				start:{
					id:start,
					at
				}
				,end:{
					id:end,
					at:endAt
				}
			}
		}
	},
	START_AT:(id,at)=>({type:"we-edit/selection/STARTAT",payload:{id,at}}),
	END_AT: (id,at)=>({type:"we-edit/selection/ENDAT",payload:{id,at}}),
	REMOVE: ()=>({type:"we-edit/selection/REMOVE"}),
	COPY: payload=>({type:"we-edit/selection/COPY",payload}),
	PASTE: payload=>({type:"we-edit/selection/PASTE",payload}),
	CUT: payload=>({type:"we-edit/selection/CUT",payload}),
	MOVE: payload=>({type:"we-edit/selection/MOVE",payload}),
	UPDATE: payload=>({type:"we-edit/selection/UPDATE", payload}),
	STYLE: payload=>({type:"we-edit/selection/STYLE",payload}),
}

export const Entity={
	CREATE: element=>({type:"we-edit/entity/CREATE", payload:element}),
	UPDATE: changing=>({type:"we-edit/entity/UPDATE", payload:changing}),
}

export const Statistics=stat=>({type:"we-edit/statistics",payload:stat})

export const ACTION={Cursor, Text, Selection,Entity,History,Statistics}

export default ACTION
