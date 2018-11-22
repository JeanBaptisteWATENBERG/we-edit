import React, {Component} from "react"
import PropTypes from "prop-types"


import composable,{HasParentAndChild} from "./composable"
import {models} from "we-edit"
const {Frame:Base}=models

import {Frame as ComposedFrame, Group} from "./composed"

const Super=HasParentAndChild(Base)

export default class Frame extends Super{
	nextAvailableSpace(required={}){
		const {width:maxWidth}=this.props
		const {height:minHeight}=required
		return {
			width:maxWidth,
			height:this.availableHeight,
			blocks:this.exclusive(minHeight),
			frame:this,
		}
	}

	isDirtyIn(rect){
		const isIntersect=(A,B)=>!(
				((A.x+A.width)<B.x) ||
				(A.x>(B.x+B.width)) ||
				(A.y>(B.y+B.height))||
				((A.y+A.height)<B.y)
			)

		return !!this.blocks.find(({props:{x,y,width,height}})=>isIntersect(rect,{x,y,width,height}))
	}

	exclusive(height,current){
		current=current||(({x=0,y=0,width})=>({x1:x,x2:x+width,y2:y+this.currentY}))(this.props);
		const x0=current.x1
		const lines=[current]
		if(height)
			lines.push({...current, y2:current.y2+height})
		
		return this.blocks.reduce((collected,{props:{wrap}})=>{
			lines.forEach(line=>collected.push(wrap(line)))
			return collected
		},[])
		.filter(a=>!!a)
		.sort((a,b)=>a.x-b.x)
		.reduce((all,{x,width},key)=>{
			all.push({key,pos:"start",x})
			all.push({key,pos:"end",x:x+width})
			return all
		},[])
		.sort((a,b)=>a.x-b.x)
		.reduce((state,a,i)=>{
			state[`${a.pos}s`].push(a)
			if(a.pos=="end"){
				if(state.ends.reduce((inclusive,end)=>inclusive && !!state.starts.find(start=>start.key==end.key),true)){
					let x0=state.starts[0].x
					let x1=a.x
					state.merged.push({x:x0, width:x1-x0})
					state.starts=[]
					state.ends=[]
				}
			}
			return state
		},{merged:[],starts:[], ends:[]})
		.merged
		.map(a=>(a.x-=x0,a))
	}

	appendComposed(content){
		this.computed.composed.push(content)
	}

	onAllChildrenComposed(){
		let composed=this.createComposed2Parent()
		this.context.parent.appendComposed(composed)

		super.onAllChildrenComposed()
	}

	createComposed2Parent() {
		let {width,height=this.currentY, x,y,z,named}=this.props
		return (
			<Group {...{width,height,x,y,z,named, className:"frame"}}>
				{this.computed.composed.reduce((state,a,i)=>{
					if(a.props.y==undefined){
						state.positioned.push(React.cloneElement(a,{y:state.y,key:i}))
						state.y+=a.props.height
					}else{
						state.positioned.push(React.cloneElement(a,{key:i}))
					}
					return state
				},{y:0,positioned:[]}).positioned}
			</Group>
		)
    }

	recompose(){
		throw new Error("not support yet")
	}

	replaceComposedWith(recomposed){
		throw new Error("not support yet")
	}

	next(){
		throw new Error("not support yet")
	}

	get availableHeight(){
		if(this.props.height==undefined)
			return Number.MAX_SAFE_INTEGER

		const {props:{height},computed:{composed:children}}=this
		return children.reduce((h, a)=>h-(a.props.y==undefined ? a.props.height : 0),height)
	}

	get currentY(){
		const {props:{height},computed:{composed:children}}=this
		return children.reduce((y, a)=>y+(a.props.y==undefined ? a.props.height : 0),0)
	}

	get blocks(){
		return this.computed.composed.filter(({props:{wrap}})=>!!wrap)
	}
	
	composed(id){
		return !!this.computed.composed.find(a=>a.props["data-content"]==id)
	}

	static Group=Group

	static Line=class extends Component{
		constructor({width,height,blocks=[],frame}){
			super(...arguments)
			this.content=[]
			this.blocks=blocks
			this.frame=frame
			Object.defineProperties(this,{
				height:{
					enumerable:true,
					configurable:true,
					get(){
						return this.content.reduce((h,{props:{height}})=>Math.max(h,height),0)
					}
				},
				children:{
					enumerable:true,
					configurable:true,
					get(){
						return this.content
					}
				},
				availableHeight:{
					enumerable:false,
					configurable:false,
					get(){
						return height
					}
				},
				availableWidth:{
					enumerable:false,
					configurable:false,
					get(){
						return width-this.currentX
					}
				},
				currentX:{
					enumerable:false,
					configurable:false,
					get(){
						return this.content.reduce((x,{props:{width,x:x0}})=>x0!=undefined ? x0+width : x+width,0)
					}
				},
				width:{
					enumerable:true,
					configurable:false,
					get(){
						return width
					}
				}

			})
		}

		appendComposed(atom,at){
			const {width,minWidth=width,anchor,height}=atom.props
			if(anchor && !this.frame.composed(anchor.props.id)){
				const {x,y}=anchor.xy(this)
				const dirty=this.frame.isDirtyIn({x,y,width,height})
				this.frame.appendComposed(React.cloneElement(atom,{x,y,anchor:undefined,wrap:anchor.wrap({x,y})}))
				if(dirty){
					const recomposed=this.frame.recompose()
					if(recomposed){
						this.frame.replaceComposedWith(recomposed)
						return recomposed.to
					}else{
						const next=this.frame.next()
						if(next){
							this.frame=next
							return this.appendComposed(...arguments)
						}
					}
				}

				const newBlocks=this.frame.exclusive(this.height)
				if(this.shouldRecompose(newBlocks)){
					const flowCount=(this.content.reduce((count,a)=>a.props.x==undefined ? count+1 : count,0))
					at=at-flowCount
					this.content=[]
					return at
				}else{

				}
			}else if(minWidth==0 || this.availableWidth>=minWidth){
				this.blocks=this.blocks.map((a,i)=>{
					if((this.currentX+minWidth)>a.x){
						this.content.push(<Group {...a} height={0}/>)
						this.blocks[i]=null
					}else{
						return a
					}
				}).filter(a=>!!a)

				this.content.push(atom)
			}else{
				return false
			}
		}

		shouldRecompose(newBlocks){
			const applied=this.content.filter(a=>a.props.x!==undefined)
			const notShould=applied.reduce((notShould,{props:{x,width}},i)=>notShould && !!(a=newBlocks[i]) && a.x==x && a.width==width, true)
			if(notShould){
				let notApplied=newBlocks.slice(applied.length)
				if(notApplied.slice(0,1).reduce((should,a)=>a.x<this.currentX,false)){
					this.blocks=newBlocks
					return true
				}else{
					this.bloks=notApplied
				}
				return false
			}else{
				this.blocks=newBlocks
				return true
			}
		}

		commit(){
			this.blocks.forEach(a=>this.content.push(<Group {...a} height={0}/>))
			this.blocks=[]
			return this
		}
	}
}
