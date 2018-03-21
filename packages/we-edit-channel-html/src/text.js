import React from "react"
import Base from "../text"

export default class Text extends Base{
	render(){
		const {fonts,size,color,bold,italic,vanish}=this.props
		return (
			<span>{this.props.children}</span>
		)
	}
}