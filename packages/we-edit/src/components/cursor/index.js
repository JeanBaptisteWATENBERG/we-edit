import React, {Component,Fragment} from "react"
import {createPortal} from "react-dom"
import PropTypes from "prop-types"

import Flash from "./flash"
import Input from "./input"

export default class Cursor extends Component{
	static propTypes={
		editable:PropTypes.bool
	}

	input=React.createRef()
	render(){
		const {children, ...props}=this.props
		return (
			<Fragment>
				{createPortal(
					<Input {...props}
						inputRef={this.input}
						height={children ? 1 : props.height}
						/>,
					document.body
				)}
				{children && <Flash input={this.input}>{React.cloneElement(children, props)}</Flash>}
			</Fragment>
		)
	}
}
