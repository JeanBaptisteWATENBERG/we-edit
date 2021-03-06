import React,{Fragment} from "react"
import PropTypes from "prop-types"
import {dom} from "we-edit"
import memoize from "memoize-one"

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

	focusable=true

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
			.clone({edges:{
				page:{left:0,right:width,top:0,bottom:height},
				[this.getComposeType()]:{left:0,right:width,top:0,bottom:height},
			}})
	})

	getSpace(){
		return this.__getSpace(this.geometry)
	}

	/**
	 * there's no call super.createComposed2Parent, so editable interface is skipped
	 *** .positionlines is used to get lineXY(line), so it should be added
	 */
	recomposable_createComposed2Parent(){
		const {x,y,z}=this.props
		const content=(
			<Fragment>
				{[
					React.cloneElement(this.positionLines(this.lines),{key:"content",className:"positionlines"}),
					...this.anchors.map((a,i)=>React.cloneElement(a,{key:i})),
				].filter(a=>!!a).sort(({props:{z:z1=0}},{props:{z:z2=0}},)=>z1-z2)
				}
			</Fragment>
		)

		const composed=React.cloneElement(
			this.geometry.createComposedShape(content,{composedUUID:this.computed.composedUUID}),
			{className:"frame", "data-frame":this.uuid,x,y,z}
		)
		return composed
	}

	static custom=custom

	static rect=rect

	static ellipse=ellipse

	static circle=circle
}