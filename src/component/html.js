import react, {Component} from "react"
import PropTypes from "prop-types"

import models from "html"
import edits from "html/edit"

export class Html extends Component{
	static displayName="html"
	static propTypes={
		domain: PropTypes.func
	}
	
	static defaultProps={
		domain(type){
			switch(type){
			case "editor":
				return edits
			default:
				return models
			}
		}
	}
}

export default Html