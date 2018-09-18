import React, {Component} from "react"
import PropTypes from "prop-types"

import Group from "./group"
import Line from "./line"

export default class Page extends Component{
	static propTypes={
		columns: PropTypes.arrayOf(PropTypes.object).isRequired,
		size: PropTypes.object.isRequired,
		margin: PropTypes.object,
		header: PropTypes.element,
		footer: PropTypes.element,
		i: PropTypes.number.isRequired,
	}

	render(){
		let {
			size:{width, height},
			margin:{left,top, right,bottom, header:headerStartAt=0, footer:footerEndAt=0},
			columns,
			header,
			footer,
			...props
			}=this.props

		return(
			<g className="page" width={width} height={height} {...props}>
				{header &&
					<Group
						x={left} y={headerStartAt}
						className="header">
						{header}
					</Group>
				}

				<Group
					x={left} y={top}
					className="content">
					{columns.map((a,i)=><Group key={i} className="column" {...a}/>)}
				</Group>

				{footer &&
					<Group
						x={left}
						y={height-footerEndAt-footer.props.height}
						className="footer">
						{footer}
					</Group>
				}

			</g>
		)
	}
}
