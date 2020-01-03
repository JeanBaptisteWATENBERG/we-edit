import React,{Fragment} from "react"
import PropTypes from "prop-types"
import {dom} from "we-edit"
import memoize from "memoize-one"

import {Group} from "../../composed"
import {HasParentAndChild,editable,Layout} from "../../composable"

import Frame from "../frame"


import {custom, rect, ellipse, circle} from "./shapes"

const Super=editable(HasParentAndChild(dom.Shape))
export default class Shape extends Frame{
	static displayName=Super.displayName
	static propTypes=Super.propTypes
	static defaultProps=Super.defaultProps
	static contextTypes={
		...Frame.contextTypes,
		editable: PropTypes.any,
	}

	__getGeometry=memoize(composedUUID=>{
		const {geometry="rect"}=this.props
		const Geometry=this.constructor[geometry]||this.constructor.custom
		return new Geometry(this.props, this.context)
	})

	get geometry(){
		return this.__getGeometry(this.computed.composedUUID)
	}

	__getSpace=memoize(geometry=>{
		const {width,height}=geometry.availableSpace()
		return Layout.ConstraintSpace.create({width,height})
	})

	getSpace(){
		return this.__getSpace(this.geometry)
	}

	createComposed2Parent(){
		const content=(
			<Fragment>
				{[
					React.cloneElement(this.positionLines(this.lines),{key:"content"}),
					...this.anchors.map((a,i)=>React.cloneElement(a,{key:i})),
				].filter(a=>!!a).sort(({props:{z:z1=0}},{props:{z:z2=0}},)=>z1-z2)
				}
			</Fragment>
		)
		const transformed=this.transform(this.geometry.createComposedShape(content))
		return React.cloneElement(transformed,{className:"frame", "data-frame":this.uuid})
	}

	transform(shape, path=shape.props.geometry, strokeWidth=this.geometry.strokeWidth){
		var {rotate, scale}=this.props
		const translate={}
		if(rotate){
			const {x,y}=path.center()
			const a=path.bounds()

			path.rotate(rotate, x, y)
			rotate=`${rotate} ${x} ${y}`

			const b=path.bounds()
			translate.x=parseInt(a.left-b.left)
			translate.y=parseInt(a.top-b.top)
			path.translate(translate.x, translate.y)
			path.origin={x:translate.x,y:translate.y}
		}

		if(scale){
			path.scale(scale)
		}

		path.strokeWidth=strokeWidth
		const {width,height}=path.size(strokeWidth)
		return (
			<Group {...{width,height, geometry:path}}>
				<Group {...{scale, rotate, ...translate}}>
					{shape}
				</Group>
			</Group>
		)
	}

	static custom=custom

	static rect=rect

	static ellipse=ellipse

	static circle=circle
}