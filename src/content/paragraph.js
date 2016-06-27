import React, {Component, PropTypes} from "react"
import Any from "./any"
import Group from "../compose/group"
import Line from "../compose/line"

export default class Paragraph extends Any{
	render(){
		const {id,index,append}=this.state
		if(!append)
			return super.render()
			
		const {children, ...others}=this.props
		
		return (
			<Group {...others}>
				{children.map((a,i)=>{
					if(id==i){
						let {children:text}=a.props
						return React.cloneElement(a,{key:i, children: text.splice(index,0,append)})
					}else{
						return React.cloneElement(a,{key:i})	
					}
				})}
			</Group>
		)
	}
    compose(){
        const {composed}=this.state
        const {parent}=this.context
        const {width,height}=parent.nextAvailableSpace()
		this.maxSize={width,height}
        composed.push(this._newLine())
    }
	
	_newLine(){
		return {
            width: this.maxSize.width,
			height:0,
            children:[]
        }
	}

    nextAvailableSpace(required={}){
        const {width:minRequiredW=0,height:minRequiredH=0}=required
        const {composed}=this.state
        let currentLine=composed[composed.length-1]
        let {width}=currentLine
        let availableWidth=currentLine.children.reduce((prev,a)=>prev-a.props.width,width)
        if(availableWidth<=minRequiredW){
			if(this.maxSize.height>minRequiredH){
				return this.maxSize
			}else{
				return this.maxSize=this.context.parent.nextAvailableSpace(required)
			}
        }
        return {width:availableWidth, height:this.maxSize.height}
    }

    appendComposed(text){
        const {composed}=this.state
        const {parent}=this.context
		
		let currentLine=composed[composed.length-1]
        let availableWidth=currentLine.children.reduce((prev,a)=>prev-a.props.width,currentLine.width)
        let {width:contentWidth, height:contentHeight}=text.props
        
		
		let piece=null
        if(availableWidth>=contentWidth){//not appended to parent
            piece=(<Group x={currentLine.width-availableWidth} width={contentWidth} height={contentHeight}>{text}</Group>)
            currentLine.children.push(piece)
			currentLine.height=Math.max(currentLine.height,contentHeight)
			if(availableWidth==contentWidth){
				parent.appendComposed(<Line {...currentLine}/>)
				this.maxSize.height-=currentLine.height
			}
		}else if(availableWidth<contentWidth){
			if(this.maxSize.height>=contentHeight){
				composed.push(this._newLine())
				if(contentWidth<=this.maxSize.width)
					this.appendComposed(text)
				else{
					//never be here
				}
			}else{
				
			}
		}
    }
	
	finished(){//need append last non-full-width line to parent
		const {composed}=this.state
        const {parent}=this.context
		
		let currentLine=composed[composed.length-1]
        let availableWidth=currentLine.children.reduce((prev,a)=>prev-a.props.width,currentLine.width)
		if(availableWidth>0){
			parent.appendComposed(<Line {...currentLine}/>)
		}
		if(super.finished()){
			this.maxSize={width:0, height:0}
			return true
		}
		
		return false;
	}
}
