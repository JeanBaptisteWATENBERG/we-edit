import React from "react"
import PropTypes from "prop-types"

import Component from "./component"

export default class extends Component{
	static displayName="section"
	static propTypes={
        create: PropTypes.func.isRequired,
		
		page:PropTypes.shape({
			width:PropTypes.number,
			height:PropTypes.number,
			margin:PropTypes.shape({
				left:PropTypes.number,
				right:PropTypes.number,
				top:PropTypes.number,
				bottom:PropTypes.number,
				header:PropTypes.number,
				footer:PropTypes.number,
			}),
			cols:PropTypes.arrayOf(PropTypes.shape({
				x:PropTypes.number,
				width:PropTypes.number,
			}))
		})
	}
}