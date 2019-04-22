import React,{Component} from "react"
import {Group} from "../../composed"

import Path from "../../tool/path"

export class custom extends Component{
	get strokeWidth(){
		const {outline:{width=0}={}}=this.props
		return width||0
	}

	get contentBox(){
		const {margin:{right=0,left=0,top=0,bottom=0}}=this.props
		const {width,height}=this.getPath().size()
		const strokeWidth=this.strokeWidth
		return {width:width-strokeWidth/2-right-left,height:height-strokeWidth/2-top-bottom}
	}

	get outlineBox(){
		return this.getPath().size(this.strokeWidth)
	}

	availableSpace(){
		return this.contentBox
	}

	createComposedShape(content){
		const {
				margin:{left=0,top=0},
				solidFill="transparent",blipFill:{url}={},
				outline={width:0},
				fill={fill:solidFill}
			}=this.props

		const children=[]
		children.push(
			<Group x={this.strokeWidth/2} y={this.strokeWidth/2} key="outline">
				<path d={this.getPath().toString()}
					style={{
						strokeWidth:this.strokeWidth,
						stroke:outline.solidFill,
						...fill
					}}
					/>
			</Group>
		)

		if(url){
			children.push(
				<Group x={this.strokeWidth+left} y={this.strokeWidth+top} key="background">
					<image {...{...this.contentBox,xlinkHref: url, preserveAspectRatio:"none"}} />
				</Group>
			)
		}

		if(content){
			children.push(
				<Group key="content" x={this.strokeWidth+left} y={this.strokeWidth+top}>
					{content}
				</Group>
			)
		}

		return (
			<Group {...this.outlineBox} geometry={this.getPath().clone()}>
				{children}
			</Group>
		)
	}

	getPath(){
		return new Path(this.props.geometry)
	}
}

export class rect extends custom{
	getPath(){
		const {width:w,height:h}=this.props
		return new Path(`M0 0h${w}v${h}h${-w}z`)
	}
}

export class ellipse extends custom{
	createComposedShape(content){
		const {
				width,height,margin,solidFill="none",
				outline={strokeWidth:1,stroke:"black"},
				fill={fill:solidFill}
			}=this.props
		const composed=super.createComposedShape(...argument)
		composed.splice(0,1,
			<ellipse key="shape"
			cx={width/2} cy={height/2}
			rx={width/2} ry={height/2}
			style={{...outline, ...fill}} />)
		return composed
	}
}

export class circle extends ellipse{

}
