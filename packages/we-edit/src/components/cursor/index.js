import React, {Component,Fragment} from "react"
import {createPortal} from "react-dom"
import PropTypes from "prop-types"

import Flash from "./flash"
import Input from "./input"

export default class Cursor extends Component{
	render(){
		const {active,children,editable, ...props}=this.props

		return (
			<g>
				{createPortal(
					<Input {...props}
						height={children ? 1 : props.height}
						editable={editable}/>,document.body)
				}
				{children && <Flash children={React.cloneElement(children, props)}/>}
			</g>
		)
	}
}
