import React from "react"
import PropTypes from "prop-types"


import composable,{HasParentAndChild} from "./composable"
import {models} from "we-edit"
const {Frame:Base}=models

import {Frame as ComposedFrame, Group} from "./composed"

const Super=composable(HasParentAndChild(Base),{locatable:true, recomposable:true})

export default class Frame extends Super{
	static contextTypes={
		...Super.contextTypes,
		currentPage: PropTypes.func
	}
	nextAvailableSpace(required={}){
		const {width:maxWidth,height:maxHeight}=this.props
		const {width:minRequiredW=0,height:minRequiredH=0}=required
		const space={width:maxWidth,height:this.availableHeight}
		const blocks=this.page.anchors
		if(blocks.length>0){
			const {x0,y0}=(()=>{
				const {margin:{left,top}}=this.page
				const {x, y}=this.props
				return {x0:left+x,y0:top+y}
			})
			space.blocks=blocks
				.map(a=>new ComposedFrame(a.props).intersects({
					x1:x0,
					x2:x0+maxWidth,
					y2:y0+this.currentY
				}))
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
				.map(a=>({x:a.x-x0, ...a}))
		}

		return space
	}

	appendComposed(content){
		if(content.props.anchor){
			return content.props.anchor.appendTo(this, React.cloneElement(content,{anchor:undefined}))
		}else{
			this.computed.composed.push(content)
		}
	}

	onAllChildrenComposed(){
		let composed=this.createComposed2Parent()
		this.context.parent.appendComposed(composed)

		super.onAllChildrenComposed()
	}

	createComposed2Parent() {
		let {width,height,wrap,margin, x,y,z,geometry}=this.props
		return (
			<ComposedFrame {...{width,height,wrap,margin,x,y,z,geometry}}>
				{this.computed.composed.reduce((state,a,i)=>{
					if(a.props.y==undefined){
						state.positioned.push(React.cloneElement(a,{y:state.y,key:i}))
						state.y+=a.props.height
					}else{
						state.positioned.push(React.cloneElement(a,{key:i}))
					}
					return state
				},{y:0,positioned:[]}).positioned}
			</ComposedFrame>
		)
    }

	get availableHeight(){
		const {props:{height},computed:{composed:children}}=this
		return children.reduce((h, a)=>h-(a.props.y==undefined ? a.props.height : 0),height)
	}

	get currentY(){
		const {props:{height},computed:{composed:children}}=this
		return children.reduce((y, a)=>y+(a.props.y==undefined ? a.props.height : 0),0)
	}

	get blocks(){
		return this.computed.composed.filter(({props:{x,y}})=>x!=undefined || y!=undefined)
	}

	get page(){
		return this.context.currentPage()
	}
}
