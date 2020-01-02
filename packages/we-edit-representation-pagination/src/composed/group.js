import React, {Component, Children, Fragment} from "react"
import PropTypes from "prop-types"
import Text from "./text"

export default class Group extends Component{
	static propTypes={
		width: PropTypes.number,
		height: PropTypes.number,
		x:PropTypes.number,
		y:PropTypes.number,
		z:PropTypes.number,
	}

	static contextTypes={
		debug: PropTypes.bool
	}

    render(){
		let {
			innerRef, //for waypoint
			rotate,
			x=0,y=0,
			children,
			background,
			margin,minWidth, width, height, index, childIndex,geometry,baseline,
			contentWidth,wrap,pagination,anchor,blockOffset,named,descent,mergeOpportunity, spaceHeight,
			//className,id,
			I,
			...others}=this.props
		const props={}

		if(innerRef){
			props.ref=innerRef
		}

		let transform=""

		if(x||y){
			transform=`translate(${parseInt(x||0)} ${parseInt(y||0)})`
		}

		if(rotate){
			transform=`${transform} rotate(${rotate})`
		}

		if(transform.length>0){
			props.transform=transform
		}

		const content=[
			background&&background!="transparent"&& (<rect width={width} height={height} fill={background} key="background"/>),
			...Children.toArray(children).map((a,i)=>React.cloneElement(a,{key:i}))
		].filter(a=>a)

		if(this.context.debug){
			return (
				<g {...others} {...props}>
					{content}
				</g>
			)
		}

		const keys=Object.keys(props)
		if(keys.length==0){
			return <Fragment>{content}</Fragment>
		}else if(content.length==1 && keys.length==1 && keys[0]=="transform" && !rotate){
			const {props:{x:x1=0,y:y1=0},type}=content[0]	
			switch(type){
				case Text:
				case this.constructor:
					return React.cloneElement(content[0],{x:x1+x,y:y1+y})
			}
		}

		return (
			<g {...props}>
				{content}
			</g>
		)
    }
}
